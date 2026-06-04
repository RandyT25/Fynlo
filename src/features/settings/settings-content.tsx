'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, LogOut, Trash2 } from 'lucide-react'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'IDR', 'SGD', 'JPY']
const TIMEZONES = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney']

export function SettingsContent() {
  const { user, profile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const supabase = createClient()
  const [isSaving, setIsSaving] = useState(false)

  const { register, handleSubmit } = useForm({
    defaultValues: {
      full_name: profile?.full_name ?? '',
      currency: profile?.currency ?? 'USD',
      timezone: profile?.timezone ?? 'UTC',
      notifications_enabled: profile?.notifications_enabled ?? true,
    }
  })

  const onSubmit = async (data: any) => {
    setIsSaving(true)
    const { error } = await supabase.from('profiles').update(data).eq('id', user!.id)
    if (error) toast.error(error.message)
    else toast.success('Settings saved')
    setIsSaving(false)
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="gradient-primary text-white text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{profile?.full_name ?? 'User'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant="outline" className="text-xs mt-1">Free Plan</Badge>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input {...register('full_name')} placeholder="Your name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Currency</Label>
                <Select defaultValue={profile?.currency ?? 'USD'} onValueChange={(v) => {}}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select defaultValue={profile?.timezone ?? 'UTC'} onValueChange={(v) => {}}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="gradient-primary border-0" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'light', label: 'Light', icon: Sun },
              { value: 'dark', label: 'Dark', icon: Moon },
              { value: 'system', label: 'System', icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-colors ${theme === value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
              >
                <Icon className={`w-5 h-5 ${theme === value ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${theme === value ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Control how you receive alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Push Notifications', desc: 'Get notified on your device' },
            { label: 'Email Notifications', desc: 'Receive alerts via email' },
            { label: 'Bill Reminders', desc: 'Alerts for upcoming bills' },
            { label: 'Budget Alerts', desc: 'Notify when budget exceeded' },
            { label: 'Goal Milestones', desc: 'Celebrate goal progress' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full gap-2" onClick={signOut}>
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
          <Button variant="destructive" className="w-full gap-2" onClick={() => toast.error('Account deletion requires contacting support')}>
            <Trash2 className="w-4 h-4" /> Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
