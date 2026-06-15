'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'

interface MobileHeaderProps {
  title: string
  right?: React.ReactNode
}

export function MobileHeader({ title, right }: MobileHeaderProps) {
  return (
    <header className="flex items-center h-14 px-4 sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/50 shrink-0">
      <div className="w-8 shrink-0" />
      <h1 className="flex-1 text-center text-[15px] font-semibold tracking-[-0.01em]">{title}</h1>
      {right ?? (
        <Link href="/notifications" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/70 transition-colors cursor-pointer">
          <Bell className="w-[1.05rem] h-[1.05rem] text-muted-foreground" />
        </Link>
      )}
    </header>
  )
}
