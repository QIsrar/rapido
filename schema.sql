-- ============================================================
-- Rapido by QI Tyrix — Database Schema (Idempotent & Safe)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES (Safe to re-run; will not throw ERROR 42710)
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
-- PROJECTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type project_type NOT NULL,
  total_budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status project_status NOT NULL DEFAULT 'active',
  location TEXT,                     -- Site location or Google Maps link
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure location column exists if table was created in an earlier migration
ALTER TABLE projects ADD COLUMN IF NOT EXISTS location TEXT;


-- ============================================================
-- EXPENSES TABLE
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
  deleted_at TIMESTAMPTZ             -- Soft-delete timestamp
);

-- Ensure deleted_at column exists if table was created in an earlier migration
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ============================================================
-- INDEXES (Safe to re-run)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON expenses(deleted_at);

-- ============================================================
-- ROW LEVEL SECURITY — Permissive for single-user MVP
-- ============================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for anon" ON projects;
  CREATE POLICY "Allow all for anon" ON projects FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for anon" ON expenses;
  CREATE POLICY "Allow all for anon" ON expenses FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_object THEN null;
END $$;
