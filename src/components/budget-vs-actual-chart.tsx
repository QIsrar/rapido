'use client';

import { useState } from 'react';
import { formatPKR } from '@/lib/utils';
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

interface ProjectBudgetItem {
  name: string;
  fullName: string;
  budget: number;
  spent: number;
}

interface BudgetVsActualChartProps {
  data: ProjectBudgetItem[];
}

export function BudgetVsActualChart({ data }: BudgetVsActualChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="py-10 text-center text-xs text-slate-400">
        No active projects with budgets to display.
      </div>
    );
  }

  const activeItem = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="space-y-4">
      {/* Active Hover / Tap Insight Card */}
      {activeItem ? (
        <div className="p-3 rounded-xl bg-slate-900 text-white shadow-lg animate-fade-in transition-all">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div>
              <p className="text-xs font-bold text-slate-200 truncate">
                {activeItem.fullName}
              </p>
              <p className="text-[11px] text-slate-400">Project Budget Performance</p>
            </div>
            {activeItem.spent > activeItem.budget ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                <AlertCircle className="w-3 h-3" />
                Over Budget
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                Within Budget
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Total Budget</span>
              <span className="font-bold text-slate-200">{formatPKR(activeItem.budget)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Actual Spent</span>
              <span
                className={`font-bold ${
                  activeItem.spent > activeItem.budget ? 'text-red-400' : 'text-orange-400'
                }`}
              >
                {formatPKR(activeItem.spent)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">
                {activeItem.spent > activeItem.budget ? 'Over Budget By' : 'Remaining'}
              </span>
              <span
                className={`font-bold ${
                  activeItem.spent > activeItem.budget ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {formatPKR(Math.abs(activeItem.budget - activeItem.spent))}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-center text-xs text-slate-500">
          <span className="font-semibold text-slate-700">💡 Interactive Chart:</span> Hover or tap on any project bar below to view full budget vs actual details.
        </div>
      )}

      {/* Responsive Bar Rows (clean, high visibility on all screen widths) */}
      <div className="space-y-3.5">
        {data.map((item, index) => {
          const maxVal = Math.max(item.budget, item.spent, 1);
          const budgetPct = (item.budget / maxVal) * 100;
          const spentPct = (item.spent / maxVal) * 100;
          const isOver = item.spent > item.budget;
          const usedPct = item.budget > 0 ? Math.round((item.spent / item.budget) * 100) : 0;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={item.fullName + index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => setHoveredIndex(index === hoveredIndex ? null : index)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isHovered
                  ? 'border-orange-500 bg-orange-50/40 shadow-sm ring-1 ring-orange-400/30'
                  : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              {/* Project Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0 flex-1 pr-2">
                  <span className="text-xs font-bold text-slate-800 block truncate">
                    {item.fullName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                      isOver
                        ? 'bg-red-100 text-red-700'
                        : usedPct > 85
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {usedPct}% used
                  </span>
                </div>
              </div>

              {/* Visual Bars Container */}
              <div className="space-y-1.5">
                {/* Budget Bar */}
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                      Budget
                    </span>
                    <span>{formatPKR(item.budget)}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-300 rounded-full transition-all duration-500"
                      style={{ width: `${budgetPct}%` }}
                    />
                  </div>
                </div>

                {/* Actual Spend Bar */}
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between text-[10px] font-medium">
                    <span
                      className={`flex items-center gap-1 ${
                        isOver ? 'text-red-600 font-bold' : 'text-orange-600 font-semibold'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full inline-block ${
                          isOver ? 'bg-red-500' : 'bg-orange-500'
                        }`}
                      />
                      Actual Spent
                    </span>
                    <span
                      className={`font-bold ${
                        isOver ? 'text-red-600' : 'text-slate-800'
                      }`}
                    >
                      {formatPKR(item.spent)}
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-xs'
                          : 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-xs'
                      }`}
                      style={{ width: `${spentPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-300" />
          <span>Planned Budget</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-orange-500" />
          <span>Actual Spent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Over Budget Warning</span>
        </div>
      </div>
    </div>
  );
}
