import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  appendLog: vi.fn(),
  loadHandoff: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/shopee-handoff-service", () => ({
  loadCurrentShopeeHandoff: mocks.loadHandoff,
}));
vi.mock("@/lib/supabase/process-log-repository", () => ({
  appendProcessLog: mocks.appendLog,
}));

import {
  confirmSellerCentreHandoffAction,
  prepareShopeeHandoffAction,
} from "./actions";

const productId = "11111111-1111-4111-8111-111111111111";
const manifest = {
  attributes: [{ name: "Material", value: "Stainless Steel" }],
  brand: "JEP",
  category: { id: null, path: "Home > Kitchen" },
  declarations: {
    condition: "NEW",
    dangerousProduct: "NO",
    preorder: "NO",
  },
  description: "Description",
  externalChecks: {
    notes: ["Shipping must be checked."],
    shippingServices: "SELLER_CENTRE_REQUIRED",
    unsupported: [],
  },
  generatedAt: "2026-09-05T10:00:00.000Z",
  images: [
    {
      isPrimary: true,
      position: 0,
      url: "https://static.jakmall.id/image.jpg",
    },
  ],
  offer: {
    mode: "BASE_LISTING",
    sellingPriceIdr: 79_900,
    sku: "OMHA5ISV",
    sourceMode: "BASE_VARIANT",
    stock: 5,
  },
  physical: {
    dimensionsCm: { height: null, length: null, width: null },
    weightGrams: 250,
  },
  productId,
  schemaVersion: 1,
  snapshotFingerprint: "a".repeat(64),
  title: "JEP Product",
} as const;

function confirmationForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("valuesTransferred", "true");
  formData.set("nonPublishingSaveRetained", "true");
  formData.set("shippingChecksCompleted", "true");
  for (const [name, value] of Object.entries(overrides)) {
    formData.set(name, value);
  }
  return formData;
}

describe("Shopee guided handoff actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadHandoff.mockResolvedValue({
      evidence: { prepared: false, reviewerConfirmed: false },
      manifest,
      ok: true,
    });
    mocks.appendLog.mockResolvedValue({ ok: true });
  });

  it("logs preparation only after a current package is successfully built", async () => {
    const result = await prepareShopeeHandoffAction(
      productId,
      {},
      new FormData(),
    );

    expect(result).toMatchObject({ status: "success" });
    expect(mocks.loadHandoff).toHaveBeenCalledWith(productId);
    expect(mocks.appendLog).toHaveBeenCalledWith({
      details: {
        attributeCount: 1,
        event: "HANDOFF_PREPARED",
        imageCount: 1,
        method: "GUIDED_MANUAL",
        offerMode: "BASE_LISTING",
        schemaVersion: 1,
        snapshotFingerprint: "a".repeat(64),
      },
      message: "Handoff package prepared.",
      productId,
      stage: "shopee_handoff",
      status: "success",
    });
  });

  it("reuses existing current preparation without duplicate log spam", async () => {
    mocks.loadHandoff.mockResolvedValue({
      evidence: { prepared: true, reviewerConfirmed: false },
      manifest,
      ok: true,
    });

    const result = await prepareShopeeHandoffAction(
      productId,
      {},
      new FormData(),
    );
    expect(result).toMatchObject({ status: "neutral" });
    expect(mocks.appendLog).not.toHaveBeenCalled();
  });

  it("rejects client readiness or fingerprint fields instead of trusting them", async () => {
    const forged = new FormData();
    forged.set("isReady", "true");
    forged.set("snapshotFingerprint", "client-value");

    const result = await prepareShopeeHandoffAction(productId, {}, forged);
    expect(result).toMatchObject({ status: "error" });
    expect(mocks.loadHandoff).toHaveBeenCalledWith(productId);
    expect(mocks.appendLog).not.toHaveBeenCalled();
  });

  it("requires all three structured attestations after current-state reload", async () => {
    mocks.loadHandoff.mockResolvedValue({
      evidence: { prepared: true, reviewerConfirmed: false },
      manifest,
      ok: true,
    });
    const incomplete = confirmationForm({ shippingChecksCompleted: "false" });

    const result = await confirmSellerCentreHandoffAction(
      productId,
      {},
      incomplete,
    );
    expect(result).toMatchObject({ status: "error" });
    expect(mocks.loadHandoff).toHaveBeenCalledWith(productId);
    expect(mocks.appendLog).not.toHaveBeenCalled();
  });

  it("requires a prepared event for the current server-derived fingerprint", async () => {
    const result = await confirmSellerCentreHandoffAction(
      productId,
      {},
      confirmationForm(),
    );
    expect(result).toMatchObject({ status: "error" });
    expect(mocks.appendLog).not.toHaveBeenCalled();
  });

  it("records only safe derived confirmation evidence", async () => {
    mocks.loadHandoff.mockResolvedValue({
      evidence: { prepared: true, reviewerConfirmed: false },
      manifest,
      ok: true,
    });

    const result = await confirmSellerCentreHandoffAction(
      productId,
      {},
      confirmationForm(),
    );
    expect(result).toMatchObject({ status: "success" });
    expect(mocks.appendLog).toHaveBeenCalledWith({
      details: {
        event: "SELLER_CENTRE_REVIEWER_CONFIRMED",
        evidenceBasis: "REVIEWER_ATTESTATION",
        method: "GUIDED_MANUAL",
        schemaVersion: 1,
        sellerAction: "NON_PUBLISHING_SAVE",
        snapshotFingerprint: "a".repeat(64),
      },
      message: "Manual Seller Centre handoff confirmed.",
      productId,
      stage: "shopee_handoff",
      status: "success",
    });
    const logged = JSON.stringify(mocks.appendLog.mock.calls[0]?.[0]);
    expect(logged).not.toContain("JEP Product");
    expect(logged).not.toContain("OMHA5ISV");
    expect(logged).not.toContain("79900");
    expect(logged).not.toContain("static.jakmall.id");
  });

  it("does not duplicate an existing confirmation for the current snapshot", async () => {
    mocks.loadHandoff.mockResolvedValue({
      evidence: { prepared: true, reviewerConfirmed: true },
      manifest,
      ok: true,
    });

    const result = await confirmSellerCentreHandoffAction(
      productId,
      {},
      confirmationForm(),
    );
    expect(result).toMatchObject({ status: "neutral" });
    expect(mocks.appendLog).not.toHaveBeenCalled();
  });

  it("does not log when current persisted state is no longer READY", async () => {
    mocks.loadHandoff.mockResolvedValue({
      error: "PRODUCT_NOT_READY",
      ok: false,
    });

    const result = await confirmSellerCentreHandoffAction(
      productId,
      {},
      confirmationForm(),
    );
    expect(result).toMatchObject({ status: "error" });
    expect(mocks.appendLog).not.toHaveBeenCalled();
  });
});
