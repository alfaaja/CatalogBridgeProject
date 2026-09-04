import { describe, expect, it } from "vitest"

import {
  importedProductSchema,
  pendingProductSchema,
  processLogSchema,
  productFailureSchema,
  productImageSchema,
  productVariantSchema,
} from "./persistence"

describe("product persistence validation", () => {
  const validImportedProduct = {
    title: null,
    description: null,
    sourcePrice: null,
    sellingPrice: null,
    sku: null,
    gtin: null,
    stock: null,
    sourceCategory: null,
    brand: null,
    weightGrams: null,
    lengthCm: null,
    widthCm: null,
    heightCm: null,
    attributes: {},
    variantAxes: [],
    rawSourceData: {},
    status: "REVIEW_REQUIRED" as const,
  }

  it("accepts an incomplete pending JakMall product", () => {
    const result = pendingProductSchema.parse({
      canonicalSourceUrl: "https://www.jakmall.com/example-product",
      sourceProductIdentifier: null,
      title: null,
    })

    expect(result).toEqual({
      canonicalSourceUrl: "https://www.jakmall.com/example-product",
      sourceProductIdentifier: null,
      title: null,
    })
  })

  it("rejects non-JakMall product URLs", () => {
    const result = pendingProductSchema.safeParse({
      canonicalSourceUrl: "https://example.com/product",
      sourceProductIdentifier: null,
      title: null,
    })

    expect(result.success).toBe(false)
  })

  it("accepts normalized typed fields and keeps SKU separate from GTIN", () => {
    const result = importedProductSchema.parse({
      title: "Example product",
      description: null,
      sourcePrice: 125000,
      sellingPrice: 140000,
      sku: "SKU-001",
      gtin: "08912345678901",
      stock: null,
      sourceCategory: "Accessories",
      brand: null,
      weightGrams: 500,
      lengthCm: 10.5,
      widthCm: 8,
      heightCm: null,
      attributes: { material: "steel" },
      variantAxes: [{ name: "Color", options: ["Black"] }],
      rawSourceData: { product: { id: "source-1" } },
      status: "REVIEW_REQUIRED",
    })

    expect(result.sku).toBe("SKU-001")
    expect(result.gtin).toBe("08912345678901")
    expect(result.title).toBe("Example product")
  })

  it("rejects negative typed values", () => {
    const result = importedProductSchema.safeParse({
      ...validImportedProduct,
      sourcePrice: -1,
    })

    expect(result.success).toBe(false)
  })

  it.each(["condition", "hazardousMaterial", "preorder"])(
    "rejects the deferred %s field",
    (field) => {
      const result = importedProductSchema.safeParse({
        ...validImportedProduct,
        [field]: field === "condition" ? "new" : false,
      })

      expect(result.success).toBe(false)
    }
  )

  it("rejects sensitive request or session material in raw source data", () => {
    const result = importedProductSchema.safeParse({
      ...validImportedProduct,
      rawSourceData: { request: { cookie: "private-session" } },
    })

    expect(result.success).toBe(false)
  })

  it("rejects credential-like values hidden under ordinary raw-data keys", () => {
    const result = importedProductSchema.safeParse({
      ...validImportedProduct,
      rawSourceData: { requestValue: "Authorization: Bearer private" },
    })

    expect(result.success).toBe(false)
  })

  it("rejects credential key variants in raw source data", () => {
    const result = importedProductSchema.safeParse({
      ...validImportedProduct,
      rawSourceData: { serviceRoleKey: "private" },
    })

    expect(result.success).toBe(false)
  })

  it("rejects credential-like product failure messages", () => {
    const result = productFailureSchema.safeParse({
      productId: "00000000-0000-4000-8000-000000000000",
      errorCode: "SOURCE_FETCH_FAILED",
      errorMessage: "Authorization: Bearer private",
    })

    expect(result.success).toBe(false)
  })

  it("validates image, variant, and append-only log inputs", () => {
    expect(
      productImageSchema.parse({
        sourceUrl: "https://example.com/image.jpg",
        position: 0,
        isPrimary: true,
        kind: "product",
      })
    ).toBeDefined()

    expect(
      productVariantSchema.parse({
        sourceVariantIdentifier: null,
        position: 0,
        optionValues: { Color: "Black" },
        sourcePrice: null,
        sellingPrice: null,
        stock: null,
        sku: null,
        imageSourceUrl: null,
      })
    ).toBeDefined()

    expect(
      processLogSchema.safeParse({
        productId: "00000000-0000-4000-8000-000000000000",
        stage: "persistence",
        status: "success",
        message: "Product record saved.",
        details: { cookie: "must-not-be-stored" },
      }).success
    ).toBe(false)

    expect(
      processLogSchema.safeParse({
        productId: "00000000-0000-4000-8000-000000000000",
        stage: "persistence",
        status: "failed",
        message: "Authorization: Bearer private",
        details: {},
      }).success
    ).toBe(false)
  })
})
