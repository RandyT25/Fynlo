import { Metadata } from 'next'
import { AppLayout } from '@/components/layout/app-layout'
import { TransactionsContent } from '@/features/transactions/transactions-content'

export const metadata: Metadata = { title: 'Transactions' }

export default function TransactionsPage() {
  return (
    <AppLayout title="Transactions" subtitle="Track every dollar in and out">
      <TransactionsContent />
    </AppLayout>
  )
}
