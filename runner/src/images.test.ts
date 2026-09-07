import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { describe, it } from "node:test";

import { downloadTrustedImages, validateImageUrl } from "./images.js";

describe("trusted image lifecycle", () => {
  it("accepts only exact trusted HTTPS image URLs", () => {
    assert.equal(validateImageUrl("https://static.jakmall.id/a.jpg"), true);
    assert.equal(validateImageUrl("http://static.jakmall.id/a.jpg"), false);
    assert.equal(
      validateImageUrl("https://static.jakmall.id.evil.test/a.jpg"),
      false,
    );
    assert.equal(
      validateImageUrl("https://user@static.jakmall.id/a.jpg"),
      false,
    );
  });

  it("writes validated image bytes to an OS temp directory and removes them", async () => {
    const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xdb, 0x00]);
    const bundle = await downloadTrustedImages(
      ["https://static.jakmall.id/a.jpg"],
      async () =>
        new Response(jpeg, {
          headers: {
            "content-length": String(jpeg.length),
            "content-type": "image/jpeg",
          },
          status: 200,
        }),
      async () => ["93.184.216.34"],
    );
    await access(bundle.paths[0]!);
    await bundle.cleanup();
    await assert.rejects(access(bundle.paths[0]!));
  });
});
