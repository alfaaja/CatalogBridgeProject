import type { ProcessHistoryStatus } from "@/lib/supabase/process-log-repository"

export type ProcessHistoryStatusTone =
  | "danger"
  | "neutral"
  | "success"
  | "warning"

const stageLabels: Readonly<Record<string, string>> = {
  import: "Product import",
  normalization: "Product prepared",
  persistence: "Product saved",
  review: "Product review",
  shopee_handoff: "Shopee handoff",
  shopee_mapping: "Shopee preparation",
  source_parse: "Source parsed",
}

const statusPresentation: Readonly<
  Record<
    ProcessHistoryStatus,
    Readonly<{ label: string; tone: ProcessHistoryStatusTone }>
  >
> = {
  failed: { label: "Failed", tone: "danger" },
  started: { label: "Started", tone: "neutral" },
  success: { label: "Success", tone: "success" },
  warning: { label: "Warning", tone: "warning" },
}

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const

const jakartaTimestampFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Jakarta",
  year: "numeric",
})

export function getProcessHistoryStageLabel(stage: string) {
  return stageLabels[stage] ?? "Other activity"
}

export function getProcessHistoryStatusPresentation(
  status: ProcessHistoryStatus
) {
  return statusPresentation[status]
}

export function formatProcessHistoryTimestamp(timestamp: string) {
  const parts = Object.fromEntries(
    jakartaTimestampFormatter
      .formatToParts(new Date(timestamp))
      .map((part) => [part.type, part.value])
  )
  const monthIndex = Number(parts.month) - 1
  const month = monthLabels[monthIndex]

  return `${parts.day} ${month} ${parts.year}, ${parts.hour}:${parts.minute} WIB`
}
