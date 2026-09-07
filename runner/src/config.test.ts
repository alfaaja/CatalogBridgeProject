import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadConfig } from "./config.js";

describe("runner configuration", () => {
  it("defaults to dry-run and returns only validated public Supabase values", () => {
    assert.deepEqual(
      loadConfig({
        CATALOGBRIDGE_SUPABASE_PUBLISHABLE_KEY:
          "public-key-long-enough-for-validation",
        CATALOGBRIDGE_SUPABASE_URL: "https://example.supabase.co",
      }),
      {
        dryRun: true,
        publishableKey: "public-key-long-enough-for-validation",
        supabaseUrl: "https://example.supabase.co",
      },
    );
  });

  it("requires an exact explicit false before archive save is enabled", () => {
    assert.equal(
      loadConfig({
        AUTOMATION_DRY_RUN: "false",
        CATALOGBRIDGE_SUPABASE_PUBLISHABLE_KEY:
          "public-key-long-enough-for-validation",
        CATALOGBRIDGE_SUPABASE_URL: "https://example.supabase.co",
      }).dryRun,
      false,
    );
    assert.throws(() => loadConfig({}), /Invalid runner configuration/u);
  });
});
