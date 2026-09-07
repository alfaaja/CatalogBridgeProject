import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { normalizeJakMallSourceProduct } from "./normalize";
import { parseJakMallProductDocument } from "./parser";

const JEP_URL =
  "https://www.jakmall.com/abc-store/jep-tang-pisau-lipat-multifungsi-edc-survival-tool-stainless-steel-mpa22s";
const FLORENS_URL =
  "https://www.jakmall.com/florens-electric/power-supply-cctv-switching-model-jaring-12v-12-volt-merk-spc";

function fixture(name: string) {
  return readFileSync(join(__dirname, "__fixtures__", name), "utf8");
}

describe("JakMall product document parser", () => {
  it("parses the observed full-URI Product JSON-LD shape", () => {
    const result = parseJakMallProductDocument(
      fixture("product-jsonld.html"),
      JEP_URL,
    );

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
    });
  });

  it("preserves concrete AggregateOffer entries without inventing options", () => {
    const result = parseJakMallProductDocument(
      fixture("aggregate-offer.html"),
      "https://www.jakmall.com/fixture-store/aggregate-product",
    );

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
    });
  });

  it("supplements structured Florens evidence from its bounded semantic and application data", () => {
    const result = parseJakMallProductDocument(
      fixture("florens-power-supply.html"),
      FLORENS_URL,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.product).toMatchObject({
      attributes: {
        Brand: "Lainnya",
        Garansi: "1 Tahun Distributor",
        Warna: "Biru",
      },
      brand: "Lainnya",
      dimensions: {
        height: { value: 4, unit: "cm" },
        length: { value: 16, unit: "cm" },
        width: { value: 10, unit: "cm" },
      },
      gtin: null,
      parserStrategy: "json_ld_product",
      sku: null,
      sourceProductIdentifier: "7255968767462",
      title:
        "Power Supply CCTV / Switching Model Jaring 12V / 12 Volt merk SPC",
      variantAxes: [
        {
          name: "Lain-lain",
          options: ["12V 5A / 12 volt 5 ampere", "12V 10A / 12 volt 10 ampere"],
        },
      ],
      warnings: [],
      weight: { value: 400, unit: "gr" },
    });
    expect(result.product.description).toContain(
      "Adaptor Jaring 12 volt 5 ampere\nMerk SPC",
    );
    expect(result.product.description).toContain(
      "Ukuran : 16 cm x 10 cm x 4 cm",
    );
    expect(result.product.description).not.toMatch(
      /Produk Bermasalah|Spesifikasi/iu,
    );
    expect(result.product.images).toEqual([
      "https://static.jakmall.id/2017/10/images/products/54cf50/detail/power-supply-cctv-switching-model-jaring-12v-12-volt-merk-spc.jpg",
      "https://static.jakmall.id/2017/10/images/products/1c013a/detail/power-supply-cctv-switching-model-jaring-12v-12-volt-merk-spc.jpg",
      "https://static.jakmall.id/2017/10/images/products/673285/detail/power-supply-cctv-switching-model-jaring-12v-12-volt-merk-spc.jpg",
    ]);
    expect(result.product.images.join(" ")).not.toMatch(
      /\/icon\/|\/thumbnail\/|logo|review/iu,
    );
    expect(result.product.offers).toEqual([
      {
        availability: "http://schema.org/OutOfStock",
        image:
          "https://static.jakmall.id/2017/10/images/products/54cf50/detail/power-supply-cctv-switching-model-jaring-12v-12-volt-merk-spc.jpg",
        optionValues: {
          "Lain-lain": "12V 5A / 12 volt 5 ampere",
        },
        sku: "3745456160987",
        sourcePrice: 113500,
        sourceVariantIdentifier: null,
        stock: null,
      },
      {
        availability: "http://schema.org/OutOfStock",
        image:
          "https://static.jakmall.id/2017/10/images/products/327b37/detail/power-supply-cctv-switching-model-jaring-12v-12-volt-merk-spc.jpg",
        optionValues: {
          "Lain-lain": "12V 10A / 12 volt 10 ampere",
        },
        sku: "5137292608193",
        sourcePrice: 152500,
        sourceVariantIdentifier: null,
        stock: null,
      },
    ]);

    const normalized = normalizeJakMallSourceProduct(result.product, {
      acquisitionMode: "assisted_html",
      canonicalSourceUrl: FLORENS_URL,
      documentByteLength: Buffer.byteLength(
        fixture("florens-power-supply.html"),
      ),
    });

    expect(normalized.product).toMatchObject({
      attributes: {
        Brand: "Lainnya",
        Garansi: "1 Tahun Distributor",
        Warna: "Biru",
      },
      brand: "Lainnya",
      gtin: null,
      heightCm: 4,
      lengthCm: 16,
      weightGrams: 400,
      widthCm: 10,
    });
    expect(normalized.images).toHaveLength(3);
    expect(
      normalized.variants.map((variant) => ({
        optionValues: variant.optionValues,
        sku: variant.sku,
        sourcePrice: variant.sourcePrice,
        stock: variant.stock,
      })),
    ).toEqual([
      {
        optionValues: { "Lain-lain": "12V 5A / 12 volt 5 ampere" },
        sku: "3745456160987",
        sourcePrice: 113500,
        stock: 0,
      },
      {
        optionValues: { "Lain-lain": "12V 10A / 12 volt 10 ampere" },
        sku: "5137292608193",
        sourcePrice: 152500,
        stock: 0,
      },
    ]);
  });

  it("keeps offer options unresolved when the Florens matrix evidence is absent", () => {
    const html = fixture("florens-power-supply.html").replace(
      /"matrix"\s*:\s*\{[^}]+\}/u,
      '"matrix": {}',
    );
    const result = parseJakMallProductDocument(html, FLORENS_URL);

    expect(result).toMatchObject({
      ok: true,
      product: {
        offers: [{ optionValues: {} }, { optionValues: {} }],
        variantAxes: [],
        warnings: ["OFFER_OPTIONS_UNMAPPED"],
      },
    });
  });

  it("ignores application data that is not anchored to the submitted product URL", () => {
    const html = fixture("florens-power-supply.html").replace(
      `"url":"${FLORENS_URL}"`,
      '"url":"https://www.jakmall.com/other-store/other-product"',
    );
    const result = parseJakMallProductDocument(html, FLORENS_URL);

    expect(result).toMatchObject({
      ok: true,
      product: {
        images: [
          "https://static.jakmall.id/2017/10/images/products/54cf50/detail/power-supply-cctv-switching-model-jaring-12v-12-volt-merk-spc.jpg",
        ],
        offers: [{ optionValues: {} }, { optionValues: {} }],
        sourceProductIdentifier: null,
        variantAxes: [],
        warnings: ["OFFER_OPTIONS_UNMAPPED"],
      },
    });
  });

  it("does not confirm a mapping when a declared option is absent from the matrix", () => {
    const html = fixture("florens-power-supply.html").replace(
      '"sanitized-option-10a":"12V 10A / 12 volt 10 ampere"',
      '"sanitized-option-10a":"12V 10A / 12 volt 10 ampere","orphan-option":"Unmapped option"',
    );
    const result = parseJakMallProductDocument(html, FLORENS_URL);

    expect(result).toMatchObject({
      ok: true,
      product: {
        offers: [{ optionValues: {} }, { optionValues: {} }],
        variantAxes: [],
        warnings: ["OFFER_OPTIONS_UNMAPPED"],
      },
    });
  });

  it("does not confirm a mapping when option labels are not unique", () => {
    const html = fixture("florens-power-supply.html").replace(
      '"sanitized-option-10a":"12V 10A / 12 volt 10 ampere"',
      '"sanitized-option-10a":"12V 5A / 12 volt 5 ampere"',
    );
    const result = parseJakMallProductDocument(html, FLORENS_URL);

    expect(result).toMatchObject({
      ok: true,
      product: {
        offers: [{ optionValues: {} }, { optionValues: {} }],
        variantAxes: [],
        warnings: ["OFFER_OPTIONS_UNMAPPED"],
      },
    });
  });

  it("does not promote one variant dimension observation to a shared product value", () => {
    const html = fixture("florens-power-supply.html").replace(
      "Ukuran : 16 cm x 10 cm x 4 cm",
      "Ukuran tidak tersedia",
    );
    const result = parseJakMallProductDocument(html, FLORENS_URL);

    expect(result).toMatchObject({
      ok: true,
      product: {
        dimensions: { height: null, length: null, width: null },
      },
    });
  });

  it("keeps structured brand authority out of conflicting semantic brand aliases", () => {
    const html = `<html><head><link rel="canonical" href="${JEP_URL}">
      <script type="application/ld+json">${JSON.stringify({
        "@type": "Product",
        name: "Brand authority product",
        brand: { name: "Lainnya" },
      })}</script></head><body>
      <div class="dp__tab__content__col">
        <span class="dp__tab__content__label">Brand</span>
        <span class="dp__tab__content__content">SPC</span>
      </div>
    </body></html>`;
    const result = parseJakMallProductDocument(html, JEP_URL);

    expect(result).toMatchObject({
      ok: true,
      product: { attributes: {}, brand: "Lainnya" },
    });
  });

  it("bounds semantic descriptions to the adjacent evidenced content container", () => {
    const html = `<html><head><link rel="canonical" href="${JEP_URL}">
      <script type="application/ld+json">{"@type":"Product","name":"Bounded product","description":""}</script></head>
      <body><h1>Bounded product</h1><h2>Informasi Produk Bounded product</h2>
      <div class="dp__info mce"><p>Customer description.</p></div>
      <div>Unrelated footer and review controls.</div></body></html>`;
    const result = parseJakMallProductDocument(html, JEP_URL);

    expect(result).toMatchObject({
      ok: true,
      product: { description: "Customer description." },
    });
  });

  it("rejects overlong application option labels instead of persisting invalid mappings", () => {
    const html = fixture("florens-power-supply.html").replace(
      '"sanitized-option-10a":"12V 10A / 12 volt 10 ampere"',
      `"sanitized-option-10a":"${"x".repeat(501)}"`,
    );
    const result = parseJakMallProductDocument(html, FLORENS_URL);

    expect(result).toMatchObject({
      ok: true,
      product: {
        offers: [{ optionValues: {} }, { optionValues: {} }],
        variantAxes: [],
        warnings: ["OFFER_OPTIONS_UNMAPPED"],
      },
    });
  });

  it("bounds nested structured names without exhausting the parser", () => {
    const nestedName = `${'{"name":'.repeat(20)}"Too deep"${"}".repeat(20)}`;
    const html = `<html><head><link rel="canonical" href="${JEP_URL}">
      <script type="application/ld+json">{"@type":"Product","name":"Safe title","brand":${nestedName}}</script>
      </head></html>`;

    expect(parseJakMallProductDocument(html, JEP_URL)).toMatchObject({
      ok: true,
      product: { brand: null, title: "Safe title" },
    });
  });

  it("uses only evidenced semantic breadcrumb and specification labels as fallback", () => {
    const result = parseJakMallProductDocument(
      fixture("semantic-dom.html"),
      "https://www.jakmall.com/fixture-store/semantic-product",
    );

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
    });
  });

  it("rejects page identity that conflicts with the submitted URL", () => {
    expect(
      parseJakMallProductDocument(
        fixture("product-jsonld.html"),
        "https://www.jakmall.com/abc-store/a-different-product",
      ),
    ).toEqual({ ok: false, error: "SOURCE_DOCUMENT_MISMATCH" });
  });

  it("allows recognizable Product JSON-LD without identity and records a warning", () => {
    const html = `
      <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Product","name":"Identity-free product"}
      </script>
    `;

    expect(parseJakMallProductDocument(html, JEP_URL)).toMatchObject({
      ok: true,
      product: {
        pageIdentity: { verified: false, evidence: [] },
        warnings: ["PAGE_IDENTITY_UNVERIFIED"],
      },
    });
  });

  it("does not trust an identity-free semantic page as the selected product", () => {
    const html = `<html><body><h1>Unverified product-like page</h1>
      <h2>Spesifikasi</h2><dl><dt>Brand</dt><dd>Fixture</dd></dl>
    </body></html>`;

    expect(parseJakMallProductDocument(html, JEP_URL)).toEqual({
      ok: false,
      error: "SOURCE_PARSE_FAILED",
    });
  });

  it("rejects an empty Product marker with no usable public product fields", () => {
    expect(
      parseJakMallProductDocument(
        `<script type="application/ld+json">{"@type":"Product"}</script>`,
        JEP_URL,
      ),
    ).toEqual({ ok: false, error: "SOURCE_PARSE_FAILED" });
  });

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
      })}</script></head></html>`;

    const result = parseJakMallProductDocument(html, JEP_URL);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.product.attributes).toEqual({ Material: "Steel" });
  });

  it("never recognizes Human Verification or CAPTCHA HTML as a product", () => {
    const challenge = `<!doctype html><html><head><title>Human Verification</title></head><body>AWS WAF CAPTCHA</body></html>`;

    expect(parseJakMallProductDocument(challenge, JEP_URL)).toEqual({
      ok: false,
      error: "SOURCE_PARSE_FAILED",
    });
  });
});
