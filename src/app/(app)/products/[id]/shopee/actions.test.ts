import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  appendLog: vi.fn(),
  createClient: vi.fn(),
  getDraft: vi.fn(),
  getProduct: vi.fn(),
  revalidate: vi.fn(),
  saveDraft: vi.fn(),
  transition: vi.fn(),
}))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }))
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }))
vi.mock("@/lib/supabase/process-log-repository", () => ({
  appendProcessLog: mocks.appendLog,
}))
vi.mock("@/lib/supabase/product-review-repository", () => ({
  getProductReview: mocks.getProduct,
}))
vi.mock("@/lib/supabase/shopee-draft-repository", () => ({
  getShopeeDraft: mocks.getDraft,
  saveShopeeDraft: mocks.saveDraft,
  transitionProductForShopee: mocks.transition,
}))

import {
  markProductReadyForShopeeAction,
  reopenShopeeMappingAction,
  saveShopeeDraftAction,
} from "./actions"

const productId = "11111111-1111-4111-8111-111111111111"
const product = {
  attributes: {},
  brand: "JEP",
  createdAt: "2026-09-05T00:00:00Z",
  description: "Description",
  dimensionsCm: { height: null, length: null, width: null },
  failure: null,
  gtin: null,
  id: productId,
  images: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      isPrimary: true,
      kind: "product",
      position: 0,
      sourceUrl: "https://static.jakmall.id/a.jpg",
    },
  ],
  logs: [],
  rawSourceData: {},
  sellingPrice: 79900,
  sku: "SKU",
  source: {
    canonicalUrl: "https://www.jakmall.com/a",
    category: "Tools",
    platform: "jakmall",
    price: 64600,
    productIdentifier: "1",
  },
  status: "REVIEW_REQUIRED",
  stock: 5,
  title: "Title",
  updatedAt: "2026-09-05T00:00:00Z",
  variantAxes: [],
  variants: [],
  weightGrams: 250,
} as const
const draft = {
  categoryAttributes: [],
  categoryAttributesReviewed: true,
  categoryConfirmed: true,
  categoryId: null,
  categoryPath: "Home > Tools",
  condition: "NEW",
  createdAt: "2026-09-05T00:00:00Z",
  dangerousProduct: "NO",
  descriptionOverride: null,
  preorder: "NO",
  productId,
  titleOverride: null,
  updatedAt: "2026-09-05T00:00:00Z",
} as const

function form(path = "Home > Tools") {
  const data = new FormData()
  Object.entries({
    titleOverride: "",
    descriptionOverride: "",
    categoryId: "",
    categoryPath: path,
    categoryConfirmed: "true",
    categoryAttributesReviewed: "true",
    dangerousProduct: "NO",
    condition: "NEW",
    preorder: "NO",
  }).forEach(([key, value]) => data.set(key, value))
  return data
}

describe("Shopee mapping actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createClient.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: "reviewer", is_anonymous: false } },
          error: null,
        }),
      },
    })
    mocks.getProduct.mockResolvedValue({ ok: true, product })
    mocks.getDraft.mockResolvedValue({ ok: true, draft })
    mocks.saveDraft.mockResolvedValue({ ok: true })
    mocks.transition.mockResolvedValue({ ok: true })
    mocks.appendLog.mockResolvedValue({ ok: true })
  })

  it("invalidates stale confirmations on category change before persistence", async () => {
    await saveShopeeDraftAction(productId, {}, form("Home > Storage"))
    expect(mocks.saveDraft).toHaveBeenCalledWith(
      productId,
      expect.objectContaining({
        categoryConfirmed: false,
        categoryAttributesReviewed: false,
      })
    )
  })

  it("authenticates before loading or writing mapping data", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    })

    const result = await saveShopeeDraftAction(productId, {}, form())

    expect(result.status).toBe("error")
    expect(mocks.getProduct).not.toHaveBeenCalled()
    expect(mocks.getDraft).not.toHaveBeenCalled()
    expect(mocks.saveDraft).not.toHaveBeenCalled()
  })

  it("does not write or log a no-op draft save", async () => {
    const result = await saveShopeeDraftAction(productId, {}, form())

    expect(result).toMatchObject({ status: "neutral" })
    expect(mocks.saveDraft).not.toHaveBeenCalled()
    expect(mocks.appendLog).not.toHaveBeenCalled()
  })

  it("reports a truthful warning when data saves but activity logging fails", async () => {
    mocks.getDraft.mockResolvedValue({ ok: true, draft: null })
    mocks.appendLog.mockResolvedValue({
      error: "DATABASE_WRITE_FAILED",
      ok: false,
    })

    const result = await saveShopeeDraftAction(productId, {}, form())

    expect(result.status).toBe("warning")
    expect(mocks.saveDraft).toHaveBeenCalledOnce()
    expect(mocks.appendLog).toHaveBeenCalledOnce()
  })

  it("never writes a success log when the draft mutation fails", async () => {
    mocks.getDraft.mockResolvedValue({ ok: true, draft: null })
    mocks.saveDraft.mockResolvedValue({
      error: "DATABASE_WRITE_FAILED",
      ok: false,
    })

    const result = await saveShopeeDraftAction(productId, {}, form())

    expect(result.status).toBe("error")
    expect(mocks.appendLog).not.toHaveBeenCalled()
  })

  it("ignores forged readiness and reloads current persisted product, images, variants, and draft", async () => {
    const forged = new FormData()
    forged.set("isReady", "true")
    forged.set("blockerCount", "0")
    mocks.getProduct.mockResolvedValue({
      ok: true,
      product: { ...product, weightGrams: 0 },
    })
    const result = await markProductReadyForShopeeAction(productId, {}, forged)
    expect(result.status).toBe("error")
    expect(mocks.getProduct).toHaveBeenCalledWith(productId)
    expect(mocks.getDraft).toHaveBeenCalledWith(productId)
    expect(mocks.transition).not.toHaveBeenCalled()
  })

  it("marks READY only after persisted validation and logs safe counts", async () => {
    await expect(
      markProductReadyForShopeeAction(productId, {}, new FormData())
    ).resolves.toMatchObject({ status: "success" })
    expect(mocks.transition).toHaveBeenCalledWith(
      productId,
      "REVIEW_REQUIRED",
      "READY"
    )
    expect(mocks.appendLog).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({ blockerCount: 0 }),
        message: "Product marked Ready for Shopee.",
      })
    )
  })

  it("reopens READY before any later edit", async () => {
    mocks.getProduct.mockResolvedValue({
      ok: true,
      product: { ...product, status: "READY" },
    })
    await reopenShopeeMappingAction(productId, {}, new FormData())
    expect(mocks.transition).toHaveBeenCalledWith(
      productId,
      "READY",
      "REVIEW_REQUIRED"
    )
    expect(mocks.saveDraft).not.toHaveBeenCalled()
  })
})
