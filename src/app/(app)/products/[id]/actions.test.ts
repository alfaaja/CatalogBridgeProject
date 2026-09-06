import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  appendProcessLogMock,
  createClientMock,
  getProductReviewMock,
  revalidatePathMock,
  updateReviewProductMock,
  updateReviewVariantMock,
} = vi.hoisted(() => ({
  appendProcessLogMock: vi.fn(),
  createClientMock: vi.fn(),
  getProductReviewMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  updateReviewProductMock: vi.fn(),
  updateReviewVariantMock: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }))
vi.mock("@/lib/supabase/process-log-repository", () => ({
  appendProcessLog: appendProcessLogMock,
}))
vi.mock("@/lib/supabase/product-review-repository", () => ({
  getProductReview: getProductReviewMock,
  updateReviewProduct: updateReviewProductMock,
  updateReviewVariant: updateReviewVariantMock,
}))
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }))

import {
  saveProductReviewAction,
  saveVariantReviewAction,
} from "./actions"
import * as productReviewActions from "./actions"

const productId = "00000000-0000-4000-8000-000000000000"
const variantId = "00000000-0000-4000-8000-000000000001"

const productReview = {
  attributes: {},
  brand: null,
  createdAt: "2026-09-05T00:00:00+07:00",
  description: null,
  dimensionsCm: { height: null, length: null, width: null },
  failure: null,
  gtin: null,
  id: productId,
  images: [],
  logs: [],
  rawSourceData: {},
  sellingPrice: null,
  sku: null,
  source: {
    canonicalUrl: "https://www.jakmall.com/store/product",
    category: null,
    platform: "jakmall",
    price: 64600,
    productIdentifier: null,
  },
  status: "REVIEW_REQUIRED",
  stock: null,
  title: "Existing title",
  updatedAt: "2026-09-05T00:00:00+07:00",
  variantAxes: [],
  variants: [
    {
      id: variantId,
      imageSourceUrl: null,
      optionValues: {},
      position: 0,
      productId,
      sellingPrice: null,
      sku: null,
      sourcePrice: 64600,
      sourceVariantIdentifier: null,
      stock: null,
      updatedAt: "2026-09-05T00:00:00+07:00",
    },
  ],
  weightGrams: null,
} as const

function productForm(overrides: Record<string, string> = {}) {
  const formData = new FormData()

  for (const [key, value] of Object.entries({
    productId,
    title: "Updated title",
    description: "",
    sellingPrice: "70000",
    stock: "5",
    sku: "SKU-1",
    gtin: "",
    brand: "JEP",
    weightGrams: "450",
    lengthCm: "12.5",
    widthCm: "",
    heightCm: "",
    ...overrides,
  })) {
    formData.set(key, value)
  }

  return formData
}

function variantForm(overrides: Record<string, string> = {}) {
  const formData = new FormData()

  for (const [key, value] of Object.entries({
    productId,
    variantId,
    sellingPrice: "71000",
    stock: "6",
    sku: "VAR-1",
    ...overrides,
  })) {
    formData.set(key, value)
  }

  return formData
}

