'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { formatCurrency } from '@/lib/utils/format'
import { CHART_COLORS } from '@/lib/utils/colors'
import { format, subMonths, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | '2Y'

const RANGES: { label: TimeRange; months?: number; days?: number }[] = [
  { label: '1W', days: 7 },
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1Y', months: 12 },
  { label: '2Y', months: 24 },
]

export function AnalyticsContent() {
  const [range, setRange] = useState<TimeRange>('1M')
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  useEffect(() => { fetchAnalytics() }, [range])

  const getDateRange = () => {
    const now = new Date()
    const r = RANGES.find(r => r.label === range)!
    const from = r.days
      ? format(subDays(now, r.days), 'yyyy-MM-dd')
      : format(subMonths(now, r.months!), 'yyyy-MM-dd')
    return { from, to: format(now, 'yyyy-MM-dd') }
  }

  const fetchAnalytics = async () => {
    setIsLoading(true)
    const { from, to } = getDateRange()

    const { data: txns } = await supabase
      .from('transactions')
      .select('type,amount,date,category_id,category:categories(name,color)')
      .is('deleted_at', null)
      .gte('date', from)
      .lte('date', to)
      .order('date')

    const all = (txns ?? []) as Array<{ type: string; amount: number; date: string; category: { name: string; color: string } | null }>

    // Build running balance over time
    const dayMap: Record<string, { date: string; income: number; expenses: number }> = {}
    for (const t of all) {
      const key = t.date.slice(0, 7) // group by month
      if (!dayMap[key]) dayMap[key] = { date: key, income: 0, expenses: 0 }
      if (t.type === 'income' || t.type === 'refund') dayMap[key].income += t.amount
      else if (t.type === 'expense') dayMap[key].expenses += t.amount
    }

    // Running balance line chart
    let running = 0
    const chartData = Object.values(dayMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(m => {
        running += m.income - m.expenses
        return { month: format(new Date(m.date + '-01'), 'MMM yy'), balance: running, income: m.income, expenses: m.expenses }
      })

    // Category breakdown
    const catMap: Record<string, { name: string; amount: number; color: string }> = {}
    for (const t of all.filter(t => t.type === 'expense')) {
      const key = t.category?.name ?? 'Uncategorized'
      if (!catMap[key]) catMap[key] = { name: key, amount: 0, color: t.category?.color ?? '#6B7280' }
      catMap[key].amount += t.amount
    }
    const categories = Object.values(catMap).sort((a, b) => b.amount - a.amount).slice(0, 8)
    const totalExpenses = all.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const totalIncome = all.filter(t => t.type === 'income' || t.type === 'refund').reduce((s, t) => s + t.amount, 0)

    setData({ chartData, categories, totalExpenses, totalIncome, periodBalance: totalIncome - totalExpenses })
    setIsLoading(false)
  }

  const gridColor = isDark ? '#1e293b' : '#f1f5f9'
  const axisStyle = { fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-card border border-border rounded-xl p-2.5 shadow-lg text-xs">
        <p className="font-semibold mb-1.5">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-4 space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-2xl px-4 py-3">
          <p className="text-xs text-muted-foreground mb-0.5">Account Balance</p>
          {isLoading
            ? <Skeleton className="h-5 w-24" />
            : <p className="font-bold text-base">{formatCurrency((data?.chartData?.at(-1)?.balance) ?? 0)}</p>
          }
        </div>
        <div className="bg-muted/50 rounded-2xl px-4 py-3">
          <p className="text-xs text-muted-foreground mb-0.5">Period Balance</p>
          {isLoading
            ? <Skeleton className="h-5 w-24" />
            : <p className={cn('font-bold text-base', (data?.periodBalance ?? 0) >= 0 ? 'text-green-500' : 'text-destructive')}>
                {(data?.periodBalance ?? 0) >= 0 ? '+' : ''}{formatCurrency(data?.periodBalance ?? 0)}
              </p>
          }
        </div>
      </div>

      {/* Time range pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {RANGES.map(r => (
          <button
            key={r.label}
            onClick={() => setRange(r.label)}
            className={cn(
              'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
              range === r.label
                ? 'gradient-primary text-white shadow-sm'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-card rounded-3xl p-4 border border-border">
        {isLoading ? (
          <Skeleton className="h-[180px] w-full rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data?.chartData ?? []}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="balance" name="Balance" stroke="#8B5CF6" strokeWidth={2.5} fill="url(#balanceGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Categories */}
      <div>
        <h2 className="font-semibold mb-3">Categories</h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1"><Skeleton className="h-4 w-28 mb-1" /><Skeleton className="h-1.5 w-full rounded-full" /></div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : (data?.categories ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No spending data for this period</p>
        ) : (
          <div className="space-y-3">
            {(data?.categories ?? []).map((cat: any, i: number) => {
              const pct = data?.totalExpenses > 0 ? (cat.amount / data.totalExpenses) * 100 : 0
              return (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                    style={{ background: `conic-gradient(${cat.color} ${pct * 3.6}deg, #e2e8f0 0deg)` }}
                  >
                    <div className="w-7 h-7 rounded-full bg-background flex items-center justify-center">
                      <span style={{ color: cat.color }} className="font-semibold text-[10px]">{Math.round(pct)}%</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cat.name}</p>
                    <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                    </div>
                  </div>
                  <p className="text-sm font-semibold shrink-0">{formatCurrency(cat.amount)}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
