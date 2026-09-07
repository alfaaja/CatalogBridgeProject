import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseManifest } from "./manifest.js";
import {
  assertShippingReady,
  buildListingPlan,
  findExactCategoryPath,
  validateVariationAssociation,
} from "./planner.js";
import { baseManifest } from "./test-fixtures.js";

describe("listing planner", () => {
  it("plans a base listing and preserves the unavailable-GTIN decision", () => {
    const plan = buildListingPlan(parseManifest(baseManifest));
    assert.equal(plan.kind, "BASE_LISTING");
    assert.deepEqual(plan.gtin, { mode: "NOT_AVAILABLE" });
    assert.equal(plan.price, 35_000);
    assert.equal(plan.stock, 5);
    assert.equal(plan.sku, "SKU-1");
  });

  it("selects category paths only by normalized exact match", () => {
    assert.equal(
      findExactCategoryPath("Home > Drinkware", [
        "Home > Kitchen",
        " Home  >  Drinkware ",
      ]),
      " Home  >  Drinkware ",
    );
    assert.equal(
      findExactCategoryPath("Home > Drinkware", ["Home > Drinkware Sets"]),
      null,
    );
  });

  it("rejects ambiguous variation rows instead of using DOM order", () => {
    assert.equal(
      validateVariationAssociation(
        [{ Color: "Blue" }, { Color: "Red" }],
        [{ Color: "Blue" }, { Color: "Blue" }],
      ),
      false,
    );
  });

  it("stops when account-side shipping cannot support an archive save", () => {
    assert.doesNotThrow(() => assertShippingReady(1, false));
    assert.throws(
      () => assertShippingReady(0, true),
      (error: unknown) =>
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "SHIPPING_CONFIGURATION_REQUIRED",
    );
  });
});
