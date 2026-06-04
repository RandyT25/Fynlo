'use client'

import { useState, useCallback } from 'react'
import { Plus, Search, Filter, Download, Upload, ArrowLeftRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransactions } from '@/hooks/use-transactions'
import { TransactionForm } from './transaction-form'
import { EmptyState } from '@/components/shared/empty-state'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { getTransactionColor } from '@/lib/utils/colors'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types/database'

export function TransactionsContent() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTxn, setEditTxn] = useState<Transaction | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { transactions, isLoading, count, refetch, deleteTransaction } = useTransactions({
    search: search || undefined,
    type: typeFilter || undefined,
  })

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this transaction?')) return
    await deleteTransaction(id)
  }, [deleteTransaction])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const exportCSV = () => {
    const rows = [
      ['Date', 'Description', 'Type', 'Amount', 'Currency', 'Notes'],
      ...transactions.map(t => [t.date, t.description, t.type, t.amount.toString(), t.currency, t.notes ?? '']),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fynlo-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={(v: string | null) => setTypeFilter(v ?? '')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={exportCSV} title="Export CSV">
          <Download className="w-4 h-4" />
        </Button>
        <Sheet open={showForm} onOpenChange={setShowForm}>
          <SheetTrigger>
            <Button className="gradient-primary border-0 gap-2">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Add Transaction</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <TransactionForm onSuccess={() => { setShowForm(false); refetch() }} onCancel={() => setShowForm(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{count} transaction{count !== 1 ? 's' : ''}</span>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span>{selected.size} selected</span>
            <Button variant="destructive" size="sm" onClick={() => {
              selected.forEach(id => deleteTransaction(id))
              setSelected(new Set())
            }}>Delete Selected</Button>
          </div>
        )}
      </div>

      {/* Transactions list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="flex-1"><Skeleton className="h-4 w-48 mb-2" /><Skeleton className="h-3 w-24" /></div>
              <Skeleton className="h-4 w-20" />
            </CardContent></Card>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions"
          description={search ? 'No transactions match your search' : 'Add your first transaction to get started'}
          action={{ label: 'Add Transaction', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-2">
          {transactions.map((txn, i) => {
            const color = getTransactionColor(txn.type)
            const isCredit = txn.type === 'income' || txn.type === 'refund'
            const isSelected = selected.has(txn.id)

            return (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
              >
                <Card className={cn('card-hover cursor-pointer', isSelected && 'ring-2 ring-primary')}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={isSelected}
                      onChange={() => toggleSelect(txn.id)}
                      onClick={e => e.stopPropagation()}
                    />
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      💳
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{txn.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{formatDate(txn.date)}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">{txn.type}</Badge>
                        {txn.tags?.length > 0 && txn.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn('font-semibold', isCredit ? 'text-green-500' : 'text-foreground')}>
                        {isCredit ? '+' : '-'}{formatCurrency(txn.amount, txn.currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-muted-foreground hover:text-foreground"
                        onClick={() => { setEditTxn(txn); setShowForm(true) }}
                      >✎</Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(txn.id)}
                      >✕</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Edit sheet */}
      <Sheet open={!!editTxn} onOpenChange={open => !open && setEditTxn(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Edit Transaction</SheetTitle></SheetHeader>
          <div className="mt-6">
            {editTxn && (
              <TransactionForm
                transaction={editTxn}
                onSuccess={() => { setEditTxn(null); refetch() }}
                onCancel={() => setEditTxn(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
