import Image from 'next/image';
import { Briefcase, TrendingUp, AlertTriangle, Database } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ProjectCard } from '@/components/project-card';
import { AddExpenseDialog } from '@/components/add-expense-dialog';
import { AddProjectDialog } from '@/components/add-project-dialog';
import { DashboardBanner } from '@/components/dashboard-banner';
import { SeedButton } from '@/components/seed-button';
import { getProjects } from '@/lib/actions';
import { formatPKR } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { projects: allProjects, isLive } = await getProjects();
  const activeProjects = allProjects.filter((p) => p.status === 'active');
  const completedProjects = allProjects.filter((p) => p.status === 'completed');

  // Today's date in YYYY-MM-DD
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Calculate today's spend across all projects
  const allExpenses = allProjects.flatMap((p) => p.expenses);
  const totalSpentToday = allExpenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const overBudgetCount = allProjects.filter(
    (p) => p.total_budget > 0 && p.total_spent > p.total_budget
  ).length;

  const greeting =
    now.getHours() < 12
      ? 'Good Morning'
      : now.getHours() < 17
      ? 'Good Afternoon'
      : 'Good Evening';

  const dateStr = now.toLocaleDateString('en-PK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      {/* Header */}
      <header className="pt-4 pb-4 flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-orange-500 shadow-md shadow-orange-500/15 shrink-0 bg-white p-0.5">
            <Image
              src="/logo.png"
              alt="Rapido Construction Logo"
              width={48}
              height={48}
              className="w-full h-full object-contain rounded-xl"
              priority
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {dateStr}
            </p>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {greeting} 👷
            </h1>
            <p className="text-xs text-slate-500">
              Rapido by <a href="https://qi-tyrix.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-orange-600 font-bold hover:underline">QI Tyrix</a>
            </p>
          </div>
        </div>

        {/* Quick Add Project Button */}
        <div className="flex items-center gap-2 shrink-0">
          {allProjects.length === 0 && <SeedButton />}
          <AddProjectDialog buttonVariant="primary" />
        </div>
      </header>

      {/* Deleted Project Notification Banner */}
      <DashboardBanner />

      {/* Database Connection Notice if SQL not yet run in Supabase */}
      {!isLive && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5 animate-slide-up">
          <Database className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">Supabase setup pending:</span> Run the SQL in <code className="px-1 py-0.5 bg-amber-100/80 rounded font-mono text-[11px]">schema.sql</code> in your Supabase SQL Editor to enable live cloud database storage.
          </div>
        </div>
      )}

      {/* Stats row — gradient backgrounds */}
      <div className="grid grid-cols-3 gap-2.5 mb-6 animate-slide-up" style={{ animationDelay: '80ms' }}>
        <Card className="p-3 stat-gradient-orange border border-orange-200/50 shadow-xs">
          <div className="flex items-center gap-1.5 mb-1">
            <Briefcase className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-[10px] text-orange-700/70 uppercase tracking-wider font-bold">
              Active
            </span>
          </div>
          <p className="text-xl font-extrabold text-slate-900">
            {activeProjects.length}
          </p>
        </Card>

        <Card className="p-3 stat-gradient-emerald border border-emerald-200/50 shadow-xs">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-[10px] text-emerald-700/70 uppercase tracking-wider font-bold">
              Today
            </span>
          </div>
          <p className="text-sm font-extrabold text-slate-900 truncate">
            {formatPKR(totalSpentToday)}
          </p>
        </Card>

        <Card className={`p-3 border shadow-xs ${
          overBudgetCount > 0
            ? 'stat-gradient-red border-red-200/50 animate-pulse-glow'
            : 'stat-gradient-emerald border-emerald-200/50'
        }`}>
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle
              className={`h-3.5 w-3.5 ${
                overBudgetCount > 0 ? 'text-red-500' : 'text-emerald-500'
              }`}
            />
            <span className={`text-[10px] uppercase tracking-wider font-bold ${
              overBudgetCount > 0 ? 'text-red-700/70' : 'text-emerald-700/70'
            }`}>
              Alerts
            </span>
          </div>
          <p className={`text-xl font-extrabold ${overBudgetCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {overBudgetCount}
          </p>
        </Card>
      </div>

      {/* Active Projects */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Active Projects
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
              {activeProjects.length}
            </span>
          </div>
          <AddProjectDialog buttonVariant="outline" />
        </div>

        {activeProjects.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-white animate-fade-in">
            <Briefcase className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No active projects</p>
            <p className="text-xs text-slate-500 mt-1 mb-4 max-w-xs mx-auto">
              Your live Supabase database is connected! Create a project now or load sample Abbottabad projects.
            </p>
            <div className="flex items-center justify-center gap-2">
              <SeedButton />
              <AddProjectDialog buttonVariant="primary" />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {activeProjects.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Completed Projects */}
      {completedProjects.length > 0 && (
        <section className="mt-8 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              Completed Projects
            </h2>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-500">
              {completedProjects.length}
            </span>
          </div>
          <div className="space-y-3 opacity-70">
            {completedProjects.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Floating Action Button for Logging Expense */}
      <AddExpenseDialog projects={activeProjects} />
    </div>
  );
}
