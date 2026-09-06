import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const milestoneDocuments = [
  "README.md",
  "docs/12-SHOPEE-INTEGRATION.md",
  "docs/24-IMPLEMENTATION-PLAN.md",
  "docs/26-KNOWN-LIMITATIONS.md",
  "docs/27-DECISIONS.md",
];

const documentation = milestoneDocuments
  .map((file) => readFileSync(resolve(process.cwd(), file), "utf8"))
  .join("\n");

describe("Milestone 6 evidence documentation", () => {
  it("records the observed archived outcome without the old save assumption", () => {
    expect(documentation).not.toMatch(/non-publishing (?:action|save)/iu);
    expect(documentation).toMatch(/accepted the product/iu);
    expect(documentation).toMatch(/briefly appeared Live/iu);
    expect(documentation).toMatch(/immediately archived/iu);
    expect(documentation).toMatch(/Belum Ditampilkan[^\n]*Diarsipkan/iu);
  });
});
