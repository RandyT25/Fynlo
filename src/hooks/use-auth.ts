'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { useAuthStore } from '@/store/auth.store'

export function useAuth() {
  const { user, profile, isLoading, setUser, setProfile, setLoading, reset } = useAuthStore()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(profileData)
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
