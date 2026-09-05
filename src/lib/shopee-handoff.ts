import { createHash } from "node:crypto";

import { formatIdr } from "./product-presentation";
import type { ProductReview } from "./product-review";
import type { ShopeePreview } from "./shopee-draft";

export type ShopeeHandoffAttribute = Readonly<{
  name: string;
  value: string;
}>;

export type ShopeeHandoffOffer =
  | Readonly<{
      mode: "BASE_LISTING";
      sellingPriceIdr: number;
      sku: string | null;
      sourceMode: "BASE_VARIANT" | "PRODUCT";
      stock: number;
    }>
  | Readonly<{
      axes: readonly Readonly<{
        name: string;
        options: readonly string[];
      }>[];
      mode: "VARIATIONS";
      variants: readonly Readonly<{
        imageUrl: string | null;
        optionValues: Readonly<Record<string, string>>;
        sellingPriceIdr: number;
        sku: string | null;
        stock: number;
      }>[];
    }>;

export type ShopeeHandoffManifest = Readonly<{
  attributes: readonly ShopeeHandoffAttribute[];
  brand: string | null;
  category: Readonly<{ id: string | null; path: string }>;
  declarations: Readonly<{
    condition: "NEW" | "USED";
    dangerousProduct: "NO" | "YES";
    preorder: "NO" | "YES";
  }>;
  description: string;
  externalChecks: Readonly<{
    notes: readonly string[];
    shippingServices: "SELLER_CENTRE_REQUIRED";
    unsupported: readonly string[];
  }>;
  generatedAt: string;
  images: readonly Readonly<{
    isPrimary: boolean;
    position: number;
    url: string;
  }>[];
  offer: ShopeeHandoffOffer;
  physical: Readonly<{
    dimensionsCm: Readonly<{
      height: number | null;
      length: number | null;
      width: number | null;
    }>;
    weightGrams: number;
  }>;
  productId: string;
  schemaVersion: 1;
  snapshotFingerprint: string;
  title: string;
}>;

export type ShopeeHandoffBuildResult =
  | Readonly<{ manifest: ShopeeHandoffManifest; ok: true }>
  | Readonly<{
      error: "HANDOFF_BLOCKED" | "HANDOFF_STATE_INVALID" | "PRODUCT_NOT_READY";
      ok: false;
    }>;

type HandoffPayload = Omit<
  ShopeeHandoffManifest,
  "generatedAt" | "snapshotFingerprint"
>;

const unsupportedControls = [
  "Promotional image",
  "Video",
  "Wholesale",
  "Purchase limits",
  "Insurance",
  "Display schedule",
] as const;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, canonicalize(nested)]),
  );
}

function fingerprint(readinessRevision: string, payload: HandoffPayload) {
  return createHash("sha256")
    .update(
      JSON.stringify(
        canonicalize({
          handoffPayload: payload,
          readinessRevision,
          schemaVersion: payload.schemaVersion,
        }),
      ),
    )
    .digest("hex");
}

function buildOffer(
  product: ProductReview,
  preview: ShopeePreview,
): ShopeeHandoffOffer | null {
  const offer = preview.offer;
  if (offer.mode === "BLOCKED") return null;

  if (offer.mode === "VARIATIONS") {
    const variants = offer.variants.map((variant) => {
      if (variant.sellingPrice === null || variant.stock === null) return null;
      return {
        imageUrl: variant.imageSourceUrl,
        optionValues: { ...variant.optionValues },
        sellingPriceIdr: variant.sellingPrice,
        sku: variant.sku,
        stock: variant.stock,
      };
    });
    if (variants.some((variant) => variant === null)) return null;

    return {
      axes: product.variantAxes.map((axis) => ({
        name: axis.name,
        options: [...axis.options],
      })),
      mode: "VARIATIONS",
      variants: variants.filter((variant) => variant !== null),
    };
  }

  if (offer.sellingPrice === null || offer.stock === null) return null;
  return {
    mode: "BASE_LISTING",
    sellingPriceIdr: offer.sellingPrice,
    sku: offer.sku,
    sourceMode: offer.mode,
    stock: offer.stock,
  };
}

