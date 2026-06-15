import { MobileNav } from './mobile-nav'
import { MobileHeader } from './mobile-header'

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  headerRight?: React.ReactNode
}

export function AppLayout({ children, title, headerRight }: AppLayoutProps) {
  return (
    <div className="max-w-[430px] mx-auto bg-background min-h-[100dvh]">
      {title && <MobileHeader title={title} right={headerRight} />}
      {/* Extra bottom padding: floating nav (≈64px) + safe area + 8px breathing room */}
      <div style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
        {children}
      </div>
      <MobileNav />
    </div>
  )
}
