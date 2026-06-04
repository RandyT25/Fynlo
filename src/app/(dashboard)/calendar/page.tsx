import { Metadata } from 'next'
import { AppLayout } from '@/components/layout/app-layout'
import { CalendarContent } from '@/features/calendar/calendar-content'

export const metadata: Metadata = { title: 'Calendar' }

export default function CalendarPage() {
  return (
    <AppLayout title="Calendar" subtitle="Financial events and reminders">
      <CalendarContent />
    </AppLayout>
  )
}
