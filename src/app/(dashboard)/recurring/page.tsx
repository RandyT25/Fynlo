import { Metadata } from 'next'
import { AppLayout } from '@/components/layout/app-layout'
import { RecurringContent } from '@/features/recurring/recurring-content'
export const metadata: Metadata = { title: 'Recurring' }
export default function RecurringPage() {
  return <AppLayout title="Recurring"><RecurringContent /></AppLayout>
}
