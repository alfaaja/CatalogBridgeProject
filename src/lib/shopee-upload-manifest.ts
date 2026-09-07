import { z } from "zod";

import type { ProductReview } from "./product-review";
import type { ShopeeHandoffManifest } from "./shopee-handoff";

const boundedText = (limit: number) => z.string().trim().min(1).max(limit);
const optionalText = (limit: number) => boundedText(limit).nullable();
const nonnegativeInteger = z.number().int().nonnegative();
const positiveNumber = z.number().finite().positive();
const trustedImageUrl = z.url().refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === "https:" &&
    url.hostname === "static.jakmall.id" &&
    !url.username &&
    !url.password &&
    !url.port
  );
});

const attributeSchema = z
  .object({ name: boundedText(100), value: boundedText(500) })
  .strict();
const axisSchema = z
  .object({
    name: boundedText(200),
    options: z.array(boundedText(500)).min(1).max(100),
  })
  .strict();
const variantSchema = z
  .object({
    imageUrl: trustedImageUrl.nullable(),
    optionValues: z.record(boundedText(200), boundedText(500)),
    sellingPriceIdr: positiveNumber,
    sku: optionalText(500),
    stock: nonnegativeInteger,
  })
  .strict();
const offerSchema = z.discriminatedUnion("mode", [
  z
    .object({
      mode: z.literal("BASE_LISTING"),
      sellingPriceIdr: positiveNumber,
      sku: optionalText(500),
      sourceMode: z.enum(["BASE_VARIANT", "PRODUCT"]),
      stock: nonnegativeInteger,
    })
    .strict(),
  z
    .object({
      axes: z.array(axisSchema).min(1).max(5),
      mode: z.literal("VARIATIONS"),
      variants: z.array(variantSchema).min(1).max(100),
    })
    .strict(),
]);

export const shopeeUploadManifestSchema = z
  .object({
    attributes: z.array(attributeSchema).max(50),
    brand: optionalText(500),
    category: z
      .object({ id: optionalText(200), path: boundedText(500) })
      .strict(),
    declarations: z
      .object({
        condition: z.enum(["NEW", "USED"]),
        dangerousProduct: z.enum(["NO", "YES"]),
        preorder: z.enum(["NO", "YES"]),
      })
      .strict(),
    description: boundedText(3_000),
    externalChecks: z
      .object({
        notes: z.array(boundedText(500)).max(20),
        shippingServices: z.literal("SELLER_CENTRE_REQUIRED"),
        unsupported: z.array(boundedText(100)).max(20),
      })
      .strict(),
    generatedAt: z.iso.datetime({ offset: true }),
    gtin: z.discriminatedUnion("mode", [
      z.object({ mode: z.literal("NOT_AVAILABLE") }).strict(),
      z
        .object({ mode: z.literal("PROVIDED"), value: boundedText(500) })
        .strict(),
    ]),
    images: z
      .array(
        z
          .object({
            isPrimary: z.boolean(),
            position: nonnegativeInteger,
            url: trustedImageUrl,
          })
          .strict(),
      )
      .min(1)
      .max(9),
    offer: offerSchema,
    physical: z
      .object({
        dimensionsCm: z
          .object({
            height: positiveNumber.nullable(),
            length: positiveNumber.nullable(),
            width: positiveNumber.nullable(),
          })
          .strict(),
        weightGrams: positiveNumber,
      })
      .strict(),
    productId: z.uuid(),
    readyRevision: z.iso.datetime({ offset: true }),
    schemaVersion: z.literal(1),
    snapshotFingerprint: z.string().regex(/^[a-f0-9]{64}$/u),
    title: boundedText(255),
  })
  .strict();

export type ShopeeUploadManifest = Readonly<
  z.infer<typeof shopeeUploadManifestSchema>
>;

type UploadManifestResult =
  | Readonly<{ manifest: ShopeeUploadManifest; ok: true }>
  | Readonly<{ error: "INVALID_UPLOAD_MANIFEST"; ok: false }>;

export function parseShopeeUploadManifest(
  value: unknown,
): UploadManifestResult {
  const parsed = shopeeUploadManifestSchema.safeParse(value);
  return parsed.success
    ? { manifest: parsed.data, ok: true }
    : { error: "INVALID_UPLOAD_MANIFEST", ok: false };
}

export function buildShopeeUploadManifest(
  product: ProductReview,
  handoff: ShopeeHandoffManifest,
): UploadManifestResult {
  if (
    product.status !== "READY" ||
    product.id !== handoff.productId ||
    product.updatedAt.trim().length === 0
  ) {
    return { error: "INVALID_UPLOAD_MANIFEST", ok: false };
  }

  return parseShopeeUploadManifest({
    attributes: handoff.attributes.map((attribute) => ({ ...attribute })),
    brand: handoff.brand,
    category: { ...handoff.category },
    declarations: { ...handoff.declarations },
    description: handoff.description,
    externalChecks: {
      notes: [...handoff.externalChecks.notes],
      shippingServices: handoff.externalChecks.shippingServices,
      unsupported: [...handoff.externalChecks.unsupported],
    },
    generatedAt: handoff.generatedAt,
    gtin: product.gtin
      ? { mode: "PROVIDED", value: product.gtin }
      : { mode: "NOT_AVAILABLE" },
    images: handoff.images.map((image) => ({ ...image })),
    offer:
      handoff.offer.mode === "BASE_LISTING"
        ? { ...handoff.offer }
        : {
            axes: handoff.offer.axes.map((axis) => ({
              name: axis.name,
              options: [...axis.options],
            })),
            mode: handoff.offer.mode,
            variants: handoff.offer.variants.map((variant) => ({
              ...variant,
              optionValues: { ...variant.optionValues },
            })),
          },
    physical: {
      dimensionsCm: { ...handoff.physical.dimensionsCm },
      weightGrams: handoff.physical.weightGrams,
    },
    productId: handoff.productId,
    readyRevision: product.updatedAt,
    schemaVersion: 1,
    snapshotFingerprint: handoff.snapshotFingerprint,
    title: handoff.title,
  });
}
