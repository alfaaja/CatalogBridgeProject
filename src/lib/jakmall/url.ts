const MAX_SOURCE_URL_LENGTH = 2_048
const CANONICAL_PRODUCT_HOSTNAME = "www.jakmall.com"
const ALLOWED_PRODUCT_HOSTNAMES = new Set([
  "jakmall.com",
  CANONICAL_PRODUCT_HOSTNAME,
])
const PRODUCT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u

export type JakMallUrlResult =
  | Readonly<{ ok: true; url: string }>
  | Readonly<{ ok: false; error: "IMPORT_INVALID_URL" }>

function invalidUrl(): JakMallUrlResult {
  return { ok: false, error: "IMPORT_INVALID_URL" }
}

export function canonicalizeJakMallProductUrl(
  input: unknown
): JakMallUrlResult {
  if (typeof input !== "string") {
    return invalidUrl()
  }

  const value = input.trim()

  if (
    value.length === 0 ||
    value.length > MAX_SOURCE_URL_LENGTH ||
    /[\\\u0000-\u001f\u007f]/u.test(value)
  ) {
    return invalidUrl()
  }

  let parsedUrl: URL

  try {
    parsedUrl = new URL(value)
  } catch {
    return invalidUrl()
  }

  const hostname = parsedUrl.hostname.toLowerCase()

  if (
    parsedUrl.protocol !== "https:" ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.port ||
    hostname.endsWith(".") ||
    !ALLOWED_PRODUCT_HOSTNAMES.has(hostname) ||
    parsedUrl.pathname.includes("%")
  ) {
    return invalidUrl()
  }

  const pathSegments = parsedUrl.pathname.split("/").filter(Boolean)

  if (
    pathSegments.length !== 2 ||
    pathSegments.some((segment) => !PRODUCT_SLUG_PATTERN.test(segment))
  ) {
    return invalidUrl()
  }

  const queryKeys = [...parsedUrl.searchParams.keys()]

  if (
    queryKeys.some((key) => key !== "jtm") ||
    parsedUrl.searchParams.getAll("jtm").length > 1
  ) {
    return invalidUrl()
  }

  const canonicalUrl = new URL(
    `https://${CANONICAL_PRODUCT_HOSTNAME}/${pathSegments.join("/")}`
  )

  return { ok: true, url: canonicalUrl.toString().replace(/\/$/u, "") }
}
