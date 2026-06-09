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
      className="fixed bottom-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50"
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
      }}
    >
      <div
        className="flex items-center justify-around px-2 pt-1.5"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {TABS.map(tab => {
          const active = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 min-w-[3.5rem]',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'w-10 h-8 flex items-center justify-center rounded-xl transition-all duration-200',
                active ? 'bg-primary/12' : 'hover:bg-muted/60'
              )}>
                <tab.icon className={cn('transition-all duration-200', active ? 'w-5 h-5' : 'w-[1.15rem] h-[1.15rem]')} />
              </div>
              <span className={cn('text-[10px] font-semibold transition-colors duration-200', active ? 'text-primary' : 'text-muted-foreground')}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
