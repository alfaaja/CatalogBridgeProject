"use client";

import { useActionState } from "react";
import { Import, Info, Upload } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { importProductAction, type ImportProductActionState } from "./actions";

function SubmitButton({
  assisted = false,
  pending,
}: {
  assisted?: boolean;
  pending: boolean;
}) {
  return (
    <Button
      aria-describedby="import-help"
      className="h-10 sm:min-w-40"
      disabled={pending}
      type="submit"
    >
      {assisted ? <Upload aria-hidden="true" /> : <Import aria-hidden="true" />}
      {pending
        ? "Importing..."
        : assisted
          ? "Continue Import"
          : "Import Product"}
    </Button>
  );
}

export function ImportProductForm({
  initialState = {},
}: {
  initialState?: ImportProductActionState;
}) {
  const [state, formAction, pending] = useActionState(
    importProductAction,
    initialState,
  );
  const assisted = state.recovery === "browser_verification";

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

      {assisted ? (
        <Alert aria-live="polite" role="status">
          <Info aria-hidden="true" />
          <AlertTitle>JakMall requires browser verification</AlertTitle>
          <AlertDescription>
            <p>
              Direct import was blocked by JakMall&apos;s browser verification.
              Open this product normally, save the page as HTML, then upload the
              saved page to continue.
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-5">
              <li>Open the same JakMall product page.</li>
              <li>Save the page as HTML.</li>
              <li>Upload the saved file below.</li>
            </ol>
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
              Paste a public JakMall product URL. CatalogBridge will try to
              import it directly.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Label htmlFor="jakmall-url">Product URL</Label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Input
              aria-describedby="import-help"
              className="h-10 flex-1 bg-background"
              defaultValue={state.sourceUrl}
              id="jakmall-url"
              key={assisted ? "assisted-url" : "direct-url"}
              name="jakmallUrl"
              placeholder="https://www.jakmall.com/store/product-name"
              readOnly={assisted}
              required
              type="url"
            />
            {!assisted ? <SubmitButton pending={pending} /> : null}
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

      {assisted ? (
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
                Continue with saved page
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Use the HTML file saved from the same product URL shown above.
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
              required
              type="file"
            />
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Upload one `.html` or `.htm` file up to 1 MiB. CatalogBridge reads
              product data from the file but never displays or stores the full
              HTML.
            </p>
            <div className="mt-4">
              <SubmitButton assisted pending={pending} />
            </div>
          </div>
        </section>
      ) : null}
    </form>
  );
}
