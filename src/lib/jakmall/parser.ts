import { load, type CheerioAPI } from "cheerio"

import { canonicalizeJakMallProductUrl } from "./url"
import type {
  JakMallPageIdentityEvidence,
  JakMallParseResult,
  JakMallSourceOffer,
  JakMallSourceProduct,
  JakMallSourceQuantity,
  JakMallSourceScalar,
} from "./types"

type JsonObject = Record<string, unknown>

const MAX_JSON_LD_NODES = 5_000
const HEADING_SELECTOR = "h1,h2,h3,h4,h5,h6"

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function schemaValue(object: JsonObject, property: string): unknown {
  for (const key of [
    property,
    `http://schema.org/${property}`,
    `https://schema.org/${property}`,
  ]) {
    if (Object.hasOwn(object, key)) {
      return object[key]
    }
  }

  return undefined
}

function values(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : value === undefined ? [] : [value]
}

function text(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null
  }

  const normalized = String(value).replace(/\s+/gu, " ").trim()
  return normalized.length > 0 ? normalized : null
}

function sourceScalar(value: unknown): JakMallSourceScalar | null {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : text(value)
}

function hasSchemaType(object: JsonObject, expectedType: string) {
  return values(schemaValue(object, "@type")).some((value) => {
    const type = text(value)
    return type?.split(/[\/#]/u).at(-1) === expectedType
  })
}

function collectJsonObjects(value: unknown): readonly JsonObject[] {
  const found: JsonObject[] = []
  const queue: unknown[] = [value]

  while (queue.length > 0 && found.length < MAX_JSON_LD_NODES) {
    const current = queue.shift()

    if (Array.isArray(current)) {
      queue.push(...current)
      continue
    }

    if (!isObject(current)) {
      continue
    }

    found.push(current)
    queue.push(...Object.values(current))
  }

  return found
}

function parseJsonLd($: CheerioAPI) {
  const objects: JsonObject[] = []

  $('script[type="application/ld+json"]').each((_, element) => {
    const source = $(element).text().trim()

    if (!source) {
      return
    }

    try {
      objects.push(...collectJsonObjects(JSON.parse(source)))
    } catch {
      // Ignore malformed structured-data blocks and continue to verified fallbacks.
    }
  })

  return objects
}

function richText(value: unknown): string | null {
  const source = text(value)

  if (!source) {
    return null
  }

  const $ = load(`<body>${source}</body>`)
  $("script,style,noscript").remove()
  $("br").replaceWith("\n")
  $("p,div,li").each((_, element) => {
    $(element).append("\n")
  })

  const normalized = $("body")
    .text()
    .split(/\r?\n/u)
    .map((line) => line.replace(/[\t ]+/gu, " ").trim())
    .filter(Boolean)
    .join("\n")

  return normalized || null
}

function namedValue(value: unknown): string | null {
  if (isObject(value)) {
    return text(schemaValue(value, "name"))
  }

  return text(value)
}

function quantity(value: unknown): JakMallSourceQuantity | null {
  if (!isObject(value)) {
    const scalar = sourceScalar(value)
    return scalar === null ? null : { value: scalar, unit: null }
  }

  const quantityValue = sourceScalar(schemaValue(value, "value"))

  return quantityValue === null
    ? null
    : {
        value: quantityValue,
        unit:
          text(schemaValue(value, "unitText")) ??
          text(schemaValue(value, "unitCode")),
      }
}

function imageUrls(value: unknown): readonly string[] {
  return values(value).flatMap((image) => {
    if (isObject(image)) {
      const url =
        text(schemaValue(image, "contentUrl")) ??
        text(schemaValue(image, "url"))
      return url ? [url] : []
    }

    const url = text(image)
    return url ? [url] : []
  })
}

function parseOffer(offer: JsonObject): JakMallSourceOffer {
  const inventoryLevel = schemaValue(offer, "inventoryLevel")

  return {
    availability: text(schemaValue(offer, "availability")),
    image: imageUrls(schemaValue(offer, "image"))[0] ?? null,
    optionValues: {},
    sku: text(schemaValue(offer, "sku")),
    sourcePrice: sourceScalar(schemaValue(offer, "price")),
    sourceVariantIdentifier: text(schemaValue(offer, "identifier")),
    stock: isObject(inventoryLevel)
      ? sourceScalar(schemaValue(inventoryLevel, "value"))
      : sourceScalar(inventoryLevel),
  }
}

function concreteOffers(offerRoot: unknown): readonly JakMallSourceOffer[] {
  if (!isObject(offerRoot)) {
    return []
  }

  const candidates = hasSchemaType(offerRoot, "Offer")
    ? [offerRoot]
    : values(schemaValue(offerRoot, "offers")).filter(isObject)

  return candidates
    .filter((candidate) => hasSchemaType(candidate, "Offer"))
    .map(parseOffer)
}

function breadcrumbPath(objects: readonly JsonObject[]): readonly string[] {
  const breadcrumb = objects.find((object) =>
    hasSchemaType(object, "BreadcrumbList")
  )

  if (!breadcrumb) {
    return []
  }

  return values(schemaValue(breadcrumb, "itemListElement"))
    .filter(isObject)
    .map((item, index) => ({
      name:
        namedValue(schemaValue(item, "item")) ??
        text(schemaValue(item, "name")),
      position: Number(schemaValue(item, "position")) || index + 1,
    }))
    .filter((item): item is { name: string; position: number } => Boolean(item.name))
    .sort((left, right) => left.position - right.position)
    .map((item) => item.name)
}

function isSafePublicAttribute(name: string, value: string) {
  const normalizedName = name.replace(/[^a-z0-9]+/giu, "_").toLowerCase()

  return (
    !/(?:^|_)(?:api_?key|authorization|cookie|credential|jwt|password|secret|session|token)(?:_|$)/u.test(
      normalizedName
    ) &&
    !/(?:authorization|cookie|set-cookie)\s*:|\bbearer\s+\S+|\bsb_secret_/iu.test(
      value
    )
  )
}

function jsonLdAttributes(product: JsonObject) {
  return Object.fromEntries(
    values(schemaValue(product, "additionalProperty"))
      .filter(isObject)
      .map((property) => [
        text(schemaValue(property, "name")),
        richText(schemaValue(property, "value")),
      ])
      .filter((entry): entry is [string, string] => Boolean(entry[0] && entry[1]))
      .filter(([name, value]) => isSafePublicAttribute(name, value))
  )
}

function semanticBreadcrumbPath($: CheerioAPI) {
  return $('[itemtype$="schema.org/BreadcrumbList"] [itemprop="itemListElement"] [itemprop="name"]')
    .map((_, element) => $(element).text().replace(/\s+/gu, " ").trim())
    .get()
    .filter(Boolean)
}

function headingByText($: CheerioAPI, label: RegExp) {
  return $(HEADING_SELECTOR)
    .filter((_, element) => label.test($(element).text().trim()))
    .first()
}

function semanticDescription($: CheerioAPI) {
  const heading = headingByText($, /^Informasi Produk$/iu)

  if (heading.length === 0) {
    return null
  }

  const description = heading
    .nextUntil(HEADING_SELECTOR)
    .text()
    .replace(/\s+/gu, " ")
    .trim()

  return description || null
}

function semanticAttributes($: CheerioAPI) {
  const heading = headingByText($, /^Spesifikasi$/iu)

  if (heading.length === 0) {
    return {}
  }

  const region = heading.nextUntil(HEADING_SELECTOR)
  const entries: Array<[string, string]> = []

  region.find("dt").each((_, element) => {
    const name = $(element).text().replace(/\s+/gu, " ").trim()
    const value = $(element).next("dd").text().replace(/\s+/gu, " ").trim()

    if (name && value) {
      entries.push([name, value])
    }
  })

  region.find("tr").each((_, element) => {
    const cells = $(element).children("th,td")
    const name = cells.eq(0).text().replace(/\s+/gu, " ").trim()
    const value = cells.eq(1).text().replace(/\s+/gu, " ").trim()

    if (name && value) {
      entries.push([name, value])
    }
  })

  return Object.fromEntries(
    entries.filter(([name, value]) => isSafePublicAttribute(name, value))
  )
}

function pageIdentityEvidence(
  $: CheerioAPI,
  product: JsonObject | null
): readonly JakMallPageIdentityEvidence[] {
  const candidates: Array<{
    source: JakMallPageIdentityEvidence["source"]
    url: string | null
  }> = [
    { source: "canonical", url: $("link[rel~=canonical]").first().attr("href") ?? null },
    { source: "og_url", url: $('meta[property="og:url"]').first().attr("content") ?? null },
    {
      source: "json_ld_product",
      url: product ? text(schemaValue(product, "url")) : null,
    },
  ]

  return candidates.flatMap(({ source, url }) => {
    if (!url) {
      return []
    }

    const canonical = canonicalizeJakMallProductUrl(url)
    return [
      {
        canonicalUrl: canonical.ok ? canonical.url : null,
        source,
        url,
      },
    ]
  })
}

function verifiedIdentity(
  evidence: readonly JakMallPageIdentityEvidence[],
  expectedUrl: string
) {
  const validEvidence = evidence.filter(
    (item): item is JakMallPageIdentityEvidence & { canonicalUrl: string } =>
      item.canonicalUrl !== null
  )

  if (validEvidence.some((item) => item.canonicalUrl !== expectedUrl)) {
    return "mismatch" as const
  }

  return validEvidence.length > 0
}

function productFromJsonLd(
  product: JsonObject,
  objects: readonly JsonObject[],
  identity: JakMallSourceProduct["pageIdentity"]
): JakMallSourceProduct {
  const offerRoot = schemaValue(product, "offers")
  const offers = concreteOffers(offerRoot)
  const aggregate = isObject(offerRoot) ? offerRoot : null
  const warnings = [
    ...(identity.verified ? [] : ["PAGE_IDENTITY_UNVERIFIED"]),
    ...(offers.length > 0 ? ["OFFER_OPTIONS_UNMAPPED"] : []),
  ]

  return {
    attributes: jsonLdAttributes(product),
    availability:
      text(schemaValue(product, "availability")) ??
      (offers.length === 1 ? offers[0].availability : null),
    brand: namedValue(schemaValue(product, "brand")),
    categoryPath:
      breadcrumbPath(objects).length > 0
        ? breadcrumbPath(objects)
        : values(schemaValue(product, "category")).flatMap((value) => {
            const category = text(value)
            return category ? [category] : []
          }),
    description: richText(schemaValue(product, "description")),
    dimensions: {
      height: quantity(schemaValue(product, "height")),
      length:
        quantity(schemaValue(product, "depth")) ??
        quantity(schemaValue(product, "length")),
      width: quantity(schemaValue(product, "width")),
    },
    gtin:
      text(schemaValue(product, "gtin")) ??
      text(schemaValue(product, "gtin14")) ??
      text(schemaValue(product, "gtin13")) ??
      text(schemaValue(product, "gtin12")) ??
      text(schemaValue(product, "gtin8")),
    images: imageUrls(schemaValue(product, "image")),
    offers,
    pageIdentity: identity,
    parserStrategy: "json_ld_product",
    sku: text(schemaValue(product, "sku")),
    sourcePrice:
      (aggregate && sourceScalar(schemaValue(aggregate, "lowPrice"))) ??
      (aggregate && sourceScalar(schemaValue(aggregate, "price"))) ??
      offers[0]?.sourcePrice ??
      null,
    sourceProductIdentifier:
      text(schemaValue(product, "productID")) ??
      text(schemaValue(product, "identifier")),
    stock: sourceScalar(schemaValue(product, "inventoryLevel")),
    title: text(schemaValue(product, "name")),
    variantAxes: [],
    warnings,
    weight: quantity(schemaValue(product, "weight")),
  }
}

function hasUsefulProductSignal(product: JakMallSourceProduct) {
  return Boolean(
    product.title ||
      product.description ||
      product.brand ||
      product.sku ||
      product.gtin ||
      product.sourceProductIdentifier ||
      product.sourcePrice !== null ||
      product.images.length > 0 ||
      product.offers.length > 0 ||
      product.categoryPath.length > 0 ||
      Object.keys(product.attributes).length > 0
  )
}

function productFromSemanticDom(
  $: CheerioAPI,
  identity: JakMallSourceProduct["pageIdentity"]
): JakMallSourceProduct | null {
  const title = $("h1").first().text().replace(/\s+/gu, " ").trim() || null
  const categoryPath = semanticBreadcrumbPath($)
  const attributes = semanticAttributes($)
  const brand = Object.entries(attributes).find(([name]) =>
    /^(?:brand|merek)$/iu.test(name.trim())
  )?.[1] ?? null

  if (!title || (categoryPath.length === 0 && Object.keys(attributes).length === 0)) {
    return null
  }

  return {
    attributes,
    availability: null,
    brand,
    categoryPath,
    description: semanticDescription($),
    dimensions: { height: null, length: null, width: null },
    gtin: null,
    images: [],
    offers: [],
    pageIdentity: identity,
    parserStrategy: "semantic_dom",
    sku: null,
    sourcePrice: null,
    sourceProductIdentifier: null,
    stock: null,
    title,
    variantAxes: [],
    warnings: identity.verified ? [] : ["PAGE_IDENTITY_UNVERIFIED"],
    weight: null,
  }
}

export function parseJakMallProductDocument(
  html: string,
  submittedUrl: string
): JakMallParseResult {
  const canonicalUrl = canonicalizeJakMallProductUrl(submittedUrl)

  if (!canonicalUrl.ok || typeof html !== "string" || html.length === 0) {
    return { ok: false, error: "SOURCE_PARSE_FAILED" }
  }

  const $ = load(html)
  const pageTitle = $("title").text().trim()
  const bodyPrefix = $("body").text().slice(0, 10_000)

  if (
    /human verification|access denied/iu.test(pageTitle) ||
    /aws\s*waf[^]{0,500}captcha|captcha[^]{0,500}aws\s*waf/iu.test(bodyPrefix)
  ) {
    return { ok: false, error: "SOURCE_PARSE_FAILED" }
  }

  const objects = parseJsonLd($)
  const productNode =
    objects.find((object) => hasSchemaType(object, "Product")) ?? null
  const evidence = pageIdentityEvidence($, productNode)
  $("script,style,noscript").remove()
  const verification = verifiedIdentity(evidence, canonicalUrl.url)

  if (verification === "mismatch") {
    return { ok: false, error: "SOURCE_DOCUMENT_MISMATCH" }
  }

  const identity = { evidence, verified: verification === true }
  const product = productNode
    ? productFromJsonLd(productNode, objects, identity)
    : identity.verified
      ? productFromSemanticDom($, identity)
      : null

  return product && hasUsefulProductSignal(product)
    ? { ok: true, product }
    : { ok: false, error: "SOURCE_PARSE_FAILED" }
}
