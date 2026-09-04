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
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data, error } = await supabase.auth.getClaims()
  const isAuthenticated =
    !error && Boolean(data?.claims) && data?.claims?.is_anonymous !== true
  const isLoginPage = request.nextUrl.pathname === "/login"

  if (!isAuthenticated && !isLoginPage) {
    return redirectWithSessionCookies(request, response, "/login")
  }

  if (isAuthenticated && isLoginPage) {
    return redirectWithSessionCookies(request, response, "/")
  }

  return response
}
