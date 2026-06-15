'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Plus, ChevronRight, Bell, ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react'
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

      {/* ── Deep gradient hero ── */}
      <div className="relative gradient-hero text-white overflow-hidden" style={{ borderRadius: '0 0 2.5rem 2.5rem' }}>
        {/* Layered radial glows for depth */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #818CF8 0%, transparent 70%)', transform: 'translate(30%, -40%)' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)', transform: 'translate(-30%, 40%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.18) 100%)' }} />
        </div>

        <div className="relative px-5 pt-5 pb-7">
          {/* Top row: avatar + greeting + bell */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/settings" className="flex items-center gap-3 cursor-pointer">
              <Avatar className="w-9 h-9 ring-2 ring-white/25 shadow-lg">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-white/20 text-white text-sm font-bold backdrop-blur-sm">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white/55 text-[10px] font-medium tracking-widest uppercase leading-none mb-0.5">Welcome back</p>
                <p className="text-white font-semibold text-sm leading-none tracking-tight truncate max-w-[120px]">
                  {profile?.full_name?.split(' ')[0] ?? 'there'}
                </p>
              </div>
            </Link>
            <Link href="/notifications" className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors active:bg-white/20" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <Bell className="w-4 h-4 text-white" />
            </Link>
          </div>

          {/* Balance */}
          <div className="mb-1">
            <p className="text-white/50 text-[11px] font-medium tracking-widest uppercase mb-2">
              {format(new Date(), 'MMMM yyyy')} · Total Balance
            </p>
            {isLoading
              ? <Skeleton className="h-12 w-48 bg-white/15 rounded-xl mb-2" />
              : <p className="text-[2.75rem] font-bold tracking-tight leading-none text-white mb-2">
                  {formatCurrency(data?.totalBalance ?? 0, currency)}
                </p>
            }
            <div className={cn(
              'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full',
              netMonth >= 0
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/20'
                : 'bg-red-400/20 text-red-200 border border-red-400/20'
            )}>
              {netMonth >= 0
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
              }
              {netMonth >= 0 ? '+' : ''}{formatCurrency(netMonth, currency)} this month
            </div>
          </div>

          {/* Income / Expenses */}
          <div className="flex gap-3 mt-5">
            <div className="flex-1 rounded-2xl px-4 py-3 glass-hero-card">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded-full bg-emerald-400/25 flex items-center justify-center">
                  <ArrowDownRight className="w-3 h-3 text-emerald-300" />
                </div>
                <span className="text-white/55 text-[10.5px] font-medium tracking-wide">Income</span>
              </div>
              {isLoading
                ? <Skeleton className="h-5 w-20 bg-white/15 rounded" />
                : <p className="text-white font-bold text-sm tracking-tight">{formatCurrency(data?.monthlyIncome ?? 0, currency)}</p>
              }
            </div>
            <div className="flex-1 rounded-2xl px-4 py-3 glass-hero-card">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded-full bg-rose-400/25 flex items-center justify-center">
                  <ArrowUpRight className="w-3 h-3 text-rose-300" />
                </div>
                <span className="text-white/55 text-[10.5px] font-medium tracking-wide">Expenses</span>
              </div>
              {isLoading
                ? <Skeleton className="h-5 w-20 bg-white/15 rounded" />
                : <p className="text-white font-bold text-sm tracking-tight">{formatCurrency(data?.monthlyExpenses ?? 0, currency)}</p>
              }
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent transactions ── */}
      <div className="flex-1 px-4 pt-6 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[15px] tracking-tight">Recent Transactions</h2>
          <Link href="/transactions" className="flex items-center gap-0.5 text-primary text-[13px] font-semibold cursor-pointer">
            See all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-card card-elevated">
                <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
                <div className="flex-1"><Skeleton className="h-3.5 w-36 mb-2" /><Skeleton className="h-3 w-20" /></div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground">
            <div className="w-16 h-16 rounded-3xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
              <ArrowLeftRight className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium">No transactions yet</p>
            <p className="text-xs mt-1 text-muted-foreground/60">Tap + to add your first one</p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(group => (
              <div key={group.date}>
                <p className="text-[11px] font-semibold text-muted-foreground/70 tracking-wide uppercase mb-2.5">{dateLabel(group.date)}</p>
                <div className="space-y-1.5">
                  {group.transactions.map((txn, i) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const cat = (txn as any).category
                    const isCredit = txn.type === 'income' || txn.type === 'refund'
                    return (
                      <motion.div
                        key={txn.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                        className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-card card-elevated"
                      >
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: cat?.color ? `${cat.color}18` : '#6B728018' }}
                        >
                          <DynamicIcon
                            name={cat?.icon ?? 'credit-card'}
                            className="w-[1.1rem] h-[1.1rem]"
                            style={{ color: cat?.color ?? '#6B7280' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[13.5px] tracking-tight truncate">{txn.description}</p>
                          <p className="text-[11.5px] text-muted-foreground/70 truncate">{cat?.name ?? 'Uncategorized'}</p>
                        </div>
                        <p className={cn('font-bold text-sm shrink-0 tracking-tight', isCredit ? 'text-emerald-500 dark:text-emerald-400' : 'text-foreground')}>
                          {isCredit ? '+' : '−'}{formatCurrency(txn.amount, txn.currency)}
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

      {/* ── FAB ── */}
      <button
        className="fixed z-40 w-14 h-14 rounded-full gradient-primary text-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
        style={{
          bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
          right: '1rem',
          boxShadow: '0 4px 24px rgba(37,99,235,0.45), 0 2px 8px rgba(0,0,0,0.2)',
        }}
        onClick={() => setShowAdd(true)}
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
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
