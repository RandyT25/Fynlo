'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ArrowLeftRight, Wallet, PiggyBank, Target,
  BarChart3, Calendar, CreditCard, Users, Bell, Settings,
  ChevronLeft, ChevronRight, LogOut, Search, Repeat2,
  ListChecks, ShoppingCart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/ui.store'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/accounts', icon: Wallet, label: 'Accounts' },
  { href: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { href: '/recurring', icon: Repeat2, label: 'Recurring' },
  { href: '/family', icon: Users, label: 'Family' },
  { href: '/tasks', icon: ListChecks, label: 'Tasks' },
  { href: '/wishlist', icon: ShoppingCart, label: 'Wishlist' },
]

const BOTTOM_ITEMS = [
  { href: '/notifications', icon: Bell, label: 'Notifications', badge: true },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const { profile, signOut } = useAuth()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0].toUpperCase() ?? 'U'

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 240 : 72 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="hidden md:flex flex-col h-screen bg-card border-r border-border sticky top-0 z-40 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-xl text-gradient whitespace-nowrap"
              >
                Fynlo
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className={cn('ml-auto shrink-0', !sidebarOpen && 'hidden')}
          onClick={() => setSidebarOpen(false)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 scrollbar-hide">
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href)
          const el = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <item.icon className={cn('w-5 h-5 shrink-0', active && 'text-primary-foreground')} />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )

          if (!sidebarOpen) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger>{el}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          }
          return el
        })}
      </nav>

      {/* Bottom items */}
      <div className="px-2 py-2 space-y-1 border-t border-border">
        {BOTTOM_ITEMS.map(item => {
          const active = pathname.startsWith(item.href)
          const el = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <div className="relative">
                <item.icon className="w-5 h-5 shrink-0" />
              </div>
              {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          )
          if (!sidebarOpen) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger>{el}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          }
          return el
        })}
      </div>

      {/* User profile */}
      <div className="p-3 border-t border-border">
        <div className={cn('flex items-center gap-3', !sidebarOpen && 'justify-center')}>
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="gradient-primary text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium truncate">{profile?.full_name ?? 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 w-8 h-8 text-muted-foreground hover:text-destructive"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Collapse toggle when closed */}
      {!sidebarOpen && (
        <div className="p-3 border-t border-border">
          <Button variant="ghost" size="icon" className="w-full" onClick={() => setSidebarOpen(true)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </motion.aside>
  )
}
