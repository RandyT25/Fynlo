'use client'

import Link from 'next/link'
import { ArrowRight, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/format'
import { getAccountColor } from '@/lib/utils/colors'
import type { Account } from '@/types/database'

const ACCOUNT_ICONS: Record<string, string> = {
  cash: '💵', checking: '🏦', savings: '🐷', credit_card: '💳',
  loan: '📋', investment: '📈', crypto: '₿', business: '🏢', custom: '💰',
}

interface AccountsOverviewProps {
  accounts: Account[]
}

export function AccountsOverview({ accounts }: AccountsOverviewProps) {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Accounts</CardTitle>
        <Button variant="ghost" size="sm" className="gap-1 text-xs">
          <Link href="/accounts">View all <ArrowRight className="w-3 h-3" /></Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {accounts.slice(0, 4).map((account, i) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/accounts/${account.id}`}>
                <div className="p-3 rounded-xl border border-border hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{ACCOUNT_ICONS[account.type] ?? '💰'}</span>
                    <span className="text-xs text-muted-foreground capitalize truncate">{account.type.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm font-medium truncate">{account.name}</p>
                  <p className="text-base font-bold" style={{ color: getAccountColor(account.type) }}>
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
          <Link href="/accounts/new">
            <div className="p-3 rounded-xl border border-dashed border-border hover:bg-muted transition-colors flex flex-col items-center justify-center gap-1 min-h-[88px]">
              <Plus className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Add Account</span>
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
