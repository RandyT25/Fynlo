'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'
import { format, differenceInDays, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { useCurrencySymbol } from '@/hooks/use-currency-symbol'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingPage } from '@/components/shared/loading-spinner'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Subscription } from '@/types/database'

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

export function SubscriptionsContent() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editSub, setEditSub] = useState<Subscription | null>(null)
  const supabase = createClient()

  const fetchSubs = useCallback(async () => {
    setIsLoading(true)
    const { data } = await supabase.from('subscriptions').select('*').is('deleted_at', null).order('next_billing_date')
    setSubscriptions(data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchSubs() }, [fetchSubs])

  const active = subscriptions.filter(s => s.status === 'active')
  const monthlyTotal = active.reduce((sum, s) => {
    const mult = { weekly: 4.33, monthly: 1, quarterly: 1/3, yearly: 1/12 }
    return sum + s.amount * (mult[s.billing_cycle] ?? 1)
  }, 0)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subscription?')) return
    await supabase.from('subscriptions').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    toast.success('Subscription deleted')
    fetchSubs()
  }

  if (isLoading) return <LoadingPage />

  return (
    <div className="px-4 pt-4 pb-4">
      {/* Summary */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 gradient-primary rounded-2xl p-4 text-white">
          <p className="text-white/70 text-xs mb-1">Monthly Cost</p>
          <p className="text-2xl font-bold">{formatCurrency(monthlyTotal)}</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="bg-card rounded-2xl px-4 py-2.5 shadow-sm border border-border/50">
            <p className="text-[11px] text-muted-foreground">Yearly</p>
            <p className="font-bold text-sm text-destructive">{formatCurrency(monthlyTotal * 12)}</p>
          </div>
          <div className="bg-card rounded-2xl px-4 py-2.5 shadow-sm border border-border/50">
            <p className="text-[11px] text-muted-foreground">Active</p>
            <p className="font-bold text-sm">{active.length}</p>
          </div>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <EmptyState icon={CreditCard} title="No subscriptions" description="Track your recurring charges and services" action={{ label: 'Add Subscription', onClick: () => setShowForm(true) }} />
      ) : (
        <div className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border/50">
          {subscriptions.map((sub, i) => {
            const daysLeft = differenceInDays(parseISO(sub.next_billing_date), new Date())
            const isUrgent = daysLeft <= 3 && sub.status === 'active'
            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className={cn('flex items-center gap-3 px-4 py-3.5 active:bg-muted/50 cursor-pointer', i > 0 && 'border-t border-border/40')}
                onClick={() => { setEditSub(sub); setShowForm(true) }}
              >
                <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center text-xl shrink-0">
                  {sub.logo_url ? <img src={sub.logo_url} alt="" className="w-7 h-7 rounded-lg" /> : '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{sub.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {sub.billing_cycle}{isUrgent ? ` · Due in ${daysLeft}d` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-destructive">-{formatCurrency(sub.amount, sub.currency)}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(sub.next_billing_date)}</p>
                </div>
              </motion.div>
            )
          })}
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

      <Sheet open={showForm} onOpenChange={open => { setShowForm(open); if (!open) setEditSub(null) }}>
        <SheetContent side="bottom" className="h-[90dvh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="pb-2"><SheetTitle>{editSub ? 'Edit' : 'Add'} Subscription</SheetTitle></SheetHeader>
          <SubscriptionForm
            sub={editSub ?? undefined}
            onSuccess={() => { setShowForm(false); setEditSub(null); fetchSubs() }}
            onCancel={() => { setShowForm(false); setEditSub(null) }}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

interface SubscriptionFormProps {
  sub?: Subscription
  onSuccess?: () => void
  onCancel?: () => void
}

function SubscriptionForm({ sub, onSuccess, onCancel }: SubscriptionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const currencySymbol = useCurrencySymbol()
  const supabase = createClient()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SubscriptionInput>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: sub ? {
      name: sub.name, amount: sub.amount, currency: sub.currency,
      billing_cycle: sub.billing_cycle, next_billing_date: sub.next_billing_date,
      status: sub.status, notes: sub.notes ?? '',
    } : { billing_cycle: 'monthly', status: 'active', currency: 'USD', next_billing_date: format(new Date(), 'yyyy-MM-dd') },
  })

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
          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
            <Input type="number" step="0.01" className="pl-7" {...register('amount', { valueAsNumber: true })} />
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
        <Label>Website (optional)</Label>
        <Input placeholder="https://..." {...register('website_url')} />
      </div>
      <div className="flex gap-2 pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>}
        <Button type="submit" className="flex-1 gradient-primary border-0" disabled={isLoading}>
          {isLoading ? 'Saving...' : sub ? 'Update' : 'Add Subscription'}
        </Button>
      </div>
    </form>
  )
}
