'use client'

import { useState, useEffect, useRef } from 'react'

// Currencies that use dot as thousands separator (and no/comma decimals)
const DOT_THOUSANDS: Record<string, boolean> = {
  IDR: true, MYR: true, THB: true, PHP: true, VND: true,
  JPY: true, KRW: true, CNY: true, INR: true,
}

function usesWholeParts(currency: string) {
  return ['IDR', 'VND', 'JPY', 'KRW'].includes(currency)
}

function formatDisplay(raw: string, currency: string): string {
  const dotThousands = DOT_THOUSANDS[currency]
  const wholeParts = usesWholeParts(currency)

  if (!raw || raw === '') return ''

  if (wholeParts) {
    // Only digits allowed, formatted with dot thousands
    const digits = raw.replace(/\D/g, '')
    if (!digits) return ''
    const n = parseInt(digits, 10)
    if (isNaN(n)) return ''
    return dotThousands
      ? n.toLocaleString('id-ID')  // produces "11.000.000"
      : n.toLocaleString('en-US')
  }

  // For currencies with decimals (USD, EUR, etc.)
  // Allow digits and one decimal separator
  const sep = dotThousands ? ',' : '.'
  const parts = raw.split(sep)
  const intPart = parts[0].replace(/\D/g, '')
  const decPart = parts.length > 1 ? parts[1].replace(/\D/g, '').slice(0, 2) : null
  if (!intPart) return ''
  const n = parseInt(intPart, 10)
  const thousands = dotThousands ? n.toLocaleString('id-ID') : n.toLocaleString('en-US')
  return decPart !== null ? `${thousands}${sep}${decPart}` : thousands
}

function parseDisplay(display: string, currency: string): number {
  const dotThousands = DOT_THOUSANDS[currency]
  if (dotThousands) {
    // dot is thousands, comma is decimal
    const cleaned = display.replace(/\./g, '').replace(',', '.')
    return parseFloat(cleaned) || 0
  }
  // comma is thousands, dot is decimal
  const cleaned = display.replace(/,/g, '')
  return parseFloat(cleaned) || 0
}

interface AmountInputProps {
  value: number
  onChange: (value: number) => void
  currency?: string
  currencySymbol?: string
  placeholder?: string
  className?: string
}

export function AmountInput({
  value,
  onChange,
  currency = 'USD',
  currencySymbol = '$',
  placeholder = '0',
  className,
}: AmountInputProps) {
  const dotThousands = DOT_THOUSANDS[currency]
  const wholeParts = usesWholeParts(currency)

  const initDisplay = () => {
    if (!value) return ''
    if (wholeParts) return value.toLocaleString(dotThousands ? 'id-ID' : 'en-US')
    const sep = dotThousands ? ',' : '.'
    return value.toLocaleString(dotThousands ? 'id-ID' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      .replace('.', sep)
  }

  const [display, setDisplay] = useState(initDisplay)
  const prevValue = useRef(value)

  // Sync if external value changes (e.g., form reset)
  useEffect(() => {
    if (prevValue.current !== value && value === 0) {
      setDisplay('')
      prevValue.current = value
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const dotThous = DOT_THOUSANDS[currency]

    // Determine allowed characters
    const decimalSep = dotThous ? ',' : '.'
    // Strip all formatting except digits and the decimal separator
    let stripped = wholeParts
      ? raw.replace(/\D/g, '')
      : raw.replace(new RegExp(`[^\\d\\${decimalSep}]`, 'g'), '')

    // At most one decimal separator
    const parts = wholeParts ? [stripped] : stripped.split(decimalSep)
    if (parts.length > 2) {
      stripped = parts[0] + decimalSep + parts.slice(1).join('')
    }

    const formatted = formatDisplay(stripped, currency)
    setDisplay(formatted)
    const num = parseDisplay(formatted, currency)
    prevValue.current = num
    onChange(num)
  }

  return (
    <div className={`flex items-stretch overflow-hidden rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-ring transition-all ${className ?? ''}`}>
      <span className="flex items-center px-3 text-sm font-semibold text-muted-foreground bg-muted/50 border-r border-input shrink-0 select-none min-w-[2.5rem] justify-center">
        {currencySymbol}
      </span>
      <input
        type="text"
        inputMode={wholeParts ? 'numeric' : 'decimal'}
        placeholder={placeholder}
        value={display}
        onChange={handleChange}
        className="flex-1 px-3 py-2 text-lg font-semibold bg-transparent outline-none placeholder:text-muted-foreground/50"
      />
    </div>
  )
}
