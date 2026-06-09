import { z } from 'zod'

export const transactionSchema = z.object({
  account_id: z.string().uuid('Select an account'),
  to_account_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  type: z.enum(['income', 'expense', 'transfer', 'refund']),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3),
  description: z.string().min(1, 'Description is required').max(255),
  notes: z.string().max(1000).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  tags: z.array(z.string()),
  is_reconciled: z.boolean(),
})

export const recurringTransactionSchema = z.object({
  account_id: z.string().uuid('Select an account'),
  to_account_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  type: z.enum(['income', 'expense', 'transfer', 'refund']),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3),
  description: z.string().min(1, 'Description is required').max(255),
  notes: z.string().max(1000).optional().nullable(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom']),
  interval: z.number().int().positive(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  end_date: z.preprocess(v => (v === '' || v === undefined ? null : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()),
  auto_create: z.boolean(),
  tags: z.array(z.string()),
})

export type TransactionInput = z.infer<typeof transactionSchema>
export type RecurringTransactionInput = z.infer<typeof recurringTransactionSchema>