describe("product review actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createClientMock.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { is_anonymous: false, sub: "reviewer" } },
          error: null,
        }),
      },
    })
    getProductReviewMock.mockResolvedValue({ ok: true, product: productReview })
    updateReviewProductMock.mockResolvedValue({ ok: true })
    updateReviewVariantMock.mockResolvedValue({ ok: true })
    appendProcessLogMock.mockResolvedValue({ ok: true })
  })

  it("exports only async server actions at runtime", () => {
    expect(Object.values(productReviewActions)).toEqual([
      expect.any(Function),
      expect.any(Function),
    ])
  })

  it("authenticates before parsing or reading product input", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({ data: null, error: new Error() }),
      },
    })
    const formData = new FormData()
    formData.set("sourcePrice", "1")

    await expect(saveProductReviewAction({}, formData)).resolves.toEqual({
      message: "Please sign in again before saving product changes.",
      status: "error",
    })
    expect(getProductReviewMock).not.toHaveBeenCalled()
    expect(updateReviewProductMock).not.toHaveBeenCalled()
  })

  it("confirms REVIEW_REQUIRED and logs parent field names after saving", async () => {
    const result = await saveProductReviewAction({}, productForm())

    expect(result).toEqual({
      message: "Product review changes saved.",
      status: "success",
    })
    expect(getProductReviewMock).toHaveBeenCalledWith(productId)
    expect(updateReviewProductMock).toHaveBeenCalledWith(
      productId,
      expect.objectContaining({ sellingPrice: 70000, title: "Updated title" })
    )
    expect(appendProcessLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        details: {
          changedFields: expect.arrayContaining(["selling_price"]),
          scope: "product",
        },
        productId,
        stage: "review",
        status: "success",
      })
    )
    expect(JSON.stringify(appendProcessLogMock.mock.calls[0][0].details)).not.toContain(
      "70000"
    )
    expect(revalidatePathMock).toHaveBeenCalledWith(`/products/${productId}`)
    expect(revalidatePathMock).toHaveBeenCalledWith("/products")
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard")
  })

  it("does not update or log no-op parent saves", async () => {
    const result = await saveProductReviewAction(
      {},
      productForm({
        brand: "",
        description: "",
        gtin: "",
        heightCm: "",
        lengthCm: "",
        sellingPrice: "",
        sku: "",
        stock: "",
        title: "Existing title",
        weightGrams: "",
        widthCm: "",
      })
    )

    expect(result).toEqual({
      message: "No changes to save.",
      status: "neutral",
    })
    expect(updateReviewProductMock).not.toHaveBeenCalled()
    expect(appendProcessLogMock).not.toHaveBeenCalled()
  })

  it("keeps data success when the review log append fails", async () => {
    appendProcessLogMock.mockResolvedValue({
      ok: false,
      error: "DATABASE_WRITE_FAILED",
    })

    await expect(saveProductReviewAction({}, productForm())).resolves.toEqual({
      message:
        "Changes were saved, but the review activity could not be recorded.",
      status: "warning",
    })
    expect(updateReviewProductMock).toHaveBeenCalled()
    expect(revalidatePathMock).toHaveBeenCalledWith(`/products/${productId}`)
  })

  it.each(["PENDING", "IMPORTING", "FAILED", "READY"])(
    "does not update products in %s state",
    async (status) => {
      getProductReviewMock.mockResolvedValue({
        ok: true,
        product: { ...productReview, status },
      })

      await expect(saveProductReviewAction({}, productForm())).resolves.toEqual({
        message: "Only products that need review can be edited.",
        status: "error",
      })
      expect(updateReviewProductMock).not.toHaveBeenCalled()
    }
  )

  it("returns business-safe read and write failures", async () => {
    getProductReviewMock.mockResolvedValueOnce({
      ok: false,
      error: "PRODUCT_NOT_FOUND",
    })
    await expect(saveProductReviewAction({}, productForm())).resolves.toEqual({
      message: "That product is no longer available.",
      status: "error",
    })

    getProductReviewMock.mockResolvedValue({ ok: true, product: productReview })
    updateReviewProductMock.mockResolvedValue({
      ok: false,
      error: "DATABASE_WRITE_FAILED",
    })
    await expect(saveProductReviewAction({}, productForm())).resolves.toEqual({
      message: "Product changes could not be saved. Please try again.",
      status: "error",
    })
    expect(appendProcessLogMock).not.toHaveBeenCalled()
  })

  it("updates only the requested variant and logs no business values", async () => {
    await expect(saveVariantReviewAction({}, variantForm())).resolves.toEqual({
      message: "Variant review changes saved.",
      status: "success",
    })
    expect(updateReviewVariantMock).toHaveBeenCalledWith(productId, variantId, {
      sellingPrice: 71000,
      sku: "VAR-1",
      stock: 6,
    })
    expect(appendProcessLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        details: {
          changedFields: expect.arrayContaining(["selling_price"]),
          changedVariantCount: 1,
          scope: "variant",
        },
      })
    )
    expect(JSON.stringify(appendProcessLogMock.mock.calls[0][0].details)).not.toMatch(
      /71000|VAR-1|00000000-0000-4000-8000-000000000001/u
    )
  })

  it("rejects a missing variant and handles variant update failure", async () => {
    getProductReviewMock.mockResolvedValueOnce({
      ok: true,
      product: { ...productReview, variants: [] },
    })
    await expect(saveVariantReviewAction({}, variantForm())).resolves.toEqual({
      message: "That variant is no longer available.",
      status: "error",
    })

    getProductReviewMock.mockResolvedValue({ ok: true, product: productReview })
    updateReviewVariantMock.mockResolvedValue({
      ok: false,
      error: "DATABASE_WRITE_FAILED",
    })
    await expect(saveVariantReviewAction({}, variantForm())).resolves.toEqual({
      message: "Variant changes could not be saved. Please try again.",
      status: "error",
    })
  })
})
