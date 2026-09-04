import { z } from "zod"

import {
  importedProductSchema,
  pendingProductSchema,
  productFailureSchema,
  productImageSchema,
  productVariantSchema,
  type ImportedProductInput,
  type PendingProductInput,
  type ProductImageInput,
  type ProductVariantInput,
} from "./persistence"
import { createClient } from "./server"

type ProductWriteError =
  | "DATABASE_WRITE_FAILED"
  | "IMPORT_DUPLICATE_PRODUCT"
  | "INVALID_PRODUCT_INPUT"

type ProductWriteResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; error: ProductWriteError }>

type ProductCreateResult =
  | Readonly<{ ok: true; productId: string }>
  | Readonly<{ ok: false; error: ProductWriteError }>

export type ProductSummary = Readonly<{
  id: string
  sellingPrice: number | null
  sourcePrice: number | null
  status: "PENDING" | "IMPORTING" | "REVIEW_REQUIRED" | "READY" | "FAILED"
  title: string | null
  updatedAt: string
}>

type ProductListResult =
  | Readonly<{ ok: true; products: readonly ProductSummary[] }>
  | Readonly<{ ok: false; error: "DATABASE_READ_FAILED" }>

const productIdResultSchema = z.object({ id: z.uuid() })
const productSummaryRowSchema = z.object({
  id: z.uuid(),
  selling_price: z.number().nonnegative().nullable(),
  source_price: z.number().nonnegative().nullable(),
  status: z.enum(["PENDING", "IMPORTING", "REVIEW_REQUIRED", "READY", "FAILED"]),
  title: z.string().nullable(),
  updated_at: z.iso.datetime({ offset: true }),
})

function productCreateError(error: { code?: string } | null) {
  return error?.code === "23505"
    ? ("IMPORT_DUPLICATE_PRODUCT" as const)
    : ("DATABASE_WRITE_FAILED" as const)
}

export async function createPendingProduct(
  input: PendingProductInput
): Promise<ProductCreateResult> {
  const parsedInput = pendingProductSchema.safeParse(input)

  if (!parsedInput.success) {
    return { ok: false, error: "INVALID_PRODUCT_INPUT" }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("products")
      .insert({
        canonical_source_url: parsedInput.data.canonicalSourceUrl,
        source_platform: "jakmall",
        source_product_identifier: parsedInput.data.sourceProductIdentifier,
        status: "PENDING",
        title: parsedInput.data.title,
      })
      .select("id")
      .single()

    const parsedProduct = productIdResultSchema.safeParse(data)

    if (error || !parsedProduct.success) {
      return { ok: false, error: productCreateError(error) }
    }

    return { ok: true, productId: parsedProduct.data.id }
  } catch {
    return { ok: false, error: "DATABASE_WRITE_FAILED" }
  }
}

export async function markProductImporting(
  productId: string
): Promise<ProductWriteResult> {
  const parsedId = z.uuid().safeParse(productId)

  if (!parsedId.success) {
    return { ok: false, error: "INVALID_PRODUCT_INPUT" }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("products")
      .update({
        error_code: null,
        error_message: null,
        status: "IMPORTING",
      })
      .eq("id", parsedId.data)
      .select("id")
      .single()

    return error || !productIdResultSchema.safeParse(data).success
      ? { ok: false, error: "DATABASE_WRITE_FAILED" }
      : { ok: true }
  } catch {
    return { ok: false, error: "DATABASE_WRITE_FAILED" }
  }
}

export async function saveImportedProduct(
  productId: string,
  input: ImportedProductInput
): Promise<ProductWriteResult> {
  const parsedId = z.uuid().safeParse(productId)
  const parsedInput = importedProductSchema.safeParse(input)

  if (!parsedId.success || !parsedInput.success) {
    return { ok: false, error: "INVALID_PRODUCT_INPUT" }
  }

  const product = parsedInput.data

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("products")
      .update({
        attributes: product.attributes,
        brand: product.brand,
        description: product.description,
        error_code: null,
        error_message: null,
        gtin: product.gtin,
        height_cm: product.heightCm,
        length_cm: product.lengthCm,
        raw_source_data: product.rawSourceData,
        selling_price: product.sellingPrice,
        sku: product.sku,
        source_category: product.sourceCategory,
        source_price: product.sourcePrice,
        status: product.status,
        stock: product.stock,
        title: product.title,
        variant_axes: product.variantAxes,
        weight_grams: product.weightGrams,
        width_cm: product.widthCm,
      })
      .eq("id", parsedId.data)
      .select("id")
      .single()

    return error || !productIdResultSchema.safeParse(data).success
      ? { ok: false, error: "DATABASE_WRITE_FAILED" }
      : { ok: true }
  } catch {
    return { ok: false, error: "DATABASE_WRITE_FAILED" }
  }
}

