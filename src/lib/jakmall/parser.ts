import { load, type CheerioAPI } from "cheerio";

import { canonicalizeJakMallProductUrl } from "./url";
import type {
  JakMallPageIdentityEvidence,
  JakMallParseResult,
  JakMallSourceOffer,
  JakMallSourceProduct,
  JakMallSourceQuantity,
  JakMallSourceScalar,
} from "./types";

type JsonObject = Record<string, unknown>;

const MAX_JSON_LD_NODES = 5_000;
const MAX_DESCRIPTION_LENGTH = 100_000;
const MAX_IMAGE_COUNT = 100;
const MAX_OFFER_COUNT = 100;
const MAX_VARIANT_OPTION_COUNT = 100;
const MAX_VARIANT_AXIS_NAME_LENGTH = 200;
const MAX_VARIANT_OPTION_LENGTH = 500;
const MAX_IDENTIFIER_LENGTH = 500;
const MAX_NAMED_VALUE_DEPTH = 4;
const HEADING_SELECTOR = "h1,h2,h3,h4,h5,h6";

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function schemaValue(object: JsonObject, property: string): unknown {
  for (const key of [
    property,
    `http://schema.org/${property}`,
    `https://schema.org/${property}`,
  ]) {
    if (Object.hasOwn(object, key)) {
      return object[key];
    }
  }

  return undefined;
}

function values(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : value === undefined ? [] : [value];
}

function text(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const normalized = String(value).replace(/\s+/gu, " ").trim();
  return normalized.length > 0 ? normalized : null;
}

function sourceScalar(value: unknown): JakMallSourceScalar | null {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : text(value);
}

