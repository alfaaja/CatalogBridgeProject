import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { parseJakMallProductDocument } from "./parser"

const JEP_URL =
  "https://www.jakmall.com/abc-store/jep-tang-pisau-lipat-multifungsi-edc-survival-tool-stainless-steel-mpa22s"

function fixture(name: string) {
  return readFileSync(join(__dirname, "__fixtures__", name), "utf8")
}

describe("JakMall product document parser", () => {
  it("parses the observed full-URI Product JSON-LD shape", () => {
    const result = parseJakMallProductDocument(
      fixture("product-jsonld.html"),
      JEP_URL
    )

    expect(result).toMatchObject({
      ok: true,
      product: {
        parserStrategy: "json_ld_product",
        title:
          "JEP Tang Pisau Lipat Multifungsi EDC Survival Tool Stainless Steel - MPA22S",
        brand: "JEP",
        sku: "MPA22S",
        gtin: "8990000000001",
        sourcePrice: 64600,
        images: [
          "https://static.jakmall.id/2026/05/images/products/0831fa/detail/jep-tang-pisau-lipat-multifungsi-edc-survival-tool-stainless-steel-mpa22s.jpg",
        ],
        pageIdentity: { verified: true },
        weight: { value: 500, unit: "g" },
        offers: [
          {
            sku: "OMHA5ISV",
            sourcePrice: 64600,
            availability: "http://schema.org/InStock",
            optionValues: {},
          },
        ],
      },
    })
  })

  it("preserves concrete AggregateOffer entries without inventing options", () => {
    const result = parseJakMallProductDocument(
      fixture("aggregate-offer.html"),
      "https://www.jakmall.com/fixture-store/aggregate-product"
    )

    expect(result).toMatchObject({
      ok: true,
      product: {
        categoryPath: ["Home", "Tools", "Fixture Aggregate Product"],
        sourcePrice: "65.000",
        offers: [
          { sku: "FIXTURE-A", optionValues: {} },
          { sku: "FIXTURE-B", optionValues: {} },
        ],
        warnings: ["OFFER_OPTIONS_UNMAPPED"],
      },
    })
  })

  it("uses only evidenced semantic breadcrumb and specification labels as fallback", () => {
    const result = parseJakMallProductDocument(
      fixture("semantic-dom.html"),
      "https://www.jakmall.com/fixture-store/semantic-product"
    )

    expect(result).toMatchObject({
      ok: true,
      product: {
        brand: "Fixture Brand",
        parserStrategy: "semantic_dom",
        title: "Semantic Product",
        description: "Deskripsi produk dari bagian informasi publik.",
        categoryPath: ["Home", "Perkakas", "Semantic Product"],
        attributes: {
          Brand: "Fixture Brand",
          Material: "Stainless steel",
          Berat: "1.2 kg",
        },
      },
    })
  })

  it("rejects page identity that conflicts with the submitted URL", () => {
    expect(
      parseJakMallProductDocument(
        fixture("product-jsonld.html"),
        "https://www.jakmall.com/abc-store/a-different-product"
      )
    ).toEqual({ ok: false, error: "SOURCE_DOCUMENT_MISMATCH" })
  })

  it("allows recognizable Product JSON-LD without identity and records a warning", () => {
    const html = `
      <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Product","name":"Identity-free product"}
      </script>
    `

    expect(parseJakMallProductDocument(html, JEP_URL)).toMatchObject({
      ok: true,
      product: {
        pageIdentity: { verified: false, evidence: [] },
        warnings: ["PAGE_IDENTITY_UNVERIFIED"],
      },
    })
  })

  it("does not trust an identity-free semantic page as the selected product", () => {
    const html = `<html><body><h1>Unverified product-like page</h1>
      <h2>Spesifikasi</h2><dl><dt>Brand</dt><dd>Fixture</dd></dl>
    </body></html>`

    expect(parseJakMallProductDocument(html, JEP_URL)).toEqual({
      ok: false,
      error: "SOURCE_PARSE_FAILED",
    })
  })

  it("rejects an empty Product marker with no usable public product fields", () => {
    expect(
      parseJakMallProductDocument(
        `<script type="application/ld+json">{"@type":"Product"}</script>`,
        JEP_URL
      )
    ).toEqual({ ok: false, error: "SOURCE_PARSE_FAILED" })
  })

  it("does not preserve credential-like product attributes", () => {
    const html = `<html><head><link rel="canonical" href="${JEP_URL}">
      <script type="application/ld+json">${JSON.stringify({
        "@type": "Product",
        name: "Safe product",
        additionalProperty: [
          { name: "Material", value: "Steel" },
          { name: "Cookie", value: "private-session" },
          { name: "Notes", value: "Authorization: Bearer private" },
        ],
      })}</script></head></html>`

    const result = parseJakMallProductDocument(html, JEP_URL)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.product.attributes).toEqual({ Material: "Steel" })
  })

  it("never recognizes Human Verification or CAPTCHA HTML as a product", () => {
    const challenge = `<!doctype html><html><head><title>Human Verification</title></head><body>AWS WAF CAPTCHA</body></html>`

    expect(parseJakMallProductDocument(challenge, JEP_URL)).toEqual({
      ok: false,
      error: "SOURCE_PARSE_FAILED",
    })
  })
})
