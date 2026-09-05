import { readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"

import { load } from "cheerio"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { getProductReviewMock, listProductSummariesMock, notFoundMock } =
  vi.hoisted(() => ({
    getProductReviewMock: vi.fn(),
    listProductSummariesMock: vi.fn(),
    notFoundMock: vi.fn(),
  }))

function listTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      return listTsxFiles(path)
    }

    return entry.name.endsWith(".tsx") ? [path] : []
  })
}

vi.mock("@/lib/supabase/product-repository", () => ({
  listProductSummaries: listProductSummariesMock,
}))
vi.mock("@/lib/supabase/product-review-repository", () => ({
  getProductReview: getProductReviewMock,
}))
vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}))

import DashboardPage from "./page"
import ImportProductPage from "./import/page"
import ProductReviewPage from "./products/[id]/page"
import ProductsPage from "./products/page"

describe("Milestone 2 application pages", () => {
  beforeEach(() => {
    getProductReviewMock.mockReset()
    listProductSummariesMock.mockReset()
    notFoundMock.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND")
    })
  })

  it("renders legitimate zero metrics and an empty state", async () => {
    listProductSummariesMock.mockResolvedValue({ ok: true, products: [] })

    const $ = load(
      renderToStaticMarkup(
        await DashboardPage({
          searchParams: Promise.resolve({}),
        })
      )
    )

    expect($("h1").text()).toBe("Dashboard")
    expect($('dl[aria-label="Product summary"] dd')).toHaveLength(4)
    expect($('dl[aria-label="Product summary"] dd').text()).toBe("0000")
    expect(
      $("h2").filter((_, element) => $(element).text() === "No products yet")
    ).toHaveLength(1)
  })

  it("shows a business error instead of zero products after a read failure", async () => {
    listProductSummariesMock.mockResolvedValue({
      ok: false,
      error: "DATABASE_READ_FAILED",
    })

    const $ = load(renderToStaticMarkup(await ProductsPage()))

    expect($("[role=alert]").text()).toContain("Products could not be loaded")
    expect($("body").text()).not.toContain("0 products")
  })

  it("renders the active single-product import form", () => {
    const $ = load(renderToStaticMarkup(<ImportProductPage />))

    expect($('label[for="jakmall-url"]').text()).toBe("Product URL")
    expect($('input[name="jakmallUrl"]').is("[required]")).toBe(true)
    expect($('input[name="assistedHtml"][type="file"]')).toHaveLength(1)
    expect($("button[type=submit]").text()).toContain("Import Product")
    expect($("body").text()).not.toContain("Import is not active yet")
  })

  it("names the keyboard-focusable product table scroll region", async () => {
    listProductSummariesMock.mockResolvedValue({
      ok: true,
      products: [
        {
          id: "00000000-0000-0000-0000-000000000001",
          title: "Real product",
          sourcePrice: 10000,
          sellingPrice: 12000,
          status: "PENDING",
          updatedAt: "2026-09-05T00:00:00.000Z",
        },
      ],
    })

    const $ = load(renderToStaticMarkup(await ProductsPage()))
    const tableRegion = $('[role="region"][aria-label="Product catalog"]')

    expect(tableRegion.attr("tabindex")).toBe("0")
    expect(tableRegion.find("table")).toHaveLength(1)
    expect($('a[href="/products/00000000-0000-0000-0000-000000000001"]').text()).toContain(
      "View Product"
    )
  })

  it("renders the product review route from persisted data", async () => {
    getProductReviewMock.mockResolvedValue({
      ok: true,
      product: {
        attributes: {},
        brand: null,
        createdAt: "2026-09-05T00:00:00+07:00",
        description: null,
        dimensionsCm: { height: null, length: null, width: null },
        failure: null,
        gtin: null,
        id: "00000000-0000-4000-8000-000000000000",
        images: [],
        logs: [],
        rawSourceData: {},
        sellingPrice: null,
        sku: null,
        source: {
          canonicalUrl: "https://www.jakmall.com/jep/product",
          category: null,
          platform: "jakmall",
          price: 64600,
          productIdentifier: "JEP-001",
        },
        status: "REVIEW_REQUIRED",
        stock: null,
        title: "JEP Tang Pisau Lipat",
        updatedAt: "2026-09-05T00:00:00+07:00",
        variantAxes: [],
        variants: [],
        weightGrams: null,
      },
    })

    const $ = load(
      renderToStaticMarkup(
        await ProductReviewPage({
          params: Promise.resolve({
            id: "00000000-0000-4000-8000-000000000000",
          }),
        })
      )
    )

    expect($("h1").text()).toContain("JEP Tang Pisau Lipat")
    expect($("body").text()).toContain("Product information")
    expect($("body").text()).not.toContain("Prepare for Shopee")
  })

  it("uses not-found for invalid, missing, or RLS-hidden product routes", async () => {
    getProductReviewMock.mockResolvedValue({
      ok: false,
      error: "PRODUCT_NOT_FOUND",
    })

    await expect(
      ProductReviewPage({
        params: Promise.resolve({
          id: "00000000-0000-4000-8000-000000000000",
        }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND")
  })

  it("does not render navigation links through Base UI Button", () => {
    const sourceDirectory = resolve(process.cwd(), "src")
    const offenders = listTsxFiles(sourceDirectory).filter((file) => {
      const source = readFileSync(file, "utf8")

      return /<Button\b[^>]*\brender=\{\s*<(?:Link|a)\b/.test(source)
    })

    expect(offenders).toEqual([])
  })
})
