import { afterEach, describe, expect, it, vi } from "vitest"

import { GET } from "./route"

const validUrl = "https://example.supabase.co"
const validKey = "test-publishable-key"

function setValidEnvironment() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", validUrl)
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", validKey)
}

describe("GET /api/health/supabase", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it("returns a stable success response and applies a request timeout", async () => {
    setValidEnvironment()
    const timeoutMock = vi.spyOn(AbortSignal, "timeout")
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }))

    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      status: "healthy",
      message: "Supabase is reachable.",
    })
    expect(fetchMock).toHaveBeenCalledWith(
      `${validUrl}/auth/v1/health`,
      expect.objectContaining({
        cache: "no-store",
        headers: { apikey: validKey },
        signal: expect.any(AbortSignal),
      })
    )
    expect(timeoutMock).toHaveBeenCalledOnce()
    const [timeoutMs] = timeoutMock.mock.calls[0]
    expect(timeoutMs).toBeGreaterThan(0)
    expect(timeoutMs).toBeLessThanOrEqual(10_000)
  })

  it("returns a secret-free unavailable response for invalid configuration", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not-a-url")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "secret-key")
    const fetchMock = vi.spyOn(globalThis, "fetch")
    const errorMock = vi.spyOn(console, "error").mockImplementation(() => {})

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toEqual({
      ok: false,
      status: "unavailable",
      message: "Supabase is unavailable.",
    })
    expect(JSON.stringify(body)).not.toContain("secret-key")
    expect(JSON.stringify(body)).not.toContain("not-a-url")
    expect(fetchMock).not.toHaveBeenCalled()
    expect(errorMock).toHaveBeenCalledWith(
      "Supabase health check configuration is invalid.",
      { issues: ["invalid_url"] }
    )
  })

  it("returns a stable unavailable response for an upstream failure", async () => {
    setValidEnvironment()
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 503 })
    )
    const errorMock = vi.spyOn(console, "error").mockImplementation(() => {})

    const response = await GET()

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      ok: false,
      status: "unavailable",
      message: "Supabase is unavailable.",
    })
    expect(errorMock).toHaveBeenCalledWith(
      "Supabase health check returned a non-success status.",
      { upstreamStatus: 503 }
    )
  })

  it("does not expose or log a raw exception when the request fails", async () => {
    setValidEnvironment()
    const privateMessage = `${validUrl}?apikey=${validKey}`
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error(privateMessage))
    const errorMock = vi.spyOn(console, "error").mockImplementation(() => {})

    const response = await GET()
    const body = await response.json()
    const loggedArguments = JSON.stringify(errorMock.mock.calls)

    expect(response.status).toBe(503)
    expect(body).toEqual({
      ok: false,
      status: "unavailable",
      message: "Supabase is unavailable.",
    })
    expect(JSON.stringify(body)).not.toContain(validUrl)
    expect(JSON.stringify(body)).not.toContain(validKey)
    expect(loggedArguments).not.toContain(validUrl)
    expect(loggedArguments).not.toContain(validKey)
    expect(errorMock).toHaveBeenCalledWith(
      "Supabase health check request failed.",
      { category: "request_error" }
    )
  })

  it("reports a timeout using only a sanitized diagnostic category", async () => {
    setValidEnvironment()
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new DOMException("Request exceeded its deadline.", "TimeoutError")
    )
    const errorMock = vi.spyOn(console, "error").mockImplementation(() => {})

    const response = await GET()

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      ok: false,
      status: "unavailable",
      message: "Supabase is unavailable.",
    })
    expect(errorMock).toHaveBeenCalledWith(
      "Supabase health check request failed.",
      { category: "timeout" }
    )
  })
})
