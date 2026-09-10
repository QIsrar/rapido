import { Card } from '@/components/ui/card';
import { getReportsData } from '@/lib/actions';
import { formatPKR } from '@/lib/utils';
import {
  Briefcase,
  TrendingUp,
  Award,
} from 'lucide-react';
import { BudgetVsActualChart } from '@/components/budget-vs-actual-chart';
import { MonthlySpendingChart } from '@/components/monthly-spending-chart';

export const dynamic = 'force-dynamic';

// Category colors for the horizontal bar chart
const CATEGORY_COLORS: Record<string, string> = {
  Materials: '#3B82F6',
  Labor: '#F59E0B',
  'Equipment Rental': '#8B5CF6',
  Plumbing: '#06B6D4',
  Electricity: '#EAB308',
  Permits: '#10B981',
  'Transport/Fuel': '#F97316',
  Misc: '#64748B',
};

export default async function ReportsPage() {
  const data = await getReportsData();
  const { categoryTotals, monthlyTrend, budgetVsActual, quickStats } = data;

  const maxCategoryTotal = Math.max(...categoryTotals.map((c) => c.total), 1);

  return (
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <header className="pt-4 pb-5 animate-fade-in">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Analytics &amp; spending insights across all projects
        </p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2.5 mb-6 animate-slide-up">
        <Card className="p-3.5 stat-gradient-orange border border-orange-200/50 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Briefcase className="h-3.5 w-3.5 text-orange-600" />
            </div>
            <span className="text-[10px] text-orange-700/70 uppercase tracking-wider font-bold">
              Projects
            </span>
          </div>
          <p className="text-xl font-extrabold text-slate-900">
            {quickStats.totalProjects}
          </p>
        </Card>

        <Card className="p-3.5 stat-gradient-emerald border border-emerald-200/50 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <span className="text-xs font-black text-emerald-600 leading-none">₨</span>
            </div>
            <span className="text-[10px] text-emerald-700/70 uppercase tracking-wider font-bold">
              Total Spend
            </span>
          </div>
          <p className="text-sm font-extrabold text-slate-900 truncate">
            {formatPKR(quickStats.totalLifetimeSpend)}
          </p>
        </Card>

        <Card className="p-3.5 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              Avg / Project
            </span>
          </div>
          <p className="text-sm font-extrabold text-slate-900 truncate">
            {formatPKR(quickStats.avgProjectCost)}
          </p>
        </Card>

        <Card className="p-3.5 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Award className="h-3.5 w-3.5 text-violet-600" />
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              Top Category
            </span>
          </div>
          <p className="text-sm font-extrabold text-slate-900 truncate">
            {quickStats.topCategory}
          </p>
        </Card>
      </div>

      {/* Spending by Category — Horizontal Bar Chart */}
      {categoryTotals.length > 0 && (
        <section className="mb-6 animate-slide-up" style={{ animationDelay: '80ms' }}>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Spending by Category
          </h2>
          <Card className="p-4 bg-white border border-slate-200 shadow-xs">
            <div className="space-y-3">
              {categoryTotals.map((cat) => {
                const pct = (cat.total / maxCategoryTotal) * 100;
                const color = CATEGORY_COLORS[cat.category] || '#64748B';
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700">
                        {cat.category}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {formatPKR(cat.total)}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      )}

      {/* Budget vs Actual — Interactive Responsive Component */}
      {budgetVsActual.length > 0 && (
        <section className="mb-6 animate-slide-up" style={{ animationDelay: '160ms' }}>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Budget vs Actual
          </h2>
          <Card className="p-4 bg-white border border-slate-200 shadow-xs">
            <BudgetVsActualChart data={budgetVsActual} />
          </Card>
        </section>
      )}

      {/* Monthly Spending Trend — Interactive Responsive Component */}
      {monthlyTrend.length > 0 && (
        <section className="mb-6 animate-slide-up" style={{ animationDelay: '240ms' }}>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Monthly Spending (Last 6 Months)
          </h2>
          <Card className="p-4 bg-white border border-slate-200 shadow-xs">
            <MonthlySpendingChart data={monthlyTrend} />
          </Card>
        </section>
      )}

      {/* Empty state */}
      {categoryTotals.length === 0 && (
        <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-white mt-4 animate-fade-in">
          <TrendingUp className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">No data yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Create projects and log expenses to see analytics and spending insights here.
          </p>
        </div>
      )}
    </div>
  );
}
