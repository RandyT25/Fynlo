-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE account_type AS ENUM ('cash','checking','savings','credit_card','loan','investment','crypto','business','custom');
CREATE TYPE transaction_type AS ENUM ('income','expense','transfer','refund');
CREATE TYPE category_type AS ENUM ('income','expense','transfer');
CREATE TYPE recurring_frequency AS ENUM ('daily','weekly','biweekly','monthly','quarterly','yearly','custom');
CREATE TYPE budget_period AS ENUM ('monthly','quarterly','yearly','custom');
CREATE TYPE goal_type AS ENUM ('savings','debt','custom');
CREATE TYPE family_role AS ENUM ('owner','admin','member','viewer');
CREATE TYPE member_status AS ENUM ('pending','active','inactive');
CREATE TYPE billing_cycle AS ENUM ('weekly','monthly','quarterly','yearly');
CREATE TYPE subscription_status AS ENUM ('active','cancelled','paused');
CREATE TYPE priority AS ENUM ('low','medium','high','urgent');
CREATE TYPE notification_type AS ENUM ('bill_due','budget_exceeded','goal_milestone','subscription_renewal','transfer_reminder','general');

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  language TEXT NOT NULL DEFAULT 'en',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  theme TEXT NOT NULL DEFAULT 'system',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Families
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Family Members
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role family_role NOT NULL DEFAULT 'member',
  status member_status NOT NULL DEFAULT 'pending',
  invited_email TEXT,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- Accounts
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type account_type NOT NULL,
  balance DECIMAL(20,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT NOT NULL DEFAULT 'wallet',
  institution TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  include_in_net_worth BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Categories (hierarchical with unlimited nesting)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'tag',
  color TEXT NOT NULL DEFAULT '#6B7280',
  type category_type NOT NULL DEFAULT 'expense',
  is_system BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  recurring_id UUID,
  type transaction_type NOT NULL,
  amount DECIMAL(20,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate DECIMAL(20,6) NOT NULL DEFAULT 1,
  description TEXT NOT NULL,
  notes TEXT,
  date DATE NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  attachments JSONB NOT NULL DEFAULT '[]',
  is_reconciled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Recurring Transactions
CREATE TABLE recurring_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type transaction_type NOT NULL,
  amount DECIMAL(20,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT NOT NULL,
  notes TEXT,
  frequency recurring_frequency NOT NULL,
  interval INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE,
  next_date DATE NOT NULL,
  last_created_date DATE,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_paused BOOLEAN NOT NULL DEFAULT false,
  auto_create BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE transactions ADD CONSTRAINT fk_recurring FOREIGN KEY (recurring_id) REFERENCES recurring_transactions(id) ON DELETE SET NULL;

-- Budgets
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount DECIMAL(20,2) NOT NULL,
  period budget_period NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE,
  rollover_enabled BOOLEAN NOT NULL DEFAULT false,
  rollover_amount DECIMAL(20,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Goals
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  type goal_type NOT NULL DEFAULT 'savings',
  target_amount DECIMAL(20,2) NOT NULL,
  current_amount DECIMAL(20,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  target_date DATE,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT NOT NULL DEFAULT 'target',
  image_url TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Goal Milestones
CREATE TABLE goal_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(20,2) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount DECIMAL(20,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
  next_billing_date DATE NOT NULL,
  last_billing_date DATE,
  status subscription_status NOT NULL DEFAULT 'active',
  website_url TEXT,
  logo_url TEXT,
  notes TEXT,
  auto_detected BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Bill Reminders
CREATE TABLE bill_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount DECIMAL(20,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  due_date DATE NOT NULL,
  priority priority NOT NULL DEFAULT 'medium',
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  frequency recurring_frequency,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  is_overdue BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Exchange Rates
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate DECIMAL(20,6) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(base_currency, target_currency, date)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'general',
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wishlist
CREATE TABLE wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(20,2) NOT NULL,
  current_amount DECIMAL(20,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  image_url TEXT,
  url TEXT,
  priority priority NOT NULL DEFAULT 'medium',
  converted_to_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority priority NOT NULL DEFAULT 'medium',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_account_id ON transactions(account_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_date ON transactions(date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_category_id ON transactions(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_type ON transactions(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_accounts_user_id ON accounts(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_user_id ON categories(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_parent_id ON categories(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_budgets_user_id ON budgets(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_goals_user_id ON goals(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_user_id_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_recurring_transactions_next_date ON recurring_transactions(next_date) WHERE is_active = true AND is_paused = false AND deleted_at IS NULL;
CREATE INDEX idx_bill_reminders_due_date ON bill_reminders(due_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date) WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id, created_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_transactions_updated_at BEFORE UPDATE ON recurring_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bill_reminders_updated_at BEFORE UPDATE ON bill_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wishlist_updated_at BEFORE UPDATE ON wishlist FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Account balance update trigger
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
    IF NEW.type = 'income' OR NEW.type = 'refund' THEN
      UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'transfer' THEN
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      IF NEW.to_account_id IS NOT NULL THEN
        UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.to_account_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL) THEN
    IF OLD.type = 'income' OR OLD.type = 'refund' THEN
      UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'transfer' THEN
      UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      IF OLD.to_account_id IS NOT NULL THEN
        UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.to_account_id;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Monthly summary view
CREATE OR REPLACE VIEW monthly_summary AS
SELECT
  user_id,
  DATE_TRUNC('month', date) AS month,
  SUM(CASE WHEN type IN ('income','refund') THEN amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses,
  SUM(CASE WHEN type IN ('income','refund') THEN amount ELSE -amount END) AS net,
  CASE
    WHEN SUM(CASE WHEN type IN ('income','refund') THEN amount ELSE 0 END) > 0
    THEN ROUND((SUM(CASE WHEN type IN ('income','refund') THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)) / SUM(CASE WHEN type IN ('income','refund') THEN amount ELSE 0 END) * 100, 2)
    ELSE 0
  END AS savings_rate
FROM transactions
WHERE deleted_at IS NULL
GROUP BY user_id, DATE_TRUNC('month', date);

-- Category spending view
CREATE OR REPLACE VIEW category_spending AS
SELECT
  t.user_id,
  c.id AS category_id,
  c.name AS category_name,
  SUM(t.amount) AS total_amount,
  COUNT(*) AS transaction_count,
  DATE_TRUNC('month', t.date) AS month
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.deleted_at IS NULL AND t.type = 'expense'
GROUP BY t.user_id, c.id, c.name, DATE_TRUNC('month', t.date);

-- Net worth function
CREATE OR REPLACE FUNCTION get_net_worth(p_user_id UUID)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(
    CASE
      WHEN type IN ('checking','savings','cash','investment','crypto','business','custom') THEN balance
      WHEN type IN ('credit_card','loan') THEN -balance
      ELSE balance
    END
  ), 0)
  FROM accounts
  WHERE user_id = p_user_id
    AND is_active = true
    AND include_in_net_worth = true
    AND deleted_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Accounts RLS
CREATE POLICY "Users can manage own accounts" ON accounts FOR ALL USING (
  auth.uid() = user_id OR
  (family_id IS NOT NULL AND family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active'))
);

-- Categories RLS
CREATE POLICY "Users can manage own categories" ON categories FOR ALL USING (
  user_id IS NULL OR auth.uid() = user_id OR
  (family_id IS NOT NULL AND family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active'))
);

-- Transactions RLS
CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL USING (
  auth.uid() = user_id OR
  (family_id IS NOT NULL AND family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active'))
);

-- Recurring Transactions RLS
CREATE POLICY "Users can manage own recurring transactions" ON recurring_transactions FOR ALL USING (
  auth.uid() = user_id OR
  (family_id IS NOT NULL AND family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active'))
);

-- Budgets RLS
CREATE POLICY "Users can manage own budgets" ON budgets FOR ALL USING (
  auth.uid() = user_id OR
  (family_id IS NOT NULL AND family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active'))
);

-- Goals RLS
CREATE POLICY "Users can manage own goals" ON goals FOR ALL USING (
  auth.uid() = user_id OR
  (family_id IS NOT NULL AND family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active'))
);

-- Goal Milestones RLS
CREATE POLICY "Users can manage own goal milestones" ON goal_milestones FOR ALL USING (
  goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
);

-- Families RLS
CREATE POLICY "Family members can view family" ON families FOR SELECT USING (
  owner_id = auth.uid() OR
  id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active')
);
CREATE POLICY "Owners can manage family" ON families FOR ALL USING (owner_id = auth.uid());

-- Family Members RLS
CREATE POLICY "Family members can view members" ON family_members FOR SELECT USING (
  user_id = auth.uid() OR
  family_id IN (SELECT id FROM families WHERE owner_id = auth.uid())
);
CREATE POLICY "Family admins can manage members" ON family_members FOR ALL USING (
  family_id IN (SELECT id FROM families WHERE owner_id = auth.uid()) OR user_id = auth.uid()
);

-- Subscriptions RLS
CREATE POLICY "Users can manage own subscriptions" ON subscriptions FOR ALL USING (
  auth.uid() = user_id OR
  (family_id IS NOT NULL AND family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active'))
);

-- Bill Reminders RLS
CREATE POLICY "Users can manage own bill reminders" ON bill_reminders FOR ALL USING (
  auth.uid() = user_id OR
  (family_id IS NOT NULL AND family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND status = 'active'))
);

-- Notifications RLS
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Wishlist RLS
CREATE POLICY "Users can manage own wishlist" ON wishlist FOR ALL USING (auth.uid() = user_id);

-- Tasks RLS
CREATE POLICY "Users can manage own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);

-- Exchange Rates (public read)
CREATE POLICY "Anyone can read exchange rates" ON exchange_rates FOR SELECT USING (true);

-- Audit Logs RLS
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);

-- Seed system categories
INSERT INTO categories (id, user_id, parent_id, name, icon, color, type, is_system, order_index) VALUES
-- Income categories
(uuid_generate_v4(), NULL, NULL, 'Salary', 'briefcase', '#22C55E', 'income', true, 1),
(uuid_generate_v4(), NULL, NULL, 'Freelance', 'laptop', '#22C55E', 'income', true, 2),
(uuid_generate_v4(), NULL, NULL, 'Investment Returns', 'trending-up', '#22C55E', 'income', true, 3),
(uuid_generate_v4(), NULL, NULL, 'Rental Income', 'home', '#22C55E', 'income', true, 4),
(uuid_generate_v4(), NULL, NULL, 'Other Income', 'plus-circle', '#22C55E', 'income', true, 5),
-- Expense parent categories
(uuid_generate_v4(), NULL, NULL, 'Food & Dining', 'utensils', '#F97316', 'expense', true, 10),
(uuid_generate_v4(), NULL, NULL, 'Transport', 'car', '#6366F1', 'expense', true, 20),
(uuid_generate_v4(), NULL, NULL, 'Housing', 'home', '#8B5CF6', 'expense', true, 30),
(uuid_generate_v4(), NULL, NULL, 'Healthcare', 'heart-pulse', '#EF4444', 'expense', true, 40),
(uuid_generate_v4(), NULL, NULL, 'Shopping', 'shopping-bag', '#EC4899', 'expense', true, 50),
(uuid_generate_v4(), NULL, NULL, 'Entertainment', 'gamepad-2', '#F59E0B', 'expense', true, 60),
(uuid_generate_v4(), NULL, NULL, 'Education', 'graduation-cap', '#3B82F6', 'expense', true, 70),
(uuid_generate_v4(), NULL, NULL, 'Personal Care', 'sparkles', '#14B8A6', 'expense', true, 80),
(uuid_generate_v4(), NULL, NULL, 'Utilities', 'zap', '#6B7280', 'expense', true, 90),
(uuid_generate_v4(), NULL, NULL, 'Insurance', 'shield', '#64748B', 'expense', true, 100),
(uuid_generate_v4(), NULL, NULL, 'Subscriptions', 'repeat', '#7C3AED', 'expense', true, 110),
(uuid_generate_v4(), NULL, NULL, 'Travel', 'plane', '#0EA5E9', 'expense', true, 120),
(uuid_generate_v4(), NULL, NULL, 'Gifts & Donations', 'gift', '#F43F5E', 'expense', true, 130),
(uuid_generate_v4(), NULL, NULL, 'Investments', 'trending-up', '#10B981', 'expense', true, 140),
(uuid_generate_v4(), NULL, NULL, 'Other', 'more-horizontal', '#9CA3AF', 'expense', true, 999);
