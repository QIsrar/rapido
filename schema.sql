-- ============================================================
-- Rapido by QI Tyrix — Database Schema (Phase 3)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE project_type AS ENUM ('Renovation', 'Maintenance', 'New Build');
CREATE TYPE project_status AS ENUM ('active', 'completed');
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

-- ============================================================
-- PROJECTS TABLE
-- ============================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type project_type NOT NULL,
  total_budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status project_status NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EXPENSES TABLE
-- ============================================================

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  category expense_category NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ             -- Phase 3: soft-delete instead of hard DELETE
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_expenses_project_id ON expenses(project_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_deleted_at ON expenses(deleted_at);

-- ============================================================
-- ROW LEVEL SECURITY — Disabled for single-user MVP
-- (Enable + add policies when adding auth in future)
-- ============================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon (single-user, no auth)
CREATE POLICY "Allow all for anon" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON expenses FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Phase 3 Migration (run if tables already exist from Phase 2)
-- ============================================================
-- ALTER TABLE expenses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
-- CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON expenses(deleted_at);
