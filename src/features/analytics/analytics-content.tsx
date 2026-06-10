'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import { TrendingUp, TrendingDown, Wallet, ChevronDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { formatCurrency } from '@/lib/utils/format'
import { useCurrency } from '@/hooks/use-currency'
import { format, subMonths, subDays } from 'date-fns'
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }
  const currency = useCurrency()
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

  const getGroupKey = (dateStr: string) => {
    if (range === '1W' || range === '1M') return dateStr.slice(0, 10)
    return dateStr.slice(0, 7)
  }

  const formatGroupLabel = (key: string) => {
    if (range === '1W' || range === '1M') return format(new Date(key), 'MMM d')
    return format(new Date(key + '-01'), 'MMM yy')
  }

  const fetchAnalytics = async () => {
    setIsLoading(true)
    const { from, to } = getDateRange()

    const [{ data: txns }, { data: cats }] = await Promise.all([
      supabase.from('transactions').select('type,amount,date,description,category_id').is('deleted_at', null).gte('date', from).lte('date', to).order('date', { ascending: false }),
      supabase.from('categories').select('id,name,color').is('deleted_at', null),
    ])

    const catById: Record<string, { name: string; color: string }> = {}
    for (const c of (cats ?? [])) catById[c.id] = { name: c.name, color: c.color }

    const all = (txns ?? []).map((t: any) => ({
      ...t,
      category: t.category_id ? (catById[t.category_id] ?? null) : null,
    })) as Array<{ type: string; amount: number; date: string; description: string; category_id: string | null; category: { name: string; color: string } | null }>

    const dayMap: Record<string, { date: string; income: number; expenses: number }> = {}
    for (const t of all) {
      const key = getGroupKey(t.date)
      if (!dayMap[key]) dayMap[key] = { date: key, income: 0, expenses: 0 }
      if (t.type === 'income' || t.type === 'refund') dayMap[key].income += t.amount
      else if (t.type === 'expense') dayMap[key].expenses += t.amount
    }

    let running = 0
    const chartData = Object.values(dayMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(m => {
        running += m.income - m.expenses
        return { month: formatGroupLabel(m.date), balance: running, income: m.income, expenses: m.expenses }
      })

    const catMap: Record<string, { name: string; amount: number; color: string; transactions: Array<{ date: string; description: string; amount: number }> }> = {}
    for (const t of all.filter(t => t.type === 'expense')) {
      const key = t.category?.name ?? 'Uncategorized'
      if (!catMap[key]) catMap[key] = { name: key, amount: 0, color: t.category?.color ?? '#6B7280', transactions: [] }
      catMap[key].amount += t.amount
      catMap[key].transactions.push({ date: t.date, description: t.description, amount: t.amount })
    }
    const categories = Object.values(catMap).sort((a, b) => b.amount - a.amount).slice(0, 8)
    const totalExpenses = all.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const totalIncome = all.filter(t => t.type === 'income' || t.type === 'refund').reduce((s, t) => s + t.amount, 0)

    setData({ chartData, categories, totalExpenses, totalIncome, periodBalance: totalIncome - totalExpenses })
    setIsLoading(false)
  }

  const axisStyle = { fontSize: 10, fill: isDark ? '#64748b' : '#94a3b8' }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border/60 rounded-2xl px-3 py-2.5 shadow-xl text-xs">
        <p className="font-semibold text-foreground mb-1.5">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-semibold">{formatCurrency(p.value, currency)}</span>
          </div>
        ))}
      </div>
    )
  }

  const periodBalance = data?.periodBalance ?? 0
  const isPositive = periodBalance >= 0

  return (
    <div className="flex flex-col min-h-full pb-6">

      {/* Hero summary */}
      <div className="gradient-primary px-5 pt-5 pb-7 rounded-b-[2rem]">
        <p className="text-white/60 text-xs font-medium mb-1">Period Balance</p>
        {isLoading
          ? <Skeleton className="h-9 w-40 bg-white/20 mb-3" />
          : <p className="text-3xl font-bold text-white mb-3">
              {isPositive ? '+' : ''}{formatCurrency(periodBalance, currency)}
            </p>
        }
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white/12 backdrop-blur-sm rounded-2xl px-3.5 py-3 border border-white/10">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3 text-green-300" />
              <span className="text-white/60 text-[11px]">Income</span>
            </div>
            {isLoading
              ? <Skeleton className="h-4 w-20 bg-white/20" />
              : <p className="text-white font-bold text-sm">{formatCurrency(data?.totalIncome ?? 0, currency)}</p>
            }
          </div>
          <div className="bg-white/12 backdrop-blur-sm rounded-2xl px-3.5 py-3 border border-white/10">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3 h-3 text-red-300" />
              <span className="text-white/60 text-[11px]">Expenses</span>
            </div>
            {isLoading
              ? <Skeleton className="h-4 w-20 bg-white/20" />
              : <p className="text-white font-bold text-sm">{formatCurrency(data?.totalExpenses ?? 0, currency)}</p>
            }
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Time range pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {RANGES.map(r => (
            <button
              key={r.label}
              onClick={() => setRange(r.label)}
              className={cn(
                'shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all',
                range === r.label
                  ? 'gradient-primary text-white shadow-md'
                  : 'bg-muted/60 text-muted-foreground'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-card rounded-3xl pt-4 pb-2 px-2 border border-border/40 shadow-sm">
          {isLoading ? (
            <Skeleton className="h-[180px] w-full rounded-xl mx-2" />
          ) : (data?.chartData ?? []).length === 0 ? (
            <div className="h-[180px] flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">No data for this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data?.chartData ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={axisStyle}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  dy={4}
                />
                <YAxis
                  tick={axisStyle}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => {
                    const abs = Math.abs(v)
                    if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
                    if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}K`
                    return String(v)
                  }}
                  width={44}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#8B5CF6', strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.5 }} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  name="Balance"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  fill="url(#balanceGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base">Top Spending</h2>
            {!isLoading && data?.totalExpenses > 0 && (
              <span className="text-xs text-muted-foreground font-medium">
                {formatCurrency(data.totalExpenses, currency)} total
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card rounded-2xl p-3.5 border border-border/40 flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-16 shrink-0" />
                </div>
              ))}
            </div>
          ) : (data?.categories ?? []).length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Wallet className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">No spending this period</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(data?.categories ?? []).map((cat: any, i: number) => {
                const pct = data?.totalExpenses > 0 ? (cat.amount / data.totalExpenses) * 100 : 0
                const isExpanded = expandedCategories.has(cat.name)
                return (
                  <div key={i} className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
                    {/* Header row — tap to expand */}
                    <button
                      className="w-full flex items-center gap-3 px-3.5 py-3 active:bg-muted/40 transition-colors text-left"
                      onClick={() => toggleCategory(cat.name)}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm text-white"
                        style={{ backgroundColor: cat.color }}
                      >
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="font-semibold text-sm truncate">{cat.name}</p>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span
                              className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: `${cat.color}22`, color: cat.color }}
                            >
                              {Math.round(pct)}%
                            </span>
                            <span className="text-sm font-bold">{formatCurrency(cat.amount, currency)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: cat.color }}
                          />
                        </div>
                      </div>
                      <ChevronDown
                        className={cn('w-4 h-4 text-muted-foreground shrink-0 ml-1 transition-transform duration-200', isExpanded && 'rotate-180')}
                      />
                    </button>

                    {/* Expanded transactions */}
                    {isExpanded && (
                      <div className="border-t border-border/40">
                        <div className="px-3.5 py-1 flex justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                          <span>{cat.transactions.length} transaction{cat.transactions.length !== 1 ? 's' : ''}</span>
                        </div>
                        {cat.transactions.map((txn: any, j: number) => (
                          <div
                            key={j}
                            className={cn('flex items-center gap-3 px-3.5 py-2.5', j > 0 && 'border-t border-border/20')}
                          >
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{txn.description}</p>
                              <p className="text-[11px] text-muted-foreground">{format(new Date(txn.date), 'MMM d, yyyy')}</p>
                            </div>
                            <span className="text-sm font-semibold text-destructive shrink-0">
                              -{formatCurrency(txn.amount, currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
