import {
  fetchJakMallProductDocument,
  type JakMallFetchClassification,
} from "@/lib/jakmall/fetch"
import { normalizeJakMallSourceProduct } from "@/lib/jakmall/normalize"
import { parseJakMallProductDocument } from "@/lib/jakmall/parser"
import { canonicalizeJakMallProductUrl } from "@/lib/jakmall/url"
import { appendProcessLog } from "@/lib/supabase/process-log-repository"
import {
  createPendingProduct,
  insertProductImages,
  insertProductVariants,
  markProductImportFailed,
  markProductImporting,
  saveImportedProduct,
} from "@/lib/supabase/product-repository"

import {
  publicImportErrorMessage,
  type ImportProductErrorCode,
} from "./import-errors"
import { ASSISTED_HTML_MAX_BYTES } from "./html-upload"

type ImportInput =
  | Readonly<{ acquisitionMode: "live_url"; sourceUrl: string }>
  | Readonly<{
      acquisitionMode: "assisted_html"
      assistedHtml: string
      assistedHtmlByteLength: number
      sourceUrl: string
    }>

export type ImportProductResult =
  | Readonly<{ ok: true; productId: string }>
  | Readonly<{
      ok: false
      error: ImportProductErrorCode
      message: string
      classification?: JakMallFetchClassification
    }>

function failed(
  error: ImportProductErrorCode,
  classification?: JakMallFetchClassification
): ImportProductResult {
  return {
    ok: false,
    error,
    message: publicImportErrorMessage(error, classification),
    ...(classification ? { classification } : {}),
  }
}

function validAssistedDocument(html: string, declaredByteLength: number) {
  const actualByteLength = Buffer.byteLength(html, "utf8")

  return (
    declaredByteLength === actualByteLength &&
    actualByteLength > 0 &&
    actualByteLength <= ASSISTED_HTML_MAX_BYTES &&
    !html.includes("\u0000") &&
    /<(?:!doctype\s+html|html|head|body|link|meta|script)\b/iu.test(html)
  )
}

function boundedIdentifier(identifier: string | null) {
  const value = identifier?.trim()
  return value && value.length <= 500 ? value : null
}

async function failPersistedImport(productId: string) {
  const failure = {
    errorCode: "DATABASE_WRITE_FAILED",
    errorMessage: "Product import could not be saved.",
    productId,
  }

  await markProductImportFailed(failure)
  await appendProcessLog({
    details: { errorCode: failure.errorCode },
    message: failure.errorMessage,
    productId,
    stage: "persistence",
    status: "failed",
  })
}

async function requireLog(
  productId: string,
  event: Omit<Parameters<typeof appendProcessLog>[0], "productId">
) {
  return appendProcessLog({ ...event, productId })
}

export async function importJakMallProduct(
  input: ImportInput
): Promise<ImportProductResult> {
  const canonicalUrl = canonicalizeJakMallProductUrl(input.sourceUrl)

  if (!canonicalUrl.ok) {
    return failed("IMPORT_INVALID_URL")
  }

  let html: string
  let documentByteLength: number

  if (input.acquisitionMode === "assisted_html") {
    if (!validAssistedDocument(input.assistedHtml, input.assistedHtmlByteLength)) {
      return failed("SOURCE_INVALID_ASSISTED_HTML")
    }

    html = input.assistedHtml
    documentByteLength = input.assistedHtmlByteLength
  } else {
    const fetched = await fetchJakMallProductDocument(canonicalUrl.url)

    if (!fetched.ok) {
      return failed(fetched.error, fetched.classification)
    }

    html = fetched.document.body
    documentByteLength = fetched.document.byteLength
  }

  let parsed

  try {
    parsed = parseJakMallProductDocument(html, canonicalUrl.url)
  } catch {
    return failed("SOURCE_PARSE_FAILED")
  }

  if (!parsed.ok) {
    return failed(parsed.error)
  }

  const created = await createPendingProduct({
    canonicalSourceUrl: canonicalUrl.url,
    sourceProductIdentifier: boundedIdentifier(
      parsed.product.sourceProductIdentifier
    ),
    title: parsed.product.title?.slice(0, 500) ?? null,
  })

  if (!created.ok) {
    return failed(
      created.error === "IMPORT_DUPLICATE_PRODUCT"
        ? "IMPORT_DUPLICATE_PRODUCT"
        : "DATABASE_WRITE_FAILED"
    )
  }

  const productId = created.productId
  const importing = await markProductImporting(productId)

  if (!importing.ok) {
    await failPersistedImport(productId)
    return failed("DATABASE_WRITE_FAILED")
  }

  const startedLog = await requireLog(productId, {
    details: { acquisitionMode: input.acquisitionMode },
    message: "Product import started.",
    stage: "import",
    status: "started",
  })

  if (!startedLog.ok) {
    await failPersistedImport(productId)
    return failed("DATABASE_WRITE_FAILED")
  }

  const parsedLog = await requireLog(productId, {
    details: {
      identityVerified: parsed.product.pageIdentity.verified,
      strategy: parsed.product.parserStrategy,
      warnings: [...parsed.product.warnings],
    },
    message: "Source document parsed.",
    stage: "source_parse",
    status: parsed.product.warnings.length > 0 ? "warning" : "success",
  })

  if (!parsedLog.ok) {
    await failPersistedImport(productId)
    return failed("DATABASE_WRITE_FAILED")
  }

  const normalized = normalizeJakMallSourceProduct(parsed.product, {
    acquisitionMode: input.acquisitionMode,
    canonicalSourceUrl: canonicalUrl.url,
    documentByteLength,
  })
  const normalizedLog = await requireLog(productId, {
    details: {
      imageCount: normalized.images.length,
      variantCount: normalized.variants.length,
      warnings: [...normalized.warnings],
    },
    message: "Product data normalized.",
    stage: "normalization",
    status: normalized.warnings.length > 0 ? "warning" : "success",
  })

  if (!normalizedLog.ok) {
    await failPersistedImport(productId)
    return failed("DATABASE_WRITE_FAILED")
  }

  for (const persist of [
    () => insertProductVariants(productId, normalized.variants),
    () => insertProductImages(productId, normalized.images),
    () => saveImportedProduct(productId, normalized.product),
  ]) {
    let result

    try {
      result = await persist()
    } catch {
      await failPersistedImport(productId)
      return failed("DATABASE_WRITE_FAILED")
    }

    if (!result.ok) {
      await failPersistedImport(productId)
      return failed("DATABASE_WRITE_FAILED")
    }
  }

  const persistedLog = await requireLog(productId, {
    details: {
      imageCount: normalized.images.length,
      variantCount: normalized.variants.length,
    },
    message: "Product import saved for review.",
    stage: "persistence",
    status: "success",
  })

  if (!persistedLog.ok) {
    await failPersistedImport(productId)
    return failed("DATABASE_WRITE_FAILED")
  }

  return { ok: true, productId }
}
