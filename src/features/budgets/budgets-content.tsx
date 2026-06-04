'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, PiggyBank, AlertCircle, CheckCircle2, ChevronRight, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { toast } from 'sonner'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { budgetSchema, type BudgetInput } from '@/lib/validations/budget'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingPage } from '@/components/shared/loading-spinner'
import { formatCurrency, formatPercent } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Budget, Category } from '@/types/database'

interface BudgetWithMeta extends Budget {
  category?: Category
  spent: number
  utilization: number
}

export function BudgetsContent() {
  const [budgets, setBudgets] = useState<BudgetWithMeta[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editBudget, setEditBudget] = useState<Budget | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    const now = new Date()
    const start = format(startOfMonth(now), 'yyyy-MM-dd')
    const end = format(endOfMonth(now), 'yyyy-MM-dd')

    const [budgetsRes, categoriesRes, txnsRes] = await Promise.all([
      supabase.from('budgets').select('*, category:categories(*)').is('deleted_at', null).eq('is_active', true),
      supabase.from('categories').select('*').is('deleted_at', null).order('order_index'),
      supabase.from('transactions').select('category_id,amount').eq('type', 'expense').is('deleted_at', null).gte('date', start).lte('date', end),
    ])
    const budgetsData = budgetsRes.data as any[] | null
    const categoriesData = categoriesRes.data
    const txnsData = txnsRes.data as Array<{ category_id: string | null; amount: number }> | null

    const spentByCategory: Record<string, number> = {}
    for (const t of txnsData ?? []) {
      if (t.category_id) spentByCategory[t.category_id] = (spentByCategory[t.category_id] ?? 0) + t.amount
    }

    const budgetsWithMeta: BudgetWithMeta[] = (budgetsData ?? []).map(b => {
      const spent = b.category_id ? (spentByCategory[b.category_id] ?? 0) : 0
      return { ...b, spent, utilization: b.amount > 0 ? (spent / b.amount) * 100 : 0 }
    })

    setBudgets(budgetsWithMeta)
    setCategories(categoriesData ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const overBudget = budgets.filter(b => b.spent > b.amount)

  if (isLoading) return <LoadingPage />

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="gradient-primary text-white">
          <CardContent className="p-4">
            <p className="text-white/70 text-sm">Total Budgeted</p>
            <p className="text-xl font-bold">{formatCurrency(totalBudgeted)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Spent</p>
            <p className="text-xl font-bold text-red-500">{formatCurrency(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className={cn('text-xl font-bold', totalBudgeted - totalSpent >= 0 ? 'text-green-500' : 'text-red-500')}>
              {formatCurrency(Math.abs(totalBudgeted - totalSpent))}
            </p>
          </CardContent>
        </Card>
      </div>

      {overBudget.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">
            You have <strong>{overBudget.length}</strong> budget{overBudget.length > 1 ? 's' : ''} over limit
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Sheet open={showForm} onOpenChange={setShowForm}>
          <SheetTrigger>
            <Button className="gradient-primary border-0 gap-2">
              <Plus className="w-4 h-4" /> Add Budget
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>{editBudget ? 'Edit' : 'Add'} Budget</SheetTitle></SheetHeader>
            <div className="mt-6">
              <BudgetForm
                budget={editBudget ?? undefined}
                categories={categories}
                onSuccess={() => { setShowForm(false); setEditBudget(null); fetchData() }}
                onCancel={() => { setShowForm(false); setEditBudget(null) }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No budgets yet"
          description="Create budgets to track and control your spending"
          action={{ label: 'Create Budget', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-3">
          {budgets.map((budget, i) => {
            const isOver = budget.spent > budget.amount
            const isWarning = budget.utilization >= 80 && !isOver
            const remaining = budget.amount - budget.spent

            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={cn('card-hover', isOver && 'border-destructive/50')}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
                          isOver ? 'bg-red-100 dark:bg-red-950/30' : isWarning ? 'bg-yellow-100 dark:bg-yellow-950/30' : 'bg-green-100 dark:bg-green-950/30'
                        )}>
                          {isOver ? (
                            <AlertCircle className="w-5 h-5 text-destructive" />
                          ) : (
                            <CheckCircle2 className={cn('w-5 h-5', isWarning ? 'text-yellow-500' : 'text-green-500')} />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{budget.category?.name ?? budget.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] capitalize">{budget.period}</Badge>
                            {isOver && <Badge variant="destructive" className="text-[10px]">Over budget</Badge>}
                            {isWarning && <Badge className="text-[10px] bg-yellow-500">Warning</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatCurrency(budget.spent)} <span className="font-normal text-muted-foreground">/ {formatCurrency(budget.amount)}</span></p>
                          <p className={cn('text-xs', remaining >= 0 ? 'text-green-500' : 'text-red-500')}>
                            {remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => { setEditBudget(budget); setShowForm(true) }}>✎</Button>
                      </div>
                    </div>
                    <Progress
                      value={Math.min(budget.utilization, 100)}
                      className="h-3"
                      style={{
                        '--progress-background': isOver ? '#EF4444' : isWarning ? '#F59E0B' : '#22C55E'
                      } as React.CSSProperties}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">{formatPercent(Math.min(budget.utilization, 100), 0)} used</span>
                      <span className="text-xs text-muted-foreground">{formatPercent(Math.max(100 - budget.utilization, 0), 0)} remaining</span>
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

interface BudgetFormProps {
  budget?: Budget
  categories: Category[]
  onSuccess?: () => void
  onCancel?: () => void
}

function BudgetForm({ budget, categories, onSuccess, onCancel }: BudgetFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: budget
      ? { name: budget.name, category_id: budget.category_id ?? undefined, amount: budget.amount, period: budget.period, start_date: budget.start_date, rollover_enabled: budget.rollover_enabled }
      : { period: 'monthly', start_date: format(startOfMonth(new Date()), 'yyyy-MM-dd'), rollover_enabled: false },
  })

  const rollover = watch('rollover_enabled')
  const parentCategories = categories.filter(c => !c.parent_id)

  const onSubmit = async (data: BudgetInput) => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setIsLoading(false); return }

    if (budget) {
      const { error } = await supabase.from('budgets').update(data).eq('id', budget.id)
      if (error) { toast.error(error.message); setIsLoading(false); return }
      toast.success('Budget updated')
    } else {
      const { error } = await supabase.from('budgets').insert({ ...data, user_id: user.id })
      if (error) { toast.error(error.message); setIsLoading(false); return }
      toast.success('Budget created')
    }
    onSuccess?.()
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Budget Name</Label>
        <Input placeholder="e.g., Monthly Groceries" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Category (optional)</Label>
        <Select onValueChange={(v: string | null) => setValue('category_id', v as any)} defaultValue={budget?.category_id ?? undefined}>
          <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.parent_id ? '  └ ' : ''}{c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input type="number" step="0.01" className="pl-7" {...register('amount', { valueAsNumber: true })} />
          </div>
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Period</Label>
          <Select onValueChange={(v) => setValue('period', v as BudgetInput['period'])} defaultValue={budget?.period ?? 'monthly'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Start Date</Label>
        <Input type="date" {...register('start_date')} />
      </div>

      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium">Budget Rollover</p>
          <p className="text-xs text-muted-foreground">Unused budget carries to next period</p>
        </div>
        <Switch checked={rollover} onCheckedChange={(v) => setValue('rollover_enabled', v)} />
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>}
        <Button type="submit" className="flex-1 gradient-primary border-0" disabled={isLoading}>
          {isLoading ? 'Saving...' : budget ? 'Update' : 'Create Budget'}
        </Button>
      </div>
    </form>
  )
}
