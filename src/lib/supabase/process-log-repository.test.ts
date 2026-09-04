import { beforeEach, describe, expect, it, vi } from "vitest"

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}))

vi.mock("./server", () => ({
  createClient: createClientMock,
}))

import { appendProcessLog } from "./process-log-repository"

describe("process log repository", () => {
  beforeEach(() => {
    createClientMock.mockReset()
  })

  it("appends a sanitized event without an owner override", async () => {
    const insert = vi.fn<
      (payload: unknown) => Promise<{ error: null }>
    >(() => Promise.resolve({ error: null }))
    const from = vi.fn(() => ({ insert }))
    createClientMock.mockResolvedValue({ from })

    const result = await appendProcessLog({
      productId: "00000000-0000-4000-8000-000000000000",
      stage: "persistence",
      status: "success",
      message: "Product record saved.",
      details: { recordsWritten: 1 },
    })

    expect(result).toEqual({ ok: true })
    expect(from).toHaveBeenCalledWith("process_logs")
    expect(insert).toHaveBeenCalledWith({
      details: { recordsWritten: 1 },
      message: "Product record saved.",
      product_id: "00000000-0000-4000-8000-000000000000",
      stage: "persistence",
      status: "success",
    })
    expect(insert.mock.calls[0]?.[0]).not.toHaveProperty("owner_id")
  })

  it("rejects unsafe details before reaching Supabase", async () => {
    createClientMock.mockResolvedValue({ from: vi.fn() })

    const result = await appendProcessLog({
      productId: "00000000-0000-4000-8000-000000000000",
      stage: "persistence",
      status: "failed",
      message: "Persistence failed.",
      details: { authorization: "Bearer secret" },
    })

    expect(result).toEqual({ ok: false, error: "INVALID_LOG_INPUT" })
    expect(createClientMock).not.toHaveBeenCalled()
  })
})
