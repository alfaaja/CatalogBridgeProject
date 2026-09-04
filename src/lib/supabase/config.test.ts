import { afterEach, describe, expect, it, vi } from "vitest"

import {
  getSupabasePublicConfig,
  readSupabasePublicConfig,
  validateSupabasePublicConfig,
} from "./config"

describe("Supabase public configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("returns a normalized immutable configuration for valid values", () => {
    const result = validateSupabasePublicConfig({
      url: "  https://example.supabase.co///  ",
      publishableKey: "  test-publishable-key  ",
    })

    expect(result).toEqual({
      ok: true,
      config: {
        url: "https://example.supabase.co",
        publishableKey: "test-publishable-key",
      },
    })

    if (result.ok) {
      expect(Object.isFrozen(result.config)).toBe(true)
    }
  })

  it.each([
    {
      url: undefined,
      publishableKey: "test-publishable-key",
      issue: "missing_url",
    },
    {
      url: "https://example.supabase.co",
      publishableKey: undefined,
      issue: "missing_publishable_key",
    },
    {
      url: "not-a-url",
      publishableKey: "test-publishable-key",
      issue: "invalid_url",
    },
    {
      url: "http://example.supabase.co",
      publishableKey: "test-publishable-key",
      issue: "insecure_url_protocol",
    },
  ])(
    "rejects missing or unsafe values with a sanitized reason code",
    ({ issue, ...input }) => {
      expect(validateSupabasePublicConfig(input)).toEqual({
        ok: false,
        issues: [issue],
      })
    }
  )

  it("reports every missing field without exposing configuration values", () => {
    const result = validateSupabasePublicConfig({
      url: " ",
      publishableKey: " ",
    })

    expect(result).toEqual({
      ok: false,
      issues: ["missing_url", "missing_publishable_key"],
    })

    if (!result.ok) {
      expect(Object.isFrozen(result.issues)).toBe(true)
    }
  })

  it("reads the statically named public environment variables", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co")
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "test-publishable-key"
    )

    expect(readSupabasePublicConfig()).toEqual({
      ok: true,
      config: {
        url: "https://example.supabase.co",
        publishableKey: "test-publishable-key",
      },
    })
  })

  it("throws a stable error without echoing invalid configuration", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      "https://secret-project.supabase.co"
    )
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "")

    expect(() => getSupabasePublicConfig()).toThrow(
      "Supabase public configuration is invalid."
    )

    try {
      getSupabasePublicConfig()
    } catch (error) {
      expect(String(error)).not.toContain("secret-project")
    }
  })
})
