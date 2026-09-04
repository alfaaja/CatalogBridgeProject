import { NextResponse } from "next/server"

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    return NextResponse.json(
      {
        ok: false,
        message: "Supabase environment variables are missing.",
      },
      { status: 500 }
    )
  }

  try {
    const baseUrl = url.replace(/\/+$/, "")

    const response = await fetch(`${baseUrl}/auth/v1/health`, {
      headers: {
        apikey: key,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: "Unable to reach Supabase.",
          status: response.status,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: "Supabase connected successfully.",
    })
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Supabase connection failed.",
      },
      { status: 500 }
    )
  }
}