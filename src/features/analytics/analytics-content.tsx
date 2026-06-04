'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingPage } from '@/components/shared/loading-spinner'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { formatCurrency } from '@/lib/utils/format'
import { CHART_COLORS } from '@/lib/utils/colors'
import { format, subMonths, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { useTheme } from 'next-themes'

type TimeRange = '7D' | '30D' | '90D' | '6M' | '1Y' | 'ALL'

export function AnalyticsContent() {
  const [range, setRange] = useState<TimeRange>('30D')
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  useEffect(() => { fetchAnalytics() }, [range])

  const getDateRange = () => {
    const now = new Date()
    switch (range) {
      case '7D': return { from: format(subDays(now, 7), 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') }
      case '30D': return { from: format(subDays(now, 30), 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') }
      case '90D': return { from: format(subDays(now, 90), 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') }
      case '6M': return { from: format(subMonths(now, 6), 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') }
      case '1Y': return { from: format(subMonths(now, 12), 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') }
      default: return { from: '2020-01-01', to: format(now, 'yyyy-MM-dd') }
    }
  }

  const fetchAnalytics = async () => {
    setIsLoading(true)
    const { from, to } = getDateRange()

    const [txnsResult, accountsResult] = await Promise.all([
      supabase.from('transactions').select('type,amount,date,category_id, category:categories(name,color)').is('deleted_at', null).gte('date', from).lte('date', to).order('date'),
      supabase.from('accounts').select('type,balance,name,color').is('deleted_at', null).eq('is_active', true),
    ])
    const txns = txnsResult.data as Array<{ type: string; amount: number; date: string; category_id: string | null; category: { name: string; color: string } | null }> | null
    const accounts = accountsResult.data as Array<{ type: string; balance: number; name: string; color: string }> | null

    // Monthly aggregation
    const monthlyMap: Record<string, { month: string; income: number; expenses: number; net: number }> = {}
    for (const t of txns ?? []) {
      const month = format(new Date(t.date), 'MMM yy')
      if (!monthlyMap[month]) monthlyMap[month] = { month, income: 0, expenses: 0, net: 0 }
      if (t.type === 'income' || t.type === 'refund') {
        monthlyMap[month].income += t.amount
        monthlyMap[month].net += t.amount
      } else if (t.type === 'expense') {
        monthlyMap[month].expenses += t.amount
        monthlyMap[month].net -= t.amount
      }
    }

    // Category breakdown
    const catMap: Record<string, { name: string; amount: number; color: string }> = {}
    for (const t of (txns ?? []).filter(t => t.type === 'expense')) {
      const cat = t.category as any
      const key = cat?.name ?? 'Uncategorized'
      if (!catMap[key]) catMap[key] = { name: key, amount: 0, color: cat?.color ?? '#6B7280' }
      catMap[key].amount += t.amount
    }

    // Account allocation
    const accountAllocation = (accounts ?? []).map((a: any) => ({
      name: a.name,
      value: Math.abs(a.balance),
      color: a.color ?? '#3B82F6',
    }))

    setData({
      monthly: Object.values(monthlyMap),
      categoryBreakdown: Object.values(catMap).sort((a, b) => b.amount - a.amount).slice(0, 10),
      accountAllocation,
      totalIncome: (txns ?? []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      totalExpenses: (txns ?? []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    })
    setIsLoading(false)
  }

  const axisStyle = { fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }
  const gridColor = isDark ? '#1e293b' : '#f1f5f9'

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground capitalize">{p.name}:</span>
            <span className="font-medium">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    )
  }

  if (isLoading) return <LoadingPage />

  const RANGES: TimeRange[] = ['7D', '30D', '90D', '6M', '1Y', 'ALL']

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Time range selector */}
      <div className="flex items-center gap-2">
        {RANGES.map(r => (
          <Button
            key={r}
            variant={range === r ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRange(r)}
            className={range === r ? 'gradient-primary border-0' : ''}
          >
            {r}
          </Button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="gradient-primary text-white">
          <CardContent className="p-4">
            <p className="text-white/70 text-sm">Total Income</p>
            <p className="text-2xl font-bold">{formatCurrency(data?.totalIncome ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-red-500">{formatCurrency(data?.totalExpenses ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Net Savings</p>
            <p className={`text-2xl font-bold ${(data?.totalIncome - data?.totalExpenses) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency((data?.totalIncome ?? 0) - (data?.totalExpenses ?? 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="spending">Spending</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Cash Flow Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data?.monthly ?? []}>
                  <defs>
                    <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={2} fill="url(#income)" />
                  <Area type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} fill="url(#expenses)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Net Flow</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.monthly ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="net" radius={[4,4,0,0]}>
                    {(data?.monthly ?? []).map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.net >= 0 ? '#22C55E' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spending" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Spending by Category</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={data?.categoryBreakdown ?? []} cx="50%" cy="50%" outerRadius={100} dataKey="amount" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {(data?.categoryBreakdown ?? []).map((_: any, i: number) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Top Categories</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(data?.categoryBreakdown ?? []).slice(0, 8).map((cat: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-sm flex-1 truncate">{cat.name}</span>
                      <span className="text-sm font-semibold shrink-0">{formatCurrency(cat.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="income" className="mt-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Income Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.monthly ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Account Allocation</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={data?.accountAllocation ?? []} cx="50%" cy="50%" outerRadius={100} dataKey="value">
                      {(data?.accountAllocation ?? []).map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.color ?? CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
