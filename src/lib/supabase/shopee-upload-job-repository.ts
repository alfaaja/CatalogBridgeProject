import { z } from "zod";

import { parseShopeeUploadManifest } from "../shopee-upload-manifest";
import type { Json } from "./database.types";
import { createClient } from "./server";

export const shopeeUploadJobStatuses = [
  "QUEUED",
  "WAITING_FOR_RUNNER",
  "AUTH_REQUIRED",
  "RUNNING",
  "NEEDS_USER_ACTION",
  "SAVED_ARCHIVED",
  "FAILED",
] as const;

export type ShopeeUploadJobStatus = (typeof shopeeUploadJobStatuses)[number];

export type ShopeeUploadJob = Readonly<{
  createdAt: string;
  finishedAt: string | null;
  id: string;
  manifestFingerprint: string;
  productId: string;
  readyRevision: string;
  safeErrorCode: string | null;
  safeMessage: string | null;
  sellerProductReference: string | null;
  startedAt: string | null;
  status: ShopeeUploadJobStatus;
  updatedAt: string;
}>;

type ReadResult =
  | Readonly<{ job: ShopeeUploadJob | null; ok: true }>
  | Readonly<{
      error: "DATABASE_READ_FAILED" | "INVALID_JOB_INPUT";
      ok: false;
    }>;

type CreateResult =
  | Readonly<{ created: boolean; job: ShopeeUploadJob; ok: true }>
  | Readonly<{
      error: "DATABASE_WRITE_FAILED" | "INVALID_JOB_INPUT";
      ok: false;
    }>;

const fingerprintSchema = z.string().regex(/^[a-f0-9]{64}$/u);
const jobRowSchema = z
  .object({
    created_at: z.iso.datetime({ offset: true }),
    finished_at: z.iso.datetime({ offset: true }).nullable(),
    id: z.uuid(),
    manifest: z.unknown(),
    manifest_fingerprint: fingerprintSchema,
    owner_id: z.uuid(),
    product_id: z.uuid(),
    ready_revision: z.iso.datetime({ offset: true }),
    safe_error_code: z
      .string()
      .regex(/^[A-Z][A-Z0-9_]*$/u)
      .max(100)
      .nullable(),
    safe_message: z.string().trim().min(1).max(500).nullable(),
    seller_product_reference: z.string().trim().min(1).max(500).nullable(),
    started_at: z.iso.datetime({ offset: true }).nullable(),
    status: z.enum(shopeeUploadJobStatuses),
    updated_at: z.iso.datetime({ offset: true }),
  })
  .strict()
  .superRefine((row, context) => {
    const parsedManifest = parseShopeeUploadManifest(row.manifest);
    if (
      !parsedManifest.ok ||
      parsedManifest.manifest.productId !== row.product_id ||
      parsedManifest.manifest.snapshotFingerprint !==
        row.manifest_fingerprint ||
      parsedManifest.manifest.readyRevision !== row.ready_revision
    ) {
      context.addIssue({ code: "custom", message: "Invalid job snapshot." });
    }
  });

export const SHOPEE_UPLOAD_JOB_SELECT =
  "id,product_id,owner_id,manifest_fingerprint,ready_revision,manifest,status,created_at,started_at,finished_at,updated_at,safe_error_code,safe_message,seller_product_reference";

function toJob(value: unknown): ShopeeUploadJob | null {
  const parsed = jobRowSchema.safeParse(value);
  if (!parsed.success) return null;
  const row = parsed.data;
  return {
    createdAt: row.created_at,
    finishedAt: row.finished_at,
    id: row.id,
    manifestFingerprint: row.manifest_fingerprint,
    productId: row.product_id,
    readyRevision: row.ready_revision,
    safeErrorCode: row.safe_error_code,
    safeMessage: row.safe_message,
    sellerProductReference: row.seller_product_reference,
    startedAt: row.started_at,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

async function readCurrentJob(
  productId: string,
  fingerprint: string,
): Promise<ReadResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shopee_upload_jobs")
      .select(SHOPEE_UPLOAD_JOB_SELECT)
      .eq("product_id", productId)
      .eq("manifest_fingerprint", fingerprint)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { error: "DATABASE_READ_FAILED", ok: false };
    if (data === null) return { job: null, ok: true };
    const job = toJob(data);
    return job
      ? { job, ok: true }
      : { error: "DATABASE_READ_FAILED", ok: false };
  } catch {
    return { error: "DATABASE_READ_FAILED", ok: false };
  }
}

export async function getShopeeUploadJobForSnapshot(
  productId: string,
  fingerprint: string,
): Promise<ReadResult> {
  const id = z.uuid().safeParse(productId);
  const parsedFingerprint = fingerprintSchema.safeParse(fingerprint);
  if (!id.success || !parsedFingerprint.success) {
    return { error: "INVALID_JOB_INPUT", ok: false };
  }
  return readCurrentJob(id.data, parsedFingerprint.data);
}

export async function createOrGetCurrentShopeeUploadJob(
  value: unknown,
): Promise<CreateResult> {
  const parsedManifest = parseShopeeUploadManifest(value);
  if (!parsedManifest.ok) return { error: "INVALID_JOB_INPUT", ok: false };
  const manifest = parsedManifest.manifest;

  const existing = await readCurrentJob(
    manifest.productId,
    manifest.snapshotFingerprint,
  );
  if (!existing.ok) return { error: "DATABASE_WRITE_FAILED", ok: false };
  if (existing.job && existing.job.status !== "FAILED") {
    return { created: false, job: existing.job, ok: true };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("shopee_upload_jobs")
      .insert({
        manifest: manifest as Json,
        manifest_fingerprint: manifest.snapshotFingerprint,
        product_id: manifest.productId,
        ready_revision: manifest.readyRevision,
      })
      .select(SHOPEE_UPLOAD_JOB_SELECT)
      .single();

    if (error?.code === "23505") {
      const concurrent = await readCurrentJob(
        manifest.productId,
        manifest.snapshotFingerprint,
      );
      return concurrent.ok && concurrent.job
        ? { created: false, job: concurrent.job, ok: true }
        : { error: "DATABASE_WRITE_FAILED", ok: false };
    }
    if (error) return { error: "DATABASE_WRITE_FAILED", ok: false };
    const job = toJob(data);
    return job
      ? { created: true, job, ok: true }
      : { error: "DATABASE_WRITE_FAILED", ok: false };
  } catch {
    return { error: "DATABASE_WRITE_FAILED", ok: false };
  }
}
