import { describe, expect, it } from "vitest"

import type { ProductReview } from "./product-review"
import {
  applyShopeeDraftChanges,
  buildShopeePreview,
  parseShopeeDraftFormData,
  type ShopeeDraft,
} from "./shopee-draft"

const productId = "11111111-1111-4111-8111-111111111111"
const variantId = "22222222-2222-4222-8222-222222222222"

function product(overrides: Partial<ProductReview> = {}): ProductReview {
  return {
    attributes: {},
    brand: "JEP",
    createdAt: "2026-09-05T00:00:00.000Z",
    description: "Reviewed description",
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
        sourceUrl: "https://static.jakmall.id/example.jpg",
      },
    ],
    logs: [],
    rawSourceData: { warnings: ["OFFER_OPTIONS_UNMAPPED"] },
    sellingPrice: 79_900,
    sku: null,
    source: {
      canonicalUrl: "https://www.jakmall.com/example/product",
      category: "Home",
      platform: "jakmall",
      price: 64_600,
      productIdentifier: "JEP-1",
    },
    status: "REVIEW_REQUIRED",
    stock: 5,
    title: "Reviewed title",
    updatedAt: "2026-09-05T00:00:00.000Z",
    variantAxes: [],
    variants: [],
    weightGrams: 250,
    ...overrides,
  }
}

function draft(overrides: Partial<ShopeeDraft> = {}): ShopeeDraft {
  return {
    categoryAttributes: [],
    categoryAttributesReviewed: true,
    categoryConfirmed: true,
    categoryId: null,
    categoryPath: "Home & Living > Tools",
    condition: "NEW",
    createdAt: "2026-09-05T01:00:00.000Z",
    dangerousProduct: "NO",
    descriptionOverride: null,
    preorder: "NO",
    productId,
    titleOverride: null,
    updatedAt: "2026-09-05T01:00:00.000Z",
    ...overrides,
  }
}

describe("Shopee draft input", () => {
  it("invalidates category and attribute confirmations when category changes", () => {
    const changed = applyShopeeDraftChanges(draft(), {
      ...draft(),
      categoryPath: "Home & Living > Storage",
    })

    expect(changed.categoryConfirmed).toBe(false)
    expect(changed.categoryAttributesReviewed).toBe(false)
  })

  it("invalidates attribute review when attributes change", () => {
    const changed = applyShopeeDraftChanges(draft(), {
      ...draft(),
      categoryAttributes: [{ name: "Material", value: "Steel" }],
    })

    expect(changed.categoryConfirmed).toBe(true)
    expect(changed.categoryAttributesReviewed).toBe(false)
  })

  it("accepts structured attributes and rejects duplicates or credential-like content", () => {
    const valid = new FormData()
    valid.set("titleOverride", "")
    valid.set("descriptionOverride", "")
    valid.set("categoryId", "")
    valid.set("categoryPath", "Home > Tools")
    valid.set("categoryConfirmed", "true")
    valid.set("categoryAttributesReviewed", "true")
    valid.set("dangerousProduct", "NO")
    valid.set("condition", "NEW")
    valid.set("preorder", "NO")
    valid.set("attributeName", "Material")
    valid.set("attributeValue", "Steel")

    expect(parseShopeeDraftFormData(valid).success).toBe(true)

    const unsafe = new FormData()
    for (const [name, value] of valid.entries()) unsafe.append(name, value)
    unsafe.append("attributeName", "Password")
    unsafe.append("attributeValue", "secret")
    expect(parseShopeeDraftFormData(unsafe).success).toBe(false)

    const duplicate = new FormData()
    for (const [name, value] of valid.entries()) duplicate.append(name, value)
    duplicate.append("attributeName", " material ")
    duplicate.append("attributeValue", "Metal")
    expect(parseShopeeDraftFormData(duplicate).success).toBe(false)
  })
})

