'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingPage } from '@/components/shared/loading-spinner'
import { formatDateRelative } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types/database'

const TYPE_COLORS: Record<string, string> = {
  bill_due: '#F97316', budget_exceeded: '#EF4444', goal_milestone: '#22C55E',
  subscription_renewal: '#8B5CF6', transfer_reminder: '#3B82F6', general: '#6B7280',
}

export function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { fetchNotifications() }, [])

  const fetchNotifications = async () => {
    setIsLoading(true)
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)
    setNotifications(data ?? [])
    setIsLoading(false)
  }

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read).map(n => n.id)
    if (!unread.length) return
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).in('id', unread)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (isLoading) return <LoadingPage />

  return (
    <div className="px-4 pt-4 pb-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">{unreadCount} unread</span>
          <button className="text-primary text-sm font-medium" onClick={markAllRead}>Mark all read</button>
        </div>
      )}
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border/50">
          {notifications.map((n, i) => (
            <div
              key={n.id}
              className={cn('flex items-start gap-3 px-4 py-4 cursor-pointer active:bg-muted/50', i > 0 && 'border-t border-border/40', !n.is_read && 'bg-primary/5')}
              onClick={() => markRead(n.id)}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${TYPE_COLORS[n.type] ?? '#6B7280'}20` }}>
                <Bell className="w-4 h-4" style={{ color: TYPE_COLORS[n.type] ?? '#6B7280' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{formatDateRelative(n.created_at)}</p>
              </div>
              {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
