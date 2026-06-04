'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Target, Trophy, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { goalSchema, type GoalInput } from '@/lib/validations/goal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingPage } from '@/components/shared/loading-spinner'
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Goal } from '@/types/database'

const GOAL_COLORS = ['#3B82F6', '#8B5CF6', '#22C55E', '#EF4444', '#F97316', '#F59E0B', '#10B981', '#EC4899']
const GOAL_ICONS = ['🎯', '🏠', '✈️', '🚗', '💻', '📚', '🎓', '💍', '🌴', '⛵', '🏋️', '🌟']

export function GoalsContent() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
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

  const active = goals.filter(g => !g.is_completed)
  const completed = goals.filter(g => g.is_completed)

  if (isLoading) return <LoadingPage />

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="gradient-primary text-white">
            <CardContent className="p-4">
              <p className="text-white/70 text-sm">Active Goals</p>
              <p className="text-2xl font-bold">{active.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Saved So Far</p>
              <p className="text-xl font-bold text-green-500">{formatCurrency(active.reduce((s, g) => s + g.current_amount, 0))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Target</p>
              <p className="text-xl font-bold">{formatCurrency(active.reduce((s, g) => s + g.target_amount, 0))}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-end">
        <Sheet open={showForm} onOpenChange={open => { setShowForm(open); if (!open) setEditGoal(null) }}>
          <SheetTrigger>
            <Button className="gradient-primary border-0 gap-2">
              <Plus className="w-4 h-4" /> Add Goal
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>{editGoal ? 'Edit' : 'New'} Goal</SheetTitle></SheetHeader>
            <div className="mt-6">
              <GoalForm
                goal={editGoal ?? undefined}
                onSuccess={() => { setShowForm(false); setEditGoal(null); fetchGoals() }}
                onCancel={() => { setShowForm(false); setEditGoal(null) }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Set financial goals and track your progress" action={{ label: 'Create Goal', onClick: () => setShowForm(true) }} />
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active Goals</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {active.map((goal, i) => (
                  <GoalCard key={goal.id} goal={goal} index={i} onEdit={() => { setEditGoal(goal); setShowForm(true) }} onDelete={() => deleteGoal(goal.id)} onToggle={() => toggleComplete(goal)} />
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" /> Completed Goals
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-70">
                {completed.map((goal, i) => (
                  <GoalCard key={goal.id} goal={goal} index={i} onEdit={() => { setEditGoal(goal); setShowForm(true) }} onDelete={() => deleteGoal(goal.id)} onToggle={() => toggleComplete(goal)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

interface GoalCardProps {
  goal: Goal
  index: number
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}

function GoalCard({ goal, index, onEdit, onDelete, onToggle }: GoalCardProps) {
  const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
  const remaining = goal.target_amount - goal.current_amount

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
      <Card className={cn('card-hover overflow-hidden', goal.is_completed && 'opacity-80')}>
        <div className="h-1" style={{ backgroundColor: goal.color }} />
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${goal.color}20` }}>
                🎯
              </div>
              <div>
                <p className="font-semibold">{goal.name}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] capitalize">{goal.type}</Badge>
                  {goal.is_completed && <Badge className="text-[10px] bg-green-500">Completed</Badge>}
                  {goal.target_date && (
                    <span className="text-[10px] text-muted-foreground">Due {formatDate(goal.target_date)}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onToggle} title={goal.is_completed ? 'Reopen' : 'Mark complete'}>
                {goal.is_completed ? '↩' : '✓'}
              </Button>
              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onEdit}>✎</Button>
              <Button variant="ghost" size="icon" className="w-7 h-7 hover:text-destructive" onClick={onDelete}>✕</Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold" style={{ color: goal.color }}>{formatCurrency(goal.current_amount)}</span>
              <span className="text-muted-foreground">/ {formatCurrency(goal.target_amount)}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatPercent(progress, 0)} reached</span>
              <span>{formatCurrency(remaining)} to go</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface GoalFormProps {
  goal?: Goal
  onSuccess?: () => void
  onCancel?: () => void
}

function GoalForm({ goal, onSuccess, onCancel }: GoalFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: goal
      ? { name: goal.name, description: goal.description ?? '', type: goal.type, target_amount: goal.target_amount, current_amount: goal.current_amount, currency: goal.currency, target_date: goal.target_date ?? undefined, color: goal.color, priority: goal.priority }
      : { type: 'savings', color: '#3B82F6', priority: 0 },
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
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input type="number" step="0.01" className="pl-7" {...register('target_amount', { valueAsNumber: true })} />
          </div>
          {errors.target_amount && <p className="text-xs text-destructive">{errors.target_amount.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Current Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input type="number" step="0.01" className="pl-7" {...register('current_amount', { valueAsNumber: true })} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Target Date (optional)</Label>
        <Input type="date" {...register('target_date')} />
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {GOAL_COLORS.map(c => (
            <button key={c} type="button"
              className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-primary' : ''}`}
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

      <div className="flex gap-2 pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>}
        <Button type="submit" className="flex-1 gradient-primary border-0" disabled={isLoading}>
          {isLoading ? 'Saving...' : goal ? 'Update Goal' : 'Create Goal'}
        </Button>
      </div>
    </form>
  )
}
