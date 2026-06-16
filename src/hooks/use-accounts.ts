'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import type { Account } from '@/types/database'
import { calculateNetBalance } from '@/lib/utils/index'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'

export function useAccounts() {
  const { user, isLoading: authLoading } = useAuthStore()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('accounts')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (err) {
      setError(err.message)
    } else {
      setAccounts(data ?? [])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (authLoading || !user) { setIsLoading(false); return }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAccounts()
  }, [fetchAccounts, authLoading, user?.id])

  const totalBalance = calculateNetBalance(accounts.filter(a => a.is_active))

  const deleteAccount = async (id: string) => {
    const supabase = createClient()
    const { error: err } = await supabase
      .from('accounts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (err) {
      toast.error('Failed to delete account')
    } else {
      toast.success('Account deleted')
      setAccounts(prev => prev.filter(a => a.id !== id))
    }
  }

  return { accounts, isLoading, error, totalBalance, refetch: fetchAccounts, deleteAccount }
}
