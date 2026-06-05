-- Grant table permissions to authenticated and anon roles

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON profiles TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON recurring_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON goal_milestones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON families TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON family_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON bill_reminders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON wishlist TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_logs TO authenticated;
GRANT SELECT ON exchange_rates TO anon, authenticated;
GRANT INSERT ON exchange_rates TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT EXECUTE ON FUNCTION get_my_family_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION get_net_worth(UUID) TO authenticated;

GRANT SELECT ON monthly_summary TO authenticated;
GRANT SELECT ON category_spending TO authenticated;
