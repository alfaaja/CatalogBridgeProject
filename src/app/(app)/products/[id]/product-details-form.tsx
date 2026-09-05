"use client"

import { useActionState } from "react"
import { Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatIdr } from "@/lib/product-presentation"
import type { ProductReview } from "@/lib/product-review"

import {
  saveProductReviewAction,
  type ProductReviewActionState,
} from "./actions"

const initialProductReviewActionState: ProductReviewActionState = {}

function ActionMessage({
  message,
  status,
}: {
  message?: string
  status?: "error" | "neutral" | "success" | "warning"
}) {
  if (!message) return null

  return (
    <p
      aria-live="polite"
      className={
        status === "error"
          ? "text-sm text-destructive"
          : status === "warning"
            ? "text-sm text-amber-700"
            : "text-sm text-muted-foreground"
      }
      role={status === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  )
}

function IntegerInput({
  defaultValue,
  id,
  name,
  readOnly,
}: {
  defaultValue: number | null
  id: string
  name: string
  readOnly: boolean
}) {
  return (
    <Input
      defaultValue={defaultValue ?? ""}
      id={id}
      inputMode="numeric"
      min="0"
      name={name}
      pattern="[0-9]*"
      readOnly={readOnly}
      type="text"
    />
  )
}

function DecimalInput({
  defaultValue,
  id,
  name,
  readOnly,
}: {
  defaultValue: number | null
  id: string
  name: string
  readOnly: boolean
}) {
  return (
    <Input
      defaultValue={defaultValue ?? ""}
      id={id}
      inputMode="decimal"
      min="0"
      name={name}
      pattern="[0-9]+(?:\.[0-9]{1,2})?"
      readOnly={readOnly}
      type="text"
    />
  )
}

export function ProductDetailsForm({
  editable,
  product,
}: {
  editable: boolean
  product: ProductReview
}) {
  const [state, action, pending] = useActionState(
    saveProductReviewAction,
    initialProductReviewActionState
  )

  return (
    <form
      action={editable ? action : undefined}
      className="space-y-7"
      key={product.updatedAt}
    >
      <input name="productId" type="hidden" value={product.id} />

      <section aria-labelledby="product-information-title">
        <div>
          <h2 id="product-information-title" className="text-lg font-semibold">
            Product information
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Correct the customer-facing catalog details without changing source
            evidence.
          </p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="product-title">Title</Label>
            <Input
              className="mt-2"
              defaultValue={product.title ?? ""}
              id="product-title"
              maxLength={500}
              name="title"
              readOnly={!editable}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="product-description">Description</Label>
            <Textarea
              className="mt-2 min-h-32"
              defaultValue={product.description ?? ""}
              id="product-description"
              maxLength={100_000}
              name="description"
              readOnly={!editable}
            />
          </div>
          <div>
            <Label htmlFor="product-brand">Brand</Label>
            <Input
              className="mt-2"
              defaultValue={product.brand ?? ""}
              id="product-brand"
              maxLength={500}
              name="brand"
              readOnly={!editable}
            />
          </div>
          <div>
            <Label htmlFor="product-sku">SKU</Label>
            <Input
              className="mt-2 font-mono"
              defaultValue={product.sku ?? ""}
              id="product-sku"
              maxLength={500}
              name="sku"
              readOnly={!editable}
            />
          </div>
          <div>
            <Label htmlFor="product-gtin">GTIN</Label>
            <Input
              className="mt-2 font-mono"
              defaultValue={product.gtin ?? ""}
              id="product-gtin"
              inputMode="numeric"
              maxLength={500}
              name="gtin"
              readOnly={!editable}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Optional in this review milestone.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="pricing-inventory-title" className="border-t pt-6">
        <h2 id="pricing-inventory-title" className="text-lg font-semibold">
          Pricing and inventory
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm font-medium">JakMall source price</p>
            <p className="mt-2 flex h-8 items-center rounded-lg border bg-muted/30 px-2.5 text-sm tabular-nums">
              {formatIdr(product.source.price)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Read-only source evidence</p>
          </div>
          <div>
            <Label htmlFor="product-selling-price">Selling price (IDR)</Label>
            <div className="mt-2">
              <IntegerInput
                defaultValue={product.sellingPrice}
                id="product-selling-price"
                name="sellingPrice"
                readOnly={!editable}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="product-stock">Stock</Label>
            <div className="mt-2">
              <IntegerInput
                defaultValue={product.stock}
                id="product-stock"
                name="stock"
                readOnly={!editable}
              />
            </div>
            {product.variants.length > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Variant stock is authoritative when variants exist.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section aria-labelledby="physical-data-title" className="border-t pt-6">
        <h2 id="physical-data-title" className="text-lg font-semibold">
          Physical and shipping data
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <Label htmlFor="product-weight">Weight (grams)</Label>
            <div className="mt-2">
              <IntegerInput
                defaultValue={product.weightGrams}
                id="product-weight"
                name="weightGrams"
                readOnly={!editable}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="product-length">Length (cm)</Label>
            <div className="mt-2">
              <DecimalInput
                defaultValue={product.dimensionsCm.length}
                id="product-length"
                name="lengthCm"
                readOnly={!editable}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="product-width">Width (cm)</Label>
            <div className="mt-2">
              <DecimalInput
                defaultValue={product.dimensionsCm.width}
                id="product-width"
                name="widthCm"
                readOnly={!editable}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="product-height">Height (cm)</Label>
            <div className="mt-2">
              <DecimalInput
                defaultValue={product.dimensionsCm.height}
                id="product-height"
                name="heightCm"
                readOnly={!editable}
              />
            </div>
          </div>
        </div>
      </section>

      {editable ? (
        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <ActionMessage message={state.message} status={state.status} />
          <Button className="min-w-36" disabled={pending} type="submit">
            <Save aria-hidden="true" />
            {pending ? "Saving..." : "Save product"}
          </Button>
        </div>
      ) : null}
    </form>
  )
}
