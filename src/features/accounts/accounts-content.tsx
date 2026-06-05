'use client'

import { useState } from 'react'
import { Plus, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccounts } from '@/hooks/use-accounts'
import { useCurrency } from '@/hooks/use-currency'
import { AccountForm } from './account-form'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Account, AccountType } from '@/types/database'

const ACCOUNT_META: Record<AccountType, { icon: string; color: string; label: string }> = {
  cash:        { icon: '💵', color: '#22C55E', label: 'Cash' },
  checking:    { icon: '🏦', color: '#3B82F6', label: 'Checking' },
  savings:     { icon: '🐷', color: '#8B5CF6', label: 'Savings' },
  credit_card: { icon: '💳', color: '#EF4444', label: 'Credit Card' },
  loan:        { icon: '📋', color: '#F97316', label: 'Loan' },
  investment:  { icon: '📈', color: '#10B981', label: 'Investment' },
  crypto:      { icon: '₿',  color: '#F59E0B', label: 'Crypto' },
  business:    { icon: '🏢', color: '#6366F1', label: 'Business' },
  custom:      { icon: '💰', color: '#EC4899', label: 'Custom' },
}

const QUICK_TYPES: AccountType[] = ['checking', 'savings', 'cash', 'credit_card', 'investment', 'crypto']

export function AccountsContent() {
  const [showForm, setShowForm] = useState(false)
  const [presetType, setPresetType] = useState<AccountType | undefined>()
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const { accounts, isLoading, totalBalance, refetch, deleteAccount } = useAccounts()
  const currency = useCurrency()

  const activeAccounts = accounts.filter(a => a.is_active)

  const pieData = activeAccounts
    .filter(a => a.balance !== 0)
    .map(a => ({
      name: a.name,
      value: Math.abs(a.balance),
      color: a.color ?? ACCOUNT_META[a.type as AccountType]?.color ?? '#3B82F6',
    }))

  const openAdd = (type?: AccountType) => {
    setPresetType(type)
    setShowForm(true)
  }

  return (
    <div className="flex flex-col min-h-full pb-4">

      {/* Donut chart + balance */}
      <div className="flex flex-col items-center pt-4 pb-2 px-4">
        {isLoading ? (
          <Skeleton className="w-[180px] h-[180px] rounded-full" />
        ) : pieData.length > 0 ? (
          <div className="relative w-[200px] h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={62} outerRadius={90} dataKey="value" strokeWidth={2} stroke="hsl(var(--background))">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[11px] text-muted-foreground">Total Balance</p>
              <p className="text-xl font-bold">{formatCurrency(totalBalance, currency)}</p>
              <p className="text-[11px] text-muted-foreground">{currency}</p>
            </div>
          </div>
        ) : (
          <div className="w-[180px] h-[180px] rounded-full bg-muted/50 flex flex-col items-center justify-center gap-1">
            <span className="text-4xl">🏦</span>
            <p className="text-xs text-muted-foreground">No accounts yet</p>
          </div>
        )}
      </div>

      {/* Accounts list */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">My Accounts</h2>
          <button className="flex items-center gap-1 text-primary text-sm font-medium" onClick={() => openAdd()}>
            <Plus className="w-3.5 h-3.5" /> Add Account
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1"><Skeleton className="h-4 w-28 mb-1" /><Skeleton className="h-3 w-16" /></div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : activeAccounts.length === 0 ? (
          /* Quick setup when empty */
          <div>
            <p className="text-sm text-muted-foreground mb-3">Tap a type to add your first account:</p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_TYPES.map(type => {
                const meta = ACCOUNT_META[type]
                return (
                  <button
                    key={type}
                    onClick={() => openAdd(type)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border/50 shadow-sm active:scale-95 transition-transform"
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${meta.color}22` }}>
                      {meta.icon}
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">{meta.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {activeAccounts.map((account, i) => {
              const meta = ACCOUNT_META[account.type as AccountType] ?? ACCOUNT_META.custom
              const isLiability = account.type === 'credit_card' || account.type === 'loan'
              return (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/50 shadow-sm active:bg-muted/50 cursor-pointer"
                  onClick={() => setEditAccount(account)}
                >
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: `${account.color ?? meta.color}22` }}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{account.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{meta.label}</p>
                  </div>
                  <p className={cn('font-bold text-sm shrink-0', isLiability ? 'text-destructive' : '')}>
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add sheet */}
      <Sheet open={showForm} onOpenChange={open => { setShowForm(open); if (!open) setPresetType(undefined) }}>
        <SheetContent side="bottom" className="h-[90dvh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="pb-2"><SheetTitle>Add Account</SheetTitle></SheetHeader>
          <AccountForm
            presetType={presetType}
            onSuccess={() => { setShowForm(false); setPresetType(undefined); refetch() }}
            onCancel={() => { setShowForm(false); setPresetType(undefined) }}
          />
        </SheetContent>
      </Sheet>

      {/* Edit sheet */}
      <Sheet open={!!editAccount} onOpenChange={open => !open && setEditAccount(null)}>
        <SheetContent side="bottom" className="h-[90dvh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="pb-2"><SheetTitle>Edit Account</SheetTitle></SheetHeader>
          {editAccount && (
            <div className="pb-4">
              <AccountForm
                account={editAccount}
                onSuccess={() => { setEditAccount(null); refetch() }}
                onCancel={() => setEditAccount(null)}
              />
              <button
                className="w-full mt-3 py-3 text-destructive text-sm font-medium"
                onClick={() => { deleteAccount(editAccount.id); setEditAccount(null) }}
              >
                Delete Account
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
