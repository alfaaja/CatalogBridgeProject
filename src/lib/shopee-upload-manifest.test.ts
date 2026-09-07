import { describe, expect, it } from "vitest";

import type { ProductReview } from "./product-review";
import type { ShopeeHandoffManifest } from "./shopee-handoff";
import {
  buildShopeeUploadManifest,
  parseShopeeUploadManifest,
} from "./shopee-upload-manifest";

const productId = "11111111-1111-4111-8111-111111111111";
const fingerprint = "a".repeat(64);
const readyRevision = "2026-09-07T00:00:00.000Z";

const handoff: ShopeeHandoffManifest = {
  attributes: [{ name: "Material", value: "Glass" }],
  brand: "RUMAUMA",
  category: { id: null, path: "Home > Drinkware" },
  declarations: {
    condition: "NEW",
    dangerousProduct: "NO",
    preorder: "NO",
  },
  description: "Reviewed bottle description",
  externalChecks: {
    notes: ["Check shipping services in Seller Centre."],
    shippingServices: "SELLER_CENTRE_REQUIRED",
    unsupported: ["Promotional image"],
  },
  generatedAt: "2026-09-07T00:01:00.000Z",
  images: [
    {
      isPrimary: true,
      position: 0,
      url: "https://static.jakmall.id/bottle.jpg",
    },
  ],
  offer: {
    mode: "BASE_LISTING",
    sellingPriceIdr: 35_000,
    sku: "A100416AY",
    sourceMode: "BASE_VARIANT",
    stock: 5,
  },
  physical: {
    dimensionsCm: { height: null, length: null, width: null },
    weightGrams: 380,
  },
  productId,
  schemaVersion: 1,
  snapshotFingerprint: fingerprint,
  title: "RUMAUMA Glass Water Bottle",
};

const product = {
  gtin: null,
  id: productId,
  status: "READY",
  updatedAt: readyRevision,
} as ProductReview;

describe("Shopee upload manifest", () => {
  it("adds only automation-required GTIN and READY revision data", () => {
    const built = buildShopeeUploadManifest(product, handoff);

    expect(built).toMatchObject({
      ok: true,
      manifest: {
        gtin: { mode: "NOT_AVAILABLE" },
        productId,
        readyRevision,
        schemaVersion: 1,
        snapshotFingerprint: fingerprint,
      },
    });
    const serialized = JSON.stringify(built);
    expect(serialized).not.toMatch(
      /rawSourceData|canonicalSourceUrl|sourcePrice|processLogs|authToken|cookie/iu,
    );
  });

  it("preserves a reviewed GTIN without inventing one", () => {
    expect(
      buildShopeeUploadManifest({ ...product, gtin: "8991234567890" }, handoff),
    ).toMatchObject({
      ok: true,
      manifest: { gtin: { mode: "PROVIDED", value: "8991234567890" } },
    });
  });

  it("rejects stale identity and malformed or expanded manifests", () => {
    expect(
      buildShopeeUploadManifest(
        { ...product, id: "22222222-2222-4222-8222-222222222222" },
        handoff,
      ),
    ).toEqual({ error: "INVALID_UPLOAD_MANIFEST", ok: false });

    expect(
      parseShopeeUploadManifest({
        ...handoff,
        gtin: { mode: "NOT_AVAILABLE" },
        rawSourceData: { html: "must not pass" },
        readyRevision,
      }),
    ).toEqual({ error: "INVALID_UPLOAD_MANIFEST", ok: false });
  });
});
