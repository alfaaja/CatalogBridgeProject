import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { createServerClientMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
}))

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}))

vi.mock("./config", () => ({
  getSupabasePublicConfig: () => ({
    url: "https://example.supabase.co",
    publishableKey: "test-publishable-key",
  }),
}))

import { updateSession } from "./proxy"

describe("Supabase session proxy", () => {
  beforeEach(() => {
    createServerClientMock.mockReset()
  })

  it.each(["/", "/products", "/products/source-id", "/import", "/history"])(
    "redirects an unauthenticated %s request to login",
    async (pathname) => {
    createServerClientMock.mockReturnValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: null },
          error: null,
        }),
      },
    })

    const response = await updateSession(
      new NextRequest(`https://catalogbridge.example${pathname}`)
    )

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe(
      "https://catalogbridge.example/login"
    )
    }
  )

  it("allows an authenticated request to continue", async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: "reviewer-id" } },
          error: null,
        }),
      },
    })

    const response = await updateSession(
      new NextRequest("https://catalogbridge.example/")
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("location")).toBeNull()
  })

  it("redirects an authenticated reviewer away from the login page", async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: "reviewer-id" } },
          error: null,
        }),
      },
    })

    const response = await updateSession(
      new NextRequest("https://catalogbridge.example/login")
    )

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe(
      "https://catalogbridge.example/"
    )
  })

  it("does not treat a Supabase anonymous identity as the reviewer", async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { is_anonymous: true, sub: "anonymous-id" } },
          error: null,
        }),
      },
    })

    const response = await updateSession(
      new NextRequest("https://catalogbridge.example/")
    )

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe(
      "https://catalogbridge.example/login"
    )
  })
})
