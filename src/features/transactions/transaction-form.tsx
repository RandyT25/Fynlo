'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { transactionSchema, type TransactionInput } from '@/lib/validations/transaction'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAccounts } from '@/hooks/use-accounts'
import { useCurrency } from '@/hooks/use-currency'
import { useCurrencySymbol } from '@/hooks/use-currency-symbol'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types/database'

const TRANSACTION_TYPES = [
  { value: 'expense', label: 'Expense', color: 'text-red-500' },
  { value: 'income', label: 'Income', color: 'text-green-500' },
  { value: 'transfer', label: 'Transfer', color: 'text-blue-500' },
  { value: 'refund', label: 'Refund', color: 'text-purple-500' },
]

interface TransactionFormProps {
  transaction?: Transaction
  onSuccess?: () => void
  onCancel?: () => void
}

export function TransactionForm({ transaction, onSuccess, onCancel }: TransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { accounts } = useAccounts()
  const userCurrency = useCurrency()
  const currencySymbol = useCurrencySymbol()
  const supabase = createClient()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction
      ? {
          account_id: transaction.account_id,
          to_account_id: transaction.to_account_id ?? undefined,
          category_id: transaction.category_id ?? undefined,
          type: transaction.type,
          amount: transaction.amount,
          currency: transaction.currency,
          description: transaction.description,
          notes: transaction.notes ?? '',
          date: transaction.date,
          tags: transaction.tags,
          is_reconciled: transaction.is_reconciled,
        }
      : {
          type: 'expense' as const,
          date: format(new Date(), 'yyyy-MM-dd'),
          currency: userCurrency,
          tags: [] as string[],
          is_reconciled: false,
        },
  })

  const type = watch('type')
  const isTransfer = type === 'transfer'

  const onSubmit = async (data: TransactionInput) => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setIsLoading(false); return }

    const payload = { ...data, user_id: user.id, to_account_id: isTransfer ? data.to_account_id : null }

    if (transaction) {
      const { error } = await supabase.from('transactions').update(payload).eq('id', transaction.id)
      if (error) { toast.error(error.message); setIsLoading(false); return }
      toast.success('Transaction updated')
    } else {
      const { error } = await supabase.from('transactions').insert(payload)
      if (error) { toast.error(error.message); setIsLoading(false); return }
      toast.success('Transaction added')
    }

    onSuccess?.()
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Type selector */}
      <div className="grid grid-cols-4 gap-2">
        {TRANSACTION_TYPES.map(t => (
          <button
            key={t.value}
            type="button"
            onClick={() => setValue('type', t.value as TransactionInput['type'])}
            className={cn(
              'py-2 px-3 rounded-xl text-sm font-medium border transition-all',
              type === t.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Amount */}
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
            className="flex-1 px-3 py-2 text-lg font-semibold bg-transparent outline-none placeholder:text-muted-foreground/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            {...register('amount', { valueAsNumber: true })}
          />
        </div>
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
      </div>

      {/* Account */}
      <div className="space-y-2">
        <Label>Account</Label>
        {accounts.length === 0 ? (
          <a href="/accounts" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            No accounts yet — tap here to add one first
          </a>
        ) : (
          <Select onValueChange={(v: string | null) => setValue('account_id', v as any)} defaultValue={transaction?.account_id}>
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.account_id && <p className="text-xs text-destructive">{errors.account_id.message}</p>}
      </div>

      {/* To Account (transfer only) */}
      {isTransfer && (
        <div className="space-y-2">
          <Label>To Account</Label>
          <Select onValueChange={(v: string | null) => setValue('to_account_id', v as any)} defaultValue={transaction?.to_account_id ?? undefined}>
            <SelectTrigger>
              <SelectValue placeholder="Select destination account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label>Description</Label>
        <Input placeholder="What was this for?" {...register('description')} />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label>Date</Label>
        <Input type="date" {...register('date')} />
        {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Textarea placeholder="Add any notes..." rows={2} {...register('notes')} />
      </div>

      {/* Pinned action row — sticky so it never scrolls off on small screens */}
      <div className="sticky bottom-0 bg-background/98 backdrop-blur-sm flex gap-2 pt-3 pb-6 border-t border-border/20 mt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 rounded-2xl">
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1 h-12 rounded-2xl gradient-primary border-0 font-semibold" disabled={isLoading}>
          {isLoading ? 'Saving…' : transaction ? 'Update' : 'Add Transaction'}
        </Button>
      </div>
    </form>
  )
}
