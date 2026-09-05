import { describe, expect, it } from "vitest";

import type { ProductReview } from "./product-review";
import {
  buildShopeeHandoffManifest,
  formatShopeeHandoffSummary,
} from "./shopee-handoff";
import { buildShopeePreview, type ShopeeDraft } from "./shopee-draft";

const productId = "11111111-1111-4111-8111-111111111111";

function jepProduct(overrides: Partial<ProductReview> = {}): ProductReview {
  return {
    attributes: {},
    brand: "JEP",
    createdAt: "2026-09-05T00:00:00.000Z",
    description: "Stainless steel product description",
    dimensionsCm: { height: 8, length: 20, width: 10 },
    failure: null,
    gtin: null,
    id: productId,
    images: [
      {
        id: "33333333-3333-4333-8333-333333333333",
        isPrimary: true,
        kind: "product",
        position: 0,
        sourceUrl: "https://static.jakmall.id/jep.jpg",
      },
    ],
    logs: [
      {
        createdAt: "2026-09-05T00:00:00.000Z",
        details: { parserDiagnostic: "must not leak" },
        id: "44444444-4444-4444-8444-444444444444",
        message: "Imported",
        stage: "import",
        status: "success",
      },
    ],
    rawSourceData: { html: "<secret>", warnings: ["diagnostic"] },
    sellingPrice: null,
    sku: null,
    source: {
      canonicalUrl: "https://www.jakmall.com/jep/product",
      category: "Source category",
      platform: "jakmall",
      price: 64_600,
      productIdentifier: "source-identifier",
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
        sourceVariantIdentifier: "source-offer",
        stock: 5,
        updatedAt: "2026-09-05T08:00:00.000Z",
      },
    ],
    weightGrams: 250,
    ...overrides,
  };
}

function draft(overrides: Partial<ShopeeDraft> = {}): ShopeeDraft {
  return {
    categoryAttributes: [{ name: "Material", value: "Stainless Steel" }],
    categoryAttributesReviewed: true,
    categoryConfirmed: true,
    categoryId: null,
    categoryPath: "Home & Living > Kitchen Tools",
    condition: "NEW",
    createdAt: "2026-09-05T07:00:00.000Z",
    dangerousProduct: "NO",
    descriptionOverride: null,
    preorder: "NO",
    productId,
    titleOverride: null,
    updatedAt: "2026-09-05T08:30:00.000Z",
    ...overrides,
  };
}

function build(
  product = jepProduct(),
  shopeeDraft = draft(),
  generatedAt = "2026-09-05T10:00:00.000Z",
) {
  return buildShopeeHandoffManifest({
    generatedAt,
    preview: buildShopeePreview(product, shopeeDraft),
    product,
  });
}

describe("Shopee handoff manifest", () => {
  it("maps the real JEP single offer to a base listing without leaking source or internal fields", () => {
    const result = build();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.manifest).toMatchObject({
      attributes: [{ name: "Material", value: "Stainless Steel" }],
      brand: "JEP",
      category: {
        id: null,
        path: "Home & Living > Kitchen Tools",
      },
      offer: {
        mode: "BASE_LISTING",
        sellingPriceIdr: 79_900,
        sku: "OMHA5ISV",
        sourceMode: "BASE_VARIANT",
        stock: 5,
      },
      physical: { weightGrams: 250 },
    });
    expect(result.manifest.images).toHaveLength(1);

    const serialized = JSON.stringify(result.manifest);
    for (const forbidden of [
      "rawSourceData",
      "sourcePrice",
      "canonicalUrl",
      "sourceIdentifier",
      "parserDiagnostic",
      "source-offer",
      "22222222-2222-4222-8222-222222222222",
      "64,600",
      "64600",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("uses the persisted READY revision in a deterministic fingerprint and excludes generatedAt", () => {
    const first = build();
    const sameEpoch = build(jepProduct(), draft(), "2026-09-05T11:00:00.000Z");
    const nextReadyEpoch = build(
      jepProduct({ updatedAt: "2026-09-05T12:00:00.000Z" }),
    );

    expect(first.ok && sameEpoch.ok && nextReadyEpoch.ok).toBe(true);
    if (!first.ok || !sameEpoch.ok || !nextReadyEpoch.ok) return;
    expect(first.manifest.snapshotFingerprint).toBe(
      sameEpoch.manifest.snapshotFingerprint,
    );
    expect(first.manifest.snapshotFingerprint).not.toBe(
      nextReadyEpoch.manifest.snapshotFingerprint,
    );
    expect(first.manifest.generatedAt).not.toBe(sameEpoch.manifest.generatedAt);
  });

  it("changes the fingerprint when a handoff-relevant persisted value changes", () => {
    const first = build();
    const changed = build(
      jepProduct({
        variants: [
          {
            ...jepProduct().variants[0],
            sellingPrice: 80_000,
          },
        ],
      }),
    );

    expect(first.ok && changed.ok).toBe(true);
    if (!first.ok || !changed.ok) return;
    expect(first.manifest.snapshotFingerprint).not.toBe(
      changed.manifest.snapshotFingerprint,
    );
  });

  it("rejects non-READY or currently blocked persisted state", () => {
    expect(build(jepProduct({ status: "REVIEW_REQUIRED" }))).toEqual({
      error: "PRODUCT_NOT_READY",
      ok: false,
    });
    expect(build(jepProduct({ weightGrams: 0 }))).toEqual({
      error: "HANDOFF_BLOCKED",
      ok: false,
    });
  });

  it("formats only the allowlisted operational package", () => {
    const result = build();
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const summary = formatShopeeHandoffSummary(result.manifest);
    expect(summary).toContain("CatalogBridge Handoff Package");
    expect(summary).toContain("Rp79.900");
    expect(summary).toContain("OMHA5ISV");
    expect(summary).toContain("Material: Stainless Steel");
    expect(summary).toContain("Shipping services: Check in Seller Centre");
    expect(summary).not.toContain("64.600");
    expect(summary).not.toContain("rawSourceData");
    expect(summary).not.toContain("Uploaded");
    expect(summary).not.toContain("Published");
  });
});
