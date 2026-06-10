-- Add Loan Payment as a system expense category
INSERT INTO categories (id, user_id, parent_id, name, icon, color, type, is_system, order_index)
VALUES (uuid_generate_v4(), NULL, NULL, 'Loan Payment', 'landmark', '#F97316', 'expense', true, 145)
ON CONFLICT DO NOTHING;
