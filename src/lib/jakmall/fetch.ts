import { lookup } from "node:dns/promises"
import { request } from "node:https"
import { isIP, type LookupFunction } from "node:net"
import type { IncomingHttpHeaders, IncomingMessage } from "node:http"

import { canonicalizeJakMallProductUrl } from "./url"

export const SOURCE_MAX_BODY_BYTES = 1024 * 1024
const SOURCE_DEADLINE_MS = 15_000
const MAX_REDIRECTS = 3
const MAX_RESPONSE_HEADER_BYTES = 16 * 1024
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])
const ALLOWED_CONTENT_TYPES = new Set([
  "application/xhtml+xml",
  "text/html",
])

type SourceFetchError =
  | "SOURCE_PRODUCT_NOT_FOUND"
  | "SOURCE_REDIRECT_BLOCKED"
  | "SOURCE_TIMEOUT"
  | "SOURCE_UNREACHABLE"

export type FetchedJakMallDocument = Readonly<{
  body: string
  byteLength: number
  contentType: string
  redirectCount: number
  url: string
}>

export type JakMallFetchResult =
  | Readonly<{ ok: true; document: FetchedJakMallDocument }>
  | Readonly<{ ok: false; error: SourceFetchError }>

type ResolvedAddress = Readonly<{ address: string; family: 4 | 6 }>

type HopResult =
  | Readonly<{ kind: "document"; body: Buffer; contentType: string }>
  | Readonly<{ kind: "redirect"; location: string | null }>
  | Readonly<{ kind: "status"; statusCode: number }>
  | Readonly<{ kind: "invalid-response" }>

function parseIpv4(address: string): readonly number[] | null {
  const parts = address.split(".")

  if (parts.length !== 4) {
    return null
  }

  const bytes = parts.map((part) => {
    if (!/^(?:0|[1-9][0-9]{0,2})$/u.test(part)) {
      return Number.NaN
    }

    return Number(part)
  })

  return bytes.every((byte) => Number.isInteger(byte) && byte <= 255)
    ? bytes
    : null
}

function isPublicIpv4(address: string): boolean {
  const bytes = parseIpv4(address)

  if (!bytes) {
    return false
  }

  const [first, second, third] = bytes

  return !(
    first === 0 ||
    first === 10 ||
    (first === 100 && second >= 64 && second <= 127) ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0 && third === 0) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113) ||
    first >= 224
  )
}

function parseIpv6(address: string): Uint8Array | null {
  const normalizedAddress = address.toLowerCase()

  if (normalizedAddress.includes("%") || isIP(normalizedAddress) !== 6) {
    return null
  }

  const doubleColonParts = normalizedAddress.split("::")

  if (doubleColonParts.length > 2) {
    return null
  }

  const expandIpv4Tail = (parts: string[]) => {
    const lastPart = parts.at(-1)

    if (!lastPart?.includes(".")) {
      return parts
    }

    const ipv4 = parseIpv4(lastPart)

    if (!ipv4) {
      return null
    }

    return [
      ...parts.slice(0, -1),
      ((ipv4[0] << 8) | ipv4[1]).toString(16),
      ((ipv4[2] << 8) | ipv4[3]).toString(16),
    ]
  }

  const left = expandIpv4Tail(
    doubleColonParts[0] ? doubleColonParts[0].split(":") : []
  )
  const right = expandIpv4Tail(
    doubleColonParts[1] ? doubleColonParts[1].split(":") : []
  )

  if (!left || !right) {
    return null
  }

  const zeroCount = 8 - left.length - right.length

  if (
    zeroCount < 0 ||
    (doubleColonParts.length === 1 && zeroCount !== 0) ||
    (doubleColonParts.length === 2 && zeroCount === 0)
  ) {
    return null
  }

  const groups = [
    ...left,
    ...Array.from({ length: zeroCount }, () => "0"),
    ...right,
  ]

  if (
    groups.length !== 8 ||
    groups.some((group) => !/^[0-9a-f]{1,4}$/u.test(group))
  ) {
    return null
  }

  const bytes = new Uint8Array(16)

  groups.forEach((group, index) => {
    const value = Number.parseInt(group, 16)
    bytes[index * 2] = value >> 8
    bytes[index * 2 + 1] = value & 0xff
  })

  return bytes
}

function isAllZero(bytes: Uint8Array, endExclusive: number) {
  return bytes.slice(0, endExclusive).every((byte) => byte === 0)
}

