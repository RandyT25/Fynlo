'use client'

import { useAuthStore } from '@/store/auth.store'

export function useAuth() {
  const { user, profile, isLoading, reset } = useAuthStore()

  const signOut = () => {
    reset()
    // Full page navigation so the server-side route handler can clear the SSR
    // session cookie — browser-side supabase.auth.signOut() cannot do this.
    window.location.assign('/auth/signout')
  }

  return { user, profile, isLoading, signOut }
}
