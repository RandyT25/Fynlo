'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon: LucideIcon
  iconColor?: string
  delay?: number
}

export function StatCard({ title, value, change, changeLabel, icon: Icon, iconColor = 'text-primary', delay = 0 }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0
  const showChange = change !== undefined

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="card-hover">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">{title}</p>
              <p className="text-xl font-bold truncate">{value}</p>
              {showChange && (
                <div className={cn('flex items-center gap-1 mt-1', isPositive ? 'text-green-500' : 'text-red-500')}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span className="text-xs font-medium">
                    {Math.abs(change).toFixed(1)}% {changeLabel ?? 'vs last month'}
                  </span>
                </div>
              )}
            </div>
            <div className={cn('w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0')}>
              <Icon className={cn('w-5 h-5', iconColor)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
