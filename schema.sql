-- ============================================================
-- Rapido by QI Tyrix — Complete Database Schema & RLS Architecture
-- Run this in the Supabase SQL Editor (Safe & Idempotent)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. ENUM TYPES (Safe to re-run; ignores duplicate_object)
-- ============================================================

DO $$ BEGIN
  CREATE TYPE project_type AS ENUM ('Renovation', 'Maintenance', 'New Build');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('active', 'completed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM (
    'Materials',
    'Labor',
    'Equipment Rental',
    'Plumbing',
    'Electricity',
    'Permits',
    'Transport/Fuel',
    'Misc'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2. PROJECTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type project_type NOT NULL,
  total_budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status project_status NOT NULL DEFAULT 'active',
  location TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_projects_is_demo ON projects(is_demo);

-- ============================================================
-- 3. EXPENSES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  category expense_category NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Indexes on core tables
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON expenses(deleted_at);

-- ============================================================
-- 3b. LABOR LOGS TABLE (Daily Attendance / Hazri / Dihaadi)
-- ============================================================

CREATE TABLE IF NOT EXISTS labor_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  masons_count INT NOT NULL DEFAULT 0 CHECK (masons_count >= 0),
  laborers_count INT NOT NULL DEFAULT 0 CHECK (laborers_count >= 0),
  daily_rate_mason NUMERIC(12, 2) NOT NULL DEFAULT 2500.00 CHECK (daily_rate_mason >= 0),
  daily_rate_laborer NUMERIC(12, 2) NOT NULL DEFAULT 1500.00 CHECK (daily_rate_laborer >= 0),
  total_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_labor_logs_project_id ON labor_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_labor_logs_date ON labor_logs(date);

-- Trigger function to automatically compute total_cost on insert or update
CREATE OR REPLACE FUNCTION public.compute_labor_total_cost()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_cost := (COALESCE(NEW.masons_count, 0) * COALESCE(NEW.daily_rate_mason, 2500.00)) +
                    (COALESCE(NEW.laborers_count, 0) * COALESCE(NEW.daily_rate_laborer, 1500.00));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_labor_logs_total_cost ON labor_logs;
CREATE TRIGGER trg_labor_logs_total_cost
  BEFORE INSERT OR UPDATE ON labor_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_labor_total_cost();


-- ============================================================
-- 4. ACCESS REQUESTS TABLE (Public Sign-up / Contractor Onboarding)
-- ============================================================

CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT NOT NULL,
  location TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);

-- ============================================================
-- 5. PROFILES TABLE (Linked to auth.users)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'contractor' CHECK (role IN ('admin', 'contractor')),
  company_name TEXT,                  -- NULLABLE: allows manual dashboard user creation
  phone TEXT,                         -- NULLABLE: allows manual dashboard user creation
  must_reset_password BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================================
-- 6. AUTH.USERS TRIGGER -> Populates profiles table automatically
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_must_reset BOOLEAN;
BEGIN
  -- Extract role from metadata if provided, otherwise default to 'contractor'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'contractor');
  IF user_role NOT IN ('admin', 'contractor') THEN
    user_role := 'contractor';
  END IF;

  -- Admin bootstrap can pass must_reset_password = false
  IF NEW.raw_user_meta_data->>'must_reset_password' = 'false' THEN
    user_must_reset := false;
  ELSE
    user_must_reset := true;
  END IF;

  INSERT INTO public.profiles (
    id,
    role,
    company_name,
    phone,
    must_reset_password,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    user_role,
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'phone',
    user_must_reset,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Drop and recreate trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 7. SECURITY DEFINER HELPER FUNCTIONS (Prevents recursive RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_contractor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'contractor')
      AND must_reset_password = false
  );
$$;

-- Grant execution to authenticated & anon roles
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_active_contractor() TO authenticated, anon;

-- ============================================================
-- 7b. PRIVILEGE ESCALATION & INTEGRITY TRIGGERS
-- ============================================================

-- Prevent non-admins from self-escalating role on profiles table
CREATE OR REPLACE FUNCTION public.prevent_privilege_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Only an admin can change role.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_privilege_escalation ON profiles;
CREATE TRIGGER trg_prevent_privilege_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_privilege_self_escalation();

-- Prevent non-admins from tagging projects as is_demo = true (leaking private client data)
CREATE OR REPLACE FUNCTION public.prevent_demo_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    IF NEW.is_demo = true AND (TG_OP = 'INSERT' OR OLD.is_demo IS DISTINCT FROM true) THEN
      NEW.is_demo := false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_demo_tampering ON projects;
