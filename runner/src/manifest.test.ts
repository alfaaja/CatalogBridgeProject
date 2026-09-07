import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseManifest } from "./manifest.js";
import { baseManifest } from "./test-fixtures.js";

describe("runner manifest", () => {
  it("accepts the strict allowlisted web contract", () => {
    assert.equal(parseManifest(baseManifest).title, "Glass Bottle");
  });

  it("rejects raw source data, credentials, and untrusted images", () => {
    assert.throws(() => parseManifest({ ...baseManifest, rawSourceData: {} }));
    assert.throws(() =>
      parseManifest({
        ...baseManifest,
        images: [
          { ...baseManifest.images[0], url: "https://example.com/a.jpg" },
        ],
      }),
    );
  });
});
