import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { RunnerError, type RunnerErrorCode } from "./errors.js";
import { parseManifest, type UploadManifest } from "./manifest.js";
import { canTransition, jobStatuses, type JobStatus } from "./status.js";

const jobRowSchema = z.object({
  id: z.uuid(),
  manifest: z.unknown(),
  manifest_fingerprint: z.string().regex(/^[a-f0-9]{64}$/u),
  product_id: z.uuid(),
  ready_revision: z.iso.datetime({ offset: true }),
  status: z.enum(jobStatuses),
});

export type RunnerJob = Readonly<{
  id: string;
  manifest: UploadManifest;
  status: JobStatus;
}>;

function parseJob(value: unknown): RunnerJob {
  const row = jobRowSchema.parse(value);
  const manifest = parseManifest(row.manifest);
  if (
    manifest.productId !== row.product_id ||
    manifest.readyRevision !== row.ready_revision ||
    manifest.snapshotFingerprint !== row.manifest_fingerprint
  ) {
    throw new RunnerError(
      "STALE_READY_SNAPSHOT",
      "Job snapshot identity is invalid.",
    );
  }
  return { id: row.id, manifest, status: row.status };
}

const JOB_SELECT =
  "id,product_id,manifest_fingerprint,ready_revision,manifest,status";

export async function pollQueuedJob(client: SupabaseClient) {
  const { data, error } = await client
    .from("shopee_upload_jobs")
    .select(JOB_SELECT)
    .eq("status", "QUEUED")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Unable to poll owned upload jobs.");
  return data ? parseJob(data) : null;
}

export async function claimJob(client: SupabaseClient, job: RunnerJob) {
  const { data, error } = await client
    .from("shopee_upload_jobs")
    .update({ status: "WAITING_FOR_RUNNER" })
    .eq("id", job.id)
    .eq("status", "QUEUED")
    .select(JOB_SELECT)
    .maybeSingle();
  if (error) throw new Error("Unable to claim the upload job.");
  return data ? parseJob(data) : null;
}

export async function assertFreshReadySnapshot(
  client: SupabaseClient,
  manifest: UploadManifest,
) {
  const { data, error } = await client
    .from("products")
    .select("id,status,updated_at")
    .eq("id", manifest.productId)
    .maybeSingle();
  if (
    error ||
    !data ||
    data.status !== "READY" ||
    data.updated_at !== manifest.readyRevision
  ) {
    throw new RunnerError(
      "STALE_READY_SNAPSHOT",
      "The product is no longer the queued READY snapshot.",
    );
  }
}

export async function transitionJob(
  client: SupabaseClient,
  job: RunnerJob,
  next: JobStatus,
  options: Readonly<{
    code?: RunnerErrorCode;
    message?: string;
    sellerProductReference?: string;
  }> = {},
) {
  if (!canTransition(job.status, next))
    throw new Error("Invalid job transition.");
  const patch = {
    safe_error_code: options.code ?? null,
    safe_message: options.message ?? null,
    seller_product_reference: options.sellerProductReference ?? null,
    status: next,
  };
  const { data, error } = await client
    .from("shopee_upload_jobs")
    .update(patch)
    .eq("id", job.id)
    .eq("status", job.status)
    .select(JOB_SELECT)
    .single();
  if (error || !data) throw new Error("Unable to update the upload job.");
  return parseJob(data);
}

export async function appendAutomationEvent(
  client: SupabaseClient,
  job: RunnerJob,
  input: Readonly<{
    event: string;
    message: string;
    status: "failed" | "started" | "success" | "warning";
  }>,
) {
  const { error } = await client.from("process_logs").insert({
    details: {
      event: input.event,
      jobId: job.id,
      method: "LOCAL_SHOPEE_RUNNER",
      schemaVersion: 1,
      snapshotFingerprint: job.manifest.snapshotFingerprint,
    },
    message: input.message,
    product_id: job.manifest.productId,
    stage: "shopee_automation",
    status: input.status,
  });
  if (error) throw new Error("Unable to record automation activity.");
}
