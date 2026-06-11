'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Info } from 'lucide-react'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { accountSchema, type AccountInput } from '@/lib/validations/account'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { AmountInput } from '@/components/ui/amount-input'
import { useCurrency } from '@/hooks/use-currency'
import { useCurrencySymbol } from '@/hooks/use-currency-symbol'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/format'
import type { Account } from '@/types/database'

const ASSET_TYPES = [
  { value: 'checking',   emoji: '🏦', label: 'Bank Checking',  description: 'Everyday bank account for spending & bills' },
  { value: 'savings',    emoji: '🐷', label: 'Bank Savings',    description: 'Savings account that earns interest' },
  { value: 'cash',       emoji: '💵', label: 'Cash / Wallet',   description: 'Physical cash or e-wallet balance' },
  { value: 'investment', emoji: '📈', label: 'Investment',       description: 'Stocks, mutual funds, bonds' },
  { value: 'crypto',     emoji: '₿',  label: 'Crypto',           description: 'Cryptocurrency holdings' },
  { value: 'business',   emoji: '🏢', label: 'Business',         description: 'Business or company account' },
  { value: 'custom',     emoji: '🗂️', label: 'Other',            description: 'Any other asset account' },
] as const

const LIABILITY_TYPES = [
  { value: 'credit_card', emoji: '💳', label: 'Credit Card',  description: 'Balance you owe on a credit card' },
  { value: 'loan',        emoji: '📋', label: 'Loan / Debt',  description: 'Personal loan, mortgage, car loan, etc.' },
] as const

const CURRENCIES = ['IDR', 'USD', 'EUR', 'GBP', 'SGD', 'AUD', 'JPY', 'MYR', 'THB', 'PHP']

const COLORS = [
  '#3B82F6', '#8B5CF6', '#22C55E', '#EF4444',
  '#F97316', '#F59E0B', '#10B981', '#6366F1',
  '#EC4899', '#14B8A6',
]