export async function markProductImportFailed(input: {
  productId: string
  errorCode: string
  errorMessage: string
}): Promise<ProductWriteResult> {
  const parsedInput = productFailureSchema.safeParse(input)

  if (!parsedInput.success) {
    return { ok: false, error: "INVALID_PRODUCT_INPUT" }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("products")
      .update({
        error_code: parsedInput.data.errorCode,
        error_message: parsedInput.data.errorMessage,
        status: "FAILED",
      })
      .eq("id", parsedInput.data.productId)
      .select("id")
      .single()

    return error || !productIdResultSchema.safeParse(data).success
      ? { ok: false, error: "DATABASE_WRITE_FAILED" }
      : { ok: true }
  } catch {
    return { ok: false, error: "DATABASE_WRITE_FAILED" }
  }
}

export async function listProductSummaries(): Promise<ProductListResult> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("products")
      .select("id,title,status,source_price,selling_price,updated_at")
      .order("updated_at", { ascending: false })
      .order("id", { ascending: true })

    const parsedRows = z.array(productSummaryRowSchema).safeParse(data)

    if (error || !parsedRows.success) {
      return { ok: false, error: "DATABASE_READ_FAILED" }
    }

    return {
      ok: true,
      products: parsedRows.data.map((product) => ({
        id: product.id,
        sellingPrice: product.selling_price,
        sourcePrice: product.source_price,
        status: product.status,
        title: product.title,
        updatedAt: product.updated_at,
      })),
    }
  } catch {
    return { ok: false, error: "DATABASE_READ_FAILED" }
  }
}

export async function insertProductImages(
  productId: string,
  images: readonly ProductImageInput[]
): Promise<ProductWriteResult> {
  const parsedId = z.uuid().safeParse(productId)
  const parsedImages = z.array(productImageSchema).safeParse(images)

  if (!parsedId.success || !parsedImages.success) {
    return { ok: false, error: "INVALID_PRODUCT_INPUT" }
  }

  if (parsedImages.data.length === 0) {
    return { ok: true }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.from("product_images").insert(
      parsedImages.data.map((image) => ({
        is_primary: image.isPrimary,
        kind: image.kind,
        position: image.position,
        product_id: parsedId.data,
        source_url: image.sourceUrl,
      }))
    )

    return error
      ? { ok: false, error: "DATABASE_WRITE_FAILED" }
      : { ok: true }
  } catch {
    return { ok: false, error: "DATABASE_WRITE_FAILED" }
  }
}

export async function insertProductVariants(
  productId: string,
  variants: readonly ProductVariantInput[]
): Promise<ProductWriteResult> {
  const parsedId = z.uuid().safeParse(productId)
  const parsedVariants = z.array(productVariantSchema).safeParse(variants)

  if (!parsedId.success || !parsedVariants.success) {
    return { ok: false, error: "INVALID_PRODUCT_INPUT" }
  }

  if (parsedVariants.data.length === 0) {
    return { ok: true }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.from("product_variants").insert(
      parsedVariants.data.map((variant) => ({
        image_source_url: variant.imageSourceUrl,
        option_values: variant.optionValues,
        position: variant.position,
        product_id: parsedId.data,
        selling_price: variant.sellingPrice,
        sku: variant.sku,
        source_price: variant.sourcePrice,
        source_variant_identifier: variant.sourceVariantIdentifier,
        stock: variant.stock,
      }))
    )

    return error
      ? { ok: false, error: "DATABASE_WRITE_FAILED" }
      : { ok: true }
  } catch {
    return { ok: false, error: "DATABASE_WRITE_FAILED" }
  }
}
