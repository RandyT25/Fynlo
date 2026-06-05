'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ArrowLeftRight, Wallet, BarChart3, Grid3X3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/accounts', icon: Wallet, label: 'Accounts' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/more', icon: Grid3X3, label: 'More' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 z-50 bg-background border-t border-border"
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
      }}
    >
      <div
        className="flex items-center justify-around px-1 pt-2"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {TABS.map(tab => {
          const active = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
