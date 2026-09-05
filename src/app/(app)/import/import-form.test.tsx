import { load } from "cheerio"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ImportProductForm } from "./import-form"

describe("Import product form", () => {
  it("keeps assisted HTML upload secondary but available", () => {
    const $ = load(renderToStaticMarkup(<ImportProductForm />))

    expect($("form")).toHaveLength(1)
    expect($('input[name="jakmallUrl"][type="url"]').is("[required]")).toBe(true)
    expect($('input[name="assistedHtml"][type="file"]').attr("accept")).toBe(
      ".html,.htm,text/html,application/xhtml+xml"
    )
    expect($("body").text()).toContain(
      "JakMall may require browser verification for automated requests."
    )
    expect($("button[type=submit]").text()).toContain("Import Product")
  })
})
