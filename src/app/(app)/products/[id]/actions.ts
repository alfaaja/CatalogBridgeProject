"use server"

import { revalidatePath } from "next/cache"

import {
  parseProductReviewEditFormData,
  parseVariantReviewEditFormData,
  type ProductReview,
} from "@/lib/product-review"
import { appendProcessLog } from "@/lib/supabase/process-log-repository"
import {
  getProductReview,
  updateReviewProduct,
  updateReviewVariant,
  type ProductReviewPatch,
  type VariantReviewPatch,
} from "@/lib/supabase/product-review-repository"
import { createClient } from "@/lib/supabase/server"

export type ProductReviewActionState = Readonly<{
  message?: string
  status?: "error" | "neutral" | "success" | "warning"
}>

async function hasAuthenticatedReviewer() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getClaims()

    return Boolean(
      !error && data?.claims?.sub && data.claims.is_anonymous !== true
    )
  } catch {
    return false
  }
}

function reviewReadError(
  error: "DATABASE_READ_FAILED" | "PRODUCT_NOT_FOUND"
): ProductReviewActionState {
  return error === "PRODUCT_NOT_FOUND"
    ? { message: "That product is no longer available.", status: "error" }
    : {
        message: "Product data could not be loaded. Please try again.",
        status: "error",
      }
}

function productChanges(
  product: ProductReview,
  input: Exclude<
    ReturnType<typeof parseProductReviewEditFormData>,
    { success: false }
  >["data"]
) {
  const candidates: readonly Readonly<{
    current: unknown
    field: string
    key: keyof ProductReviewPatch
    value: unknown
  }>[] = [
    { current: product.title, field: "title", key: "title", value: input.title },
    {
      current: product.description,
      field: "description",
      key: "description",
      value: input.description,
    },
    {
      current: product.sellingPrice,
      field: "selling_price",
      key: "sellingPrice",
      value: input.sellingPrice,
    },
    { current: product.stock, field: "stock", key: "stock", value: input.stock },
    { current: product.sku, field: "sku", key: "sku", value: input.sku },
    { current: product.gtin, field: "gtin", key: "gtin", value: input.gtin },
    { current: product.brand, field: "brand", key: "brand", value: input.brand },
    {
      current: product.weightGrams,
      field: "weight_grams",
      key: "weightGrams",
      value: input.weightGrams,
    },
    {
      current: product.dimensionsCm.length,
      field: "length_cm",
      key: "lengthCm",
      value: input.lengthCm,
    },
    {
      current: product.dimensionsCm.width,
      field: "width_cm",
      key: "widthCm",
      value: input.widthCm,
    },
    {
      current: product.dimensionsCm.height,
      field: "height_cm",
      key: "heightCm",
      value: input.heightCm,
    },
  ]
  const changed = candidates.filter(
    (candidate) => !Object.is(candidate.current, candidate.value)
  )

  return {
    fields: changed.map((candidate) => candidate.field),
    patch: Object.fromEntries(
      changed.map((candidate) => [candidate.key, candidate.value])
    ) as ProductReviewPatch,
  }
}

function variantChanges(
  variant: ProductReview["variants"][number],
  input: Exclude<
    ReturnType<typeof parseVariantReviewEditFormData>,
    { success: false }
  >["data"]
) {
  const candidates: readonly Readonly<{
    current: unknown
    field: string
    key: keyof VariantReviewPatch
    value: unknown
  }>[] = [
    {
      current: variant.sellingPrice,
      field: "selling_price",
      key: "sellingPrice",
      value: input.sellingPrice,
    },
    { current: variant.stock, field: "stock", key: "stock", value: input.stock },
    { current: variant.sku, field: "sku", key: "sku", value: input.sku },
  ]
  const changed = candidates.filter(
    (candidate) => !Object.is(candidate.current, candidate.value)
  )

  return {
    fields: changed.map((candidate) => candidate.field),
    patch: Object.fromEntries(
      changed.map((candidate) => [candidate.key, candidate.value])
    ) as VariantReviewPatch,
  }
}

function revalidateReviewPaths(productId: string) {
  revalidatePath(`/products/${productId}`)
  revalidatePath("/products")
  revalidatePath("/dashboard")
}

export async function saveProductReviewAction(
  _previousState: ProductReviewActionState,
  formData: FormData
): Promise<ProductReviewActionState> {
  if (!(await hasAuthenticatedReviewer())) {
    return {
      message: "Please sign in again before saving product changes.",
      status: "error",
    }
  }

  const parsed = parseProductReviewEditFormData(formData)
  if (!parsed.success) {
    return {
      message: "Check the product values and try again.",
      status: "error",
    }
  }

  const current = await getProductReview(parsed.data.productId)
  if (!current.ok) return reviewReadError(current.error)
  if (current.product.status !== "REVIEW_REQUIRED") {
    return {
      message: "Only products that need review can be edited.",
      status: "error",
    }
  }

  const changes = productChanges(current.product, parsed.data)
  if (changes.fields.length === 0) {
    return { message: "No changes to save.", status: "neutral" }
  }

  const updated = await updateReviewProduct(
    parsed.data.productId,
    changes.patch
  )
  if (!updated.ok) {
    return {
      message: "Product changes could not be saved. Please try again.",
      status: "error",
    }
  }

  const logged = await appendProcessLog({
    details: { changedFields: changes.fields, scope: "product" },
    message: "Product review changes saved.",
    productId: parsed.data.productId,
    stage: "review",
    status: "success",
  })
  revalidateReviewPaths(parsed.data.productId)

  return logged.ok
    ? { message: "Product review changes saved.", status: "success" }
    : {
        message:
          "Changes were saved, but the review activity could not be recorded.",
        status: "warning",
      }
}

export async function saveVariantReviewAction(
  _previousState: ProductReviewActionState,
  formData: FormData
): Promise<ProductReviewActionState> {
  if (!(await hasAuthenticatedReviewer())) {
    return {
      message: "Please sign in again before saving variant changes.",
      status: "error",
    }
  }

  const parsed = parseVariantReviewEditFormData(formData)
  if (!parsed.success) {
    return {
      message: "Check the variant values and try again.",
      status: "error",
    }
  }

  const current = await getProductReview(parsed.data.productId)
  if (!current.ok) return reviewReadError(current.error)
  if (current.product.status !== "REVIEW_REQUIRED") {
    return {
      message: "Only products that need review can be edited.",
      status: "error",
    }
  }

  const variant = current.product.variants.find(
    (candidate) => candidate.id === parsed.data.variantId
  )
  if (!variant) {
    return {
      message: "That variant is no longer available.",
      status: "error",
    }
  }

  const changes = variantChanges(variant, parsed.data)
  if (changes.fields.length === 0) {
    return { message: "No changes to save.", status: "neutral" }
  }

  const updated = await updateReviewVariant(
    parsed.data.productId,
    parsed.data.variantId,
    changes.patch
  )
  if (!updated.ok) {
    return {
      message: "Variant changes could not be saved. Please try again.",
      status: "error",
    }
  }

  const logged = await appendProcessLog({
    details: {
      changedFields: changes.fields,
      changedVariantCount: 1,
      scope: "variant",
    },
    message: "Variant review changes saved.",
    productId: parsed.data.productId,
    stage: "review",
    status: "success",
  })
  revalidateReviewPaths(parsed.data.productId)

  return logged.ok
    ? { message: "Variant review changes saved.", status: "success" }
    : {
        message:
          "Changes were saved, but the review activity could not be recorded.",
        status: "warning",
      }
}
