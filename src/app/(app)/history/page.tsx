import { AlertCircle, History } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { PageHeader } from "@/components/page-header"
import { ProcessHistoryTable } from "@/components/process-history-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { listProcessHistory } from "@/lib/supabase/process-log-repository"

export const metadata: Metadata = {
  title: "Process History | CatalogBridge",
}

export default async function ProcessHistoryPage() {
  const historyResult = await listProcessHistory()

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader
        description="Review real import, product review, and Shopee preparation activity."
        eyebrow="Operations"
        title="Process History"
      />

      <section className="mt-6" aria-labelledby="history-list-title">
        <div className="mb-3">
          <h2 id="history-list-title" className="text-lg font-semibold">
            Recent activity
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Showing up to the 100 most recent activities.
          </p>
        </div>

        {!historyResult.ok ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>Activity could not be loaded</AlertTitle>
            <AlertDescription>
              Refresh the page. If the problem continues, check the Supabase
              connection before continuing.
            </AlertDescription>
          </Alert>
        ) : historyResult.events.length === 0 ? (
          <div className="rounded-lg border bg-background px-6 py-16 text-center">
            <span className="mx-auto flex size-10 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
              <History aria-hidden="true" className="size-5" />
            </span>
            <h2 className="mt-4 text-base font-semibold">No activity yet</h2>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
              No activity yet. Import a product to start building history.
            </p>
            <Link
              className={buttonVariants({ className: "mt-5" })}
              href="/import"
            >
              Import Product
            </Link>
          </div>
        ) : (
          <ProcessHistoryTable events={historyResult.events} />
        )}

        <p className="mt-4 max-w-3xl text-xs leading-5 text-muted-foreground">
          Shopee handoff activity records package preparation or reviewer
          confirmation. It is operational evidence, not API upload or
          publication proof.
        </p>
      </section>
    </div>
  )
}
