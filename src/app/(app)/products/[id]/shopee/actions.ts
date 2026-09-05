"use server"

import { revalidatePath } from "next/cache"

import {
  applyShopeeDraftChanges,
  buildShopeePreview,
  newShopeeDraft,
  parseShopeeDraftFormData,
  type ShopeeDraft,
  type ShopeeDraftInput,
} from "@/lib/shopee-draft"
import { appendProcessLog } from "@/lib/supabase/process-log-repository"
import { getProductReview } from "@/lib/supabase/product-review-repository"
import {
  getShopeeDraft,
  saveShopeeDraft,
  transitionProductForShopee,
} from "@/lib/supabase/shopee-draft-repository"
import { createClient } from "@/lib/supabase/server"

export type ShopeeActionState = Readonly<{
  message?: string
  status?: "error" | "neutral" | "success" | "warning"
}>

async function authenticated() {
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

function paths(productId: string) {
  revalidatePath(`/products/${productId}/shopee`)
  revalidatePath(`/products/${productId}`)
  revalidatePath("/products")
  revalidatePath("/")
}

function draftInput(draft: ShopeeDraft): ShopeeDraftInput {
  return {
    categoryAttributes: draft.categoryAttributes.map((attribute) => ({
      ...attribute,
    })),
    categoryAttributesReviewed: draft.categoryAttributesReviewed,
    categoryConfirmed: draft.categoryConfirmed,
    categoryId: draft.categoryId,
    categoryPath: draft.categoryPath,
    condition: draft.condition,
    dangerousProduct: draft.dangerousProduct,
    descriptionOverride: draft.descriptionOverride,
    preorder: draft.preorder,
    titleOverride: draft.titleOverride,
  }
}

function changedFields(current: ShopeeDraft | null, next: ShopeeDraftInput) {
  if (!current) return Object.keys(next)
  const previous = draftInput(current)
  return Object.keys(next).filter(
    (key) =>
      JSON.stringify(previous[key as keyof ShopeeDraftInput]) !==
      JSON.stringify(next[key as keyof ShopeeDraftInput])
  )
}

export async function saveShopeeDraftAction(
  productId: string,
  _previousState: ShopeeActionState,
  formData: FormData
): Promise<ShopeeActionState> {
  void _previousState
  if (!(await authenticated()))
    return {
      message: "Please sign in again before saving the Shopee draft.",
      status: "error",
    }
  const parsed = parseShopeeDraftFormData(formData)
  if (!parsed.success)
    return {
      message: "Check the Shopee mapping values and try again.",
      status: "error",
    }
  const [productResult, draftResult] = await Promise.all([
    getProductReview(productId),
    getShopeeDraft(productId),
  ])
  if (!productResult.ok || !draftResult.ok)
    return {
      message: "Current product mapping could not be loaded.",
      status: "error",
    }
  if (productResult.product.status !== "REVIEW_REQUIRED")
    return {
      message: "Reopen Shopee mapping before editing this draft.",
      status: "error",
    }

  const nextDraft = draftResult.draft
    ? applyShopeeDraftChanges(draftResult.draft, parsed.data)
    : newShopeeDraft(productId, parsed.data)
  const next = draftInput(nextDraft)
  const fields = changedFields(draftResult.draft, next)
  if (fields.length === 0)
    return { message: "No changes to save.", status: "neutral" }

  const saved = await saveShopeeDraft(productId, next)
  if (!saved.ok)
    return {
      message: "Shopee draft could not be saved. Please try again.",
      status: "error",
    }
  const logged = await appendProcessLog({
    details: {
      attributeCount: next.categoryAttributes.length,
      changedFields: fields,
    },
    message: "Shopee draft saved.",
    productId,
    stage: "shopee_mapping",
    status: "success",
  })
  paths(productId)
  return logged.ok
    ? { message: "Shopee draft saved.", status: "success" }
    : {
        message: "Draft saved, but the mapping activity could not be recorded.",
        status: "warning",
      }
}

export async function markProductReadyForShopeeAction(
  productId: string,
  _previousState: ShopeeActionState,
  _formData: FormData
): Promise<ShopeeActionState> {
  void _previousState
  void _formData
  if (!(await authenticated()))
    return {
      message: "Please sign in again before marking this product ready.",
      status: "error",
    }
  const [productResult, draftResult] = await Promise.all([
    getProductReview(productId),
    getShopeeDraft(productId),
  ])
  if (!productResult.ok || !draftResult.ok)
    return {
      message: "Current persisted Shopee mapping could not be loaded.",
      status: "error",
    }
  if (productResult.product.status !== "REVIEW_REQUIRED")
    return {
      message: "Only a product needing review can be marked ready.",
      status: "error",
    }
  const preview = buildShopeePreview(productResult.product, draftResult.draft)
  const blockers = preview.issues.filter(
    (issue) => issue.severity === "blocker"
  )
  if (blockers.length > 0)
    return {
      message: `Resolve ${blockers.length} readiness blocker${blockers.length === 1 ? "" : "s"} before marking ready.`,
      status: "error",
    }
  const updated = await transitionProductForShopee(
    productId,
    "REVIEW_REQUIRED",
    "READY"
  )
  if (!updated.ok)
    return {
      message: "Product status could not be updated. Reload and try again.",
      status: "error",
    }
  const logged = await appendProcessLog({
    details: {
      blockerCount: 0,
      mappingMode: preview.offer.mode,
      warningCount: preview.issues.length,
    },
    message: "Product marked Ready for Shopee.",
    productId,
    stage: "shopee_mapping",
    status: "success",
  })
  paths(productId)
  return logged.ok
    ? { message: "Product marked Ready for Shopee.", status: "success" }
    : {
        message:
          "Product is ready, but the mapping activity could not be recorded.",
        status: "warning",
      }
}

export async function reopenShopeeMappingAction(
  productId: string,
  _previousState: ShopeeActionState,
  _formData: FormData
): Promise<ShopeeActionState> {
  void _previousState
  void _formData
  if (!(await authenticated()))
    return {
      message: "Please sign in again before reopening this mapping.",
      status: "error",
    }
  const current = await getProductReview(productId)
  if (!current.ok || current.product.status !== "READY")
    return {
      message: "Only a ready product can be reopened for review.",
      status: "error",
    }
  const updated = await transitionProductForShopee(
    productId,
    "READY",
    "REVIEW_REQUIRED"
  )
  if (!updated.ok)
    return {
      message: "Shopee mapping could not be reopened. Reload and try again.",
      status: "error",
    }
  const logged = await appendProcessLog({
    details: { changedFields: ["status"] },
    message: "Shopee mapping reopened for review.",
    productId,
    stage: "shopee_mapping",
    status: "success",
  })
  paths(productId)
  return logged.ok
    ? { message: "Shopee mapping reopened for review.", status: "success" }
    : {
        message: "Mapping reopened, but the activity could not be recorded.",
        status: "warning",
      }
}
