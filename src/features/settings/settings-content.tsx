'use client'

import { useState, useRef } from 'react'
import {
  LogOut, ChevronRight, Check, DollarSign,
  Bell, Pencil, ShieldAlert, Globe, Palette, Camera,
} from 'lucide-react'
import { toast } from 'sonner'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { useAuth } from '@/hooks/use-auth'
import { useAuthStore } from '@/store/auth.store'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar',           flag: '🇺🇸' },
  { code: 'EUR', label: 'Euro',                flag: '🇪🇺' },
  { code: 'GBP', label: 'British Pound',       flag: '🇬🇧' },
  { code: 'AUD', label: 'Australian Dollar',   flag: '🇦🇺' },
  { code: 'CAD', label: 'Canadian Dollar',     flag: '🇨🇦' },
  { code: 'SGD', label: 'Singapore Dollar',    flag: '🇸🇬' },
  { code: 'JPY', label: 'Japanese Yen',        flag: '🇯🇵' },
  { code: 'IDR', label: 'Indonesian Rupiah',   flag: '🇮🇩' },
  { code: 'MYR', label: 'Malaysian Ringgit',   flag: '🇲🇾' },
  { code: 'THB', label: 'Thai Baht',           flag: '🇹🇭' },
  { code: 'HKD', label: 'Hong Kong Dollar',    flag: '🇭🇰' },
  { code: 'KRW', label: 'South Korean Won',    flag: '🇰🇷' },
  { code: 'CNY', label: 'Chinese Yuan',        flag: '🇨🇳' },
  { code: 'INR', label: 'Indian Rupee',        flag: '🇮🇳' },
  { code: 'BRL', label: 'Brazilian Real',      flag: '🇧🇷' },
  { code: 'MXN', label: 'Mexican Peso',        flag: '🇲🇽' },
]

type Timezone = { value: string; label: string; fullLabel: string; offset: string }

function buildTimezones(): Timezone[] {
  try {
    return Intl.supportedValuesOf('timeZone').map(tz => {
      try {
        const offset = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' })
          .formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value ?? ''
        const city = tz.split('/').pop()?.replace(/_/g, ' ') ?? tz
        const fullLabel = tz.replace(/_/g, ' ')
        return { value: tz, label: city, fullLabel, offset }
      } catch {
        return { value: tz, label: tz, fullLabel: tz, offset: '' }
      }
    }).sort((a, b) => a.value.localeCompare(b.value))
  } catch {
    return [{ value: 'UTC', label: 'UTC', fullLabel: 'UTC', offset: 'GMT+0' }]
  }
}

type ActiveSheet = 'profile' | 'currency' | 'timezone' | null

const deviceTimezone = typeof Intl !== 'undefined'
  ? Intl.DateTimeFormat().resolvedOptions().timeZone
  : 'UTC'

