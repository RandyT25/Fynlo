-- Fix infinite recursion in family_members RLS policies
-- The original policies caused a loop: family_members -> families -> family_members

-- Drop all existing RLS policies that cause recursion
DROP POLICY IF EXISTS "Users can manage own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can manage own categories" ON categories;
DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can manage own recurring transactions" ON recurring_transactions;
DROP POLICY IF EXISTS "Users can manage own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can manage own goals" ON goals;
DROP POLICY IF EXISTS "Users can manage own goal milestones" ON goal_milestones;
DROP POLICY IF EXISTS "Family members can view family" ON families;
DROP POLICY IF EXISTS "Owners can manage family" ON families;
DROP POLICY IF EXISTS "Family members can view members" ON family_members;
DROP POLICY IF EXISTS "Family admins can manage members" ON family_members;
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can manage own bill reminders" ON bill_reminders;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;

-- Create a helper function to get user's family IDs without recursion
CREATE OR REPLACE FUNCTION get_my_family_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY(
    SELECT family_id FROM family_members
    WHERE user_id = auth.uid() AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES: allow users to read/update their own profile
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ACCOUNTS
CREATE POLICY "accounts_all" ON accounts FOR ALL USING (
  auth.uid() = user_id OR
  (family_id IS NOT NULL AND family_id = ANY(get_my_family_ids()))
);

-- CATEGORIES
CREATE POLICY "categories_all" ON categories FOR ALL USING (
  user_id IS NULL OR
  auth.uid() = user_id OR
  (family_id IS NOT NULL AND family_id = ANY(get_my_family_ids()))
);

-- TRANSACTIONS
CREATE POLICY "transactions_all" ON transactions FOR ALL USING (
  auth.uid() = user_id OR
  (family_id IS NOT NULL AND family_id = ANY(get_my_family_ids()))
);

-- RECURRING TRANSACTIONS
CREATE POLICY "recurring_transactions_all" ON recurring_transactions FOR ALL USING (
  auth.uid() = user_id OR
  (family_id IS NOT NULL AND family_id = ANY(get_my_family_ids()))
);

-- BUDGETS
CREATE POLICY "budgets_all" ON budgets FOR ALL USING (
  auth.uid() = user_id OR
  (family_id IS NOT NULL AND family_id = ANY(get_my_family_ids()))
);

-- GOALS
CREATE POLICY "goals_all" ON goals FOR ALL USING (
  auth.uid() = user_id OR
  (family_id IS NOT NULL AND family_id = ANY(get_my_family_ids()))
);

-- GOAL MILESTONES (join through goals)
CREATE POLICY "goal_milestones_all" ON goal_milestones FOR ALL USING (
  goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid())
);

-- FAMILIES (no recursion — just check owner_id directly)
CREATE POLICY "families_select" ON families FOR SELECT USING (
  owner_id = auth.uid() OR
  id = ANY(get_my_family_ids())
);
CREATE POLICY "families_insert" ON families FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "families_update" ON families FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "families_delete" ON families FOR DELETE USING (owner_id = auth.uid());

-- FAMILY MEMBERS (no self-reference)
CREATE POLICY "family_members_select" ON family_members FOR SELECT USING (
  user_id = auth.uid() OR
  family_id IN (SELECT id FROM families WHERE owner_id = auth.uid())
);
CREATE POLICY "family_members_insert" ON family_members FOR INSERT WITH CHECK (
  family_id IN (SELECT id FROM families WHERE owner_id = auth.uid()) OR
  user_id = auth.uid()
);
CREATE POLICY "family_members_update" ON family_members FOR UPDATE USING (
  family_id IN (SELECT id FROM families WHERE owner_id = auth.uid()) OR
  user_id = auth.uid()
);
CREATE POLICY "family_members_delete" ON family_members FOR DELETE USING (
  family_id IN (SELECT id FROM families WHERE owner_id = auth.uid())
);

-- SUBSCRIPTIONS
CREATE POLICY "subscriptions_all" ON subscriptions FOR ALL USING (
  auth.uid() = user_id OR
  (family_id IS NOT NULL AND family_id = ANY(get_my_family_ids()))
);

-- BILL REMINDERS
CREATE POLICY "bill_reminders_all" ON bill_reminders FOR ALL USING (
  auth.uid() = user_id OR
  (family_id IS NOT NULL AND family_id = ANY(get_my_family_ids()))
);

-- NOTIFICATIONS
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- WISHLIST
CREATE POLICY "wishlist_all" ON wishlist FOR ALL USING (auth.uid() = user_id);

-- TASKS
CREATE POLICY "tasks_all" ON tasks FOR ALL USING (auth.uid() = user_id);

-- AUDIT LOGS
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (auth.uid() = user_id);

-- EXCHANGE RATES (public read)
CREATE POLICY "exchange_rates_select" ON exchange_rates FOR SELECT USING (true);
