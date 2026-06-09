import { format, formatDistanceToNow, parseISO, isToday, isYesterday } from 'date-fns'

export function getCurrencySymbol(currency = 'USD'): string {
  try {
    // narrowSymbol gives "Rp" for IDR, "¥" for JPY etc. — avoids "IDR0.00" run-together
    const parts = new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(1)
    return parts.find(p => p.type === 'currency')?.value ?? currency
  } catch {
    try {
      const parts = new Intl.NumberFormat('en', { style: 'currency', currency }).formatToParts(1)
      return parts.find(p => p.type === 'currency')?.value ?? currency
    } catch {
      return currency
    }
  }
}

export function formatCurrency(
  amount: number,
  currency = 'USD',
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount)
}

export function formatCompactCurrency(amount: number, currency = 'USD'): string {
  const abs = Math.abs(amount)
  if (abs >= 1_000_000) return formatCurrency(amount / 1_000_000, currency, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + 'M'
  if (abs >= 1_000) return formatCurrency(amount / 1_000, currency, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + 'K'
  return formatCurrency(amount, currency)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatDate(date: string | Date, fmt = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, fmt)
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d')
}

export function formatDateRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatTransactionSign(amount: number, type: string): string {
  if (type === 'income' || type === 'refund') return `+${formatCurrency(amount)}`
  if (type === 'expense') return `-${formatCurrency(amount)}`
  return formatCurrency(amount)
}
