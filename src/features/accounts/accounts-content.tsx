'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Plus, ChevronRight, Banknote, Landmark, PiggyBank, CreditCard, FileText, TrendingUp, Bitcoin, Briefcase, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccounts } from '@/hooks/use-accounts'
import { useCurrency } from '@/hooks/use-currency'
import { AccountForm } from './account-form'
import { formatCurrency, formatCompactCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Account, AccountType } from '@/types/database'

const ACCOUNT_META: Record<AccountType, { icon: LucideIcon; color: string; label: string }> = {
  cash:        { icon: Banknote,   color: '#22C55E', label: 'Cash / Wallet' },
  checking:    { icon: Landmark,   color: '#3B82F6', label: 'Bank Checking' },
  savings:     { icon: PiggyBank,  color: '#8B5CF6', label: 'Bank Savings' },
  credit_card: { icon: CreditCard, color: '#EF4444', label: 'Credit Card' },
  loan:        { icon: FileText,   color: '#F97316', label: 'Loan / Debt' },
  investment:  { icon: TrendingUp, color: '#10B981', label: 'Investment' },
  crypto:      { icon: Bitcoin,    color: '#F59E0B', label: 'Crypto' },
  business:    { icon: Briefcase,  color: '#6366F1', label: 'Business' },
  custom:      { icon: Wallet,     color: '#EC4899', label: 'Other' },
}

const ASSET_QUICK_TYPES: AccountType[] = ['checking', 'savings', 'cash', 'investment', 'crypto', 'business']
const LIABILITY_QUICK_TYPES: AccountType[] = ['credit_card', 'loan']

const isLiabilityType = (type: string) => type === 'credit_card' || type === 'loan'

