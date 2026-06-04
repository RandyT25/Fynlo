import { Metadata } from 'next'
import { AppLayout } from '@/components/layout/app-layout'
import { DashboardContent } from '@/features/dashboard/dashboard-content'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardPage() {
  return (
    <AppLayout title="Dashboard" subtitle="Your financial overview">
      <DashboardContent />
    </AppLayout>
  )
}
