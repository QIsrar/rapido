-- ============================================================
-- Rapido by QI Tyrix — Database Schema
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard)
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_expenses_project_id ON expenses(project_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_expenses_date ON expenses(date);

-- ============================================================
-- STORAGE BUCKET (run via Supabase Dashboard → Storage → New Bucket)
-- Or uncomment below if running via SQL:
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('receipts', 'receipts', true);
