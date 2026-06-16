import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  accessToken: string | null
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  setAccessToken: (token: string | null) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isLoading: false,
      accessToken: null,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      setAccessToken: (accessToken) => set({ accessToken }),
      reset: () => set({ user: null, profile: null, isLoading: false, accessToken: null }),
    }),
    {
      name: 'fynlo-auth',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
)
