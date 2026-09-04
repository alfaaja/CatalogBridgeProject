import { z } from "zod"

const sensitiveKeyParts = new Set([
  "apikey",
  "authorization",
  "cookie",
  "credential",
  "jwt",
  "password",
  "secret",
  "session",
  "token",
])

function containsSensitiveKey(value: unknown): boolean {
  if (
    typeof value === "string" &&
    /(?:authorization|cookie|set-cookie)\s*:|\bbearer\s+\S+|\bsb_secret_/iu.test(
      value
    )
  ) {
    return true
  }

  if (Array.isArray(value)) {
    return value.some(containsSensitiveKey)
  }

  if (!value || typeof value !== "object") {
    return false
  }

  return Object.entries(value).some(([key, nestedValue]) => {
    const normalizedKey = key
      .replace(/([a-z0-9])([A-Z])/gu, "$1_$2")
      .toLowerCase()
    const keyParts = normalizedKey.split(/[^a-z0-9]+/u)

    return (
      /(?:^|_)(?:api|access|private|publishable|service_role)_?key(?:_|$)/u.test(
        normalizedKey
      ) ||
      keyParts.some((part) => sensitiveKeyParts.has(part)) ||
      containsSensitiveKey(nestedValue)
    )
  })
}

const jsonObjectSchema = z.record(z.string(), z.json())

const safeJsonObjectSchema = jsonObjectSchema
  .refine((value) => !containsSensitiveKey(value), {
    message: "Sensitive request or session data is not allowed.",
  })

const httpsUrlSchema = z
  .string()
  .trim()
  .pipe(z.url())
  .refine((value) => new URL(value).protocol === "https:", {
    message: "An HTTPS URL is required.",
  })

const jakMallUrlSchema = httpsUrlSchema.refine((value) => {
  const url = new URL(value)

  return (
    !url.username &&
    !url.password &&
    !url.port &&
    (url.hostname === "jakmall.com" || url.hostname.endsWith(".jakmall.com"))
  )
}, "A JakMall HTTPS URL is required.")

const nullableTextSchema = z.string().trim().min(1).max(100_000).nullable()
const nullableIdentifierSchema = z.string().trim().min(1).max(500).nullable()
const nullableMoneySchema = z.number().int().nonnegative().nullable()
const nullableDimensionSchema = z.number().finite().nonnegative().nullable()
const safeLogMessageSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine((value) => !containsSensitiveKey(value), {
    message: "Credential-like log content is not allowed.",
  })

export const pendingProductSchema = z
  .object({
    canonicalSourceUrl: jakMallUrlSchema,
    sourceProductIdentifier: nullableIdentifierSchema,
    title: z.string().trim().min(1).max(500).nullable(),
  })
  .strict()

export const importedProductSchema = z
  .object({
    title: z.string().trim().min(1).max(500).nullable(),
    description: nullableTextSchema,
    sourcePrice: nullableMoneySchema,
    sellingPrice: nullableMoneySchema,
    sku: nullableIdentifierSchema,
    gtin: nullableIdentifierSchema,
    stock: z.number().int().nonnegative().nullable(),
    sourceCategory: nullableIdentifierSchema,
    brand: nullableIdentifierSchema,
    weightGrams: z.number().int().nonnegative().nullable(),
    lengthCm: nullableDimensionSchema,
    widthCm: nullableDimensionSchema,
    heightCm: nullableDimensionSchema,
    attributes: jsonObjectSchema,
    variantAxes: z.array(
      z
        .object({
          name: z.string().trim().min(1).max(200),
          options: z.array(z.string().trim().min(1).max(500)),
        })
        .strict()
    ),
    rawSourceData: safeJsonObjectSchema,
    status: z.enum(["REVIEW_REQUIRED", "READY"]),
  })
  .strict()

export const productFailureSchema = z
  .object({
    productId: z.uuid(),
    errorCode: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[A-Z][A-Z0-9_]*$/u),
    errorMessage: safeLogMessageSchema,
  })
  .strict()

export const productImageSchema = z
  .object({
    sourceUrl: httpsUrlSchema,
    position: z.number().int().nonnegative(),
    isPrimary: z.boolean(),
    kind: z.enum(["product", "promotional"]),
  })
  .strict()

export const productVariantSchema = z
  .object({
    sourceVariantIdentifier: nullableIdentifierSchema,
    position: z.number().int().nonnegative(),
    optionValues: jsonObjectSchema,
    sourcePrice: nullableMoneySchema,
    sellingPrice: nullableMoneySchema,
    stock: z.number().int().nonnegative().nullable(),
    sku: nullableIdentifierSchema,
    imageSourceUrl: httpsUrlSchema.nullable(),
  })
  .strict()

export const processLogSchema = z
  .object({
    productId: z.uuid(),
    stage: z.string().trim().min(1).max(100).regex(/^[a-z][a-z0-9_]*$/u),
    status: z.enum(["started", "success", "warning", "failed"]),
    message: safeLogMessageSchema,
    details: safeJsonObjectSchema,
  })
  .strict()

export type PendingProductInput = z.infer<typeof pendingProductSchema>
export type ImportedProductInput = z.infer<typeof importedProductSchema>
export type ProductImageInput = z.infer<typeof productImageSchema>
export type ProductVariantInput = z.infer<typeof productVariantSchema>
export type ProcessLogInput = z.infer<typeof processLogSchema>
