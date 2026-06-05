import { Metadata } from 'next'
import { AppLayout } from '@/components/layout/app-layout'
import { SettingsContent } from '@/features/settings/settings-content'

export const metadata: Metadata = { title: 'Settings' }

export default function SettingsPage() {
  return (
    <AppLayout title="Settings">
      <SettingsContent />
    </AppLayout>
  )
}
