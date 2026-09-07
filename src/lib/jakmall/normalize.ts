import type {
  ImportedProductInput,
  ProductImageInput,
  ProductVariantInput,
} from "@/lib/supabase/persistence";

import type {
  JakMallSourceOffer,
  JakMallSourceProduct,
  JakMallSourceQuantity,
  JakMallSourceScalar,
} from "./types";

export const RAW_SOURCE_DATA_MAX_BYTES = 32 * 1024;

export type SourceAcquisitionMode = "assisted_html" | "live_url";

export type NormalizedJakMallImport = Readonly<{
  images: readonly ProductImageInput[];
  product: ImportedProductInput;
  variants: readonly ProductVariantInput[];
  warnings: readonly string[];
}>;

function cleanText(value: string | null | undefined) {
  if (!value) return null;

  const normalized = value
    .split(/\r?\n/u)
    .map((line) => line.replace(/[\t ]+/gu, " ").trim())
    .filter(Boolean)
    .join("\n");

  return normalized || null;
}

function normalizeMoney(value: JakMallSourceScalar | null) {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0 ? value : null;
  }

  const normalized = cleanText(value)?.toLowerCase().replace(/\s+/gu, "");

  if (!normalized || !/^(?:rp)?[0-9.,]+$/u.test(normalized)) return null;

  const numeric = normalized.replace(/^rp/u, "");
  const integerPart = numeric.includes(",")
    ? numeric.split(",", 1)[0]
    : numeric;
  const rupiah = Number(integerPart.replace(/\./gu, ""));

  return Number.isSafeInteger(rupiah) && rupiah >= 0 ? rupiah : null;
}

function normalizeStock(
  value: JakMallSourceScalar | null,
  availability: string | null,
) {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0 ? value : null;
  }

  const stock = cleanText(value);

  if (stock && /^\d+$/u.test(stock)) return Number(stock);

  const status = `${stock ?? ""} ${availability ?? ""}`.toLowerCase();
  return /outofstock|stok\s*habis|sold\s*out|tidak\s*tersedia/iu.test(status)
    ? 0
    : null;
}

function normalizeWeight(quantity: JakMallSourceQuantity | null) {
  if (!quantity) return null;

  const combined = `${quantity.value}${quantity.unit ?? ""}`
    .replace(/\s+/gu, "")
    .toLowerCase();
  const match = /^([0-9]+(?:[.,][0-9]+)?)(kg|g|gr|gram)$/u.exec(combined);

  if (!match) return null;

  const amount = Number(match[1].replace(",", "."));
  const grams = match[2] === "kg" ? amount * 1000 : amount;
  return Number.isFinite(grams) && grams >= 0 ? Math.round(grams) : null;
}

function normalizeDimension(quantity: JakMallSourceQuantity | null) {
  if (!quantity || quantity.unit?.trim().toLowerCase() !== "cm") return null;

  const value =
    typeof quantity.value === "number"
      ? quantity.value
      : Number(quantity.value.replace(",", "."));

  return Number.isFinite(value) && value >= 0 ? value : null;
}

function attributeValue(source: JakMallSourceProduct, pattern: RegExp) {
  return (
    Object.entries(source.attributes).find(([name]) =>
      pattern.test(name.trim()),
    )?.[1] ?? null
  );
}

function attributeWeight(source: JakMallSourceProduct) {
  const value = attributeValue(source, /^(?:berat|weight)$/iu);
  const match = value
    ? /^([0-9]+(?:[.,][0-9]+)?)\s*(kg|g|gr|gram)$/iu.exec(value.trim())
    : null;

  return match ? normalizeWeight({ value: match[1], unit: match[2] }) : null;
}

function attributeDimensions(source: JakMallSourceProduct) {
  const value = attributeValue(source, /^(?:dimensi|dimensions?)$/iu);
  const match = value
    ? /^([0-9]+(?:[.,][0-9]+)?)\s*x\s*([0-9]+(?:[.,][0-9]+)?)\s*x\s*([0-9]+(?:[.,][0-9]+)?)\s*cm$/iu.exec(
        value.trim(),
      )
    : null;

  if (!match) return { heightCm: null, lengthCm: null, widthCm: null };

  const [lengthCm, widthCm, heightCm] = match
    .slice(1)
    .map((part) => Number(part.replace(",", ".")));

  return { heightCm, lengthCm, widthCm };
}

function trustedImageUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      url.hostname === "static.jakmall.id"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function normalizedVariant(offer: JakMallSourceOffer, position: number) {
  return {
    imageSourceUrl: trustedImageUrl(offer.image),
    optionValues: { ...offer.optionValues },
    position,
    sellingPrice: null,
    sku: cleanText(offer.sku),
    sourcePrice: normalizeMoney(offer.sourcePrice),
    sourceVariantIdentifier: cleanText(offer.sourceVariantIdentifier),
    stock: normalizeStock(offer.stock, offer.availability),
  } satisfies ProductVariantInput;
}

function curatedRawSourceData(input: {
  acquisitionMode: SourceAcquisitionMode;
  canonicalSourceUrl: string;
  documentByteLength: number;
  source: JakMallSourceProduct;
}) {
  const { source } = input;
  const rawSourceData = {
    acquisitionMode: input.acquisitionMode,
    canonicalSourceUrl: input.canonicalSourceUrl,
    categoryPath: source.categoryPath.slice(0, 12),
    counts: {
      attributes: Object.keys(source.attributes).length,
      images: source.images.length,
      offers: source.offers.length,
      variantAxes: source.variantAxes.length,
    },
    documentByteLength: input.documentByteLength,
    fieldPresence: {
      brand: source.brand !== null,
      description: source.description !== null,
      gtin: source.gtin !== null,
      price: source.sourcePrice !== null,
      sku: source.sku !== null,
      title: source.title !== null,
    },
    pageIdentity: {
      evidence: source.pageIdentity.evidence.slice(0, 5).map((item) => ({
        canonicalUrl: item.canonicalUrl,
        source: item.source,
      })),
      verified: source.pageIdentity.verified,
    },
    parserStrategy: source.parserStrategy,
    selectedPublicOfferFields: source.offers.slice(0, 20).map((offer) => ({
      availability: cleanText(offer.availability),
      hasOptionValues: Object.keys(offer.optionValues).length > 0,
      pricePresent: offer.sourcePrice !== null,
      sku: cleanText(offer.sku),
    })),
    warnings: source.warnings
      .slice(0, 20)
      .map((warning) => warning.slice(0, 200)),
  };

  if (
    Buffer.byteLength(JSON.stringify(rawSourceData), "utf8") <=
    RAW_SOURCE_DATA_MAX_BYTES
  ) {
    return rawSourceData;
  }

  return {
    acquisitionMode: input.acquisitionMode,
    counts: rawSourceData.counts,
    fieldPresence: rawSourceData.fieldPresence,
    parserStrategy: source.parserStrategy,
    rawSourceDataTruncated: true,
    warnings: ["RAW_SOURCE_DATA_TRUNCATED"],
  };
}

export function normalizeJakMallSourceProduct(
  source: JakMallSourceProduct,
  context: {
    acquisitionMode: SourceAcquisitionMode;
    canonicalSourceUrl: string;
    documentByteLength: number;
  },
): NormalizedJakMallImport {
  const fallbackDimensions = attributeDimensions(source);
  const acceptedImages = source.images
    .map(trustedImageUrl)
    .filter((url): url is string => url !== null)
    .filter((url, index, urls) => urls.indexOf(url) === index);
  const categoryPath = source.categoryPath.filter(
    (category, index) =>
      !/^home$/iu.test(category) &&
      !(index === source.categoryPath.length - 1 && category === source.title),
  );

  return {
    images: acceptedImages.map((sourceUrl, position) => ({
      isPrimary: position === 0,
      kind: "product",
      position,
      sourceUrl,
    })),
    product: {
      attributes: { ...source.attributes },
      brand: cleanText(source.brand),
      description: cleanText(source.description),
      gtin: cleanText(source.gtin),
      heightCm:
        normalizeDimension(source.dimensions.height) ??
        fallbackDimensions.heightCm,
      lengthCm:
        normalizeDimension(source.dimensions.length) ??
        fallbackDimensions.lengthCm,
      rawSourceData: curatedRawSourceData({ ...context, source }),
      sellingPrice: null,
      sku: cleanText(source.sku),
      sourceCategory: categoryPath.length > 0 ? categoryPath.join(" > ") : null,
      sourcePrice: normalizeMoney(source.sourcePrice),
      status: "REVIEW_REQUIRED",
      stock: normalizeStock(source.stock, source.availability),
      title: cleanText(source.title),
      variantAxes: source.variantAxes.map((axis) => ({
        name: axis.name,
        options: [...axis.options],
      })),
      weightGrams: normalizeWeight(source.weight) ?? attributeWeight(source),
      widthCm:
        normalizeDimension(source.dimensions.width) ??
        fallbackDimensions.widthCm,
    },
    variants: source.offers.map(normalizedVariant),
    warnings: [...source.warnings],
  };
}
