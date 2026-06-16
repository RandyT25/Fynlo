import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
        // Apply cache-control headers the library passes (prevents 304s from
        // stripping Set-Cookie when the auth token is refreshed mid-request)
        if (headers) {
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        }
      },
    },
  })

  // Use getSession() instead of getUser() to avoid consuming the browser's
  // refresh token. getUser() triggers a server-side token exchange which
  // invalidates the rotating refresh token before the new one reaches the
  // browser — causing the browser client's own refresh to fail on next load.
  // getSession() reads the existing session from cookies without an API call,
  // preserving the browser client's ability to refresh its own token.
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  const protectedRoutes = ['/dashboard', '/transactions', '/accounts', '/budgets', '/goals', '/analytics', '/calendar', '/subscriptions', '/family', '/settings', '/more', '/recurring', '/tasks', '/wishlist', '/notifications']
  const authRoutes = ['/login', '/signup', '/forgot-password']

  const isProtected = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Protected routes must never be served from cache — a cached 304 response
  // strips Set-Cookie headers, so a refreshed auth token never reaches the
  // browser. The client's old refresh token (already consumed by the server)
  // then fails and the session is silently removed.
  supabaseResponse.headers.set('Cache-Control', 'private, no-store')

  return supabaseResponse
}
