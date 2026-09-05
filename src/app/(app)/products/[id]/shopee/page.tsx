import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProductReview } from "@/lib/supabase/product-review-repository"
import { getShopeeDraft } from "@/lib/supabase/shopee-draft-repository"
import { buildShopeePreview } from "@/lib/shopee-draft"
import { ShopeeMappingForm } from "./shopee-mapping-form"

export const metadata: Metadata = {
  title: "Prepare for Shopee | CatalogBridge",
}
export default async function ShopeeMappingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [productResult, draftResult] = await Promise.all([
    getProductReview(id),
    getShopeeDraft(id),
  ])
  if (!productResult.ok && productResult.error === "PRODUCT_NOT_FOUND")
    notFound()
  if (!productResult.ok || !draftResult.ok)
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">
          Shopee mapping could not be loaded
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Refresh the page and try again.
        </p>
      </div>
    )
  const preview = buildShopeePreview(productResult.product, draftResult.draft)
  return (
    <ShopeeMappingForm
      draft={draftResult.draft}
      key={draftResult.draft?.updatedAt ?? "new"}
      preview={preview}
      product={productResult.product}
    />
  )
}
