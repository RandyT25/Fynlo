'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, CreditCard, Check, BanknoteIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { format, differenceInDays, parseISO, addWeeks, addMonths, addYears } from 'date-fns'
import { toast } from 'sonner'
import { useCurrency } from '@/hooks/use-currency'
import { useCurrencySymbol } from '@/hooks/use-currency-symbol'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingPage } from '@/components/shared/loading-spinner'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Subscription, Account } from '@/types/database'

const subscriptionSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().length(3),
  billing_cycle: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  next_billing_date: z.string(),
  status: z.enum(['active', 'cancelled', 'paused']),
  website_url: z.string().url().optional().or(z.literal('')).nullable(),
  notes: z.string().optional().nullable(),
})

type SubscriptionInput = z.infer<typeof subscriptionSchema>

function advanceBillingDate(date: string, cycle: string): string {
  const d = parseISO(date)
  switch (cycle) {
    case 'weekly': return format(addWeeks(d, 1), 'yyyy-MM-dd')
    case 'quarterly': return format(addMonths(d, 3), 'yyyy-MM-dd')
    case 'yearly': return format(addYears(d, 1), 'yyyy-MM-dd')
    default: return format(addMonths(d, 1), 'yyyy-MM-dd')
  }
}

export function SubscriptionsContent() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editSub, setEditSub] = useState<Subscription | null>(null)
  const [payingSub, setPayingSub] = useState<Subscription | null>(null)
  const [payAccountId, setPayAccountId] = useState('')
  const [payLoading, setPayLoading] = useState(false)
  const currency = useCurrency()
  const supabase = createClient()

  const fetchSubs = useCallback(async () => {
    setIsLoading(true)
    const [{ data: subs }, { data: accts }] = await Promise.all([
      supabase.from('subscriptions').select('*').is('deleted_at', null).order('next_billing_date'),
      supabase.from('accounts').select('*').is('deleted_at', null).order('created_at', { ascending: true }),
    ])
    setSubscriptions(subs ?? [])
    setAccounts(accts ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchSubs() }, [fetchSubs])

  // Auto-create subscription_renewal notifications for due subscriptions (deduped per day)
  useEffect(() => {
    if (!subscriptions.length) return
    const generateNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = format(new Date(), 'yyyy-MM-dd')
      const dueSubs = subscriptions.filter(s => {
        if (s.status !== 'active') return false
        const days = differenceInDays(parseISO(s.next_billing_date), new Date())
        return days <= 7
      })
      if (!dueSubs.length) return

      // Fetch existing notifications created today for these subscriptions
      const { data: existing } = await supabase
        .from('notifications')
        .select('reference_id')
        .eq('reference_type', 'subscription')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)

      const notifiedIds = new Set((existing ?? []).map((n: { reference_id: string | null }) => n.reference_id))

      for (const sub of dueSubs) {
        if (notifiedIds.has(sub.id)) continue
        const days = differenceInDays(parseISO(sub.next_billing_date), new Date())
        const title = days < 0
          ? `${sub.name} payment overdue`
          : days === 0
            ? `${sub.name} is due today`
            : `${sub.name} due in ${days} day${days === 1 ? '' : 's'}`
        const message = `${formatCurrency(sub.amount, sub.currency)} · ${sub.billing_cycle} subscription`
        await supabase.from('notifications').insert({
          user_id: user.id,
          title,
          message,
          type: 'subscription_renewal',
          reference_id: sub.id,
          reference_type: 'subscription',
        })
      }
    }
    generateNotifications()
  }, [subscriptions])

  const active = subscriptions.filter(s => s.status === 'active')
  const inactive = subscriptions.filter(s => s.status !== 'active')

  const monthlyTotal = active.reduce((sum, s) => {
    const mult: Record<string, number> = { weekly: 4.33, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 }
    return sum + s.amount * (mult[s.billing_cycle] ?? 1)
  }, 0)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subscription?')) return
    await supabase.from('subscriptions').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    toast.success('Subscription deleted')
    fetchSubs()
  }

  const openPay = (sub: Subscription) => {
    setPayAccountId(accounts[0]?.id ?? '')
    setPayingSub(sub)
  }

  const markAsPaid = async () => {
    if (!payingSub || !payAccountId) { toast.error('Select an account'); return }
    setPayLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setPayLoading(false); return }

    const nextDate = advanceBillingDate(payingSub.next_billing_date, payingSub.billing_cycle)

    const [txResult, subResult] = await Promise.all([
      supabase.from('transactions').insert({
        user_id: user.id,
        account_id: payAccountId,
        type: 'expense',
        amount: payingSub.amount,
        currency: payingSub.currency,
        description: payingSub.name,
        notes: `${payingSub.billing_cycle} subscription`,
        date: format(new Date(), 'yyyy-MM-dd'),
        tags: ['subscription'],
        is_reconciled: false,
      }),
      supabase.from('subscriptions').update({ next_billing_date: nextDate }).eq('id', payingSub.id),
    ])

    if (txResult.error) { toast.error(txResult.error.message); setPayLoading(false); return }
    if (subResult.error) { toast.error(subResult.error.message); setPayLoading(false); return }

    await supabase.from('notifications').insert({
      user_id: user.id,
      title: `${payingSub.name} marked as paid`,
      message: `${formatCurrency(payingSub.amount, payingSub.currency)} logged. Next due ${formatDate(nextDate)}.`,
      type: 'subscription_renewal',
      reference_id: payingSub.id,
      reference_type: 'subscription',
    })

    toast.success('Paid & logged to transactions')
    setPayingSub(null)
    setPayLoading(false)
    fetchSubs()
  }

  if (isLoading) return <LoadingPage />

  return (
    <div className="px-4 pt-4 pb-4">
      {/* Summary */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 gradient-primary rounded-2xl p-4 text-white">
          <p className="text-white/70 text-xs mb-1">Monthly Cost</p>
          <p className="text-2xl font-bold">{formatCurrency(monthlyTotal, currency)}</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="bg-card rounded-2xl px-4 py-2.5 shadow-sm border border-border/50">
            <p className="text-[11px] text-muted-foreground">Yearly</p>
            <p className="font-bold text-sm text-destructive">{formatCurrency(monthlyTotal * 12, currency)}</p>
          </div>
          <div className="bg-card rounded-2xl px-4 py-2.5 shadow-sm border border-border/50">
            <p className="text-[11px] text-muted-foreground">Active</p>
            <p className="font-bold text-sm">{active.length}</p>
          </div>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <EmptyState icon={CreditCard} title="No subscriptions" description="Tap + to track your recurring charges" />
      ) : (
        <div className="space-y-3">
          {/* Active subscriptions */}
          {active.length > 0 && (
            <div className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border/50">
              {active.map((sub, i) => {
                const daysLeft = differenceInDays(parseISO(sub.next_billing_date), new Date())
                const isOverdue = daysLeft < 0
                const isDueSoon = daysLeft <= 3 && daysLeft >= 0
                return (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn('px-4 py-3.5 cursor-pointer', i > 0 && 'border-t border-border/40')}
                  >
                    <div
                      className="flex items-center gap-3"
                      onClick={() => { setEditSub(sub); setShowForm(true) }}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center text-xl shrink-0">
                        {sub.logo_url ? <img src={sub.logo_url} alt="" className="w-7 h-7 rounded-lg" /> : '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{sub.name}</p>
                        <p className={cn('text-xs capitalize', isOverdue ? 'text-destructive font-medium' : isDueSoon ? 'text-orange-400 font-medium' : 'text-muted-foreground')}>
                          {sub.billing_cycle} · {isOverdue ? `Overdue by ${Math.abs(daysLeft)}d` : daysLeft === 0 ? 'Due today' : `Due in ${daysLeft}d`}
                        </p>
                      </div>
                      <div className="text-right shrink-0 mr-2">
                        <p className="font-bold text-sm text-destructive">-{formatCurrency(sub.amount, sub.currency)}</p>
                        <p className="text-[11px] text-muted-foreground">{formatDate(sub.next_billing_date)}</p>
                      </div>
                    </div>
                    <div className="flex justify-end mt-2.5">
                      <button
                        onClick={() => openPay(sub)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/15 text-green-500 text-xs font-semibold active:bg-green-500/25 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark as Paid
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Stopped / paused subscriptions */}
          {inactive.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Stopped / Paused</p>
              <div className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border/50 opacity-60">
                {inactive.map((sub, i) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn('flex items-center gap-3 px-4 py-3.5 cursor-pointer', i > 0 && 'border-t border-border/40')}
                    onClick={() => { setEditSub(sub); setShowForm(true) }}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center text-xl shrink-0 grayscale">
                      {sub.logo_url ? <img src={sub.logo_url} alt="" className="w-7 h-7 rounded-lg" /> : '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{sub.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{sub.billing_cycle}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={cn('text-[10px]', sub.status === 'cancelled' ? 'border-destructive/40 text-destructive/70' : 'border-orange-400/40 text-orange-400/70')}>
                        {sub.status === 'cancelled' ? 'Stopped' : 'Paused'}
                      </Badge>
                      <p className="font-bold text-sm text-muted-foreground">{formatCurrency(sub.amount, sub.currency)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        className="fixed z-40 w-14 h-14 rounded-full gradient-primary text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))', right: '1rem' }}
        onClick={() => { setEditSub(null); setShowForm(true) }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add / Edit sheet */}
      <Sheet open={showForm} onOpenChange={open => { setShowForm(open); if (!open) setEditSub(null) }}>
        <SheetContent side="bottom" className="h-[92dvh] rounded-t-3xl flex flex-col gap-0 p-0">
          <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b border-border/30">
            <SheetTitle>{editSub ? 'Edit' : 'Add'} Subscription</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4">
            <SubscriptionForm
              sub={editSub ?? undefined}
              onSuccess={() => { setShowForm(false); setEditSub(null); fetchSubs() }}
              onCancel={() => { setShowForm(false); setEditSub(null) }}
              onDelete={editSub ? () => { handleDelete(editSub.id); setShowForm(false); setEditSub(null) } : undefined}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Mark as Paid sheet */}
      <Sheet open={!!payingSub} onOpenChange={open => { if (!open) setPayingSub(null) }}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0">
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-border/30">
            <SheetTitle>Mark as Paid</SheetTitle>
          </SheetHeader>
          <div className="px-4 pt-5 pb-8 space-y-5">
            {payingSub && (
              <>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">
                    {payingSub.logo_url ? <img src={payingSub.logo_url} alt="" className="w-6 h-6 rounded-lg" /> : '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{payingSub.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{payingSub.billing_cycle} · next due {formatDate(advanceBillingDate(payingSub.next_billing_date, payingSub.billing_cycle))}</p>
                  </div>
                  <p className="font-bold text-destructive shrink-0">{formatCurrency(payingSub.amount, payingSub.currency)}</p>
                </div>

                {accounts.length > 0 ? (
                  <div className="space-y-2">
                    <Label>Deduct from account</Label>
                    <Select value={payAccountId} onValueChange={(v) => setPayAccountId(v ?? '')}>
                      <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                      <SelectContent>
                        {accounts.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">Add an account first to log transactions.</p>
                )}

                <Button
                  className="w-full h-12 rounded-2xl bg-green-500 hover:bg-green-600 border-0 font-semibold text-white"
                  onClick={markAsPaid}
                  disabled={payLoading || !payAccountId}
                >
                  <BanknoteIcon className="w-4 h-4 mr-2" />
                  {payLoading ? 'Logging…' : 'Confirm Payment'}
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

interface SubscriptionFormProps {
  sub?: Subscription
  onSuccess?: () => void
  onCancel?: () => void
  onDelete?: () => void
}

function SubscriptionForm({ sub, onSuccess, onCancel, onDelete }: SubscriptionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const userCurrency = useCurrency()
  const currencySymbol = useCurrencySymbol()
  const supabase = createClient()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SubscriptionInput>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: sub ? {
      name: sub.name, amount: sub.amount, currency: sub.currency,
      billing_cycle: sub.billing_cycle, next_billing_date: sub.next_billing_date,
      status: sub.status, notes: sub.notes ?? '',
    } : { billing_cycle: 'monthly', status: 'active', currency: userCurrency, next_billing_date: format(new Date(), 'yyyy-MM-dd') },
  })

  const status = watch('status')

  const onSubmit = async (data: SubscriptionInput) => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setIsLoading(false); return }
    const payload = { ...data, website_url: data.website_url || null }
    if (sub) {
      const { error } = await supabase.from('subscriptions').update(payload).eq('id', sub.id)
      if (error) { toast.error(error.message); setIsLoading(false); return }
      toast.success('Subscription updated')
    } else {
      const { error } = await supabase.from('subscriptions').insert({ ...payload, user_id: user.id })
      if (error) { toast.error(error.message); setIsLoading(false); return }
      toast.success('Subscription added')
    }
    onSuccess?.()
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Service Name</Label>
        <Input placeholder="e.g., Netflix, Spotify" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount</Label>
          <div className="flex items-stretch overflow-hidden rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-ring transition-all">
            <span className="flex items-center px-3 text-sm font-semibold text-muted-foreground bg-muted/50 border-r border-input shrink-0 select-none min-w-[2.5rem] justify-center">
              {currencySymbol}
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              className="flex-1 px-3 py-2 text-base font-semibold bg-transparent outline-none placeholder:text-muted-foreground/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              {...register('amount', { valueAsNumber: true })}
            />
          </div>
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Cycle</Label>
          <Select onValueChange={(v) => setValue('billing_cycle', v as SubscriptionInput['billing_cycle'])} defaultValue={sub?.billing_cycle ?? 'monthly'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Next Billing Date</Label>
        <Input type="date" {...register('next_billing_date')} />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setValue('status', v as SubscriptionInput['status'])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="cancelled">Stopped</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Website (optional)</Label>
        <Input placeholder="https://..." {...register('website_url')} />
      </div>
      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Input placeholder="Any notes…" {...register('notes')} />
      </div>
      <div className="sticky bottom-0 bg-background/98 backdrop-blur-sm pt-3 pb-6 border-t border-border/20 mt-4 space-y-2">
        <div className="flex gap-2">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 rounded-2xl">Cancel</Button>}
          <Button type="submit" className="flex-1 h-12 rounded-2xl gradient-primary border-0 font-semibold" disabled={isLoading}>
            {isLoading ? 'Saving…' : sub ? 'Update' : 'Add Subscription'}
          </Button>
        </div>
        {onDelete && (
          <Button type="button" variant="ghost" onClick={onDelete} className="w-full h-10 rounded-2xl text-destructive hover:text-destructive hover:bg-destructive/10">
            Delete Subscription
          </Button>
        )}
      </div>
    </form>
  )
}
