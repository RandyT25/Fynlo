'use client'

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { useAuthStore } from '@/store/auth.store'
import { format, startOfMonth, endOfMonth, parseISO, isSameDay, addDays } from 'date-fns'
import { formatCurrency } from '@/lib/utils/format'
import { LoadingPage } from '@/components/shared/loading-spinner'
import { useCurrency } from '@/hooks/use-currency'

interface CalendarEvent {
  id: string
  title: string
  amount: number
  currency: string
  date: string
  type: 'transaction' | 'bill' | 'subscription' | 'recurring'
  color: string
}

// Returns all dates (yyyy-MM-dd) a subscription hits in the given month
function projectSubscriptionDates(
  nextBillingDate: string,
  billingCycle: string,
  viewedYear: number,
  viewedMonth: number // 0-indexed
): string[] {
  const anchor = parseISO(nextBillingDate)
  const daysInMonth = new Date(viewedYear, viewedMonth + 1, 0).getDate()
  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = (day: number) =>
    `${viewedYear}-${pad(viewedMonth + 1)}-${pad(Math.min(day, daysInMonth))}`

  switch (billingCycle) {
    case 'monthly': {
      return [dateStr(anchor.getDate())]
    }
    case 'weekly': {
      const targetDow = anchor.getDay()
      const dates: string[] = []
      for (let d = 1; d <= daysInMonth; d++) {
        if (new Date(viewedYear, viewedMonth, d).getDay() === targetDow) {
          dates.push(dateStr(d))
        }
      }
      return dates
    }
    case 'quarterly': {
      const anchorMonths = anchor.getFullYear() * 12 + anchor.getMonth()
      const viewedMonths = viewedYear * 12 + viewedMonth
      const diff = viewedMonths - anchorMonths
      if (diff >= 0 && diff % 3 === 0) return [dateStr(anchor.getDate())]
      return []
    }
    case 'yearly': {
      if (anchor.getMonth() === viewedMonth) return [dateStr(anchor.getDate())]
      return []
    }
    default:
      return []
  }
}

// Returns all dates a recurring transaction hits in the given month
function projectRecurringDates(
  startDate: string,
  frequency: string,
  interval: number,
  endDate: string | null,
  viewedYear: number,
  viewedMonth: number // 0-indexed
): string[] {
  const start = parseISO(startDate)
  const end = endDate ? parseISO(endDate) : null
  const monthStart = new Date(viewedYear, viewedMonth, 1)
  const monthEnd = new Date(viewedYear, viewedMonth + 1, 0)

  if (start > monthEnd) return []
  if (end && end < monthStart) return []

  const daysInMonth = monthEnd.getDate()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd')

  const inRange = (d: Date) =>
    d >= monthStart && d <= monthEnd && (!end || d <= end)

  switch (frequency) {
    case 'monthly': {
      const startMonths = start.getFullYear() * 12 + start.getMonth()
      const viewedMonths = viewedYear * 12 + viewedMonth
      const diff = viewedMonths - startMonths
      if (diff >= 0 && diff % interval === 0) {
        const day = Math.min(start.getDate(), daysInMonth)
        const d = new Date(viewedYear, viewedMonth, day)
        if (inRange(d)) return [fmt(d)]
      }
      return []
    }
    case 'quarterly': {
      const startMonths = start.getFullYear() * 12 + start.getMonth()
      const viewedMonths = viewedYear * 12 + viewedMonth
      const diff = viewedMonths - startMonths
      if (diff >= 0 && diff % (3 * interval) === 0) {
        const day = Math.min(start.getDate(), daysInMonth)
        const d = new Date(viewedYear, viewedMonth, day)
        if (inRange(d)) return [fmt(d)]
      }
      return []
    }
    case 'yearly': {
      if (start.getMonth() === viewedMonth) {
        const day = Math.min(start.getDate(), daysInMonth)
        const d = new Date(viewedYear, viewedMonth, day)
        if (inRange(d)) return [fmt(d)]
      }
      return []
    }
    case 'daily':
    case 'weekly':
    case 'biweekly': {
      const intervalDays =
        frequency === 'biweekly' ? 14 : frequency === 'weekly' ? 7 * interval : interval
      // Find first occurrence on or after monthStart
      const msPerDay = 86400000
      const daysToMonth = Math.ceil((monthStart.getTime() - start.getTime()) / msPerDay)
      const cyclesNeeded = daysToMonth <= 0 ? 0 : Math.ceil(daysToMonth / intervalDays)
      let cur = addDays(start, cyclesNeeded * intervalDays)
      const dates: string[] = []
      while (cur <= monthEnd) {
        if (inRange(cur)) dates.push(fmt(cur))
        cur = addDays(cur, intervalDays)
      }
      return dates
    }
    default:
      return []
  }
}