function hasSchemaType(object: JsonObject, expectedType: string) {
  return values(schemaValue(object, "@type")).some((value) => {
    const type = text(value);
    return type?.split(/[\/#]/u).at(-1) === expectedType;
  });
}

function collectJsonObjects(value: unknown): readonly JsonObject[] {
  const found: JsonObject[] = [];
  const queue: unknown[] = [value];

  while (queue.length > 0 && found.length < MAX_JSON_LD_NODES) {
    const current = queue.shift();

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    if (!isObject(current)) {
      continue;
    }

    found.push(current);
    queue.push(...Object.values(current));
  }

  return found;
}

function parseJsonLd($: CheerioAPI) {
  const objects: JsonObject[] = [];

  $('script[type="application/ld+json"]').each((_, element) => {
    const source = $(element).text().trim();

    if (!source) {
      return;
    }

    try {
      objects.push(...collectJsonObjects(JSON.parse(source)));
    } catch {
      // Ignore malformed structured-data blocks and continue to verified fallbacks.
    }
  });

  return objects;
}

function richText(value: unknown): string | null {
  const source = text(value);

  if (!source) {
    return null;
  }

  const $ = load(`<body>${source}</body>`);
  $("script,style,noscript").remove();
  $("br").replaceWith("\n");
  $("p,div,li").each((_, element) => {
    $(element).append("\n");
  });

  const normalized = $("body")
    .text()
    .split(/\r?\n/u)
    .map((line) => line.replace(/[\t ]+/gu, " ").trim())
    .filter(Boolean)
    .join("\n");

  return normalized || null;
}

function namedValue(value: unknown): string | null {
  let current = value;

  for (let depth = 0; depth <= MAX_NAMED_VALUE_DEPTH; depth += 1) {
    if (!isObject(current)) {
      return text(current);
    }

    const name = schemaValue(current, "name");
    if (name === current) return null;
    current = name;
  }

  return null;
}

function quantity(value: unknown): JakMallSourceQuantity | null {
  if (!isObject(value)) {
    const scalar = sourceScalar(value);
    return scalar === null ? null : { value: scalar, unit: null };
  }

  const quantityValue = sourceScalar(schemaValue(value, "value"));

  return quantityValue === null
    ? null
    : {
        value: quantityValue,
        unit:
          text(schemaValue(value, "unitText")) ??
          text(schemaValue(value, "unitCode")),
      };
}

function imageUrls(value: unknown): readonly string[] {
  return values(value)
    .slice(0, MAX_IMAGE_COUNT)
    .flatMap((image) => {
      if (isObject(image)) {
        const url =
          text(schemaValue(image, "contentUrl")) ??
          text(schemaValue(image, "url"));
        return url ? [url] : [];
      }

      const url = text(image);
      return url ? [url] : [];
    });
}

function parseOffer(offer: JsonObject): JakMallSourceOffer {
  const inventoryLevel = schemaValue(offer, "inventoryLevel");

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
  };
}

function concreteOffers(offerRoot: unknown): readonly JakMallSourceOffer[] {
  if (!isObject(offerRoot)) {
    return [];
  }

  const candidates = hasSchemaType(offerRoot, "Offer")
    ? [offerRoot]
    : values(schemaValue(offerRoot, "offers")).filter(isObject);

  return candidates
    .slice(0, MAX_OFFER_COUNT)
    .filter((candidate) => hasSchemaType(candidate, "Offer"))
    .map(parseOffer);
}

function breadcrumbPath(objects: readonly JsonObject[]): readonly string[] {
  const breadcrumb = objects.find((object) =>
    hasSchemaType(object, "BreadcrumbList"),
  );

  if (!breadcrumb) {
    return [];
  }

  return values(schemaValue(breadcrumb, "itemListElement"))
    .filter(isObject)
    .map((item, index) => ({
      name:
        namedValue(schemaValue(item, "item")) ??
        text(schemaValue(item, "name")),
      position: Number(schemaValue(item, "position")) || index + 1,
    }))
    .filter((item): item is { name: string; position: number } =>
      Boolean(item.name),
    )
    .sort((left, right) => left.position - right.position)
    .map((item) => item.name);
}

function isSafePublicAttribute(name: string, value: string) {
  const normalizedName = name.replace(/[^a-z0-9]+/giu, "_").toLowerCase();

  return (
    !/(?:^|_)(?:api_?key|authorization|cookie|credential|jwt|password|secret|session|token)(?:_|$)/u.test(
      normalizedName,
    ) &&
    !/(?:authorization|cookie|set-cookie)\s*:|\bbearer\s+\S+|\bsb_secret_/iu.test(
      value,
    )
  );
}

function jsonLdAttributes(product: JsonObject) {
  return Object.fromEntries(
    values(schemaValue(product, "additionalProperty"))
      .filter(isObject)
      .map((property) => [
        text(schemaValue(property, "name")),
        richText(schemaValue(property, "value")),
      ])
      .filter((entry): entry is [string, string] =>
        Boolean(entry[0] && entry[1]),
      )
      .filter(([name, value]) => isSafePublicAttribute(name, value)),
  );
}

function semanticBreadcrumbPath($: CheerioAPI) {
  return $(
    '[itemtype$="schema.org/BreadcrumbList"] [itemprop="itemListElement"] [itemprop="name"]',
  )
    .map((_, element) => $(element).text().replace(/\s+/gu, " ").trim())
    .get()
    .filter(Boolean);
}

function headingByText($: CheerioAPI, label: RegExp) {
  return $(HEADING_SELECTOR)
    .filter((_, element) => label.test($(element).text().trim()))
    .first();
}

function semanticDescription($: CheerioAPI) {
  const heading = headingByText($, /^Informasi Produk(?:\s|$)/iu);

  if (heading.length === 0) {
    return null;
  }

  const content = heading.next();
  if (content.length === 0 || content.is(HEADING_SELECTOR)) return null;

  const description = richText($.html(content.first()) ?? "");

  return description && description.length <= MAX_DESCRIPTION_LENGTH
    ? description
    : null;
}

function semanticAttributes($: CheerioAPI) {
  const heading = headingByText($, /^Spesifikasi(?:\s|$)/iu);

  if (heading.length === 0) {
    return {};
  }

  const region = heading.nextUntil(HEADING_SELECTOR);
  const entries: Array<[string, string]> = [];

  region.find("dt").each((_, element) => {
    const name = $(element).text().replace(/\s+/gu, " ").trim();
    const value = $(element).next("dd").text().replace(/\s+/gu, " ").trim();

    if (name && value) {
      entries.push([name, value]);
    }
  });

  region.find("tr").each((_, element) => {
    const cells = $(element).children("th,td");
    const name = cells.eq(0).text().replace(/\s+/gu, " ").trim();
    const value = cells.eq(1).text().replace(/\s+/gu, " ").trim();

    if (name && value) {
      entries.push([name, value]);
    }
  });

  region.find(".dp__spec__row").each((_, element) => {
    const cells = $(element).children(".dp__spec__column");
    const name = cells.eq(0).text().replace(/\s+/gu, " ").trim();
    const value = cells.eq(1).text().replace(/\s+/gu, " ").trim();

    if (name && value) {
      entries.push([name, value]);
    }
  });

  return Object.fromEntries(
    entries.filter(([name, value]) => isSafePublicAttribute(name, value)),
  );
}

function semanticProductFacts($: CheerioAPI) {
  const entries: Array<[string, string]> = [];

  $(".dp__tab__content__col").each((_, element) => {
    const name = $(element)
      .find(".dp__tab__content__label")
      .first()
      .text()
      .replace(/\s+/gu, " ")
      .trim();
    const value = $(element)
      .find(".dp__tab__content__content")
      .first()
      .text()
      .replace(/\s+/gu, " ")
      .trim();

    if (/^(?:brand|merek|garansi|warranty)$/iu.test(name) && value) {
      entries.push([name, value]);
    }
  });

  return Object.fromEntries(
    entries.filter(([name, value]) => isSafePublicAttribute(name, value)),
  );
}

function semanticDimensions(
  description: string | null,
  expectedObservations: number,
) {
  if (!description) return null;

  const matches = [
    ...description.matchAll(
      /(?:^|\n)Ukuran\s*:\s*([0-9]+(?:[.,][0-9]+)?)\s*cm\s*x\s*([0-9]+(?:[.,][0-9]+)?)\s*cm\s*x\s*([0-9]+(?:[.,][0-9]+)?)\s*cm(?:\n|$)/giu,
    ),
  ].map((match) =>
    match.slice(1).map((part) => Number(part.replace(",", "."))),
  );

  if (
    matches.length !== expectedObservations ||
    matches.some((dimensions) =>
      dimensions.some((value, index) => value !== matches[0][index]),
    )
  ) {
    return null;
  }

  const [length, width, height] = matches[0];
  return {
    height: { value: height, unit: "cm" } as const,
    length: { value: length, unit: "cm" } as const,
    width: { value: width, unit: "cm" } as const,
  };
}

type ApplicationProductData = Readonly<{
  id: string | null;
  matrix: Readonly<Record<string, string>>;
  sku: Readonly<Record<string, JsonObject>>;
  variants: Readonly<Record<string, JsonObject>>;
}>;

function stringRecord(value: unknown) {
  if (!isObject(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

function objectRecord(value: unknown) {
  if (!isObject(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, JsonObject] =>
      isObject(entry[1]),
    ),
  );
}

function applicationProductData(
  $: CheerioAPI,
  canonicalSourceUrl: string,
): ApplicationProductData | null {
  let result: ApplicationProductData | null = null;

  $("script").each((_, element) => {
    if (result) return;

    const source = $(element).text();
    const match = /\bvar\s+spdt\s*=\s*(\{[\s\S]*?\})\s*;/u.exec(source);
    if (!match) return;

    try {
      const value: unknown = JSON.parse(match[1]);
      if (!isObject(value)) return;
      const applicationUrl = text(value.url);
      const canonicalApplicationUrl = applicationUrl
        ? canonicalizeJakMallProductUrl(applicationUrl)
        : null;
      if (
        !canonicalApplicationUrl?.ok ||
        canonicalApplicationUrl.url !== canonicalSourceUrl
      ) {
        return;
      }

      result = {
        id: text(value.id)?.slice(0, MAX_IDENTIFIER_LENGTH) ?? null,
        matrix: stringRecord(value.matrix),
        sku: objectRecord(value.sku),
        variants: objectRecord(value.variants),
      };
    } catch {
      // Ignore malformed application data and preserve structured-only parsing.
    }
  });

  return result;
}

function detailImages(sku: JsonObject | undefined) {
  return values(sku?.images)
    .slice(0, MAX_IMAGE_COUNT)
    .filter(isObject)
    .flatMap((image) => {
      const url = text(image.detail);
      return url ? [url] : [];
    });
}

function selectedSku($: CheerioAPI) {
  let result: string | null = null;

  $(".dp__tab__content__col").each((_, element) => {
    const label = $(element)
      .find(".dp__tab__content__label")
      .first()
      .text()
      .replace(/\s+/gu, " ")
      .trim();

    if (/^Kode SKU$/iu.test(label)) {
      result = text(
        $(element).find(".dp__tab__content__content").first().text(),
      );
    }
  });

  return result;
}

function mappedApplicationOffers(
  offers: readonly JakMallSourceOffer[],
  application: ApplicationProductData | null,
) {
  const axes = application ? Object.values(application.variants) : [];
  if (!application || axes.length !== 1 || offers.length === 0) return null;

  const axisName = text(axes[0].name);
  const options = stringRecord(axes[0].values);
  const optionEntries = Object.entries(options);
  const matrixEntries = Object.entries(application.matrix);
  const optionLabels = optionEntries.map(([, option]) => option);
  if (
    !axisName ||
    axisName.length > MAX_VARIANT_AXIS_NAME_LENGTH ||
    optionEntries.length === 0 ||
    optionEntries.length > MAX_VARIANT_OPTION_COUNT ||
    optionLabels.some((option) => option.length > MAX_VARIANT_OPTION_LENGTH) ||
    new Set(optionLabels).size !== optionLabels.length ||
    matrixEntries.length !== optionEntries.length ||
    optionEntries.some(
      ([optionId]) => !Object.hasOwn(application.matrix, optionId),
    )
  ) {
    return null;
  }

  const optionBySku = new Map<string, string>();
  for (const [optionId, sku] of matrixEntries) {
    const option = options[optionId];
    if (!option || optionBySku.has(sku)) return null;
    optionBySku.set(sku, option);
  }

  if (
    optionBySku.size !== offers.length ||
    offers.some((offer) => !offer.sku || !optionBySku.has(offer.sku))
  ) {
    return null;
  }

  return {
    offers: offers.map((offer) => ({
      ...offer,
      image:
        offer.image ?? detailImages(application.sku[offer.sku!])[0] ?? null,
      optionValues: { [axisName]: optionBySku.get(offer.sku!)! },
    })),
    variantAxes: [{ name: axisName, options: optionLabels }],
  };
}

function pageIdentityEvidence(
  $: CheerioAPI,
  product: JsonObject | null,
): readonly JakMallPageIdentityEvidence[] {
  const candidates: Array<{
    source: JakMallPageIdentityEvidence["source"];
    url: string | null;
  }> = [
    {
      source: "canonical",
      url: $("link[rel~=canonical]").first().attr("href") ?? null,
    },
    {
      source: "og_url",
      url: $('meta[property="og:url"]').first().attr("content") ?? null,
    },
    {
      source: "json_ld_product",
      url: product ? text(schemaValue(product, "url")) : null,
    },
  ];

  return candidates.flatMap(({ source, url }) => {
    if (!url) {
      return [];
    }

    const canonical = canonicalizeJakMallProductUrl(url);
    return [
      {
        canonicalUrl: canonical.ok ? canonical.url : null,
        source,
        url,
      },
    ];
  });
}

function verifiedIdentity(
  evidence: readonly JakMallPageIdentityEvidence[],
  expectedUrl: string,
) {
  const validEvidence = evidence.filter(
    (item): item is JakMallPageIdentityEvidence & { canonicalUrl: string } =>
      item.canonicalUrl !== null,
  );

  if (validEvidence.some((item) => item.canonicalUrl !== expectedUrl)) {
    return "mismatch" as const;
  }

  return validEvidence.length > 0;
}

function productFromJsonLd(
  product: JsonObject,
  objects: readonly JsonObject[],
  identity: JakMallSourceProduct["pageIdentity"],
): JakMallSourceProduct {
  const offerRoot = schemaValue(product, "offers");
  const offers = concreteOffers(offerRoot);
  const aggregate = isObject(offerRoot) ? offerRoot : null;
  const warnings = [
    ...(identity.verified ? [] : ["PAGE_IDENTITY_UNVERIFIED"]),
    ...(offers.length > 0 ? ["OFFER_OPTIONS_UNMAPPED"] : []),
  ];

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
            const category = text(value);
            return category ? [category] : [];
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
  };
}

function supplementStructuredProduct(
  $: CheerioAPI,
  product: JakMallSourceProduct,
  application: ApplicationProductData | null,
): JakMallSourceProduct {
  const description = semanticDescription($);
  const semanticEntries = Object.entries({
    ...semanticProductFacts($),
    ...semanticAttributes($),
  }).filter(([name, value]) => {
    if (product.brand && /^(?:brand|merek)$/iu.test(name.trim())) {
      return value.toLocaleLowerCase() === product.brand.toLocaleLowerCase();
    }

    const structuredHasWarranty = Object.keys(product.attributes).some((key) =>
      /^(?:garansi|warranty)$/iu.test(key.trim()),
    );
    return !(
      structuredHasWarranty && /^(?:garansi|warranty)$/iu.test(name.trim())
    );
  });
  const semantic = Object.fromEntries(semanticEntries);
  const dimensions = semanticDimensions(
    description,
    Math.max(1, product.offers.length),
  );
  const selected = selectedSku($);
  const selectedImages =
    selected && application ? detailImages(application.sku[selected]) : [];
  const offers = product.offers.map((offer) => ({
    ...offer,
    image:
      offer.image ??
      (offer.sku && application
        ? (detailImages(application.sku[offer.sku])[0] ?? null)
        : null),
  }));
  const mapped = mappedApplicationOffers(offers, application);

  return {
    ...product,
    attributes: { ...semantic, ...product.attributes },
    brand:
      product.brand ??
      Object.entries(semantic).find(([name]) =>
        /^(?:brand|merek)$/iu.test(name.trim()),
      )?.[1] ??
      null,
    description: product.description ?? description,
    dimensions: {
      height: product.dimensions.height ?? dimensions?.height ?? null,
      length: product.dimensions.length ?? dimensions?.length ?? null,
      width: product.dimensions.width ?? dimensions?.width ?? null,
    },
    images: [...new Set([...product.images, ...selectedImages])].slice(
      0,
      MAX_IMAGE_COUNT,
    ),
    offers: mapped?.offers ?? offers,
    sourceProductIdentifier:
      product.sourceProductIdentifier ?? application?.id ?? null,
    variantAxes:
      product.variantAxes.length > 0
        ? product.variantAxes
        : (mapped?.variantAxes ?? []),
    warnings: mapped
      ? product.warnings.filter(
          (warning) => warning !== "OFFER_OPTIONS_UNMAPPED",
        )
      : product.warnings,
  };
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
    Object.keys(product.attributes).length > 0,
  );
}

function productFromSemanticDom(
  $: CheerioAPI,
  identity: JakMallSourceProduct["pageIdentity"],
): JakMallSourceProduct | null {
  const title = $("h1").first().text().replace(/\s+/gu, " ").trim() || null;
  const categoryPath = semanticBreadcrumbPath($);
  const attributes = semanticAttributes($);
  const brand =
    Object.entries(attributes).find(([name]) =>
      /^(?:brand|merek)$/iu.test(name.trim()),
    )?.[1] ?? null;

  if (
    !title ||
    (categoryPath.length === 0 && Object.keys(attributes).length === 0)
  ) {
    return null;
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
  };
}

export function parseJakMallProductDocument(
  html: string,
  submittedUrl: string,
): JakMallParseResult {
  const canonicalUrl = canonicalizeJakMallProductUrl(submittedUrl);

  if (!canonicalUrl.ok || typeof html !== "string" || html.length === 0) {
    return { ok: false, error: "SOURCE_PARSE_FAILED" };
  }

  const $ = load(html);
  const pageTitle = $("title").text().trim();
  const bodyPrefix = $("body").text().slice(0, 10_000);

  if (
    /human verification|access denied/iu.test(pageTitle) ||
    /aws\s*waf[^]{0,500}captcha|captcha[^]{0,500}aws\s*waf/iu.test(bodyPrefix)
  ) {
    return { ok: false, error: "SOURCE_PARSE_FAILED" };
  }

  const objects = parseJsonLd($);
  const productNode =
    objects.find((object) => hasSchemaType(object, "Product")) ?? null;
  const evidence = pageIdentityEvidence($, productNode);
  const application = applicationProductData($, canonicalUrl.url);
  $("script,style,noscript").remove();
  const verification = verifiedIdentity(evidence, canonicalUrl.url);

  if (verification === "mismatch") {
    return { ok: false, error: "SOURCE_DOCUMENT_MISMATCH" };
  }

  const identity = { evidence, verified: verification === true };
  const product = productNode
    ? supplementStructuredProduct(
        $,
        productFromJsonLd(productNode, objects, identity),
        application,
      )
    : identity.verified
      ? productFromSemanticDom($, identity)
      : null;

  return product && hasUsefulProductSignal(product)
    ? { ok: true, product }
    : { ok: false, error: "SOURCE_PARSE_FAILED" };
}
