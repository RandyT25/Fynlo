import { Metadata } from 'next'
import { AppLayout } from '@/components/layout/app-layout'
import { BudgetsContent } from '@/features/budgets/budgets-content'

export const metadata: Metadata = { title: 'Budgets' }

export default function BudgetsPage() {
  return (
    <AppLayout title="Budgets" subtitle="Control your spending with smart budgets">
      <BudgetsContent />
    </AppLayout>
  )
}
