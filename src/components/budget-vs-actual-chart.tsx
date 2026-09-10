'use client';

import { useState } from 'react';
import { formatPKR } from '@/lib/utils';
import { AlertCircle, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';

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
      <div className="py-12 text-center text-xs font-bold text-slate-400">
        No active projects with budgets to display.
      </div>
    );
  }

  // Calculate highest value for Y-axis scale
  const maxVal = Math.max(
    ...data.flatMap((d) => [Number(d.budget), Number(d.spent)]),
    100000
  );

  const activeItem = hoveredIndex !== null ? data[hoveredIndex] : null;

  const formatShortNum = (val: number) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${Math.round(val / 1000)}k`;
    return `${val}`;
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Interactive Insight Banner */}
      {activeItem ? (
        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl border-2 border-slate-700 animate-fade-in transition-all">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="text-sm font-black text-white truncate">
                {activeItem.fullName}
              </p>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Job-Cost Performance Breakdown
              </p>
            </div>
            {activeItem.spent > activeItem.budget ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
                Over Budget
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Within Budget
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-800">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                Planned Budget
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-200">
                {formatPKR(activeItem.budget)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                Actual Spent
              </span>
              <span
                className={`text-xs sm:text-sm font-extrabold ${
                  activeItem.spent > activeItem.budget ? 'text-red-400' : 'text-orange-400'
                }`}
              >
                {formatPKR(activeItem.spent)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                {activeItem.spent > activeItem.budget ? 'Over Budget' : 'Remaining'}
              </span>
              <span
                className={`text-xs sm:text-sm font-extrabold ${
                  activeItem.spent > activeItem.budget ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {formatPKR(Math.abs(activeItem.budget - activeItem.spent))}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-100 border-2 border-slate-200 text-center text-xs font-bold text-slate-600">
          💡 <span className="text-slate-900 font-black">Interactive Chart:</span> Tap or hover on any project column below to inspect detailed budget vs actual numbers.
        </div>
      )}

      {/* Side-by-Side Grouped Vertical Bar Chart */}
      <div className="w-full overflow-x-auto pb-2">
        <div
          className="relative min-w-[340px] w-full h-64 pt-6 pb-8 px-2 flex items-end justify-around gap-4 sm:gap-8"
        >
          {/* Background Grid Lines with PKR Scale */}
          <div className="absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none opacity-40">
            {[1, 0.75, 0.5, 0.25, 0].map((frac) => (
              <div key={frac} className="w-full border-b border-dashed border-slate-300 relative">
                <span className="absolute -top-3 left-0 text-[9px] font-black text-slate-400">
                  {formatShortNum(Math.round(maxVal * frac))}
                </span>
              </div>
            ))}
          </div>

          {/* Project Bar Groups */}
          {data.map((item, index) => {
            const budgetH = Math.max((item.budget / maxVal) * 100, 6);
            const spentH = Math.max((item.spent / maxVal) * 100, 6);
            const isOver = item.spent > item.budget;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={item.fullName + index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(index === hoveredIndex ? null : index)}
                className={`flex-1 max-w-[120px] flex flex-col items-center justify-end h-full z-10 cursor-pointer transition-all duration-200 ${
                  isHovered ? 'scale-105' : 'hover:opacity-90'
                }`}
              >
                {/* Side-by-Side Bars Container */}
                <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2.5 h-48">
                  {/* Budget Bar */}
                  <div className="flex flex-col items-center justify-end h-full w-6 sm:w-8">
                    <span className="text-[9px] font-black text-slate-600 mb-1 leading-none">
                      {formatShortNum(item.budget)}
                    </span>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 border border-slate-400/30 ${
                        isHovered
                          ? 'bg-slate-500 shadow-md ring-2 ring-slate-400/50'
                          : 'bg-slate-300'
                      }`}
                      style={{ height: `${budgetH}%` }}
                    />
                  </div>

                  {/* Actual Spend Bar */}
                  <div className="flex flex-col items-center justify-end h-full w-6 sm:w-8">
                    <span
                      className={`text-[9px] font-black mb-1 leading-none ${
                        isOver ? 'text-red-600' : 'text-orange-600'
                      }`}
                    >
                      {formatShortNum(item.spent)}
                    </span>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 border ${
                        isOver
                          ? isHovered
                            ? 'bg-gradient-to-t from-red-600 to-rose-500 shadow-lg ring-2 ring-red-400 border-red-500'
                            : 'bg-gradient-to-t from-red-500 to-rose-400 border-red-400 shadow-sm'
                          : isHovered
                          ? 'bg-gradient-to-t from-orange-600 to-amber-400 shadow-lg ring-2 ring-orange-400 border-orange-500'
                          : 'bg-gradient-to-t from-orange-500 to-amber-400 border-orange-400 shadow-sm'
                      }`}
                      style={{ height: `${spentH}%` }}
                    />
                  </div>
                </div>

                {/* Project Name Label */}
                <div className="mt-2 text-center w-full px-1">
                  <p
                    className={`text-[11px] font-black truncate transition-colors ${
                      isHovered ? 'text-orange-600' : 'text-slate-800'
                    }`}
                  >
                    {item.name}
                  </p>
                  <span
                    className={`inline-block text-[9px] font-black px-1.5 py-0.2 rounded mt-0.5 ${
                      isOver
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.budget > 0 ? `${Math.round((item.spent / item.budget) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 pt-3 border-t-2 border-slate-200 text-xs font-bold text-slate-600">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-slate-300 border border-slate-400" />
          <span>Planned Budget</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-orange-500 border border-orange-600" />
          <span>Actual Spent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-red-500 border border-red-600" />
          <span>Over Budget</span>
        </div>
      </div>
    </div>
  );
}
