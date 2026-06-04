import type { TransactionType, AccountType } from '@/types/database'

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  cash: '#22C55E',
  checking: '#3B82F6',
  savings: '#8B5CF6',
  credit_card: '#EF4444',
  loan: '#F97316',
  investment: '#10B981',
  crypto: '#F59E0B',
  business: '#6366F1',
  custom: '#6B7280',
}

export const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
  income: '#22C55E',
  expense: '#EF4444',
  transfer: '#3B82F6',
  refund: '#8B5CF6',
}

export const CHART_COLORS = [
  '#3B82F6', '#8B5CF6', '#22C55E', '#F97316', '#EF4444',
  '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#14B8A6',
  '#84CC16', '#F43F5E', '#0EA5E9', '#A855F7', '#06B6D4',
]

export function getTransactionColor(type: TransactionType): string {
  return TRANSACTION_TYPE_COLORS[type] ?? '#6B7280'
}

export function getAccountColor(type: AccountType): string {
  return ACCOUNT_TYPE_COLORS[type] ?? '#6B7280'
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
