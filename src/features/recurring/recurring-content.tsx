'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Repeat2, Play, Pause, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns'
import { toast } from 'sonner'
import { useCurrencySymbol } from '@/hooks/use-currency-symbol'
import { useCurrency } from '@/hooks/use-currency'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { useAuthStore } from '@/store/auth.store'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { recurringTransactionSchema, type RecurringTransactionInput } from '@/lib/validations/transaction'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
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
  const { user, isLoading: authLoading } = useAuthStore()
  const [recurrings, setRecurrings] = useState<RecurringTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<RecurringTransaction | null>(null)
  const supabase = createClient()

  const fetchRecurrings = useCallback(async () => {
    setIsLoading(true)
    const { data } = await supabase.from('recurring_transactions').select('*').is('deleted_at', null).order('next_date')
    setRecurrings(data ?? [])
    setIsLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (authLoading || !user) { setIsLoading(false); return }; fetchRecurrings() }, [fetchRecurrings, authLoading, user?.id])

  const togglePause = async (r: RecurringTransaction) => {
    await supabase.from('recurring_transactions').update({ is_paused: !r.is_paused }).eq('id', r.id)
    toast.success(r.is_paused ? 'Resumed' : 'Paused')
    fetchRecurrings()
  }

  const deleteRecurring = async (id: string) => {
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
          <SheetContent side="bottom" className="h-[92dvh] rounded-t-3xl flex flex-col gap-0 p-0">
            <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b border-border/30"><SheetTitle>Add Recurring Transaction</SheetTitle></SheetHeader>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4">
              <RecurringForm onSuccess={() => { setShowForm(false); fetchRecurrings() }} onCancel={() => setShowForm(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {recurrings.length === 0 ? (
        <EmptyState icon={Repeat2} title="No recurring transactions" description="Tap 'Add Recurring' above to set up auto-entries" />
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
                    <Button variant="ghost" size="icon" className="w-8 h-8 hover:text-destructive" onClick={() => setDeleteTarget(r)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete recurring transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.description}&rdquo; will be permanently deleted. Future entries will stop being created.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) { deleteRecurring(deleteTarget.id); setDeleteTarget(null) } }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface RecurringFormProps { onSuccess?: () => void; onCancel?: () => void }

function RecurringForm({ onSuccess, onCancel }: RecurringFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { accounts } = useAccounts()
  const currencySymbol = useCurrencySymbol()
  const supabase = createClient()

  const userCurrencyCode = useCurrency()
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RecurringTransactionInput>({
    resolver: zodResolver(recurringTransactionSchema),
    defaultValues: { type: 'expense', frequency: 'monthly', interval: 1, start_date: format(new Date(), 'yyyy-MM-dd'), currency: userCurrencyCode || 'USD', auto_create: true, tags: [] },
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
        <Label>Account</Label>
        <Select onValueChange={(v) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setValue('account_id', v as any)
        }}>
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
      <div className="sticky bottom-0 bg-background/98 backdrop-blur-sm flex gap-2 pt-3 pb-6 border-t border-border/20 mt-4">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 rounded-2xl">Cancel</Button>}
        <Button type="submit" className="flex-1 h-12 rounded-2xl gradient-primary border-0 font-semibold" disabled={isLoading}>
          {isLoading ? 'Saving…' : 'Create Recurring'}
        </Button>
      </div>
    </form>
  )
}
