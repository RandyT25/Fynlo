import { Metadata } from 'next'
import { AppLayout } from '@/components/layout/app-layout'
import { WishlistContent } from '@/features/wishlist/wishlist-content'
export const metadata: Metadata = { title: 'Wishlist' }
export default function WishlistPage() {
  return <AppLayout title="Wishlist"><WishlistContent /></AppLayout>
}
