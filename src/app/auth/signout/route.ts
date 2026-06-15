import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Server-side signout: clears the SSR session cookie the middleware reads.
// Browser-side supabase.auth.signOut() alone cannot clear httpOnly cookies,
// so navigating here ensures the session is properly invalidated server-side.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', request.url))
}
