'use client'

import { useRouter } from 'next/navigation'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { useAuthStore } from '@/store/auth.store'

export function useAuth() {
  const { user, profile, isLoading, reset } = useAuthStore()
  const router = useRouter()

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    reset()
    router.push('/login')
  }

  return { user, profile, isLoading, signOut }
}
