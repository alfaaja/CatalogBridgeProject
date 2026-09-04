import { beforeEach, describe, expect, it, vi } from "vitest"

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}))

vi.mock("./server", () => ({
  createClient: createClientMock,
}))

import {
  createPendingProduct,
  listProductSummaries,
  markProductImportFailed,
  markProductImporting,
  saveImportedProduct,
} from "./product-repository"

describe("product persistence repository", () => {
  beforeEach(() => {
    createClientMock.mockReset()
  })

  it("creates a pending JakMall product without caller-controlled ownership", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: "00000000-0000-4000-8000-000000000000" },
      error: null,
    })
    const select = vi.fn(() => ({ single }))
    const insert = vi.fn<(payload: unknown) => { select: typeof select }>(() => ({
      select,
    }))
    const from = vi.fn(() => ({ insert }))
    createClientMock.mockResolvedValue({ from })

    const result = await createPendingProduct({
      canonicalSourceUrl: "https://www.jakmall.com/example-product",
      sourceProductIdentifier: null,
      title: null,
    })

    expect(result).toEqual({
      ok: true,
      productId: "00000000-0000-4000-8000-000000000000",
    })
    expect(from).toHaveBeenCalledWith("products")
    expect(insert).toHaveBeenCalledWith({
      canonical_source_url: "https://www.jakmall.com/example-product",
      source_platform: "jakmall",
      source_product_identifier: null,
      status: "PENDING",
      title: null,
    })
    expect(insert.mock.calls[0]?.[0]).not.toHaveProperty("owner_id")
  })

  it("maps duplicate product errors without exposing provider details", async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: {
        code: "23505",
        message: "duplicate key value contains sensitive database details",
      },
    })
    const select = vi.fn(() => ({ single }))
    const insert = vi.fn(() => ({ select }))
    createClientMock.mockResolvedValue({ from: () => ({ insert }) })

    const result = await createPendingProduct({
      canonicalSourceUrl: "https://www.jakmall.com/example-product",
      sourceProductIdentifier: null,
      title: null,
    })

    expect(result).toEqual({
      ok: false,
      error: "IMPORT_DUPLICATE_PRODUCT",
    })
    expect(JSON.stringify(result)).not.toContain("sensitive database details")
  })

  it("does not report success when an owned product row was not updated", async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "No rows returned" },
    })
    const select = vi.fn(() => ({ single }))
    const eq = vi.fn(() => ({ select }))
    const update = vi.fn(() => ({ eq }))
    createClientMock.mockResolvedValue({ from: () => ({ update }) })

    const result = await markProductImporting(
      "00000000-0000-4000-8000-000000000000"
    )

    expect(result).toEqual({ ok: false, error: "DATABASE_WRITE_FAILED" })
    expect(eq).toHaveBeenCalledWith(
      "id",
      "00000000-0000-4000-8000-000000000000"
    )
  })

  it("rejects unsafe failure details before creating a database client", async () => {
    const result = await markProductImportFailed({
      productId: "00000000-0000-4000-8000-000000000000",
      errorCode: "SOURCE_FETCH_FAILED",
      errorMessage: "Set-Cookie: session=private",
    })

    expect(result).toEqual({ ok: false, error: "INVALID_PRODUCT_INPUT" })
    expect(createClientMock).not.toHaveBeenCalled()
  })

  it("writes normalized import fields with explicit names", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: "00000000-0000-4000-8000-000000000000" },
      error: null,
    })
    const select = vi.fn(() => ({ single }))
    const eq = vi.fn(() => ({ select }))
    const update = vi.fn<(payload: unknown) => { eq: typeof eq }>(() => ({
      eq,
    }))
    createClientMock.mockResolvedValue({ from: () => ({ update }) })

    const result = await saveImportedProduct(
      "00000000-0000-4000-8000-000000000000",
      {
        title: null,
        description: "Description",
        sourcePrice: 125000,
        sellingPrice: 140000,
        sku: "SKU-001",
        gtin: "08912345678901",
        stock: 2,
        sourceCategory: "Accessories",
        brand: null,
        weightGrams: 500,
        lengthCm: 10,
        widthCm: 8,
        heightCm: 2.5,
        attributes: { material: "steel" },
        variantAxes: [],
        rawSourceData: { product: { id: "source-1" } },
        status: "REVIEW_REQUIRED",
      }
    )

    expect(result).toEqual({ ok: true })
    expect(eq).toHaveBeenCalledWith(
      "id",
      "00000000-0000-4000-8000-000000000000"
    )
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        gtin: "08912345678901",
        sku: "SKU-001",
        source_price: 125000,
        status: "REVIEW_REQUIRED",
        title: null,
      })
    )
    expect(update.mock.calls[0]?.[0]).not.toHaveProperty("owner_id")
  })

  it("lists only explicit product summary fields in stable order", async () => {
    const finalOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: "00000000-0000-4000-8000-000000000000",
          selling_price: 140000,
          source_price: 125000,
          status: "READY",
          title: "Example product",
          updated_at: "2026-09-04T19:00:00+07:00",
        },
      ],
      error: null,
    })
    const firstOrder = vi.fn(() => ({ order: finalOrder }))
    const select = vi.fn(() => ({ order: firstOrder }))
    const from = vi.fn(() => ({ select }))
    createClientMock.mockResolvedValue({ from })

    const result = await listProductSummaries()

    expect(result).toEqual({
      ok: true,
      products: [
        {
          id: "00000000-0000-4000-8000-000000000000",
          sellingPrice: 140000,
          sourcePrice: 125000,
          status: "READY",
          title: "Example product",
          updatedAt: "2026-09-04T19:00:00+07:00",
        },
      ],
    })
    expect(from).toHaveBeenCalledWith("products")
    expect(select).toHaveBeenCalledWith(
      "id,title,status,source_price,selling_price,updated_at"
    )
    expect(firstOrder).toHaveBeenCalledWith("updated_at", {
      ascending: false,
    })
    expect(finalOrder).toHaveBeenCalledWith("id", { ascending: true })
  })
})
