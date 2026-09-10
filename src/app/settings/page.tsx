import { Card } from '@/components/ui/card';
import {
  Smartphone,
  Database,
  Info,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Coins,
  CheckCircle2,
  Server,
} from 'lucide-react';
import { getSupabaseConfigStatus } from '@/lib/supabase';
import { testDatabaseConnection } from '@/lib/actions';
import { CopySchemaButton } from '@/components/copy-schema-button';

export const dynamic = 'force-dynamic';

const IDEMPOTENT_SQL = `-- ============================================================
-- Rapido by QI Tyrix — Database Schema (Idempotent & Safe)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM TYPES (Safe to re-run without ERROR 42710)
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

-- PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type project_type NOT NULL,
  total_budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status project_status NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- EXPENSES TABLE
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

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON expenses(deleted_at);

-- ROW LEVEL SECURITY
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
END $$;`;

export default async function SettingsPage() {
  const config = getSupabaseConfigStatus();
  const dbStatus = await testDatabaseConnection();

  return (
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <header className="pt-4 pb-5 animate-fade-in">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Live cloud diagnostics, schema setup &amp; app preferences
        </p>
      </header>

      <div className="space-y-4 mb-8">
        {/* Live Supabase Connection Diagnostic Card */}
        <Card className="p-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                dbStatus.connected
                  ? 'bg-emerald-50 border-emerald-200/60 text-emerald-600'
                  : 'bg-amber-50 border-amber-200/60 text-amber-600'
              }`}
            >
              <Database className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-bold text-slate-900">Database Connection</p>
                {dbStatus.connected ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <ShieldCheck className="h-3 w-3" />
                    Live &amp; Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    <AlertTriangle className="h-3 w-3" />
                    Configuration Pending
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {dbStatus.connected
                  ? `Successfully connected to PostgreSQL project (${config.projectRef}). Found ${
                      dbStatus.projectCount ?? 0
                    } projects in cloud storage.`
                  : dbStatus.error ||
                    'Supabase environment variables are missing or could not be reached.'}
              </p>

              {/* Diagnostic checks */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600">
                  {config.hasUrl ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  )}
                  <span>
                    URL: <strong className="font-mono text-[10px]">{config.urlSource}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  {config.hasKey ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  )}
                  <span>
                    Key: <strong className="font-mono text-[10px]">{config.keySource}</strong>
                  </span>
                </div>
              </div>

              {!dbStatus.connected && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-900 leading-normal">
                  <strong>How to fix on Vercel:</strong>
                  <ol className="list-decimal ml-4 mt-1 space-y-1">
                    <li>Go to Vercel Project &rarr; <strong>Settings</strong> &rarr; <strong>Environment Variables</strong>.</li>
                    <li>Ensure <code className="font-mono bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="font-mono bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (or <code className="font-mono bg-amber-100 px-1 rounded">SUPABASE_URL</code> &amp; <code className="font-mono bg-amber-100 px-1 rounded">SUPABASE_ANON_KEY</code>) are added.</li>
                    <li>Go to <strong>Deployments</strong> &rarr; click <strong>...</strong> on latest deploy &rarr; click <strong>Redeploy</strong>.</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Database Schema Setup (1-Click Copy) */}
        <Card className="p-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/60 flex items-center justify-center shrink-0">
              <ExternalLink className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">Database Schema (schema.sql)</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Safe, idempotent SQL script for creating tables, enums, soft-delete columns, and RLS policies in Supabase.
              </p>
              <div className="mt-3">
                <CopySchemaButton sqlContent={IDEMPOTENT_SQL} />
              </div>
            </div>
          </div>
        </Card>

        {/* Currency & Localization Settings */}
        <Card className="p-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shrink-0">
              <Coins className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">Currency &amp; Localization</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Pakistani Rupee (PKR · ₨ / Rs.) with Pakistani number formatting (Lakhs &amp; Crores).
              </p>
            </div>
          </div>
        </Card>

        {/* PWA Home screen installation */}
        <Card className="p-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">Mobile Home Screen App</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Tap share/options in Safari or Chrome &rarr; &quot;Add to Home Screen&quot; for a full standalone PWA experience.
              </p>
            </div>
          </div>
        </Card>

        {/* Version & Credits */}
        <Card className="p-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0">
              <Server className="h-5 w-5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">Rapido by QI Tyrix</p>
              <p className="text-xs text-slate-500 mt-0.5">
                v0.4.0 Production · Construction Job-Costing &amp; Field Expense Tracker
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
