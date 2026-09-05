"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { loadCurrentShopeeHandoff } from "@/lib/shopee-handoff-service";
import { appendProcessLog } from "@/lib/supabase/process-log-repository";

export type ShopeeHandoffActionState = Readonly<{
  message?: string;
  status?: "error" | "neutral" | "success" | "warning";
}>;

const prepareSchema = z.object({}).strict();
const confirmationSchema = z
  .object({
    nonPublishingSaveRetained: z.literal("true"),
    shippingChecksCompleted: z.literal("true"),
    valuesTransferred: z.literal("true"),
  })
  .strict();

function formValues(formData: FormData) {
  const values: Record<string, string> = {};
  for (const [name, value] of formData.entries()) {
    if (name.startsWith("$ACTION_")) continue;
    if (typeof value !== "string" || Object.hasOwn(values, name)) return null;
    values[name] = value;
  }
  return values;
}

function currentStateError(
  error:
    | "AUTH_REQUIRED"
    | "HANDOFF_BLOCKED"
    | "HANDOFF_UNAVAILABLE"
    | "PRODUCT_NOT_FOUND"
    | "PRODUCT_NOT_READY",
): ShopeeHandoffActionState {
  if (error === "AUTH_REQUIRED") {
    return {
      message: "Please sign in again before continuing the handoff.",
      status: "error",
    };
  }
  if (error === "PRODUCT_NOT_READY") {
    return {
      message:
        "This product is no longer Ready for Shopee. Review and validate it again before preparing a handoff.",
      status: "error",
    };
  }
  if (error === "HANDOFF_BLOCKED") {
    return {
      message:
        "The current persisted product has Shopee-readiness blockers. Return to mapping and review it again.",
      status: "error",
    };
  }
  return {
    message: "The current handoff state could not be loaded. Please try again.",
    status: "error",
  };
}

function revalidateHandoff(productId: string) {
  revalidatePath(`/products/${productId}/shopee/handoff`);
  revalidatePath(`/products/${productId}/shopee`);
}

export async function prepareShopeeHandoffAction(
  productId: string,
  _previousState: ShopeeHandoffActionState,
  formData: FormData,
): Promise<ShopeeHandoffActionState> {
  void _previousState;
  const current = await loadCurrentShopeeHandoff(productId);
  if (!current.ok) return currentStateError(current.error);

  const values = formValues(formData);
  if (!values || !prepareSchema.safeParse(values).success) {
    return {
      message: "Unexpected handoff input was rejected. Reload and try again.",
      status: "error",
    };
  }
  if (current.evidence.prepared) {
    return {
      message: "The current handoff package is already prepared.",
      status: "neutral",
    };
  }

  const manifest = current.manifest;
  const logged = await appendProcessLog({
    details: {
      attributeCount: manifest.attributes.length,
      event: "HANDOFF_PREPARED",
      imageCount: manifest.images.length,
      method: "GUIDED_MANUAL",
      offerMode: manifest.offer.mode,
      schemaVersion: 1,
      snapshotFingerprint: manifest.snapshotFingerprint,
    },
    message: "Handoff package prepared.",
    productId,
    stage: "shopee_handoff",
    status: "success",
  });
  if (!logged.ok) {
    return {
      message:
        "The package was built but its preparation could not be recorded.",
      status: "warning",
    };
  }

  revalidateHandoff(productId);
  return {
    message: "Current handoff package prepared.",
    status: "success",
  };
}

export async function confirmSellerCentreHandoffAction(
  productId: string,
  _previousState: ShopeeHandoffActionState,
  formData: FormData,
): Promise<ShopeeHandoffActionState> {
  void _previousState;
  const current = await loadCurrentShopeeHandoff(productId);
  if (!current.ok) return currentStateError(current.error);

  const values = formValues(formData);
  if (!values || !confirmationSchema.safeParse(values).success) {
    return {
      message:
        "Confirm all three manual handoff statements before recording this evidence.",
      status: "error",
    };
  }
  if (!current.evidence.prepared) {
    return {
      message:
        "Prepare the current handoff package before confirming Seller Centre work.",
      status: "error",
    };
  }
  if (current.evidence.reviewerConfirmed) {
    return {
      message: "Manual handoff is already confirmed for this snapshot.",
      status: "neutral",
    };
  }

  const logged = await appendProcessLog({
    details: {
      event: "SELLER_CENTRE_REVIEWER_CONFIRMED",
      evidenceBasis: "REVIEWER_ATTESTATION",
      method: "GUIDED_MANUAL",
      schemaVersion: 1,
      sellerAction: "NON_PUBLISHING_SAVE",
      snapshotFingerprint: current.manifest.snapshotFingerprint,
    },
    message: "Manual Seller Centre handoff confirmed.",
    productId,
    stage: "shopee_handoff",
    status: "success",
  });
  if (!logged.ok) {
    return {
      message: "The confirmation could not be recorded. Please try again.",
      status: "error",
    };
  }

  revalidateHandoff(productId);
  return {
    message: "Manual handoff confirmed for the current snapshot.",
    status: "success",
  };
}
