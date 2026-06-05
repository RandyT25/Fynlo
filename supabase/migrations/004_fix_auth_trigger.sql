-- Fix the handle_new_user trigger so Supabase Auth can create profiles

-- Grant the auth schema's service role permission to insert profiles
GRANT INSERT ON public.profiles TO supabase_auth_admin;
GRANT INSERT ON public.profiles TO service_role;

-- Drop and recreate the trigger function with explicit schema + security context
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant execute to the auth admin role
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
