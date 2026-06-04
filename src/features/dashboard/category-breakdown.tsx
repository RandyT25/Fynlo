'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/utils/format'

interface CategoryItem {
  name: string
  amount: number
  color: string
  percentage: number
}

interface CategoryBreakdownProps {
  data: CategoryItem[]
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const item = payload[0].payload
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
        <p className="font-semibold">{item.name}</p>
        <p className="text-muted-foreground">{formatCurrency(item.amount)}</p>
        <p className="text-muted-foreground">{formatPercent(item.percentage)}</p>
      </div>
    )
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Category Breakdown</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No spending data this month
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Category Breakdown</CardTitle></CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="w-32 h-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={56} paddingAngle={2} dataKey="amount">
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2 overflow-hidden">
            {data.slice(0, 6).map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground truncate flex-1">{item.name}</span>
                <span className="text-xs font-medium shrink-0">{formatPercent(item.percentage, 0)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
