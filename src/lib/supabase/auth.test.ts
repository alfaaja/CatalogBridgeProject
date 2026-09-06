import { beforeEach, describe, expect, it, vi } from "vitest"

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn()
}))

vi.mock("./server", () => ({
  createClient: createClientMock
}))

import {
  authenticateReviewer,
  loginCredentialsSchema,
  registerAccount,
  registrationCredentialsSchema,
  signOutReviewer
} from "./auth"

function registrationForm(overrides: Record<string, string> = {}) {
  const formData = new FormData()
  const values = {
    confirmPassword: "strong-password",
    email: "new-reviewer@example.com",
    password: "strong-password",
    ...overrides
  }

  Object.entries(values).forEach(([key, value]) => formData.set(key, value))
  return formData
}

describe("Supabase password authentication boundary", () => {
  beforeEach(() => {
    createClientMock.mockReset()
  })

  it("normalizes an email without changing the password", () => {
    const result = loginCredentialsSchema.parse({
      email: "  reviewer@example.com  ",
      password: "  keep-password-whitespace  "
    })

    expect(result).toEqual({
      email: "reviewer@example.com",
      password: "  keep-password-whitespace  "
    })
  })

  it("rejects invalid credentials before calling Supabase", async () => {
    const formData = new FormData()
    formData.set("email", "not-an-email")
    formData.set("password", "")

    expect(await authenticateReviewer(formData)).toEqual({
      ok: false,
      error: "INVALID_CREDENTIALS"
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
      password: "  keep-password-whitespace  "
    })
  })

  it("maps provider failures without exposing their details", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      error: { message: "provider details must stay private" }
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
      error: { message: "provider details must stay private" }
    })
    createClientMock.mockResolvedValue({ auth: { signOut } })

    const result = await signOutReviewer()

    expect(result).toEqual({ ok: false, error: "SIGN_OUT_FAILED" })
    expect(JSON.stringify(result)).not.toContain("provider details")
  })

  it("validates registration email, password, and confirmation before Supabase", async () => {
    const invalidEmail = await registerAccount(
      registrationForm({ email: "not-an-email" })
    )
    const emptyPassword = await registerAccount(
      registrationForm({ confirmPassword: "", password: "" })
    )
    const mismatch = await registerAccount(
      registrationForm({ confirmPassword: "different-password" })
    )

    expect(invalidEmail).toMatchObject({
      error: "INVALID_REGISTRATION",
      fieldErrors: { email: "Enter a valid email address." },
      ok: false
    })
    expect(emptyPassword).toMatchObject({
      error: "INVALID_REGISTRATION",
      fieldErrors: {
        confirmPassword: "Confirm your password.",
        password: "Enter a password."
      },
      ok: false
    })
    expect(mismatch).toMatchObject({
      error: "INVALID_REGISTRATION",
      fieldErrors: { confirmPassword: "Passwords do not match." },
      ok: false
    })
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it("normalizes registration email without changing password whitespace", () => {
    expect(
      registrationCredentialsSchema.parse({
        confirmPassword: "  strong-password  ",
        email: "  new-reviewer@example.com  ",
        password: "  strong-password  "
      })
    ).toEqual({
      confirmPassword: "  strong-password  ",
      email: "new-reviewer@example.com",
      password: "  strong-password  "
    })
  })

  it("creates an account without owner metadata and recognizes an immediate session", async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: { session: { access_token: "private" }, user: { id: "user-id" } },
      error: null
    })
    createClientMock.mockResolvedValue({ auth: { signUp } })

    const result = await registerAccount(
      registrationForm({ email: "  new-reviewer@example.com  " })
    )

    expect(result).toEqual({ ok: true, outcome: "SIGNED_IN" })
    expect(signUp).toHaveBeenCalledWith({
      email: "new-reviewer@example.com",
      password: "strong-password"
    })
    expect(JSON.stringify(signUp.mock.calls)).not.toMatch(
      /owner_id|service.role|metadata|private/iu
    )
  })

  it("recognizes the confirmation-required signup outcome", async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: { session: null, user: { id: "user-id" } },
      error: null
    })
    createClientMock.mockResolvedValue({ auth: { signUp } })

    await expect(registerAccount(registrationForm())).resolves.toEqual({
      ok: true,
      outcome: "CHECK_EMAIL"
    })
  })

  it.each([
    ["email_address_invalid", "INVALID_EMAIL"],
    ["weak_password", "WEAK_PASSWORD"],
    ["email_exists", "ACCOUNT_MAY_EXIST"],
    ["user_already_exists", "ACCOUNT_MAY_EXIST"],
    ["over_email_send_rate_limit", "RATE_LIMITED"],
    ["signup_disabled", "REGISTRATION_UNAVAILABLE"],
    ["unexpected_failure", "REGISTRATION_FAILED"]
  ])(
    "maps provider code %s to %s without exposing details",
    async (code, expected) => {
      const signUp = vi.fn().mockResolvedValue({
        data: { session: null, user: null },
        error: { code, message: "private provider details" }
      })
      createClientMock.mockResolvedValue({ auth: { signUp } })

      const result = await registerAccount(registrationForm())

      expect(result).toEqual({ error: expected, ok: false })
      expect(JSON.stringify(result)).not.toContain("private provider details")
    }
  )

  it("fails closed for malformed success data and thrown exceptions", async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: { session: null, user: null },
      error: null
    })
    createClientMock.mockResolvedValueOnce({ auth: { signUp } })
    createClientMock.mockRejectedValueOnce(
      new Error("private provider details")
    )

    await expect(registerAccount(registrationForm())).resolves.toEqual({
      error: "REGISTRATION_FAILED",
      ok: false
    })
    const thrownResult = await registerAccount(registrationForm())
    expect(thrownResult).toEqual({ error: "REGISTRATION_FAILED", ok: false })
    expect(JSON.stringify(thrownResult)).not.toContain(
      "private provider details"
    )
  })
})