CREATE TRIGGER trg_prevent_demo_tampering
  BEFORE INSERT OR UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_demo_tampering();

-- ============================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow user to select own profile" ON profiles;
  CREATE POLICY "Allow user to select own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR is_admin());
EXCEPTION WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow user to update own profile" ON profiles;
  CREATE POLICY "Allow user to update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR is_admin())
    WITH CHECK (id = auth.uid() OR is_admin());
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- ------------------------------------------------------------
-- ACCESS REQUESTS POLICIES
-- ------------------------------------------------------------
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow anon to submit access request" ON access_requests;
  CREATE POLICY "Allow anon to submit access request"
    ON access_requests FOR INSERT
    TO anon, authenticated
    WITH CHECK (status = 'pending');
EXCEPTION WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Only admin can view access requests" ON access_requests;
  CREATE POLICY "Only admin can view access requests"
    ON access_requests FOR SELECT
    TO authenticated
    USING (is_admin());
EXCEPTION WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Only admin can update access requests" ON access_requests;
  CREATE POLICY "Only admin can update access requests"
    ON access_requests FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- ------------------------------------------------------------
-- PROJECTS POLICIES
-- ------------------------------------------------------------
-- Drop old permissive policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for anon" ON projects;
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Anyone (including guests/anon) can view demo projects, authenticated contractors can view all
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
  DROP POLICY IF EXISTS "Anyone can view demo projects, authenticated can view all" ON projects;
  CREATE POLICY "Anyone can view demo projects, authenticated can view all"
    ON projects FOR SELECT
    TO anon, authenticated
    USING (is_demo = true OR is_active_contractor());
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Only authenticated contractors/admin with must_reset_password = false can INSERT
DO $$ BEGIN
  DROP POLICY IF EXISTS "Active contractors can insert projects" ON projects;
  CREATE POLICY "Active contractors can insert projects"
    ON projects FOR INSERT
    TO authenticated
    WITH CHECK (is_active_contractor());
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Only active contractors/admin can UPDATE
DO $$ BEGIN
  DROP POLICY IF EXISTS "Active contractors can update projects" ON projects;
  CREATE POLICY "Active contractors can update projects"
    ON projects FOR UPDATE
    TO authenticated
    USING (is_active_contractor())
    WITH CHECK (is_active_contractor());
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Only admin can DELETE projects
DO $$ BEGIN
  DROP POLICY IF EXISTS "Only admin can delete projects" ON projects;
  CREATE POLICY "Only admin can delete projects"
    ON projects FOR DELETE
    TO authenticated
    USING (is_admin());
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- ------------------------------------------------------------
-- EXPENSES POLICIES
-- ------------------------------------------------------------
-- Drop old permissive policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for anon" ON expenses;
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Anyone can view demo expenses, authenticated contractors can view all active expenses
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can view expenses" ON expenses;
  DROP POLICY IF EXISTS "Anyone can view demo expenses, authenticated can view all" ON expenses;
  CREATE POLICY "Anyone can view demo expenses, authenticated can view all"
    ON expenses FOR SELECT
    TO anon, authenticated
    USING (
      deleted_at IS NULL AND (
        (project_id IN (SELECT id FROM projects WHERE is_demo = true))
        OR is_active_contractor()
      )
    );
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Only active contractors/admin can INSERT expenses
DO $$ BEGIN
  DROP POLICY IF EXISTS "Active contractors can insert expenses" ON expenses;
  CREATE POLICY "Active contractors can insert expenses"
    ON expenses FOR INSERT
    TO authenticated
    WITH CHECK (is_active_contractor());
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Only active contractors/admin can UPDATE expenses
DO $$ BEGIN
  DROP POLICY IF EXISTS "Active contractors can update expenses" ON expenses;
  CREATE POLICY "Active contractors can update expenses"
    ON expenses FOR UPDATE
    TO authenticated
    USING (is_active_contractor())
    WITH CHECK (is_active_contractor());
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Only active contractors/admin can DELETE expenses
DO $$ BEGIN
  DROP POLICY IF EXISTS "Active contractors can delete expenses" ON expenses;
  CREATE POLICY "Active contractors can delete expenses"
    ON expenses FOR DELETE
    TO authenticated
    USING (is_active_contractor());
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- ------------------------------------------------------------
-- LABOR LOGS POLICIES (Daily Attendance / Hazri)
-- Active contractors can select labor_logs, anon can view demo labor logs
-- ------------------------------------------------------------
ALTER TABLE labor_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Active contractors can select labor_logs" ON labor_logs;
  DROP POLICY IF EXISTS "Active contractors can select labor_logs, anon can view demo" ON labor_logs;
  CREATE POLICY "Active contractors can select labor_logs, anon can view demo"
    ON labor_logs FOR SELECT
    TO anon, authenticated
    USING (
      (project_id IN (SELECT id FROM projects WHERE is_demo = true))
      OR is_active_contractor()
    );
