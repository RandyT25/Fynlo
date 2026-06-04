import { create } from 'zustand'
import type { Account, Transaction, Budget, Goal } from '@/types/database'

interface DashboardState {
  accounts: Account[]
  recentTransactions: Transaction[]
  budgets: Budget[]
  goals: Goal[]
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number
  isLoading: boolean
  lastUpdated: Date | null
  setAccounts: (accounts: Account[]) => void
  setRecentTransactions: (transactions: Transaction[]) => void
  setBudgets: (budgets: Budget[]) => void
  setGoals: (goals: Goal[]) => void
  setSummary: (income: number, expenses: number, balance: number) => void
  setLoading: (loading: boolean) => void
  setLastUpdated: () => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  accounts: [],
  recentTransactions: [],
  budgets: [],
  goals: [],
  totalBalance: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  savingsRate: 0,
  isLoading: false,
  lastUpdated: null,
  setAccounts: (accounts) => set({ accounts }),
  setRecentTransactions: (recentTransactions) => set({ recentTransactions }),
  setBudgets: (budgets) => set({ budgets }),
  setGoals: (goals) => set({ goals }),
  setSummary: (monthlyIncome, monthlyExpenses, totalBalance) =>
    set({
      monthlyIncome,
      monthlyExpenses,
      totalBalance,
      savingsRate: monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setLastUpdated: () => set({ lastUpdated: new Date() }),
}))
