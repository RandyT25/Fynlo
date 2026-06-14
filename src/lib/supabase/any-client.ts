import { createBrowserClient } from '@supabase/ssr'

export function createAnyClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createBrowserClient(url, key) as any
}
