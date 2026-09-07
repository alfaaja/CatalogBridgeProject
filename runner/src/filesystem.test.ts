import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

import { acquireRunnerLock } from "./filesystem.js";

describe("runner process lock", () => {
  it("allows one local runner and releases cleanly", async () => {
    const root = await mkdtemp(join(tmpdir(), "catalogbridge-lock-test-"));
    try {
      const release = await acquireRunnerLock(root);
      await assert.rejects(acquireRunnerLock(root), /already running/iu);
      await release();
      const releaseAgain = await acquireRunnerLock(root);
      await releaseAgain();
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
