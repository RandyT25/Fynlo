'use client'

import { useState, useEffect, useCallback } from 'react'
import { getDataClient } from '@/lib/supabase/any-client'
import type { Transaction } from '@/types/database'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'

interface TransactionFilters {
  accountId?: string
  categoryId?: string
  type?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  limit?: number
}

export function useTransactions(filters: TransactionFilters = {}) {
  const { user, isLoading: authLoading } = useAuthStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(0)

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const supabase = getDataClient()

    let query = supabase
      .from('transactions')
      .select('*, account:accounts!account_id(id,name,color,icon,type), to_account:accounts!to_account_id(id,name,color,icon,type)', { count: 'exact' })
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (filters.accountId) query = query.eq('account_id', filters.accountId)
    if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
    if (filters.type) query = query.eq('type', filters.type)
    if (filters.dateFrom) query = query.gte('date', filters.dateFrom)
    if (filters.dateTo) query = query.lte('date', filters.dateTo)
    if (filters.search) query = query.ilike('description', `%${filters.search}%`)
    if (filters.limit) query = query.limit(filters.limit)

    const [{ data, error: err, count: total }, { data: cats }] = await Promise.all([
      query,
      supabase.from('categories').select('id,name,icon,color,parent_id').is('deleted_at', null),
    ])

    if (err) {
      setError(err.message)
    } else {
      type CatRow = { id: string; name: string; icon: string | null; color: string | null; parent_id: string | null }
      const catById: Record<string, CatRow> = {}
      for (const c of (cats ?? [])) catById[c.id] = c as CatRow
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const merged = (data ?? []).map((t: any) => ({
        ...t,
        category: t.category_id ? (catById[t.category_id] ?? null) : null,
      }))
      setTransactions(merged as Transaction[])
      setCount(total ?? 0)
    }
    setIsLoading(false)
  }, [filters.accountId, filters.categoryId, filters.type, filters.dateFrom, filters.dateTo, filters.search, filters.limit])

  useEffect(() => {
    if (authLoading) return; if (!user) { setIsLoading(false); return }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions()
  }, [fetchTransactions, authLoading, user?.id])

  const deleteTransaction = async (id: string) => {
    const supabase = getDataClient()
    const { error: err } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (err) {
      toast.error('Failed to delete transaction')
    } else {
      toast.success('Transaction deleted')
      setTransactions(prev => prev.filter(t => t.id !== id))
    }
  }

  return { transactions, isLoading, error, count, refetch: fetchTransactions, deleteTransaction }
}
