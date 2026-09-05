"use client"

import { useActionState } from "react"
import { Import, Info, Upload } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  importProductAction,
  type ImportProductActionState,
} from "./actions"

const initialState: ImportProductActionState = {}

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button
      aria-describedby="import-help"
      className="h-10 sm:min-w-40"
      disabled={pending}
      type="submit"
    >
      <Import aria-hidden="true" />
      {pending ? "Importing..." : "Import Product"}
    </Button>
  )
}

export function ImportProductForm() {
  const [state, formAction, pending] = useActionState(
    importProductAction,
    initialState
  )

  return (
    <form action={formAction} className="space-y-8">
      {state.error ? (
        <Alert variant="destructive">
          <Info aria-hidden="true" />
          <AlertTitle>Import could not continue</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {state.success ? (
        <Alert>
          <Info aria-hidden="true" />
          <AlertTitle>{state.success}</AlertTitle>
          <AlertDescription>
            Open Dashboard or Products to review the newly imported record.
          </AlertDescription>
        </Alert>
      ) : null}

      <section aria-labelledby="import-link-title" className="border-t pt-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
            <Import aria-hidden="true" className="size-4" />
          </span>
          <div>
            <h2 id="import-link-title" className="text-lg font-semibold">
              JakMall product link
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Accepted source: one public HTTPS product page on jakmall.com.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Label htmlFor="jakmall-url">Product URL</Label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Input
              aria-describedby="import-help"
              className="h-10 flex-1 bg-background"
              id="jakmall-url"
              name="jakmallUrl"
              placeholder="https://www.jakmall.com/store/product-name"
              required
              type="url"
            />
            <SubmitButton pending={pending} />
          </div>
          <p
            aria-live="polite"
            className="mt-2 text-xs leading-5 text-muted-foreground"
            id="import-help"
          >
            Use the canonical product page, without account or checkout links.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="assisted-html-title"
        className="rounded-lg border bg-background p-4"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
            <Upload aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 id="assisted-html-title" className="text-base font-semibold">
              Optional HTML file
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              JakMall may require browser verification for automated requests.
              If direct import is blocked, open the product normally in your
              browser, save the page as HTML, then upload it here.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="assisted-html">Saved product page</Label>
          <Input
            accept=".html,.htm,text/html,application/xhtml+xml"
            className="mt-2 bg-background"
            id="assisted-html"
            name="assistedHtml"
            type="file"
          />
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Upload one `.html` or `.htm` file up to 1 MiB. CatalogBridge reads
            product data from the file but never displays or stores the full
            HTML.
          </p>
        </div>
      </section>
    </form>
  )
}
