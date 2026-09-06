import { load } from "cheerio"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import LoginPage from "./login/page"
import LandingPage from "./page"

describe("public CatalogBridge pages", () => {
  it("renders a truthful landing page with registration and sign-in paths", () => {
    const $ = load(renderToStaticMarkup(<LandingPage />))
    const text = $("body").text()

    expect($("h1").text()).toContain(
      "Turn JakMall products into review-ready Shopee listings."
    )
    expect($('a[href="/register"]').first().text()).toContain("Get Started")
    expect($('a[href="/login"]').first().text()).toContain("Sign In")
    expect(text).toContain("Import from JakMall")
    expect(text).toContain("Review before listing")
    expect(text).toContain("Prepare for Shopee")
    expect(text).not.toMatch(
      /automatic Shopee upload|one-click publishing|official Shopee integration|guaranteed scraping|synchronization/iu
    )
  })

  it("links existing users from login to registration", async () => {
    const $ = load(
      renderToStaticMarkup(
        await LoginPage({ searchParams: Promise.resolve({}) })
      )
    )

    expect($('a[href="/register"]').text()).toContain("Create one")
    expect($("form")).toHaveLength(1)
  })
})
