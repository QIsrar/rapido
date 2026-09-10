import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, CheckCircle2, Receipt } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExpenseRow } from '@/components/expense-row';
import { CompleteProjectButton } from '@/components/complete-project-button';
import { AddExpenseDialog } from '@/components/add-expense-dialog';
import { getProjectById } from '@/lib/actions';
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    notFound();
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
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      {/* Top navigation */}
      <div className="pt-2 pb-3 flex items-center justify-between animate-fade-in">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs transition-colors min-h-[36px] tap-scale"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

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

        {/* Timestamps */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
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
        </div>
      </header>

      {/* Budget Overview Card */}
      <Card className="p-5 bg-white border border-slate-200 shadow-elevated mb-5 animate-slide-up" style={{ animationDelay: '60ms' }}>
        <div className="text-center mb-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-1">
            {isOverBudget ? 'Over Budget By' : 'Remaining Budget'}
          </p>
          <p
            className={`text-3xl font-black tracking-tight ${
              isOverBudget
                ? 'text-red-600'
                : isWarning
                ? 'text-amber-600'
                : 'text-emerald-600'
            }`}
          >
            {formatPKR(Math.abs(remaining))}
          </p>
        </div>

        <Progress
          value={percentage}
          className={`h-3 rounded-full bg-slate-100 mb-3.5 animate-progress-fill ${
            isOverBudget
              ? '[&>div]:bg-red-500'
              : isWarning
              ? '[&>div]:bg-amber-500'
              : '[&>div]:bg-gradient-to-r [&>div]:from-orange-400 [&>div]:to-orange-600'
          }`}
        />

        <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
          <div>
            <p className="text-slate-500 text-[11px]">Total Spent</p>
            <p className="font-bold text-slate-900 text-sm">
              {formatPKR(project.total_spent)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-[11px]">Total Budget</p>
            <p className="font-bold text-slate-900 text-sm">
              {formatPKR(project.total_budget)}
            </p>
          </div>
        </div>
      </Card>

      {/* Category Breakdown */}
      {topCategories.length > 0 && (
        <section className="mb-5 animate-slide-up" style={{ animationDelay: '120ms' }}>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            Spending by Category
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {topCategories.map(([cat, total], i) => (
              <Card
                key={cat}
                className={`p-3 bg-white border border-slate-200 shadow-2xs animate-slide-up ${
                  categoryAccentMap[cat] || 'accent-left-slate'
                }`}
                style={{ animationDelay: `${140 + i * 50}ms` }}
              >
                <p className="text-[11px] font-medium text-slate-500 truncate">
                  {cat}
                </p>
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  {formatPKR(total)}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Expenses list */}
      <section className="mb-6 animate-slide-up" style={{ animationDelay: '180ms' }}>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            All Expenses ({sortedExpenses.length})
          </h2>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Receipt className="h-3.5 w-3.5 text-slate-400" />
            <span>PKR</span>
          </div>
        </div>

        <Card className="bg-white border border-slate-200 shadow-xs divide-y-0 px-2">
          {sortedExpenses.length === 0 ? (
            <div className="py-10 text-center">
              <Receipt className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-500">
                No expenses logged for this project yet.
              </p>
            </div>
          ) : (
            sortedExpenses.map((expense, i) => (
              <div
                key={expense.id}
                className={i % 2 === 1 ? 'bg-slate-50/50 -mx-2 px-2 rounded-lg' : ''}
              >
                <ExpenseRow expense={expense} />
              </div>
            ))
          )}
        </Card>
      </section>

      {/* Floating Action Button pre-configured for this project */}
      <AddExpenseDialog
        projects={[project]}
        defaultProjectId={project.id}
      />
    </div>
  );
}
