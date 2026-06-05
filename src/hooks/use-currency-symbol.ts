'use client'

import { useCurrency } from './use-currency'
import { getCurrencySymbol } from '@/lib/utils/format'

export function useCurrencySymbol(): string {
  return getCurrencySymbol(useCurrency())
}
