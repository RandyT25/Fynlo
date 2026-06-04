'use client'

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { format, startOfMonth, endOfMonth, parseISO, isSameDay } from 'date-fns'
import { formatCurrency } from '@/lib/utils/format'
import { LoadingPage } from '@/components/shared/loading-spinner'

interface CalendarEvent {
  id: string
  title: string
  amount: number
  date: string
  type: 'transaction' | 'bill' | 'subscription' | 'recurring'
  color: string
}

export function CalendarContent() {
  const [date, setDate] = useState<Date>(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { fetchEvents(date) }, [date])

  const fetchEvents = async (d: Date) => {
    setIsLoading(true)
    const start = format(startOfMonth(d), 'yyyy-MM-dd')
    const end = format(endOfMonth(d), 'yyyy-MM-dd')

    const [txnsRes, billsRes, subsRes] = await Promise.all([
      supabase.from('transactions').select('id,description,amount,date,type').is('deleted_at', null).gte('date', start).lte('date', end),
      supabase.from('bill_reminders').select('id,name,amount,due_date').is('deleted_at', null).gte('due_date', start).lte('due_date', end).eq('is_completed', false),
      supabase.from('subscriptions').select('id,name,amount,next_billing_date').eq('status', 'active').is('deleted_at', null).gte('next_billing_date', start).lte('next_billing_date', end),
    ])
    const txns = (txnsRes.data ?? []) as Array<{ id: string; description: string; amount: number; date: string; type: string }>
    const bills = (billsRes.data ?? []) as Array<{ id: string; name: string; amount: number; due_date: string }>
    const subs = (subsRes.data ?? []) as Array<{ id: string; name: string; amount: number; next_billing_date: string }>

    const allEvents: CalendarEvent[] = [
      ...txns.map(t => ({ id: t.id, title: t.description, amount: t.amount, date: t.date, type: 'transaction' as const, color: t.type === 'income' ? '#22C55E' : '#EF4444' })),
      ...bills.map(b => ({ id: b.id, title: b.name, amount: b.amount, date: b.due_date, type: 'bill' as const, color: '#F97316' })),
      ...subs.map(s => ({ id: s.id, title: s.name, amount: s.amount, date: s.next_billing_date, type: 'subscription' as const, color: '#8B5CF6' })),
    ]

    setEvents(allEvents)
    setIsLoading(false)
  }

  const selectedDateEvents = events.filter(e => isSameDay(parseISO(e.date), date))
  const eventDays = new Set(events.map(e => e.date))

  const modifiers = {
    hasEvent: (d: Date) => eventDays.has(format(d, 'yyyy-MM-dd'))
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                className="w-full"
                modifiers={modifiers}
                modifiersStyles={{ hasEvent: { fontWeight: 'bold', textDecoration: 'underline', textDecorationColor: '#3B82F6' } }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{format(date, 'MMMM d, yyyy')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : selectedDateEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events for this day</p>
              ) : (
                <div className="space-y-2">
                  {selectedDateEvents.map(event => (
                    <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <Badge variant="secondary" className="text-[10px] capitalize">{event.type}</Badge>
                      </div>
                      <span className="text-sm font-semibold shrink-0">{formatCurrency(event.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Income', color: '#22C55E' },
                { label: 'Expense', color: '#EF4444' },
                { label: 'Bill Due', color: '#F97316' },
                { label: 'Subscription', color: '#8B5CF6' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