describe("Shopee preview and readiness", () => {
  it("flattens one unmapped concrete offer as the base listing", () => {
    const preview = buildShopeePreview(
      product({
        variants: [
          {
            id: variantId,
            imageSourceUrl: null,
            optionValues: {},
            position: 0,
            productId,
            sellingPrice: 79_900,
            sku: "OMHA5ISV",
            sourcePrice: 64_600,
            sourceVariantIdentifier: "offer-1",
            stock: 5,
            updatedAt: "2026-09-05T00:00:00.000Z",
          },
        ],
      }),
      draft()
    )

    expect(preview.offer).toMatchObject({
      mode: "BASE_VARIANT",
      sellingPrice: 79_900,
      stock: 5,
    })
    expect(preview.issues.some((issue) => issue.severity === "blocker")).toBe(
      false
    )
  })

  it("blocks multiple unmapped variants without guessing an axis", () => {
    const baseVariant = {
      id: variantId,
      imageSourceUrl: null,
      optionValues: {},
      position: 0,
      productId,
      sellingPrice: 79_900,
      sku: "SKU-1",
      sourcePrice: 64_600,
      sourceVariantIdentifier: "offer-1",
      stock: 5,
      updatedAt: "2026-09-05T00:00:00.000Z",
    }
    const preview = buildShopeePreview(
      product({
        variants: [
          baseVariant,
          {
            ...baseVariant,
            id: "44444444-4444-4444-8444-444444444444",
            position: 1,
          },
        ],
      }),
      draft()
    )

    expect(preview.offer.mode).toBe("BLOCKED")
    expect(preview.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SHOPEE_VARIANT_MAPPING_REQUIRED" }),
      ])
    )
  })

  it("validates price and stock for every confirmed variation", () => {
    const preview = buildShopeePreview(
      product({
        variantAxes: [{ name: "Color", options: ["Black", "Blue"] }],
        variants: [
          {
            id: variantId,
            imageSourceUrl: null,
            optionValues: { Color: "Black" },
            position: 0,
            productId,
            sellingPrice: 79_900,
            sku: "BLACK",
            sourcePrice: 64_600,
            sourceVariantIdentifier: "offer-1",
            stock: 5,
            updatedAt: "2026-09-05T00:00:00.000Z",
          },
          {
            id: "44444444-4444-4444-8444-444444444444",
            imageSourceUrl: null,
            optionValues: { Color: "Blue" },
            position: 1,
            productId,
            sellingPrice: 0,
            sku: null,
            sourcePrice: 64_600,
            sourceVariantIdentifier: "offer-2",
            stock: null,
            updatedAt: "2026-09-05T00:00:00.000Z",
          },
        ],
      }),
      draft()
    )

    expect(preview.offer.mode).toBe("VARIATIONS")
    expect(preview.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SHOPEE_PRICE_REQUIRED" }),
        expect.objectContaining({ code: "SHOPEE_STOCK_REQUIRED" }),
        expect.objectContaining({
          code: "SHOPEE_SKU_RECOMMENDED",
          severity: "warning",
        }),
      ])
    )
  })

  it("accepts stock zero and does not require GTIN", () => {
    const preview = buildShopeePreview(
      product({ gtin: null, stock: 0 }),
      draft()
    )

    expect(preview.issues.map((issue) => issue.code)).not.toContain(
      "SHOPEE_STOCK_REQUIRED"
    )
    expect(preview.issues.map((issue) => issue.code)).not.toContain(
      "SHOPEE_GTIN_REQUIRED"
    )
  })

  it("reports every persisted-state blocker and keeps dimensions as a warning", () => {
    const preview = buildShopeePreview(
      product({
        description: "x".repeat(3001),
        images: [],
        sellingPrice: 0,
        stock: null,
        title: "x".repeat(256),
        weightGrams: 0,
      }),
      draft({
        categoryAttributesReviewed: false,
        categoryConfirmed: false,
        categoryPath: null,
        condition: "UNCONFIRMED",
        dangerousProduct: "UNCONFIRMED",
        preorder: "UNCONFIRMED",
      })
    )
    const blockers = preview.issues
      .filter((issue) => issue.severity === "blocker")
      .map((issue) => issue.code)

    expect(blockers).toEqual(
      expect.arrayContaining([
        "SHOPEE_TITLE_TOO_LONG",
        "SHOPEE_DESCRIPTION_TOO_LONG",
        "SHOPEE_IMAGE_REQUIRED",
        "SHOPEE_CATEGORY_REQUIRED",
        "SHOPEE_CATEGORY_CONFIRMATION_REQUIRED",
        "SHOPEE_ATTRIBUTES_REVIEW_REQUIRED",
        "SHOPEE_DANGEROUS_PRODUCT_REQUIRED",
        "SHOPEE_CONDITION_REQUIRED",
        "SHOPEE_PREORDER_REQUIRED",
        "SHOPEE_WEIGHT_REQUIRED",
        "SHOPEE_PRICE_REQUIRED",
        "SHOPEE_STOCK_REQUIRED",
      ])
    )
    expect(preview.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "SHOPEE_DIMENSIONS_RECOMMENDED",
          severity: "warning",
        }),
      ])
    )
  })

  it("blocks a missing draft and more than nine product images", () => {
    const missingDraft = buildShopeePreview(product(), null)
    expect(missingDraft.issues[0]?.code).toBe("SHOPEE_DRAFT_REQUIRED")

    const tenImages = Array.from({ length: 10 }, (_, position) => ({
      id: `${position + 10}111111-1111-4111-8111-111111111111`,
      isPrimary: position === 0,
      kind: "product" as const,
      position,
      sourceUrl: `https://static.jakmall.id/${position}.jpg`,
    }))
    const preview = buildShopeePreview(product({ images: tenImages }), draft())
    expect(preview.issues.map((issue) => issue.code)).toContain(
      "SHOPEE_IMAGE_LIMIT_EXCEEDED"
    )
  })
})
