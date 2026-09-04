import type { Metadata } from "next"
import { Import, Info, Link2 } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export const metadata: Metadata = {
  title: "Import Product | CatalogBridge",
}

export default function ImportProductPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader
        description="Enter one public JakMall product link to begin catalog preparation."
        eyebrow="Catalog intake"
        title="Import Product"
      />

      <div className="mt-6 max-w-4xl">
        <Alert role="note">
          <Info aria-hidden="true" />
          <AlertTitle>Import is not active yet</AlertTitle>
          <AlertDescription>
            No product will be created from this screen in the current build.
            The import workflow will be connected in the next milestone.
          </AlertDescription>
        </Alert>

        <section className="mt-8 border-t pt-6" aria-labelledby="import-link-title">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
              <Link2 aria-hidden="true" className="size-4" />
            </span>
            <div>
              <h2 id="import-link-title" className="text-lg font-semibold">
                JakMall product link
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Accepted source: a public HTTPS product page on jakmall.com.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <Label htmlFor="jakmall-url">Product URL</Label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Input
                aria-describedby="jakmall-url-help import-availability"
                className="h-10 flex-1 bg-background"
                id="jakmall-url"
                name="jakmallUrl"
                placeholder="https://www.jakmall.com/store/product-name"
                type="url"
              />
              <Button
                aria-describedby="import-availability"
                className="h-10 sm:min-w-40"
                disabled
                type="button"
              >
                <Import aria-hidden="true" />
                Import Product
              </Button>
            </div>
            <p
              className="mt-2 text-xs leading-5 text-muted-foreground"
              id="jakmall-url-help"
            >
              Use the canonical product page, without account or checkout links.
            </p>
            <p className="mt-1 text-xs font-medium" id="import-availability">
              Importing is unavailable in this build.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
