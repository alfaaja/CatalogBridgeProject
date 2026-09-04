import { readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"

import { load } from "cheerio"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { listProductSummariesMock } = vi.hoisted(() => ({
  listProductSummariesMock: vi.fn(),
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

import DashboardPage from "./page"
import ImportProductPage from "./import/page"
import ProductsPage from "./products/page"

describe("Milestone 2 application pages", () => {
  beforeEach(() => {
    listProductSummariesMock.mockReset()
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

  it("makes the unavailable import action explicit", () => {
    const $ = load(renderToStaticMarkup(<ImportProductPage />))

    expect($('label[for="jakmall-url"]').text()).toBe("Product URL")
    expect($("button[disabled]").text()).toContain("Import Product")
    expect($("[role=note]").text()).toContain("Import is not active yet")
    expect($("[role=alert]")).toHaveLength(0)
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
