import {
  CheckCircle2,
  Clock3,
  TriangleAlert,
  XCircle,
} from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatProcessHistoryTimestamp,
  getProcessHistoryStageLabel,
  getProcessHistoryStatusPresentation,
  type ProcessHistoryStatusTone,
} from "@/lib/process-history-presentation"
import type {
  ProcessHistoryEvent,
  ProcessHistoryStatus,
} from "@/lib/supabase/process-log-repository"
import { cn } from "@/lib/utils"

const toneClasses: Record<ProcessHistoryStatusTone, string> = {
  danger: "border-rose-200 bg-rose-50 text-rose-800",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
}

function HistoryStatusIcon({ status }: { status: ProcessHistoryStatus }) {
  const iconProps = { "aria-hidden": true, className: "size-3.5" } as const

  switch (status) {
    case "started":
      return <Clock3 {...iconProps} />
    case "success":
      return <CheckCircle2 {...iconProps} />
    case "warning":
      return <TriangleAlert {...iconProps} />
    case "failed":
      return <XCircle {...iconProps} />
  }
}

function HistoryStatus({ status }: { status: ProcessHistoryStatus }) {
  const presentation = getProcessHistoryStatusPresentation(status)

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-xs font-medium whitespace-nowrap",
        toneClasses[presentation.tone]
      )}
    >
      <HistoryStatusIcon status={status} />
      {presentation.label}
    </span>
  )
}

export function ProcessHistoryTable({
  events,
}: {
  events: readonly ProcessHistoryEvent[]
}) {
  return (
    <div className="rounded-lg border bg-background">
      <p className="border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground lg:hidden">
        Scroll horizontally to view all activity fields.
      </p>
      <Table className="min-w-[900px]" containerLabel="Process history">
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-9 pl-4 text-xs tracking-wide text-muted-foreground uppercase">
              Time
            </TableHead>
            <TableHead className="h-9 text-xs tracking-wide text-muted-foreground uppercase">
              Product
            </TableHead>
            <TableHead className="h-9 text-xs tracking-wide text-muted-foreground uppercase">
              Activity
            </TableHead>
            <TableHead className="h-9 text-xs tracking-wide text-muted-foreground uppercase">
              Status
            </TableHead>
            <TableHead className="h-9 pr-4 text-right text-xs tracking-wide text-muted-foreground uppercase">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => {
            const productTitle = event.product.title ?? "Untitled product"

            return (
              <TableRow key={event.id}>
                <TableCell className="py-3 pl-4 text-xs text-muted-foreground tabular-nums">
                  <time dateTime={event.occurredAt}>
                    {formatProcessHistoryTimestamp(event.occurredAt)}
                  </time>
                </TableCell>
                <TableCell className="max-w-64 truncate font-medium">
                  {productTitle}
                </TableCell>
                <TableCell className="max-w-96 whitespace-normal">
                  <p className="font-medium">
                    {getProcessHistoryStageLabel(event.stage)}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    {event.message}
                  </p>
                </TableCell>
                <TableCell>
                  <HistoryStatus status={event.status} />
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <Link
                    aria-label={`View ${productTitle}`}
                    className={buttonVariants({
                      size: "sm",
                      variant: "outline",
                    })}
                    href={`/products/${event.product.id}`}
                  >
                    View Product
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
