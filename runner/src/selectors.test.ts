import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { clickSaveAndArchive } from "./selectors.js";

describe("Seller Centre save guard", () => {
  it("targets only the exact Simpan & Arsipkan button", async () => {
    const calls: string[] = [];
    await clickSaveAndArchive(
      {
        getByRole: (_role, options) => {
          calls.push(options.name);
          return { click: async () => undefined, count: async () => 1 };
        },
      },
      false,
    );
    assert.deepEqual(calls, ["Simpan & Arsipkan"]);
  });

  it("never clicks in dry-run and fails closed on a missing or duplicate control", async () => {
    let clicks = 0;
    const page = {
      getByRole: () => ({
        click: async () => {
          clicks += 1;
        },
        count: async () => 1,
      }),
    };
    await clickSaveAndArchive(page, true);
    assert.equal(clicks, 0);

    await assert.rejects(
      clickSaveAndArchive(
        {
          getByRole: () => ({
            click: async () => undefined,
            count: async () => 0,
          }),
        },
        false,
      ),
      (error: unknown) =>
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "SAVE_ARCHIVE_BUTTON_NOT_FOUND",
    );
  });
});
