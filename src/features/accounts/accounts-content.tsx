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
import { EmptyState } from '@/components/shared/empty-state'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Account, AccountType } from '@/types/database'

const ACCOUNT_ICONS: Record<AccountType, string> = {
  cash: '💵', checking: '🏦', savings: '🐷', credit_card: '💳',
  loan: '📋', investment: '📈', crypto: '₿', business: '🏢', custom: '💰',
}

export function AccountsContent() {
  const [showForm, setShowForm] = useState(false)
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const { accounts, isLoading, totalBalance, refetch, deleteAccount } = useAccounts()
  const currency = useCurrency()

  const activeAccounts = accounts.filter(a => a.is_active)

  const pieData = activeAccounts
    .filter(a => a.balance !== 0)
    .map(a => ({
      name: a.name,
      value: Math.abs(a.balance),
      color: a.color ?? '#3B82F6',
    }))

  return (
    <div className="flex flex-col min-h-full pb-4">
      {/* Donut chart + balance */}
      <div className="flex flex-col items-center pt-4 pb-2 px-4">
        {isLoading ? (
          <div className="w-[200px] h-[200px] flex items-center justify-center">
            <Skeleton className="w-[160px] h-[160px] rounded-full" />
          </div>
        ) : pieData.length > 0 ? (
          <div className="relative w-[200px] h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={90}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[11px] text-muted-foreground">Account Balance</p>
              <p className="text-xl font-bold">{formatCurrency(totalBalance, currency)}</p>
              <p className="text-[11px] text-muted-foreground">{currency}</p>
            </div>
          </div>
        ) : (
          <div className="w-[200px] h-[200px] rounded-full bg-muted flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No accounts</p>
          </div>
        )}
      </div>

      {/* Accounts list */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">My Accounts</h2>
          <button
            className="flex items-center gap-1 text-primary text-sm font-medium"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Add Account
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1"><Skeleton className="h-4 w-28 mb-1" /><Skeleton className="h-3 w-16" /></div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : activeAccounts.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No accounts yet"
            description="Add your first account to start tracking"
            action={{ label: 'Add Account', onClick: () => setShowForm(true) }}
          />
        ) : (
          <div className="space-y-2">
            {activeAccounts.map((account, i) => {
              const icon = ACCOUNT_ICONS[account.type as AccountType] ?? '💰'
              const isLiability = account.type === 'credit_card' || account.type === 'loan'
              return (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 active:bg-muted transition-colors cursor-pointer"
                  onClick={() => setEditAccount(account)}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: account.color ?? '#3B82F6' }}
                  >
                    <span className="text-white text-sm font-bold">
                      {account.name[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{account.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{account.type.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn('font-semibold text-sm', isLiability ? 'text-destructive' : 'text-foreground')}>
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent side="bottom" className="h-[90dvh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="pb-2">
            <SheetTitle>Add Account</SheetTitle>
          </SheetHeader>
          <AccountForm onSuccess={() => { setShowForm(false); refetch() }} onCancel={() => setShowForm(false)} />
        </SheetContent>
      </Sheet>

      {/* Edit sheet */}
      <Sheet open={!!editAccount} onOpenChange={open => !open && setEditAccount(null)}>
        <SheetContent side="bottom" className="h-[90dvh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="pb-2">
            <SheetTitle>Edit Account</SheetTitle>
          </SheetHeader>
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
