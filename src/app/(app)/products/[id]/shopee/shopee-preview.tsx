import { ProductGallery } from "../product-gallery"

import { formatIdr } from "@/lib/product-presentation"
import type { ProductReview } from "@/lib/product-review"
import type { ShopeePreview as Preview } from "@/lib/shopee-draft"

function formatDimensions(product: ProductReview) {
  const { height, length, width } = product.dimensionsCm
  return length !== null && width !== null && height !== null
    ? `${length} × ${width} × ${height} cm`
    : "Incomplete"
}

function offerSummary(preview: Preview) {
  const offer = preview.offer
  if (offer.mode === "BLOCKED") return "Requires variation mapping"
  if (offer.mode === "VARIATIONS") {
    return `${offer.variants.length} mapped variations`
  }
  return `${formatIdr(offer.sellingPrice)} · ${offer.stock ?? "Unknown"} in stock`
}

export function ShopeePreview({
  preview,
  product,
}: {
  preview: Preview
  product: ProductReview
}) {
  const { draft, offer } = preview

  return (
    <div className="space-y-8">
      <section aria-labelledby="product-identity-title">
        <h2 className="text-lg font-semibold" id="product-identity-title">
          Product identity
        </h2>
        <div className="mt-4 grid gap-5 border-y py-5 sm:grid-cols-[11rem_minmax(0,1fr)]">
          <ProductGallery images={preview.images} title={product.title} />
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Reviewed JakMall product
            </p>
            <h3 className="mt-2 text-xl font-semibold">
              {product.title ?? "Untitled product"}
            </h3>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Brand</dt>
                <dd>{product.brand ?? "Not available"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Product images</dt>
                <dd>
                  {preview.images.length} trusted product
                  {preview.images.length === 1 ? " image" : " images"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Weight · AUTO</dt>
                <dd>
                  {product.weightGrams === null
                    ? "Unknown"
                    : `${product.weightGrams} g`}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Dimensions · AUTO</dt>
                <dd>{formatDimensions(product)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section aria-labelledby="comparison-title">
        <h2 className="text-lg font-semibold" id="comparison-title">
          Reviewed source → Shopee destination
        </h2>
        <div className="mt-4 grid gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-2">
          <div className="bg-background p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Reviewed CatalogBridge values
            </p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Source price</dt>
                <dd>{formatIdr(product.source.price)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Selling authority</dt>
                <dd>
                  {offer.mode === "BASE_VARIANT"
                    ? "Single offer"
                    : "Product / mapped variations"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Offer mapping</dt>
                <dd>{offer.mode}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Mapping policy</dt>
                <dd>AUTO</dd>
              </div>
            </dl>
          </div>
          <div className="bg-background p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Shopee destination preview
            </p>
            <h3 className="mt-3 font-medium">
              {preview.title ?? "Missing title"}
            </h3>
            <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">
              {preview.description ?? "Missing description"}
            </p>
            <p
              className={
                offer.mode === "BLOCKED"
                  ? "mt-3 text-sm text-destructive"
                  : "mt-3 text-sm"
              }
            >
              {offerSummary(preview)}
            </p>
            {offer.mode === "BASE_VARIANT" ? (
              <p className="mt-3 text-sm text-amber-800">{offer.note}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section aria-labelledby="mapping-summary-title">
        <h2 className="text-lg font-semibold" id="mapping-summary-title">
          Current destination mapping
        </h2>
        <dl className="mt-4 grid gap-x-6 gap-y-4 border-y py-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">
              Category · REVIEW_REQUIRED
            </dt>
            <dd>{draft?.categoryPath ?? "Not mapped"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Category ID</dt>
            <dd>{draft?.categoryId ?? "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Category attributes</dt>
            <dd>{draft?.categoryAttributes.length ?? 0} structured values</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">
              Dangerous product · REVIEW_REQUIRED
            </dt>
            <dd>{draft?.dangerousProduct ?? "UNCONFIRMED"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">
              Condition · REVIEW_REQUIRED
            </dt>
            <dd>{draft?.condition ?? "UNCONFIRMED"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">
              Preorder · REVIEW_REQUIRED
            </dt>
            <dd>{draft?.preorder ?? "UNCONFIRMED"}</dd>
          </div>
        </dl>
        {draft?.categoryAttributes.length ? (
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {draft.categoryAttributes.map((attribute) => (
              <li
                className="flex justify-between gap-4 border-b py-2"
                key={attribute.name}
              >
                <span className="text-muted-foreground">{attribute.name}</span>
                <span className="text-right font-medium">
                  {attribute.value}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section aria-labelledby="handoff-notes-title">
        <h2 className="text-lg font-semibold" id="handoff-notes-title">
          Shopee Seller Centre handoff
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {preview.handoffNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
