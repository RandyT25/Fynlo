'use client'

import { Bell, Search, Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUIStore } from '@/store/ui.store'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const { setCommandOpen } = useUIStore()
  const { theme, setTheme } = useTheme()
  const { profile } = useAuth()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-30 flex items-center px-6 gap-4">
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold truncate">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="hidden sm:flex items-center gap-2 text-muted-foreground w-48 justify-start"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="w-4 h-4" />
          <span className="text-sm">Search...</span>
          <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
        </Button>

        <Button variant="ghost" size="icon" onClick={() => setCommandOpen(true)} className="sm:hidden">
          <Search className="w-4 h-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon">
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : theme === 'light' ? <Sun className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="w-4 h-4 mr-2" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="w-4 h-4 mr-2" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="w-4 h-4 mr-2" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="relative" onClick={() => window.location.href='/notifications'}>
          <Bell className="w-4 h-4" />
        </Button>

        <a href="/settings">
          <Avatar className="w-8 h-8 cursor-pointer">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="gradient-primary text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </a>
      </div>
    </header>
  )
}
