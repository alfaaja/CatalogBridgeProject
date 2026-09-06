import { z } from "zod"

import { createClient } from "./server"

export const loginCredentialsSchema = z
  .object({
    email: z.string().trim().max(254).pipe(z.email()),
    password: z.string().min(1).max(256)
  })
  .strict()

export const registrationCredentialsSchema = z
  .object({
    confirmPassword: z.string().max(256),
    email: z.string().trim().max(254).pipe(z.email()),
    password: z.string().min(8).max(256)
  })
  .strict()
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
  })

type RegistrationFieldErrors = Readonly<
  Partial<Record<"confirmPassword" | "email" | "password", string>>
>

type RegistrationResult =
  | Readonly<{ ok: true; outcome: "SIGNED_IN" | "CHECK_EMAIL" }>
  | Readonly<{
      error: "INVALID_REGISTRATION"
      fieldErrors: RegistrationFieldErrors
      ok: false
    }>
  | Readonly<{
      error:
        | "ACCOUNT_MAY_EXIST"
        | "INVALID_EMAIL"
        | "RATE_LIMITED"
        | "REGISTRATION_FAILED"
        | "REGISTRATION_UNAVAILABLE"
        | "WEAK_PASSWORD"
      ok: false
    }>

export function publicAuthErrorMessage() {
  return "Unable to sign in with those credentials."
}

type AuthResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false
      error: "AUTHENTICATION_FAILED" | "INVALID_CREDENTIALS" | "SIGN_OUT_FAILED"
    }>

export async function authenticateReviewer(
  formData: FormData
): Promise<AuthResult> {
  const credentials = loginCredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  })

  if (!credentials.success) {
    return { ok: false, error: "INVALID_CREDENTIALS" }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword(credentials.data)

    return error ? { ok: false, error: "AUTHENTICATION_FAILED" } : { ok: true }
  } catch {
    return { ok: false, error: "AUTHENTICATION_FAILED" }
  }
}

function registrationFieldErrors(formData: FormData): RegistrationFieldErrors {
  const email = formData.get("email")
  const password = formData.get("password")
  const confirmPassword = formData.get("confirmPassword")
  const errors: Record<string, string> = {}

  if (
    typeof email !== "string" ||
    email.trim().length > 254 ||
    !z.email().safeParse(email.trim()).success
  )
    errors.email = "Enter a valid email address."
  if (typeof password !== "string" || password.length === 0)
    errors.password = "Enter a password."
  else if (password.length < 8) errors.password = "Use at least 8 characters."
  else if (password.length > 256) errors.password = "Use a shorter password."
  if (typeof confirmPassword !== "string" || confirmPassword.length === 0)
    errors.confirmPassword = "Confirm your password."
  else if (confirmPassword !== password)
    errors.confirmPassword = "Passwords do not match."
  return errors
}

function mapRegistrationProviderCode(code: unknown): RegistrationResult {
  switch (code) {
    case "email_address_invalid":
      return { error: "INVALID_EMAIL", ok: false }
    case "weak_password":
      return { error: "WEAK_PASSWORD", ok: false }
    case "email_exists":
    case "user_already_exists":
      return { error: "ACCOUNT_MAY_EXIST", ok: false }
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return { error: "RATE_LIMITED", ok: false }
    case "signup_disabled":
    case "email_provider_disabled":
      return { error: "REGISTRATION_UNAVAILABLE", ok: false }
    default:
      return { error: "REGISTRATION_FAILED", ok: false }
  }
}

export async function registerAccount(
  formData: FormData
): Promise<RegistrationResult> {
  const credentials = registrationCredentialsSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    email: formData.get("email"),
    password: formData.get("password")
  })
  if (!credentials.success) {
    return {
      error: "INVALID_REGISTRATION",
      fieldErrors: registrationFieldErrors(formData),
      ok: false
    }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email: credentials.data.email,
      password: credentials.data.password
    })
    if (error) return mapRegistrationProviderCode(error.code)
    if (data.session && data.user) return { ok: true, outcome: "SIGNED_IN" }
    if (data.user && !data.session) return { ok: true, outcome: "CHECK_EMAIL" }
    return { error: "REGISTRATION_FAILED", ok: false }
  } catch {
    return { error: "REGISTRATION_FAILED", ok: false }
  }
}

export async function signOutReviewer(): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    return error ? { ok: false, error: "SIGN_OUT_FAILED" } : { ok: true }
  } catch {
    return { ok: false, error: "SIGN_OUT_FAILED" }
  }
}
