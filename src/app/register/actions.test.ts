import { beforeEach, describe, expect, it, vi } from "vitest"

const { redirectMock, registerAccountMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((pathname: string) => {
    throw new Error(`NEXT_REDIRECT:${pathname}`)
  }),
  registerAccountMock: vi.fn()
}))

vi.mock("next/navigation", () => ({ redirect: redirectMock }))
vi.mock("@/lib/supabase/auth", () => ({
  registerAccount: registerAccountMock
}))

import { register } from "./actions"
import { initialRegisterFormState } from "./register-state"

describe("register action", () => {
  beforeEach(() => {
    redirectMock.mockClear()
    registerAccountMock.mockReset()
  })

  it("redirects an immediately authenticated account to Dashboard", async () => {
    registerAccountMock.mockResolvedValue({ ok: true, outcome: "SIGNED_IN" })

    await expect(
      register(initialRegisterFormState, new FormData())
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard")
    expect(redirectMock).toHaveBeenCalledWith("/dashboard")
  })

  it("returns a confirmation state when no session was created", async () => {
    registerAccountMock.mockResolvedValue({
      ok: true,
      outcome: "CHECK_EMAIL"
    })

    await expect(
      register(initialRegisterFormState, new FormData())
    ).resolves.toEqual({ status: "check_email" })
  })

  it("keeps an existing-account provider outcome non-enumerating", async () => {
    registerAccountMock.mockResolvedValue({
      error: "ACCOUNT_MAY_EXIST",
      ok: false
    })

    await expect(
      register(initialRegisterFormState, new FormData())
    ).resolves.toEqual({ status: "check_email" })
  })

  it("returns only safe validation details", async () => {
    registerAccountMock.mockResolvedValue({
      error: "INVALID_REGISTRATION",
      fieldErrors: { email: "Enter a valid email address." },
      ok: false
    })

    await expect(
      register(initialRegisterFormState, new FormData())
    ).resolves.toEqual({
      fieldErrors: { email: "Enter a valid email address." },
      status: "error"
    })
  })

  it("maps provider failure codes without returning provider details", async () => {
    registerAccountMock.mockResolvedValue({
      error: "REGISTRATION_FAILED",
      ok: false
    })

    const result = await register(initialRegisterFormState, new FormData())

    expect(result).toEqual({
      message: "We couldn't create your account. Please try again.",
      status: "error"
    })
    expect(JSON.stringify(result)).not.toContain("Supabase")
  })
})