export function buildShopeeHandoffManifest({
  generatedAt,
  preview,
  product,
}: Readonly<{
  generatedAt: string;
  preview: ShopeePreview;
  product: ProductReview;
}>): ShopeeHandoffBuildResult {
  if (product.status !== "READY")
    return { error: "PRODUCT_NOT_READY", ok: false };
  if (preview.issues.some((issue) => issue.severity === "blocker"))
    return { error: "HANDOFF_BLOCKED", ok: false };

  const draft = preview.draft;
  const offer = buildOffer(product, preview);
  if (
    !draft ||
    draft.productId !== product.id ||
    !preview.title ||
    !preview.description ||
    !draft.categoryPath ||
    draft.condition === "UNCONFIRMED" ||
    draft.dangerousProduct === "UNCONFIRMED" ||
    draft.preorder === "UNCONFIRMED" ||
    product.weightGrams === null ||
    !offer
  ) {
    return { error: "HANDOFF_STATE_INVALID", ok: false };
  }

  const payload: HandoffPayload = {
    attributes: draft.categoryAttributes.map((attribute) => ({ ...attribute })),
    brand: product.brand,
    category: { id: draft.categoryId, path: draft.categoryPath },
    declarations: {
      condition: draft.condition,
      dangerousProduct: draft.dangerousProduct,
      preorder: draft.preorder,
    },
    description: preview.description,
    externalChecks: {
      notes: [...preview.handoffNotes],
      shippingServices: "SELLER_CENTRE_REQUIRED",
      unsupported: [...unsupportedControls],
    },
    images: preview.images.map((image) => ({
      isPrimary: image.isPrimary,
      position: image.position,
      url: image.sourceUrl,
    })),
    offer,
    physical: {
      dimensionsCm: { ...product.dimensionsCm },
      weightGrams: product.weightGrams,
    },
    productId: product.id,
    schemaVersion: 1,
    title: preview.title,
  };

  return {
    manifest: {
      ...payload,
      generatedAt,
      snapshotFingerprint: fingerprint(product.updatedAt, payload),
    },
    ok: true,
  };
}

function formatAttributes(attributes: readonly ShopeeHandoffAttribute[]) {
  return attributes.length === 0
    ? "None recorded"
    : attributes
        .map((attribute) => `${attribute.name}: ${attribute.value}`)
        .join("\n");
}

function formatOffer(offer: ShopeeHandoffOffer) {
  const formatCompactIdr = (value: number) =>
    formatIdr(value).replace(/\s/gu, "");

  if (offer.mode === "BASE_LISTING") {
    return [
      "Listing structure: Base listing",
      `Selling price: ${formatCompactIdr(offer.sellingPriceIdr)}`,
      `Stock: ${offer.stock}`,
      `SKU: ${offer.sku ?? "Not provided"}`,
    ].join("\n");
  }

  return [
    `Listing structure: ${offer.variants.length} variations`,
    ...offer.variants.map(
      (variant, index) =>
        `Variation ${index + 1}: ${Object.entries(variant.optionValues)
          .map(([name, value]) => `${name}=${value}`)
          .join(
            ", ",
          )} | ${formatCompactIdr(variant.sellingPriceIdr)} | stock ${variant.stock} | SKU ${variant.sku ?? "Not provided"}`,
    ),
  ].join("\n");
}

export function formatShopeeHandoffSummary(
  manifest: ShopeeHandoffManifest,
): string {
  const dimensions = manifest.physical.dimensionsCm;
  const dimensionText =
    dimensions.length !== null &&
    dimensions.width !== null &&
    dimensions.height !== null
      ? `${dimensions.length} × ${dimensions.width} × ${dimensions.height} cm`
      : "Complete in Seller Centre if required";

  return [
    "CatalogBridge Handoff Package",
    `Snapshot: ${manifest.snapshotFingerprint}`,
    "",
    `Title: ${manifest.title}`,
    `Description: ${manifest.description}`,
    `Brand: ${manifest.brand ?? "Not provided"}`,
    `Category selection guide: ${manifest.category.path}`,
    `Category ID: ${manifest.category.id ?? "Not known"}`,
    "",
    "Attributes:",
    formatAttributes(manifest.attributes),
    "",
    formatOffer(manifest.offer),
    "",
    `Weight: ${manifest.physical.weightGrams} g`,
    `Dimensions: ${dimensionText}`,
    `Dangerous product: ${manifest.declarations.dangerousProduct}`,
    `Condition: ${manifest.declarations.condition}`,
    `Preorder: ${manifest.declarations.preorder}`,
    "",
    "Images:",
    ...manifest.images.map((image) => image.url),
    "",
    "Shipping services: Check in Seller Centre",
    `Unsupported in this PoC: ${manifest.externalChecks.unsupported.join(", ")}`,
  ].join("\n");
}
