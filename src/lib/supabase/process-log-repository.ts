import { z } from "zod";

import { processLogSchema, type ProcessLogInput } from "./persistence";
import { createClient } from "./server";

type ProcessLogResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false;
      error: "DATABASE_WRITE_FAILED" | "INVALID_LOG_INPUT";
    }>;

export type ShopeeHandoffEvidence = Readonly<{
  prepared: boolean;
  reviewerConfirmed: boolean;
}>;

type HandoffEvidenceResult =
  | Readonly<{ evidence: ShopeeHandoffEvidence; ok: true }>
  | Readonly<{
      error: "DATABASE_READ_FAILED" | "INVALID_EVIDENCE_INPUT";
      ok: false;
    }>;

const fingerprintSchema = z.string().regex(/^[a-f0-9]{64}$/u);
const evidenceBase = {
  method: z.literal("GUIDED_MANUAL"),
  schemaVersion: z.literal(1),
  snapshotFingerprint: fingerprintSchema,
};
const preparedEvidenceSchema = z
  .object({
    ...evidenceBase,
    attributeCount: z.number().int().nonnegative(),
    event: z.literal("HANDOFF_PREPARED"),
    imageCount: z.number().int().nonnegative(),
    offerMode: z.enum(["BASE_LISTING", "VARIATIONS"]),
  })
  .strict();
const confirmedEvidenceSchema = z
  .object({
    ...evidenceBase,
    event: z.literal("SELLER_CENTRE_REVIEWER_CONFIRMED"),
    evidenceBasis: z.literal("REVIEWER_ATTESTATION"),
    sellerOutcome: z.literal("ARCHIVED_NON_PUBLISHED"),
  })
  .strict();
const legacyConfirmedEvidenceSchema = z
  .object({
    ...evidenceBase,
    event: z.literal("SELLER_CENTRE_REVIEWER_CONFIRMED"),
    evidenceBasis: z.literal("REVIEWER_ATTESTATION"),
    sellerAction: z.literal("NON_PUBLISHING_SAVE"),
  })
  .strict();

export async function appendProcessLog(
  input: ProcessLogInput,
): Promise<ProcessLogResult> {
  const parsedInput = processLogSchema.safeParse(input);

  if (!parsedInput.success) {
    return { ok: false, error: "INVALID_LOG_INPUT" };
  }

  try {
    const supabase = await createClient();
    const event = parsedInput.data;
    const { error } = await supabase.from("process_logs").insert({
      details: event.details,
      message: event.message,
      product_id: event.productId,
      stage: event.stage,
      status: event.status,
    });

    return error ? { ok: false, error: "DATABASE_WRITE_FAILED" } : { ok: true };
  } catch {
    return { ok: false, error: "DATABASE_WRITE_FAILED" };
  }
}

export async function getShopeeHandoffEvidence(
  productId: string,
  snapshotFingerprint: string,
): Promise<HandoffEvidenceResult> {
  const id = z.uuid().safeParse(productId);
  const fingerprint = fingerprintSchema.safeParse(snapshotFingerprint);
  if (!id.success || !fingerprint.success) {
    return { error: "INVALID_EVIDENCE_INPUT", ok: false };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("process_logs")
      .select("details")
      .eq("product_id", id.data)
      .eq("stage", "shopee_handoff")
      .eq("status", "success")
      .contains("details", {
        method: "GUIDED_MANUAL",
        schemaVersion: 1,
        snapshotFingerprint: fingerprint.data,
      });

    if (error || !Array.isArray(data)) {
      return { error: "DATABASE_READ_FAILED", ok: false };
    }

    let prepared = false;
    let confirmed = false;
    for (const row of data) {
      if (!row || typeof row !== "object" || !("details" in row)) continue;
      if (preparedEvidenceSchema.safeParse(row.details).success)
        prepared = true;
      if (
        confirmedEvidenceSchema.safeParse(row.details).success ||
        legacyConfirmedEvidenceSchema.safeParse(row.details).success
      )
        confirmed = true;
    }

    return {
      evidence: {
        prepared,
        reviewerConfirmed: prepared && confirmed,
      },
      ok: true,
    };
  } catch {
    return { error: "DATABASE_READ_FAILED", ok: false };
  }
}
