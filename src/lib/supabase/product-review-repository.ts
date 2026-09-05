import { z } from "zod"

import type {
  ProductReview,
  ProductReviewEditInput,
  VariantReviewEditInput,
} from "@/lib/product-review"
import { canonicalizeJakMallProductUrl } from "@/lib/jakmall/url"

import { createClient } from "./server"

export const PRODUCT_REVIEW_PRODUCT_SELECT =
  "id,source_platform,canonical_source_url,source_product_identifier,title,description,source_price,selling_price,currency_code,sku,gtin,stock,source_category,brand,weight_grams,length_cm,width_cm,height_cm,attributes,variant_axes,raw_source_data,status,error_code,error_message,created_at,updated_at"
export const PRODUCT_REVIEW_IMAGE_SELECT =
  "id,source_url,position,is_primary,kind"
export const PRODUCT_REVIEW_VARIANT_SELECT =
  "id,product_id,source_variant_identifier,position,option_values,source_price,selling_price,stock,sku,image_source_url,updated_at"
export const PRODUCT_REVIEW_LOG_SELECT =
  "id,stage,status,message,details,created_at"

const nullableMoney = z.number().nonnegative().nullable()
const nullableInteger = z.number().int().nonnegative().nullable()
const nullableDimension = z.number().finite().nonnegative().nullable()
const jsonObject = z.record(z.string(), z.json())
const isoTimestamp = z.iso.datetime({ offset: true })
const jakMallSourceUrl = z.string().refine((value) => {
  const canonical = canonicalizeJakMallProductUrl(value)
  return canonical.ok && canonical.url === value
}, "A canonical JakMall product URL is required.")

const productRowSchema = z
  .object({
    attributes: jsonObject,
    brand: z.string().nullable(),
    canonical_source_url: jakMallSourceUrl,
    created_at: isoTimestamp,
    currency_code: z.literal("IDR"),
    description: z.string().nullable(),
    error_code: z.string().nullable(),
    error_message: z.string().nullable(),
    gtin: z.string().nullable(),
    height_cm: nullableDimension,
    id: z.uuid(),
    length_cm: nullableDimension,
    raw_source_data: jsonObject,
    selling_price: nullableMoney,
    sku: z.string().nullable(),
    source_category: z.string().nullable(),
    source_platform: z.literal("jakmall"),
    source_price: nullableMoney,
    source_product_identifier: z.string().nullable(),
    status: z.enum([
      "PENDING",
      "IMPORTING",
      "REVIEW_REQUIRED",
      "READY",
      "FAILED",
    ]),
    stock: nullableInteger,
    title: z.string().nullable(),
    updated_at: isoTimestamp,
    variant_axes: z.array(
      z
        .object({
          name: z.string(),
          options: z.array(z.string()),
        })
        .strict()
    ),
    weight_grams: nullableInteger,
    width_cm: nullableDimension,
  })
  .strict()
  .superRefine((product, context) => {
    if (
      product.status === "FAILED" &&
      (!product.error_code?.trim() || !product.error_message?.trim())
    ) {
      context.addIssue({
        code: "custom",
        message: "A failed product must include safe failure details.",
      })
    }

    if (
      product.status !== "FAILED" &&
      (product.error_code !== null || product.error_message !== null)
    ) {
      context.addIssue({
        code: "custom",
        message: "Only failed products may include failure details.",
      })
    }
  })

const trustedImageUrl = z.url().refine((value) => {
  const url = new URL(value)
  return (
    url.protocol === "https:" &&
    url.hostname === "static.jakmall.id" &&
    !url.username &&
    !url.password &&
    !url.port
  )
}, "A trusted JakMall image URL is required.")

const imageRowSchema = z
  .object({
    id: z.uuid(),
    is_primary: z.boolean(),
    kind: z.enum(["product", "promotional"]),
    position: z.number().int().nonnegative(),
    source_url: trustedImageUrl,
  })
  .strict()

const variantRowSchema = z
  .object({
    id: z.uuid(),
    image_source_url: trustedImageUrl.nullable(),
    option_values: z.record(z.string(), z.string()),
    position: z.number().int().nonnegative(),
    product_id: z.uuid(),
    selling_price: nullableMoney,
    sku: z.string().nullable(),
    source_price: nullableMoney,
    source_variant_identifier: z.string().nullable(),
    stock: nullableInteger,
    updated_at: isoTimestamp,
  })
  .strict()

const logRowSchema = z
  .object({
    created_at: isoTimestamp,
    details: jsonObject,
    id: z.uuid(),
    message: z.string().min(1).max(500),
    stage: z.string().min(1).max(100),
    status: z.enum(["started", "success", "warning", "failed"]),
  })
  .strict()

