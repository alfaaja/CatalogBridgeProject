import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getDraft: vi.fn(),
  getEvidence: vi.fn(),
  getProduct: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/supabase/product-review-repository", () => ({
  getProductReview: mocks.getProduct,
}));
vi.mock("@/lib/supabase/shopee-draft-repository", () => ({
  getShopeeDraft: mocks.getDraft,
}));
vi.mock("@/lib/supabase/process-log-repository", () => ({
  getShopeeHandoffEvidence: mocks.getEvidence,
}));

import { loadCurrentShopeeHandoff } from "./shopee-handoff-service";

const productId = "11111111-1111-4111-8111-111111111111";
const product = {
  attributes: {},
  brand: "JEP",
  createdAt: "2026-09-05T00:00:00.000Z",
  description: "Description",
  dimensionsCm: { height: null, length: null, width: null },
  failure: null,
  gtin: null,
  id: productId,
  images: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      isPrimary: true,
      kind: "product",
      position: 0,
      sourceUrl: "https://static.jakmall.id/image.jpg",
    },
  ],
  logs: [],
  rawSourceData: {},
  sellingPrice: null,
  sku: null,
  source: {
    canonicalUrl: "https://www.jakmall.com/jep/product",
    category: "Source",
    platform: "jakmall",
    price: 64_600,
    productIdentifier: "source",
  },
  status: "READY",
  stock: null,
  title: "JEP Product",
  updatedAt: "2026-09-05T09:00:00.000Z",
  variantAxes: [],
  variants: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      imageSourceUrl: null,
      optionValues: {},
      position: 0,
      productId,
      sellingPrice: 79_900,
      sku: "OMHA5ISV",
      sourcePrice: 64_600,
      sourceVariantIdentifier: "offer",
      stock: 5,
      updatedAt: "2026-09-05T08:00:00.000Z",
    },
  ],
  weightGrams: 250,
} as const;
const draft = {
  categoryAttributes: [{ name: "Material", value: "Stainless Steel" }],
  categoryAttributesReviewed: true,
  categoryConfirmed: true,
  categoryId: null,
  categoryPath: "Home > Kitchen",
  condition: "NEW",
  createdAt: "2026-09-05T07:00:00.000Z",
  dangerousProduct: "NO",
  descriptionOverride: null,
  preorder: "NO",
  productId,
  titleOverride: null,
  updatedAt: "2026-09-05T08:30:00.000Z",
} as const;

describe("current Shopee handoff service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { is_anonymous: false, sub: "reviewer" } },
          error: null,
        }),
      },
    });
    mocks.getProduct.mockResolvedValue({ ok: true, product });
    mocks.getDraft.mockResolvedValue({ draft, ok: true });
    mocks.getEvidence.mockResolvedValue({
      evidence: { prepared: false, reviewerConfirmed: false },
      ok: true,
    });
  });

  it("authenticates before loading any product, draft, or evidence", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    });

    await expect(loadCurrentShopeeHandoff(productId)).resolves.toEqual({
      error: "AUTH_REQUIRED",
      ok: false,
    });
    expect(mocks.getProduct).not.toHaveBeenCalled();
    expect(mocks.getDraft).not.toHaveBeenCalled();
    expect(mocks.getEvidence).not.toHaveBeenCalled();
  });

  it("reloads current owned state and derives the JEP manifest and evidence lookup", async () => {
    const result = await loadCurrentShopeeHandoff(productId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.manifest.offer).toMatchObject({
      mode: "BASE_LISTING",
      sellingPriceIdr: 79_900,
      sku: "OMHA5ISV",
      sourceMode: "BASE_VARIANT",
      stock: 5,
    });
    expect(mocks.getProduct).toHaveBeenCalledWith(productId);
    expect(mocks.getDraft).toHaveBeenCalledWith(productId);
    expect(mocks.getEvidence).toHaveBeenCalledWith(
      productId,
      result.manifest.snapshotFingerprint,
    );
  });

  it("does not query evidence for a non-READY or blocked product", async () => {
    mocks.getProduct.mockResolvedValueOnce({
      ok: true,
      product: { ...product, status: "REVIEW_REQUIRED" },
    });
    await expect(loadCurrentShopeeHandoff(productId)).resolves.toEqual({
      error: "PRODUCT_NOT_READY",
      ok: false,
    });
    expect(mocks.getEvidence).not.toHaveBeenCalled();

    mocks.getProduct.mockResolvedValueOnce({
      ok: true,
      product: { ...product, weightGrams: 0 },
    });
    await expect(loadCurrentShopeeHandoff(productId)).resolves.toEqual({
      error: "HANDOFF_BLOCKED",
      ok: false,
    });
    expect(mocks.getEvidence).not.toHaveBeenCalled();
  });

  it("uses the new READY epoch so old evidence cannot reactivate", async () => {
    const initial = await loadCurrentShopeeHandoff(productId);
    expect(initial.ok).toBe(true);
    if (!initial.ok) return;

    mocks.getProduct.mockResolvedValueOnce({
      ok: true,
      product: { ...product, updatedAt: "2026-09-05T12:00:00.000Z" },
    });
    const rereadied = await loadCurrentShopeeHandoff(productId);
    expect(rereadied.ok).toBe(true);
    if (!rereadied.ok) return;

    expect(rereadied.manifest.snapshotFingerprint).not.toBe(
      initial.manifest.snapshotFingerprint,
    );
    expect(mocks.getEvidence).toHaveBeenLastCalledWith(
      productId,
      rereadied.manifest.snapshotFingerprint,
    );
    expect(rereadied.evidence).toEqual({
      prepared: false,
      reviewerConfirmed: false,
    });
  });

  it("keeps an RLS-hidden product unavailable", async () => {
    mocks.getProduct.mockResolvedValue({
      error: "PRODUCT_NOT_FOUND",
      ok: false,
    });
    await expect(loadCurrentShopeeHandoff(productId)).resolves.toEqual({
      error: "PRODUCT_NOT_FOUND",
      ok: false,
    });
    expect(mocks.getEvidence).not.toHaveBeenCalled();
  });
});
