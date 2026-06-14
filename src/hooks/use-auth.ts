'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { useAuthStore } from '@/store/auth.store'

export function useAuth() {
  const { user, profile, isLoading, setUser, setProfile, setLoading, reset } = useAuthStore()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (!profileData) {
          // No profile row yet — create it (user predates the signup trigger)
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({ id: session.user.id, email: session.user.email ?? session.user.id })
          if (!upsertError) {
            const { data: created } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle()
            setProfile(created)
          } else {
            // Upsert blocked — set a minimal in-memory profile to unblock the UI
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setProfile({ id: session.user.id, email: session.user.email ?? '' } as any)
          }
        } else {
          setProfile(profileData)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    reset()
    router.push('/login')
  }

  return { user, profile, isLoading, signOut }
}
