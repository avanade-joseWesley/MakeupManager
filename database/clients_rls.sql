-- Row Level Security (RLS) policies for `clients` table
-- Run this in Supabase SQL editor (or psql) to enable RLS and restrict access so
-- each authenticated user only sees and manages their own clients.

-- 1) Enable RLS on the table
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;

-- 2) OPTIONAL: revoke wide public privileges (Supabase usually manages roles for you)
-- REVOKE ALL ON TABLE public.clients FROM public;

-- 3) Allow authenticated users to SELECT only rows that belong to them
CREATE POLICY "Clients select own" ON public.clients
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4) Allow authenticated users to INSERT rows, but ensure the inserted row.user_id
-- matches the authenticated user (WITH CHECK)
CREATE POLICY "Clients insert own" ON public.clients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5) Allow authenticated users to UPDATE only their own rows
CREATE POLICY "Clients update own" ON public.clients
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6) Allow authenticated users to DELETE only their own rows
CREATE POLICY "Clients delete own" ON public.clients
  FOR DELETE
  USING (auth.uid() = user_id);

-- Notes:
-- - `auth.uid()` is a Supabase/Postgres helper that maps to the JWT subject (user id).
-- - The service_role key bypasses RLS (do NOT use it in frontend). Use service_role only on trusted
--   server-side scripts (e.g. seeds, migrations).
-- - If you want to allow reading clients with NULL user_id (legacy/mock data), add another
--   SELECT policy that allows auth.uid() IS NULL or adjust according to your needs.

-- Example: allow authenticated users to also read rows where user_id IS NULL (optional)
-- CREATE POLICY "Clients select nullable" ON public.clients
--   FOR SELECT
--   USING (auth.uid() = user_id OR user_id IS NULL);

-- After applying these policies, test by logging in as a user and performing CRUD in the app.
-- If writes fail from the frontend, check the policies and verify the frontend sends `user_id`
-- on insert/update (the app was updated to include `user_id` when a logged-in user exists).
