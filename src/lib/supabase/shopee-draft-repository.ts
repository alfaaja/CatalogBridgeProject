import { z } from "zod"

import type { ShopeeDraft, ShopeeDraftInput } from "@/lib/shopee-draft"

import { createClient } from "./server"

export const SHOPEE_DRAFT_SELECT =
  "product_id,title_override,description_override,category_id,category_path,category_confirmed,category_attributes,category_attributes_reviewed,dangerous_product,condition,preorder,created_at,updated_at"

const attributeSchema = z
  .object({ name: z.string(), value: z.string() })
  .strict()
const rowSchema = z
  .object({
    category_attributes: z.array(attributeSchema).max(50),
    category_attributes_reviewed: z.boolean(),
    category_confirmed: z.boolean(),
    category_id: z.string().nullable(),
    category_path: z.string().nullable(),
    condition: z.enum(["UNCONFIRMED", "NEW", "USED"]),
    created_at: z.iso.datetime({ offset: true }),
    dangerous_product: z.enum(["UNCONFIRMED", "NO", "YES"]),
    description_override: z.string().nullable(),
    preorder: z.enum(["UNCONFIRMED", "NO", "YES"]),
    product_id: z.uuid(),
    title_override: z.string().nullable(),
    updated_at: z.iso.datetime({ offset: true }),
  })
  .strict()
const idRowSchema = z.object({ id: z.uuid() }).strict()
const draftIdRowSchema = z.object({ product_id: z.uuid() }).strict()

type ReadResult =
  | Readonly<{ draft: ShopeeDraft | null; ok: true }>
  | Readonly<{
      error: "DATABASE_READ_FAILED" | "PRODUCT_NOT_FOUND"
      ok: false
    }>
type WriteResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      error: "DATABASE_WRITE_FAILED" | "INVALID_DRAFT_INPUT"
      ok: false
    }>

function mapDraft(row: z.infer<typeof rowSchema>): ShopeeDraft {
  return {
    categoryAttributes: row.category_attributes.map((attribute) => ({
      ...attribute,
    })),
    categoryAttributesReviewed: row.category_attributes_reviewed,
    categoryConfirmed: row.category_confirmed,
    categoryId: row.category_id,
    categoryPath: row.category_path,
    condition: row.condition,
    createdAt: row.created_at,
    dangerousProduct: row.dangerous_product,
    descriptionOverride: row.description_override,
    preorder: row.preorder,
    productId: row.product_id,
    titleOverride: row.title_override,
    updatedAt: row.updated_at,
  }
}

export async function getShopeeDraft(productId: string): Promise<ReadResult> {
  const id = z.uuid().safeParse(productId)
  if (!id.success) return { error: "PRODUCT_NOT_FOUND", ok: false }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("shopee_drafts")
      .select(SHOPEE_DRAFT_SELECT)
      .eq("product_id", id.data)
      .maybeSingle()
    if (error) return { error: "DATABASE_READ_FAILED", ok: false }
    if (data === null) return { draft: null, ok: true }
    const parsed = rowSchema.safeParse(data)
    return parsed.success
      ? { draft: mapDraft(parsed.data), ok: true }
      : { error: "DATABASE_READ_FAILED", ok: false }
  } catch {
    return { error: "DATABASE_READ_FAILED", ok: false }
  }
}

export async function saveShopeeDraft(
  productId: string,
  input: ShopeeDraftInput
): Promise<WriteResult> {
  const id = z.uuid().safeParse(productId)
  if (!id.success) return { error: "INVALID_DRAFT_INPUT", ok: false }
  try {
    const supabase = await createClient()
    const values = {
      category_attributes: input.categoryAttributes.map((attribute) => ({
        name: attribute.name,
        value: attribute.value,
      })),
      category_attributes_reviewed: input.categoryAttributesReviewed,
      category_confirmed: input.categoryConfirmed,
      category_id: input.categoryId,
      category_path: input.categoryPath,
      condition: input.condition,
      dangerous_product: input.dangerousProduct,
      description_override: input.descriptionOverride,
      preorder: input.preorder,
      title_override: input.titleOverride,
    }
    const updated = await supabase
      .from("shopee_drafts")
      .update(values)
      .eq("product_id", id.data)
      .select("product_id")
      .maybeSingle()
    if (updated.error) return { error: "DATABASE_WRITE_FAILED", ok: false }
    if (updated.data !== null) {
      return draftIdRowSchema.safeParse(updated.data).success
        ? { ok: true }
        : { error: "DATABASE_WRITE_FAILED", ok: false }
    }

    const inserted = await supabase
      .from("shopee_drafts")
      .insert({ ...values, product_id: id.data })
      .select("product_id")
      .single()
    return inserted.error || !draftIdRowSchema.safeParse(inserted.data).success
      ? { error: "DATABASE_WRITE_FAILED", ok: false }
      : { ok: true }
  } catch {
    return { error: "DATABASE_WRITE_FAILED", ok: false }
  }
}

export async function transitionProductForShopee(
  productId: string,
  from: "READY" | "REVIEW_REQUIRED",
  to: "READY" | "REVIEW_REQUIRED"
): Promise<WriteResult> {
  const validTransition =
    (from === "REVIEW_REQUIRED" && to === "READY") ||
    (from === "READY" && to === "REVIEW_REQUIRED")
  const id = z.uuid().safeParse(productId)
  if (!id.success || !validTransition)
    return { error: "INVALID_DRAFT_INPUT", ok: false }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("products")
      .update({ status: to })
      .eq("id", id.data)
      .eq("status", from)
      .select("id")
      .single()
    return error || !idRowSchema.safeParse(data).success
      ? { error: "DATABASE_WRITE_FAILED", ok: false }
      : { ok: true }
  } catch {
    return { error: "DATABASE_WRITE_FAILED", ok: false }
  }
}
