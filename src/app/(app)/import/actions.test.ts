import { beforeEach, describe, expect, it, vi } from "vitest"

import { importJakMallProduct } from "@/lib/import/import-product"
import { createClient } from "@/lib/supabase/server"

import { importProductAction } from "./actions"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/import/import-product", () => ({ importJakMallProduct: vi.fn() }))
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))

const mockedImport = vi.mocked(importJakMallProduct)
const mockedCreateClient = vi.mocked(createClient)

beforeEach(() => {
  vi.clearAllMocks()
  mockedCreateClient.mockResolvedValue({
    auth: {
      getClaims: vi.fn().mockResolvedValue({
        data: { claims: { sub: "reviewer" } },
        error: null,
      }),
    },
  } as never)
  mockedImport.mockResolvedValue({ ok: true, productId: "product-id" })
})

describe("import product action", () => {
  it("authenticates before reading or importing an upload", async () => {
    mockedCreateClient.mockResolvedValue({
      auth: {
        getClaims: vi.fn().mockResolvedValue({ data: null, error: new Error() }),
      },
    } as never)
    const formData = new FormData()
    formData.set("jakmallUrl", "https://www.jakmall.com/store/product")
    formData.set("assistedHtml", new File(["<html></html>"], "product.html"))

    await expect(importProductAction({}, formData)).resolves.toEqual({
      error: "Please sign in again before importing a product.",
    })
    expect(mockedImport).not.toHaveBeenCalled()
  })

  it("passes one validated assisted document and skips live mode", async () => {
    const html = "<!doctype html><html><body>Product</body></html>"
    const formData = new FormData()
    formData.set("jakmallUrl", "https://www.jakmall.com/store/product")
    formData.set("assistedHtml", new File([html], "product.html"))

    await expect(importProductAction({}, formData)).resolves.toMatchObject({
      productId: "product-id",
    })
    expect(mockedImport).toHaveBeenCalledWith({
      acquisitionMode: "assisted_html",
      assistedHtml: html,
      assistedHtmlByteLength: Buffer.byteLength(html),
      sourceUrl: "https://www.jakmall.com/store/product",
    })
  })

  it("rejects multiple upload entries before orchestration", async () => {
    const formData = new FormData()
    formData.set("jakmallUrl", "https://www.jakmall.com/store/product")
    formData.append("assistedHtml", new File(["<html></html>"], "one.html"))
    formData.append("assistedHtml", new File(["<html></html>"], "two.html"))

    await expect(importProductAction({}, formData)).resolves.toEqual({
      error: "That file does not look like the selected JakMall product page.",
    })
    expect(mockedImport).not.toHaveBeenCalled()
  })

  it("does not expose an unexpected import exception", async () => {
    mockedImport.mockRejectedValue(new Error("raw Supabase exception"))
    const formData = new FormData()
    formData.set("jakmallUrl", "https://www.jakmall.com/store/product")

    await expect(importProductAction({}, formData)).resolves.toEqual({
      error:
        "The product could not be saved. Please retry after checking the Supabase connection.",
    })
  })
})
