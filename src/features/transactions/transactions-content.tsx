'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Plus, Search, X, BarChart2 } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths, isSameMonth, parseISO, isToday, isYesterday } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTransactions } from '@/hooks/use-transactions'
import { useAuth } from '@/hooks/use-auth'
import { TransactionForm } from './transaction-form'
import { EmptyState } from '@/components/shared/empty-state'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { TransactionWithRelations } from '@/types/database'

const MONTHS = Array.from({ length: 12 }, (_, i) => subMonths(new Date(), 11 - i))

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
  if (isToday(d)) return `Today · ${format(d, 'MMM d')}`
  if (isYesterday(d)) return `Yesterday · ${format(d, 'MMM d')}`
  return format(d, 'EEE, MMM d')
}

export function TransactionsContent() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editTxn, setEditTxn] = useState<TransactionWithRelations | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { profile } = useAuth()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? 'U'

  const dateFrom = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
  const dateTo = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

  const { transactions, isLoading, refetch, deleteTransaction } = useTransactions({
    dateFrom,
    dateTo,
    search: search || undefined,
  })

  const txns = transactions as TransactionWithRelations[]
  const monthIncome = txns.filter(t => t.type === 'income' || t.type === 'refund').reduce((s, t) => s + t.amount, 0)
  const monthExpense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const netBalance = monthIncome - monthExpense
  const grouped = groupByDate(txns)

  // Scroll selected month tab into view
  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-active="true"]')
    el?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
  }, [currentMonth])

  const handleDelete = useCallback(async (id: string) => {
    await deleteTransaction(id)
  }, [deleteTransaction])

  return (
    <div>
      {/* Header */}
      <div className="bg-background px-4 pt-4 pb-1 sticky top-0 z-20 border-b border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <a href="/settings">
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarFallback className="gradient-primary text-white text-sm font-bold">{initials}</AvatarFallback>
            </Avatar>
          </a>
          <div className="flex-1 text-center">
            <p className="text-xs text-muted-foreground">{format(currentMonth, 'MMMM yyyy')} Balance</p>
            <p className={cn('text-2xl font-bold leading-tight', netBalance >= 0 ? 'text-green-500' : 'text-destructive')}>
              {isLoading ? '—' : `${netBalance >= 0 ? '+' : ''}${formatCurrency(netBalance)}`}
            </p>
          </div>
          <button className="w-9 h-9 bg-muted rounded-full flex items-center justify-center shrink-0" onClick={() => setShowSearch(v => !v)}>
            <Search className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Month scroll tabs */}
        <div ref={scrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-4 px-4">
          {MONTHS.map(m => {
            const active = isSameMonth(m, currentMonth)
            return (
              <button
                key={m.toISOString()}
                data-active={active}
                onClick={() => setCurrentMonth(m)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                  active ? 'gradient-primary text-white shadow-sm' : 'bg-muted text-muted-foreground'
                )}
              >
                {format(m, 'MMM yy')}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pb-3"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search transactions…"
                  className="pl-9 pr-9 rounded-xl"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}>
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Income / Outcome summary */}
      <div className="px-4 py-3 flex gap-3">
        <div className="flex-1 bg-green-50 dark:bg-green-500/10 rounded-2xl px-4 py-3">
          <p className="text-[11px] text-muted-foreground mb-0.5">Income</p>
          <p className="text-green-600 dark:text-green-400 font-bold">+{formatCurrency(monthIncome)}</p>
        </div>
        <div className="flex-1 bg-red-50 dark:bg-red-500/10 rounded-2xl px-4 py-3">
          <p className="text-[11px] text-muted-foreground mb-0.5">Outcome</p>
          <p className="text-destructive font-bold">-{formatCurrency(monthExpense)}</p>
        </div>
      </div>

      {/* Transaction list */}
      <div className="px-4 pb-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-28" />
                {[0, 1].map(j => (
                  <div key={j} className="flex items-center gap-3 py-2">
                    <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
                    <div className="flex-1"><Skeleton className="h-4 w-36 mb-1" /><Skeleton className="h-3 w-20" /></div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No transactions"
            description={search ? 'No results match your search' : `Nothing recorded in ${format(currentMonth, 'MMMM')}`}
            action={{ label: 'Add Transaction', onClick: () => setShowAdd(true) }}
          />
        ) : (
          <div className="space-y-5">
            {grouped.map(group => (
              <div key={group.date}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{dateLabel(group.date)}</p>
                <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/50">
                  {group.transactions.map((txn, i) => {
                    const cat = (txn as any).category
                    const isCredit = txn.type === 'income' || txn.type === 'refund'
                    return (
                      <motion.div
                        key={txn.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.02, 0.2) }}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 active:bg-muted/50 cursor-pointer',
                          i > 0 && 'border-t border-border/40'
                        )}
                        onClick={() => setEditTxn(txn)}
                      >
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-base shrink-0"
                          style={{ backgroundColor: cat?.color ? `${cat.color}22` : '#6B728022' }}
                        >
                          {cat?.icon ?? '💳'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{txn.description}</p>
                          <p className="text-xs text-muted-foreground">{cat?.name ?? 'Uncategorized'}</p>
                        </div>
                        <p className={cn('font-bold text-sm shrink-0', isCredit ? 'text-green-500' : 'text-foreground')}>
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
        style={{ maxWidth: 'none', bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}
        onClick={() => setShowAdd(true)}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add sheet */}
      <Sheet open={showAdd} onOpenChange={setShowAdd}>
        <SheetContent side="bottom" className="h-[90dvh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="pb-2"><SheetTitle>Add Transaction</SheetTitle></SheetHeader>
          <TransactionForm onSuccess={() => { setShowAdd(false); refetch() }} onCancel={() => setShowAdd(false)} />
        </SheetContent>
      </Sheet>

      {/* Edit sheet */}
      <Sheet open={!!editTxn} onOpenChange={open => !open && setEditTxn(null)}>
        <SheetContent side="bottom" className="h-[90dvh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="pb-2"><SheetTitle>Edit Transaction</SheetTitle></SheetHeader>
          {editTxn && (
            <div className="pb-4">
              <TransactionForm
                transaction={editTxn}
                onSuccess={() => { setEditTxn(null); refetch() }}
                onCancel={() => setEditTxn(null)}
              />
              <button
                className="w-full mt-3 py-3 text-destructive text-sm font-medium"
                onClick={() => { handleDelete(editTxn.id); setEditTxn(null) }}
              >
                Delete Transaction
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
