import { describe, expect, it } from "vitest"

import { canonicalizeJakMallProductUrl } from "./url"

describe("JakMall product URL canonicalization", () => {
  it.each([
    [
      "https://www.jakmall.com/abc-store/example-product",
      "https://www.jakmall.com/abc-store/example-product",
    ],
    [
      "https://jakmall.com/abc-store/example-product/",
      "https://www.jakmall.com/abc-store/example-product",
    ],
    [
      "https://www.jakmall.com/abc-store/example-product?jtm=tracking#1234567890123",
      "https://www.jakmall.com/abc-store/example-product",
    ],
  ])("canonicalizes %s", (input, expected) => {
    expect(canonicalizeJakMallProductUrl(input)).toEqual({
      ok: true,
      url: expected,
    })
  })

  it.each([
    "http://www.jakmall.com/abc-store/example-product",
    "https://user:password@www.jakmall.com/abc-store/example-product",
    "https://www.jakmall.com:8443/abc-store/example-product",
    "https://supplier.jakmall.com/abc-store/example-product",
    "https://jakmall.com.evil.example/abc-store/example-product",
    "https://eviljakmall.com/abc-store/example-product",
    "https://localhost/abc-store/example-product",
    "https://127.0.0.1/abc-store/example-product",
    "https://[::1]/abc-store/example-product",
    "https://www.jakmall.com/example-product",
    "https://www.jakmall.com/abc-store/example-product/extra",
    "https://www.jakmall.com/abc_store/example-product",
    "https://www.jakmall.com/abc-store/example%2Fproduct",
    "https://www.jakmall.com/abc-store/example-product?utm_source=test",
    "https://www.jakmall.com./abc-store/example-product",
  ])("rejects unsupported or deceptive URL %s", (input) => {
    expect(canonicalizeJakMallProductUrl(input)).toEqual({
      ok: false,
      error: "IMPORT_INVALID_URL",
    })
  })

  it("rejects repeated tracking parameters", () => {
    expect(
      canonicalizeJakMallProductUrl(
        "https://www.jakmall.com/abc-store/example-product?jtm=one&jtm=two"
      )
    ).toEqual({ ok: false, error: "IMPORT_INVALID_URL" })
  })

  it("rejects an excessively long URL", () => {
    expect(
      canonicalizeJakMallProductUrl(
        `https://www.jakmall.com/abc-store/${"a".repeat(2_100)}`
      )
    ).toEqual({ ok: false, error: "IMPORT_INVALID_URL" })
  })
})
