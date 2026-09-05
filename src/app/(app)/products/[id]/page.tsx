import type { Metadata } from "next"
import { AlertCircle } from "lucide-react"
import { notFound } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getProductReview } from "@/lib/supabase/product-review-repository"

import { ProductReviewForm } from "./product-review-form"

export const metadata: Metadata = {
  title: "Product Review | CatalogBridge",
}

export default async function ProductReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getProductReview(id)

  if (!result.ok && result.error === "PRODUCT_NOT_FOUND") {
    notFound()
  }

  if (!result.ok) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Product could not be loaded</AlertTitle>
          <AlertDescription>
            Refresh the page. If the problem continues, check the Supabase
            connection before editing catalog data.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <ProductReviewForm product={result.product} />
}
