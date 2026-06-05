import { Metadata } from 'next'
import { AppLayout } from '@/components/layout/app-layout'
import { FamilyContent } from '@/features/family/family-content'
export const metadata: Metadata = { title: 'Family' }
export default function FamilyPage() {
  return <AppLayout title="Family"><FamilyContent /></AppLayout>
}
