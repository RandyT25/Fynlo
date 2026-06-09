import { NextResponse, type NextRequest } from 'next/server'

// BYPASS_AUTH — flip to false and restore the updateSession call when Supabase is live
const BYPASS_AUTH = false

export async function proxy(request: NextRequest) {
  if (BYPASS_AUTH) {
    const { pathname } = request.nextUrl
    // Redirect auth pages straight to the app
    if (pathname === '/' || pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  const { updateSession } = await import('@/lib/supabase/middleware')
  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
