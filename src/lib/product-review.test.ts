import { describe, expect, it } from "vitest"

import {
  buildProductReviewIssues,
  parseProductReviewEditFormData,
  parseVariantReviewEditFormData,
  type ProductReview,
} from "./product-review"

const productId = "00000000-0000-4000-8000-000000000001"
const variantId = "00000000-0000-4000-8000-000000000002"

function reviewFixture(
  overrides: Partial<ProductReview> = {}
): ProductReview {
  return {
    attributes: { Material: "Stainless steel" },
    brand: "JEP",
    createdAt: "2026-09-05T00:00:00.000Z",
    description: "Multifunction survival tool.",
    dimensionsCm: { height: 2, length: 10, width: 4 },
    failure: null,
    gtin: null,
    id: productId,
    images: [
      {
        id: "00000000-0000-4000-8000-000000000003",
        isPrimary: true,
        kind: "product",
        position: 0,
        sourceUrl: "https://static.jakmall.id/catalog/product.jpg",
      },
    ],
    logs: [],
    rawSourceData: {
      acquisitionMode: "assisted_html",
      parserStrategy: "json_ld_product",
      warnings: [],
    },
    sellingPrice: 80000,
    sku: "PARENT-SKU",
    source: {
      canonicalUrl: "https://www.jakmall.com/store/product",
      category: "Perkakas",
      platform: "jakmall",
      price: 64600,
      productIdentifier: "source-product",
    },
    status: "REVIEW_REQUIRED",
    stock: 3,
    title: "JEP Tang Pisau Lipat",
    updatedAt: "2026-09-05T01:00:00.000Z",
    variantAxes: [],
    variants: [],
    weightGrams: 250,
    ...overrides,
  }
}

describe("Product Review issue builder", () => {
  it("uses concrete variants as the price and stock authority", () => {
    const issues = buildProductReviewIssues(
      reviewFixture({
        sellingPrice: null,
        stock: null,
        variants: [
          {
            id: variantId,
            imageSourceUrl: null,
            optionValues: { Offer: "Default" },
            position: 0,
            productId,
            sellingPrice: null,
            sku: "OMHA5ISV",
            sourcePrice: 64600,
            sourceVariantIdentifier: null,
            stock: null,
            updatedAt: "2026-09-05T01:00:00.000Z",
          },
        ],
      })
    )

    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "VARIANT_SELLING_PRICE_REQUIRED",
        "VARIANT_STOCK_UNKNOWN",
      ])
    )
    expect(issues.map((issue) => issue.code)).not.toEqual(
      expect.arrayContaining([
        "PRODUCT_SELLING_PRICE_REQUIRED",
        "PRODUCT_STOCK_UNKNOWN",
      ])
    )
  })

  it("requires parent price and stock only when there are no variants", () => {
    const issues = buildProductReviewIssues(
      reviewFixture({ sellingPrice: null, stock: null })
    )

    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "PRODUCT_SELLING_PRICE_REQUIRED",
        "PRODUCT_STOCK_UNKNOWN",
      ])
    )
  })

  it("does not create a default issue for a missing GTIN or Shopee data", () => {
    const issues = buildProductReviewIssues(reviewFixture({ gtin: null }))

    expect(issues).toEqual([])
    expect(JSON.stringify(issues)).not.toMatch(/gtin|shopee|category attribute/iu)
  })

  it("warns about source uncertainty without inventing option mappings", () => {
    const issues = buildProductReviewIssues(
      reviewFixture({
        dimensionsCm: { height: null, length: 10, width: null },
        rawSourceData: { warnings: ["OFFER_OPTIONS_UNMAPPED"] },
        sku: null,
        source: {
          ...reviewFixture().source,
          productIdentifier: null,
        },
        variants: [
          {
            id: variantId,
            imageSourceUrl: null,
            optionValues: {},
            position: 0,
            productId,
            sellingPrice: 80000,
            sku: null,
            sourcePrice: 64600,
            sourceVariantIdentifier: null,
            stock: 1,
            updatedAt: "2026-09-05T01:00:00.000Z",
          },
        ],
      })
    )

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "OFFER_OPTIONS_UNMAPPED",
          severity: "warning",
        }),
        expect.objectContaining({
          code: "VARIANT_OPTIONS_UNCONFIRMED",
          severity: "warning",
        }),
        expect.objectContaining({
          code: "DIMENSIONS_INCOMPLETE",
          severity: "warning",
        }),
        expect.objectContaining({
          code: "VARIANT_SKU_RECOMMENDED",
          severity: "warning",
        }),
      ])
    )
  })
})

describe("Product Review edit inputs", () => {
  it("parses blank optional values as null and keeps GTIN as text", () => {
    const formData = new FormData()
    formData.set("productId", productId)
    formData.set("title", " Updated product ")
    formData.set("description", "")
    formData.set("sellingPrice", "129000")
    formData.set("stock", "")
    formData.set("sku", "")
    formData.set("gtin", "08912345678901")
    formData.set("brand", "JEP")
    formData.set("weightGrams", "250")
    formData.set("lengthCm", "10.5")
    formData.set("widthCm", "4")
    formData.set("heightCm", "2")
    formData.set("$ACTION_REF_3", "framework metadata")

    expect(parseProductReviewEditFormData(formData)).toEqual({
      success: true,
      data: {
        brand: "JEP",
        description: null,
        gtin: "08912345678901",
        heightCm: 2,
        lengthCm: 10.5,
        productId,
        sellingPrice: 129000,
        sku: null,
        stock: null,
        title: "Updated product",
        weightGrams: 250,
        widthCm: 4,
      },
    })
  })

  it("rejects immutable source fields and duplicate inputs", () => {
    const sourceMutation = new FormData()
    sourceMutation.set("productId", productId)
    sourceMutation.set("sourcePrice", "1")

    const duplicate = new FormData()
    duplicate.set("productId", productId)
    duplicate.append("productId", productId)

    expect(parseProductReviewEditFormData(sourceMutation).success).toBe(false)
    expect(parseProductReviewEditFormData(duplicate).success).toBe(false)
  })

  it("allows only the three editable variant fields", () => {
    const formData = new FormData()
    formData.set("productId", productId)
    formData.set("variantId", variantId)
    formData.set("sellingPrice", "130000")
    formData.set("stock", "2")
    formData.set("sku", " VARIANT-SKU ")

    expect(parseVariantReviewEditFormData(formData)).toEqual({
      success: true,
      data: {
        productId,
        sellingPrice: 130000,
        sku: "VARIANT-SKU",
        stock: 2,
        variantId,
      },
    })

    formData.set("optionValues", "{}")
    expect(parseVariantReviewEditFormData(formData).success).toBe(false)
  })
})