function isPublicIpv6(address: string): boolean {
  const bytes = parseIpv6(address)

  if (!bytes) {
    return false
  }

  const isMappedIpv4 =
    isAllZero(bytes, 10) && bytes[10] === 0xff && bytes[11] === 0xff

  if (isMappedIpv4) {
    return isPublicIpv4(
      `${bytes[12]}.${bytes[13]}.${bytes[14]}.${bytes[15]}`
    )
  }

  const isUnspecifiedOrIpv4Compatible = isAllZero(bytes, 12)
  const isLoopback = isAllZero(bytes, 15) && bytes[15] === 1
  const isUniqueLocal = (bytes[0] & 0xfe) === 0xfc
  const isLinkLocal = bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0x80
  const isMulticast = bytes[0] === 0xff
  const isDocumentation =
    bytes[0] === 0x20 &&
    bytes[1] === 0x01 &&
    bytes[2] === 0x0d &&
    bytes[3] === 0xb8
  const isDiscardOnly =
    bytes[0] === 0x01 && bytes.slice(1, 8).every((byte) => byte === 0)

  return !(
    isUnspecifiedOrIpv4Compatible ||
    isLoopback ||
    isUniqueLocal ||
    isLinkLocal ||
    isMulticast ||
    isDocumentation ||
    isDiscardOnly
  )
}

export function isPublicIpAddress(address: string): boolean {
  const family = isIP(address)

  if (family === 4) {
    return isPublicIpv4(address)
  }

  return family === 6 && isPublicIpv6(address)
}

function abortError() {
  const error = new Error("Source request exceeded its deadline.")
  error.name = "AbortError"
  return error
}

function waitForAbort(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) {
      reject(abortError())
      return
    }

    signal.addEventListener("abort", () => reject(abortError()), {
      once: true,
    })
  })
}

async function resolvePublicAddress(
  hostname: string,
  signal: AbortSignal
): Promise<ResolvedAddress | null> {
  const addresses = await Promise.race([
    lookup(hostname, { all: true, verbatim: true }),
    waitForAbort(signal),
  ])

  if (
    addresses.length === 0 ||
    addresses.some(
      ({ address, family }) =>
        (family !== 4 && family !== 6) || !isPublicIpAddress(address)
    )
  ) {
    return null
  }

  const selectedAddress = addresses[0]

  return {
    address: selectedAddress.address,
    family: selectedAddress.family as 4 | 6,
  }
}

function getHeader(headers: IncomingHttpHeaders, name: string) {
  const value = headers[name]

  return Array.isArray(value) ? value[0] : value
}

function readBoundedBody(response: IncomingMessage): Promise<Buffer | null> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let byteLength = 0
    let settled = false

    const settle = (value: Buffer | null) => {
      if (!settled) {
        settled = true
        resolve(value)
      }
    }

    response.on("data", (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      byteLength += buffer.byteLength

      if (byteLength > SOURCE_MAX_BODY_BYTES) {
        settle(null)
        response.destroy()
        return
      }

      chunks.push(buffer)
    })
    response.once("end", () => settle(Buffer.concat(chunks, byteLength)))
    response.once("error", reject)
  })
}

