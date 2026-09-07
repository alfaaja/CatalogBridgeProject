import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));
vi.mock("./server", () => ({ createClient: createClientMock }));

import type { ShopeeUploadManifest } from "../shopee-upload-manifest";
import {
  createOrGetCurrentShopeeUploadJob,
  getShopeeUploadJobForSnapshot,
} from "./shopee-upload-job-repository";

const productId = "11111111-1111-4111-8111-111111111111";
const fingerprint = "a".repeat(64);
const now = "2026-09-07T00:00:00.000Z";
const manifest: ShopeeUploadManifest = {
  attributes: [],
  brand: "RUMAUMA",
  category: { id: null, path: "Home > Drinkware" },
  declarations: { condition: "NEW", dangerousProduct: "NO", preorder: "NO" },
  description: "Reviewed product description",
  externalChecks: {
    notes: [],
    shippingServices: "SELLER_CENTRE_REQUIRED",
    unsupported: [],
  },
  generatedAt: now,
  gtin: { mode: "NOT_AVAILABLE" },
  images: [
    {
      isPrimary: true,
      position: 0,
      url: "https://static.jakmall.id/product.jpg",
    },
  ],
  offer: {
    mode: "BASE_LISTING",
    sellingPriceIdr: 35_000,
    sku: "SKU-1",
    sourceMode: "BASE_VARIANT",
    stock: 5,
  },
  physical: {
    dimensionsCm: { height: null, length: null, width: null },
    weightGrams: 380,
  },
  productId,
  readyRevision: now,
  schemaVersion: 1,
  snapshotFingerprint: fingerprint,
  title: "Glass Water Bottle",
};

const row = {
  created_at: now,
  finished_at: null,
  id: "22222222-2222-4222-8222-222222222222",
  manifest,
  manifest_fingerprint: fingerprint,
  owner_id: "33333333-3333-4333-8333-333333333333",
  product_id: productId,
  ready_revision: now,
  safe_error_code: null,
  safe_message: null,
  seller_product_reference: null,
  started_at: null,
  status: "QUEUED",
  updated_at: now,
};

function existingQuery(result: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const limit = vi.fn(() => ({ maybeSingle }));
  const order = vi.fn(() => ({ limit }));
  const fingerprintEq = vi.fn(() => ({ order }));
  const productEq = vi.fn(() => ({ eq: fingerprintEq }));
  const select = vi.fn(() => ({ eq: productEq }));
  return { maybeSingle, select };
}

describe("Shopee upload job repository", () => {
  beforeEach(() => createClientMock.mockReset());

  it("reads only explicit columns and validates the manifest snapshot", async () => {
    const query = existingQuery({ data: row, error: null });
    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({ select: query.select })),
    });

    await expect(
      getShopeeUploadJobForSnapshot(productId, fingerprint),
    ).resolves.toMatchObject({
      job: { id: row.id, status: "QUEUED" },
      ok: true,
    });
    expect(query.select).toHaveBeenCalledWith(
      "id,product_id,owner_id,manifest_fingerprint,ready_revision,manifest,status,created_at,started_at,finished_at,updated_at,safe_error_code,safe_message,seller_product_reference",
    );
  });

  it("rejects malformed persisted rows and caller input", async () => {
    const query = existingQuery({
      data: { ...row, status: "PUBLISHED" },
      error: null,
    });
    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({ select: query.select })),
    });

    await expect(
      getShopeeUploadJobForSnapshot(productId, fingerprint),
    ).resolves.toEqual({ error: "DATABASE_READ_FAILED", ok: false });
    await expect(
      getShopeeUploadJobForSnapshot("not-a-uuid", fingerprint),
    ).resolves.toEqual({ error: "INVALID_JOB_INPUT", ok: false });
  });

  it("reuses an existing current-snapshot job without inserting", async () => {
    const query = existingQuery({ data: row, error: null });
    const insert = vi.fn();
    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({ insert, select: query.select })),
    });

    await expect(createOrGetCurrentShopeeUploadJob(manifest)).resolves.toEqual({
      created: false,
      job: expect.objectContaining({ id: row.id }),
      ok: true,
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts only server-derived snapshot columns and never owner or status", async () => {
    const existing = existingQuery({ data: null, error: null });
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const insertSelect = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select: insertSelect }));
    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({ insert, select: existing.select })),
    });

    await expect(createOrGetCurrentShopeeUploadJob(manifest)).resolves.toEqual({
      created: true,
      job: expect.objectContaining({ status: "QUEUED" }),
      ok: true,
    });
    expect(insert).toHaveBeenCalledWith({
      manifest: expect.any(Object),
      manifest_fingerprint: fingerprint,
      product_id: productId,
      ready_revision: now,
    });
  });

  it("returns safe failures for database errors and malformed manifests", async () => {
    const existing = existingQuery({ data: null, error: { code: "XX000" } });
    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({ select: existing.select })),
    });

    await expect(createOrGetCurrentShopeeUploadJob(manifest)).resolves.toEqual({
      error: "DATABASE_WRITE_FAILED",
      ok: false,
    });
    await expect(
      createOrGetCurrentShopeeUploadJob({ ...manifest, title: "" }),
    ).resolves.toEqual({ error: "INVALID_JOB_INPUT", ok: false });
  });
});
