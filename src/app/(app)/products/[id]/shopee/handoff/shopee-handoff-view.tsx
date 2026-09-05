"use client";

import { useActionState, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  ImageIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  formatShopeeHandoffSummary,
  type ShopeeHandoffManifest,
} from "@/lib/shopee-handoff";
import type { ShopeeHandoffEvidence } from "@/lib/supabase/process-log-repository";
import { formatIdr } from "@/lib/product-presentation";

import {
  confirmSellerCentreHandoffAction,
  prepareShopeeHandoffAction,
  type ShopeeHandoffActionState,
} from "./actions";

const initialActionState: ShopeeHandoffActionState = {};

function formatDimensions(manifest: ShopeeHandoffManifest) {
  const { height, length, width } = manifest.physical.dimensionsCm;
  return length !== null && width !== null && height !== null
    ? `${length} × ${width} × ${height} cm`
    : "Complete in Seller Centre if required";
}

function BaseOffer({ manifest }: { manifest: ShopeeHandoffManifest }) {
  if (manifest.offer.mode === "VARIATIONS") {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[38rem] text-left text-sm">
          <thead className="border-b text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Options</th>
              <th className="px-3 py-2 font-medium">Price</th>
              <th className="px-3 py-2 font-medium">Stock</th>
              <th className="px-3 py-2 font-medium">SKU</th>
            </tr>
          </thead>
          <tbody>
            {manifest.offer.variants.map((variant, index) => (
              <tr className="border-b last:border-0" key={index}>
                <td className="px-3 py-3">
                  {Object.entries(variant.optionValues)
                    .map(([name, value]) => `${name}: ${value}`)
                    .join(" · ")}
                </td>
                <td className="px-3 py-3">
                  {formatIdr(variant.sellingPriceIdr)}
                </td>
                <td className="px-3 py-3">{variant.stock}</td>
                <td className="px-3 py-3">{variant.sku ?? "Not provided"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <dt className="text-muted-foreground">Listing structure</dt>
        <dd className="font-medium">Base listing</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Selling price</dt>
        <dd className="font-medium">
          {formatIdr(manifest.offer.sellingPriceIdr)}
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Stock</dt>
        <dd className="font-medium">{manifest.offer.stock}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">SKU</dt>
        <dd className="font-medium">{manifest.offer.sku ?? "Not provided"}</dd>
      </div>
    </dl>
  );
}

export function ShopeeHandoffView({
  evidence,
  manifest,
  productId,
}: {
  evidence: ShopeeHandoffEvidence;
  manifest: ShopeeHandoffManifest | null;
  productId: string;
}) {
  const [prepareState, prepareAction, preparing] = useActionState(
    prepareShopeeHandoffAction.bind(null, productId),
    initialActionState,
  );
  const [confirmState, confirmAction, confirming] = useActionState(
    confirmSellerCentreHandoffAction.bind(null, productId),
    initialActionState,
  );
  const [copyMessage, setCopyMessage] = useState("");

  async function copyValue(value: string, label: string) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard missing");
      await navigator.clipboard.writeText(value);
      setCopyMessage(`${label} copied. Nothing was sent to Shopee.`);
    } catch {
      setCopyMessage(`${label} could not be copied. Copy it manually.`);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="border-b pb-5">
        <Link
          className={buttonVariants({ variant: "ghost" })}
          href={`/products/${productId}/shopee`}
        >
          <ArrowLeft aria-hidden="true" />
          Back to Shopee Mapping
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Guided manual handoff
          </p>
          <span className="rounded-full border px-2 py-0.5 text-xs font-medium">
            {evidence.reviewerConfirmed
              ? "Reviewer confirmed"
              : evidence.prepared
                ? "Handoff prepared"
                : "Ready to prepare"}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold">Shopee handoff</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          CatalogBridge prepares the current validated values. You will transfer
          them to Shopee Seller Centre manually.
        </p>
      </header>

      {!evidence.prepared || !manifest ? (
        <section aria-labelledby="prepare-title" className="py-8">
          <h2 className="text-lg font-semibold" id="prepare-title">
            Prepare the current snapshot
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Preparation reloads the persisted READY product, draft, images, and
            offers before building a copy-ready package. It does not send data
            to Shopee.
          </p>
          <form action={prepareAction} className="mt-5">
            <Button disabled={preparing} type="submit">
              <Clipboard aria-hidden="true" />
              {preparing ? "Preparing..." : "Prepare handoff package"}
            </Button>
          </form>
          <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
            {prepareState.message}
          </p>
        </section>
      ) : (
        <div className="space-y-8 py-8">
          {evidence.reviewerConfirmed ? (
            <section
              aria-labelledby="confirmed-title"
              className="border-l-4 border-emerald-600 bg-emerald-50 p-4 text-emerald-950"
            >
              <div className="flex gap-3">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5" />
                <div>
                  <h2 className="font-semibold" id="confirmed-title">
                    Manual handoff confirmed
                  </h2>
                  <p className="mt-1 text-sm">
                    Reviewer confirmed that this snapshot was saved in Shopee
                    Seller Centre using a non-publishing action.
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section
              aria-labelledby="prepared-title"
              className="border-l-4 border-blue-600 bg-blue-50 p-4 text-blue-950"
            >
              <h2 className="font-semibold" id="prepared-title">
                Handoff package prepared
              </h2>
              <p className="mt-1 text-sm">
                This package represents the current READY snapshot. Copying a
                value does not transfer it to Shopee.
              </p>
            </section>
          )}

          <section aria-labelledby="identity-title">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold" id="identity-title">
                Product identity
              </h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => copyValue(manifest.title, "Title")}
                  type="button"
                  variant="outline"
                >
                  <Clipboard aria-hidden="true" /> Copy title
                </Button>
                <Button
                  onClick={() => copyValue(manifest.description, "Description")}
                  type="button"
                  variant="outline"
                >
                  <Clipboard aria-hidden="true" /> Copy description
                </Button>
              </div>
            </div>
            <dl className="mt-4 grid gap-5 border-y py-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Shopee title</dt>
                <dd className="mt-1 font-medium">{manifest.title}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Brand</dt>
                <dd className="mt-1 font-medium">
                  {manifest.brand ?? "Not provided"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Description</dt>
                <dd className="mt-1 whitespace-pre-line">
                  {manifest.description}
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="category-title">
            <h2 className="text-lg font-semibold" id="category-title">
              Category and attributes
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Category path is a selection guide. The live Seller Centre form
              remains authoritative.
            </p>
            <dl className="mt-4 grid gap-4 border-y py-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Category path</dt>
                <dd className="font-medium">{manifest.category.path}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Category ID</dt>
                <dd className="font-medium">
                  {manifest.category.id ?? "Not known"}
                </dd>
              </div>
            </dl>
            {manifest.attributes.length ? (
              <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                {manifest.attributes.map((attribute) => (
                  <div
                    className="flex justify-between gap-4 border-b py-2"
                    key={attribute.name}
                  >
                    <dt className="text-muted-foreground">{attribute.name}</dt>
                    <dd className="text-right font-medium">
                      {attribute.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No destination attributes are recorded.
              </p>
            )}
          </section>

          <section aria-labelledby="commercial-title">
            <h2 className="text-lg font-semibold" id="commercial-title">
              Commercial offer
            </h2>
            <div className="mt-4 border-y py-5">
              <BaseOffer manifest={manifest} />
            </div>
          </section>

          <section aria-labelledby="physical-title">
            <h2 className="text-lg font-semibold" id="physical-title">
              Physical and declarations
            </h2>
            <dl className="mt-4 grid gap-4 border-y py-5 text-sm sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <dt className="text-muted-foreground">Weight</dt>
                <dd className="font-medium">
                  {manifest.physical.weightGrams} g
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Dimensions</dt>
                <dd className="font-medium">{formatDimensions(manifest)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Dangerous product</dt>
                <dd className="font-medium">
                  {manifest.declarations.dangerousProduct}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Condition</dt>
                <dd className="font-medium">
                  {manifest.declarations.condition}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Preorder</dt>
                <dd className="font-medium">
                  {manifest.declarations.preorder}
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="images-title">
            <h2 className="text-lg font-semibold" id="images-title">
              Product images
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These trusted source URLs are references only. Handle each image
              according to the real Seller Centre controls.
            </p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {manifest.images.map((image) => (
                <li className="min-w-0" key={`${image.position}-${image.url}`}>
                  <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted/20">
                    <Image
                      alt={`${manifest.title} — handoff image ${image.position + 1}`}
                      className="object-contain p-3"
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 40vw, 100vw"
                      src={image.url}
                    />
                  </div>
                  <a
                    className="mt-2 inline-flex max-w-full items-center gap-1 text-sm font-medium underline underline-offset-4"
                    href={image.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ImageIcon aria-hidden="true" className="size-4" />
                    <span className="truncate">Open source image</span>
                    <ExternalLink aria-hidden="true" className="size-3" />
                  </a>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {image.url}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="checks-title">
            <h2 className="text-lg font-semibold" id="checks-title">
              External checks and limitations
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                Shipping and service availability must be checked in Seller
                Centre for the real account.
              </li>
              {manifest.externalChecks.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
              <li>
                Unsupported: {manifest.externalChecks.unsupported.join(", ")}.
              </li>
            </ul>
          </section>

          <section className="border-t pt-6">
            <Button
              onClick={() =>
                copyValue(
                  formatShopeeHandoffSummary(manifest),
                  "Full handoff summary",
                )
              }
              type="button"
            >
              <Clipboard aria-hidden="true" /> Copy full handoff summary
            </Button>
            <p
              aria-live="polite"
              className="mt-3 text-sm text-muted-foreground"
              role="status"
            >
              {copyMessage}
            </p>
          </section>

          {!evidence.reviewerConfirmed ? (
            <section
              aria-labelledby="confirmation-title"
              className="border-t pt-6"
            >
              <h2 className="text-lg font-semibold" id="confirmation-title">
                Confirm completed manual work
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Complete the real Seller Centre work first. This records your
                attestation for this exact snapshot; it is not independent
                Shopee verification.
              </p>
              <form action={confirmAction} className="mt-4 space-y-3">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    className="mt-1"
                    name="valuesTransferred"
                    required
                    type="checkbox"
                    value="true"
                  />
                  The current CatalogBridge values were transferred to the
                  Seller Centre product form.
                </label>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    className="mt-1"
                    name="nonPublishingSaveRetained"
                    required
                    type="checkbox"
                    value="true"
                  />
                  Seller Centre accepted and retained the non-publishing save.
                </label>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    className="mt-1"
                    name="shippingChecksCompleted"
                    required
                    type="checkbox"
                    value="true"
                  />
                  Required account-side shipping and service checks were
                  completed.
                </label>
                <Button disabled={confirming} type="submit">
                  <CheckCircle2 aria-hidden="true" />
                  {confirming ? "Confirming..." : "Confirm manual handoff"}
                </Button>
              </form>
              <p
                aria-live="polite"
                className="mt-3 text-sm text-muted-foreground"
              >
                {confirmState.message}
              </p>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
