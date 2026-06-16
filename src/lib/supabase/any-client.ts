import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createAnyClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createBrowserClient(url, key) as any
}

// A data-only Supabase client that uses a stored access token directly.
// Setting the `accessToken` option makes _getAccessToken() call our function
// instead of auth.getSession() — so it never triggers a token refresh network
// request and can never hang, even if the Supabase auth endpoint is unreachable.
export function createDataClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
  return createClient<Database>(url, key, {
    accessToken: async () => accessToken,
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
