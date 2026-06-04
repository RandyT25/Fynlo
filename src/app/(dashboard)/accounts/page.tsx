import { Metadata } from 'next'
import { AppLayout } from '@/components/layout/app-layout'
import { AccountsContent } from '@/features/accounts/accounts-content'

export const metadata: Metadata = { title: 'Accounts' }

export default function AccountsPage() {
  return (
    <AppLayout title="Accounts" subtitle="Manage all your financial accounts">
      <AccountsContent />
    </AppLayout>
  )
}
