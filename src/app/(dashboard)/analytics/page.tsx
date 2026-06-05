import { Metadata } from 'next'
import { AppLayout } from '@/components/layout/app-layout'
import { AnalyticsContent } from '@/features/analytics/analytics-content'

export const metadata: Metadata = { title: 'Analytics' }

export default function AnalyticsPage() {
  return (
    <AppLayout title="Analytics">
      <AnalyticsContent />
    </AppLayout>
  )
}
