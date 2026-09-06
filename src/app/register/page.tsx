import { Waypoints } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { RegisterForm } from "./register-form"

export const metadata: Metadata = { title: "Create account | CatalogBridge" }

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
        <Link
          aria-label="CatalogBridge home"
          className="flex w-fit items-center gap-2 rounded-md font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="/"
        >
          <span className="flex size-9 items-center justify-center rounded-md bg-slate-900 text-white">
            <Waypoints aria-hidden="true" className="size-5" />
          </span>
          CatalogBridge
        </Link>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Start importing, reviewing, and preparing product listings in one
          workspace.
        </p>
        <RegisterForm />
      </section>
    </main>
  )
}
