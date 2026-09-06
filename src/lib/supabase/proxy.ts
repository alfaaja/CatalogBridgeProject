import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { getSupabasePublicConfig } from "./config"

function redirectWithSessionCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string
) {
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = pathname
  redirectUrl.search = ""
  const redirectResponse = NextResponse.redirect(redirectUrl)

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie)
  })

  for (const header of ["Cache-Control", "Expires", "Pragma"] as const) {
    const value = response.headers.get(header)
    if (value) redirectResponse.headers.set(header, value)
  }

  return redirectResponse
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { url, publishableKey } = getSupabasePublicConfig()
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
        Object.entries(headers).forEach(([name, value]) =>
          response.headers.set(name, value)
        )
      }
    }
  })

  const { data, error } = await supabase.auth.getClaims()
  const isAuthenticated =
    !error &&
    typeof data?.claims?.sub === "string" &&
    data.claims.is_anonymous !== true
  const isPublicPage = new Set(["/", "/login", "/register"]).has(
    request.nextUrl.pathname
  )

  if (!isAuthenticated && !isPublicPage) {
    return redirectWithSessionCookies(request, response, "/login")
  }

  if (isAuthenticated && isPublicPage) {
    return redirectWithSessionCookies(request, response, "/dashboard")
  }

  return response
}
