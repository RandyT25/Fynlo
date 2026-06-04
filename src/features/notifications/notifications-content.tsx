'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">All Notifications</h2>
          {unreadCount > 0 && <Badge className="gradient-primary border-0">{unreadCount} unread</Badge>}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifications.map(notification => (
            <Card key={notification.id} className={cn('card-hover', !notification.is_read && 'border-primary/30 bg-primary/5')}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${TYPE_COLORS[notification.type] ?? '#6B7280'}20` }}>
                  <Bell className="w-5 h-5" style={{ color: TYPE_COLORS[notification.type] ?? '#6B7280' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateRelative(notification.created_at)}</p>
                </div>
                {!notification.is_read && (
                  <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={() => markRead(notification.id)}>
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
