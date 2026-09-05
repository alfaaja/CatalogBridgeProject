"use client"

import { useActionState } from "react"
import { ArrowLeft, CheckCircle2, RotateCcw, Save } from "lucide-react"
import Link from "next/link"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ProductReview } from "@/lib/product-review"
import type { ShopeeDraft, ShopeePreview as Preview } from "@/lib/shopee-draft"

import {
  markProductReadyForShopeeAction,
  reopenShopeeMappingAction,
  saveShopeeDraftAction,
  type ShopeeActionState,
} from "./actions"
import { DestinationAttributesEditor } from "./destination-attributes-editor"
import { ShopeePreview } from "./shopee-preview"
import { ShopeeReadinessChecklist } from "./shopee-readiness-checklist"

const initial: ShopeeActionState = {}
export function ShopeeMappingForm({
  draft,
  preview,
  product,
}: {
  draft: ShopeeDraft | null
  preview: Preview
  product: ProductReview
}) {
  const editable = product.status === "REVIEW_REQUIRED"
  const ready = product.status === "READY"
  const [saveState, saveAction, saving] = useActionState(
    saveShopeeDraftAction.bind(null, product.id),
    initial
  )
  const [readyState, readyAction, readying] = useActionState(
    markProductReadyForShopeeAction.bind(null, product.id),
    initial
  )
  const [reopenState, reopenAction, reopening] = useActionState(
    reopenShopeeMappingAction.bind(null, product.id),
    initial
  )
  const blockers = preview.issues.filter(
    (issue) => issue.severity === "blocker"
  ).length
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="border-b pb-5">
        <Link
          className={buttonVariants({ variant: "ghost" })}
          href={`/products/${product.id}`}
        >
          <ArrowLeft aria-hidden="true" />
          Back to Product Review
        </Link>
        <p className="mt-4 text-xs font-medium uppercase text-muted-foreground">
          Shopee mapping
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Prepare for Shopee</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build a locally validated draft. This does not upload, submit, or
          publish anything.
        </p>
      </header>
      <div className="mt-6 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <main className="min-w-0 space-y-8">
          <ShopeePreview preview={preview} product={product} />
          {editable ? (
            <form action={saveAction} className="space-y-8 border-t pt-6">
              <section>
                <h2 className="text-lg font-semibold">Destination content</h2>
                <div className="mt-4 grid gap-4">
                  <div>
                    <Label htmlFor="titleOverride">
                      Shopee title override · REVIEW_REQUIRED
                    </Label>
                    <Input
                      defaultValue={draft?.titleOverride ?? ""}
                      id="titleOverride"
                      maxLength={255}
                      name="titleOverride"
                      placeholder={product.title ?? "Shopee product title"}
                    />
                  </div>
                  <div>
                    <Label htmlFor="descriptionOverride">
                      Shopee description override · REVIEW_REQUIRED
                    </Label>
                    <Textarea
                      defaultValue={draft?.descriptionOverride ?? ""}
                      id="descriptionOverride"
                      maxLength={3000}
                      name="descriptionOverride"
                      placeholder={
                        product.description ?? "Shopee product description"
                      }
                    />
                  </div>
                </div>
              </section>
              <section className="border-t pt-6">
                <h2 className="text-lg font-semibold">
                  Manual category mapping
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  No taxonomy or category ID is guessed.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="categoryPath">Category path</Label>
                    <Input
                      defaultValue={draft?.categoryPath ?? ""}
                      id="categoryPath"
                      maxLength={500}
                      name="categoryPath"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoryId">Category ID (optional)</Label>
                    <Input
                      defaultValue={draft?.categoryId ?? ""}
                      id="categoryId"
                      maxLength={200}
                      name="categoryId"
                    />
                  </div>
                </div>
                <label className="mt-4 flex gap-2 text-sm">
                  <input
                    defaultChecked={draft?.categoryConfirmed}
                    name="categoryConfirmed"
                    type="checkbox"
                    value="true"
                  />
                  I confirm this Shopee category mapping.
                </label>
              </section>
              <section className="border-t pt-6">
                <h2 className="text-lg font-semibold">Category attributes</h2>
                <div className="mt-4">
                  <DestinationAttributesEditor
                    attributes={draft?.categoryAttributes ?? []}
                  />
                </div>
                <label className="mt-4 flex gap-2 text-sm">
                  <input
                    defaultChecked={draft?.categoryAttributesReviewed}
                    name="categoryAttributesReviewed"
                    type="checkbox"
                    value="true"
                  />
                  Category-specific attributes reviewed.
                </label>
                <p className="mt-2 text-xs text-muted-foreground">
                  CatalogBridge confirms that you reviewed these attributes.
                  Shopee Seller Centre may still require additional
                  category-specific attributes.
                </p>
              </section>
              <section className="border-t pt-6">
                <h2 className="text-lg font-semibold">
                  Reviewer destination decisions
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reviewer confirmation required. These values were not detected
                  from JakMall.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {[
                    [
                      "dangerousProduct",
                      "Dangerous product",
                      draft?.dangerousProduct ?? "UNCONFIRMED",
                      ["UNCONFIRMED", "NO", "YES"],
                    ],
                    [
                      "condition",
                      "Condition",
                      draft?.condition ?? "UNCONFIRMED",
                      ["UNCONFIRMED", "NEW", "USED"],
                    ],
                    [
                      "preorder",
                      "Preorder",
                      draft?.preorder ?? "UNCONFIRMED",
                      ["UNCONFIRMED", "NO", "YES"],
                    ],
                  ].map(([name, label, value, options]) => (
                    <div key={name as string}>
                      <Label htmlFor={name as string}>{label as string}</Label>
                      <select
                        className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm"
                        defaultValue={value as string}
                        id={name as string}
                        name={name as string}
                      >
                        {(options as string[]).map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </section>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
                <p aria-live="polite" className="text-sm text-muted-foreground">
                  {saveState.message}
                </p>
                <Button disabled={saving} type="submit">
                  <Save aria-hidden="true" />
                  {saving ? "Saving..." : "Save Shopee Draft"}
                </Button>
              </div>
            </form>
          ) : null}
          {editable ? (
            <form
              action={readyAction}
              className="flex flex-wrap items-center justify-between gap-3 border-t pt-6"
            >
              <p className="text-sm text-muted-foreground">
                {readyState.message ??
                  `${blockers} current blockers. Readiness is rechecked from persisted data.`}
              </p>
              <Button disabled={readying || blockers > 0} type="submit">
                <CheckCircle2 aria-hidden="true" />
                {readying ? "Validating..." : "Mark Ready for Shopee"}
              </Button>
            </form>
          ) : ready ? (
            <form
              action={reopenAction}
              className="flex flex-wrap items-center justify-between gap-3 border-t pt-6"
            >
              <p className="text-sm text-muted-foreground">
                {reopenState.message ??
                  "READY drafts are read-only until reopened."}
              </p>
              <Button disabled={reopening} type="submit" variant="outline">
                <RotateCcw aria-hidden="true" />
                {reopening ? "Reopening..." : "Reopen Shopee Mapping"}
              </Button>
            </form>
          ) : (
            <p className="border-t pt-6 text-sm text-muted-foreground">
              Shopee mapping is available after product review is required.
            </p>
          )}
        </main>
        <ShopeeReadinessChecklist issues={preview.issues} />
      </div>
    </div>
  )
}
