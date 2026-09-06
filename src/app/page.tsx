import {
  ArrowRight,
  CheckCircle2,
  PackageSearch,
  ShieldCheck,
  Waypoints
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "CatalogBridge | JakMall to Shopee product preparation",
  description:
    "Import public JakMall product data, review it, and prepare a verified manual Shopee Seller Centre handoff."
}

const workflow = [
  {
    description:
      "Extract real product information from public JakMall product pages.",
    icon: PackageSearch,
    title: "Import from JakMall"
  },
  {
    description:
      "Check pricing, stock, images, variants, and required Shopee fields before continuing.",
    icon: CheckCircle2,
    title: "Review before listing"
  },
  {
    description:
      "Build a reviewer-verified Seller Centre handoff without unsafe credential or browser-session automation.",
    icon: ShieldCheck,
    title: "Prepare for Shopee"
  }
] as const

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            aria-label="CatalogBridge home"
            className="flex items-center gap-2 rounded-md font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="/"
          >
            <span className="flex size-9 items-center justify-center rounded-md bg-slate-900 text-white">
              <Waypoints aria-hidden="true" className="size-5" />
            </span>
            CatalogBridge
          </Link>
          <nav
            aria-label="Public navigation"
            className="flex items-center gap-2"
          >
            <Link
              className={buttonVariants({ variant: "ghost" })}
              href="/login"
            >
              Sign In
            </Link>
            <Link className={buttonVariants()} href="/register">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-muted-foreground">
              Catalog operations, clearly prepared
            </p>
            <h1 className="mt-4 text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
              Turn JakMall products into review-ready Shopee listings.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Extract real product data from JakMall, review and normalize
              listing details, then prepare a verified Shopee Seller Centre
              handoff in one workflow.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className={buttonVariants({ className: "h-10 px-4" })}
                href="/register"
              >
                Get Started
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link
                className={buttonVariants({
                  className: "h-10 px-4",
                  variant: "outline"
                })}
                href="/login"
              >
                Sign In
              </Link>
            </div>
          </div>

          <aside
            className="border-l-2 border-slate-900 pl-6"
            aria-label="Workflow summary"
          >
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              One clear workflow
            </p>
            <ol className="mt-5 space-y-5 text-sm">
              {workflow.map((item, index) => (
                <li className="flex gap-3" key={item.title}>
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="pt-1 font-medium">{item.title}</span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section aria-labelledby="workflow-title">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-muted-foreground">
              How it works
            </p>
            <h2
              id="workflow-title"
              className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              From source data to a reviewed handoff
            </h2>
          </div>
          <div className="mt-10 grid border-y md:grid-cols-3 md:divide-x">
            {workflow.map((item) => (
              <article
                className="border-b py-7 last:border-b-0 md:border-b-0 md:px-7 md:first:pl-0 md:last:pr-0"
                key={item.title}
              >
                <item.icon
                  aria-hidden="true"
                  className="size-5 text-slate-700"
                />
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link className={buttonVariants()} href="/register">
              Create account
            </Link>
            <Link
              className={cn(buttonVariants({ variant: "link" }), "px-0")}
              href="/login"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
