import { readSupabasePublicConfig } from "@/lib/supabase/config"

const HEALTH_CHECK_TIMEOUT_MS = 5_000

function healthyResponse() {
  return Response.json({
    ok: true,
    status: "healthy",
    message: "Supabase is reachable.",
  })
}

function unavailableResponse() {
  return Response.json(
    {
      ok: false,
      status: "unavailable",
      message: "Supabase is unavailable.",
    },
    { status: 503 }
  )
}

function requestFailureCategory(error: unknown) {
  if (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  ) {
    return "timeout"
  }

  return "request_error"
}

export async function GET() {
  const configResult = readSupabasePublicConfig()

  if (!configResult.ok) {
    console.error("Supabase health check configuration is invalid.", {
      issues: configResult.issues,
    })
    return unavailableResponse()
  }

  try {
    const response = await fetch(`${configResult.config.url}/auth/v1/health`, {
      headers: {
        apikey: configResult.config.publishableKey,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
    })

    if (!response.ok) {
      console.error(
        "Supabase health check returned a non-success status.",
        { upstreamStatus: response.status }
      )
      return unavailableResponse()
    }

    return healthyResponse()
  } catch (error) {
    console.error("Supabase health check request failed.", {
      category: requestFailureCategory(error),
    })
    return unavailableResponse()
  }
}
