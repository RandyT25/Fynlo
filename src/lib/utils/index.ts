export * from './format'
export * from './colors'
import type { Account } from '@/types/database'

export function calculateNetBalance(accounts: Account[]): number {
  return accounts.reduce((sum, a) => {
    if (a.type === 'credit_card' || a.type === 'loan') return sum - Math.abs(a.balance)
    return sum + a.balance
  }, 0)
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const group = String(item[key])
    if (!result[group]) result[group] = []
    result[group].push(item)
    return result
  }, {} as Record<string, T[]>)
}

export function sortByDate<T extends { date: string }>(array: T[], order: 'asc' | 'desc' = 'desc'): T[] {
  return [...array].sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
    return order === 'desc' ? -diff : diff
  })
}

export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / Math.abs(previous)) * 100
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
