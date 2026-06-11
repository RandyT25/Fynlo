import { z } from 'zod'

export const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100),
  type: z.enum(['cash', 'checking', 'savings', 'credit_card', 'loan', 'investment', 'crypto', 'business', 'custom']),
  balance: z.number(),
  original_balance: z.number().optional().nullable(),
  currency: z.string().length(3),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color'),
  icon: z.string(),
  institution: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  include_in_net_worth: z.boolean(),
})

export type AccountInput = z.infer<typeof accountSchema>
