'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ArrowLeftRight, Wallet, BarChart3, Grid3X3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/dashboard',    icon: Home,            label: 'Home' },
  { href: '/transactions', icon: ArrowLeftRight,  label: 'Pay' },
  { href: '/accounts',     icon: Wallet,          label: 'Wallet' },
  { href: '/analytics',    icon: BarChart3,       label: 'Insights' },
  { href: '/more',         icon: Grid3X3,         label: 'More' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 z-50"
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="mx-3 mb-3 nav-glass rounded-[1.4rem] flex items-center justify-around px-2 py-2">
        {TABS.map(tab => {
          const active = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 min-w-[3.25rem] cursor-pointer"
            >
              <div className={cn(
                'w-12 h-8 flex items-center justify-center rounded-xl transition-all duration-200',
                active ? 'gradient-primary shadow-md' : 'hover:bg-muted/70'
              )}>
                <tab.icon className={cn(
                  'transition-all duration-200',
                  active ? 'w-[1.1rem] h-[1.1rem] text-white' : 'w-[1.05rem] h-[1.05rem] text-muted-foreground'
                )} />
              </div>
              <span className={cn(
                'text-[9.5px] font-semibold tracking-wide transition-colors duration-200',
                active ? 'text-primary' : 'text-muted-foreground/55'
              )}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
