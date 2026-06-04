export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          currency: string
          timezone: string
          language: string
          notifications_enabled: boolean
          theme: string
          onboarding_completed: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          currency?: string
          timezone?: string
          language?: string
          notifications_enabled?: boolean
          theme?: string
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          currency?: string
          timezone?: string
          language?: string
          notifications_enabled?: boolean
          theme?: string
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          family_id: string | null
          name: string
          type: AccountType
          balance: number
          currency: string
          color: string
          icon: string
          institution: string | null
          notes: string | null
          is_active: boolean
          include_in_net_worth: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          family_id?: string | null
          name: string
          type: AccountType
          balance?: number
          currency?: string
          color?: string
          icon?: string
          institution?: string | null
          notes?: string | null
          is_active?: boolean
          include_in_net_worth?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          family_id?: string | null
          name?: string
          type?: AccountType
          balance?: number
          currency?: string
          color?: string
          icon?: string
          institution?: string | null
          notes?: string | null
          is_active?: boolean
          include_in_net_worth?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string | null
          family_id: string | null
          parent_id: string | null
          name: string
          icon: string
          color: string
          type: CategoryType
          is_system: boolean
          order_index: number
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          family_id?: string | null
          parent_id?: string | null
          name: string
          icon?: string
          color?: string
          type?: CategoryType
          is_system?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          family_id?: string | null
          parent_id?: string | null
          name?: string
          icon?: string
          color?: string
          type?: CategoryType
          is_system?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          family_id: string | null
          account_id: string
          to_account_id: string | null
          category_id: string | null
          recurring_id: string | null
          type: TransactionType
          amount: number
          currency: string
          exchange_rate: number
          description: string
          notes: string | null
          date: string
          tags: string[]
          attachments: Json[]
          is_reconciled: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          family_id?: string | null
          account_id: string
          to_account_id?: string | null
          category_id?: string | null
          recurring_id?: string | null
          type: TransactionType
          amount: number
          currency?: string
          exchange_rate?: number
          description: string
          notes?: string | null
          date: string
          tags?: string[]
          attachments?: Json[]
          is_reconciled?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          family_id?: string | null
          account_id?: string
          to_account_id?: string | null
          category_id?: string | null
          recurring_id?: string | null
          type?: TransactionType
          amount?: number
          currency?: string
          exchange_rate?: number
          description?: string
          notes?: string | null
          date?: string
          tags?: string[]
          attachments?: Json[]
          is_reconciled?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      recurring_transactions: {
        Row: {
          id: string
          user_id: string
          family_id: string | null
          account_id: string
          to_account_id: string | null
          category_id: string | null
          type: TransactionType
          amount: number
          currency: string
          description: string
          notes: string | null
          frequency: RecurringFrequency
          interval: number
          start_date: string
          end_date: string | null
          next_date: string
          last_created_date: string | null
          tags: string[]
          is_active: boolean
          is_paused: boolean
          auto_create: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          family_id?: string | null
          account_id: string
          to_account_id?: string | null
          category_id?: string | null
          type: TransactionType
          amount: number
          currency?: string
          description: string
          notes?: string | null
          frequency: RecurringFrequency
          interval?: number
          start_date: string
          end_date?: string | null
          next_date: string
          last_created_date?: string | null
          tags?: string[]
          is_active?: boolean
          is_paused?: boolean
          auto_create?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          family_id?: string | null
          account_id?: string
          to_account_id?: string | null
          category_id?: string | null
          type?: TransactionType
          amount?: number
          currency?: string
          description?: string
          notes?: string | null
          frequency?: RecurringFrequency
          interval?: number
          start_date?: string
          end_date?: string | null
          next_date?: string
          last_created_date?: string | null
          tags?: string[]
          is_active?: boolean
          is_paused?: boolean
          auto_create?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          family_id: string | null
          category_id: string | null
          name: string
          amount: number
          period: BudgetPeriod
          start_date: string
          end_date: string | null
          rollover_enabled: boolean
          rollover_amount: number
          is_active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          family_id?: string | null
          category_id?: string | null
          name: string
          amount: number
          period?: BudgetPeriod
          start_date: string
          end_date?: string | null
          rollover_enabled?: boolean
          rollover_amount?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          family_id?: string | null
          category_id?: string | null
          name?: string
          amount?: number
          period?: BudgetPeriod
          start_date?: string
          end_date?: string | null
          rollover_enabled?: boolean
          rollover_amount?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          family_id: string | null
          account_id: string | null
          name: string
          description: string | null
          type: GoalType
          target_amount: number
          current_amount: number
          currency: string
          target_date: string | null
          color: string
          icon: string
          image_url: string | null
          priority: number
          is_completed: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          family_id?: string | null
          account_id?: string | null
          name: string
          description?: string | null
          type?: GoalType
          target_amount: number
          current_amount?: number
          currency?: string
          target_date?: string | null
          color?: string
          icon?: string
          image_url?: string | null
          priority?: number
          is_completed?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          family_id?: string | null
          account_id?: string | null
          name?: string
          description?: string | null
          type?: GoalType
          target_amount?: number
          current_amount?: number
          currency?: string
          target_date?: string | null
          color?: string
          icon?: string
          image_url?: string | null
          priority?: number
          is_completed?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      goal_milestones: {
        Row: {
          id: string
          goal_id: string
          name: string
          amount: number
          is_completed: boolean
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          name: string
          amount: number
          is_completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          name?: string
          amount?: number
          is_completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
      }
      families: {
        Row: {
          id: string
          name: string
          owner_id: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      family_members: {
        Row: {
          id: string
          family_id: string
          user_id: string
          role: FamilyRole
          status: MemberStatus
          invited_email: string | null
          invited_at: string
          joined_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          user_id: string
          role?: FamilyRole
          status?: MemberStatus
          invited_email?: string | null
          invited_at?: string
          joined_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          user_id?: string
          role?: FamilyRole
          status?: MemberStatus
          invited_email?: string | null
          invited_at?: string
          joined_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          family_id: string | null
          category_id: string | null
          transaction_id: string | null
          name: string
          amount: number
          currency: string
          billing_cycle: BillingCycle
          next_billing_date: string
          last_billing_date: string | null
          status: SubscriptionStatus
          website_url: string | null
          logo_url: string | null
          notes: string | null
          auto_detected: boolean
          cancelled_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          family_id?: string | null
          category_id?: string | null
          transaction_id?: string | null
          name: string
          amount: number
          currency?: string
          billing_cycle?: BillingCycle
          next_billing_date: string
          last_billing_date?: string | null
          status?: SubscriptionStatus
          website_url?: string | null
          logo_url?: string | null
          notes?: string | null
          auto_detected?: boolean
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          family_id?: string | null
          category_id?: string | null
          transaction_id?: string | null
          name?: string
          amount?: number
          currency?: string
          billing_cycle?: BillingCycle
          next_billing_date?: string
          last_billing_date?: string | null
          status?: SubscriptionStatus
          website_url?: string | null
          logo_url?: string | null
          notes?: string | null
          auto_detected?: boolean
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      bill_reminders: {
        Row: {
          id: string
          user_id: string
          family_id: string | null
          account_id: string | null
          category_id: string | null
          name: string
          amount: number
          currency: string
          due_date: string
          priority: Priority
          is_recurring: boolean
          frequency: RecurringFrequency | null
          is_completed: boolean
          completed_at: string | null
          is_overdue: boolean
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          family_id?: string | null
          account_id?: string | null
          category_id?: string | null
          name: string
          amount: number
          currency?: string
          due_date: string
          priority?: Priority
          is_recurring?: boolean
          frequency?: RecurringFrequency | null
          is_completed?: boolean
          completed_at?: string | null
          is_overdue?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          family_id?: string | null
          account_id?: string | null
          category_id?: string | null
          name?: string
          amount?: number
          currency?: string
          due_date?: string
          priority?: Priority
          is_recurring?: boolean
          frequency?: RecurringFrequency | null
          is_completed?: boolean
          completed_at?: string | null
          is_overdue?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: NotificationType
          reference_id: string | null
          reference_type: string | null
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: NotificationType
          reference_id?: string | null
          reference_type?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: NotificationType
          reference_id?: string | null
          reference_type?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }
      exchange_rates: {
        Row: {
          id: string
          base_currency: string
          target_currency: string
          rate: number
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          base_currency: string
          target_currency: string
          rate: number
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          base_currency?: string
          target_currency?: string
          rate?: number
          date?: string
          created_at?: string
        }
      }
      wishlist: {
        Row: {
          id: string
          user_id: string
          family_id: string | null
          name: string
          description: string | null
          target_amount: number
          current_amount: number
          currency: string
          image_url: string | null
          url: string | null
          priority: Priority
          converted_to_goal_id: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          family_id?: string | null
          name: string
          description?: string | null
          target_amount: number
          current_amount?: number
          currency?: string
          image_url?: string | null
          url?: string | null
          priority?: Priority
          converted_to_goal_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          family_id?: string | null
          name?: string
          description?: string | null
          target_amount?: number
          current_amount?: number
          currency?: string
          image_url?: string | null
          url?: string | null
          priority?: Priority
          converted_to_goal_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          family_id: string | null
          title: string
          description: string | null
          due_date: string | null
          priority: Priority
          is_completed: boolean
          completed_at: string | null
          category: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          family_id?: string | null
          title: string
          description?: string | null
          due_date?: string | null
          priority?: Priority
          is_completed?: boolean
          completed_at?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          family_id?: string | null
          title?: string
          description?: string | null
          due_date?: string | null
          priority?: Priority
          is_completed?: boolean
          completed_at?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          table_name?: string
          record_id?: string
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      monthly_summary: {
        Row: {
          user_id: string | null
          month: string | null
          total_income: number | null
          total_expenses: number | null
          net: number | null
          savings_rate: number | null
        }
      }
      category_spending: {
        Row: {
          user_id: string | null
          category_id: string | null
          category_name: string | null
          total_amount: number | null
          transaction_count: number | null
          month: string | null
        }
      }
    }
    Functions: {
      get_net_worth: {
        Args: { p_user_id: string }
        Returns: number
      }
      calculate_budget_utilization: {
        Args: { p_budget_id: string; p_period_start: string; p_period_end: string }
        Returns: number
      }
    }
    Enums: {
      account_type: AccountType
      transaction_type: TransactionType
      category_type: CategoryType
      recurring_frequency: RecurringFrequency
      budget_period: BudgetPeriod
      goal_type: GoalType
      family_role: FamilyRole
      member_status: MemberStatus
      billing_cycle: BillingCycle
      subscription_status: SubscriptionStatus
      priority: Priority
      notification_type: NotificationType
    }
  }
}

export type AccountType = 'cash' | 'checking' | 'savings' | 'credit_card' | 'loan' | 'investment' | 'crypto' | 'business' | 'custom'
export type TransactionType = 'income' | 'expense' | 'transfer' | 'refund'
export type CategoryType = 'income' | 'expense' | 'transfer'
export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'
export type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly' | 'custom'
export type GoalType = 'savings' | 'debt' | 'custom'
export type FamilyRole = 'owner' | 'admin' | 'member' | 'viewer'
export type MemberStatus = 'pending' | 'active' | 'inactive'
export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type SubscriptionStatus = 'active' | 'cancelled' | 'paused'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type NotificationType = 'bill_due' | 'budget_exceeded' | 'goal_milestone' | 'subscription_renewal' | 'transfer_reminder' | 'general'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Account = Database['public']['Tables']['accounts']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type RecurringTransaction = Database['public']['Tables']['recurring_transactions']['Row']
export type Budget = Database['public']['Tables']['budgets']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type GoalMilestone = Database['public']['Tables']['goal_milestones']['Row']
export type Family = Database['public']['Tables']['families']['Row']
export type FamilyMember = Database['public']['Tables']['family_members']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type BillReminder = Database['public']['Tables']['bill_reminders']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type ExchangeRate = Database['public']['Tables']['exchange_rates']['Row']
export type WishlistItem = Database['public']['Tables']['wishlist']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']

export type TransactionWithRelations = Transaction & {
  account?: Account
  to_account?: Account
  category?: Category & { parent?: Category }
}

export type CategoryWithChildren = Category & {
  children?: CategoryWithChildren[]
  budget?: Budget
  spent?: number
}

export type AccountWithBalance = Account & {
  calculated_balance?: number
}
