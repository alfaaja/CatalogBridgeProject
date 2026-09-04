import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server"
import { describe, expect, it } from "vitest"

import { config } from "./proxy"

describe("application Proxy matcher", () => {
  it.each(["/", "/products", "/products/source-id", "/import", "/import/new", "/login"])(
    "protects or manages %s",
    (url) => {
      expect(
        unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })
      ).toBe(true)
    }
  )

  it.each(["/api/health/supabase", "/_next/static/app.js", "/favicon.ico"])(
    "does not intercept %s",
    (url) => {
      expect(
        unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })
      ).toBe(false)
    }
  )
})
