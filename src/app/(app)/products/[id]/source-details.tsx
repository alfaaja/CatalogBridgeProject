import { ExternalLink } from "lucide-react"

import { formatProductUpdatedAt } from "@/lib/product-presentation"
import type { ProductReview } from "@/lib/product-review"

function textValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function warningValues(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function countValues(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return []

  return Object.entries(value).filter(
    (entry): entry is [string, number] =>
      typeof entry[1] === "number" && Number.isFinite(entry[1])
  )
}

function identityVerified(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const verified = (value as Record<string, unknown>).verified
  return typeof verified === "boolean" ? verified : null
}

export function SourceDetails({ product }: { product: ProductReview }) {
  const acquisitionMode = textValue(product.rawSourceData.acquisitionMode)
  const parserStrategy = textValue(product.rawSourceData.parserStrategy)
  const warnings = warningValues(product.rawSourceData.warnings)
  const counts = countValues(product.rawSourceData.counts)
  const verified = identityVerified(product.rawSourceData.pageIdentity)
  const attributes = Object.entries(product.attributes)

  return (
    <details className="border-t pt-5">
      <summary className="min-h-8 cursor-pointer text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        Source details and process evidence
      </summary>
      <div className="mt-4 grid gap-6 text-sm lg:grid-cols-2">
        <section aria-labelledby="source-evidence-title">
          <h3 id="source-evidence-title" className="font-medium">
            JakMall evidence
          </h3>
          <dl className="mt-3 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-2 text-xs">
            <dt className="text-muted-foreground">Canonical URL</dt>
            <dd className="min-w-0">
              <a
                className="inline-flex max-w-full items-center gap-1 break-all underline underline-offset-4"
                href={product.source.canonicalUrl}
                rel="noreferrer"
                target="_blank"
              >
                {product.source.canonicalUrl}
                <ExternalLink aria-hidden="true" className="size-3 shrink-0" />
              </a>
            </dd>
            <dt className="text-muted-foreground">Source identifier</dt>
            <dd className="font-mono">
              {product.source.productIdentifier ?? "Not available"}
            </dd>
            <dt className="text-muted-foreground">Source category</dt>
            <dd>{product.source.category ?? "Not available"}</dd>
            <dt className="text-muted-foreground">Acquisition</dt>
            <dd>{acquisitionMode?.replaceAll("_", " ") ?? "Not recorded"}</dd>
            <dt className="text-muted-foreground">Parser</dt>
            <dd>{parserStrategy?.replaceAll("_", " ") ?? "Not recorded"}</dd>
            <dt className="text-muted-foreground">Page identity</dt>
            <dd>
              {verified === null
                ? "Not recorded"
                : verified
                  ? "Verified"
                  : "Not verified"}
            </dd>
          </dl>

          {warnings.length > 0 ? (
            <div className="mt-4">
              <h4 className="text-xs font-medium">Import warnings</h4>
              <ul className="mt-2 space-y-1 font-mono text-xs text-amber-800">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {counts.length > 0 ? (
            <dl className="mt-4 flex flex-wrap gap-2 text-xs">
              {counts.map(([name, count]) => (
                <div className="rounded-md border bg-muted/30 px-2 py-1" key={name}>
                  <dt className="inline text-muted-foreground">{name}: </dt>
                  <dd className="inline font-medium tabular-nums">{count}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>

        <section aria-labelledby="process-evidence-title">
          <h3 id="process-evidence-title" className="font-medium">
            Recent process events
          </h3>
          {product.logs.length > 0 ? (
            <ol className="mt-3 space-y-3">
              {product.logs.map((log) => (
                <li className="border-l pl-3 text-xs" key={log.id}>
                  <p className="font-medium">{log.message}</p>
                  <p className="mt-0.5 text-muted-foreground">
                    {log.stage.replaceAll("_", " ")} · {log.status} ·{" "}
                    <time dateTime={log.createdAt}>
                      {formatProductUpdatedAt(log.createdAt)}
                    </time>
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              No process events are available.
            </p>
          )}
        </section>
      </div>

      {attributes.length > 0 ? (
        <section aria-labelledby="imported-attributes-title" className="mt-6 border-t pt-5">
          <h3 id="imported-attributes-title" className="font-medium">
            Imported attributes
          </h3>
          <dl className="mt-3 grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2">
            {attributes.map(([name, value]) => (
              <div className="bg-background p-3 text-xs" key={name}>
                <dt className="text-muted-foreground">{name}</dt>
                <dd className="mt-1 break-words font-medium">
                  {typeof value === "string" || typeof value === "number"
                    ? String(value)
                    : "Structured source value retained"
                  }
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </details>
  )
}
