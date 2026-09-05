import { beforeEach, describe, expect, it, vi } from "vitest"

import { fetchJakMallProductDocument } from "@/lib/jakmall/fetch"
import { appendProcessLog } from "@/lib/supabase/process-log-repository"
import {
  createPendingProduct,
  insertProductImages,
  insertProductVariants,
  markProductImportFailed,
  markProductImporting,
  saveImportedProduct,
} from "@/lib/supabase/product-repository"

import { importJakMallProduct } from "./import-product"

vi.mock("@/lib/jakmall/fetch", () => ({ fetchJakMallProductDocument: vi.fn() }))
vi.mock("@/lib/supabase/process-log-repository", () => ({
  appendProcessLog: vi.fn(),
}))
vi.mock("@/lib/supabase/product-repository", () => ({
  createPendingProduct: vi.fn(),
  insertProductImages: vi.fn(),
  insertProductVariants: vi.fn(),
  markProductImportFailed: vi.fn(),
  markProductImporting: vi.fn(),
  saveImportedProduct: vi.fn(),
}))

const productId = "00000000-0000-4000-8000-000000000000"
const productUrl = "https://www.jakmall.com/fixture-store/stainless-tumbler"
const productDocument = `<!doctype html><html><head>
  <link rel="canonical" href="${productUrl}">
  <script type="application/ld+json">{
    "@context":"https://schema.org",
    "@type":"Product",
    "name":"Stainless Tumbler",
    "image":"https://static.jakmall.id/products/tumbler.jpg",
    "offers":{"@type":"Offer","price":"125000","sku":"OFFER-SKU"}
  }</script>
</head><body></body></html>`

const mockedFetch = vi.mocked(fetchJakMallProductDocument)
const mockedLog = vi.mocked(appendProcessLog)
const mockedCreate = vi.mocked(createPendingProduct)
const mockedInsertImages = vi.mocked(insertProductImages)
const mockedInsertVariants = vi.mocked(insertProductVariants)
const mockedMarkFailed = vi.mocked(markProductImportFailed)
const mockedMarkImporting = vi.mocked(markProductImporting)
const mockedSave = vi.mocked(saveImportedProduct)

beforeEach(() => {
  vi.clearAllMocks()
  mockedFetch.mockResolvedValue({
    ok: true,
    document: {
      body: productDocument,
      byteLength: Buffer.byteLength(productDocument),
      contentType: "text/html",
      redirectCount: 0,
      url: productUrl,
    },
  })
  mockedLog.mockResolvedValue({ ok: true })
  mockedCreate.mockResolvedValue({ ok: true, productId })
  mockedInsertImages.mockResolvedValue({ ok: true })
  mockedInsertVariants.mockResolvedValue({ ok: true })
  mockedMarkFailed.mockResolvedValue({ ok: true })
  mockedMarkImporting.mockResolvedValue({ ok: true })
  mockedSave.mockResolvedValue({ ok: true })
})