interface AccountFormProps {
  account?: Account
  presetType?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function AccountForm({ account, presetType, onSuccess, onCancel }: AccountFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [originalAmount, setOriginalAmount] = useState<number | ''>(
    account?.original_balance ?? ''
  )
  const [alreadyPaid, setAlreadyPaid] = useState<number | ''>('')
  const userCurrency = useCurrency()
  const currencySymbol = useCurrencySymbol()
  const supabase = createClient()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    defaultValues: account ?? {
      type: (presetType as any) ?? 'checking',
      balance: 0,
      currency: userCurrency,
      color: '#3B82F6',
      icon: 'wallet',
      include_in_net_worth: true,
    },
  })

  const selectedType = watch('type')
  const selectedColor = watch('color')
  const selectedCurrency = watch('currency')
  const includeNetWorth = watch('include_in_net_worth')
  const isLiability = selectedType === 'credit_card' || selectedType === 'loan'

  const onSubmit = async (data: AccountInput) => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setIsLoading(false); return }

    const isLoanType = data.type === 'loan' || data.type === 'credit_card'

    if (account) {
      const { error } = await supabase.from('accounts').update({
        name: data.name, type: data.type, currency: data.currency,
        color: data.color, icon: data.icon,
        institution: data.institution ?? null, notes: data.notes ?? null,
        include_in_net_worth: data.include_in_net_worth,
        ...(isLoanType && originalAmount !== '' ? { original_balance: originalAmount } : {}),
      }).eq('id', account.id)
      if (error) { toast.error(error.message); setIsLoading(false); return }
      toast.success('Account updated')
    } else {
      // For loans: balance = original - already paid. For others: use the balance field directly.
      const startingBalance = isLoanType && originalAmount !== ''
        ? (originalAmount as number) - (alreadyPaid !== '' ? (alreadyPaid as number) : 0)
        : data.balance

      const { error } = await supabase.from('accounts').insert({
        name: data.name, type: data.type, balance: startingBalance,
        original_balance: isLoanType && originalAmount !== '' ? (originalAmount as number) : null,
        currency: data.currency, color: data.color, icon: data.icon,
        institution: data.institution ?? null, notes: data.notes ?? null,
        include_in_net_worth: data.include_in_net_worth,
        user_id: user.id,
      })
      if (error) { toast.error(error.message); setIsLoading(false); return }
      toast.success('Account created')
    }
    onSuccess?.()
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* What is an account? — shown only when creating */}
      {!account && (
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-primary/8 border border-primary/20">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-primary/90 leading-relaxed">
            An account is a real financial account — your bank, wallet, credit card, or loan.
            For expenses like electricity or rent, use <strong>categories</strong> when adding a transaction instead.
          </p>
        </div>
      )}

      {/* Account Name */}
      <div className="space-y-2">
        <Label>Account Name</Label>
        <Input placeholder="e.g., BCA Savings, Cash Wallet" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Account Type — visual cards */}
      <div className="space-y-3">
        <Label>Account Type</Label>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-0.5">My Money (Assets)</p>
          <div className="grid grid-cols-1 gap-2">
            {ASSET_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setValue('type', t.value as AccountInput['type'])}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-colors',
                  selectedType === t.value
                    ? 'border-primary bg-primary/8'
                    : 'border-border bg-muted/20 active:bg-muted/50'
                )}
              >
                <span className="text-xl w-8 text-center shrink-0">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn('font-semibold text-sm', selectedType === t.value && 'text-primary')}>{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
                <div className={cn('w-4 h-4 rounded-full border-2 shrink-0', selectedType === t.value ? 'border-primary bg-primary' : 'border-border')}>
                  {selectedType === t.value && <div className="w-full h-full rounded-full scale-50 bg-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-0.5">I Owe (Liabilities)</p>
          <div className="grid grid-cols-1 gap-2">
            {LIABILITY_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setValue('type', t.value as AccountInput['type'])}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-colors',
                  selectedType === t.value
                    ? 'border-destructive bg-destructive/8'
                    : 'border-border bg-muted/20 active:bg-muted/50'
                )}
              >
                <span className="text-xl w-8 text-center shrink-0">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn('font-semibold text-sm', selectedType === t.value && 'text-destructive')}>{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
                <div className={cn('w-4 h-4 rounded-full border-2 shrink-0', selectedType === t.value ? 'border-destructive bg-destructive' : 'border-border')}>
                  {selectedType === t.value && <div className="w-full h-full rounded-full scale-50 bg-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Currency — pill buttons */}
      <div className="space-y-2">
        <Label>Currency</Label>
        <div className="flex gap-2 flex-wrap">
          {CURRENCIES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setValue('currency', c)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                selectedCurrency === c
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Starting Balance / Loan fields — only on create */}
      {!account ? (
        isLiability ? (
          <div className="space-y-3">
            {/* Original loan amount */}
            <div className="space-y-2">
              <Label>Total Loan Amount</Label>
              <AmountInput
                value={originalAmount === '' ? 0 : (originalAmount as number)}
                onChange={v => setOriginalAmount(v || '')}
                currency={selectedCurrency}
                currencySymbol={currencySymbol}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">The full amount of the loan (e.g. 10.000.000)</p>
            </div>

            {/* Already paid */}
            <div className="space-y-2">
              <Label>Amount Already Paid <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <AmountInput
                value={alreadyPaid === '' ? 0 : (alreadyPaid as number)}
                onChange={v => setAlreadyPaid(v || '')}
                currency={selectedCurrency}
                currencySymbol={currencySymbol}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">How much you've paid so far before tracking in Fynlo</p>
            </div>

            {/* Computed summary */}
            {originalAmount !== '' && (
              <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-destructive/8 border border-destructive/20">
                <p className="text-sm text-muted-foreground">Remaining balance</p>
                <p className="text-sm font-bold text-destructive">
                  {formatCurrency((originalAmount as number) - (alreadyPaid !== '' ? (alreadyPaid as number) : 0), selectedCurrency)}
                </p>
              </div>
            )}

            {/* hidden to satisfy schema — actual balance computed in onSubmit */}
            <input type="hidden" {...register('balance', { valueAsNumber: true })} />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Starting Balance</Label>
            <AmountInput
              value={watch('balance') || 0}
              onChange={v => setValue('balance', v, { shouldValidate: true })}
              currency={selectedCurrency}
              currencySymbol={currencySymbol}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">Balance before you started tracking in Fynlo</p>
            {errors.balance && <p className="text-xs text-destructive">{errors.balance.message}</p>}
          </div>
        )
      ) : (
        <>
          <input type="hidden" {...register('balance', { valueAsNumber: true })} />
          {/* For loans: show owe + paid breakdown with editable original amount */}
          {isLiability ? (
            <div className="space-y-2">
              {/* Editable original loan amount */}
              <div className="space-y-1.5">
                <Label>Total Loan Amount <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <AmountInput
                  value={originalAmount === '' ? 0 : (originalAmount as number)}
                  onChange={v => setOriginalAmount(v || '')}
                  currency={selectedCurrency}
                  currencySymbol={currencySymbol}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">Set to see your "Paid" progress</p>
              </div>

              <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/40">
                <p className="text-sm text-muted-foreground">Remaining (owe)</p>
                <p className="text-sm font-bold text-destructive">
                  {formatCurrency(account.balance, account.currency)}
                </p>
              </div>
              {originalAmount !== '' && (
                <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/40">
                  <p className="text-sm text-muted-foreground">Paid so far</p>
                  <p className="text-sm font-bold text-green-600">
                    {formatCurrency((originalAmount as number) - account.balance, account.currency)}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/40">
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-sm font-bold">
                {formatCurrency(account.balance, account.currency)}
              </p>
            </div>
          )}
        </>
      )}

      {/* Color */}
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={cn('w-7 h-7 rounded-full transition-all shrink-0', selectedColor === c && 'ring-2 ring-offset-2 ring-primary scale-110')}
              style={{ backgroundColor: c }}
              onClick={() => setValue('color', c)}
            />
          ))}
        </div>
      </div>

      {/* Institution */}
      <div className="space-y-2">
        <Label>Bank / Institution (optional)</Label>
        <Input placeholder="e.g., BCA, Mandiri, GoPay" {...register('institution')} />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Textarea placeholder="Any notes about this account…" rows={2} {...register('notes')} />
      </div>

      {/* Include in net worth */}
      <div className="flex items-center justify-between py-2 px-3 rounded-2xl bg-muted/30">
        <div>
          <p className="text-sm font-medium">Include in Net Worth</p>
          <p className="text-xs text-muted-foreground">Count this account in your total balance</p>
        </div>
        <Switch checked={includeNetWorth} onCheckedChange={(v) => setValue('include_in_net_worth', v)} />
      </div>

      <div className="sticky bottom-0 bg-background/98 backdrop-blur-sm flex gap-2 pt-3 pb-6 border-t border-border/20 mt-4">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 rounded-2xl">Cancel</Button>}
        <Button type="submit" className="flex-1 h-12 rounded-2xl gradient-primary border-0 font-semibold" disabled={isLoading}>
          {isLoading ? 'Saving…' : account ? 'Update Account' : 'Create Account'}
        </Button>
      </div>
    </form>
  )
}
