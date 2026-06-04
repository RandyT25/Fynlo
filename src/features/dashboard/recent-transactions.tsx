'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { getTransactionColor } from '@/lib/utils/colors'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types/database'

interface RecentTransactionsProps {
  transactions: Transaction[]
  isLoading?: boolean
}

export function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm" className="gap-1 text-xs">
          <Link href="/transactions">View all <ArrowRight className="w-3 h-3" /></Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))
        ) : transactions.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No transactions yet</p>
        ) : (
          transactions.map((txn, i) => {
            const category = (txn as any).category
            const color = getTransactionColor(txn.type)
            const isCredit = txn.type === 'income' || txn.type === 'refund'

            return (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/transactions/${txn.id}`}
                  className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <span>{category?.icon ? '•' : '💰'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{txn.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(txn.date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-sm font-semibold', isCredit ? 'text-green-500' : 'text-foreground')}>
                      {isCredit ? '+' : '-'}{formatCurrency(txn.amount, txn.currency)}
                    </p>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">
                      {txn.type}
                    </Badge>
                  </div>
                </Link>
              </motion.div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
