import { z } from "zod"

import type {
  ProductReview,
  ProductReviewImage,
  ProductReviewVariant,
} from "./product-review"

export type ShopeeDecision = "UNCONFIRMED" | "NO" | "YES"
export type ShopeeCondition = "UNCONFIRMED" | "NEW" | "USED"

export type ShopeeCategoryAttribute = Readonly<{ name: string; value: string }>

export type ShopeeDraft = Readonly<{
  categoryAttributes: readonly ShopeeCategoryAttribute[]
  categoryAttributesReviewed: boolean
  categoryConfirmed: boolean
  categoryId: string | null
  categoryPath: string | null
  condition: ShopeeCondition
  createdAt: string
  dangerousProduct: ShopeeDecision
  descriptionOverride: string | null
  preorder: ShopeeDecision
  productId: string
  titleOverride: string | null
  updatedAt: string
}>

export type ShopeeDraftInput = Omit<
  ShopeeDraft,
  "createdAt" | "productId" | "updatedAt"
>

export type ShopeeReadinessIssue = Readonly<{
  code: string
  field: string
  message: string
  severity: "blocker" | "warning"
}>

export type ShopeeSellableOffer =
  | Readonly<{
      mode: "PRODUCT"
      sellingPrice: number | null
      sku: string | null
      stock: number | null
    }>
  | Readonly<{
      mode: "BASE_VARIANT"
      note: string
      sellingPrice: number | null
      sku: string | null
      stock: number | null
      variantId: string
    }>
  | Readonly<{ mode: "VARIATIONS"; variants: readonly ProductReviewVariant[] }>
  | Readonly<{ code: "SHOPEE_VARIANT_MAPPING_REQUIRED"; mode: "BLOCKED" }>

export type ShopeePreview = Readonly<{
  description: string | null
  draft: ShopeeDraft | null
  handoffNotes: readonly string[]
  images: readonly ProductReviewImage[]
  issues: readonly ShopeeReadinessIssue[]
  offer: ShopeeSellableOffer
  title: string | null
}>

type FormParseResult =
  | Readonly<{ data: ShopeeDraftInput; success: true }>
  | Readonly<{ success: false }>

const blankable = z.string().trim()
const optionalText = (limit: number) =>
  blankable.max(limit).transform((value) => (value ? value : null))
const attributeSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    value: z.string().trim().min(1).max(500),
  })
  .strict()
const decisionSchema = z.enum(["UNCONFIRMED", "NO", "YES"])
const conditionSchema = z.enum(["UNCONFIRMED", "NEW", "USED"])
const credentialKey =
  /(?:password|passwd|secret|token|cookie|authorization|otp|session)/iu
