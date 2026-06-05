'use client'

import { useState } from 'react'
import { LogOut, ChevronRight, Palette, Bell, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'JPY', 'IDR']
const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris',
  'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney',
]

export function SettingsContent() {
  const { user, profile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const supabase = createClient()

  const [showProfile, setShowProfile] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [name, setName] = useState(profile?.full_name ?? '')
  const [currency, setCurrency] = useState(profile?.currency ?? 'USD')
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'UTC')
  const [isSaving, setIsSaving] = useState(false)

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? 'U'

  const saveProfile = async () => {
    setIsSaving(true)
    const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', user!.id)
    if (error) toast.error(error.message)
    else { toast.success('Saved'); setShowProfile(false) }
    setIsSaving(false)
  }

  const savePreferences = async () => {
    setIsSaving(true)
    const { error } = await supabase.from('profiles').update({ currency, timezone }).eq('id', user!.id)
    if (error) toast.error(error.message)
    else { toast.success('Saved'); setShowPreferences(false) }
    setIsSaving(false)
  }

  return (
    <div className="px-4 pt-4 pb-4 space-y-5">

      {/* Profile card */}
      <div
        className="flex items-center gap-4 p-4 bg-card rounded-3xl shadow-sm border border-border/50 active:bg-muted/50 cursor-pointer"
        onClick={() => setShowProfile(true)}
      >
        <Avatar className="w-14 h-14 shrink-0">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="gradient-primary text-white text-lg font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">{profile?.full_name ?? 'Your Name'}</p>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>

      {/* Preferences */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Preferences</p>
        <div className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border/50">
          <button
            className="flex items-center px-4 py-4 w-full text-left active:bg-muted/50"
            onClick={() => setShowPreferences(true)}
          >
            <span className="flex-1 text-sm font-medium">Currency</span>
            <span className="text-sm text-muted-foreground mr-2">{currency}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            className="flex items-center px-4 py-4 w-full text-left border-t border-border/40 active:bg-muted/50"
            onClick={() => setShowPreferences(true)}
          >
            <span className="flex-1 text-sm font-medium">Timezone</span>
            <span className="text-sm text-muted-foreground mr-2 truncate max-w-[140px] text-right">{timezone}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Appearance</p>
        <div className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border/50">
          <div className="flex items-center px-4 py-4">
            <Palette className="w-5 h-5 text-muted-foreground mr-3" />
            <span className="flex-1 text-sm font-medium">Theme</span>
            <div className="flex gap-1.5">
              {(['light', 'dark', 'system'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all',
                    theme === t ? 'gradient-primary text-white' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Notifications</p>
        <div className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border/50">
          {[
            { label: 'Push Notifications', desc: 'Alerts on your device' },
            { label: 'Email Notifications', desc: 'Alerts via email' },
            { label: 'Bill Reminders', desc: 'Upcoming bills' },
            { label: 'Budget Alerts', desc: 'When limit exceeded' },
            { label: 'Goal Milestones', desc: 'Celebrate your progress' },
          ].map((item, i) => (
            <div key={i} className={cn('flex items-center px-4 py-3.5', i > 0 && 'border-t border-border/40')}>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </div>
      </div>

      {/* Account */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Account</p>
        <div className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border/50">
          <button
            className="flex items-center px-4 py-4 w-full text-left active:bg-muted/50"
            onClick={signOut}
          >
            <LogOut className="w-5 h-5 text-destructive mr-3" />
            <span className="text-sm font-medium text-destructive">Sign Out</span>
          </button>
          <button
            className="flex items-center px-4 py-4 w-full text-left border-t border-border/40 active:bg-muted/50"
            onClick={() => toast.error('Contact support to delete your account')}
          >
            <Trash2 className="w-5 h-5 text-destructive mr-3" />
            <span className="text-sm font-medium text-destructive">Delete Account</span>
          </button>
        </div>
      </div>

      {/* Edit Name Sheet */}
      <Sheet open={showProfile} onOpenChange={setShowProfile}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl pb-8">
          <SheetHeader className="pb-4"><SheetTitle>Edit Profile</SheetTitle></SheetHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="rounded-2xl" />
            </div>
            <Button className="w-full gradient-primary border-0 rounded-2xl" onClick={saveProfile} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Preferences Sheet */}
      <Sheet open={showPreferences} onOpenChange={setShowPreferences}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl pb-8">
          <SheetHeader className="pb-4"><SheetTitle>Preferences</SheetTitle></SheetHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full gradient-primary border-0 rounded-2xl" onClick={savePreferences} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
