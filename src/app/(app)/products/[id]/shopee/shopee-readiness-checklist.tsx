import { AlertTriangle, CheckCircle2 } from "lucide-react"
import type { ShopeeReadinessIssue } from "@/lib/shopee-draft"

export function ShopeeReadinessChecklist({
  issues,
}: {
  issues: readonly ShopeeReadinessIssue[]
}) {
  const blockers = issues.filter((issue) => issue.severity === "blocker")
  return (
    <aside
      className="rounded-lg border p-4 xl:sticky xl:top-6"
      aria-labelledby="shopee-readiness-title"
    >
      <h2 className="font-semibold" id="shopee-readiness-title">
        Shopee readiness
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {blockers.length} blockers · {issues.length - blockers.length} warnings
      </p>
      {blockers.length === 0 ? (
        <p className="mt-4 flex gap-2 text-sm text-emerald-800">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Locally ready for Shopee handoff.
        </p>
      ) : null}
      {issues.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {issues.map((issue) => (
            <li className="flex gap-2 text-sm" key={issue.code}>
              <AlertTriangle
                className={
                  issue.severity === "blocker"
                    ? "mt-0.5 size-4 shrink-0 text-destructive"
                    : "mt-0.5 size-4 shrink-0 text-amber-700"
                }
                aria-hidden="true"
              />
              <div>
                <p className="font-medium">
                  {issue.severity === "blocker" ? "Required" : "Handoff note"}
                </p>
                <p className="text-muted-foreground">{issue.message}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  )
}
