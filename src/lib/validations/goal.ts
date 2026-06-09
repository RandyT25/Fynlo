import { z } from 'zod'

export const goalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  type: z.enum(['savings', 'debt', 'custom']),
  target_amount: z.number().positive('Target amount must be positive'),
  current_amount: z.number().min(0),
  currency: z.string().length(3),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')).transform(v => v === '' ? null : v).nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string(),
  priority: z.number().int().min(0).max(10),
  account_id: z.string().uuid().optional().nullable(),
})

export type GoalInput = z.infer<typeof goalSchema>
