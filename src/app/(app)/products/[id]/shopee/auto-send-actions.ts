"use server";

import { revalidatePath } from "next/cache";

import { loadCurrentShopeeHandoff } from "@/lib/shopee-handoff-service";
import { buildShopeeUploadManifest } from "@/lib/shopee-upload-manifest";
import { appendProcessLog } from "@/lib/supabase/process-log-repository";
import { createOrGetCurrentShopeeUploadJob } from "@/lib/supabase/shopee-upload-job-repository";

export type AutoSendActionState = Readonly<{
  message?: string;
  status?: "error" | "neutral" | "success" | "warning";
}>;

function unavailableMessage(
  error:
    | "AUTH_REQUIRED"
    | "HANDOFF_BLOCKED"
    | "HANDOFF_UNAVAILABLE"
    | "PRODUCT_NOT_FOUND"
    | "PRODUCT_NOT_READY",
) {
  if (error === "AUTH_REQUIRED") return "Sign in before queuing Auto Send.";
  if (error === "PRODUCT_NOT_READY")
    return "This product is no longer Ready for Shopee.";
  if (error === "HANDOFF_BLOCKED")
    return "Resolve the current Shopee readiness blockers before Auto Send.";
  if (error === "PRODUCT_NOT_FOUND") return "This product is unavailable.";
  return "Auto Send could not reload the current persisted snapshot.";
}

export async function queueShopeeUploadAction(
  productId: string,
  previousState: AutoSendActionState,
  formData: FormData,
): Promise<AutoSendActionState> {
  void previousState;
  void formData;
  const current = await loadCurrentShopeeHandoff(productId);
  if (!current.ok) {
    return { message: unavailableMessage(current.error), status: "error" };
  }

  const built = buildShopeeUploadManifest(current.product, current.manifest);
  if (!built.ok) {
    return {
      message: "The current Shopee snapshot is not eligible for Auto Send.",
      status: "error",
    };
  }

  const created = await createOrGetCurrentShopeeUploadJob(built.manifest);
  if (!created.ok) {
    return {
      message: "Auto Send could not be queued safely. Try again.",
      status: "error",
    };
  }

  if (!created.created) {
    return {
      message: "This exact snapshot already has a Shopee automation job.",
      status: "neutral",
    };
  }

  const logged = await appendProcessLog({
    details: {
      event: "SHOPEE_AUTOMATION_QUEUED",
      jobId: created.job.id,
      method: "LOCAL_SHOPEE_RUNNER",
      schemaVersion: 1,
      snapshotFingerprint: built.manifest.snapshotFingerprint,
    },
    message: "Shopee automation queued.",
    productId,
    stage: "shopee_automation",
    status: "started",
  });

  revalidatePath(`/products/${productId}/shopee`);
  revalidatePath("/history");

  return logged.ok
    ? {
        message: "Waiting for the local Shopee runner.",
        status: "success",
      }
    : {
        message:
          "Auto Send is queued, but its activity entry could not be recorded.",
        status: "warning",
      };
}
