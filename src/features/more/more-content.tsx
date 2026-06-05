'use client'

import Link from 'next/link'
import { PiggyBank, Target, CreditCard, Repeat2, Calendar, Users, ListChecks, ShoppingCart, Settings, Bell, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const SECTIONS = [
  {
    title: 'Finance',
    items: [
      { href: '/budgets', icon: PiggyBank, label: 'Budgets', color: '#22C55E', bg: '#22C55E20' },
      { href: '/goals', icon: Target, label: 'Goals', color: '#3B82F6', bg: '#3B82F620' },
      { href: '/subscriptions', icon: CreditCard, label: 'Subscriptions', color: '#8B5CF6', bg: '#8B5CF620' },
      { href: '/recurring', icon: Repeat2, label: 'Recurring', color: '#F59E0B', bg: '#F59E0B20' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { href: '/calendar', icon: Calendar, label: 'Calendar', color: '#EF4444', bg: '#EF444420' },
      { href: '/family', icon: Users, label: 'Family', color: '#EC4899', bg: '#EC489920' },
      { href: '/tasks', icon: ListChecks, label: 'Tasks', color: '#14B8A6', bg: '#14B8A620' },
      { href: '/wishlist', icon: ShoppingCart, label: 'Wishlist', color: '#F97316', bg: '#F9731620' },
    ],
  },
]

export function MoreContent() {
  const { profile, signOut } = useAuth()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <div className="px-4 pt-4 pb-6 space-y-6">
      {/* Profile card */}
      <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-3xl">
        <Avatar className="w-14 h-14">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="gradient-primary text-white text-lg font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{profile?.full_name ?? 'Your Name'}</p>
          <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
        </div>
        <Link href="/settings" className="text-primary text-sm font-medium">Edit</Link>
      </div>

      {/* Feature sections */}
      {SECTIONS.map(section => (
        <div key={section.title}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{section.title}</p>
          <div className="grid grid-cols-2 gap-3">
            {section.items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-start gap-3 p-4 rounded-2xl bg-muted/40 active:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: item.bg }}>
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Settings + Notifications */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Account</p>
        <div className="space-y-1">
          <Link href="/notifications" className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/40 active:bg-muted transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-sm">Notifications</span>
          </Link>
          <Link href="/settings" className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/40 active:bg-muted transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-sm">Settings</span>
          </Link>
          <button
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-muted/40 active:bg-muted transition-colors text-left"
            onClick={signOut}
          >
            <LogOut className="w-5 h-5 text-destructive" />
            <span className="font-medium text-sm text-destructive">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
