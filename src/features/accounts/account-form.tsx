'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { accountSchema, type AccountInput } from '@/lib/validations/account'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useCurrency } from '@/hooks/use-currency'
import { useCurrencySymbol } from '@/hooks/use-currency-symbol'
import type { Account } from '@/types/database'

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'loan', label: 'Loan' },
  { value: 'investment', label: 'Investment' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'business', label: 'Business' },
  { value: 'custom', label: 'Custom' },
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'IDR', 'SGD', 'JPY', 'CAD']

const COLORS = ['#3B82F6', '#8B5CF6', '#22C55E', '#EF4444', '#F97316', '#F59E0B', '#10B981', '#6366F1', '#EC4899', '#14B8A6']

interface AccountFormProps {
  account?: Account
  presetType?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function AccountForm({ account, presetType, onSuccess, onCancel }: AccountFormProps) {
  const [isLoading, setIsLoading] = useState(false)
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

  const color = watch('color')
  const includeNetWorth = watch('include_in_net_worth')

  const onSubmit = async (data: AccountInput) => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setIsLoading(false); return }

    const payload = {
      name: data.name, type: data.type, balance: data.balance,
      currency: data.currency, color: data.color, icon: data.icon,
      institution: data.institution ?? null, notes: data.notes ?? null,
      include_in_net_worth: data.include_in_net_worth,
    }
    if (account) {
      const { error } = await supabase.from('accounts').update(payload).eq('id', account.id)
      if (error) { toast.error(error.message); setIsLoading(false); return }
      toast.success('Account updated')
    } else {
      const { error } = await supabase.from('accounts').insert({ ...payload, user_id: user.id })
      if (error) { toast.error(error.message); setIsLoading(false); return }
      toast.success('Account created')
    }
    onSuccess?.()
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Account Name</Label>
        <Input placeholder="e.g., Chase Checking" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select onValueChange={(v) => setValue('type', v as AccountInput['type'])} defaultValue={account?.type ?? 'checking'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Select onValueChange={(v) => setValue('currency', v as string)} defaultValue={account?.currency ?? 'USD'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Balance</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
          <Input type="number" step="0.01" className="pl-7" {...register('balance', { valueAsNumber: true })} />
        </div>
        {errors.balance && <p className="text-xs text-destructive">{errors.balance.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-primary' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setValue('color', c)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Institution (optional)</Label>
        <Input placeholder="e.g., Chase Bank" {...register('institution')} />
      </div>

      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Textarea placeholder="Any notes about this account..." rows={2} {...register('notes')} />
      </div>

      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium">Include in Net Worth</p>
          <p className="text-xs text-muted-foreground">Count this account in your total net worth</p>
        </div>
        <Switch checked={includeNetWorth} onCheckedChange={(v) => setValue('include_in_net_worth', v)} />
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>}
        <Button type="submit" className="flex-1 gradient-primary border-0" disabled={isLoading}>
          {isLoading ? 'Saving...' : account ? 'Update Account' : 'Create Account'}
        </Button>
      </div>
    </form>
  )
}
