'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileHeaderProps {
  title: string
  right?: React.ReactNode
}

export function MobileHeader({ title, right }: MobileHeaderProps) {
  return (
    <header className="flex items-center h-14 px-4 sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border shrink-0">
      <div className="w-8 shrink-0" />
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
