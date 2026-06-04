'use client'

import Link from 'next/link'
import { ArrowRight, Calendar, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { differenceInDays, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import type { BillReminder } from '@/types/database'

interface UpcomingBillsProps {
  bills: BillReminder[]
}

export function UpcomingBills({ bills }: UpcomingBillsProps) {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Upcoming Bills</CardTitle>
        <Button variant="ghost" size="sm" className="gap-1 text-xs">
          <Link href="/calendar">View all <ArrowRight className="w-3 h-3" /></Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {bills.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming bills</p>
          </div>
        ) : (
          bills.map(bill => {
            const daysLeft = differenceInDays(parseISO(bill.due_date), new Date())
            const isUrgent = daysLeft <= 3
            const isOverdue = daysLeft < 0

            return (
              <div key={bill.id} className={cn('flex items-center justify-between py-2 px-2 rounded-xl', isUrgent && 'bg-red-50 dark:bg-red-950/20')}>
                <div className="flex items-center gap-3">
                  {(isUrgent || isOverdue) && <AlertCircle className="w-4 h-4 text-destructive shrink-0" />}
                  <div>
                    <p className="text-sm font-medium">{bill.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isOverdue ? 'Overdue' : daysLeft === 0 ? 'Due today' : `Due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(bill.amount, bill.currency)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(bill.due_date)}</p>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
