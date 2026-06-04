import { z } from 'zod'

export const budgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required').max(100),
  category_id: z.string().uuid().optional().nullable(),
  amount: z.number().positive('Amount must be positive'),
  period: z.enum(['monthly', 'quarterly', 'yearly', 'custom']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  rollover_enabled: z.boolean(),
})

export type BudgetInput = z.infer<typeof budgetSchema>
