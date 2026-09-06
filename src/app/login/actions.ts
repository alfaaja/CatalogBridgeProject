"use server"

import { redirect } from "next/navigation"

import {
  authenticateReviewer,
  signOutReviewer,
} from "@/lib/supabase/auth"

export async function login(formData: FormData) {
  const result = await authenticateReviewer(formData)

  if (!result.ok) {
    redirect("/login?error=sign_in_failed")
  }

  redirect("/dashboard")
}

export async function logout() {
  const result = await signOutReviewer()

  if (!result.ok) {
    redirect("/dashboard?auth_error=sign_out_failed")
  }

  redirect("/login")
}
