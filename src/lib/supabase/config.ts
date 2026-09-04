import { z } from "zod"

const urlSchema = z.string().trim().pipe(z.url())

type SupabasePublicConfigInput = {
  url: string | undefined
  publishableKey: string | undefined
}

export type SupabasePublicConfig = Readonly<{
  url: string
  publishableKey: string
}>

export type SupabasePublicConfigIssue =
  | "missing_url"
  | "invalid_url"
  | "insecure_url_protocol"
  | "missing_publishable_key"

export type SupabasePublicConfigResult =
  | Readonly<{ ok: true; config: SupabasePublicConfig }>
  | Readonly<{
      ok: false
      issues: readonly SupabasePublicConfigIssue[]
    }>

export function validateSupabasePublicConfig(
  input: SupabasePublicConfigInput
): SupabasePublicConfigResult {
  const issues: SupabasePublicConfigIssue[] = []
  const urlValue = input.url?.trim()
  const publishableKey = input.publishableKey?.trim()
  let normalizedUrl: string | undefined

  if (!urlValue) {
    issues.push("missing_url")
  } else {
    const urlResult = urlSchema.safeParse(urlValue)

    if (!urlResult.success) {
      issues.push("invalid_url")
    } else {
      const parsedUrl = new URL(urlResult.data)

      if (parsedUrl.protocol !== "https:") {
        issues.push("insecure_url_protocol")
      } else if (
        parsedUrl.username ||
        parsedUrl.password ||
        parsedUrl.search ||
        parsedUrl.hash ||
        !/^\/+$/u.test(parsedUrl.pathname)
      ) {
        issues.push("invalid_url")
      } else {
        normalizedUrl = parsedUrl.origin
      }
    }
  }

  if (!publishableKey) {
    issues.push("missing_publishable_key")
  }

  if (issues.length > 0 || !normalizedUrl || !publishableKey) {
    return Object.freeze({
      ok: false,
      issues: Object.freeze(issues),
    })
  }

  return Object.freeze({
    ok: true,
    config: Object.freeze({
      url: normalizedUrl,
      publishableKey,
    }),
  })
}

export function readSupabasePublicConfig(): SupabasePublicConfigResult {
  return validateSupabasePublicConfig({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  })
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const result = readSupabasePublicConfig()

  if (!result.ok) {
    throw new Error("Supabase public configuration is invalid.")
  }

  return result.config
}
