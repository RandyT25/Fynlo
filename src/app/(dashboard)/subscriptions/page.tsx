import { Metadata } from 'next'
import { AppLayout } from '@/components/layout/app-layout'
import { SubscriptionsContent } from '@/features/subscriptions/subscriptions-content'

export const metadata: Metadata = { title: 'Subscriptions' }

export default function SubscriptionsPage() {
  return (
    <AppLayout title="Subscriptions">
      <SubscriptionsContent />
    </AppLayout>
  )
}
