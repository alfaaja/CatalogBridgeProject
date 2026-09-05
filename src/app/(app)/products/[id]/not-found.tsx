import { PackageX } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export default function ProductNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <span className="flex size-11 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
        <PackageX aria-hidden="true" className="size-5" />
      </span>
      <h1 className="mt-4 text-xl font-semibold">Product not found</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        This product is unavailable or does not belong to the current reviewer.
      </p>
      <Link
        className={buttonVariants({ className: "mt-5", variant: "outline" })}
        href="/products"
      >
        Back to Products
      </Link>
    </div>
  )
}
