import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react"

import type { ProductReviewIssue } from "@/lib/product-review"

export function ReviewChecklist({
  issues,
}: {
  issues: readonly ProductReviewIssue[]
}) {
  const requiredCount = issues.filter(
    (issue) => issue.severity === "required"
  ).length
  const warningCount = issues.length - requiredCount

  return (
    <aside
      aria-labelledby="review-checklist-title"
      className="rounded-lg border bg-background p-4 xl:sticky xl:top-6"
    >
      <h2 id="review-checklist-title" className="text-base font-semibold">
        Review checklist
      </h2>
      {issues.length === 0 ? (
        <div className="mt-4 flex gap-3 text-sm text-emerald-800">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>
            Product information is complete for review. Shopee mapping is still
            required.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            {requiredCount} required · {warningCount} recommended
          </p>
          <ul className="mt-4 space-y-3">
            {issues.map((issue) => {
              const Icon =
                issue.severity === "required" ? AlertCircle : AlertTriangle

              return (
                <li className="flex gap-2.5 text-sm" key={`${issue.field}-${issue.code}`}>
                  <Icon
                    aria-hidden="true"
                    className={
                      issue.severity === "required"
                        ? "mt-0.5 size-4 shrink-0 text-destructive"
                        : "mt-0.5 size-4 shrink-0 text-amber-700"
                    }
                  />
                  <div>
                    <p className="font-medium">
                      {issue.severity === "required" ? "Required" : "Recommended"}
                    </p>
                    <p className="mt-0.5 text-muted-foreground">{issue.message}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </aside>
  )
}
