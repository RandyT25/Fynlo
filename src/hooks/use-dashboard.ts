'use client'

import { useState, useEffect } from 'react'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import type { Account, Transaction, Budget, Goal, BillReminder } from '@/types/database'
import { calculateNetBalance } from '@/lib/utils/index'
import { useAuthStore } from '@/store/auth.store'

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
  const { user, isLoading: authLoading } = useAuthStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return; if (!user) { setIsLoading(false); return }
    fetchDashboardData()
  }, [authLoading, user?.id])

  async function fetchDashboardData() {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    const now = new Date()
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

    const [
      { data: accounts, error: acctErr },
      { data: recentTxn, error: recentErr },
      { data: monthlyTxn, error: monthlyErr },
      { data: budgets, error: budgetsErr },
      { data: goals, error: goalsErr },
      { data: bills, error: billsErr },
      { data: cats, error: catsErr },
    ] = await Promise.all([
      supabase.from('accounts').select('*').is('deleted_at', null).eq('is_active', true),
      supabase.from('transactions').select('*, account:accounts!account_id(id,name,color,icon,type)').is('deleted_at', null).order('date', { ascending: false }).limit(10),
      supabase.from('transactions').select('type,amount').is('deleted_at', null).gte('date', monthStart).lte('date', monthEnd),
      supabase.from('budgets').select('*, category:categories(id,name,icon,color)').is('deleted_at', null).eq('is_active', true),
      supabase.from('goals').select('*').is('deleted_at', null).eq('is_completed', false).order('priority', { ascending: false }).limit(6),
      supabase.from('bill_reminders').select('*').is('deleted_at', null).eq('is_completed', false).gte('due_date', format(now, 'yyyy-MM-dd')).order('due_date', { ascending: true }).limit(5),
      supabase.from('categories').select('id,name,icon,color').is('deleted_at', null),
    ])

    // Accounts is the critical query — without it we can't compute balance
    if (acctErr) {
      setError(acctErr.message)
      setIsLoading(false)
      return
    }
    // Non-critical query errors: surface as a warning but continue with partial data
    const sideErr = recentErr ?? monthlyErr ?? budgetsErr ?? goalsErr ?? billsErr ?? catsErr
    if (sideErr) setError(sideErr.message)

    type CatInfo = { id: string; name: string; icon: string | null; color: string | null }
    const catById: Record<string, CatInfo> = {}
    for (const c of (cats ?? [])) catById[c.id] = c as CatInfo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentWithCats = (recentTxn ?? []).map((t: any) => ({
      ...t,
      category: t.category_id ? (catById[t.category_id] ?? null) : null,
    }))

    const accts = (accounts ?? []) as Account[]
    const totalBalance = calculateNetBalance(accts)

    const txns = (monthlyTxn ?? []) as Array<{ type: string; amount: number }>
    const monthlyIncome = txns.filter(t => t.type === 'income' || t.type === 'refund').reduce((s, t) => s + t.amount, 0)
    const monthlyExpenses = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
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
  const now = new Date()
  const oldest = format(new Date(now.getFullYear(), now.getMonth() - (months - 1), 1), 'yyyy-MM-dd')

  const { data } = await supabase
    .from('transactions')
    .select('type,amount,date')
    .is('deleted_at', null)
    .gte('date', oldest)

  const monthMap: Record<string, { income: number; expenses: number }> = {}
  for (const t of (data ?? []) as Array<{ type: string; amount: number; date: string }>) {
    const key = t.date.slice(0, 7)
    if (!monthMap[key]) monthMap[key] = { income: 0, expenses: 0 }
    if (t.type === 'income' || t.type === 'refund') monthMap[key].income += t.amount
    else if (t.type === 'expense') monthMap[key].expenses += t.amount
  }

  const results: Array<{ month: string; income: number; expenses: number; net: number }> = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = format(d, 'yyyy-MM')
    const { income = 0, expenses = 0 } = monthMap[key] ?? {}
    results.push({ month: format(d, 'MMM'), income, expenses, net: income - expenses })
  }
  return results
}

async function getCategorySpending(supabase: ReturnType<typeof createClient>, start: string, end: string) {
  const [{ data }, { data: cats }] = await Promise.all([
    supabase.from('transactions').select('amount,category_id').eq('type', 'expense').is('deleted_at', null).gte('date', start).lte('date', end),
    supabase.from('categories').select('id,name,color').is('deleted_at', null),
  ])

  if (!data) return []

  const catById: Record<string, { name: string; color: string }> = {}
  for (const c of (cats ?? [])) catById[c.id] = { name: c.name, color: c.color }

  const grouped: Record<string, { name: string; amount: number; color: string }> = {}
  let total = 0

  for (const t of data) {
    const cat = t.category_id ? (catById[t.category_id] ?? null) : null
    const key = t.category_id ?? 'uncategorized'
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