EXCEPTION WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Active contractors can insert labor_logs" ON labor_logs;
  CREATE POLICY "Active contractors can insert labor_logs"
    ON labor_logs FOR INSERT
    TO authenticated
    WITH CHECK (is_active_contractor());
EXCEPTION WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Active contractors can update labor_logs" ON labor_logs;
  CREATE POLICY "Active contractors can update labor_logs"
    ON labor_logs FOR UPDATE
    TO authenticated
    USING (is_active_contractor())
    WITH CHECK (is_active_contractor());
EXCEPTION WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Active contractors can delete labor_logs" ON labor_logs;
  CREATE POLICY "Active contractors can delete labor_logs"
    ON labor_logs FOR DELETE
    TO authenticated
    USING (is_active_contractor());
EXCEPTION WHEN undefined_object THEN null;
END $$;


-- ------------------------------------------------------------
-- STORAGE POLICIES (receipts bucket)
-- ------------------------------------------------------------
-- Ensure receipts bucket exists with strict size limit (5MB) and image MIME types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('receipts', 'receipts', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];

DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view receipts" ON storage.objects;
  CREATE POLICY "Public can view receipts"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'receipts');
EXCEPTION WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Active contractors can upload receipts" ON storage.objects;
  CREATE POLICY "Active contractors can upload receipts"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'receipts' AND is_active_contractor());
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- ============================================================
-- 9. ADMIN BOOTSTRAP INSTRUCTIONS
-- ============================================================
-- After creating your user in Supabase Dashboard (Authentication -> Users -> Add user),
-- run this query to elevate your user to Admin with immediate full access:
--
-- UPDATE public.profiles
-- SET role = 'admin', must_reset_password = false
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');

-- ============================================================
-- 10. DEMO SHOWCASE DATA TAGGING & SELF-SEEDING
-- ============================================================
-- Tag existing showcase/test projects as demo projects so Guest Mode
-- continues to show rich demo data for prospective clients:
UPDATE public.projects
SET is_demo = true
WHERE name IN (
  'Jinnahabad 10-Marla Build',
  'Mandian Plaza Renovation',
  'Supply Depot Maintenance',
  'Cantt Road Boundary Wall'
);

-- If any of the showcase demo projects don't exist yet, insert them with is_demo = true:
INSERT INTO public.projects (name, type, total_budget, status, location, is_demo, start_date)
SELECT 'Jinnahabad 10-Marla Build', 'New Build'::project_type, 4500000, 'active'::project_status, 'Jinnahabad, Abbottabad', true, NOW() - INTERVAL '60 days'
WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE name = 'Jinnahabad 10-Marla Build');

INSERT INTO public.projects (name, type, total_budget, status, location, is_demo, start_date)
SELECT 'Mandian Plaza Renovation', 'Renovation'::project_type, 1800000, 'active'::project_status, 'Mandian, Abbottabad', true, NOW() - INTERVAL '45 days'
WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE name = 'Mandian Plaza Renovation');

INSERT INTO public.projects (name, type, total_budget, status, location, is_demo, start_date)
SELECT 'Supply Depot Maintenance', 'Maintenance'::project_type, 350000, 'active'::project_status, 'Supply, Abbottabad', true, NOW() - INTERVAL '25 days'
WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE name = 'Supply Depot Maintenance');

INSERT INTO public.projects (name, type, total_budget, status, location, is_demo, start_date, completed_at)
SELECT 'Cantt Road Boundary Wall', 'New Build'::project_type, 750000, 'completed'::project_status, 'Cantt Road, Abbottabad', true, NOW() - INTERVAL '90 days', NOW() - INTERVAL '20 days'
WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE name = 'Cantt Road Boundary Wall');