const updatedIdSchema = z.object({ id: z.uuid() }).strict()

const productPatchSchema = z
  .object({
    brand: z.string().trim().min(1).max(500).nullable(),
    description: z.string().trim().min(1).max(100_000).nullable(),
    gtin: z.string().trim().min(1).max(500).nullable(),
    heightCm: nullableDimension,
    lengthCm: nullableDimension,
    sellingPrice: nullableMoney,
    sku: z.string().trim().min(1).max(500).nullable(),
    stock: nullableInteger,
    title: z.string().trim().min(1).max(500).nullable(),
    weightGrams: nullableInteger,
    widthCm: nullableDimension,
  })
  .partial()
  .strict()
  .refine((patch) => Object.keys(patch).length > 0)

const variantPatchSchema = z
  .object({
    sellingPrice: nullableMoney,
    sku: z.string().trim().min(1).max(500).nullable(),
    stock: nullableInteger,
  })
  .partial()
  .strict()
  .refine((patch) => Object.keys(patch).length > 0)

export type ProductReviewPatch = Partial<
  Omit<ProductReviewEditInput, "productId">
>
export type VariantReviewPatch = Partial<
  Omit<VariantReviewEditInput, "productId" | "variantId">
>

export type ProductReviewResult =
  | Readonly<{ ok: true; product: ProductReview }>
  | Readonly<{
      ok: false
      error: "DATABASE_READ_FAILED" | "PRODUCT_NOT_FOUND"
    }>

type ReviewWriteResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false
      error: "DATABASE_WRITE_FAILED" | "INVALID_REVIEW_INPUT"
    }>

function mapProductReview(
  product: z.infer<typeof productRowSchema>,
  images: readonly z.infer<typeof imageRowSchema>[],
  variants: readonly z.infer<typeof variantRowSchema>[],
  logs: readonly z.infer<typeof logRowSchema>[]
): ProductReview {
  return {
    attributes: { ...product.attributes },
    brand: product.brand,
    createdAt: product.created_at,
    description: product.description,
    dimensionsCm: {
      height: product.height_cm,
      length: product.length_cm,
      width: product.width_cm,
    },
    failure:
      product.status === "FAILED" &&
      product.error_code !== null &&
      product.error_message !== null
        ? { code: product.error_code, message: product.error_message }
        : null,
    gtin: product.gtin,
    id: product.id,
    images: images.map((image) => ({
      id: image.id,
      isPrimary: image.is_primary,
      kind: image.kind,
      position: image.position,
      sourceUrl: image.source_url,
    })),
    logs: logs.map((log) => ({
      createdAt: log.created_at,
      details: { ...log.details },
      id: log.id,
      message: log.message,
      stage: log.stage,
      status: log.status,
    })),
    rawSourceData: { ...product.raw_source_data },
    sellingPrice: product.selling_price,
    sku: product.sku,
    source: {
      canonicalUrl: product.canonical_source_url,
      category: product.source_category,
      platform: product.source_platform,
      price: product.source_price,
      productIdentifier: product.source_product_identifier,
    },
    status: product.status,
    stock: product.stock,
    title: product.title,
    updatedAt: product.updated_at,
    variantAxes: product.variant_axes.map((axis) => ({
      name: axis.name,
      options: [...axis.options],
    })),
    variants: variants.map((variant) => ({
      id: variant.id,
      imageSourceUrl: variant.image_source_url,
      optionValues: { ...variant.option_values },
      position: variant.position,
      productId: variant.product_id,
      sellingPrice: variant.selling_price,
      sku: variant.sku,
      sourcePrice: variant.source_price,
      sourceVariantIdentifier: variant.source_variant_identifier,
      stock: variant.stock,
      updatedAt: variant.updated_at,
    })),
    weightGrams: product.weight_grams,
  }
}

