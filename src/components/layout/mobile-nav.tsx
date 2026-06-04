'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, PiggyBank, BarChart3, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useUIStore } from '@/store/ui.store'
import { Sidebar } from './sidebar'

const MOBILE_NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
]

export function MobileNav() {
  const pathname = usePathname()
  const { mobileNavOpen, setMobileNavOpen } = useUIStore()

  return (
    <>
      {/* Bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border safe-pb">
        <div className="flex items-center justify-around px-2 py-2">
          {MOBILE_NAV.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className={cn('w-5 h-5', active && 'text-primary')} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger>
              <button className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl text-muted-foreground">
                <Menu className="w-5 h-5" />
                <span className="text-[10px] font-medium">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[240px]">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  )
}
