import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, CheckCircle2, Receipt, MapPin, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CompleteProjectButton } from '@/components/complete-project-button';
import { DeleteProjectButton } from '@/components/delete-project-button';
import { ProjectReportButton } from '@/components/project-report-button';
import { AddExpenseDialog } from '@/components/add-expense-dialog';
import { ProjectDetailsTabs } from '@/components/project-details-tabs';
import { getProjectById, getLaborLogs } from '@/lib/actions';
import { formatPKR } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const categoryAccentMap: Record<string, string> = {
  Materials: 'accent-left-blue',
  Labor: 'accent-left-amber',
  'Equipment Rental': 'accent-left-violet',
  Plumbing: 'accent-left-cyan',
  Electricity: 'accent-left-yellow',
  Permits: 'accent-left-emerald',
  'Transport/Fuel': 'accent-left-orange',
  Misc: 'accent-left-slate',
};

export default async function ProjectDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ highlight?: string }>;
}) {
  const { id } = await params;
  const sParams = searchParams ? await searchParams : {};
  const highlightExpenseId = sParams?.highlight || null;

  const [project, laborLogs] = await Promise.all([
    getProjectById(id),
    getLaborLogs(id),
  ]);

  if (!project) {
    redirect('/');
  }

  const percentage = Math.min(
    project.total_budget > 0 ? (project.total_spent / project.total_budget) * 100 : 0,
    100
  );
  const remaining = project.total_budget - project.total_spent;
  const isOverBudget = remaining < 0;
  const isWarning = percentage >= 80 && !isOverBudget;
  const isCompleted = project.status === 'completed';

  const typeColorMap: Record<string, string> = {
    'New Build': 'bg-blue-50 text-blue-700 border-blue-200',
    Renovation: 'bg-purple-50 text-purple-700 border-purple-200',
    Maintenance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  // Group expenses by date descending
  const sortedExpenses = [...project.expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Category breakdown
  const categoryBreakdown = project.expenses.reduce<Record<string, number>>(
    (acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
      return acc;
    },
    {}
  );
  const topCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const startDateFormatted = new Date(project.start_date || project.created_at).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const completedDateFormatted = project.completed_at
    ? new Date(project.completed_at).toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-40">
      {/* Top navigation */}
      <div className="pt-2 pb-3 flex items-center justify-between animate-fade-in">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs transition-colors min-h-[36px] tap-scale"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        <div className="flex items-center gap-2">
          <ProjectReportButton project={project} laborLogs={laborLogs} />
          <DeleteProjectButton
            projectId={project.id}
            projectName={project.name}
            expensesCount={project.expenses.length}
          />
          {!isCompleted ? (
            <CompleteProjectButton
              projectId={project.id}
              projectName={project.name}
            />
          ) : (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1 text-xs px-2.5 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Completed
            </Badge>
          )}
        </div>
      </div>

      {/* Project Header */}
      <header className="pt-1 pb-4 animate-slide-up">
        <div className="flex items-start gap-2">
          <h1 className="text-xl font-black text-slate-900 flex-1 tracking-tight">
            {project.name}
          </h1>
          <Badge
            variant="outline"
            className={`text-[10px] px-2 py-0.5 font-bold shrink-0 ${
              typeColorMap[project.type] || 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            {project.type}
          </Badge>
        </div>

        {/* Timestamps & Location */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Started: <strong className="font-semibold text-slate-700">{startDateFormatted}</strong></span>
          </div>

          {completedDateFormatted && (
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Finished: <strong className="font-semibold text-emerald-800">{completedDateFormatted}</strong></span>
            </div>
          )}

          {project.location && (
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <MapPin className="h-3.5 w-3.5 text-orange-600" />
              {project.location.startsWith('http') || project.location.includes('maps.google') ? (
                <a
                  href={project.location}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 font-bold underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Google Maps Link</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span>Location: <strong className="font-bold text-slate-800">{project.location}</strong></span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Budget Overview Card */}
      <Card className="p-4 sm:p-5 bg-white border border-slate-200 shadow-elevated mb-5 animate-slide-up" style={{ animationDelay: '60ms' }}>
        {/* 3 Explicit Financial Metric Boxes */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-4 text-center">
          <div className="px-1.5 py-2.5 sm:p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Total Budget
            </span>
            <span className="text-[11px] sm:text-sm font-black text-slate-900 block mt-1 tracking-tight">
              {formatPKR(project.total_budget)}
            </span>
          </div>

          <div className="px-1.5 py-2.5 sm:p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">
              Total Spent
            </span>
            <span className="text-[11px] sm:text-sm font-black text-amber-950 block mt-1 tracking-tight">
              {formatPKR(project.total_spent)}
            </span>
          </div>

          <div
            className={`px-1.5 py-2.5 sm:p-3 rounded-2xl border ${
              isOverBudget
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
            }`}
          >
            <span
              className={`text-[10px] font-black uppercase tracking-wider block ${
                isOverBudget ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {isOverBudget ? 'Over Limit' : 'Remaining'}
            </span>
            <span className="text-[11px] sm:text-sm font-black block mt-1 tracking-tight">
              {formatPKR(Math.abs(remaining))}
            </span>
          </div>
        </div>

        <Progress
          value={project.total_spent > 0 ? Math.max(percentage, 2) : 0}
          className={`h-3 rounded-full bg-slate-100 mb-2 animate-progress-fill ${
            isOverBudget
              ? '[&>div]:bg-red-500'
              : isWarning
              ? '[&>div]:bg-amber-500'
              : '[&>div]:bg-gradient-to-r [&>div]:from-orange-400 [&>div]:to-orange-600'
          }`}
        />

        <div className="flex justify-between items-center text-xs text-slate-500 pt-1 font-semibold">
          <span>
            {project.total_spent <= 0
              ? '0% of budget utilized'
              : percentage < 0.1
              ? '<0.1% of budget utilized'
              : `${percentage.toFixed(1)}% of budget utilized`}
          </span>
          <span className={isOverBudget ? 'text-red-600 font-bold' : isWarning ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
            {isOverBudget ? `Over limit by ${formatPKR(Math.abs(remaining))}` : `${formatPKR(remaining)} available`}
          </span>
        </div>
      </Card>

      {/* Interactive Tabs: Expenses & Labor Log (Hazri) */}
      <ProjectDetailsTabs
        project={project}
        sortedExpenses={sortedExpenses}
        topCategories={topCategories}
        categoryAccentMap={categoryAccentMap}
        isCompleted={isCompleted}
        laborLogs={laborLogs}
        highlightExpenseId={highlightExpenseId}
      />

      {/* Floating Action Button only for active projects */}
      {!isCompleted ? (
        <AddExpenseDialog
          projects={[project]}
          defaultProjectId={project.id}
        />
      ) : (
        <div className="fixed bottom-20 inset-x-4 max-w-md mx-auto z-30 animate-slide-up">
          <div className="p-3.5 rounded-2xl bg-slate-950/90 backdrop-blur-md text-white border-2 border-emerald-500/40 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white">Project Completed &amp; Sealed</p>
                <p className="text-[11px] text-slate-400 truncate">Financial records are locked against new expenses</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider shrink-0 border border-emerald-500/30">
              Audited
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
