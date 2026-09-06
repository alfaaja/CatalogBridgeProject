// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { registerMock } = vi.hoisted(() => ({ registerMock: vi.fn() }))

vi.mock("./actions", () => ({ register: registerMock }))

import { RegisterForm } from "./register-form"
import { initialRegisterFormState } from "./register-state"

describe("RegisterForm", () => {
  beforeEach(() => {
    registerMock.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it("uses labeled password-manager-friendly fields", () => {
    render(<RegisterForm />)

    expect(screen.getByLabelText("Email").getAttribute("autocomplete")).toBe(
      "email"
    )
    expect(screen.getByLabelText("Password").getAttribute("autocomplete")).toBe(
      "new-password"
    )
    expect(screen.getByLabelText("Confirm Password").getAttribute("type")).toBe(
      "password"
    )
    expect(
      (
        screen.getByRole("button", {
          name: "Create account"
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false)
    expect(
      screen.getByRole("link", { name: "Sign in" }).getAttribute("href")
    ).toBe("/login")
  })

  it("associates validation errors with their fields", () => {
    render(
      <RegisterForm
        initialState={{
          fieldErrors: {
            confirmPassword: "Passwords do not match.",
            email: "Enter a valid email address."
          },
          status: "error"
        }}
      />
    )

    expect(
      screen.getByLabelText("Email").getAttribute("aria-describedby")
    ).toBe("register-email-error")
    expect(screen.getByLabelText("Email").getAttribute("aria-invalid")).toBe(
      "true"
    )
    expect(screen.getByText("Passwords do not match.").getAttribute("id")).toBe(
      "register-confirm-password-error"
    )
    expect(screen.getAllByRole("alert")).toHaveLength(2)
  })

  it("shows a neutral confirmation state without echoing credentials", () => {
    render(<RegisterForm initialState={{ status: "check_email" }} />)

    expect(
      screen.getByRole("heading", { name: "Check your email" })
    ).toBeTruthy()
    expect(screen.getByText(/confirmation link/i)).toBeTruthy()
    expect(screen.queryByText(/^We sent/i)).toBeNull()
    expect(screen.queryByLabelText("Password")).toBeNull()
    expect(
      screen.getByRole("link", { name: "Go to Sign In" }).getAttribute("href")
    ).toBe("/login")
  })

  it("disables submission while registration is pending", async () => {
    let resolveAction:
      ((state: typeof initialRegisterFormState) => void) | undefined
    registerMock.mockImplementation(
      () =>
        new Promise<typeof initialRegisterFormState>((resolve) => {
          resolveAction = resolve
        })
    )
    render(<RegisterForm />)

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "new-reviewer@example.com" }
    })
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "strong-password" }
    })
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "strong-password" }
    })
    fireEvent.submit(
      screen.getByRole("button", { name: "Create account" }).closest("form")!
    )

    await waitFor(() => {
      expect(
        (
          screen.getByRole("button", {
            name: "Creating account…"
          }) as HTMLButtonElement
        ).disabled
      ).toBe(true)
    })

    await act(async () => {
      resolveAction?.(initialRegisterFormState)
    })
  })
})
