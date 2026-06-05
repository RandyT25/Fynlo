'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'

interface MobileHeaderProps {
  title: string
  right?: React.ReactNode
}

export function MobileHeader({ title, right }: MobileHeaderProps) {
  const { profile } = useAuth()
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <header className="flex items-center h-14 px-4 sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border shrink-0">
      <a href="/settings">
        <Avatar className="w-8 h-8">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="gradient-primary text-white text-xs font-bold">{initials}</AvatarFallback>
        </Avatar>
      </a>
      <h1 className="flex-1 text-center text-base font-semibold">{title}</h1>
      {right ?? (
        <a href="/notifications">
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Bell className="w-4 h-4" />
          </Button>
        </a>
      )}
    </header>
  )
}
