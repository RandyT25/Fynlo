'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Plus, ChevronRight, Bell } from 'lucide-react'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { motion } from 'framer-motion'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useDashboard } from '@/hooks/use-dashboard'
import { useAuth } from '@/hooks/use-auth'
import { TransactionForm } from '@/features/transactions/transaction-form'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { TransactionWithRelations } from '@/types/database'

function groupByDate(transactions: TransactionWithRelations[]) {
  const map: Record<string, TransactionWithRelations[]> = {}
  for (const t of transactions) {
    if (!map[t.date]) map[t.date] = []
    map[t.date].push(t)
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, txns]) => ({ date, transactions: txns }))
}

function dateLabel(date: string) {
  const d = parseISO(date)
  if (isToday(d)) return `Today, ${format(d, 'MMMM d')}`
  if (isYesterday(d)) return `Yesterday, ${format(d, 'MMMM d')}`
  return format(d, 'EEEE, MMMM d')
}

export function DashboardContent() {
  const { data, isLoading, refetch } = useDashboard()
  const { profile } = useAuth()
  const [showAdd, setShowAdd] = useState(false)

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? 'U'

  const netMonth = (data?.monthlyIncome ?? 0) - (data?.monthlyExpenses ?? 0)
  const grouped = groupByDate((data?.recentTransactions ?? []) as TransactionWithRelations[])

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero balance */}
      <div className="px-5 pt-5 pb-7 gradient-primary text-white rounded-b-3xl">
        {/* Top row: avatar + bell */}
        <div className="flex items-center justify-between mb-4">
          <a href="/settings">
            <Avatar className="w-9 h-9 ring-2 ring-white/30">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-white/20 text-white text-sm font-bold">{initials}</AvatarFallback>
            </Avatar>
          </a>
          <a href="/notifications">
            <div className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
          </a>
        </div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-white/70 text-xs font-medium">{format(new Date(), 'MMMM yyyy')} Balance</span>
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', netMonth >= 0 ? 'bg-green-500/30 text-green-200' : 'bg-red-400/30 text-red-200')}>
            {netMonth >= 0 ? '+' : ''}{formatCurrency(netMonth)}
          </span>
        </div>
        <p className="text-4xl font-bold tracking-tight mt-1">
          {isLoading ? '—' : formatCurrency(data?.totalBalance ?? 0)}
        </p>

        <div className="flex gap-3 mt-5">
          <div className="flex-1 bg-white/15 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3 text-green-300" />
              <span className="text-white/60 text-[11px]">Income</span>
            </div>
            {isLoading
              ? <Skeleton className="h-5 w-20 bg-white/20" />
              : <p className="text-white font-semibold text-sm">{formatCurrency(data?.monthlyIncome ?? 0)}</p>
            }
          </div>
          <div className="flex-1 bg-white/15 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3 h-3 text-red-300" />
              <span className="text-white/60 text-[11px]">Expenses</span>
            </div>
            {isLoading
              ? <Skeleton className="h-5 w-20 bg-white/20" />
              : <p className="text-white font-semibold text-sm">{formatCurrency(data?.monthlyExpenses ?? 0)}</p>
            }
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="flex-1 px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">Recent Transactions</h2>
          <a href="/transactions" className="flex items-center gap-0.5 text-primary text-sm font-medium">
            See all <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
                <div className="flex-1"><Skeleton className="h-4 w-36 mb-1.5" /><Skeleton className="h-3 w-20" /></div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs mt-1">Tap + to add your first one</p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(group => (
              <div key={group.date}>
                <p className="text-xs font-medium text-muted-foreground mb-2">{dateLabel(group.date)}</p>
                <div className="space-y-1">
                  {group.transactions.map((txn, i) => {
                    const cat = (txn as any).category
                    const isCredit = txn.type === 'income' || txn.type === 'refund'
                    return (
                      <motion.div
                        key={txn.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 py-2"
                      >
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-base shrink-0"
                          style={{ backgroundColor: cat?.color ? `${cat.color}20` : '#6B728020' }}
                        >
                          {cat?.icon ?? '💳'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{txn.description}</p>
                          <p className="text-xs text-muted-foreground truncate">{cat?.name ?? 'Uncategorized'}</p>
                        </div>
                        <p className={cn('font-semibold text-sm shrink-0', isCredit ? 'text-green-500' : 'text-foreground')}>
                          {isCredit ? '+' : '-'}{formatCurrency(txn.amount, txn.currency)}
                        </p>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full gradient-primary text-white shadow-xl flex items-center justify-center z-40 active:scale-95 transition-transform"
        onClick={() => setShowAdd(true)}
      >
        <Plus className="w-6 h-6" />
      </button>

      <Sheet open={showAdd} onOpenChange={setShowAdd}>
        <SheetContent side="bottom" className="h-[90dvh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="pb-2">
            <SheetTitle>Add Transaction</SheetTitle>
          </SheetHeader>
          <TransactionForm onSuccess={() => { setShowAdd(false); refetch() }} onCancel={() => setShowAdd(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
