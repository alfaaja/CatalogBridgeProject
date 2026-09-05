import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { ProductReview } from "@/lib/product-review"
import { buildShopeePreview, type ShopeeDraft } from "@/lib/shopee-draft"

import { ShopeeMappingForm } from "./shopee-mapping-form"

const productId = "11111111-1111-4111-8111-111111111111"
const product = {
  attributes: {},
  brand: "JEP",
  createdAt: "2026-09-05T00:00:00Z",
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
      sourceUrl: "https://static.jakmall.id/a.jpg",
    },
  ],
  logs: [],
  rawSourceData: {},
  sellingPrice: 79900,
  sku: null,
  source: {
    canonicalUrl: "https://www.jakmall.com/a",
    category: "Tools",
    platform: "jakmall",
    price: 64600,
    productIdentifier: "1",
  },
  status: "REVIEW_REQUIRED",
  stock: 5,
  title: "JEP Product",
  updatedAt: "2026-09-05T00:00:00Z",
  variantAxes: [],
  variants: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      imageSourceUrl: null,
      optionValues: {},
      position: 0,
      productId,
      sellingPrice: 79900,
      sku: "OMHA5ISV",
      sourcePrice: 64600,
      sourceVariantIdentifier: "offer",
      stock: 5,
      updatedAt: "2026-09-05T00:00:00Z",
    },
  ],
  weightGrams: 250,
} satisfies ProductReview
const draft: ShopeeDraft = {
  categoryAttributes: [],
  categoryAttributesReviewed: true,
  categoryConfirmed: true,
  categoryId: null,
  categoryPath: "Home > Tools",
  condition: "NEW",
  createdAt: "2026-09-05T00:00:00Z",
  dangerousProduct: "NO",
  descriptionOverride: null,
  preorder: "NO",
  productId,
  titleOverride: null,
  updatedAt: "2026-09-05T00:00:00Z",
}

describe("Shopee mapping form", () => {
  it("shows source versus destination and the single-offer mapping without M6 claims", () => {
    const html = renderToStaticMarkup(
      <ShopeeMappingForm
        draft={draft}
        preview={buildShopeePreview(product, draft)}
        product={product}
      />
    )
    expect(html).toContain("Prepare for Shopee")
    expect(html).toContain("Single source offer mapped as the base listing")
    expect(html).toContain("Reviewer confirmation required")
    expect(html).not.toMatch(
      /Upload to Shopee|Publish to Shopee|Estimated profit/u
    )
  })

  it("renders READY mapping read-only with reopen as the only mutation", () => {
    const ready = { ...product, status: "READY" as const }
    const html = renderToStaticMarkup(
      <ShopeeMappingForm
        draft={draft}
        preview={buildShopeePreview(ready, draft)}
        product={ready}
      />
    )
    expect(html).toContain("Reopen Shopee Mapping")
    expect(html).not.toContain("Save Shopee Draft")
    expect(html).not.toContain("Mark Ready for Shopee")
  })

  it("does not offer mapping mutations before the product review stage", () => {
    const pending = { ...product, status: "PENDING" as const }
    const html = renderToStaticMarkup(
      <ShopeeMappingForm
        draft={null}
        preview={buildShopeePreview(pending, null)}
        product={pending}
      />
    )

    expect(html).not.toContain("Save Shopee Draft")
    expect(html).not.toContain("Mark Ready for Shopee")
    expect(html).not.toContain("Reopen Shopee Mapping")
  })
})
