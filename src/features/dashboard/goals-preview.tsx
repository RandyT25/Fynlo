'use client'

import Link from 'next/link'
import { ArrowRight, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent } from '@/lib/utils/format'
import type { Goal } from '@/types/database'

interface GoalsPreviewProps {
  goals: Goal[]
}

export function GoalsPreview({ goals }: GoalsPreviewProps) {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Goals Progress</CardTitle>
        <Button variant="ghost" size="sm" className="gap-1 text-xs">
          <Link href="/goals">View all <ArrowRight className="w-3 h-3" /></Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.length === 0 ? (
          <div className="text-center py-6">
            <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No goals yet</p>
          </div>
        ) : (
          goals.slice(0, 4).map(goal => {
            const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: `${goal.color}20` }}>
                      🎯
                    </div>
                    <span className="text-sm font-medium truncate max-w-[120px]">{goal.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold">{formatPercent(progress, 0)}</span>
                    <p className="text-xs text-muted-foreground">{formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}</p>
                  </div>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
