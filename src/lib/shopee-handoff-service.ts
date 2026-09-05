import {
  buildShopeeHandoffManifest,
  type ShopeeHandoffManifest,
} from "./shopee-handoff";
import { buildShopeePreview } from "./shopee-draft";
import {
  getShopeeHandoffEvidence,
  type ShopeeHandoffEvidence,
} from "./supabase/process-log-repository";
import { getProductReview } from "./supabase/product-review-repository";
import { createClient } from "./supabase/server";
import { getShopeeDraft } from "./supabase/shopee-draft-repository";

export type CurrentShopeeHandoffResult =
  | Readonly<{
      evidence: ShopeeHandoffEvidence;
      manifest: ShopeeHandoffManifest;
      ok: true;
    }>
  | Readonly<{
      error:
        | "AUTH_REQUIRED"
        | "HANDOFF_BLOCKED"
        | "HANDOFF_UNAVAILABLE"
        | "PRODUCT_NOT_FOUND"
        | "PRODUCT_NOT_READY";
      ok: false;
    }>;

async function hasAuthenticatedReviewer() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    return Boolean(
      !error && data?.claims?.sub && data.claims.is_anonymous !== true,
    );
  } catch {
    return false;
  }
}

export async function loadCurrentShopeeHandoff(
  productId: string,
): Promise<CurrentShopeeHandoffResult> {
  if (!(await hasAuthenticatedReviewer())) {
    return { error: "AUTH_REQUIRED", ok: false };
  }

  const productResult = await getProductReview(productId);
  if (!productResult.ok) {
    return {
      error:
        productResult.error === "PRODUCT_NOT_FOUND"
          ? "PRODUCT_NOT_FOUND"
          : "HANDOFF_UNAVAILABLE",
      ok: false,
    };
  }
  if (productResult.product.status !== "READY") {
    return { error: "PRODUCT_NOT_READY", ok: false };
  }

  const draftResult = await getShopeeDraft(productId);
  if (!draftResult.ok) return { error: "HANDOFF_UNAVAILABLE", ok: false };

  const preview = buildShopeePreview(productResult.product, draftResult.draft);
  const built = buildShopeeHandoffManifest({
    generatedAt: new Date().toISOString(),
    preview,
    product: productResult.product,
  });
  if (!built.ok) {
    return {
      error:
        built.error === "PRODUCT_NOT_READY"
          ? "PRODUCT_NOT_READY"
          : "HANDOFF_BLOCKED",
      ok: false,
    };
  }

  const evidenceResult = await getShopeeHandoffEvidence(
    productId,
    built.manifest.snapshotFingerprint,
  );
  if (!evidenceResult.ok) {
    return { error: "HANDOFF_UNAVAILABLE", ok: false };
  }

  return {
    evidence: evidenceResult.evidence,
    manifest: built.manifest,
    ok: true,
  };
}
