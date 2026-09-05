import { EventEmitter } from "node:events"
import { Readable } from "node:stream"

import { beforeEach, describe, expect, it, vi } from "vitest"

const { lookupMock, requestMock } = vi.hoisted(() => ({
  lookupMock: vi.fn(),
  requestMock: vi.fn(),
}))

vi.mock("node:dns/promises", () => ({
  lookup: lookupMock,
}))

vi.mock("node:https", () => ({
  request: requestMock,
}))

import {
  fetchJakMallProductDocument,
  isPublicIpAddress,
  SOURCE_MAX_BODY_BYTES,
} from "./fetch"

type ResponseSpec = Readonly<{
  body?: string | Buffer
  headers?: Readonly<Record<string, string>>
  statusCode: number
}>

function queueResponse(spec: ResponseSpec) {
  requestMock.mockImplementationOnce(
    (
      _url: URL,
      _options: { signal?: AbortSignal },
      callback: (response: Readable) => void
    ) => {
      const request = new EventEmitter() as EventEmitter & {
        destroy: (error?: Error) => void
        end: () => void
      }

      request.destroy = (error) => {
        if (error) {
          request.emit("error", error)
        }
      }
      request.end = () => {
        const response = Readable.from([spec.body ?? ""])
        Object.assign(response, {
          headers: spec.headers ?? { "content-type": "text/html" },
          statusCode: spec.statusCode,
        })
        queueMicrotask(() => callback(response))
      }

      return request
    }
  )
}

describe("public IP classification", () => {
  it.each([
    "8.8.8.8",
    "1.1.1.1",
    "2606:4700:4700::1111",
    "::ffff:8.8.8.8",
  ])("accepts globally routable address %s", (address) => {
    expect(isPublicIpAddress(address)).toBe(true)
  })

  it.each([
    "0.0.0.0",
    "10.0.0.1",
    "100.64.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.1.1",
    "198.18.0.1",
    "224.0.0.1",
    "255.255.255.255",
    "::",
    "::1",
    "fc00::1",
    "fd00::1",
    "fe80::1",
    "ff02::1",
    "2001:db8::1",
    "::ffff:127.0.0.1",
    "::ffff:c0a8:101",
    "not-an-ip",
  ])("rejects non-public address %s", (address) => {
    expect(isPublicIpAddress(address)).toBe(false)
  })
})

