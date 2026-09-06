"use server"

import { redirect } from "next/navigation"

import { registerAccount } from "@/lib/supabase/auth"

import type { RegisterFormState } from "./register-state"

const registrationMessages = {
  RATE_LIMITED: "Too many registration attempts. Please wait and try again.",
  REGISTRATION_FAILED: "We couldn't create your account. Please try again.",
  REGISTRATION_UNAVAILABLE:
    "Account registration is currently unavailable. Please try again later."
} as const

export async function register(
  _previousState: RegisterFormState,
  formData: FormData
): Promise<RegisterFormState> {
  const result = await registerAccount(formData)

  if (result.ok) {
    if (result.outcome === "SIGNED_IN") redirect("/dashboard")
    return { status: "check_email" }
  }

  if (result.error === "INVALID_REGISTRATION") {
    return { fieldErrors: result.fieldErrors, status: "error" }
  }
  if (result.error === "INVALID_EMAIL") {
    return {
      fieldErrors: { email: "Enter a valid email address." },
      status: "error"
    }
  }
  if (result.error === "WEAK_PASSWORD") {
    return {
      fieldErrors: { password: "Use a stronger password." },
      status: "error"
    }
  }
  if (result.error === "ACCOUNT_MAY_EXIST") {
    return { status: "check_email" }
  }

  return { message: registrationMessages[result.error], status: "error" }
}
