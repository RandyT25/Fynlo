'use client'

import Link from 'next/link'
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Budget } from '@/types/database'

interface BudgetWithSpent extends Budget {
  spent?: number
  category?: { name: string; icon: string; color: string }
}

interface BudgetOverviewProps {
  budgets: BudgetWithSpent[]
}

export function BudgetOverview({ budgets }: BudgetOverviewProps) {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Budget Status</CardTitle>
        <Button variant="ghost" size="sm" className="gap-1 text-xs">
          <Link href="/budgets">View all <ArrowRight className="w-3 h-3" /></Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgets.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">No budgets set up</p>
        ) : (
          budgets.slice(0, 5).map(budget => {
            const spent = budget.spent ?? 0
            const util = Math.min((spent / budget.amount) * 100, 100)
            const isOver = spent > budget.amount
            const isWarning = util >= 80 && !isOver

            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isOver ? (
                      <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                    ) : (
                      <CheckCircle2 className={cn('w-4 h-4 shrink-0', util < 80 ? 'text-green-500' : 'text-yellow-500')} />
                    )}
                    <span className="text-sm font-medium">{budget.category?.name ?? budget.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOver && <Badge variant="destructive" className="text-xs">Over budget</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                    </span>
                  </div>
                </div>
                <Progress
                  value={util}
                  className="h-2"
                  style={{
                    '--progress-background': isOver ? '#EF4444' : isWarning ? '#F59E0B' : '#22C55E'
                  } as React.CSSProperties}
                />
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
