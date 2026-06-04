import { Metadata } from 'next'
import { AppLayout } from '@/components/layout/app-layout'
import { NotificationsContent } from '@/features/notifications/notifications-content'
export const metadata: Metadata = { title: 'Notifications' }
export default function NotificationsPage() {
  return <AppLayout title="Notifications" subtitle="Your activity and alerts"><NotificationsContent /></AppLayout>
}
