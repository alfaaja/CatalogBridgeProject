"use client"

import Link from "next/link"
import { useActionState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { register } from "./actions"
import {
  initialRegisterFormState,
  type RegisterFormState
} from "./register-state"

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p className="text-xs text-destructive" id={id} role="alert">
      {message}
    </p>
  ) : null
}

export function RegisterForm({
  initialState = initialRegisterFormState
}: {
  initialState?: RegisterFormState
}) {
  const [state, formAction, pending] = useActionState(register, initialState)

  if (state.status === "check_email") {
    return (
      <div aria-live="polite" className="mt-8 border-t pt-7">
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          If this address can be registered, check your inbox for a confirmation
          link. Confirm your account, then sign in to CatalogBridge.
        </p>
        <Link
          className="mt-6 inline-flex min-h-10 items-center font-medium underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/login"
        >
          Go to Sign In
        </Link>
      </div>
    )
  }

  const emailError = state.fieldErrors?.email
  const passwordError = state.fieldErrors?.password
  const confirmPasswordError = state.fieldErrors?.confirmPassword

  return (
    <>
      {state.message ? (
        <Alert aria-live="polite" className="mt-6" variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <form action={formAction} className="mt-8 space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <Input
            aria-describedby={emailError ? "register-email-error" : undefined}
            aria-invalid={emailError ? true : undefined}
            autoComplete="email"
            disabled={pending}
            id="register-email"
            maxLength={254}
            name="email"
            required
            type="email"
          />
          <FieldError id="register-email-error" message={emailError} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <Input
            aria-describedby={
              passwordError
                ? "register-password-error"
                : "register-password-hint"
            }
            aria-invalid={passwordError ? true : undefined}
            autoComplete="new-password"
            disabled={pending}
            id="register-password"
            maxLength={256}
            minLength={8}
            name="password"
            required
            type="password"
          />
          <p
            className="text-xs text-muted-foreground"
            id="register-password-hint"
          >
            Use at least 8 characters.
          </p>
          <FieldError id="register-password-error" message={passwordError} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-confirm-password">Confirm Password</Label>
          <Input
            aria-describedby={
              confirmPasswordError
                ? "register-confirm-password-error"
                : undefined
            }
            aria-invalid={confirmPasswordError ? true : undefined}
            autoComplete="new-password"
            disabled={pending}
            id="register-confirm-password"
            maxLength={256}
            minLength={8}
            name="confirmPassword"
            required
            type="password"
          />
          <FieldError
            id="register-confirm-password-error"
            message={confirmPasswordError}
          />
        </div>
        <Button className="h-10 w-full" disabled={pending} type="submit">
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-7 border-t pt-5 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          className="font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/login"
        >
          Sign in
        </Link>
      </p>
    </>
  )
}
