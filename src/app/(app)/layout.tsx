import type { CSSProperties, ReactNode } from "react"
import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/server"

export default async function AuthenticatedAppLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (
    error ||
    typeof data?.claims?.sub !== "string" ||
    data.claims.is_anonymous === true
  ) {
    redirect("/login")
  }

  const reviewerEmail =
    typeof data.claims.email === "string"
      ? data.claims.email
      : "Authenticated reviewer"

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "15rem" } as CSSProperties}
    >
      <a
        className="sr-only z-50 rounded-md bg-background px-3 py-2 text-sm font-medium shadow-sm focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus-visible:ring-2 focus-visible:ring-ring"
        href="#main-content"
      >
        Skip to main content
      </a>
      <AppSidebar reviewerEmail={reviewerEmail} />
      <SidebarInset
        className="min-w-0 bg-slate-50/70"
        id="main-content"
        tabIndex={-1}
      >
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 sm:px-6">
          <SidebarTrigger aria-label="Toggle navigation" className="-ml-1" />
          <Separator className="mx-1 h-4" orientation="vertical" />
          <p className="truncate text-sm font-medium">Catalog operations</p>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
