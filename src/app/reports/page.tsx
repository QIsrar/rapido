import { Card } from '@/components/ui/card';
import { getReportsData } from '@/lib/actions';
import { formatPKR } from '@/lib/utils';
import {
  Briefcase,
  DollarSign,
  TrendingUp,
  Award,
} from 'lucide-react';

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
  const maxMonthlyTotal = Math.max(...monthlyTrend.map((m) => m.total), 1);
  const maxBudgetOrSpent = Math.max(
    ...budgetVsActual.flatMap((b) => [b.budget, b.spent]),
    1
  );

  const monthLabels = monthlyTrend.map((m) => {
    const [y, mo] = m.month.split('-');
    const d = new Date(Number(y), Number(mo) - 1);
    return d.toLocaleDateString('en-PK', { month: 'short' });
  });

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
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
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

      {/* Budget vs Actual — Grouped Bar Chart (SVG) */}
      {budgetVsActual.length > 0 && (
        <section className="mb-6 animate-slide-up" style={{ animationDelay: '160ms' }}>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Budget vs Actual
          </h2>
          <Card className="p-4 bg-white border border-slate-200 shadow-xs overflow-x-auto">
            <svg
              viewBox={`0 0 ${Math.max(budgetVsActual.length * 100, 300)} 200`}
              className="w-full h-48"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
                <line
                  key={frac}
                  x1="0"
                  y1={180 - frac * 160}
                  x2={budgetVsActual.length * 100}
                  y2={180 - frac * 160}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray={frac === 0 ? '0' : '4,4'}
                />
              ))}

              {budgetVsActual.map((item, i) => {
                const x = i * 100 + 15;
                const budgetH = (item.budget / maxBudgetOrSpent) * 160;
                const spentH = (item.spent / maxBudgetOrSpent) * 160;
                const isOver = item.spent > item.budget;

                return (
                  <g key={item.name}>
                    {/* Budget bar */}
                    <rect
                      x={x}
                      y={180 - budgetH}
                      width="30"
                      height={budgetH}
                      rx="4"
                      fill="#E2E8F0"
                    />
                    {/* Actual bar */}
                    <rect
                      x={x + 35}
                      y={180 - spentH}
                      width="30"
                      height={spentH}
                      rx="4"
                      fill={isOver ? '#EF4444' : '#F97316'}
                    />
                    {/* Label */}
                    <text
                      x={x + 32}
                      y="196"
                      textAnchor="middle"
                      className="fill-slate-500"
                      fontSize="9"
                      fontWeight="600"
                    >
                      {item.name.length > 12 ? item.name.substring(0, 12) + '…' : item.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-slate-200" />
                <span className="text-[10px] font-semibold text-slate-500">Budget</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-orange-500" />
                <span className="text-[10px] font-semibold text-slate-500">Actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-red-500" />
                <span className="text-[10px] font-semibold text-slate-500">Over Budget</span>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Monthly Spending Trend — Area Chart (SVG) */}
      {monthlyTrend.length > 0 && (
        <section className="mb-6 animate-slide-up" style={{ animationDelay: '240ms' }}>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Monthly Spending (Last 6 Months)
          </h2>
          <Card className="p-4 bg-white border border-slate-200 shadow-xs">
            <svg viewBox="0 0 320 180" className="w-full h-44" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F97316" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#F97316" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
                <line
                  key={frac}
                  x1="30"
                  y1={150 - frac * 130}
                  x2="310"
                  y2={150 - frac * 130}
                  stroke="#E2E8F0"
                  strokeWidth="0.5"
                  strokeDasharray="4,4"
                />
              ))}

              {/* Y-axis labels */}
              {[0, 0.5, 1].map((frac) => (
                <text
                  key={frac}
                  x="26"
                  y={154 - frac * 130}
                  textAnchor="end"
                  className="fill-slate-400"
                  fontSize="8"
                >
                  {formatPKR(Math.round(maxMonthlyTotal * frac)).replace('Rs. ', '')}
                </text>
              ))}

              {(() => {
                const points = monthlyTrend.map((m, i) => {
                  const x = 45 + i * ((310 - 45) / Math.max(monthlyTrend.length - 1, 1));
                  const y = 150 - (m.total / maxMonthlyTotal) * 130;
                  return { x, y, total: m.total };
                });

                // Build area path
                const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
                const areaPath = `${linePath} L${points[points.length - 1].x},150 L${points[0].x},150 Z`;

                return (
                  <>
                    {/* Area fill */}
                    <path d={areaPath} fill="url(#areaGrad)" />
                    {/* Line */}
                    <path d={linePath} fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Data points */}
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4" fill="#F97316" stroke="white" strokeWidth="2" />
                        {p.total > 0 && (
                          <text
                            x={p.x}
                            y={p.y - 10}
                            textAnchor="middle"
                            className="fill-slate-700"
                            fontSize="8"
                            fontWeight="700"
                          >
                            {(p.total / 1000).toFixed(0)}K
                          </text>
                        )}
                      </g>
                    ))}
                  </>
                );
              })()}

              {/* X-axis labels */}
              {monthLabels.map((label, i) => {
                const x = 45 + i * ((310 - 45) / Math.max(monthLabels.length - 1, 1));
                return (
                  <text
                    key={i}
                    x={x}
                    y="168"
                    textAnchor="middle"
                    className="fill-slate-500"
                    fontSize="9"
                    fontWeight="600"
                  >
                    {label}
                  </text>
                );
              })}
            </svg>
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
