"use client"

import { useActionState } from "react"
import { AlertTriangle, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatIdr } from "@/lib/product-presentation"
import type { ProductReviewVariant } from "@/lib/product-review"

import {
  saveVariantReviewAction,
  type ProductReviewActionState,
} from "./actions"

const initialProductReviewActionState: ProductReviewActionState = {}

export function ProductVariantEditor({
  editable,
  variant,
}: {
  editable: boolean
  variant: ProductReviewVariant
}) {
  const [state, action, pending] = useActionState(
    saveVariantReviewAction,
    initialProductReviewActionState
  )
  const options = Object.entries(variant.optionValues)
  const prefix = `variant-${variant.id}`

  return (
    <form
      action={editable ? action : undefined}
      className="border-t py-5 first:border-t-0 first:pt-0"
      data-variant-id={variant.id}
      key={variant.updatedAt}
    >
      <input name="productId" type="hidden" value={variant.productId} />
      <input name="variantId" type="hidden" value={variant.id} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-medium">Variant {variant.position + 1}</h3>
          {options.length > 0 ? (
            <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {options.map(([name, value]) => (
                <div className="flex gap-1" key={name}>
                  <dt>{name}:</dt>
                  <dd className="font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-700">
              <AlertTriangle aria-hidden="true" className="size-3.5" />
              No confirmed option mapping; source values were not invented.
            </p>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-1 text-xs sm:text-right">
          <div>
            <dt className="text-muted-foreground">Source price</dt>
            <dd className="font-medium tabular-nums">
              {formatIdr(variant.sourcePrice)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Source ID</dt>
            <dd className="font-mono font-medium">
              {variant.sourceVariantIdentifier ?? "Not available"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor={`${prefix}-selling-price`}>Selling price (IDR)</Label>
          <Input
            className="mt-2"
            defaultValue={variant.sellingPrice ?? ""}
            id={`${prefix}-selling-price`}
            inputMode="numeric"
            min="0"
            name="sellingPrice"
            pattern="[0-9]*"
            readOnly={!editable}
            type="text"
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-stock`}>Stock</Label>
          <Input
            className="mt-2"
            defaultValue={variant.stock ?? ""}
            id={`${prefix}-stock`}
            inputMode="numeric"
            min="0"
            name="stock"
            pattern="[0-9]*"
            readOnly={!editable}
            type="text"
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-sku`}>SKU</Label>
          <Input
            className="mt-2 font-mono"
            defaultValue={variant.sku ?? ""}
            id={`${prefix}-sku`}
            maxLength={500}
            name="sku"
            readOnly={!editable}
          />
        </div>
      </div>

      {editable ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {state.message ? (
            <p
              aria-live="polite"
              className={
                state.status === "error"
                  ? "text-sm text-destructive"
                  : state.status === "warning"
                    ? "text-sm text-amber-700"
                    : "text-sm text-muted-foreground"
              }
              role={state.status === "error" ? "alert" : "status"}
            >
              {state.message}
            </p>
          ) : (
            <span />
          )}
          <Button disabled={pending} type="submit" variant="outline">
            <Save aria-hidden="true" />
            {pending ? "Saving..." : "Save variant"}
          </Button>
        </div>
      ) : null}
    </form>
  )
}
