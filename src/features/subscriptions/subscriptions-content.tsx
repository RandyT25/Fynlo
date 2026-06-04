'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, CreditCard, Calendar, AlertCircle, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { format, differenceInDays, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-3 gap-4">
        <Card className="gradient-primary text-white">
          <CardContent className="p-4">
            <p className="text-white/70 text-sm">Monthly Cost</p>
            <p className="text-2xl font-bold">{formatCurrency(monthlyTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Yearly Cost</p>
            <p className="text-xl font-bold text-red-500">{formatCurrency(monthlyTotal * 12)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active Subs</p>
            <p className="text-xl font-bold">{active.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Sheet open={showForm} onOpenChange={open => { setShowForm(open); if (!open) setEditSub(null) }}>
          <SheetTrigger>
            <Button className="gradient-primary border-0 gap-2"><Plus className="w-4 h-4" /> Add Subscription</Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>{editSub ? 'Edit' : 'Add'} Subscription</SheetTitle></SheetHeader>
            <div className="mt-6">
              <SubscriptionForm
                sub={editSub ?? undefined}
                onSuccess={() => { setShowForm(false); setEditSub(null); fetchSubs() }}
                onCancel={() => { setShowForm(false); setEditSub(null) }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {subscriptions.length === 0 ? (
        <EmptyState icon={CreditCard} title="No subscriptions" description="Track your recurring charges and services" action={{ label: 'Add Subscription', onClick: () => setShowForm(true) }} />
      ) : (
        <div className="space-y-2">
          {subscriptions.map((sub, i) => {
            const daysLeft = differenceInDays(parseISO(sub.next_billing_date), new Date())
            const isUrgent = daysLeft <= 3 && sub.status === 'active'

            return (
              <motion.div key={sub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className={cn('card-hover', isUrgent && 'border-orange-300 dark:border-orange-800')}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-2xl shrink-0">
                      {sub.logo_url ? <img src={sub.logo_url} alt="" className="w-8 h-8 rounded" /> : '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{sub.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={sub.status === 'active' ? 'default' : 'secondary'} className={cn('text-[10px]', sub.status === 'active' && 'bg-green-500')}>
                          {sub.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">{sub.billing_cycle}</Badge>
                        {isUrgent && (
                          <span className="text-[10px] text-orange-500 flex items-center gap-0.5">
                            <AlertCircle className="w-3 h-3" /> Due in {daysLeft}d
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(sub.amount, sub.currency)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(sub.next_billing_date)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => { setEditSub(sub); setShowForm(true) }}>✎</Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8 hover:text-destructive" onClick={() => handleDelete(sub.id)}>✕</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
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
          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
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
