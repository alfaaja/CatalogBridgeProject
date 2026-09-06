import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { createServerClientMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn()
}))

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock
}))

vi.mock("./config", () => ({
  getSupabasePublicConfig: () => ({
    url: "https://example.supabase.co",
    publishableKey: "test-publishable-key"
  })
}))

import { updateSession } from "./proxy"

describe("Supabase session proxy", () => {
  beforeEach(() => {
    createServerClientMock.mockReset()
  })

  it.each([
    "/dashboard",
    "/products",
    "/products/source-id",
    "/import",
    "/history"
  ])("redirects an unauthenticated %s request to login", async (pathname) => {
    createServerClientMock.mockReturnValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: null },
          error: null
        })
      }
    })

    const response = await updateSession(
      new NextRequest(`https://catalogbridge.example${pathname}`)
    )

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe(
      "https://catalogbridge.example/login"
    )
  })

  it.each(["/", "/login", "/register"])(
    "allows an unauthenticated public %s request to continue",
    async (pathname) => {
      createServerClientMock.mockReturnValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: { claims: null },
            error: null
          })
        }
      })

      const response = await updateSession(
        new NextRequest(`https://catalogbridge.example${pathname}`)
      )

      expect(response.status).toBe(200)
      expect(response.headers.get("location")).toBeNull()
    }
  )

  it("allows an authenticated protected request to continue", async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: "reviewer-id" } },
          error: null
        })
      }
    })

    const response = await updateSession(
      new NextRequest("https://catalogbridge.example/dashboard")
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("location")).toBeNull()
  })

  it.each(["/", "/login", "/register"])(
    "redirects an authenticated reviewer away from %s",
    async (pathname) => {
      createServerClientMock.mockReturnValue({
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: { claims: { sub: "reviewer-id" } },
            error: null
          })
        }
      })

      const response = await updateSession(
        new NextRequest(`https://catalogbridge.example${pathname}`)
      )

      expect(response.status).toBe(307)
      expect(response.headers.get("location")).toBe(
        "https://catalogbridge.example/dashboard"
      )
    }
  )

  it("does not treat a Supabase anonymous identity as the reviewer", async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { is_anonymous: true, sub: "anonymous-id" } },
          error: null
        })
      }
    })

    const response = await updateSession(
      new NextRequest("https://catalogbridge.example/dashboard")
    )

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe(
      "https://catalogbridge.example/login"
    )
  })

  it.each([
    ["/dashboard", true, null],
    ["/register", false, null],
    ["/dashboard", false, "/login"],
    ["/register", true, "/dashboard"]
  ])(
    "preserves refreshed cookies and cache-safety headers for %s",
    async (pathname, authenticated, redirectPath) => {
      createServerClientMock.mockImplementation((_url, _key, options) => ({
        auth: {
          getClaims: vi.fn().mockImplementation(async () => {
            options.cookies.setAll(
              [
                {
                  name: "sb-session",
                  options: { httpOnly: true, path: "/" },
                  value: "refreshed"
                }
              ],
              {
                "Cache-Control":
                  "private, no-cache, no-store, must-revalidate, max-age=0",
                Expires: "0",
                Pragma: "no-cache"
              }
            )

            return authenticated
              ? { data: { claims: { sub: "reviewer-id" } }, error: null }
              : { data: { claims: null }, error: null }
          })
        }
      }))

      const response = await updateSession(
        new NextRequest(`https://catalogbridge.example${pathname}`)
      )

      expect(response.cookies.get("sb-session")?.value).toBe("refreshed")
      expect(response.headers.get("cache-control")).toContain("no-store")
      expect(response.headers.get("expires")).toBe("0")
      expect(response.headers.get("pragma")).toBe("no-cache")
      expect(response.status).toBe(redirectPath ? 307 : 200)
      expect(response.headers.get("location")).toBe(
        redirectPath
          ? `https://catalogbridge.example${redirectPath}`
          : null
      )
    }
  )
})
