import type { ProductSummary } from "./supabase/product-repository"

export type ProductStatusTone = "danger" | "neutral" | "success" | "warning"

const productStatusPresentation = {
  FAILED: { label: "Failed", tone: "danger" },
  IMPORTING: { label: "Importing", tone: "neutral" },
  PENDING: { label: "Pending", tone: "neutral" },
  READY: { label: "Ready for Shopee", tone: "success" },
  REVIEW_REQUIRED: { label: "Needs Review", tone: "warning" },
} as const satisfies Record<
  ProductSummary["status"],
  Readonly<{ label: string; tone: ProductStatusTone }>
>

export function getProductStatusPresentation(
  status: ProductSummary["status"]
) {
  return productStatusPresentation[status]
}

export function buildDashboardSummary(
  products: readonly ProductSummary[]
) {
  return {
    totalProducts: products.length,
    readyForShopee: products.filter((product) => product.status === "READY")
      .length,
    needsReview: products.filter(
      (product) => product.status === "REVIEW_REQUIRED"
    ).length,
    failed: products.filter((product) => product.status === "FAILED").length,
  }
}

const idrFormatter = new Intl.NumberFormat("id-ID", {
  currency: "IDR",
  maximumFractionDigits: 0,
  style: "currency",
})

const updatedAtFormatter = new Intl.DateTimeFormat("en-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
})

export function formatIdr(value: number | null) {
  return value === null ? "Not available" : idrFormatter.format(value)
}

export function formatProductUpdatedAt(value: string) {
  return updatedAtFormatter.format(new Date(value))
}
