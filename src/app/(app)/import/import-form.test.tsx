import { load } from "cheerio";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ImportProductForm } from "./import-form";

describe("Import product form", () => {
  it("starts with only the direct URL import controls", () => {
    const $ = load(renderToStaticMarkup(<ImportProductForm />));

    expect($("form")).toHaveLength(1);
    expect($('input[name="jakmallUrl"][type="url"]').is("[required]")).toBe(
      true,
    );
    expect($('input[name="assistedHtml"]')).toHaveLength(0);
    expect($("body").text()).toContain(
      "Paste a public JakMall product URL. CatalogBridge will try to import it directly.",
    );
    expect($("button[type=submit]").text()).toContain("Import Product");
  });

  it("reveals a business-friendly assisted state only after browser verification", () => {
    const sourceUrl = "https://www.jakmall.com/store/product";
    const $ = load(
      renderToStaticMarkup(
        <ImportProductForm
          initialState={{ recovery: "browser_verification", sourceUrl }}
        />,
      ),
    );

    expect($("body").text()).toContain("JakMall requires browser verification");
    expect($("body").text()).toContain("Open the same JakMall product page.");
    expect($('input[name="jakmallUrl"]').attr("value")).toBe(sourceUrl);
    expect($('input[name="assistedHtml"][type="file"]').attr("accept")).toBe(
      ".html,.htm,text/html,application/xhtml+xml",
    );
    expect($("button[type=submit]").text()).toContain("Continue Import");
    const controls = $('input[name="assistedHtml"], button[type=submit]')
      .toArray()
      .map((element) => ($(element).is("input") ? "file" : "submit"));
    expect(controls).toEqual(["file", "submit"]);
    expect($("body").text()).not.toMatch(/AWS|WAF|cookie|token|CAPTCHA/iu);
  });

  it.each([
    { error: "Enter a valid public JakMall product URL." },
    { success: "Product imported and marked for review." },
  ])("does not reveal assisted HTML for ordinary state %#", (initialState) => {
    const $ = load(
      renderToStaticMarkup(<ImportProductForm initialState={initialState} />),
    );

    expect($('input[name="assistedHtml"]')).toHaveLength(0);
  });
});
