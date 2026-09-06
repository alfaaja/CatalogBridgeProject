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

export type ProcessHistoryStatus =
  | "started"
  | "success"
  | "warning"
  | "failed";

export type ProcessHistoryEvent = Readonly<{
  id: string;
  message: string;
  occurredAt: string;
  product: Readonly<{
    id: string;
    title: string | null;
  }>;
  stage: string;
  status: ProcessHistoryStatus;
}>;

type ProcessHistoryResult =
  | Readonly<{ events: readonly ProcessHistoryEvent[]; ok: true }>
  | Readonly<{ error: "DATABASE_READ_FAILED"; ok: false }>;

const PROCESS_HISTORY_LIMIT = 100;
const PROCESS_HISTORY_SELECT =
  "id,product_id,stage,status,message,created_at,product:products!process_logs_product_id_fkey!inner(id,title)";
const processHistoryRowSchema = z
  .object({
    created_at: z.iso.datetime({ offset: true }),
    id: z.uuid(),
    message: z.string().trim().min(1).max(500),
    product: z
      .object({
        id: z.uuid(),
        title: z.string().trim().min(1).max(100_000).nullable(),
      })
      .strict(),
    product_id: z.uuid(),
    stage: z.string().trim().min(1).max(100),
    status: z.enum(["started", "success", "warning", "failed"]),
  })
  .strict()
  .refine((row) => row.product_id === row.product.id);
const processHistoryRowsSchema = z.array(processHistoryRowSchema);

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

export async function listProcessHistory(): Promise<ProcessHistoryResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("process_logs")
      .select(PROCESS_HISTORY_SELECT)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(PROCESS_HISTORY_LIMIT);

    if (error) return { error: "DATABASE_READ_FAILED", ok: false };

    const parsedRows = processHistoryRowsSchema.safeParse(data);
    if (!parsedRows.success) {
      return { error: "DATABASE_READ_FAILED", ok: false };
    }

    return {
      events: parsedRows.data.map((row) => ({
        id: row.id,
        message: row.message,
        occurredAt: row.created_at,
        product: {
          id: row.product.id,
          title: row.product.title,
        },
        stage: row.stage,
        status: row.status,
      })),
      ok: true,
    };
  } catch {
    return { error: "DATABASE_READ_FAILED", ok: false };
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
