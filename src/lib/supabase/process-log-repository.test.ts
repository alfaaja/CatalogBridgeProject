import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("./server", () => ({
  createClient: createClientMock,
}));

import {
  appendProcessLog,
  getShopeeHandoffEvidence,
  listProcessHistory,
} from "./process-log-repository";

const HISTORY_SELECT =
  "id,product_id,stage,status,message,created_at,product:products!process_logs_product_id_fkey!inner(id,title)";

function historyRow(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    created_at: "2026-09-06T06:30:00+00:00",
    id: "00000000-0000-4000-8000-000000000001",
    message: "Product record saved.",
    product: {
      id: "00000000-0000-4000-8000-000000000010",
      title: "Real product",
    },
    product_id: "00000000-0000-4000-8000-000000000010",
    stage: "persistence",
    status: "success",
    ...overrides,
  };
}

function historyQuery(data: unknown, error: unknown = null) {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  query.select = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.limit = vi.fn(() => Promise.resolve({ data, error }));
  return query;
}

describe("process log repository", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("appends a sanitized event without an owner override", async () => {
    const insert = vi.fn<(payload: unknown) => Promise<{ error: null }>>(() =>
      Promise.resolve({ error: null }),
    );
    const from = vi.fn(() => ({ insert }));
    createClientMock.mockResolvedValue({ from });

    const result = await appendProcessLog({
      productId: "00000000-0000-4000-8000-000000000000",
      stage: "persistence",
      status: "success",
      message: "Product record saved.",
      details: { recordsWritten: 1 },
    });

    expect(result).toEqual({ ok: true });
    expect(from).toHaveBeenCalledWith("process_logs");
    expect(insert).toHaveBeenCalledWith({
      details: { recordsWritten: 1 },
      message: "Product record saved.",
      product_id: "00000000-0000-4000-8000-000000000000",
      stage: "persistence",
      status: "success",
    });
    expect(insert.mock.calls[0]?.[0]).not.toHaveProperty("owner_id");
  });

  it("rejects unsafe details before reaching Supabase", async () => {
    createClientMock.mockResolvedValue({ from: vi.fn() });

    const result = await appendProcessLog({
      productId: "00000000-0000-4000-8000-000000000000",
      stage: "persistence",
      status: "failed",
      message: "Persistence failed.",
      details: { authorization: "Bearer secret" },
    });

    expect(result).toEqual({ ok: false, error: "INVALID_LOG_INPUT" });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("finds current handoff evidence by product and server fingerprint", async () => {
    const query: Record<string, ReturnType<typeof vi.fn>> = {};
    query.select = vi.fn(() => query);
    query.eq = vi.fn(() => query);
    query.contains = vi.fn(() =>
      Promise.resolve({
        data: [
          {
            details: {
              attributeCount: 1,
              event: "HANDOFF_PREPARED",
              imageCount: 1,
              method: "GUIDED_MANUAL",
              offerMode: "BASE_LISTING",
              schemaVersion: 1,
              snapshotFingerprint: "a".repeat(64),
            },
          },
          {
            details: {
              event: "SELLER_CENTRE_REVIEWER_CONFIRMED",
              evidenceBasis: "REVIEWER_ATTESTATION",
              method: "GUIDED_MANUAL",
              schemaVersion: 1,
              sellerOutcome: "ARCHIVED_NON_PUBLISHED",
              snapshotFingerprint: "a".repeat(64),
            },
          },
        ],
        error: null,
      }),
    );
    createClientMock.mockResolvedValue({ from: vi.fn(() => query) });

    await expect(
      getShopeeHandoffEvidence(
        "00000000-0000-4000-8000-000000000000",
        "a".repeat(64),
      ),
    ).resolves.toEqual({
      evidence: { prepared: true, reviewerConfirmed: true },
      ok: true,
    });
    expect(query.eq).toHaveBeenNthCalledWith(
      1,
      "product_id",
      "00000000-0000-4000-8000-000000000000",
    );
    expect(query.eq).toHaveBeenNthCalledWith(2, "stage", "shopee_handoff");
    expect(query.eq).toHaveBeenNthCalledWith(3, "status", "success");
    expect(query.contains).toHaveBeenCalledWith("details", {
      method: "GUIDED_MANUAL",
      schemaVersion: 1,
      snapshotFingerprint: "a".repeat(64),
    });
  });

  it("requires matching prepared evidence and ignores malformed rows", async () => {
    const query: Record<string, ReturnType<typeof vi.fn>> = {};
    query.select = vi.fn(() => query);
    query.eq = vi.fn(() => query);
    query.contains = vi.fn(() =>
      Promise.resolve({
        data: [
          {
            details: {
              event: "SELLER_CENTRE_REVIEWER_CONFIRMED",
              evidenceBasis: "REVIEWER_ATTESTATION",
              method: "GUIDED_MANUAL",
              schemaVersion: 1,
              sellerAction: "NON_PUBLISHING_SAVE",
              snapshotFingerprint: "b".repeat(64),
            },
          },
          { details: "not-an-object" },
        ],
        error: null,
      }),
    );
    createClientMock.mockResolvedValue({ from: vi.fn(() => query) });

    await expect(
      getShopeeHandoffEvidence(
        "00000000-0000-4000-8000-000000000000",
        "b".repeat(64),
      ),
    ).resolves.toEqual({
      evidence: { prepared: false, reviewerConfirmed: false },
      ok: true,
    });
  });

  it("keeps a matching legacy confirmation as reviewer evidence without exposing its old action semantic", async () => {
    const query: Record<string, ReturnType<typeof vi.fn>> = {};
    query.select = vi.fn(() => query);
    query.eq = vi.fn(() => query);
    query.contains = vi.fn(() =>
      Promise.resolve({
        data: [
          {
            details: {
              attributeCount: 1,
              event: "HANDOFF_PREPARED",
              imageCount: 1,
              method: "GUIDED_MANUAL",
              offerMode: "BASE_LISTING",
              schemaVersion: 1,
              snapshotFingerprint: "c".repeat(64),
            },
          },
          {
            details: {
              event: "SELLER_CENTRE_REVIEWER_CONFIRMED",
              evidenceBasis: "REVIEWER_ATTESTATION",
              method: "GUIDED_MANUAL",
              schemaVersion: 1,
              sellerAction: "NON_PUBLISHING_SAVE",
              snapshotFingerprint: "c".repeat(64),
            },
          },
        ],
        error: null,
      }),
    );
    createClientMock.mockResolvedValue({ from: vi.fn(() => query) });

    await expect(
      getShopeeHandoffEvidence(
        "00000000-0000-4000-8000-000000000000",
        "c".repeat(64),
      ),
    ).resolves.toEqual({
      evidence: { prepared: true, reviewerConfirmed: true },
      ok: true,
    });
  });

  it("rejects an invalid handoff evidence lookup before reaching Supabase", async () => {
    await expect(
      getShopeeHandoffEvidence("not-a-product", "client-fingerprint"),
    ).resolves.toEqual({ error: "INVALID_EVIDENCE_INPUT", ok: false });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("reads a bounded newest-first history through the named product relation", async () => {
    const query = historyQuery([
      historyRow({
        status: "warning",
        message: "Offer options need review.",
      }),
      historyRow({
        id: "00000000-0000-4000-8000-000000000002",
        product: {
          id: "00000000-0000-4000-8000-000000000011",
          title: null,
        },
        product_id: "00000000-0000-4000-8000-000000000011",
        stage: "future_stage",
        status: "failed",
      }),
    ]);
    const from = vi.fn(() => query);
    createClientMock.mockResolvedValue({ from });

    await expect(listProcessHistory()).resolves.toEqual({
      ok: true,
      events: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          message: "Offer options need review.",
          occurredAt: "2026-09-06T06:30:00+00:00",
          product: {
            id: "00000000-0000-4000-8000-000000000010",
            title: "Real product",
          },
          stage: "persistence",
          status: "warning",
        },
        {
          id: "00000000-0000-4000-8000-000000000002",
          message: "Product record saved.",
          occurredAt: "2026-09-06T06:30:00+00:00",
          product: {
            id: "00000000-0000-4000-8000-000000000011",
            title: null,
          },
          stage: "future_stage",
          status: "failed",
        },
      ],
    });
    expect(from).toHaveBeenCalledWith("process_logs");
    expect(query.select).toHaveBeenCalledWith(HISTORY_SELECT);
    expect(HISTORY_SELECT).not.toMatch(/details|owner_id|\*/u);
    expect(query.order).toHaveBeenNthCalledWith(1, "created_at", {
      ascending: false,
    });
    expect(query.order).toHaveBeenNthCalledWith(2, "id", {
      ascending: false,
    });
    expect(query.limit).toHaveBeenCalledWith(100);
  });

  it.each([
    ["malformed log id", { id: "not-a-uuid" }],
    ["malformed timestamp", { created_at: "yesterday" }],
    ["unknown status", { status: "complete" }],
    ["missing product relation", { product: null }],
    ["malformed product relation", { product: [] }],
    [
      "mismatched product relation",
      {
        product: {
          id: "00000000-0000-4000-8000-000000000099",
          title: "Wrong parent",
        },
      },
    ],
  ])("returns a safe read failure for %s", async (_case, override) => {
    createClientMock.mockResolvedValue({
      from: vi.fn(() => historyQuery([historyRow(override)])),
    });

    await expect(listProcessHistory()).resolves.toEqual({
      error: "DATABASE_READ_FAILED",
      ok: false,
    });
  });

  it("returns a safe read failure for Supabase errors", async () => {
    createClientMock.mockResolvedValue({
      from: vi.fn(() => historyQuery(null, { message: "private error" })),
    });

    await expect(listProcessHistory()).resolves.toEqual({
      error: "DATABASE_READ_FAILED",
      ok: false,
    });
  });

  it("returns a safe read failure when the client throws", async () => {
    createClientMock.mockRejectedValue(new Error("private exception"));

    await expect(listProcessHistory()).resolves.toEqual({
      error: "DATABASE_READ_FAILED",
      ok: false,
    });
  });
});