function requestHop(
  url: URL,
  resolvedAddress: ResolvedAddress,
  signal: AbortSignal
): Promise<HopResult> {
  return new Promise((resolve, reject) => {
    const pinnedLookup: LookupFunction = (
      requestedHostname,
      options,
      callback
    ) => {
      if (requestedHostname !== url.hostname) {
        callback(new Error("Pinned lookup hostname mismatch."), "", 0)
        return
      }

      if (options.all) {
        callback(null, [
          {
            address: resolvedAddress.address,
            family: resolvedAddress.family,
          },
        ])
        return
      }

      callback(null, resolvedAddress.address, resolvedAddress.family)
    }

    const sourceRequest = request(
      url,
      {
        agent: false,
        headers: {
          accept: "text/html,application/xhtml+xml",
          "accept-encoding": "identity",
          host: url.hostname,
        },
        lookup: pinnedLookup,
        maxHeaderSize: MAX_RESPONSE_HEADER_BYTES,
        method: "GET",
        rejectUnauthorized: true,
        servername: url.hostname,
        signal,
      },
      async (response) => {
        const statusCode = response.statusCode ?? 0

        if (REDIRECT_STATUSES.has(statusCode)) {
          response.resume()
          resolve({
            kind: "redirect",
            location: getHeader(response.headers, "location") ?? null,
          })
          return
        }

        if (statusCode < 200 || statusCode >= 300) {
          response.resume()
          resolve({ kind: "status", statusCode })
          return
        }

        const contentTypeHeader = getHeader(response.headers, "content-type")
        const contentType = contentTypeHeader
          ?.split(";", 1)[0]
          ?.trim()
          .toLowerCase()
        const contentEncoding = getHeader(response.headers, "content-encoding")
          ?.trim()
          .toLowerCase()
        const contentLengthHeader = getHeader(response.headers, "content-length")
        const contentLength = contentLengthHeader
          ? Number(contentLengthHeader)
          : null

        if (
          !contentType ||
          !ALLOWED_CONTENT_TYPES.has(contentType) ||
          (contentEncoding && contentEncoding !== "identity") ||
          (contentLength !== null &&
            (!Number.isSafeInteger(contentLength) ||
              contentLength < 0 ||
              contentLength > SOURCE_MAX_BODY_BYTES))
        ) {
          response.resume()
          resolve({ kind: "invalid-response" })
          return
        }

        try {
          const body = await readBoundedBody(response)

          resolve(
            body
              ? { kind: "document", body, contentType }
              : { kind: "invalid-response" }
          )
        } catch (error) {
          reject(error)
        }
      }
    )

    sourceRequest.once("error", reject)
    sourceRequest.end()
  })
}

function failed(error: SourceFetchError): JakMallFetchResult {
  return { ok: false, error }
}

export async function fetchJakMallProductDocument(
  sourceUrl: string
): Promise<JakMallFetchResult> {
  const initialUrl = canonicalizeJakMallProductUrl(sourceUrl)

  if (!initialUrl.ok) {
    return failed("SOURCE_UNREACHABLE")
  }

  const controller = new AbortController()
  const deadline = setTimeout(() => controller.abort(), SOURCE_DEADLINE_MS)
  const visitedUrls = new Set([initialUrl.url])
  let currentUrl = initialUrl.url
  let redirectCount = 0

  try {
    while (true) {
      const resolvedAddress = await resolvePublicAddress(
        new URL(currentUrl).hostname,
        controller.signal
      )

      if (!resolvedAddress) {
        return failed(
          redirectCount > 0
            ? "SOURCE_REDIRECT_BLOCKED"
            : "SOURCE_UNREACHABLE"
        )
      }

      const hop = await requestHop(
        new URL(currentUrl),
        resolvedAddress,
        controller.signal
      )

      if (hop.kind === "redirect") {
        if (!hop.location || redirectCount >= MAX_REDIRECTS) {
          return failed("SOURCE_REDIRECT_BLOCKED")
        }

        let redirectTarget: URL

        try {
          redirectTarget = new URL(hop.location, currentUrl)
        } catch {
          return failed("SOURCE_REDIRECT_BLOCKED")
        }

        const canonicalTarget = canonicalizeJakMallProductUrl(
          redirectTarget.toString()
        )

        if (!canonicalTarget.ok || visitedUrls.has(canonicalTarget.url)) {
          return failed("SOURCE_REDIRECT_BLOCKED")
        }

        redirectCount += 1
        currentUrl = canonicalTarget.url
        visitedUrls.add(currentUrl)
        continue
      }

      if (hop.kind === "status") {
        return failed(
          hop.statusCode === 404 || hop.statusCode === 410
            ? "SOURCE_PRODUCT_NOT_FOUND"
            : "SOURCE_UNREACHABLE"
        )
      }

      if (hop.kind === "invalid-response") {
        return failed("SOURCE_UNREACHABLE")
      }

      return {
        ok: true,
        document: {
          body: hop.body.toString("utf8"),
          byteLength: hop.body.byteLength,
          contentType: hop.contentType,
          redirectCount,
          url: currentUrl,
        },
      }
    }
  } catch (error) {
    return failed(
      controller.signal.aborted ||
        (error instanceof Error && error.name === "AbortError")
        ? "SOURCE_TIMEOUT"
        : redirectCount > 0
          ? "SOURCE_REDIRECT_BLOCKED"
          : "SOURCE_UNREACHABLE"
    )
  } finally {
    clearTimeout(deadline)
  }
}
