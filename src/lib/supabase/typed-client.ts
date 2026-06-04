import { createClient } from './client'

type SupabaseClient = ReturnType<typeof createClient>

export function db(supabase: SupabaseClient) {
  return {
    from: (table: string) => (supabase as any).from(table)
  }
}
