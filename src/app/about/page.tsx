import Image from 'next/image';
import Link from 'next/link';
import {
  ExternalLink,
  ShieldCheck,
  Zap,
  Smartphone,
  CheckCircle2,
  HardHat,
  Receipt,
  Database,
  Code2,
  Heart,
  Globe,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { testDatabaseConnection } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const dbStatus = await testDatabaseConnection();

  return (
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28 animate-fade-in">
      {/* Header */}
      <header className="pt-4 pb-5 flex items-center gap-3.5">
        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-orange-500 shadow-md shadow-orange-500/15 shrink-0 bg-white p-0.5">
          <Image
            src="/logo.png"
            alt="Rapido Construction Logo"
            width={56}
            height={56}
            className="w-full h-full object-contain rounded-xl"
            priority
          />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3 text-orange-600" />
            Rapido v2.4
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
            About &amp; Developer
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Engineered by QI Tyrix for construction contractors
          </p>
        </div>
      </header>

      <div className="space-y-4">
        {/* Developer Spotlight Card */}
        <Card className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl border-2 border-orange-500/40 shadow-xl shadow-orange-500/10 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-orange-500/20 blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
                QI
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                  Lead Developer &amp; Architect
                </span>
                <h2 className="text-lg font-black text-white tracking-tight">
                  Qazi Israr
                </h2>
                <p className="text-xs text-slate-300 font-medium">
                  Founder, <strong className="text-white">QI Tyrix</strong>
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-3.5 leading-relaxed relative z-10">
            Passionate software engineer building lightning-fast, production-grade web applications and enterprise platforms. Engineered Rapido to eliminate the friction of construction accounting on real-world Pakistani job sites.
          </p>

          {/* External Link to QI Tyrix Portfolio */}
          <div className="mt-4 pt-4 border-t border-slate-800 relative z-10">
            <a
              href="https://qi-tyrix.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all tap-scale cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>Explore QI Tyrix Products &amp; Portfolio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </Card>

        {/* About Rapido Overview */}
        <Card className="p-5 bg-white border border-slate-200 shadow-xs rounded-3xl space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                What is Rapido?
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Built specifically for construction site realities
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            In Pakistani civil contracting, expenses are traditionally recorded in messy pocket notebooks or scattered across WhatsApp chats. Receipts fade or get lost in cement dust, leading to audit chaos and budget overruns.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Rapido</strong> transforms site tracking into a 3-tap action: enter the PKR amount, select the category, snap a photo of the receipt, and log it directly into secure cloud storage.
          </p>
        </Card>

        {/* Key Features Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <Card className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black text-slate-900">Live Limits &amp; Alerts</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Visual indicators at 85% threshold and automated red alerts on overrun.
            </p>
          </Card>

          <Card className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <Receipt className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black text-slate-900">Camera Receipts</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Instant camera capture uploaded directly to Supabase cloud storage.
            </p>
          </Card>

          <Card className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black text-slate-900">Job Archiving</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Sealed records upon project completion to protect audit trails.
            </p>
          </Card>

          <Card className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <Smartphone className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black text-slate-900">Installable PWA</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Installs directly to phone home screens like a native mobile app.
            </p>
          </Card>
        </div>

        {/* Technology & Cloud Infrastructure */}
        <Card className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-black text-slate-900">Technical Foundation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700">
                {dbStatus.connected ? 'PostgreSQL Live' : 'Database Standby'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Built with Next.js 15+ App Router, React Server Actions, Supabase PostgreSQL with Row-Level Security (RLS), and Tailwind CSS optimized for bright outdoor daylight contrast.
          </p>
        </Card>

        {/* Footer Credit */}
        <div className="pt-2 text-center text-xs text-slate-500 space-y-1">
          <p className="flex items-center justify-center gap-1 font-semibold">
            Crafted with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" /> by{' '}
            <a
              href="https://qi-tyrix.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:text-orange-700 font-black underline cursor-pointer inline-flex items-center gap-0.5"
            >
              QI Tyrix
              <ExternalLink className="w-3 h-3 inline" />
            </a>
          </p>
          <p className="text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} QI Tyrix. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
