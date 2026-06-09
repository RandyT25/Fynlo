-- Backfill profile rows for any auth users that don't have one.
-- Runs as postgres (superuser), bypasses RLS. Safe to re-run.
INSERT INTO public.profiles (id, email)
SELECT u.id, COALESCE(u.email, u.id::text)
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;
