import { beforeEach, describe, expect, it, vi } from "vitest"

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}))

vi.mock("./server", () => ({
  createClient: createClientMock,
}))

import {
  authenticateReviewer,
  loginCredentialsSchema,
  signOutReviewer,
} from "./auth"

describe("Supabase password authentication boundary", () => {
  beforeEach(() => {
    createClientMock.mockReset()
  })

  it("normalizes an email without changing the password", () => {
    const result = loginCredentialsSchema.parse({
      email: "  reviewer@example.com  ",
      password: "  keep-password-whitespace  ",
    })

    expect(result).toEqual({
      email: "reviewer@example.com",
      password: "  keep-password-whitespace  ",
    })
  })

  it("rejects invalid credentials before calling Supabase", async () => {
    const formData = new FormData()
    formData.set("email", "not-an-email")
    formData.set("password", "")

    expect(await authenticateReviewer(formData)).toEqual({
      ok: false,
      error: "INVALID_CREDENTIALS",
    })
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it("signs in with normalized credentials", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockResolvedValue({ auth: { signInWithPassword } })
    const formData = new FormData()
    formData.set("email", "  reviewer@example.com  ")
    formData.set("password", "  keep-password-whitespace  ")

    expect(await authenticateReviewer(formData)).toEqual({ ok: true })
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "reviewer@example.com",
      password: "  keep-password-whitespace  ",
    })
  })

  it("maps provider failures without exposing their details", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      error: { message: "provider details must stay private" },
    })
    createClientMock.mockResolvedValue({ auth: { signInWithPassword } })
    const formData = new FormData()
    formData.set("email", "reviewer@example.com")
    formData.set("password", "password")

    const result = await authenticateReviewer(formData)

    expect(result).toEqual({ ok: false, error: "AUTHENTICATION_FAILED" })
    expect(JSON.stringify(result)).not.toContain("provider details")
  })

  it("signs out through the session-aware client", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null })
    createClientMock.mockResolvedValue({ auth: { signOut } })

    expect(await signOutReviewer()).toEqual({ ok: true })
    expect(signOut).toHaveBeenCalledOnce()
  })

  it("maps sign-out failures without exposing provider details", async () => {
    const signOut = vi.fn().mockResolvedValue({
      error: { message: "provider details must stay private" },
    })
    createClientMock.mockResolvedValue({ auth: { signOut } })

    const result = await signOutReviewer()

    expect(result).toEqual({ ok: false, error: "SIGN_OUT_FAILED" })
    expect(JSON.stringify(result)).not.toContain("provider details")
  })
})
