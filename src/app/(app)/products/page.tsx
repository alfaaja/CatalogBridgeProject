import type { Metadata } from "next"
import Link from "next/link"
import { AlertCircle, Plus } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import {
  ProductEmptyState,
  ProductTable,
} from "@/components/product-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { listProductSummaries } from "@/lib/supabase/product-repository"

export const metadata: Metadata = {
  title: "Products | CatalogBridge",
}

export default async function ProductsPage() {
  const productsResult = await listProductSummaries()

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader
        action={
          <Link className={buttonVariants({ size: "lg" })} href="/import">
            <Plus aria-hidden="true" />
            Import Product
          </Link>
        }
        description="Review persisted JakMall products and their Shopee readiness."
        eyebrow="Catalog"
        title="Products"
      />

      <section className="mt-6" aria-labelledby="product-list-title">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 id="product-list-title" className="text-lg font-semibold">
              Product catalog
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Real products available to the authenticated reviewer.
            </p>
          </div>
          {productsResult.ok ? (
            <p className="text-sm text-muted-foreground tabular-nums">
              {productsResult.products.length.toLocaleString("en-ID")} products
            </p>
          ) : null}
        </div>

        {!productsResult.ok ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>Products could not be loaded</AlertTitle>
            <AlertDescription>
              Refresh the page. If the problem continues, check the Supabase
              connection before continuing.
            </AlertDescription>
          </Alert>
        ) : productsResult.products.length === 0 ? (
          <ProductEmptyState />
        ) : (
          <ProductTable products={productsResult.products} />
        )}
      </section>
    </div>
  )
}
