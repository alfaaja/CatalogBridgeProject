import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  appendLog: vi.fn(),
  createJob: vi.fn(),
  loadHandoff: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/shopee-handoff-service", () => ({
  loadCurrentShopeeHandoff: mocks.loadHandoff,
}));
vi.mock("@/lib/supabase/shopee-upload-job-repository", () => ({
  createOrGetCurrentShopeeUploadJob: mocks.createJob,
}));
vi.mock("@/lib/supabase/process-log-repository", () => ({
  appendProcessLog: mocks.appendLog,
}));

import { queueShopeeUploadAction } from "./auto-send-actions";

const productId = "11111111-1111-4111-8111-111111111111";
const fingerprint = "a".repeat(64);
const now = "2026-09-07T00:00:00.000Z";
const handoff = {
  attributes: [],
  brand: "RUMAUMA",
  category: { id: null, path: "Home > Drinkware" },
  declarations: { condition: "NEW", dangerousProduct: "NO", preorder: "NO" },
  description: "Reviewed description",
  externalChecks: {
    notes: [],
    shippingServices: "SELLER_CENTRE_REQUIRED",
    unsupported: [],
  },
  generatedAt: now,
  images: [
    { isPrimary: true, position: 0, url: "https://static.jakmall.id/a.jpg" },
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
  schemaVersion: 1,
  snapshotFingerprint: fingerprint,
  title: "Glass Bottle",
} as const;
const product = {
  gtin: null,
  id: productId,
  status: "READY",
  updatedAt: now,
};

describe("Auto Send server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadHandoff.mockResolvedValue({
      evidence: { prepared: false, reviewerConfirmed: false },
      manifest: handoff,
      ok: true,
      product,
    });
    mocks.createJob.mockResolvedValue({
      created: true,
      job: { id: "22222222-2222-4222-8222-222222222222", status: "QUEUED" },
      ok: true,
    });
    mocks.appendLog.mockResolvedValue({ ok: true });
  });

  it("reloads persisted READY data and ignores all caller listing fields", async () => {
    const forged = new FormData();
    forged.set("title", "FORGED");
    forged.set("owner_id", "attacker");
    forged.set("manifest", JSON.stringify({ status: "SAVED_ARCHIVED" }));

    const result = await queueShopeeUploadAction(productId, {}, forged);

    expect(result).toMatchObject({ status: "success" });
    expect(mocks.loadHandoff).toHaveBeenCalledWith(productId);
    expect(mocks.createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        productId,
        snapshotFingerprint: fingerprint,
        title: handoff.title,
      }),
    );
    expect(JSON.stringify(mocks.createJob.mock.calls[0])).not.toContain(
      "FORGED",
    );
  });

  it.each([
    "AUTH_REQUIRED",
    "PRODUCT_NOT_READY",
    "HANDOFF_BLOCKED",
    "HANDOFF_UNAVAILABLE",
  ] as const)(
    "does not create a job when reload fails with %s",
    async (error) => {
      mocks.loadHandoff.mockResolvedValue({ error, ok: false });

      const result = await queueShopeeUploadAction(
        productId,
        {},
        new FormData(),
      );

      expect(result.status).toBe("error");
      expect(mocks.createJob).not.toHaveBeenCalled();
      expect(mocks.appendLog).not.toHaveBeenCalled();
    },
  );

  it("reuses an idempotent job and does not duplicate queue evidence", async () => {
    mocks.createJob.mockResolvedValue({
      created: false,
      job: { id: "22222222-2222-4222-8222-222222222222", status: "RUNNING" },
      ok: true,
    });

    await expect(
      queueShopeeUploadAction(productId, {}, new FormData()),
    ).resolves.toMatchObject({ status: "neutral" });
    expect(mocks.appendLog).not.toHaveBeenCalled();
  });

  it("logs only fixed safe queue evidence after a successful insert", async () => {
    await queueShopeeUploadAction(productId, {}, new FormData());

    expect(mocks.appendLog).toHaveBeenCalledWith({
      details: {
        event: "SHOPEE_AUTOMATION_QUEUED",
        jobId: "22222222-2222-4222-8222-222222222222",
        method: "LOCAL_SHOPEE_RUNNER",
        schemaVersion: 1,
        snapshotFingerprint: fingerprint,
      },
      message: "Shopee automation queued.",
      productId,
      stage: "shopee_automation",
      status: "started",
    });
  });

  it("returns a warning when the immutable job exists but activity logging fails", async () => {
    mocks.appendLog.mockResolvedValue({
      error: "DATABASE_WRITE_FAILED",
      ok: false,
    });

    await expect(
      queueShopeeUploadAction(productId, {}, new FormData()),
    ).resolves.toMatchObject({ status: "warning" });
  });
});
