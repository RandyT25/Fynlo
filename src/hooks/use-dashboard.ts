'use client'

import { useState, useEffect } from 'react'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import type { Account, Transaction, Budget, Goal, BillReminder } from '@/types/database'

interface DashboardData {
  accounts: Account[]
  recentTransactions: Transaction[]
  budgets: Budget[]
  goals: Goal[]
  upcomingBills: BillReminder[]
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number
  netWorth: number
  cashFlowData: Array<{ month: string; income: number; expenses: number; net: number }>
  categorySpending: Array<{ name: string; amount: number; color: string; percentage: number }>
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    const now = new Date()
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

    const [
      { data: accounts },
      { data: recentTxn },
      { data: monthlyTxn },
      { data: budgets },
      { data: goals },
      { data: bills },
      { data: cats },
    ] = await Promise.all([
      supabase.from('accounts').select('*').is('deleted_at', null).eq('is_active', true),
      supabase.from('transactions').select('*, account:accounts!account_id(id,name,color,icon,type)').is('deleted_at', null).order('date', { ascending: false }).limit(10),
      supabase.from('transactions').select('type,amount').is('deleted_at', null).gte('date', monthStart).lte('date', monthEnd),
      supabase.from('budgets').select('*, category:categories(id,name,icon,color)').is('deleted_at', null).eq('is_active', true),
      supabase.from('goals').select('*').is('deleted_at', null).eq('is_completed', false).order('priority', { ascending: false }).limit(6),
      supabase.from('bill_reminders').select('*').is('deleted_at', null).eq('is_completed', false).gte('due_date', format(now, 'yyyy-MM-dd')).order('due_date', { ascending: true }).limit(5),
      supabase.from('categories').select('id,name,icon,color').is('deleted_at', null),
    ])

    const catById: Record<string, any> = {}
    for (const c of (cats ?? [])) catById[c.id] = c
    const recentWithCats = (recentTxn ?? []).map((t: any) => ({
      ...t,
      category: t.category_id ? (catById[t.category_id] ?? null) : null,
    }))

    const accts: any[] = accounts ?? []
    const totalBalance = accts.reduce((s: number, a: any) => {
      if (a.type === 'credit_card' || a.type === 'loan') return s - Math.abs(a.balance)
      return s + a.balance
    }, 0)

    const txns: any[] = monthlyTxn ?? []
    const monthlyIncome = txns.filter((t: any) => t.type === 'income' || t.type === 'refund').reduce((s: number, t: any) => s + t.amount, 0)
    const monthlyExpenses = txns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0)
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0

    // Cash flow for last 6 months
    const cashFlowData = await getCashFlowData(supabase, 6)
    const categorySpending = await getCategorySpending(supabase, monthStart, monthEnd)

    setData({
      accounts: accts,
      recentTransactions: recentWithCats as Transaction[],
      budgets: (budgets as Budget[]) ?? [],
      goals: (goals as Goal[]) ?? [],
      upcomingBills: (bills as BillReminder[]) ?? [],
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      netWorth: totalBalance,
      cashFlowData,
      categorySpending,
    })
    setIsLoading(false)
  }

  return { data, isLoading, error, refetch: fetchDashboardData }
}

async function getCashFlowData(supabase: ReturnType<typeof createClient>, months: number) {
  const results: Array<{ month: string; income: number; expenses: number; net: number }> = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = format(startOfMonth(d), 'yyyy-MM-dd')
    const end = format(endOfMonth(d), 'yyyy-MM-dd')

    const { data } = await supabase
      .from('transactions')
      .select('type,amount')
      .is('deleted_at', null)
      .gte('date', start)
      .lte('date', end)

    const txns: any[] = data ?? []
    const income = txns.filter((t: any) => t.type === 'income' || t.type === 'refund').reduce((s: number, t: any) => s + t.amount, 0)
    const expenses = txns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0)

    results.push({ month: format(d, 'MMM'), income, expenses, net: income - expenses })
  }
  return results
}

async function getCategorySpending(supabase: ReturnType<typeof createClient>, start: string, end: string) {
  const { data } = await supabase
    .from('transactions')
    .select('amount, category:categories(id,name,color)')
    .eq('type', 'expense')
    .is('deleted_at', null)
    .gte('date', start)
    .lte('date', end)

  if (!data) return []

  const grouped: Record<string, { name: string; amount: number; color: string }> = {}
  let total = 0

  for (const t of data) {
    const cat = t.category as { id: string; name: string; color: string } | null
    const key = cat?.id ?? 'uncategorized'
    const name = cat?.name ?? 'Uncategorized'
    const color = cat?.color ?? '#6B7280'
    if (!grouped[key]) grouped[key] = { name, amount: 0, color }
    grouped[key].amount += t.amount
    total += t.amount
  }

  return Object.values(grouped)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)
    .map(item => ({ ...item, percentage: total > 0 ? (item.amount / total) * 100 : 0 }))
}
