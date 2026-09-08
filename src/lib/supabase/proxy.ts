import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh/verify auth using getClaims as requested
  const { data, error } = await supabase.auth.getClaims()

  // Protect the /admin routes (except /admin/login)
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isLoginRoute = request.nextUrl.pathname === '/admin/login'

  const ADMIN_UUID = '76320352-4c29-42ad-a105-345e0b5928dd'
  const subject = data?.claims?.sub
  const isAuthorized = !error && subject === ADMIN_UUID

  if (isAdminRoute && !isLoginRoute && !isAuthorized) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    const redirectResponse = NextResponse.redirect(url)

    // Preserve any response cookies provided by Supabase cookie handling
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })

    return redirectResponse
  }

  return supabaseResponse
}
