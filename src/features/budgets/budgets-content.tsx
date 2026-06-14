'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, PiggyBank, AlertCircle, CheckCircle2, ChevronRight, Receipt } from 'lucide-react'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { toast } from 'sonner'
import { useCurrency } from '@/hooks/use-currency'
import { useCurrencySymbol } from '@/hooks/use-currency-symbol'
import { useCategories } from '@/hooks/use-categories'
import { createAnyClient as createClient } from '@/lib/supabase/any-client'
import { budgetSchema, type BudgetInput } from '@/lib/validations/budget'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { TransactionForm } from '@/features/transactions/transaction-form'
import { AmountInput } from '@/components/ui/amount-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingPage } from '@/components/shared/loading-spinner'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import type { Budget, Category } from '@/types/database'

interface BudgetWithMeta extends Budget {
  category?: Category
  spent: number
  utilization: number
}

export function BudgetsContent() {
  const [budgets, setBudgets] = useState<BudgetWithMeta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { categories } = useCategories()
  const [showForm, setShowForm] = useState(false)
  const [editBudget, setEditBudget] = useState<Budget | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [addTxnBudget, setAddTxnBudget] = useState<BudgetWithMeta | null>(null)
  const currency = useCurrency()
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    const now = new Date()
    const start = format(startOfMonth(now), 'yyyy-MM-dd')
    const end = format(endOfMonth(now), 'yyyy-MM-dd')

    const [budgetsRes, txnsRes] = await Promise.all([
      supabase.from('budgets').select('*, category:categories(*)').is('deleted_at', null).eq('is_active', true),
      supabase.from('transactions').select('category_id,amount').eq('type', 'expense').is('deleted_at', null).gte('date', start).lte('date', end),
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const budgetsData = budgetsRes.data as any[] | null
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
    setIsLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData() }, [fetchData])

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const overBudget = budgets.filter(b => b.spent > b.amount)

  if (isLoading) return <LoadingPage />

  return (
    <div className="px-4 pt-4 pb-28">
      {/* Summary */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 gradient-primary rounded-2xl p-4 text-white">
          <p className="text-white/70 text-xs mb-1">Budgeted</p>
          <p className="text-2xl font-bold">{formatCurrency(totalBudgeted, currency)}</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="bg-card rounded-2xl px-4 py-2.5 shadow-sm border border-border/50">
            <p className="text-[11px] text-muted-foreground">Spent</p>
            <p className="font-bold text-sm text-destructive">{formatCurrency(totalSpent, currency)}</p>
          </div>
          <div className="bg-card rounded-2xl px-4 py-2.5 shadow-sm border border-border/50">
            <p className="text-[11px] text-muted-foreground">Left</p>
            <p className={cn('font-bold text-sm', totalBudgeted - totalSpent >= 0 ? 'text-green-500' : 'text-destructive')}>
              {formatCurrency(Math.abs(totalBudgeted - totalSpent), currency)}
            </p>
          </div>
        </div>
      </div>

      {overBudget.length > 0 && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-500/10 rounded-2xl px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive font-medium">{overBudget.length} budget{overBudget.length > 1 ? 's' : ''} over limit</p>
        </div>
      )}

      {budgets.length === 0 ? (
        <EmptyState icon={PiggyBank} title="No budgets yet" description="Tap + to create your first budget" />
      ) : (
        <div className="space-y-3">
          {budgets.map((budget, i) => {
            const isOver = budget.spent > budget.amount
            const isWarning = budget.utilization >= 80 && !isOver
            const remaining = budget.amount - budget.spent
            const barColor = isOver ? '#EF4444' : isWarning ? '#F59E0B' : '#22C55E'

            return (
              <motion.div key={budget.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="bg-card rounded-3xl p-4 shadow-sm border border-border/50">
                  {/* Tappable budget info — opens edit */}
                  <div
                    className="active:opacity-70 transition-opacity cursor-pointer"
                    onClick={() => { setEditBudget(budget); setShowForm(true) }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${barColor}22` }}>
                          {isOver ? <AlertCircle className="w-5 h-5 text-destructive" /> : <CheckCircle2 className="w-5 h-5" style={{ color: barColor }} />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{budget.category?.name ?? budget.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{budget.period}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatCurrency(budget.spent, currency)}</p>
                        <p className="text-xs text-muted-foreground">/ {formatCurrency(budget.amount, currency)}</p>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(budget.utilization, 100)}%`, backgroundColor: barColor }} />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[11px] text-muted-foreground">{Math.round(Math.min(budget.utilization, 100))}% used</span>
                      <span className={cn('text-[11px] font-medium', remaining >= 0 ? 'text-green-500' : 'text-destructive')}>
                        {remaining >= 0 ? `${formatCurrency(remaining, currency)} left` : `${formatCurrency(Math.abs(remaining), currency)} over`}
                      </span>
                    </div>
                  </div>

                  {/* Add transaction button */}
                  <button
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-2xl bg-primary/10 active:bg-primary/20 transition-colors text-primary text-xs font-semibold"
                    onClick={(e) => { e.stopPropagation(); setAddTxnBudget(budget) }}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    Add Transaction
                  </button>
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
        onClick={() => { setEditBudget(null); setShowForm(true) }}
      >
        <Plus className="w-6 h-6" />
      </button>

      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent side="bottom" className="h-[92dvh] rounded-t-3xl flex flex-col gap-0 p-0">
          <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b border-border/30"><SheetTitle>{editBudget ? 'Edit' : 'Add'} Budget</SheetTitle></SheetHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4">
            <BudgetForm
              budget={editBudget ?? undefined}
              categories={categories}
              onSuccess={() => { setShowForm(false); setEditBudget(null); fetchData() }}
              onCancel={() => { setShowForm(false); setEditBudget(null) }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Add transaction for a specific budget */}
      <Sheet open={!!addTxnBudget} onOpenChange={open => { if (!open) setAddTxnBudget(null) }}>
        <SheetContent side="bottom" className="h-[92dvh] rounded-t-3xl flex flex-col gap-0 p-0">
          <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b border-border/30">
            <SheetTitle>Add Transaction — {addTxnBudget?.category?.name ?? addTxnBudget?.name}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4">
            {addTxnBudget && (
              <TransactionForm
                initialValues={{
                  type: 'expense',
                  category_id: addTxnBudget.category_id ?? undefined,
                }}
                onSuccess={() => { setAddTxnBudget(null); fetchData() }}
                onCancel={() => setAddTxnBudget(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
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
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const currency = useCurrency()
  const currencySymbol = useCurrencySymbol()
  const supabase = createClient()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: budget
      ? { name: budget.name, category_id: budget.category_id ?? undefined, amount: budget.amount, period: budget.period, start_date: budget.start_date, rollover_enabled: budget.rollover_enabled }
      : { period: 'monthly', start_date: format(startOfMonth(new Date()), 'yyyy-MM-dd'), rollover_enabled: false },
  })

  const rollover = watch('rollover_enabled')
  const categoryId = watch('category_id')

  // Only show expense parent categories — budgets track spending
  const parentCategories = categories.filter(c => c.parent_id === null && c.type === 'expense')
  const subcategories = selectedParentId ? categories.filter(c => c.parent_id === selectedParentId) : []

  // Initialise selection when editing an existing budget
  useEffect(() => {
    if (!budget?.category_id || !categories.length) return
    const cat = categories.find(c => c.id === budget.category_id)
    if (!cat) return
    setSelectedParentId(cat.parent_id ?? cat.id)
  }, [budget?.category_id, categories])

  const handleParentSelect = (parentId: string) => {
    const children = categories.filter(c => c.parent_id === parentId)
    if (parentId === selectedParentId) {
      setSelectedParentId(null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue('category_id', null as any)
    } else {
      setSelectedParentId(parentId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue('category_id', children.length === 0 ? parentId : null as any)
    }
  }

  const handleSubcategorySelect = (childId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue('category_id', categoryId === childId ? null as any : childId)
  }

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

      {/* Category — same two-level pill picker as transaction form */}
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

        {/* Subcategories */}
        {subcategories.length > 0 && (
          <div
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5 pl-2 border-l-2"
            style={{ borderColor: parentCategories.find(c => c.id === selectedParentId)?.color ?? '#6B7280' }}
          >
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount</Label>
          <AmountInput
            value={watch('amount') || 0}
            onChange={v => setValue('amount', v, { shouldValidate: true })}
            currency={currency}
            currencySymbol={currencySymbol}
            placeholder="0"
          />
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

      <div className="sticky bottom-0 bg-background/98 backdrop-blur-sm flex gap-2 pt-3 pb-6 border-t border-border/20 mt-4">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 rounded-2xl">Cancel</Button>}
        <Button type="submit" className="flex-1 h-12 rounded-2xl gradient-primary border-0 font-semibold" disabled={isLoading}>
          {isLoading ? 'Saving…' : budget ? 'Update' : 'Create Budget'}
        </Button>
      </div>
    </form>
  )
}
