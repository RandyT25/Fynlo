import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = ['/dashboard', '/transactions', '/accounts', '/budgets', '/goals', '/analytics', '/calendar', '/subscriptions', '/family', '/settings', '/more', '/recurring', '/tasks', '/wishlist', '/notifications']
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password']

export async function updateSession(request: NextRequest) {
  // Do NOT call supabase.auth.getSession() or getUser() here.
  // Those methods refresh the access token server-side, which consumes the
  // rotating refresh token. The browser then tries to use the same (now
  // invalidated) refresh token, causing INITIAL_SESSION to fire with null
  // and all data to show as zeros after a page refresh.
  //
  // Instead: just check whether a Supabase auth cookie exists. The browser
  // Supabase client handles all token refresh via onAuthStateChange.
  const hasSession = request.cookies.getAll().some(
    c => c.name.startsWith('sb-') && c.name.includes('-auth-token')
  )

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED.some(r => pathname.startsWith(r))
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))

  if (!hasSession && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (hasSession && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  const response = NextResponse.next({ request })
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
