'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { transactionSchema, type TransactionInput } from '@/lib/validations/transaction'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AmountInput } from '@/components/ui/amount-input'
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

interface Category {
  id: string
  name: string
  color: string
  icon: string
  type: string
  parent_id: string | null
}

interface TransactionFormProps {
  transaction?: Transaction
  initialValues?: Partial<TransactionInput>
  onSuccess?: () => void
  onCancel?: () => void
}

export function TransactionForm({ transaction, initialValues, onSuccess, onCancel }: TransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const { accounts } = useAccounts()
  const userCurrency = useCurrency()
  const currencySymbol = useCurrencySymbol()
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('categories')
      .select('id,name,color,icon,type,parent_id')
      .is('deleted_at', null)
      .order('order_index')
      .then(({ data }: { data: Category[] | null }) => {
        setCategories(data ?? [])
      })
  }, [])

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
          ...initialValues,
        },
  })

  const type = watch('type')
  const accountId = watch('account_id')
  const toAccountId = watch('to_account_id')
  const categoryId = watch('category_id') ?? transaction?.category_id ?? undefined
  const isTransfer = type === 'transfer'

  // Parent categories matching the current transaction type
  const parentCategories = categories.filter(c =>
    c.parent_id === null &&
    (type === 'income' || type === 'refund' ? c.type === 'income' : c.type === 'expense')
  )

  // Children of the selected parent
  const subcategories = selectedParentId
    ? categories.filter(c => c.parent_id === selectedParentId)
    : []

  // When the selected parent changes, keep or clear the category_id
  const handleParentSelect = (parentId: string) => {
    const children = categories.filter(c => c.parent_id === parentId)
    if (parentId === selectedParentId) {
      // Deselect
      setSelectedParentId(null)
      setValue('category_id', null)
    } else {
      setSelectedParentId(parentId)
      if (children.length === 0) {
        // No subcategories — select the parent directly
        setValue('category_id', parentId)
      } else {
        // Has subcategories — don't commit category yet, wait for child selection
        setValue('category_id', null)
      }
    }
  }

  const handleSubcategorySelect = (childId: string) => {
    if (categoryId === childId) {
      setValue('category_id', null)
    } else {
      setValue('category_id', childId)
    }
  }

  // Initialise selectedParentId when editing or when initialValues provides a category
  useEffect(() => {
    const catId = transaction?.category_id ?? initialValues?.category_id
    if (!catId || !categories.length) return
    const cat = categories.find(c => c.id === catId)
    if (!cat) return
    if (cat.parent_id) {
      setSelectedParentId(cat.parent_id)
    } else {
      setSelectedParentId(cat.id)
    }
  }, [transaction?.category_id, initialValues?.category_id, categories])

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
            onClick={() => {
              setValue('type', t.value as TransactionInput['type'])
              setSelectedParentId(null)
              setValue('category_id', null)
            }}
            className={cn(
              'py-2 px-3 rounded-xl text-sm font-medium border transition-all',
              type === t.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Account — pill buttons, no Select */}
      <div className="space-y-2">
        <Label>Account</Label>
        {accounts.length === 0 ? (
          <a href="/accounts" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            No accounts yet — tap here to add one first
          </a>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {accounts.map(acc => (
              <button
                key={acc.id}
                type="button"
                onClick={() => setValue('account_id', acc.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  accountId === acc.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground'
                )}
              >
                <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                {acc.name}
              </button>
            ))}
          </div>
        )}
        {errors.account_id && <p className="text-xs text-destructive">{errors.account_id.message}</p>}
      </div>

      {/* To Account (transfer only) — also pills */}
      {isTransfer && (
        <div className="space-y-2">
          <Label>To Account</Label>
          <div className="flex gap-2 flex-wrap">
            {accounts.map(acc => (
              <button
                key={acc.id}
                type="button"
                onClick={() => setValue('to_account_id', acc.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  toAccountId === acc.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground'
                )}
              >
                <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                {acc.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category — 2-level picker */}
      {!isTransfer && parentCategories.length > 0 && (
        <div className="space-y-2">
          <Label>Category <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>

          {/* Parent categories */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            {parentCategories.map(cat => {
              const hasChildren = categories.some(c => c.parent_id === cat.id)
              const isSelected = selectedParentId === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleParentSelect(cat.id)}
                  className={cn(
                    'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground'
                  )}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                  {hasChildren && (
                    <ChevronRight className={cn('w-3 h-3 transition-transform', isSelected && 'rotate-90')} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Subcategories — shown when parent with children is selected */}
          {subcategories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5 pl-2 border-l-2" style={{ borderColor: parentCategories.find(c => c.id === selectedParentId)?.color ?? '#6B7280' }}>
              {subcategories.map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSubcategorySelect(sub.id)}
                  className={cn(
                    'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    categoryId === sub.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 text-muted-foreground'
                  )}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Amount */}
      <div className="space-y-2">
        <Label>Amount</Label>
        <AmountInput
          value={watch('amount') || 0}
          onChange={v => setValue('amount', v, { shouldValidate: true })}
          currency={watch('currency') || userCurrency}
          currencySymbol={currencySymbol}
        />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
      </div>

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
