import { z } from "zod"

import { createClient } from "./server"

export const loginCredentialsSchema = z
  .object({
    email: z.string().trim().pipe(z.email()),
    password: z.string().min(1).max(256),
  })
  .strict()

export function publicAuthErrorMessage() {
  return "Unable to sign in with those credentials."
}

type AuthResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false
      error:
        | "AUTHENTICATION_FAILED"
        | "INVALID_CREDENTIALS"
        | "SIGN_OUT_FAILED"
    }>

export async function authenticateReviewer(
  formData: FormData
): Promise<AuthResult> {
  const credentials = loginCredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!credentials.success) {
    return { ok: false, error: "INVALID_CREDENTIALS" }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword(credentials.data)

    return error
      ? { ok: false, error: "AUTHENTICATION_FAILED" }
      : { ok: true }
  } catch {
    return { ok: false, error: "AUTHENTICATION_FAILED" }
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
