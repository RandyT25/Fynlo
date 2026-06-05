'use client'

import { useAuthStore } from '@/store/auth.store'

export function useCurrency(): string {
  const { profile } = useAuthStore()
  return profile?.currency ?? 'USD'
}
