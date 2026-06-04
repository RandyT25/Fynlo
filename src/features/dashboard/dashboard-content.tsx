'use client'

import { TrendingUp, TrendingDown, Percent, Wallet } from 'lucide-react'
import { useDashboard } from '@/hooks/use-dashboard'
import { BalanceCard } from './balance-card'
import { StatCard } from './stat-card'
import { CashFlowChart } from './cash-flow-chart'
import { CategoryBreakdown } from './category-breakdown'
import { RecentTransactions } from './recent-transactions'
import { BudgetOverview } from './budget-overview'
import { GoalsPreview } from './goals-preview'
import { UpcomingBills } from './upcoming-bills'
import { AccountsOverview } from './accounts-overview'
import { LoadingPage } from '@/components/shared/loading-spinner'
import { ErrorState } from '@/components/shared/error-state'
import { formatCurrency, formatPercent } from '@/lib/utils/format'

export function DashboardContent() {
  const { data, isLoading, error, refetch } = useDashboard()

  if (isLoading) return <LoadingPage />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return null

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Balance hero card */}
      <BalanceCard
        totalBalance={data.totalBalance}
        monthlyIncome={data.monthlyIncome}
        monthlyExpenses={data.monthlyExpenses}
        savingsRate={data.savingsRate}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Balance"
          value={formatCurrency(data.totalBalance)}
          icon={Wallet}
          iconColor="text-blue-500"
          delay={0.1}
        />
        <StatCard
          title="Monthly Income"
          value={formatCurrency(data.monthlyIncome)}
          icon={TrendingUp}
          iconColor="text-green-500"
          delay={0.2}
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(data.monthlyExpenses)}
          icon={TrendingDown}
          iconColor="text-red-500"
          delay={0.3}
        />
        <StatCard
          title="Savings Rate"
          value={formatPercent(data.savingsRate)}
          icon={Percent}
          iconColor="text-purple-500"
          delay={0.4}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <CashFlowChart data={data.cashFlowData} />
          <RecentTransactions transactions={data.recentTransactions} />
          <AccountsOverview accounts={data.accounts} />
        </div>

        {/* Right column (1/3 width) */}
        <div className="space-y-6">
          <CategoryBreakdown data={data.categorySpending} />
          <BudgetOverview budgets={data.budgets} />
          <GoalsPreview goals={data.goals} />
          <UpcomingBills bills={data.upcomingBills} />
        </div>
      </div>
    </div>
  )
}
