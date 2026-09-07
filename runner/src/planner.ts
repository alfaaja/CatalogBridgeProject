import { RunnerError } from "./errors.js";
import type { UploadManifest } from "./manifest.js";

export type ListingPlan = Readonly<{
  attributes: UploadManifest["attributes"];
  brand: string | null;
  categoryPath: string;
  declarations: UploadManifest["declarations"];
  description: string;
  dimensionsCm: UploadManifest["physical"]["dimensionsCm"];
  gtin: UploadManifest["gtin"];
  images: readonly string[];
  kind: UploadManifest["offer"]["mode"];
  price: number | null;
  sku: string | null;
  stock: number | null;
  title: string;
  weightGrams: number;
}>;

export function buildListingPlan(manifest: UploadManifest): ListingPlan {
  return {
    attributes: manifest.attributes.map((attribute) => ({ ...attribute })),
    brand: manifest.brand,
    categoryPath: manifest.category.path,
    declarations: { ...manifest.declarations },
    description: manifest.description,
    dimensionsCm: { ...manifest.physical.dimensionsCm },
    gtin: { ...manifest.gtin },
    images: manifest.images
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((image) => image.url),
    kind: manifest.offer.mode,
    price:
      manifest.offer.mode === "BASE_LISTING"
        ? manifest.offer.sellingPriceIdr
        : null,
    sku: manifest.offer.mode === "BASE_LISTING" ? manifest.offer.sku : null,
    stock: manifest.offer.mode === "BASE_LISTING" ? manifest.offer.stock : null,
    title: manifest.title,
    weightGrams: manifest.physical.weightGrams,
  };
}

function normalizePath(value: string) {
  return value
    .split(">")
    .map((part) => part.trim().replace(/\s+/gu, " "))
    .join(" > ");
}

export function findExactCategoryPath(
  expected: string,
  available: readonly string[],
) {
  const wanted = normalizePath(expected);
  return available.find((path) => normalizePath(path) === wanted) ?? null;
}

function optionKey(value: Readonly<Record<string, string>>) {
  return Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, option]) => `${name}\u0000${option}`)
    .join("\u0001");
}

export function validateVariationAssociation(
  expected: readonly Readonly<Record<string, string>>[],
  sellerRows: readonly Readonly<Record<string, string>>[],
) {
  const expectedKeys = expected.map(optionKey);
  const sellerKeys = sellerRows.map(optionKey);
  return (
    new Set(expectedKeys).size === expectedKeys.length &&
    new Set(sellerKeys).size === sellerKeys.length &&
    expectedKeys.length === sellerKeys.length &&
    expectedKeys.every((key) => sellerKeys.includes(key))
  );
}

export function assertShippingReady(
  availableServiceCount: number,
  formBlocksArchive: boolean,
) {
  if (availableServiceCount < 1 || formBlocksArchive) {
    throw new RunnerError(
      "SHIPPING_CONFIGURATION_REQUIRED",
      "Seller shipping configuration requires reviewer action.",
    );
  }
}
