import { load } from "cheerio"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { ProductReview } from "@/lib/product-review"
import { formatIdr } from "@/lib/product-presentation"

import { ProductReviewForm } from "./product-review-form"

const productId = "00000000-0000-4000-8000-000000000000"
const variantId = "00000000-0000-4000-8000-000000000001"

const product: ProductReview = {
  attributes: { material: "stainless steel" },
  brand: "JEP",
  createdAt: "2026-09-05T00:00:00+07:00",
  description: "Imported description",
  dimensionsCm: { height: null, length: null, width: null },
  failure: null,
  gtin: null,
  id: productId,
  images: [
    {
      id: "00000000-0000-4000-8000-000000000002",
      isPrimary: true,
      kind: "product",
      position: 0,
      sourceUrl: "https://static.jakmall.id/products/jep.jpg",
    },
  ],
  logs: [
    {
      id: "00000000-0000-4000-8000-000000000003",
      createdAt: "2026-09-05T00:00:00+07:00",
      details: { warnings: ["OFFER_OPTIONS_UNMAPPED"] },
      message: "Product data normalized.",
      stage: "normalization",
      status: "warning",
    },
  ],
  rawSourceData: {
    acquisitionMode: "assisted_html",
    counts: { images: 1, offers: 1 },
    pageIdentity: { verified: true },
    parserStrategy: "json_ld_product",
    warnings: ["OFFER_OPTIONS_UNMAPPED"],
  },
  sellingPrice: null,
  sku: null,
  source: {
    canonicalUrl: "https://www.jakmall.com/jep/product",
    category: "Tools",
    platform: "jakmall",
    price: 64600,
    productIdentifier: "JEP-001",
  },
  status: "REVIEW_REQUIRED",
  stock: null,
  title: "JEP Tang Pisau Lipat",
  updatedAt: "2026-09-05T00:00:00+07:00",
  variantAxes: [],
  variants: [
    {
      id: variantId,
      imageSourceUrl: null,
      optionValues: {},
      position: 0,
      productId,
      sellingPrice: null,
      sku: null,
      sourcePrice: 64600,
      sourceVariantIdentifier: "JEP-001",
      stock: null,
      updatedAt: "2026-09-05T00:00:00+07:00",
    },
  ],
  weightGrams: null,
}

describe("Product review form", () => {
  it("renders source data read-only and selling data editable", () => {
    const $ = load(renderToStaticMarkup(<ProductReviewForm product={product} />))

    expect($("h1").text()).toContain("JEP Tang Pisau Lipat")
    expect($("body").text()).toContain("Needs Review")
    expect($("body").text()).toContain(formatIdr(64600))
    expect($('input[name="sellingPrice"]').first().attr("value")).toBe("")
    expect($('input[name="sourcePrice"]')).toHaveLength(0)
    expect($('textarea[name="rawSourceData"]')).toHaveLength(0)
    expect($('a[href="https://www.jakmall.com/jep/product"]').text()).toContain(
      "View on JakMall"
    )
    expect($('img[alt*="JEP Tang Pisau Lipat"]')).toHaveLength(1)
  })

  it("keeps curated source details secondary and omits M5 controls", () => {
    const $ = load(renderToStaticMarkup(<ProductReviewForm product={product} />))

    expect($("details summary").text()).toContain("Source details")
    expect($("body").text()).toContain("OFFER_OPTIONS_UNMAPPED")
    expect($("body").text()).toContain("assisted html")
    expect($("body").text()).not.toContain("Prepare for Shopee")
    expect($("body").text()).not.toContain("Shopee category")
    expect($("body").text()).not.toContain("markup")
  })

  it("renders immutable variant source data and three editable fields", () => {
    const $ = load(renderToStaticMarkup(<ProductReviewForm product={product} />))
    const variantForm = $(`form[data-variant-id="${variantId}"]`)

    expect(variantForm.text()).toContain("JEP-001")
    expect(variantForm.text()).toContain(formatIdr(64600))
    expect(variantForm.find('input[name="sourceVariantIdentifier"]')).toHaveLength(0)
    expect(variantForm.find('input[name="sellingPrice"]').attr("value")).toBe("")
    expect(variantForm.find('input[name="stock"]').attr("value")).toBe("")
    expect(variantForm.find('input[name="sku"]').attr("value")).toBe("")
  })

  it("renders safe non-review states without save controls", () => {
    for (const status of ["PENDING", "IMPORTING", "FAILED", "READY"] as const) {
      const $ = load(
        renderToStaticMarkup(
          <ProductReviewForm
            product={{
              ...product,
              failure:
                status === "FAILED"
                  ? { code: "SOURCE_PARSE_FAILED", message: "Import failed." }
                  : null,
              status,
            }}
          />
        )
      )

      expect($("button[type=submit]")).toHaveLength(0)
      expect($("body").text()).toContain("This product is not editable")
    }
  })
})
