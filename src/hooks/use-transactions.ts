'use client'

import { useState, useEffect, useCallback } from 'react'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import type { Transaction } from '@/types/database'
import { toast } from 'sonner'

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
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(0)

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()

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
      const catById: Record<string, any> = {}
      for (const c of (cats ?? [])) catById[c.id] = c
      const merged = (data ?? []).map((t: any) => ({
        ...t,
        category: t.category_id ? (catById[t.category_id] ?? null) : null,
      }))
      setTransactions(merged as Transaction[])
      setCount(total ?? 0)
    }
    setIsLoading(false)
  }, [JSON.stringify(filters)])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const deleteTransaction = async (id: string) => {
    const supabase = createClient()
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
