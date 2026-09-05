import { describe, expect, it } from "vitest"

import {
  normalizeJakMallSourceProduct,
  RAW_SOURCE_DATA_MAX_BYTES,
} from "./normalize"
import type { JakMallSourceProduct } from "./types"

const canonicalSourceUrl =
  "https://www.jakmall.com/fixture-store/fixture-product"

const baseSource: JakMallSourceProduct = {
  attributes: {},
  availability: null,
  brand: null,
  categoryPath: [],
  description: null,
  dimensions: { height: null, length: null, width: null },
  gtin: null,
  images: [],
  offers: [],
  pageIdentity: { evidence: [], verified: false },
  parserStrategy: "json_ld_product",
  sku: null,
  sourcePrice: null,
  sourceProductIdentifier: null,
  stock: null,
  title: "Fixture product",
  variantAxes: [],
  warnings: [],
  weight: null,
}

const context = {
  acquisitionMode: "assisted_html" as const,
  canonicalSourceUrl,
  documentByteLength: 12_345,
}

describe("JakMall product normalization", () => {
  it("normalizes commerce values while preserving uncertainty", () => {
    const result = normalizeJakMallSourceProduct(
      {
        ...baseSource,
        attributes: { Dimensi: "10 x 8 x 2.5 cm" },
        availability: "https://schema.org/OutOfStock",
        categoryPath: ["Home", "Kitchen", "Fixture product"],
        dimensions: {
          height: null,
          length: { value: "10", unit: "cm" },
          width: { value: 8, unit: "cm" },
        },
        gtin: "8990000000001",
        images: [
          "https://static.jakmall.id/products/one.jpg",
          "https://evil.example/two.jpg",
          "https://static.jakmall.id/products/one.jpg",
        ],
        sku: "SKU-001",
        sourcePrice: "Rp125.000,00",
        weight: { value: "1.2", unit: "kg" },
      },
      context
    )

    expect(result).toMatchObject({
      product: {
        gtin: "8990000000001",
        heightCm: 2.5,
        lengthCm: 10,
        sellingPrice: null,
        sku: "SKU-001",
        sourceCategory: "Kitchen",
        sourcePrice: 125000,
        status: "REVIEW_REQUIRED",
        stock: 0,
        weightGrams: 1200,
        widthCm: 8,
      },
      images: [
        {
          sourceUrl: "https://static.jakmall.id/products/one.jpg",
          position: 0,
          isPrimary: true,
          kind: "product",
        },
      ],
    })
  })

  it("preserves concrete offers without inventing identifiers or options", () => {
    const result = normalizeJakMallSourceProduct(
      {
        ...baseSource,
        offers: [
          {
            availability: "https://schema.org/InStock",
            image: null,
            optionValues: {},
            sku: "OFFER-SKU",
            sourcePrice: "12.000",
            sourceVariantIdentifier: null,
            stock: null,
          },
        ],
        warnings: ["OFFER_OPTIONS_UNMAPPED"],
      },
      context
    )

    expect(result.variants).toEqual([
      {
        imageSourceUrl: null,
        optionValues: {},
        position: 0,
        sellingPrice: null,
        sku: "OFFER-SKU",
        sourcePrice: 12000,
        sourceVariantIdentifier: null,
        stock: null,
      },
    ])
    expect(result.warnings).toContain("OFFER_OPTIONS_UNMAPPED")
  })

  it("keeps curated raw source data below 32 KiB using UTF-8 bytes", () => {
    const result = normalizeJakMallSourceProduct(
      {
        ...baseSource,
        warnings: Array.from({ length: 100 }, () => "peringatan-✓".repeat(100)),
      },
      context
    )
    const serialized = JSON.stringify(result.product.rawSourceData)

    expect(Buffer.byteLength(serialized, "utf8")).toBeLessThanOrEqual(
      RAW_SOURCE_DATA_MAX_BYTES
    )
    expect(serialized).not.toContain("<html")
  })
})
