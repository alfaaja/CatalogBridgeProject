import { z } from "zod"

export type ProductReviewStatus =
  | "PENDING"
  | "IMPORTING"
  | "REVIEW_REQUIRED"
  | "READY"
  | "FAILED"

export type ProductReviewImage = Readonly<{
  id: string
  isPrimary: boolean
  kind: "product" | "promotional"
  position: number
  sourceUrl: string
}>

export type ProductReviewVariant = Readonly<{
  id: string
  imageSourceUrl: string | null
  optionValues: Readonly<Record<string, string>>
  position: number
  productId: string
  sellingPrice: number | null
  sku: string | null
  sourcePrice: number | null
  sourceVariantIdentifier: string | null
  stock: number | null
  updatedAt: string
}>

export type ProductReviewLog = Readonly<{
  createdAt: string
  details: Readonly<Record<string, unknown>>
  id: string
  message: string
  stage: string
  status: "started" | "success" | "warning" | "failed"
}>

export type ProductReview = Readonly<{
  attributes: Readonly<Record<string, unknown>>
  brand: string | null
  createdAt: string
  description: string | null
  dimensionsCm: Readonly<{
    height: number | null
    length: number | null
    width: number | null
  }>
  failure: Readonly<{ code: string; message: string }> | null
  gtin: string | null
  id: string
  images: readonly ProductReviewImage[]
  logs: readonly ProductReviewLog[]
  rawSourceData: Readonly<Record<string, unknown>>
  sellingPrice: number | null
  sku: string | null
  source: Readonly<{
    canonicalUrl: string
    category: string | null
    platform: "jakmall"
    price: number | null
    productIdentifier: string | null
  }>
  status: ProductReviewStatus
  stock: number | null
  title: string | null
  updatedAt: string
  variantAxes: readonly Readonly<{
    name: string
    options: readonly string[]
  }>[]
  variants: readonly ProductReviewVariant[]
  weightGrams: number | null
}>

export type ProductReviewIssue = Readonly<{
  code: string
  field: string
  message: string
  severity: "required" | "warning"
}>

export type ProductReviewEditInput = Readonly<{
  brand: string | null
  description: string | null
  gtin: string | null
  heightCm: number | null
  lengthCm: number | null
  productId: string
  sellingPrice: number | null
  sku: string | null
  stock: number | null
  title: string | null
  weightGrams: number | null
  widthCm: number | null
}>

export type VariantReviewEditInput = Readonly<{
  productId: string
  sellingPrice: number | null
  sku: string | null
  stock: number | null
  variantId: string
}>

type FormParseResult<T> =
  | Readonly<{ data: T; success: true }>
  | Readonly<{ success: false }>

const blankableString = z.string().trim()

function nullableText(maxLength: number) {
  return blankableString
    .max(maxLength)
    .transform((value) => (value.length === 0 ? null : value))
}

function nullableInteger(label: string) {
  return blankableString.transform((value, context) => {
    if (value.length === 0) return null

    if (!/^\d+$/u.test(value)) {
      context.addIssue({
        code: "custom",
        message: `${label} must be a whole number of zero or more.`,
      })
      return z.NEVER
    }

    const number = Number(value)
    if (!Number.isSafeInteger(number)) {
      context.addIssue({
        code: "custom",
        message: `${label} is outside the supported range.`,
      })
      return z.NEVER
    }

    return number
  })
}

function nullableDecimal(label: string) {
  return blankableString.transform((value, context) => {
    if (value.length === 0) return null

    if (!/^\d+(?:\.\d{1,2})?$/u.test(value)) {
      context.addIssue({
        code: "custom",
        message: `${label} must be zero or a positive number with up to two decimals.`,
      })
      return z.NEVER
    }

    const number = Number(value)
    if (!Number.isFinite(number)) {
      context.addIssue({
        code: "custom",
        message: `${label} is outside the supported range.`,
      })
      return z.NEVER
    }

    return number
  })
}

export const productReviewFormSchema = z
  .object({
    brand: nullableText(500),
    description: nullableText(100_000),
    gtin: nullableText(500),
    heightCm: nullableDecimal("Height"),
    lengthCm: nullableDecimal("Length"),
    productId: z.uuid(),
    sellingPrice: nullableInteger("Selling price"),
    sku: nullableText(500),
    stock: nullableInteger("Stock"),
    title: nullableText(500),
    weightGrams: nullableInteger("Weight"),
    widthCm: nullableDecimal("Width"),
  })
  .strict()

export const variantReviewFormSchema = z
  .object({
    productId: z.uuid(),
    sellingPrice: nullableInteger("Selling price"),
    sku: nullableText(500),
    stock: nullableInteger("Stock"),
    variantId: z.uuid(),
  })
  .strict()

function formDataRecord(formData: FormData) {
  const values: Record<string, string> = {}

  for (const [name, value] of formData.entries()) {
    if (name.startsWith("$ACTION_")) continue

    if (typeof value !== "string" || Object.hasOwn(values, name)) {
      return null
    }

    values[name] = value
  }

  return values
}

