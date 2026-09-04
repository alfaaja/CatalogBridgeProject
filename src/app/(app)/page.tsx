import type { Metadata } from "next"
import Link from "next/link"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Package,
  Plus,
  XCircle,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import {
  ProductEmptyState,
  ProductTable,
} from "@/components/product-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { buildDashboardSummary } from "@/lib/product-presentation"
import {
  listProductSummaries,
  type ProductSummary,
} from "@/lib/supabase/product-repository"

export const metadata: Metadata = {
  title: "Dashboard | CatalogBridge",
}

type DashboardPageProps = {
  searchParams: Promise<{ auth_error?: string | string[] }>
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const [productsResult, { auth_error: authError }] = await Promise.all([
    listProductSummaries(),
    searchParams,
  ])

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader
        action={
          <Link className={buttonVariants({ size: "lg" })} href="/import">
            <Plus aria-hidden="true" />
            Import Product
          </Link>
        }
        description="Monitor imported products and the work that needs attention."
        eyebrow="Overview"
        title="Dashboard"
      />

      {authError ? (
        <Alert className="mt-6" variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Unable to sign out</AlertTitle>
          <AlertDescription>
            Your session is still active. Please try signing out again.
          </AlertDescription>
        </Alert>
      ) : null}

      {!productsResult.ok ? (
        <Alert className="mt-6" variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Product data could not be loaded</AlertTitle>
          <AlertDescription>
            Refresh the page. If the problem continues, check the Supabase
            connection before continuing.
          </AlertDescription>
        </Alert>
      ) : (
        <DashboardContent products={productsResult.products} />
      )}
    </div>
  )
}

function DashboardContent({
  products,
}: {
  products: readonly ProductSummary[]
}) {
  const summary = buildDashboardSummary(products)
  const metrics = [
    {
      label: "Total Products",
      value: summary.totalProducts,
      icon: Package,
      iconClassName: "text-slate-600",
    },
    {
      label: "Ready for Shopee",
      value: summary.readyForShopee,
      icon: CheckCircle2,
      iconClassName: "text-emerald-700",
    },
    {
      label: "Needs Review",
      value: summary.needsReview,
      icon: AlertTriangle,
      iconClassName: "text-amber-700",
    },
    {
      label: "Failed",
      value: summary.failed,
      icon: XCircle,
      iconClassName: "text-rose-700",
    },
  ] as const

  return (
    <>
      <dl
        aria-label="Product summary"
        className="mt-6 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map((metric) => (
          <div
            className="bg-background p-4"
            key={metric.label}
          >
            <div className="flex items-center justify-between gap-3">
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {metric.label}
              </dt>
              <metric.icon
                aria-hidden="true"
                className={`size-4 ${metric.iconClassName}`}
              />
            </div>
            <dd className="mt-3 text-2xl font-semibold tabular-nums">
              {metric.value.toLocaleString("en-ID")}
            </dd>
          </div>
        ))}
      </dl>

      <section className="mt-8" aria-labelledby="recent-products-title">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h2 id="recent-products-title" className="text-lg font-semibold">
              Recent Products
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Most recently updated catalog records.
            </p>
          </div>
          {products.length > 0 ? (
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/products"
            >
              View all products
            </Link>
          ) : null}
        </div>

        {products.length === 0 ? (
          <ProductEmptyState />
        ) : (
          <ProductTable
            accessibleLabel="Recent products"
            products={products.slice(0, 5)}
          />
        )}
      </section>
    </>
  )
}
