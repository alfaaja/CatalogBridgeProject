import { z } from "zod";

const text = (limit: number) => z.string().trim().min(1).max(limit);
const optionalText = (limit: number) => text(limit).nullable();
const integer = z.number().int().nonnegative();
const positive = z.number().finite().positive();
const trustedImage = z.url().refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === "https:" &&
    url.hostname === "static.jakmall.id" &&
    !url.username &&
    !url.password &&
    !url.port
  );
});

const axis = z
  .object({ name: text(200), options: z.array(text(500)).min(1).max(100) })
  .strict();
const variant = z
  .object({
    imageUrl: trustedImage.nullable(),
    optionValues: z.record(text(200), text(500)),
    sellingPriceIdr: positive,
    sku: optionalText(500),
    stock: integer,
  })
  .strict();

export const manifestSchema = z
  .object({
    attributes: z
      .array(z.object({ name: text(100), value: text(500) }).strict())
      .max(50),
    brand: optionalText(500),
    category: z.object({ id: optionalText(200), path: text(500) }).strict(),
    declarations: z
      .object({
        condition: z.enum(["NEW", "USED"]),
        dangerousProduct: z.enum(["NO", "YES"]),
        preorder: z.enum(["NO", "YES"]),
      })
      .strict(),
    description: text(3_000),
    externalChecks: z
      .object({
        notes: z.array(text(500)).max(20),
        shippingServices: z.literal("SELLER_CENTRE_REQUIRED"),
        unsupported: z.array(text(100)).max(20),
      })
      .strict(),
    generatedAt: z.iso.datetime({ offset: true }),
    gtin: z.discriminatedUnion("mode", [
      z.object({ mode: z.literal("NOT_AVAILABLE") }).strict(),
      z.object({ mode: z.literal("PROVIDED"), value: text(500) }).strict(),
    ]),
    images: z
      .array(
        z
          .object({
            isPrimary: z.boolean(),
            position: integer,
            url: trustedImage,
          })
          .strict(),
      )
      .min(1)
      .max(9),
    offer: z.discriminatedUnion("mode", [
      z
        .object({
          mode: z.literal("BASE_LISTING"),
          sellingPriceIdr: positive,
          sku: optionalText(500),
          sourceMode: z.enum(["BASE_VARIANT", "PRODUCT"]),
          stock: integer,
        })
        .strict(),
      z
        .object({
          axes: z.array(axis).min(1).max(5),
          mode: z.literal("VARIATIONS"),
          variants: z.array(variant).min(1).max(100),
        })
        .strict(),
    ]),
    physical: z
      .object({
        dimensionsCm: z
          .object({
            height: positive.nullable(),
            length: positive.nullable(),
            width: positive.nullable(),
          })
          .strict(),
        weightGrams: positive,
      })
      .strict(),
    productId: z.uuid(),
    readyRevision: z.iso.datetime({ offset: true }),
    schemaVersion: z.literal(1),
    snapshotFingerprint: z.string().regex(/^[a-f0-9]{64}$/u),
    title: text(255),
  })
  .strict();

export type UploadManifest = Readonly<z.infer<typeof manifestSchema>>;

export function parseManifest(value: unknown): UploadManifest {
  return manifestSchema.parse(value);
}