export function CalendarContent() {
  const { user, isLoading: authLoading } = useAuthStore()
  const [date, setDate] = useState<Date>(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const defaultCurrency = useCurrency()

  const fetchEvents = async (d: Date) => {
    setIsLoading(true)
    const year = d.getFullYear()
    const month = d.getMonth() // 0-indexed
    const start = format(startOfMonth(d), 'yyyy-MM-dd')
    const end = format(endOfMonth(d), 'yyyy-MM-dd')

    const [txnsRes, billsRes, subsRes, recurringRes] = await Promise.all([
      supabase.from('transactions').select('id,description,amount,currency,date,type').is('deleted_at', null).gte('date', start).lte('date', end),
      supabase.from('bill_reminders').select('id,name,amount,due_date').is('deleted_at', null).gte('due_date', start).lte('due_date', end).eq('is_completed', false),
      supabase.from('subscriptions').select('id,name,amount,currency,next_billing_date,billing_cycle').eq('status', 'active').is('deleted_at', null),
      supabase.from('recurring_transactions').select('id,description,amount,currency,frequency,interval,start_date,end_date,type').eq('is_active', true).eq('is_paused', false).is('deleted_at', null),
    ])

    const txns = (txnsRes.data ?? []) as Array<{ id: string; description: string; amount: number; currency: string; date: string; type: string }>
    const bills = (billsRes.data ?? []) as Array<{ id: string; name: string; amount: number; due_date: string }>
    const subs = (subsRes.data ?? []) as Array<{ id: string; name: string; amount: number; currency: string; next_billing_date: string; billing_cycle: string }>
    const recurring = (recurringRes.data ?? []) as Array<{ id: string; description: string; amount: number; currency: string; frequency: string; interval: number; start_date: string; end_date: string | null; type: string }>

    const allEvents: CalendarEvent[] = [
      // Real transactions
      ...txns.map(t => ({
        id: t.id,
        title: t.description,
        amount: t.amount,
        currency: t.currency ?? defaultCurrency,
        date: t.date,
        type: 'transaction' as const,
        color: t.type === 'income' ? '#22C55E' : '#EF4444',
      })),

      // Bill reminders
      ...bills.map(b => ({
        id: b.id,
        title: b.name,
        amount: b.amount,
        currency: defaultCurrency,
        date: b.due_date,
        type: 'bill' as const,
        color: '#F97316',
      })),

      // Subscriptions — projected into this month
      ...subs.flatMap(s =>
        projectSubscriptionDates(s.next_billing_date, s.billing_cycle, year, month).map(date => ({
          id: `sub-${s.id}-${date}`,
          title: s.name,
          amount: s.amount,
          currency: s.currency ?? defaultCurrency,
          date,
          type: 'subscription' as const,
          color: '#8B5CF6',
        }))
      ),

      // Recurring transactions — projected into this month
      ...recurring.flatMap(r =>
        projectRecurringDates(r.start_date, r.frequency, r.interval, r.end_date, year, month).map(date => ({
          id: `rec-${r.id}-${date}`,
          title: r.description,
          amount: r.amount,
          currency: r.currency ?? defaultCurrency,
          date,
          type: 'recurring' as const,
          color: r.type === 'income' ? '#10B981' : '#F59E0B',
        }))
      ),
    ]

    setEvents(allEvents)
    setIsLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (authLoading || !user) { setIsLoading(false); return }; fetchEvents(date) }, [date, authLoading, user?.id])

  const selectedDateEvents = events.filter(e => isSameDay(parseISO(e.date), date))
  const eventDays = new Set(events.map(e => e.date))

  const modifiers = {
    hasEvent: (d: Date) => eventDays.has(format(d, 'yyyy-MM-dd')),
  }

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      {/* Calendar */}
      <Card>
        <CardContent className="p-3">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            onMonthChange={(m) => setDate(m)}
            className="w-full"
            modifiers={modifiers}
            modifiersStyles={{
              hasEvent: {
                fontWeight: 'bold',
                textDecoration: 'underline',
                textDecorationColor: '#8B5CF6',
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Selected day events */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-base">{format(date, 'MMMM d, yyyy')}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : selectedDateEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events for this day</p>
          ) : (
            <div className="space-y-2">
              {selectedDateEvents.map(event => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{event.title}</p>
                    <Badge
                      variant="secondary"
                      className="text-[10px] capitalize mt-0.5"
                      style={{ backgroundColor: `${event.color}20`, color: event.color }}
                    >
                      {event.type}
                    </Badge>
                  </div>
                  <span className="text-sm font-bold shrink-0" style={{ color: event.color }}>
                    {event.type !== 'transaction' || true ? '-' : ''}{formatCurrency(event.amount, event.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="px-4 py-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {[
              { label: 'Income', color: '#22C55E' },
              { label: 'Expense', color: '#EF4444' },
              { label: 'Bill Due', color: '#F97316' },
              { label: 'Subscription', color: '#8B5CF6' },
              { label: 'Recurring (expense)', color: '#F59E0B' },
              { label: 'Recurring (income)', color: '#10B981' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