export async function getProductReview(
  productId: string
): Promise<ProductReviewResult> {
  const parsedId = z.uuid().safeParse(productId)
  if (!parsedId.success) return { ok: false, error: "PRODUCT_NOT_FOUND" }

  try {
    const supabase = await createClient()
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select(PRODUCT_REVIEW_PRODUCT_SELECT)
      .eq("id", parsedId.data)
      .maybeSingle()

    if (productError) return { ok: false, error: "DATABASE_READ_FAILED" }
    if (productData === null) return { ok: false, error: "PRODUCT_NOT_FOUND" }

    const parsedProduct = productRowSchema.safeParse(productData)
    if (!parsedProduct.success) {
      return { ok: false, error: "DATABASE_READ_FAILED" }
    }

    const [imagesResult, variantsResult, logsResult] = await Promise.all([
      supabase
        .from("product_images")
        .select(PRODUCT_REVIEW_IMAGE_SELECT)
        .eq("product_id", parsedId.data)
        .order("position", { ascending: true }),
      supabase
        .from("product_variants")
        .select(PRODUCT_REVIEW_VARIANT_SELECT)
        .eq("product_id", parsedId.data)
        .order("position", { ascending: true }),
      supabase
        .from("process_logs")
        .select(PRODUCT_REVIEW_LOG_SELECT)
        .eq("product_id", parsedId.data)
        .order("created_at", { ascending: false })
        .limit(8),
    ])

    const parsedImages = z.array(imageRowSchema).safeParse(imagesResult.data)
    const parsedVariants = z
      .array(variantRowSchema)
      .safeParse(variantsResult.data)
    const parsedLogs = z.array(logRowSchema).safeParse(logsResult.data)

    if (
      imagesResult.error ||
      variantsResult.error ||
      logsResult.error ||
      !parsedImages.success ||
      !parsedVariants.success ||
      !parsedLogs.success
    ) {
      return { ok: false, error: "DATABASE_READ_FAILED" }
    }

    return {
      ok: true,
      product: mapProductReview(
        parsedProduct.data,
        parsedImages.data,
        parsedVariants.data,
        parsedLogs.data
      ),
    }
  } catch {
    return { ok: false, error: "DATABASE_READ_FAILED" }
  }
}

export async function updateReviewProduct(
  productId: string,
  patch: ProductReviewPatch
): Promise<ReviewWriteResult> {
  const parsedId = z.uuid().safeParse(productId)
  const parsedPatch = productPatchSchema.safeParse(patch)
  if (!parsedId.success || !parsedPatch.success) {
    return { ok: false, error: "INVALID_REVIEW_INPUT" }
  }

  const values = parsedPatch.data
  const databasePatch = {
    ...(values.brand !== undefined ? { brand: values.brand } : {}),
    ...(values.description !== undefined
      ? { description: values.description }
      : {}),
    ...(values.gtin !== undefined ? { gtin: values.gtin } : {}),
    ...(values.heightCm !== undefined ? { height_cm: values.heightCm } : {}),
    ...(values.lengthCm !== undefined ? { length_cm: values.lengthCm } : {}),
    ...(values.sellingPrice !== undefined
      ? { selling_price: values.sellingPrice }
      : {}),
    ...(values.sku !== undefined ? { sku: values.sku } : {}),
    ...(values.stock !== undefined ? { stock: values.stock } : {}),
    ...(values.title !== undefined ? { title: values.title } : {}),
    ...(values.weightGrams !== undefined
      ? { weight_grams: values.weightGrams }
      : {}),
    ...(values.widthCm !== undefined ? { width_cm: values.widthCm } : {}),
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("products")
      .update(databasePatch)
      .eq("id", parsedId.data)
      .eq("status", "REVIEW_REQUIRED")
      .select("id")
      .single()

    return error || !updatedIdSchema.safeParse(data).success
      ? { ok: false, error: "DATABASE_WRITE_FAILED" }
      : { ok: true }
  } catch {
    return { ok: false, error: "DATABASE_WRITE_FAILED" }
  }
}

export async function updateReviewVariant(
  productId: string,
  variantId: string,
  patch: VariantReviewPatch
): Promise<ReviewWriteResult> {
  const parsedProductId = z.uuid().safeParse(productId)
  const parsedVariantId = z.uuid().safeParse(variantId)
  const parsedPatch = variantPatchSchema.safeParse(patch)
  if (
    !parsedProductId.success ||
    !parsedVariantId.success ||
    !parsedPatch.success
  ) {
    return { ok: false, error: "INVALID_REVIEW_INPUT" }
  }

  const values = parsedPatch.data
  const databasePatch = {
    ...(values.sellingPrice !== undefined
      ? { selling_price: values.sellingPrice }
      : {}),
    ...(values.sku !== undefined ? { sku: values.sku } : {}),
    ...(values.stock !== undefined ? { stock: values.stock } : {}),
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("product_variants")
      .update(databasePatch)
      .eq("product_id", parsedProductId.data)
      .eq("id", parsedVariantId.data)
      .select("id")
      .single()

    return error || !updatedIdSchema.safeParse(data).success
      ? { ok: false, error: "DATABASE_WRITE_FAILED" }
      : { ok: true }
  } catch {
    return { ok: false, error: "DATABASE_WRITE_FAILED" }
  }
}
