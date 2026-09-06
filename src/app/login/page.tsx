import type { Metadata } from "next"
import Link from "next/link"

import { publicAuthErrorMessage } from "@/lib/supabase/auth"

import { login } from "./actions"

export const metadata: Metadata = {
  title: "Sign in | CatalogBridge",
}

type LoginPageProps = {
  searchParams: Promise<{ error?: string | string[] }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-20">
        <p className="text-sm font-medium tracking-normal text-muted-foreground uppercase">
          CatalogBridge
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">
          Reviewer sign in
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Use your CatalogBridge email and password to continue.
        </p>

        {error ? (
          <p
            className="mt-6 border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {publicAuthErrorMessage()}
          </p>
        ) : null}

        <form action={login} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              autoComplete="email"
              className="h-10 w-full border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="email"
              name="email"
              required
              type="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              autoComplete="current-password"
              className="h-10 w-full border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="password"
              name="password"
              required
              type="password"
            />
          </div>

          <button
            className="h-10 w-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            type="submit"
          >
            Sign in
          </button>
        </form>

        <p className="mt-8 border-t pt-5 text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            className="font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="/register"
          >
            Create one
          </Link>
        </p>
      </section>
    </main>
  )
}
