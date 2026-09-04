import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

const globalsCss = readFileSync(
  resolve(process.cwd(), "src/app/globals.css"),
  "utf8"
)

describe("application typography contract", () => {
  it("maps the sans theme token to the Geist Sans variable", () => {
    expect(globalsCss).toContain("--font-sans: var(--font-geist-sans);")
    expect(globalsCss).not.toContain("--font-sans: var(--font-sans);")
  })
})
