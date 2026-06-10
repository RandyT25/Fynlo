-- Seed subcategories for system categories that have no children yet
-- Safe to run multiple times (idempotent)

INSERT INTO categories (id, user_id, family_id, parent_id, name, icon, color, type, is_system, order_index)
SELECT
  uuid_generate_v4(), NULL, NULL,
  c.id, sub.name, sub.icon, c.color, 'expense', true, sub.ord
FROM categories c
CROSS JOIN (VALUES
  ('Electricity', 'zap', 1),
  ('Water', 'droplets', 2),
  ('Internet', 'wifi', 3),
  ('Gas', 'flame', 4),
  ('Phone / Mobile', 'smartphone', 5)
) AS sub(name, icon, ord)
WHERE c.name = 'Utilities' AND c.parent_id IS NULL AND c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM categories WHERE parent_id = c.id AND name = sub.name AND deleted_at IS NULL
  );

INSERT INTO categories (id, user_id, family_id, parent_id, name, icon, color, type, is_system, order_index)
SELECT
  uuid_generate_v4(), NULL, NULL,
  c.id, sub.name, sub.icon, c.color, 'expense', true, sub.ord
FROM categories c
CROSS JOIN (VALUES
  ('Groceries', 'shopping-cart', 1),
  ('Restaurant', 'utensils', 2),
  ('Coffee', 'coffee', 3),
  ('Fast Food', 'burger', 4),
  ('Food Delivery', 'bike', 5)
) AS sub(name, icon, ord)
WHERE c.name = 'Food & Dining' AND c.parent_id IS NULL AND c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM categories WHERE parent_id = c.id AND name = sub.name AND deleted_at IS NULL
  );

INSERT INTO categories (id, user_id, family_id, parent_id, name, icon, color, type, is_system, order_index)
SELECT
  uuid_generate_v4(), NULL, NULL,
  c.id, sub.name, sub.icon, c.color, 'expense', true, sub.ord
FROM categories c
CROSS JOIN (VALUES
  ('Fuel', 'fuel', 1),
  ('Public Transport', 'bus', 2),
  ('Parking', 'square-parking', 3),
  ('Car Maintenance', 'wrench', 4),
  ('Ride Hailing', 'car', 5)
) AS sub(name, icon, ord)
WHERE c.name = 'Transport' AND c.parent_id IS NULL AND c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM categories WHERE parent_id = c.id AND name = sub.name AND deleted_at IS NULL
  );

INSERT INTO categories (id, user_id, family_id, parent_id, name, icon, color, type, is_system, order_index)
SELECT
  uuid_generate_v4(), NULL, NULL,
  c.id, sub.name, sub.icon, c.color, 'expense', true, sub.ord
FROM categories c
CROSS JOIN (VALUES
  ('Rent / Mortgage', 'home', 1),
  ('Home Maintenance', 'hammer', 2),
  ('Furniture', 'armchair', 3),
  ('Home Insurance', 'shield', 4)
) AS sub(name, icon, ord)
WHERE c.name = 'Housing' AND c.parent_id IS NULL AND c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM categories WHERE parent_id = c.id AND name = sub.name AND deleted_at IS NULL
  );

INSERT INTO categories (id, user_id, family_id, parent_id, name, icon, color, type, is_system, order_index)
SELECT
  uuid_generate_v4(), NULL, NULL,
  c.id, sub.name, sub.icon, c.color, 'expense', true, sub.ord
FROM categories c
CROSS JOIN (VALUES
  ('Doctor', 'stethoscope', 1),
  ('Pharmacy', 'pill', 2),
  ('Dental', 'tooth', 3),
  ('Gym / Fitness', 'dumbbell', 4),
  ('Mental Health', 'brain', 5)
) AS sub(name, icon, ord)
WHERE c.name = 'Healthcare' AND c.parent_id IS NULL AND c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM categories WHERE parent_id = c.id AND name = sub.name AND deleted_at IS NULL
  );

INSERT INTO categories (id, user_id, family_id, parent_id, name, icon, color, type, is_system, order_index)
SELECT
  uuid_generate_v4(), NULL, NULL,
  c.id, sub.name, sub.icon, c.color, 'expense', true, sub.ord
FROM categories c
CROSS JOIN (VALUES
  ('Movies / Cinema', 'film', 1),
  ('Games', 'gamepad-2', 2),
  ('Streaming', 'tv', 3),
  ('Sports', 'trophy', 4),
  ('Concerts / Events', 'music', 5)
) AS sub(name, icon, ord)
WHERE c.name = 'Entertainment' AND c.parent_id IS NULL AND c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM categories WHERE parent_id = c.id AND name = sub.name AND deleted_at IS NULL
  );
