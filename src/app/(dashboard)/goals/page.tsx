import { Metadata } from 'next'
import { AppLayout } from '@/components/layout/app-layout'
import { GoalsContent } from '@/features/goals/goals-content'

export const metadata: Metadata = { title: 'Goals' }

export default function GoalsPage() {
  return (
    <AppLayout title="Goals">
      <GoalsContent />
    </AppLayout>
  )
}
