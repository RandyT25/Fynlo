import { AppLayout } from '@/components/layout/app-layout'
import { MoreContent } from '@/features/more/more-content'

export const metadata = { title: 'More' }

export default function MorePage() {
  return (
    <AppLayout title="More">
      <MoreContent />
    </AppLayout>
  )
}
