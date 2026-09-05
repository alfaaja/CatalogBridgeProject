import { beforeEach, describe, expect, it, vi } from "vitest"

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}))

vi.mock("./server", () => ({
  createClient: createClientMock,
}))

import {
  getProductReview,
  PRODUCT_REVIEW_LOG_SELECT,
  PRODUCT_REVIEW_PRODUCT_SELECT,
  PRODUCT_REVIEW_VARIANT_SELECT,
  updateReviewProduct,
  updateReviewVariant,
} from "./product-review-repository"

const productId = "00000000-0000-4000-8000-000000000000"
const variantId = "00000000-0000-4000-8000-000000000001"

describe("product review repository", () => {
  beforeEach(() => {
    createClientMock.mockReset()
  })

  it("treats invalid UUID as not found before creating a database client", async () => {
    await expect(getProductReview("not-a-uuid")).resolves.toEqual({
      ok: false,
      error: "PRODUCT_NOT_FOUND",
    })
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it("loads explicit product, ordered image, ordered variant, and bounded log fields", async () => {
    const productMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: productId,
        attributes: { color: "black" },
        brand: "JEP",
        canonical_source_url: "https://www.jakmall.com/jep/product",
        created_at: "2026-09-04T23:00:00+07:00",
        currency_code: "IDR",
        description: "Description",
        error_code: null,
        error_message: null,
        gtin: null,
        height_cm: null,
        length_cm: null,
        raw_source_data: { warnings: ["OFFER_OPTIONS_UNMAPPED"] },
        selling_price: null,
        sku: null,
        source_category: "Tools",
        source_platform: "jakmall",
        source_price: 64600,
        source_product_identifier: "JEP-001",
        status: "REVIEW_REQUIRED",
        stock: null,
        title: "JEP Tang Pisau Lipat",
        updated_at: "2026-09-05T00:00:00+07:00",
        variant_axes: [],
        weight_grams: null,
        width_cm: null,
      },
      error: null,
    })
    const productEq = vi.fn(() => ({ maybeSingle: productMaybeSingle }))
    const imageOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: "00000000-0000-4000-8000-000000000002",
          is_primary: true,
          kind: "product",
          position: 0,
          source_url: "https://static.jakmall.id/products/jep.jpg",
        },
      ],
      error: null,
    })
    const imageEq = vi.fn(() => ({ order: imageOrder }))
    const variantOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: variantId,
          image_source_url: null,
          option_values: {},
          position: 0,
          product_id: productId,
          selling_price: null,
          sku: null,
          source_price: 64600,
          source_variant_identifier: "JEP-001",
          stock: null,
          updated_at: "2026-09-05T00:00:00+07:00",
        },
      ],
      error: null,
    })
    const variantEq = vi.fn(() => ({ order: variantOrder }))
    const logLimit = vi.fn().mockResolvedValue({
      data: [
        {
          id: "00000000-0000-4000-8000-000000000003",
          created_at: "2026-09-05T00:00:00+07:00",
          details: { changedFields: ["selling_price"] },
          message: "Product review changes saved.",
          stage: "review",
          status: "success",
        },
      ],
      error: null,
    })
    const logOrder = vi.fn(() => ({ limit: logLimit }))
    const logEq = vi.fn(() => ({ order: logOrder }))
    const from = vi.fn((table: string) => {
      if (table === "products") {
        return { select: vi.fn(() => ({ eq: productEq })) }
      }

      if (table === "product_images") {
        return { select: vi.fn(() => ({ eq: imageEq })) }
      }

      if (table === "product_variants") {
        return { select: vi.fn(() => ({ eq: variantEq })) }
      }

      return { select: vi.fn(() => ({ eq: logEq })) }
    })
    createClientMock.mockResolvedValue({ from })

    const result = await getProductReview(productId)

    expect(result).toMatchObject({
      ok: true,
      product: {
        id: productId,
        images: [{ position: 0 }],
        source: { price: 64600 },
        variants: [{ id: variantId, sourcePrice: 64600 }],
      },
    })
    expect(from).toHaveBeenCalledWith("products")
    expect(from).toHaveBeenCalledWith("product_images")
    expect(from).toHaveBeenCalledWith("product_variants")
    expect(from).toHaveBeenCalledWith("process_logs")
    expect(productEq).toHaveBeenCalledWith("id", productId)
    expect(imageOrder).toHaveBeenCalledWith("position", { ascending: true })
    expect(variantOrder).toHaveBeenCalledWith("position", { ascending: true })
    expect(logOrder).toHaveBeenCalledWith("created_at", { ascending: false })
    expect(logLimit).toHaveBeenCalledWith(8)
    expect(PRODUCT_REVIEW_PRODUCT_SELECT).not.toContain("*")
    expect(PRODUCT_REVIEW_VARIANT_SELECT).not.toContain("*")
    expect(PRODUCT_REVIEW_LOG_SELECT).not.toContain("*")
  })

  it("uses not-found for missing or RLS-hidden products", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eq = vi.fn(() => ({ maybeSingle }))
    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({ select: vi.fn(() => ({ eq })) })),
    })

    await expect(getProductReview(productId)).resolves.toEqual({
      ok: false,
      error: "PRODUCT_NOT_FOUND",
    })
  })

  it("does not return malformed database rows", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: productId, status: "REVIEW_REQUIRED" },
      error: null,
    })
    const eq = vi.fn(() => ({ maybeSingle }))
    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({ select: vi.fn(() => ({ eq })) })),
    })

    await expect(getProductReview(productId)).resolves.toEqual({
      ok: false,
      error: "DATABASE_READ_FAILED",
    })
  })

  it("rejects untrusted canonical product URLs before they can be rendered", async () => {
    const productMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: productId,
        attributes: {},
        brand: null,
        canonical_source_url: "javascript:alert(1)",
        created_at: "2026-09-04T23:00:00+07:00",
        currency_code: "IDR",
        description: null,
        error_code: null,
        error_message: null,
        gtin: null,
        height_cm: null,
        length_cm: null,
        raw_source_data: {},
        selling_price: null,
        sku: null,
        source_category: null,
        source_platform: "jakmall",
        source_price: null,
        source_product_identifier: null,
        status: "REVIEW_REQUIRED",
        stock: null,
        title: "Unsafe product",
        updated_at: "2026-09-05T00:00:00+07:00",
        variant_axes: [],
        weight_grams: null,
        width_cm: null,
      },
      error: null,
    })
    const productEq = vi.fn(() => ({ maybeSingle: productMaybeSingle }))
    createClientMock.mockResolvedValue({
      from: vi.fn(() => ({ select: vi.fn(() => ({ eq: productEq })) })),
    })

    await expect(getProductReview(productId)).resolves.toEqual({
      ok: false,
      error: "DATABASE_READ_FAILED",
    })
  })

  it("updates only explicit editable parent review fields", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: productId }, error: null })
    const select = vi.fn(() => ({ single }))
    const eqStatus = vi.fn(() => ({ select }))
    const eqId = vi.fn(() => ({ eq: eqStatus }))
    const update = vi.fn<(payload: unknown) => { eq: typeof eqId }>(() => ({
      eq: eqId,
    }))
    createClientMock.mockResolvedValue({ from: vi.fn(() => ({ update })) })

    await expect(
      updateReviewProduct(productId, {
        brand: "JEP",
        description: null,
        gtin: null,
        heightCm: null,
        lengthCm: 12,
        sellingPrice: 70000,
        sku: "SKU-1",
        stock: 5,
        title: "Updated",
        weightGrams: 450,
        widthCm: null,
      })
    ).resolves.toEqual({ ok: true })

    expect(update).toHaveBeenCalledWith({
      brand: "JEP",
      description: null,
      gtin: null,
      height_cm: null,
      length_cm: 12,
      selling_price: 70000,
      sku: "SKU-1",
      stock: 5,
      title: "Updated",
      weight_grams: 450,
      width_cm: null,
    })
    expect(update.mock.calls[0]?.[0]).not.toHaveProperty("source_price")
    expect(update.mock.calls[0]?.[0]).not.toHaveProperty("raw_source_data")
    expect(eqId).toHaveBeenCalledWith("id", productId)
    expect(eqStatus).toHaveBeenCalledWith("status", "REVIEW_REQUIRED")
  })

  it("updates only editable variant review fields", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: variantId }, error: null })
    const select = vi.fn(() => ({ single }))
    const eqVariant = vi.fn(() => ({ select }))
    const eqProduct = vi.fn(() => ({ eq: eqVariant }))
    const update = vi.fn<
      (payload: unknown) => { eq: typeof eqProduct }
    >(() => ({ eq: eqProduct }))
    createClientMock.mockResolvedValue({ from: vi.fn(() => ({ update })) })

    await expect(
      updateReviewVariant(productId, variantId, {
        sellingPrice: 71000,
        sku: "VAR-1",
        stock: 6,
      })
    ).resolves.toEqual({ ok: true })

    expect(update).toHaveBeenCalledWith({
      selling_price: 71000,
      sku: "VAR-1",
      stock: 6,
    })
    expect(update.mock.calls[0]?.[0]).not.toHaveProperty("source_price")
    expect(update.mock.calls[0]?.[0]).not.toHaveProperty("option_values")
    expect(eqProduct).toHaveBeenCalledWith("product_id", productId)
    expect(eqVariant).toHaveBeenCalledWith("id", variantId)
  })
})
