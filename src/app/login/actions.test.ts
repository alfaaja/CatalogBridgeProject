import { beforeEach, describe, expect, it, vi } from "vitest"

const { authenticateReviewerMock, redirectMock, signOutReviewerMock } =
  vi.hoisted(() => ({
    authenticateReviewerMock: vi.fn(),
    redirectMock: vi.fn((pathname: string) => {
      throw new Error(`NEXT_REDIRECT:${pathname}`)
    }),
    signOutReviewerMock: vi.fn()
  }))

vi.mock("next/navigation", () => ({ redirect: redirectMock }))
vi.mock("@/lib/supabase/auth", () => ({
  authenticateReviewer: authenticateReviewerMock,
  signOutReviewer: signOutReviewerMock
}))

import { login, logout } from "./actions"

describe("login actions", () => {
  beforeEach(() => {
    authenticateReviewerMock.mockReset()
    redirectMock.mockClear()
    signOutReviewerMock.mockReset()
  })

  it("preserves login behavior and redirects success to Dashboard", async () => {
    authenticateReviewerMock.mockResolvedValue({ ok: true })

    await expect(login(new FormData())).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard"
    )
  })

  it("keeps login failures on the public login page", async () => {
    authenticateReviewerMock.mockResolvedValue({
      error: "AUTHENTICATION_FAILED",
      ok: false
    })

    await expect(login(new FormData())).rejects.toThrow(
      "NEXT_REDIRECT:/login?error=sign_in_failed"
    )
  })

  it("keeps a failed sign-out inside the authenticated Dashboard", async () => {
    signOutReviewerMock.mockResolvedValue({
      error: "SIGN_OUT_FAILED",
      ok: false
    })

    await expect(logout()).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard?auth_error=sign_out_failed"
    )
  })
})
