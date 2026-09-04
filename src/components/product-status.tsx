import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  XCircle,
} from "lucide-react"

import {
  getProductStatusPresentation,
  type ProductStatusTone,
} from "@/lib/product-presentation"
import type { ProductSummary } from "@/lib/supabase/product-repository"
import { cn } from "@/lib/utils"

const toneClasses: Record<ProductStatusTone, string> = {
  danger: "border-rose-200 bg-rose-50 text-rose-800",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
}

function StatusIcon({ status }: { status: ProductSummary["status"] }) {
  const iconProps = { "aria-hidden": true, className: "size-3.5" } as const

  switch (status) {
    case "READY":
      return <CheckCircle2 {...iconProps} />
    case "REVIEW_REQUIRED":
      return <AlertTriangle {...iconProps} />
    case "FAILED":
      return <XCircle {...iconProps} />
    case "IMPORTING":
      return <LoaderCircle {...iconProps} className="size-3.5 animate-spin" />
    case "PENDING":
      return <Clock3 {...iconProps} />
  }
}

export function ProductStatus({
  status,
}: {
  status: ProductSummary["status"]
}) {
  const presentation = getProductStatusPresentation(status)

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-xs font-medium whitespace-nowrap",
        toneClasses[presentation.tone]
      )}
    >
      <StatusIcon status={status} />
      {presentation.label}
    </span>
  )
}
