import { describe, expect, it } from "vitest"

import {
  ASSISTED_HTML_MAX_BYTES,
  readOptionalAssistedHtmlUpload,
} from "./html-upload"

function htmlFile(content: BlobPart, name = "product.html", type = "text/html") {
  return new File([content], name, { type })
}

describe("assisted HTML upload validation", () => {
  it("treats a missing browser upload as absent", async () => {
    await expect(readOptionalAssistedHtmlUpload([])).resolves.toEqual({
      ok: true,
      file: null,
    })
    await expect(
      readOptionalAssistedHtmlUpload([htmlFile("", "")])
    ).resolves.toEqual({ ok: true, file: null })
  })

  it("accepts one HTML-ish file without trusting its MIME type", async () => {
    const html = "<!doctype html><html><head></head><body></body></html>"

    await expect(
      readOptionalAssistedHtmlUpload([
        htmlFile(html, "product.htm", "application/octet-stream"),
      ])
    ).resolves.toEqual({
      ok: true,
      file: { byteLength: Buffer.byteLength(html), html },
    })
  })

  it.each([
    { name: "multiple", files: [htmlFile("<html></html>"), htmlFile("<html></html>")] },
    { name: "string entry", files: ["<html></html>"] },
    { name: "empty named file", files: [htmlFile("")] },
    { name: "wrong extension", files: [htmlFile("<html></html>", "product.txt")] },
    { name: "not HTML-ish", files: [htmlFile("ordinary plain text")] },
    { name: "NUL-bearing", files: [htmlFile("<html>\u0000</html>")] },
    {
      name: "oversized",
      files: [htmlFile(new Uint8Array(ASSISTED_HTML_MAX_BYTES + 1))],
    },
  ])("rejects a $name upload", async ({ files }) => {
    await expect(
      readOptionalAssistedHtmlUpload(files as FormDataEntryValue[])
    ).resolves.toEqual({ ok: false, error: "ASSISTED_HTML_INVALID" })
  })
})