export function SettingsContent() {
  const { user, profile, signOut } = useAuth()
  const { setProfile } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [openSheet, setOpenSheet] = useState<ActiveSheet>(null)
  const [name, setName] = useState(profile?.full_name ?? '')
  const [currency, setCurrency] = useState(profile?.currency ?? 'USD')
  const [timezone, setTimezone] = useState(
    (profile?.timezone && profile.timezone !== 'UTC') ? profile.timezone : deviceTimezone
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [tzSearch, setTzSearch] = useState('')
  const [allTimezones, setAllTimezones] = useState<Timezone[]>([])

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? 'U'

  const displayName = profile?.full_name || null
  const notificationsEnabled = profile?.notifications_enabled ?? true
  const selectedCurrency = CURRENCIES.find(c => c.code === currency)

  const save = async (fields: Record<string, unknown>) => {
    setIsSaving(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user!.id, email: user!.email!, ...fields })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Saved')
      const base = profile ?? { id: user!.id, email: user!.email! }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setProfile({ ...base, ...fields } as any)
    }
    setIsSaving(false)
    setOpenSheet(null)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return }
    setIsUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (upErr) { toast.error(upErr.message); setIsUploadingAvatar(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await save({ avatar_url: `${publicUrl}?t=${Date.now()}` })
    setIsUploadingAvatar(false)
  }

  return (
    <div className="pb-24">

      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {/* ── Hero profile banner ── */}
      <div className="relative overflow-hidden gradient-primary px-6 pt-10 pb-16 rounded-b-[2.5rem]">
        {/* decorative orbs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

        <div className="relative flex flex-col items-center gap-3 text-center">
          {/* Avatar ring */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full ring-4 ring-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl overflow-hidden">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-3xl font-black text-white tracking-tight">{initials}</span>
              }
            </div>
            {/* Camera / upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
              aria-label="Upload photo"
            >
              {isUploadingAvatar
                ? <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                : <Camera className="w-3.5 h-3.5 text-gray-700" />
              }
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 justify-center">
              <h2 className="text-xl font-bold text-white leading-tight">
                {displayName ?? <span className="text-white/50 text-base font-medium italic">Add your name</span>}
              </h2>
              <button
                onClick={() => { setName(profile?.full_name ?? ''); setOpenSheet('profile') }}
                className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30 transition-colors cursor-pointer"
                aria-label="Edit name"
              >
                <Pencil className="w-3 h-3 text-white" />
              </button>
            </div>
            <p className="text-sm text-white/60 mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 mt-5 space-y-3">

        {/* Preferences */}
        <Card>
          <SectionLabel>Preferences</SectionLabel>
          <Row
            icon={<DollarSign className="w-[18px] h-[18px]" />}
            iconClass="bg-blue-500 text-white"
            label="Currency"
            value={`${selectedCurrency?.flag ?? ''} ${currency}`}
            onPress={() => setOpenSheet('currency')}
          />
          <Row
            icon={<Globe className="w-[18px] h-[18px]" />}
            iconClass="bg-violet-500 text-white"
            label="Timezone"
            value={timezone.split('/').pop()?.replace(/_/g, ' ') ?? timezone}
            onPress={() => setOpenSheet('timezone')}
            border
          />
        </Card>

        {/* Appearance */}
        <Card>
          <SectionLabel>Appearance</SectionLabel>
          <div className="flex items-center px-4 py-3.5 gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Palette className="w-[18px] h-[18px]" />
            </div>
            <span className="flex-1 text-sm font-semibold">Theme</span>
            <div className="flex gap-1 bg-muted/80 rounded-xl p-1">
              {(['light', 'dark', 'system'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer',
                    theme === t
                      ? 'gradient-primary text-white shadow-sm'
                      : 'text-muted-foreground'
                  )}
                >
                  {t === 'system' ? 'Auto' : t}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <SectionLabel>Notifications</SectionLabel>
          <div className="flex items-center px-4 py-3.5 gap-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bell className="w-[18px] h-[18px]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">All Notifications</p>
              <p className="text-xs text-muted-foreground">Bills, budgets &amp; goal alerts</p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={val => save({ notifications_enabled: val })}
              className="data-[state=checked]:bg-rose-500"
            />
          </div>
        </Card>

        {/* Account */}
        <Card>
          <SectionLabel>Account</SectionLabel>
          <button
            className="flex items-center px-4 py-3.5 w-full gap-3 active:bg-destructive/5 transition-colors cursor-pointer"
            onClick={signOut}
          >
            <div className="w-9 h-9 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
              <LogOut className="w-[18px] h-[18px]" />
            </div>
            <span className="text-sm font-semibold text-destructive">Sign Out</span>
          </button>
          <button
            className="flex items-center px-4 py-3.5 w-full gap-3 border-t border-border/40 active:bg-destructive/5 transition-colors cursor-pointer"
            onClick={() => toast.error('Contact support to delete your account')}
          >
            <div className="w-9 h-9 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
              <ShieldAlert className="w-[18px] h-[18px]" />
            </div>
            <span className="text-sm font-semibold text-destructive">Delete Account</span>
          </button>
        </Card>

        <p className="text-center text-xs text-muted-foreground/40 pt-2 pb-1">Fynlo · v1.0.0</p>
      </div>

      {/* ── Edit Name Sheet ── */}
      <Sheet open={openSheet === 'profile'} onOpenChange={o => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="h-auto rounded-t-3xl pb-8">
          <SheetHeader className="pb-5">
            <SheetTitle>Edit Name</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-1">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Full Name</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="rounded-2xl h-12 text-base"
              />
            </div>
            <Button
              className="w-full gradient-primary border-0 rounded-2xl h-12 font-bold text-base"
              onClick={() => save({ full_name: name })}
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Currency Sheet ── */}
      <Sheet open={openSheet === 'currency'} onOpenChange={o => !o && setOpenSheet(null)}>
        <SheetContent side="bottom" className="h-[72dvh] rounded-t-3xl flex flex-col">
          <SheetHeader className="pb-4 shrink-0">
            <SheetTitle>Currency</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto flex-1 space-y-1 pb-4 px-1">
            {CURRENCIES.map(c => (
              <button
                key={c.code}
                className={cn(
                  'flex items-center w-full px-4 py-3.5 rounded-2xl text-left transition-colors cursor-pointer gap-3',
                  currency === c.code
                    ? 'bg-primary/10 ring-1 ring-primary/30'
                    : 'active:bg-muted/60'
                )}
                onClick={() => { setCurrency(c.code); save({ currency: c.code }) }}
              >
                <span className="text-xl leading-none">{c.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{c.code}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.label}</p>
                </div>
                {currency === c.code && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Timezone Sheet ── */}
      <Sheet open={openSheet === 'timezone'} onOpenChange={o => { if (o && allTimezones.length === 0) setAllTimezones(buildTimezones()); if (!o) { setOpenSheet(null); setTzSearch('') } }}>
        <SheetContent side="bottom" className="h-[85dvh] rounded-t-3xl flex flex-col">
          <SheetHeader className="pb-3 shrink-0">
            <SheetTitle>Timezone</SheetTitle>
          </SheetHeader>
          <div className="px-1 pb-3 shrink-0">
            <Input
              placeholder="Search timezone…"
              value={tzSearch}
              onChange={e => setTzSearch(e.target.value)}
              className="rounded-2xl h-11"
            />
          </div>
          <div className="overflow-y-auto flex-1 space-y-1 pb-4 px-1">
            {allTimezones
              .filter(tz =>
                !tzSearch ||
                tz.value.toLowerCase().includes(tzSearch.toLowerCase()) ||
                tz.label.toLowerCase().includes(tzSearch.toLowerCase())
              )
              .map(tz => (
                <button
                  key={tz.value}
                  className={cn(
                    'flex items-center w-full px-4 py-3 rounded-2xl text-left transition-colors cursor-pointer',
                    timezone === tz.value
                      ? 'bg-primary/10 ring-1 ring-primary/30'
                      : 'active:bg-muted/60'
                  )}
                  onClick={() => { setTimezone(tz.value); save({ timezone: tz.value }); setTzSearch('') }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tz.fullLabel}</p>
                  </div>
                  <span className="text-xs text-muted-foreground ml-3 shrink-0">{tz.offset}</span>
                  {timezone === tz.value && <Check className="w-4 h-4 text-primary ml-2 shrink-0" />}
                </button>
              ))
            }
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-3xl overflow-hidden border border-border/60 shadow-sm">
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 pt-3 pb-1 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
      {children}
    </p>
  )
}

function Row({
  icon, iconClass, label, value, onPress, border,
}: {
  icon: React.ReactNode
  iconClass: string
  label: string
  value?: string
  onPress?: () => void
  border?: boolean
}) {
  return (
    <button
      className={cn(
        'flex items-center px-4 py-3.5 w-full text-left active:bg-muted/40 transition-colors cursor-pointer gap-3',
        border && 'border-t border-border/40'
      )}
      onClick={onPress}
    >
      <div className={cn('w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm', iconClass)}>
        {icon}
      </div>
      <span className="flex-1 text-sm font-semibold">{label}</span>
      {value && <span className="text-sm text-muted-foreground max-w-[120px] truncate">{value}</span>}
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
    </button>
  )
}
