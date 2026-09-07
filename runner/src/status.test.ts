import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canTransition } from "./status.js";

describe("upload job status transitions", () => {
  it("allows the intended single-runner lifecycle", () => {
    assert.equal(canTransition("QUEUED", "WAITING_FOR_RUNNER"), true);
    assert.equal(canTransition("WAITING_FOR_RUNNER", "AUTH_REQUIRED"), true);
    assert.equal(canTransition("AUTH_REQUIRED", "RUNNING"), true);
    assert.equal(canTransition("RUNNING", "SAVED_ARCHIVED"), true);
  });

  it("never models publishing and keeps terminal states terminal", () => {
    assert.equal(canTransition("SAVED_ARCHIVED", "RUNNING"), false);
    assert.equal(canTransition("FAILED", "RUNNING"), false);
  });
});
