'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Eye, EyeOff, Wallet } from 'lucide-react'
import { useState } from 'react'
import { formatCurrency, formatPercent } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

interface BalanceCardProps {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number
  currency?: string
}

export function BalanceCard({ totalBalance, monthlyIncome, monthlyExpenses, savingsRate, currency = 'USD' }: BalanceCardProps) {
  const [hidden, setHidden] = useState(false)
  const netFlow = monthlyIncome - monthlyExpenses
  const isPositive = netFlow >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl gradient-primary p-6 text-white shadow-2xl shadow-blue-500/30"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-32 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-24 -translate-x-12" />

      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-white/70" />
            <span className="text-white/70 text-sm font-medium">Total Balance</span>
          </div>
          <button
            onClick={() => setHidden(!hidden)}
            className="text-white/70 hover:text-white transition-colors"
          >
            {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="mb-6">
          <span className="text-4xl font-bold tracking-tight">
            {hidden ? '••••••' : formatCurrency(totalBalance, currency)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-300" />
              <span className="text-white/60 text-xs">Income</span>
            </div>
            <span className="text-sm font-semibold">
              {hidden ? '••••' : formatCurrency(monthlyIncome, currency)}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-red-300" />
              <span className="text-white/60 text-xs">Expenses</span>
            </div>
            <span className="text-sm font-semibold">
              {hidden ? '••••' : formatCurrency(monthlyExpenses, currency)}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <div className={cn('w-3 h-3 rounded-full', isPositive ? 'bg-green-300' : 'bg-red-300')} />
              <span className="text-white/60 text-xs">Savings</span>
            </div>
            <span className={cn('text-sm font-semibold', isPositive ? 'text-green-300' : 'text-red-300')}>
              {hidden ? '••••' : formatPercent(savingsRate)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
