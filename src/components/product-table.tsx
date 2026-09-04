import { Package } from "lucide-react"
import Link from "next/link"

import { ProductStatus } from "@/components/product-status"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatIdr,
  formatProductUpdatedAt,
} from "@/lib/product-presentation"
import type { ProductSummary } from "@/lib/supabase/product-repository"

export function ProductEmptyState() {
  return (
    <div className="rounded-lg border bg-background px-6 py-16 text-center">
      <span className="mx-auto flex size-10 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
        <Package aria-hidden="true" className="size-5" />
      </span>
      <h2 className="mt-4 text-base font-semibold">No products yet</h2>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        Import a JakMall product when the import workflow becomes available.
      </p>
      <Link
        className={buttonVariants({ className: "mt-5" })}
        href="/import"
      >
        Go to Import Product
      </Link>
    </div>
  )
}

export function ProductTable({
  accessibleLabel = "Product catalog",
  products,
}: {
  accessibleLabel?: string
  products: readonly ProductSummary[]
}) {
  return (
    <div className="rounded-lg border bg-background">
      <p className="border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground lg:hidden">
        Scroll horizontally to view all product fields.
      </p>
      <Table className="min-w-[720px]" containerLabel={accessibleLabel}>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-9 pl-4 text-xs tracking-wide text-muted-foreground uppercase">
              Product
            </TableHead>
            <TableHead className="h-9 text-right text-xs tracking-wide text-muted-foreground uppercase">
              Source price
            </TableHead>
            <TableHead className="h-9 text-right text-xs tracking-wide text-muted-foreground uppercase">
              Selling price
            </TableHead>
            <TableHead className="h-9 text-xs tracking-wide text-muted-foreground uppercase">
              Status
            </TableHead>
            <TableHead className="h-9 pr-4 text-right text-xs tracking-wide text-muted-foreground uppercase">
              Updated
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="py-3 pl-4">
                <div className="flex min-w-64 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
                    <Package aria-hidden="true" className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {product.title ?? "Untitled product"}
                    </p>
                    {product.title === null ? (
                      <p className="text-xs text-muted-foreground">
                        Product details incomplete
                      </p>
                    ) : null}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right text-xs tabular-nums">
                {formatIdr(product.sourcePrice)}
              </TableCell>
              <TableCell className="text-right text-xs tabular-nums">
                {formatIdr(product.sellingPrice)}
              </TableCell>
              <TableCell>
                <ProductStatus status={product.status} />
              </TableCell>
              <TableCell className="pr-4 text-right text-xs text-muted-foreground">
                <time dateTime={product.updatedAt}>
                  {formatProductUpdatedAt(product.updatedAt)}
                </time>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
