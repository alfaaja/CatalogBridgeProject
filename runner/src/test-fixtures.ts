export const baseManifest = {
  attributes: [{ name: "Material", value: "Glass" }],
  brand: "RUMAUMA",
  category: { id: null, path: "Home > Drinkware" },
  declarations: { condition: "NEW", dangerousProduct: "NO", preorder: "NO" },
  description: "Reviewed description",
  externalChecks: {
    notes: [],
    shippingServices: "SELLER_CENTRE_REQUIRED",
    unsupported: [],
  },
  generatedAt: "2026-09-07T00:00:00.000Z",
  gtin: { mode: "NOT_AVAILABLE" },
  images: [
    { isPrimary: true, position: 0, url: "https://static.jakmall.id/a.jpg" },
  ],
  offer: {
    mode: "BASE_LISTING",
    sellingPriceIdr: 35_000,
    sku: "SKU-1",
    sourceMode: "BASE_VARIANT",
    stock: 5,
  },
  physical: {
    dimensionsCm: { height: null, length: null, width: null },
    weightGrams: 380,
  },
  productId: "11111111-1111-4111-8111-111111111111",
  readyRevision: "2026-09-07T00:00:00.000Z",
  schemaVersion: 1,
  snapshotFingerprint: "a".repeat(64),
  title: "Glass Bottle",
} as const;
