'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Plus, ChevronRight, Bell } from 'lucide-react'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { motion } from 'framer-motion'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useDashboard } from '@/hooks/use-dashboard'
import { useAuth } from '@/hooks/use-auth'
import { useCurrency } from '@/hooks/use-currency'
import { TransactionForm } from '@/features/transactions/transaction-form'
import { formatCurrency, groupByDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { DynamicIcon } from '@/components/shared/dynamic-icon'
import type { TransactionWithRelations } from '@/types/database'

function dateLabel(date: string) {
  const d = parseISO(date)
  if (isToday(d)) return `Today, ${format(d, 'MMMM d')}`
  if (isYesterday(d)) return `Yesterday, ${format(d, 'MMMM d')}`
  return format(d, 'EEEE, MMMM d')
}

export function DashboardContent() {
  const { data, isLoading, refetch } = useDashboard()
  const { profile } = useAuth()
  const currency = useCurrency()
  const [showAdd, setShowAdd] = useState(false)

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? 'U'

  const netMonth = (data?.monthlyIncome ?? 0) - (data?.monthlyExpenses ?? 0)
  const grouped = groupByDate((data?.recentTransactions ?? []) as TransactionWithRelations[])

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero balance */}
      <div className="relative px-5 pt-5 pb-7 gradient-primary text-white rounded-b-[2rem] overflow-hidden">
        {/* Subtle decorative orbs */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-20 translate-x-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-white/5 translate-y-14 -translate-x-8 pointer-events-none" />
        {/* Top row: avatar + greeting + bell */}
        <div className="relative flex items-center justify-between mb-5">
          <Link href="/settings" className="flex items-center gap-2.5">
            <Avatar className="w-9 h-9 ring-2 ring-white/30">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-white/20 text-white text-sm font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white/60 text-[11px] leading-none mb-0.5">Welcome back</p>
              <p className="text-white font-semibold text-sm leading-none truncate max-w-[120px]">{profile?.full_name?.split(' ')[0] ?? 'there'}</p>
            </div>
          </Link>
          <Link href="/notifications">
            <div className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center active:bg-white/25 transition-colors">
              <Bell className="w-4 h-4 text-white" />
            </div>
          </Link>
        </div>
        <div className="relative">
          <span className="text-white/60 text-xs font-medium">{format(new Date(), 'MMMM yyyy')} Total Balance</span>
          <p className="text-4xl font-bold tracking-tight mt-1 mb-1">
            {isLoading ? <span className="opacity-50">—</span> : formatCurrency(data?.totalBalance ?? 0, currency)}
          </p>
          <span className={cn('inline-flex text-xs font-semibold px-2.5 py-1 rounded-full', netMonth >= 0 ? 'bg-green-500/25 text-green-200' : 'bg-red-400/25 text-red-200')}>
            {netMonth >= 0 ? '▲' : '▼'} {netMonth >= 0 ? '+' : ''}{formatCurrency(netMonth, currency)} this month
          </span>
        </div>

        <div className="relative flex gap-3 mt-5">
          <div className="flex-1 bg-white/12 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/10">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3 text-green-300" />
              <span className="text-white/60 text-[11px]">Income</span>
            </div>
            {isLoading
              ? <Skeleton className="h-5 w-20 bg-white/20" />
              : <p className="text-white font-bold text-sm">{formatCurrency(data?.monthlyIncome ?? 0, currency)}</p>
            }
          </div>
          <div className="flex-1 bg-white/12 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/10">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3 h-3 text-red-300" />
              <span className="text-white/60 text-[11px]">Expenses</span>
            </div>
            {isLoading
              ? <Skeleton className="h-5 w-20 bg-white/20" />
              : <p className="text-white font-bold text-sm">{formatCurrency(data?.monthlyExpenses ?? 0, currency)}</p>
            }
          </div>
        </div>
      </div>

      {/* Recent transactions — pb-24 keeps the last row clear of the FAB */}
      <div className="flex-1 px-4 pt-5 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">Recent Transactions</h2>
          <Link href="/transactions" className="flex items-center gap-0.5 text-primary text-sm font-medium">
            See all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: cat?.color ? `${cat.color}20` : '#6B728020' }}
                        >
                          <DynamicIcon
                            name={cat?.icon ?? 'credit-card'}
                            className="w-5 h-5"
                            style={{ color: cat?.color ?? '#6B7280' }}
                          />
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
        className="fixed z-40 w-14 h-14 rounded-full gradient-primary text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))', right: '1rem' }}
        onClick={() => setShowAdd(true)}
      >
        <Plus className="w-6 h-6" />
      </button>

      <Sheet open={showAdd} onOpenChange={setShowAdd}>
        <SheetContent side="bottom" className="h-[92dvh] rounded-t-3xl flex flex-col gap-0 p-0">
          <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b border-border/30">
            <SheetTitle>Add Transaction</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4">
            <TransactionForm onSuccess={() => { setShowAdd(false); refetch() }} onCancel={() => setShowAdd(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
