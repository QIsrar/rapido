import { Card } from '@/components/ui/card';
import { Smartphone, Database, Info, ExternalLink, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <header className="pt-4 pb-5">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          App configuration & database status
        </p>
      </header>

      <div className="space-y-3 mb-8">
        {/* PWA Home screen installation */}
        <Card className="p-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">Mobile Home Screen App</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Tap share/options in Safari/Chrome &rarr; &quot;Add to Home Screen&quot;
              </p>
            </div>
          </div>
        </Card>

        {/* Supabase Database status */}
        <Card className="p-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center shrink-0">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-slate-900">Supabase Connected</p>
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5 break-all">
                URL: https://bcfshjykidmvajiuqkos.supabase.co
              </p>
            </div>
          </div>
        </Card>

        {/* SQL schema quick note */}
        <Card className="p-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/60 flex items-center justify-center shrink-0">
              <ExternalLink className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">Database Schema (schema.sql)</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Includes projects, expenses, categories, and automated timestamps.
              </p>
            </div>
          </div>
        </Card>

        {/* Version & Credits */}
        <Card className="p-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shrink-0">
              <Info className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">
                Rapido by QI Tyrix
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                v0.3.0 Phase 3 · Construction Job-Costing MVP
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
