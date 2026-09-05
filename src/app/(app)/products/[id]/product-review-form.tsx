import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Info,
  PackageOpen,
  Send,
} from "lucide-react"
import Link from "next/link"

import { ProductStatus } from "@/components/product-status"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { buildProductReviewIssues, type ProductReview } from "@/lib/product-review"

import { ProductDetailsForm } from "./product-details-form"
import { ProductGallery } from "./product-gallery"
import { ProductVariantEditor } from "./product-variant-editor"
import { ReviewChecklist } from "./review-checklist"
import { SourceDetails } from "./source-details"

function ReadOnlyState({ product }: { product: ProductReview }) {
  if (product.status === "REVIEW_REQUIRED") return null

  const detail =
    product.status === "PENDING" || product.status === "IMPORTING"
      ? "Import processing must finish before review fields can be edited."
      : product.status === "FAILED"
        ? product.failure?.message ?? "The import failed before review could continue."
        : "This product has already moved beyond the Milestone 4 review state."

  return (
    <Alert className="mt-5" variant={product.status === "FAILED" ? "destructive" : "default"}>
      {product.status === "FAILED" ? (
        <AlertCircle aria-hidden="true" />
      ) : (
        <Info aria-hidden="true" />
      )}
      <AlertTitle>This product is not editable</AlertTitle>
      <AlertDescription>
        {detail}
        {product.failure ? ` (${product.failure.code})` : ""}
      </AlertDescription>
    </Alert>
  )
}

export function ProductReviewForm({ product }: { product: ProductReview }) {
  const editable = product.status === "REVIEW_REQUIRED"
  const issues = buildProductReviewIssues(product)

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="border-b pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            className={buttonVariants({ variant: "ghost" })}
            href="/products"
          >
            <ArrowLeft aria-hidden="true" />
            Back to Products
          </Link>
          <div className="flex flex-wrap gap-2">
            <a
              className={buttonVariants({ variant: "outline" })}
              href={product.source.canonicalUrl}
              rel="noreferrer"
              target="_blank"
            >
              View on JakMall
              <ExternalLink aria-hidden="true" />
            </a>
            {product.status === "REVIEW_REQUIRED" || product.status === "READY" ? (
              <Link
                className={buttonVariants()}
                href={`/products/${product.id}/shopee`}
              >
                <Send aria-hidden="true" />
                {product.status === "READY"
                  ? "View Shopee Draft"
                  : "Prepare for Shopee"}
              </Link>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Product review
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {product.title ?? "Untitled product"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Inspect imported evidence and correct only the business fields that
              belong to this review stage.
            </p>
          </div>
          <ProductStatus status={product.status} />
        </div>
      </header>

      <ReadOnlyState product={product} />

      <div className="mt-6 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <main className="min-w-0 space-y-8">
          <section
            aria-labelledby="product-identity-title"
            className="grid gap-6 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.5fr)]"
          >
            <div>
              <h2 id="product-identity-title" className="sr-only">
                Product identity and images
              </h2>
              <ProductGallery images={product.images} title={product.title} />
              <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Source platform</dt>
                  <dd className="mt-0.5 font-medium capitalize">
                    {product.source.platform}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Source product ID</dt>
                  <dd className="mt-0.5 truncate font-mono font-medium">
                    {product.source.productIdentifier ?? "Not available"}
                  </dd>
                </div>
              </dl>
            </div>
            <ProductDetailsForm editable={editable} product={product} />
          </section>

          <section aria-labelledby="variants-title" className="border-t pt-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="variants-title" className="text-lg font-semibold">
                  Variants
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Each persisted variant has its own save boundary.
                </p>
              </div>
              <p className="text-sm text-muted-foreground tabular-nums">
                {product.variants.length} variants
              </p>
            </div>

            {product.variants.length > 0 ? (
              <div className="mt-5 overflow-x-auto rounded-lg border px-4 py-5" role="region" aria-label="Product variants" tabIndex={0}>
                <div className="min-w-[640px]">
                  {product.variants.map((variant) => (
                    <ProductVariantEditor
                      editable={editable}
                      key={variant.id}
                      variant={variant}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-5 flex gap-3 rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                <PackageOpen aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                No concrete variants were imported. Product-level price and stock
                are authoritative.
              </div>
            )}
          </section>

          <SourceDetails product={product} />
        </main>

        <ReviewChecklist issues={issues} />
      </div>
    </div>
  )
}
