'use client'

import { useState } from 'react'
import { LogOut, ChevronRight, Trash2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { useAuth } from '@/hooks/use-auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'CAD', label: 'Canadian Dollar' },
  { code: 'SGD', label: 'Singapore Dollar' },
  { code: 'JPY', label: 'Japanese Yen' },
  { code: 'IDR', label: 'Indonesian Rupiah' },
  { code: 'MYR', label: 'Malaysian Ringgit' },
  { code: 'THB', label: 'Thai Baht' },
  { code: 'HKD', label: 'Hong Kong Dollar' },
  { code: 'KRW', label: 'South Korean Won' },
  { code: 'CNY', label: 'Chinese Yuan' },
  { code: 'INR', label: 'Indian Rupee' },
  { code: 'BRL', label: 'Brazilian Real' },
  { code: 'MXN', label: 'Mexican Peso' },
]

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern (New York)' },
  { value: 'America/Chicago', label: 'Central (Chicago)' },
  { value: 'America/Denver', label: 'Mountain (Denver)' },
  { value: 'America/Los_Angeles', label: 'Pacific (Los Angeles)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris / Berlin' },
  { value: 'Europe/Moscow', label: 'Moscow' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Kolkata', label: 'India (Kolkata)' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Seoul', label: 'Seoul' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Australia/Sydney', label: 'Sydney' },
]

type Sheet = 'profile' | 'currency' | 'timezone' | null

export function SettingsContent() {
  const { user, profile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const supabase = createClient()

  const [openSheet, setOpenSheet] = useState<Sheet>(null)
  const [name, setName] = useState(profile?.full_name ?? '')
  const [currency, setCurrency] = useState(profile?.currency ?? 'USD')
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'UTC')
  const [isSaving, setIsSaving] = useState(false)

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? 'U'

  const save = async (fields: Record<string, string>) => {
    setIsSaving(true)
    const { error } = await supabase.from('profiles').update(fields).eq('id', user!.id)
    if (error) toast.error(error.message)
    else toast.success('Saved')
    setIsSaving(false)
    setOpenSheet(null)
  }

  const currencyLabel = CURRENCIES.find(c => c.code === currency)?.code ?? currency
  const timezoneLabel = TIMEZONES.find(t => t.value === timezone)?.label ?? timezone

  return (
    <div className="px-4 pt-4 pb-8 space-y-5">

      {/* Profile */}
      <div
        className="flex items-center gap-4 p-4 bg-card rounded-3xl shadow-sm border border-border/50 active:bg-muted/50 cursor-pointer"
        onClick={() => setOpenSheet('profile')}
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
      <Section title="Preferences">
        <Row label="Currency" value={currencyLabel} onPress={() => setOpenSheet('currency')} />
        <Row label="Timezone" value={timezoneLabel} onPress={() => setOpenSheet('timezone')} />
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <div className="flex items-center px-4 py-4">
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
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
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
      </Section>

      {/* Account */}
      <Section title="Account">
        <button className="flex items-center px-4 py-4 w-full text-left active:bg-muted/50" onClick={signOut}>
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
      </Section>

      {/* Edit Name */}
      <Sheet open={openSheet === 'profile'} onOpenChange={o => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl pb-8">
          <SheetHeader className="pb-4"><SheetTitle>Edit Profile</SheetTitle></SheetHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="rounded-2xl" />
            </div>
            <Button className="w-full gradient-primary border-0 rounded-2xl h-12" onClick={() => save({ full_name: name })} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Currency picker */}
      <Sheet open={openSheet === 'currency'} onOpenChange={o => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="h-[70dvh] rounded-t-3xl">
          <SheetHeader className="pb-4"><SheetTitle>Default Currency</SheetTitle></SheetHeader>
          <div className="overflow-y-auto space-y-1 pb-4">
            {CURRENCIES.map(c => (
              <button
                key={c.code}
                className={cn(
                  'flex items-center w-full px-4 py-3.5 rounded-2xl text-left transition-colors',
                  currency === c.code ? 'bg-primary/10' : 'active:bg-muted/50'
                )}
                onClick={() => { setCurrency(c.code); save({ currency: c.code }) }}
              >
                <span className="font-semibold text-sm w-12">{c.code}</span>
                <span className="flex-1 text-sm text-muted-foreground">{c.label}</span>
                {currency === c.code && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Timezone picker */}
      <Sheet open={openSheet === 'timezone'} onOpenChange={o => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="h-[70dvh] rounded-t-3xl">
          <SheetHeader className="pb-4"><SheetTitle>Timezone</SheetTitle></SheetHeader>
          <div className="overflow-y-auto space-y-1 pb-4">
            {TIMEZONES.map(tz => (
              <button
                key={tz.value}
                className={cn(
                  'flex items-center w-full px-4 py-3.5 rounded-2xl text-left transition-colors',
                  timezone === tz.value ? 'bg-primary/10' : 'active:bg-muted/50'
                )}
                onClick={() => { setTimezone(tz.value); save({ timezone: tz.value }) }}
              >
                <span className="flex-1 text-sm font-medium">{tz.label}</span>
                {timezone === tz.value && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">{title}</p>
      <div className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border/50">
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  return (
    <button
      className="flex items-center px-4 py-4 w-full text-left border-t border-border/40 first:border-0 active:bg-muted/50 transition-colors"
      onClick={onPress}
    >
      <span className="flex-1 text-sm font-medium">{label}</span>
      {value && <span className="text-sm text-muted-foreground mr-2">{value}</span>}
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  )
}