describe("bounded JakMall source fetch", () => {
  beforeEach(() => {
    lookupMock.mockReset()
    requestMock.mockReset()
    lookupMock.mockResolvedValue([{ address: "8.8.8.8", family: 4 }])
  })

  it("pins a vetted address without replacing the TLS hostname", async () => {
    queueResponse({
      statusCode: 200,
      body: "<html><title>Product</title></html>",
    })

    const result = await fetchJakMallProductDocument(
      "https://www.jakmall.com/abc-store/example-product"
    )

    expect(result).toMatchObject({ ok: true })
    const [requestedUrl, options] = requestMock.mock.calls[0] as [
      URL,
      {
        headers: Record<string, string>
        lookup: (
          hostname: string,
          options: { all?: boolean },
          callback: (
            error: Error | null,
            address?: string | Array<{ address: string; family: number }>,
            family?: number
          ) => void
        ) => void
        rejectUnauthorized: boolean
        servername: string
      },
    ]

    expect(requestedUrl.hostname).toBe("www.jakmall.com")
    expect(requestedUrl.hostname).not.toBe("8.8.8.8")
    expect(options.servername).toBe("www.jakmall.com")
    expect(options.rejectUnauthorized).toBe(true)
    expect(options.headers.host).toBe("www.jakmall.com")
    expect(options.headers).not.toHaveProperty("authorization")
    expect(options.headers).not.toHaveProperty("cookie")

    const pinnedLookup = vi.fn()
    options.lookup("www.jakmall.com", { all: true }, pinnedLookup)
    expect(pinnedLookup).toHaveBeenCalledWith(null, [
      { address: "8.8.8.8", family: 4 },
    ])
  })

  it("rejects an official hostname resolving to a private address", async () => {
    lookupMock.mockResolvedValue([{ address: "127.0.0.1", family: 4 }])

    await expect(
      fetchJakMallProductDocument(
        "https://www.jakmall.com/abc-store/example-product"
      )
    ).resolves.toEqual({ ok: false, error: "SOURCE_UNREACHABLE" })
    expect(requestMock).not.toHaveBeenCalled()
  })

  it("rejects the complete DNS result if any address is private", async () => {
    lookupMock.mockResolvedValue([
      { address: "8.8.8.8", family: 4 },
      { address: "fd00::1", family: 6 },
    ])

    await expect(
      fetchJakMallProductDocument(
        "https://www.jakmall.com/abc-store/example-product"
      )
    ).resolves.toEqual({ ok: false, error: "SOURCE_UNREACHABLE" })
    expect(requestMock).not.toHaveBeenCalled()
  })

  it("revalidates and follows a bounded allowed redirect", async () => {
    queueResponse({
      statusCode: 301,
      headers: {
        location: "/abc-store/canonical-product",
        "content-type": "text/html",
      },
    })
    queueResponse({ statusCode: 200, body: "<html>Product</html>" })

    await expect(
      fetchJakMallProductDocument(
        "https://www.jakmall.com/abc-store/example-product"
      )
    ).resolves.toMatchObject({
      ok: true,
      document: {
        redirectCount: 1,
        url: "https://www.jakmall.com/abc-store/canonical-product",
      },
    })
    expect(lookupMock).toHaveBeenCalledTimes(2)
    expect(requestMock).toHaveBeenCalledTimes(2)
  })

  it("blocks a redirect to an unsupported host", async () => {
    queueResponse({
      statusCode: 302,
      headers: {
        location: "https://evil.example/steal",
        "content-type": "text/html",
      },
    })

    await expect(
      fetchJakMallProductDocument(
        "https://www.jakmall.com/abc-store/example-product"
      )
    ).resolves.toEqual({ ok: false, error: "SOURCE_REDIRECT_BLOCKED" })
  })

  it("blocks a redirect whose allowed hostname resolves privately", async () => {
    lookupMock
      .mockResolvedValueOnce([{ address: "8.8.8.8", family: 4 }])
      .mockResolvedValueOnce([{ address: "127.0.0.1", family: 4 }])
    queueResponse({
      statusCode: 302,
      headers: {
        location: "/abc-store/redirected-product",
        "content-type": "text/html",
      },
    })

    await expect(
      fetchJakMallProductDocument(
        "https://www.jakmall.com/abc-store/example-product"
      )
    ).resolves.toEqual({ ok: false, error: "SOURCE_REDIRECT_BLOCKED" })
  })

  it("blocks redirect loops and excessive redirects", async () => {
    for (const path of ["two", "three", "four", "five"]) {
      queueResponse({
        statusCode: 302,
        headers: {
          location: `/abc-store/${path}`,
          "content-type": "text/html",
        },
      })
    }

    await expect(
      fetchJakMallProductDocument(
        "https://www.jakmall.com/abc-store/one"
      )
    ).resolves.toEqual({ ok: false, error: "SOURCE_REDIRECT_BLOCKED" })
  })

  it("rejects oversized bodies even without Content-Length", async () => {
    queueResponse({
      statusCode: 200,
      body: Buffer.alloc(SOURCE_MAX_BODY_BYTES + 1, "a"),
    })

    await expect(
      fetchJakMallProductDocument(
        "https://www.jakmall.com/abc-store/example-product"
      )
    ).resolves.toEqual({ ok: false, error: "SOURCE_UNREACHABLE" })
  })

  it("rejects an oversized Content-Length before reading", async () => {
    queueResponse({
      statusCode: 200,
      headers: {
        "content-length": String(SOURCE_MAX_BODY_BYTES + 1),
        "content-type": "text/html",
      },
    })

    await expect(
      fetchJakMallProductDocument(
        "https://www.jakmall.com/abc-store/example-product"
      )
    ).resolves.toEqual({ ok: false, error: "SOURCE_UNREACHABLE" })
  })

  it.each(["application/json", "text/plain", "text/html+evil"])(
    "rejects unsupported content type %s",
    async (contentType) => {
      queueResponse({
        statusCode: 200,
        headers: { "content-type": contentType },
      })

      await expect(
        fetchJakMallProductDocument(
          "https://www.jakmall.com/abc-store/example-product"
        )
      ).resolves.toEqual({ ok: false, error: "SOURCE_UNREACHABLE" })
    }
  )

  it("accepts XHTML and reports the actual UTF-8 byte count", async () => {
    queueResponse({
      statusCode: 200,
      body: "<html>Produk ✓</html>",
      headers: { "content-type": "application/xhtml+xml; charset=utf-8" },
    })

    await expect(
      fetchJakMallProductDocument(
        "https://www.jakmall.com/abc-store/example-product"
      )
    ).resolves.toMatchObject({
      ok: true,
      document: { byteLength: Buffer.byteLength("<html>Produk ✓</html>") },
    })
  })

  it.each([
    [404, "SOURCE_PRODUCT_NOT_FOUND"],
    [410, "SOURCE_PRODUCT_NOT_FOUND"],
    [405, "SOURCE_UNREACHABLE"],
    [429, "SOURCE_UNREACHABLE"],
    [500, "SOURCE_UNREACHABLE"],
  ] as const)("maps HTTP %s to %s", async (statusCode, error) => {
    queueResponse({ statusCode })

    await expect(
      fetchJakMallProductDocument(
        "https://www.jakmall.com/abc-store/example-product"
      )
    ).resolves.toEqual({ ok: false, error })
  })

  it("classifies the confirmed AWS WAF human-verification response safely", async () => {
    queueResponse({
      statusCode: 405,
      headers: {
        "content-type": "text/html; charset=UTF-8",
        "x-amzn-waf-action": "captcha",
      },
    })

    await expect(
      fetchJakMallProductDocument(
        "https://www.jakmall.com/abc-store/example-product"
      )
    ).resolves.toEqual({
      ok: false,
      error: "SOURCE_UNREACHABLE",
      classification: "AWS_WAF_HUMAN_VERIFICATION",
    })
  })

  it("maps request failures to SOURCE_UNREACHABLE", async () => {
    requestMock.mockImplementationOnce(() => {
      const request = new EventEmitter() as EventEmitter & {
        destroy: () => void
        end: () => void
      }
      request.destroy = () => undefined
      request.end = () => {
        queueMicrotask(() => request.emit("error", new Error("connection reset")))
      }
      return request
    })

    await expect(
      fetchJakMallProductDocument(
        "https://www.jakmall.com/abc-store/example-product"
      )
    ).resolves.toEqual({ ok: false, error: "SOURCE_UNREACHABLE" })
  })

  it("aborts after the total source deadline", async () => {
    vi.useFakeTimers()
    requestMock.mockImplementationOnce(
      (_url: URL, options: { signal: AbortSignal }) => {
        const request = new EventEmitter() as EventEmitter & {
          destroy: () => void
          end: () => void
        }
        request.destroy = () => undefined
        request.end = () => {
          options.signal.addEventListener("abort", () => {
            const error = new Error("aborted")
            error.name = "AbortError"
            request.emit("error", error)
          })
        }
        return request
      }
    )

    const resultPromise = fetchJakMallProductDocument(
      "https://www.jakmall.com/abc-store/example-product"
    )
    await vi.advanceTimersByTimeAsync(15_001)

    await expect(resultPromise).resolves.toEqual({
      ok: false,
      error: "SOURCE_TIMEOUT",
    })
    vi.useRealTimers()
  })
})
