'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Target, Pencil } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useCurrency } from '@/hooks/use-currency'
import { useCurrencySymbol } from '@/hooks/use-currency-symbol'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { goalSchema, type GoalInput } from '@/lib/validations/goal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingPage } from '@/components/shared/loading-spinner'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Goal } from '@/types/database'

const GOAL_COLORS = ['#3B82F6', '#8B5CF6', '#22C55E', '#EF4444', '#F97316', '#F59E0B', '#10B981', '#EC4899']
const GOAL_ICONS = ['🎯', '🏠', '✈️', '🚗', '💻', '📚', '🎓', '💍', '🌴', '⛵', '🏋️', '🌟']

export function GoalsContent() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null)
  const [contributeAmount, setContributeAmount] = useState('')
  const [contributeLoading, setContributeLoading] = useState(false)
  const currency = useCurrency()
  const currencySymbol = useCurrencySymbol()
  const supabase = createClient()

  const fetchGoals = useCallback(async () => {
    setIsLoading(true)
    const { data } = await supabase.from('goals').select('*').is('deleted_at', null).order('priority', { ascending: false }).order('created_at', { ascending: false })
    setGoals(data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  const toggleComplete = async (goal: Goal) => {
    const { error } = await supabase.from('goals').update({ is_completed: !goal.is_completed }).eq('id', goal.id)
    if (!error) fetchGoals()
  }

  const deleteGoal = async (id: string) => {
    if (!confirm('Delete this goal?')) return
    await supabase.from('goals').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    toast.success('Goal deleted')
    fetchGoals()
  }

  const addContribution = async () => {
    if (!contributeGoal) return
    const amount = parseFloat(contributeAmount)
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return }
    setContributeLoading(true)
    const newAmount = contributeGoal.current_amount + amount
    const isCompleted = newAmount >= contributeGoal.target_amount
    const { error } = await supabase.from('goals').update({
      current_amount: newAmount,
      ...(isCompleted ? { is_completed: true } : {}),
    }).eq('id', contributeGoal.id)
    if (error) { toast.error(error.message) } else {
      toast.success(isCompleted ? '🎉 Goal reached!' : 'Contribution added')
      setContributeGoal(null)
      setContributeAmount('')
      fetchGoals()
    }
    setContributeLoading(false)
  }

  const active = goals.filter(g => !g.is_completed)
  const completed = goals.filter(g => g.is_completed)

  const [showCompleted, setShowCompleted] = useState(false)

  const totalSaved = active.reduce((s, g) => s + g.current_amount, 0)
  const displayGoals = showCompleted ? goals : active

  if (isLoading) return <LoadingPage />

  return (
    <div className="px-4 pt-4 pb-4">
      {/* Summary row */}
      {goals.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-card rounded-2xl p-4 shadow-sm border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Total Saved</p>
            <p className="text-xl font-bold">{formatCurrency(totalSaved, currency)}</p>
          </div>
          <div className="flex-1 bg-card rounded-2xl p-4 shadow-sm border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Fulfilled</p>
            <p className="text-xl font-bold">{completed.length}<span className="text-muted-foreground font-normal text-sm">/{goals.length}</span></p>
          </div>
        </div>
      )}

      {/* Toggle completed */}
      {completed.length > 0 && (
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-sm text-muted-foreground">Show fulfilled goals</span>
          <button
            className={cn('w-11 h-6 rounded-full transition-colors relative', showCompleted ? 'bg-primary' : 'bg-muted')}
            onClick={() => setShowCompleted(v => !v)}
          >
            <div className={cn('w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm', showCompleted ? 'translate-x-5' : 'translate-x-0.5')} />
          </button>
        </div>
      )}

      {goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Tap + to set your first financial goal" />
      ) : (
        <div className="space-y-3">
          {displayGoals.map((goal, i) => {
            const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn('bg-card rounded-3xl p-4 shadow-sm border border-border/50', goal.is_completed && 'opacity-70')}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: `${goal.color}22` }}>
                      🎯
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{goal.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{goal.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditGoal(goal); setShowForm(true) }}
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:bg-muted/70"
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {!goal.is_completed && (
                      <button
                        onClick={() => { setContributeGoal(goal); setContributeAmount('') }}
                        className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-70"
                        style={{ backgroundColor: goal.color }}
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold" style={{ color: goal.color }}>{formatCurrency(goal.current_amount, currency)}</span>
                  <span className="text-muted-foreground text-xs">{Math.round(pct)}% · {formatCurrency(goal.target_amount, currency)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
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
        onClick={() => { setEditGoal(null); setShowForm(true) }}
      >
        <Plus className="w-6 h-6" />
      </button>

      <Sheet open={showForm} onOpenChange={open => { setShowForm(open); if (!open) setEditGoal(null) }}>
        <SheetContent side="bottom" className="h-[92dvh] rounded-t-3xl flex flex-col gap-0 p-0">
          <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b border-border/30"><SheetTitle>{editGoal ? 'Edit' : 'New'} Goal</SheetTitle></SheetHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4">
            <GoalForm
              goal={editGoal ?? undefined}
              onSuccess={() => { setShowForm(false); setEditGoal(null); fetchGoals() }}
              onCancel={() => { setShowForm(false); setEditGoal(null) }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Quick contribution sheet */}
      <Sheet open={!!contributeGoal} onOpenChange={open => { if (!open) { setContributeGoal(null); setContributeAmount('') } }}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0">
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-border/30">
            <SheetTitle>Add to Goal</SheetTitle>
          </SheetHeader>
          <div className="px-4 pt-5 pb-8 space-y-5">
            {contributeGoal && (
              <>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: `${contributeGoal.color}22` }}>
                    🎯
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{contributeGoal.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(contributeGoal.current_amount, currency)} / {formatCurrency(contributeGoal.target_amount, currency)}
                    </p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: contributeGoal.color }}>
                    {Math.round((contributeGoal.current_amount / contributeGoal.target_amount) * 100)}%
                  </span>
                </div>

                <div className="space-y-2">
                  <Label>How much are you adding?</Label>
                  <div className="flex items-stretch overflow-hidden rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-ring transition-all">
                    <span className="flex items-center px-3 text-sm font-semibold text-muted-foreground bg-muted/50 border-r border-input shrink-0 select-none min-w-[2.5rem] justify-center">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="0"
                      value={contributeAmount}
                      onChange={e => setContributeAmount(e.target.value)}
                      className="flex-1 px-3 py-3 text-xl font-bold bg-transparent outline-none placeholder:text-muted-foreground/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  className="w-full h-12 rounded-2xl gradient-primary border-0 font-semibold"
                  onClick={addContribution}
                  disabled={contributeLoading || !contributeAmount}
                >
                  {contributeLoading ? 'Saving…' : 'Add to Goal'}
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

interface GoalFormProps {
  goal?: Goal
  onSuccess?: () => void
  onCancel?: () => void
}

function GoalForm({ goal, onSuccess, onCancel }: GoalFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const userCurrency = useCurrency()
  const currencySymbol = useCurrencySymbol()
  const supabase = createClient()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: goal
      ? { name: goal.name, description: goal.description ?? '', type: goal.type, target_amount: goal.target_amount, current_amount: goal.current_amount, currency: goal.currency, target_date: goal.target_date ?? undefined, color: goal.color, priority: goal.priority }
      : { type: 'savings', color: '#3B82F6', priority: 0, currency: userCurrency, current_amount: 0 },
  })

  const color = watch('color')

  const onSubmit = async (data: GoalInput) => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setIsLoading(false); return }

    if (goal) {
      const { error } = await supabase.from('goals').update(data).eq('id', goal.id)
      if (error) { toast.error(error.message); setIsLoading(false); return }
      toast.success('Goal updated')
    } else {
      const { error } = await supabase.from('goals').insert({ ...data, user_id: user.id })
      if (error) { toast.error(error.message); setIsLoading(false); return }
      toast.success('Goal created')
    }
    onSuccess?.()
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Goal Name</Label>
        <Input placeholder="e.g., Emergency Fund" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <Select onValueChange={(v) => setValue('type', v as GoalInput['type'])} defaultValue={goal?.type ?? 'savings'}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="savings">Savings</SelectItem>
            <SelectItem value="debt">Debt Payoff</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Target Amount</Label>
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
              {...register('target_amount', { valueAsNumber: true })}
            />
          </div>
          {errors.target_amount && <p className="text-xs text-destructive">{errors.target_amount.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Current Amount</Label>
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
              {...register('current_amount', { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Target Date (optional)</Label>
        <Input type="date" {...register('target_date')} />
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-1.5">
          {GOAL_COLORS.map(c => (
            <button key={c} type="button"
              className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'scale-110 ring-2 ring-offset-2 ring-primary' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setValue('color', c)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description (optional)</Label>
        <Textarea placeholder="What is this goal for?" rows={2} {...register('description')} />
      </div>

      <div className="sticky bottom-0 bg-background/98 backdrop-blur-sm flex gap-2 pt-3 pb-6 border-t border-border/20 mt-4">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 rounded-2xl">Cancel</Button>}
        <Button type="submit" className="flex-1 h-12 rounded-2xl gradient-primary border-0 font-semibold" disabled={isLoading}>
          {isLoading ? 'Saving…' : goal ? 'Update Goal' : 'Create Goal'}
        </Button>
      </div>
    </form>
  )
}