const credentialValue =
  /(?:bearer\s+[a-z0-9._~-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|sb_secret_|eyJ[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\.)/u

const inputSchema = z
  .object({
    categoryAttributes: z
      .array(attributeSchema)
      .max(50)
      .superRefine((attributes, context) => {
        const names = new Set<string>()
        attributes.forEach((attribute, index) => {
          const normalized = attribute.name.toLocaleLowerCase("en-US")
          if (names.has(normalized)) {
            context.addIssue({
              code: "custom",
              message: "Attribute names must be unique.",
              path: [index, "name"],
            })
          }
          names.add(normalized)
          if (
            credentialKey.test(attribute.name) ||
            credentialValue.test(attribute.value)
          ) {
            context.addIssue({
              code: "custom",
              message: "Credentials are not valid product attributes.",
              path: [index],
            })
          }
        })
      }),
    categoryAttributesReviewed: z.boolean(),
    categoryConfirmed: z.boolean(),
    categoryId: optionalText(200),
    categoryPath: optionalText(500),
    condition: conditionSchema,
    dangerousProduct: decisionSchema,
    descriptionOverride: optionalText(3000),
    preorder: decisionSchema,
    titleOverride: optionalText(255),
  })
  .strict()

const scalarFields = new Set([
  "titleOverride",
  "descriptionOverride",
  "categoryId",
  "categoryPath",
  "categoryConfirmed",
  "categoryAttributesReviewed",
  "dangerousProduct",
  "condition",
  "preorder",
])

export function parseShopeeDraftFormData(formData: FormData): FormParseResult {
  const scalars: Record<string, string> = {}
  const names: string[] = []
  const values: string[] = []

  for (const [name, value] of formData.entries()) {
    if (name.startsWith("$ACTION_")) continue
    if (typeof value !== "string") return { success: false }
    if (name === "attributeName") names.push(value)
    else if (name === "attributeValue") values.push(value)
    else if (!scalarFields.has(name) || Object.hasOwn(scalars, name))
      return { success: false }
    else scalars[name] = value
  }

  if (names.length !== values.length) return { success: false }
  const parsed = inputSchema.safeParse({
    categoryAttributes: names.map((name, index) => ({
      name,
      value: values[index],
    })),
    categoryAttributesReviewed: scalars.categoryAttributesReviewed === "true",
    categoryConfirmed: scalars.categoryConfirmed === "true",
    categoryId: scalars.categoryId ?? "",
    categoryPath: scalars.categoryPath ?? "",
    condition: scalars.condition,
    dangerousProduct: scalars.dangerousProduct,
    descriptionOverride: scalars.descriptionOverride ?? "",
    preorder: scalars.preorder,
    titleOverride: scalars.titleOverride ?? "",
  })

  return parsed.success
    ? { data: parsed.data, success: true }
    : { success: false }
}

function sameAttributes(
  left: readonly ShopeeCategoryAttribute[],
  right: readonly ShopeeCategoryAttribute[]
) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function applyShopeeDraftChanges(
  current: ShopeeDraft,
  submitted: ShopeeDraftInput
): ShopeeDraft {
  const categoryChanged =
    current.categoryId !== submitted.categoryId ||
    current.categoryPath !== submitted.categoryPath
  const attributesChanged = !sameAttributes(
    current.categoryAttributes,
    submitted.categoryAttributes
  )

  return {
    ...current,
    ...submitted,
    categoryAttributesReviewed:
      categoryChanged || attributesChanged
        ? false
        : submitted.categoryAttributesReviewed,
    categoryConfirmed: categoryChanged ? false : submitted.categoryConfirmed,
  }
}

export function newShopeeDraft(
  productId: string,
  input: ShopeeDraftInput
): ShopeeDraft {
  const timestamp = new Date(0).toISOString()
  return { ...input, createdAt: timestamp, productId, updatedAt: timestamp }
}

function trustedProductImages(images: readonly ProductReviewImage[]) {
  return images.filter((image) => {
    if (image.kind !== "product") return false
    try {
      const url = new URL(image.sourceUrl)
      return (
        url.protocol === "https:" &&
        url.hostname === "static.jakmall.id" &&
        !url.username &&
        !url.password &&
        !url.port
      )
    } catch {
      return false
    }
  })
}

function completeVariantMapping(product: ProductReview) {
  const axes = product.variantAxes
  if (axes.length === 0) return false
  const axisNames = axes.map((axis) => axis.name)
  const combinations = new Set<string>()

  for (const variant of product.variants) {
    const entries = Object.entries(variant.optionValues)
    if (entries.length !== axes.length) return false
    const optionRecord = new Map(entries)
    const values: string[] = []
    for (const axis of axes) {
      const value = optionRecord.get(axis.name)
      if (!value?.trim() || !axis.options.includes(value)) return false
      values.push(value)
    }
    if (entries.some(([name]) => !axisNames.includes(name))) return false
    const combination = JSON.stringify(values)
    if (combinations.has(combination)) return false
    combinations.add(combination)
  }
  return true
}

function sellableOffer(product: ProductReview): ShopeeSellableOffer {
  if (product.variants.length === 0) {
    return {
      mode: "PRODUCT",
      sellingPrice: product.sellingPrice,
      sku: product.sku,
      stock: product.stock,
    }
  }
  if (
    product.variants.length === 1 &&
    Object.keys(product.variants[0].optionValues).length === 0
  ) {
    const variant = product.variants[0]
    return {
      mode: "BASE_VARIANT",
      note: "Single source offer mapped as the base listing.",
      sellingPrice: variant.sellingPrice,
      sku: variant.sku,
      stock: variant.stock,
      variantId: variant.id,
    }
  }
  return completeVariantMapping(product)
    ? {
        mode: "VARIATIONS",
        variants: product.variants.map((variant) => ({
          ...variant,
          optionValues: { ...variant.optionValues },
        })),
      }
    : { code: "SHOPEE_VARIANT_MAPPING_REQUIRED", mode: "BLOCKED" }
}

function issue(
  issues: ShopeeReadinessIssue[],
  code: string,
  field: string,
  message: string,
  severity: "blocker" | "warning" = "blocker"
) {
  issues.push({ code, field, message, severity })
}

export function buildShopeePreview(
  product: ProductReview,
  draft: ShopeeDraft | null
): ShopeePreview {
  const issues: ShopeeReadinessIssue[] = []
  const title = draft?.titleOverride ?? product.title
  const description = draft?.descriptionOverride ?? product.description
  const images = trustedProductImages(product.images)
  const offer = sellableOffer(product)

  if (!draft)
    issue(
      issues,
      "SHOPEE_DRAFT_REQUIRED",
      "draft",
      "Save a Shopee draft before marking this product ready."
    )
  if (!title?.trim())
    issue(
      issues,
      "SHOPEE_TITLE_REQUIRED",
      "title",
      "Add a Shopee product title."
    )
  else if (title.length > 255)
    issue(
      issues,
      "SHOPEE_TITLE_TOO_LONG",
      "title",
      "Shopee product title must be 255 characters or fewer."
    )
  if (!description?.trim())
    issue(
      issues,
      "SHOPEE_DESCRIPTION_REQUIRED",
      "description",
      "Add a Shopee product description."
    )
  else if (description.length > 3000)
    issue(
      issues,
      "SHOPEE_DESCRIPTION_TOO_LONG",
      "description",
      "Shopee description must be 3000 characters or fewer."
    )
  if (images.length === 0)
    issue(
      issues,
      "SHOPEE_IMAGE_REQUIRED",
      "images",
      "At least one trusted product image is required."
    )
  else if (images.length > 9)
    issue(
      issues,
      "SHOPEE_IMAGE_LIMIT_EXCEEDED",
      "images",
      "Choose no more than nine product images in a later handoff step."
    )
  if (!draft?.categoryPath?.trim())
    issue(
      issues,
      "SHOPEE_CATEGORY_REQUIRED",
      "categoryPath",
      "Enter the Shopee category path."
    )
  if (!draft?.categoryConfirmed)
    issue(
      issues,
      "SHOPEE_CATEGORY_CONFIRMATION_REQUIRED",
      "categoryConfirmed",
      "Reviewer category confirmation is required."
    )
  if (!draft?.categoryAttributesReviewed)
    issue(
      issues,
      "SHOPEE_ATTRIBUTES_REVIEW_REQUIRED",
      "categoryAttributes",
      "Review the category-specific attributes."
    )
  if (!draft || draft.dangerousProduct === "UNCONFIRMED")
    issue(
      issues,
      "SHOPEE_DANGEROUS_PRODUCT_REQUIRED",
      "dangerousProduct",
      "Reviewer dangerous-product decision is required."
    )
  if (!draft || draft.condition === "UNCONFIRMED")
    issue(
      issues,
      "SHOPEE_CONDITION_REQUIRED",
      "condition",
      "Reviewer product-condition decision is required."
    )
  if (!draft || draft.preorder === "UNCONFIRMED")
    issue(
      issues,
      "SHOPEE_PREORDER_REQUIRED",
      "preorder",
      "Reviewer preorder decision is required."
    )
  if (product.weightGrams === null || product.weightGrams <= 0)
    issue(
      issues,
      "SHOPEE_WEIGHT_REQUIRED",
      "weightGrams",
      "Set a positive product weight."
    )
  if (offer.mode === "BLOCKED")
    issue(
      issues,
      offer.code,
      "variants",
      "Multiple variants require confirmed option mapping."
    )
  else if (offer.mode === "VARIATIONS") {
    if (
      offer.variants.some(
        (variant) => variant.sellingPrice === null || variant.sellingPrice <= 0
      )
    ) {
      issue(
        issues,
        "SHOPEE_PRICE_REQUIRED",
        "sellingPrice",
        "Set a positive authoritative selling price for every variation."
      )
    }
    if (offer.variants.some((variant) => variant.stock === null)) {
      issue(
        issues,
        "SHOPEE_STOCK_REQUIRED",
        "stock",
        "Confirm authoritative stock for every variation."
      )
    }
    if (offer.variants.some((variant) => !variant.sku?.trim())) {
      issue(
        issues,
        "SHOPEE_SKU_RECOMMENDED",
        "sku",
        "Add an authoritative SKU for every variation when available.",
        "warning"
      )
    }
  } else {
    if (offer.sellingPrice === null || offer.sellingPrice <= 0)
      issue(
        issues,
        "SHOPEE_PRICE_REQUIRED",
        "sellingPrice",
        "Set a positive authoritative selling price."
      )
    if (offer.stock === null)
      issue(
        issues,
        "SHOPEE_STOCK_REQUIRED",
        "stock",
        "Confirm authoritative stock."
      )
    if (!offer.sku?.trim())
      issue(
        issues,
        "SHOPEE_SKU_RECOMMENDED",
        "sku",
        "Add an authoritative SKU when available.",
        "warning"
      )
  }
  const dimensions = Object.values(product.dimensionsCm)
  if (!dimensions.every((value) => value !== null && value > 0))
    issue(
      issues,
      "SHOPEE_DIMENSIONS_RECOMMENDED",
      "dimensionsCm",
      "Complete positive package dimensions when available.",
      "warning"
    )
  issue(
    issues,
    "SHOPEE_SHIPPING_EXTERNAL",
    "shipping",
    "Shipping service availability must be confirmed in Shopee Seller Centre during handoff.",
    "warning"
  )
  issue(
    issues,
    "SHOPEE_CONTROLS_UNSUPPORTED",
    "handoff",
    "Promotional media and advanced seller controls are not handled in this PoC.",
    "warning"
  )

  return {
    description,
    draft,
    handoffNotes: [
      "Shipping service availability must be confirmed in Shopee Seller Centre during handoff.",
      "Promotional photo, video, wholesale, purchase limits, insurance, and display schedule are not handled in this PoC.",
    ],
    images,
    issues,
    offer,
    title,
  }
}
