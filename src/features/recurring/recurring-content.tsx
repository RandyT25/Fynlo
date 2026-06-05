'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Repeat2, Play, Pause, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns'
import { toast } from 'sonner'
import { useCurrencySymbol } from '@/hooks/use-currency-symbol'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { recurringTransactionSchema, type RecurringTransactionInput } from '@/lib/validations/transaction'
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
import { getTransactionColor } from '@/lib/utils/colors'
import { cn } from '@/lib/utils'
import { useAccounts } from '@/hooks/use-accounts'
import type { RecurringTransaction } from '@/types/database'

const FREQ_LABELS: Record<string, string> = {
  daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 weeks',
  monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly', custom: 'Custom',
}

export function RecurringContent() {
  const [recurrings, setRecurrings] = useState<RecurringTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const supabase = createClient()

  const fetchRecurrings = useCallback(async () => {
    setIsLoading(true)
    const { data } = await supabase.from('recurring_transactions').select('*').is('deleted_at', null).order('next_date')
    setRecurrings(data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchRecurrings() }, [fetchRecurrings])

  const togglePause = async (r: RecurringTransaction) => {
    await supabase.from('recurring_transactions').update({ is_paused: !r.is_paused }).eq('id', r.id)
    toast.success(r.is_paused ? 'Resumed' : 'Paused')
    fetchRecurrings()
  }

  const deleteRecurring = async (id: string) => {
    if (!confirm('Delete this recurring transaction?')) return
    await supabase.from('recurring_transactions').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    toast.success('Deleted')
    fetchRecurrings()
  }

  if (isLoading) return <LoadingPage />

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <div className="flex justify-end">
        <Sheet open={showForm} onOpenChange={setShowForm}>
          <SheetTrigger>
            <Button className="gradient-primary border-0 gap-2"><Plus className="w-4 h-4" /> Add Recurring</Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90dvh] overflow-y-auto rounded-t-3xl">
            <SheetHeader><SheetTitle>Add Recurring Transaction</SheetTitle></SheetHeader>
            <div className="mt-6">
              <RecurringForm onSuccess={() => { setShowForm(false); fetchRecurrings() }} onCancel={() => setShowForm(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {recurrings.length === 0 ? (
        <EmptyState icon={Repeat2} title="No recurring transactions" description="Set up automatic recurring income and expenses" action={{ label: 'Add Recurring', onClick: () => setShowForm(true) }} />
      ) : (
        <div className="space-y-2">
          {recurrings.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className={cn('card-hover', r.is_paused && 'opacity-60')}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${getTransactionColor(r.type)}20` }}>
                    <Repeat2 className="w-5 h-5" style={{ color: getTransactionColor(r.type) }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{r.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] capitalize">{r.type}</Badge>
                      <Badge variant="outline" className="text-[10px]">{FREQ_LABELS[r.frequency]}</Badge>
                      {r.is_paused && <Badge variant="secondary" className="text-[10px]">Paused</Badge>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('font-bold', r.type === 'income' ? 'text-green-500' : '')}>
                      {r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount, r.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">Next: {formatDate(r.next_date)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => togglePause(r)}>
                      {r.is_paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 hover:text-destructive" onClick={() => deleteRecurring(r.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

interface RecurringFormProps { onSuccess?: () => void; onCancel?: () => void }

function RecurringForm({ onSuccess, onCancel }: RecurringFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { accounts } = useAccounts()
  const currencySymbol = useCurrencySymbol()
  const supabase = createClient()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RecurringTransactionInput>({
    resolver: zodResolver(recurringTransactionSchema),
    defaultValues: { type: 'expense', frequency: 'monthly', interval: 1, start_date: format(new Date(), 'yyyy-MM-dd'), currency: 'USD', auto_create: true },
  })

  const type = watch('type')

  const getNextDate = (startDate: string, frequency: string) => {
    const d = new Date(startDate)
    switch (frequency) {
      case 'daily': return format(addDays(d, 1), 'yyyy-MM-dd')
      case 'weekly': return format(addWeeks(d, 1), 'yyyy-MM-dd')
      case 'biweekly': return format(addWeeks(d, 2), 'yyyy-MM-dd')
      case 'monthly': return format(addMonths(d, 1), 'yyyy-MM-dd')
      case 'quarterly': return format(addMonths(d, 3), 'yyyy-MM-dd')
      case 'yearly': return format(addYears(d, 1), 'yyyy-MM-dd')
      default: return format(addMonths(d, 1), 'yyyy-MM-dd')
    }
  }

  const onSubmit = async (data: RecurringTransactionInput) => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setIsLoading(false); return }
    const next_date = getNextDate(data.start_date, data.frequency)
    const { error } = await supabase.from('recurring_transactions').insert({ ...data, user_id: user.id, next_date })
    if (error) { toast.error(error.message); setIsLoading(false); return }
    toast.success('Recurring transaction created')
    onSuccess?.()
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {['income','expense','transfer','refund'].map(t => (
          <button key={t} type="button" onClick={() => setValue('type', t as RecurringTransactionInput['type'])}
            className={cn('py-2 rounded-xl text-xs font-medium border transition-all', type === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <Label>Amount</Label>
        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
          <Input type="number" step="0.01" className="pl-7" {...register('amount', { valueAsNumber: true })} />
        </div>
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Account</Label>
        <Select onValueChange={(v: string | null) => setValue('account_id', v as any)}>
          <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
          <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input placeholder="e.g., Netflix subscription" {...register('description')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Frequency</Label>
          <Select onValueChange={(v) => setValue('frequency', v as RecurringTransactionInput['frequency'])} defaultValue="monthly">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries({ daily:'Daily',weekly:'Weekly',biweekly:'Biweekly',monthly:'Monthly',quarterly:'Quarterly',yearly:'Yearly' }).map(([v,l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input type="date" {...register('start_date')} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>End Date (optional)</Label>
        <Input type="date" {...register('end_date')} />
      </div>
      <div className="flex gap-2 pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>}
        <Button type="submit" className="flex-1 gradient-primary border-0" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Create Recurring'}
        </Button>
      </div>
    </form>
  )
}