describe("JakMall product import orchestration", () => {
  it("does not create a row when live acquisition hits human verification", async () => {
    mockedFetch.mockResolvedValue({
      ok: false,
      error: "SOURCE_UNREACHABLE",
      classification: "AWS_WAF_HUMAN_VERIFICATION",
    })

    await expect(
      importJakMallProduct({ acquisitionMode: "live_url", sourceUrl: productUrl })
    ).resolves.toEqual({
      ok: false,
      error: "SOURCE_UNREACHABLE",
      classification: "AWS_WAF_HUMAN_VERIFICATION",
      message:
        "JakMall requires browser verification before this page can be accessed automatically. Open the product page normally in your browser, save it as HTML, then upload the file below.",
    })
    expect(mockedCreate).not.toHaveBeenCalled()
    expect(mockedLog).not.toHaveBeenCalled()
  })

  it("imports assisted HTML without fetching or inventing a source identifier", async () => {
    const result = await importJakMallProduct({
      acquisitionMode: "assisted_html",
      assistedHtml: productDocument,
      assistedHtmlByteLength: Buffer.byteLength(productDocument),
      sourceUrl: `${productUrl}?jtm=tracking`,
    })

    expect(result).toEqual({ ok: true, productId })
    expect(mockedFetch).not.toHaveBeenCalled()
    expect(mockedCreate).toHaveBeenCalledWith({
      canonicalSourceUrl: productUrl,
      sourceProductIdentifier: null,
      title: "Stainless Tumbler",
    })
    expect(mockedMarkImporting).toHaveBeenCalledWith(productId)
    expect(mockedInsertVariants).toHaveBeenCalledBefore(mockedInsertImages)
    expect(mockedInsertImages).toHaveBeenCalledBefore(mockedSave)
    expect(mockedSave).toHaveBeenCalledWith(
      productId,
      expect.objectContaining({
        rawSourceData: expect.objectContaining({ acquisitionMode: "assisted_html" }),
        sellingPrice: null,
        sourcePrice: 125000,
        status: "REVIEW_REQUIRED",
      })
    )
    expect(JSON.stringify(mockedSave.mock.calls[0][1].rawSourceData)).not.toContain(
      "<!doctype html>"
    )
  })

  it("rejects a mismatched assisted document before persistence", async () => {
    const mismatched = productDocument.replace(
      productUrl,
      "https://www.jakmall.com/fixture-store/different-product"
    )

    await expect(
      importJakMallProduct({
        acquisitionMode: "assisted_html",
        assistedHtml: mismatched,
        assistedHtmlByteLength: Buffer.byteLength(mismatched),
        sourceUrl: productUrl,
      })
    ).resolves.toMatchObject({ ok: false, error: "SOURCE_DOCUMENT_MISMATCH" })
    expect(mockedCreate).not.toHaveBeenCalled()
  })

  it("maps the database uniqueness boundary to stable duplicate copy", async () => {
    mockedCreate.mockResolvedValue({
      ok: false,
      error: "IMPORT_DUPLICATE_PRODUCT",
    })

    await expect(
      importJakMallProduct({ acquisitionMode: "live_url", sourceUrl: productUrl })
    ).resolves.toEqual({
      ok: false,
      error: "IMPORT_DUPLICATE_PRODUCT",
      message:
        "An import already exists for this JakMall product. Retry for existing imports is not available yet.",
    })
    expect(mockedMarkImporting).not.toHaveBeenCalled()
  })

  it("marks the parent failed and never finalizes after a child write failure", async () => {
    mockedInsertVariants.mockResolvedValue({
      ok: false,
      error: "DATABASE_WRITE_FAILED",
    })

    await expect(
      importJakMallProduct({
        acquisitionMode: "assisted_html",
        assistedHtml: productDocument,
        assistedHtmlByteLength: Buffer.byteLength(productDocument),
        sourceUrl: productUrl,
      })
    ).resolves.toMatchObject({ ok: false, error: "DATABASE_WRITE_FAILED" })
    expect(mockedInsertImages).not.toHaveBeenCalled()
    expect(mockedSave).not.toHaveBeenCalled()
    expect(mockedMarkFailed).toHaveBeenCalledWith({
      errorCode: "DATABASE_WRITE_FAILED",
      errorMessage: "Product import could not be saved.",
      productId,
    })
  })

  it("sanitizes an unexpected persistence exception", async () => {
    mockedInsertVariants.mockRejectedValue(new Error("raw database detail"))

    await expect(
      importJakMallProduct({
        acquisitionMode: "assisted_html",
        assistedHtml: productDocument,
        assistedHtmlByteLength: Buffer.byteLength(productDocument),
        sourceUrl: productUrl,
      })
    ).resolves.toEqual({
      ok: false,
      error: "DATABASE_WRITE_FAILED",
      message:
        "The product could not be saved. Please retry after checking the Supabase connection.",
    })
    expect(mockedMarkFailed).toHaveBeenCalled()
  })
})