function AccountRow({ account, onClick, index }: { account: Account; onClick: () => void; index: number }) {
  const meta = ACCOUNT_META[account.type as AccountType] ?? ACCOUNT_META.custom
  const isLiability = isLiabilityType(account.type)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/50 shadow-sm active:bg-muted/50 cursor-pointer"
      onClick={onClick}
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${account.color ?? meta.color}22` }}
      >
        <meta.icon className="w-5 h-5" style={{ color: account.color ?? meta.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{account.name}</p>
        <p className="text-xs text-muted-foreground">{meta.label}</p>
      </div>
      <p className={cn('font-bold text-sm shrink-0', isLiability ? 'text-destructive' : '')}>
        {formatCurrency(account.balance, account.currency)}
      </p>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </motion.div>
  )
}

export function AccountsContent() {
  const [showForm, setShowForm] = useState(false)
  const [presetType, setPresetType] = useState<AccountType | undefined>()
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const { accounts, isLoading, totalBalance, refetch, deleteAccount } = useAccounts()
  const currency = useCurrency()

  const activeAccounts = accounts.filter(a => a.is_active)
  const assetAccounts = activeAccounts.filter(a => !isLiabilityType(a.type))
  const liabilityAccounts = activeAccounts.filter(a => isLiabilityType(a.type))

  const totalAssets = assetAccounts.reduce((s, a) => s + (a.balance ?? 0), 0)
  const totalLiabilities = liabilityAccounts.reduce((s, a) => s + Math.abs(a.balance ?? 0), 0)

  const pieData = assetAccounts
    .filter(a => a.balance > 0)
    .map(a => ({
      name: a.name,
      value: a.balance,
      color: a.color ?? ACCOUNT_META[a.type as AccountType]?.color ?? '#3B82F6',
    }))

  const openAdd = (type?: AccountType) => {
    setPresetType(type)
    setShowForm(true)
  }

  return (
    <div className="flex flex-col min-h-full pb-4">

      {/* Net Worth hero */}
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
              <p className="text-[11px] text-muted-foreground">Net Worth</p>
              <p className="text-base font-bold leading-tight">{formatCompactCurrency(totalBalance, currency)}</p>
            </div>
          </div>
        ) : (
          <div className="w-[180px] h-[180px] rounded-full bg-muted/50 flex flex-col items-center justify-center gap-2">
            <Landmark className="w-10 h-10 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">No accounts yet</p>
          </div>
        )}

        {/* Assets / Liabilities summary strip */}
        {!isLoading && activeAccounts.length > 0 && (
          <div className="flex gap-3 mt-3 w-full">
            <div className="flex-1 flex flex-col items-center p-2.5 rounded-2xl bg-green-500/8 border border-green-500/20">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Assets</p>
              <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCompactCurrency(totalAssets, currency)}</p>
            </div>
            <div className="flex-1 flex flex-col items-center p-2.5 rounded-2xl bg-destructive/8 border border-destructive/20">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Debts</p>
              <p className="text-sm font-bold text-destructive">{formatCompactCurrency(totalLiabilities, currency)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 space-y-5 mt-2">

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
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">My Money (Assets)</p>
              <div className="grid grid-cols-3 gap-2">
                {ASSET_QUICK_TYPES.map(type => {
                  const meta = ACCOUNT_META[type]
                  return (
                    <button
                      key={type}
                      onClick={() => openAdd(type)}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border/50 shadow-sm active:scale-95 transition-transform"
                    >
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${meta.color}22` }}>
                        <meta.icon className="w-5 h-5" style={{ color: meta.color }} />
                      </div>
                      <span className="text-[11px] font-medium text-center leading-tight">{meta.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">I Owe (Liabilities)</p>
              <div className="grid grid-cols-2 gap-2">
                {LIABILITY_QUICK_TYPES.map(type => {
                  const meta = ACCOUNT_META[type]
                  return (
                    <button
                      key={type}
                      onClick={() => openAdd(type)}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border/50 shadow-sm active:scale-95 transition-transform"
                    >
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${meta.color}22` }}>
                        <meta.icon className="w-5 h-5" style={{ color: meta.color }} />
                      </div>
                      <span className="text-[11px] font-medium text-center leading-tight">{meta.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <button
              className="w-full py-3 rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground"
              onClick={() => openAdd()}
            >
              + Add Account
            </button>
          </div>

        ) : (
          <>
            {/* Assets section */}
            {assetAccounts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">My Money</p>
                    <p className="text-base font-bold text-foreground">{formatCurrency(totalAssets, currency)}</p>
                  </div>
                  <button
                    className="flex items-center gap-1 text-primary text-xs font-semibold"
                    onClick={() => openAdd()}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {assetAccounts.map((account, i) => (
                    <AccountRow key={account.id} account={account} index={i} onClick={() => setEditAccount(account)} />
                  ))}
                </div>
              </div>
            )}

            {/* Liabilities section */}
            {liabilityAccounts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">I Owe</p>
                    <p className="text-base font-bold text-destructive">{formatCurrency(totalLiabilities, currency)}</p>
                  </div>
                  <button
                    className="flex items-center gap-1 text-destructive text-xs font-semibold"
                    onClick={() => openAdd('loan')}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {liabilityAccounts.map((account, i) => (
                    <AccountRow key={account.id} account={account} index={i} onClick={() => setEditAccount(account)} />
                  ))}
                </div>
              </div>
            )}

            {/* Add account button when there are accounts but need more */}
            {assetAccounts.length > 0 && liabilityAccounts.length === 0 && (
              <button
                className="w-full py-3 rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground"
                onClick={() => openAdd()}
              >
                + Add Another Account
              </button>
            )}
          </>
        )}
      </div>

      {/* Add sheet */}
      <Sheet open={showForm} onOpenChange={open => { setShowForm(open); if (!open) setPresetType(undefined) }}>
        <SheetContent side="bottom" className="h-[92dvh] rounded-t-3xl flex flex-col gap-0 p-0">
          <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b border-border/30">
            <SheetTitle>Add Account</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4">
            <AccountForm
              presetType={presetType}
              onSuccess={() => { setShowForm(false); setPresetType(undefined); refetch() }}
              onCancel={() => { setShowForm(false); setPresetType(undefined) }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit sheet */}
      <Sheet open={!!editAccount} onOpenChange={open => !open && setEditAccount(null)}>
        <SheetContent side="bottom" className="h-[92dvh] rounded-t-3xl flex flex-col gap-0 p-0">
          <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b border-border/30">
            <SheetTitle>Edit Account</SheetTitle>
          </SheetHeader>
          {editAccount && (
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4">
              <AccountForm
                account={editAccount}
                onSuccess={() => { setEditAccount(null); refetch() }}
                onCancel={() => setEditAccount(null)}
              />
              <button
                className="w-full py-3 text-destructive text-sm font-medium mb-6"
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
