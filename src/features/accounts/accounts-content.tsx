'use client'

import { useState } from 'react'
import { Plus, Wallet, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccounts } from '@/hooks/use-accounts'
import { AccountForm } from './account-form'
import { EmptyState } from '@/components/shared/empty-state'
import { formatCurrency } from '@/lib/utils/format'
import { getAccountColor, ACCOUNT_TYPE_COLORS } from '@/lib/utils/colors'
import { cn } from '@/lib/utils'
import type { Account, AccountType } from '@/types/database'

const ACCOUNT_ICONS: Record<AccountType, string> = {
  cash: '💵', checking: '🏦', savings: '🐷', credit_card: '💳',
  loan: '📋', investment: '📈', crypto: '₿', business: '🏢', custom: '💰',
}

const ACCOUNT_GROUPS = [
  { label: 'Cash & Bank', types: ['cash', 'checking', 'savings'] as AccountType[] },
  { label: 'Credit & Loans', types: ['credit_card', 'loan'] as AccountType[] },
  { label: 'Investments', types: ['investment', 'crypto'] as AccountType[] },
  { label: 'Other', types: ['business', 'custom'] as AccountType[] },
]

export function AccountsContent() {
  const [showForm, setShowForm] = useState(false)
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const { accounts, isLoading, totalBalance, refetch, deleteAccount } = useAccounts()

  const grouped = ACCOUNT_GROUPS.map(group => ({
    ...group,
    accounts: accounts.filter(a => group.types.includes(a.type as AccountType)),
  })).filter(g => g.accounts.length > 0)

  const totalAssets = accounts
    .filter(a => !['credit_card', 'loan'].includes(a.type))
    .reduce((s, a) => s + a.balance, 0)

  const totalLiabilities = accounts
    .filter(a => ['credit_card', 'loan'].includes(a.type))
    .reduce((s, a) => s + a.balance, 0)

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="gradient-primary text-white">
          <CardContent className="p-4">
            <p className="text-white/70 text-sm mb-1">Net Worth</p>
            <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <p className="text-sm text-muted-foreground">Total Assets</p>
            </div>
            <p className="text-xl font-bold text-green-500">{formatCurrency(totalAssets)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <p className="text-sm text-muted-foreground">Total Liabilities</p>
            </div>
            <p className="text-xl font-bold text-red-500">{formatCurrency(totalLiabilities)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add account button */}
      <div className="flex justify-end">
        <Sheet open={showForm} onOpenChange={setShowForm}>
          <SheetTrigger>
            <Button className="gradient-primary border-0 gap-2">
              <Plus className="w-4 h-4" /> Add Account
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>Add Account</SheetTitle></SheetHeader>
            <div className="mt-6">
              <AccountForm onSuccess={() => { setShowForm(false); refetch() }} onCancel={() => setShowForm(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Account groups */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Add your first account to start tracking your finances"
          action={{ label: 'Add Account', onClick: () => setShowForm(true) }}
        />
      ) : (
        grouped.map(group => (
          <div key={group.label} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{group.label}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.accounts.map((account, i) => (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                            style={{ backgroundColor: `${account.color}20` }}
                          >
                            {ACCOUNT_ICONS[account.type as AccountType] ?? '💰'}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{account.name}</p>
                            <Badge variant="secondary" className="text-[10px] mt-0.5 capitalize">
                              {account.type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground" onClick={() => setEditAccount(account)}>✎</Button>
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-destructive" onClick={() => deleteAccount(account.id)}>✕</Button>
                        </div>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Balance</p>
                          <p className="text-xl font-bold" style={{ color: getAccountColor(account.type as AccountType) }}>
                            {formatCurrency(account.balance, account.currency)}
                          </p>
                        </div>
                        {account.institution && (
                          <p className="text-xs text-muted-foreground">{account.institution}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Edit sheet */}
      <Sheet open={!!editAccount} onOpenChange={open => !open && setEditAccount(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Edit Account</SheetTitle></SheetHeader>
          <div className="mt-6">
            {editAccount && (
              <AccountForm account={editAccount} onSuccess={() => { setEditAccount(null); refetch() }} onCancel={() => setEditAccount(null)} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
