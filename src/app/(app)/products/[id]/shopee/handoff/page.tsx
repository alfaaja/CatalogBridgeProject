import type { Metadata } from "next";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { loadCurrentShopeeHandoff } from "@/lib/shopee-handoff-service";

import { ShopeeHandoffView } from "./shopee-handoff-view";

export const metadata: Metadata = {
  title: "Guided Shopee Handoff | CatalogBridge",
};

export default async function ShopeeHandoffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const current = await loadCurrentShopeeHandoff(id);

  if (!current.ok && current.error === "AUTH_REQUIRED") redirect("/login");
  if (!current.ok && current.error === "PRODUCT_NOT_FOUND") notFound();

  if (!current.ok) {
    const requiresReview = current.error === "PRODUCT_NOT_READY";
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Alert variant={requiresReview ? "default" : "destructive"}>
          <AlertCircle aria-hidden="true" />
          <AlertTitle>
            {requiresReview
              ? "Handoff requires a READY product"
              : "Handoff could not be loaded"}
          </AlertTitle>
          <AlertDescription>
            <p>
              {requiresReview
                ? "Return to Shopee Mapping and validate the current persisted values before preparing a handoff."
                : "Refresh the page and try again. No handoff evidence was recorded."}
            </p>
            <Link
              className={buttonVariants({
                className: "mt-3",
                variant: "outline",
              })}
              href={`/products/${id}/shopee`}
            >
              Back to Shopee Mapping
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <ShopeeHandoffView
      evidence={current.evidence}
      key={current.manifest.snapshotFingerprint}
      manifest={current.evidence.prepared ? current.manifest : null}
      productId={id}
    />
  );
}
