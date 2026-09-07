import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Page } from "playwright";

import { parseManifest } from "./manifest.js";
import { fillVerifiedSellerCentreListing } from "./seller-centre.js";
import { baseManifest } from "./test-fixtures.js";

describe("Seller Centre evidence gate", () => {
  it("stops before field interaction while authenticated controls are unverified", async () => {
    await assert.rejects(
      fillVerifiedSellerCentreListing({} as Page, parseManifest(baseManifest)),
      (error: unknown) =>
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "SELLER_FORM_NOT_VERIFIED",
    );
  });
});