export function parseProductReviewEditFormData(
  formData: FormData
): FormParseResult<ProductReviewEditInput> {
  const values = formDataRecord(formData)
  if (!values) return { success: false }

  const parsed = productReviewFormSchema.safeParse(values)
  return parsed.success
    ? { data: parsed.data, success: true }
    : { success: false }
}

export function parseVariantReviewEditFormData(
  formData: FormData
): FormParseResult<VariantReviewEditInput> {
  const values = formDataRecord(formData)
  if (!values) return { success: false }

  const parsed = variantReviewFormSchema.safeParse(values)
  return parsed.success
    ? { data: parsed.data, success: true }
    : { success: false }
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function hasUsableImage(images: readonly ProductReviewImage[]) {
  return images.some((image) => {
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

function sourceWarnings(product: ProductReview) {
  const warnings = product.rawSourceData.warnings
  return Array.isArray(warnings)
    ? warnings.filter((warning): warning is string => typeof warning === "string")
    : []
}

export function buildProductReviewIssues(
  product: ProductReview
): readonly ProductReviewIssue[] {
  const issues: ProductReviewIssue[] = []

  if (!hasText(product.title)) {
    issues.push({
      code: "PRODUCT_TITLE_REQUIRED",
      field: "title",
      message: "Add a product title before continuing.",
      severity: "required",
    })
  }

  if (!hasUsableImage(product.images)) {
    issues.push({
      code: "PRODUCT_IMAGE_REQUIRED",
      field: "images",
      message: "No usable JakMall product image is available.",
      severity: "required",
    })
  }

  if (product.variants.length === 0) {
    if (product.sellingPrice === null) {
      issues.push({
        code: "PRODUCT_SELLING_PRICE_REQUIRED",
        field: "sellingPrice",
        message: "Set the product selling price.",
        severity: "required",
      })
    }

    if (product.stock === null) {
      issues.push({
        code: "PRODUCT_STOCK_UNKNOWN",
        field: "stock",
        message: "Confirm the product stock quantity.",
        severity: "required",
      })
    }
  } else {
    for (const variant of product.variants) {
      if (variant.sellingPrice === null) {
        issues.push({
          code: "VARIANT_SELLING_PRICE_REQUIRED",
          field: `variants.${variant.id}.sellingPrice`,
          message: `Set a selling price for variant ${variant.position + 1}.`,
          severity: "required",
        })
      }

      if (variant.stock === null) {
        issues.push({
          code: "VARIANT_STOCK_UNKNOWN",
          field: `variants.${variant.id}.stock`,
          message: `Confirm stock for variant ${variant.position + 1}.`,
          severity: "required",
        })
      }

      const options = Object.entries(variant.optionValues)
      if (options.length === 0) {
        issues.push({
          code: "VARIANT_OPTIONS_UNCONFIRMED",
          field: `variants.${variant.id}.optionValues`,
          message: `Variant ${variant.position + 1} has no confirmed option mapping.`,
          severity: "warning",
        })
      } else if (options.some(([name, value]) => !name.trim() || !value.trim())) {
        issues.push({
          code: "VARIANT_REPRESENTATION_INCOMPLETE",
          field: `variants.${variant.id}.optionValues`,
          message: `Variant ${variant.position + 1} has an incomplete option value.`,
          severity: "required",
        })
      }

      if (
        !hasText(product.sku) &&
        !hasText(variant.sku) &&
        !hasText(variant.sourceVariantIdentifier)
      ) {
        issues.push({
          code: "VARIANT_SKU_RECOMMENDED",
          field: `variants.${variant.id}.sku`,
          message: `Add a SKU for variant ${variant.position + 1} when available.`,
          severity: "warning",
        })
      }
    }
  }

  if (
    !hasText(product.sku) &&
    product.variants.length === 0 &&
    !hasText(product.source.productIdentifier)
  ) {
    issues.push({
      code: "PRODUCT_SKU_RECOMMENDED",
      field: "sku",
      message: "Add a SKU when a useful product identifier is available.",
      severity: "warning",
    })
  }

  if (product.weightGrams === null) {
    issues.push({
      code: "PRODUCT_WEIGHT_RECOMMENDED",
      field: "weightGrams",
      message: "Confirm product weight before Shopee mapping.",
      severity: "warning",
    })
  }

  const dimensions = Object.values(product.dimensionsCm)
  const suppliedDimensions = dimensions.filter((value) => value !== null).length
  if (suppliedDimensions > 0 && suppliedDimensions < dimensions.length) {
    issues.push({
      code: "DIMENSIONS_INCOMPLETE",
      field: "dimensionsCm",
      message: "Complete all dimensions or leave all three unknown.",
      severity: "warning",
    })
  }

  if (sourceWarnings(product).includes("OFFER_OPTIONS_UNMAPPED")) {
    issues.push({
      code: "OFFER_OPTIONS_UNMAPPED",
      field: "variants",
      message: "JakMall offer options could not be confirmed during import.",
      severity: "warning",
    })
  }

  return issues
}
