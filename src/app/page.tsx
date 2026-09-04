import { redirect } from "next/navigation"

import { logout } from "@/app/login/actions"
import { createClient } from "@/lib/supabase/server"

type HomeProps = {
  searchParams: Promise<{ auth_error?: string | string[] }>
}

export default async function Home({ searchParams }: HomeProps) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims || data.claims.is_anonymous === true) {
    redirect("/login")
  }

  const { auth_error: authError } = await searchParams

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-20 sm:px-10">
        <p className="text-sm font-medium tracking-normal text-muted-foreground uppercase">
          CatalogBridge
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal sm:text-4xl">
          JakMall-to-Shopee catalog preparation.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
          The persistence and reviewer-access foundation is ready. Product
          workflows are not enabled yet.
        </p>
        {authError ? (
          <p className="mt-6 text-sm text-destructive" role="alert">
            Unable to sign out. Please try again.
          </p>
        ) : null}
        <div className="mt-10 flex items-center justify-between border-t pt-5">
          <p className="text-sm text-muted-foreground">
            Milestone 1 foundation
          </p>
          <form action={logout}>
            <button
              className="text-sm font-medium underline underline-offset-4"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
