'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatPKR } from '@/lib/utils';
import {
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  MousePointerClick,
} from 'lucide-react';

interface ProjectBudgetItem {
  id?: string;
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center text-xs font-bold text-slate-400">
        No active projects with budgets to display.
      </div>
    );
  }

  // Active item: hover takes priority, otherwise locked selection
  const activeIndex = hoveredIndex !== null ? hoveredIndex : selectedIndex;
  const activeItem = activeIndex !== null ? data[activeIndex] : null;

  // Calculate highest value for Y-axis scale
  const maxVal = Math.max(
    ...data.flatMap((d) => [Number(d.budget), Number(d.spent)]),
    100000
  );

  const formatShortNum = (val: number) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${Math.round(val / 1000)}k`;
    return `${val}`;
  };

  return (
    <div className="space-y-4 select-none">
      {/* Side-by-Side Grouped Vertical Bar Chart */}
      <div className="w-full overflow-x-auto pb-1">
        <div className="relative min-w-[340px] w-full h-64 pt-6 pb-8 px-2 flex items-end justify-around gap-3 sm:gap-6">
          {/* Background Grid Lines with High-Contrast Deep Black PKR Scale */}
          <div className="absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none">
            {[1, 0.75, 0.5, 0.25, 0].map((frac) => (
              <div key={frac} className="w-full border-b border-dashed border-slate-300 relative">
                <span className="absolute -top-3.5 left-0 text-[10px] font-black text-black bg-white/95 px-1 py-0.2 rounded border border-slate-200 shadow-2xs">
                  {formatShortNum(Math.round(maxVal * frac))}
                </span>
              </div>
            ))}
          </div>

          {/* Project Bar Columns */}
          {data.map((item, index) => {
            const budgetH = Math.max((item.budget / maxVal) * 100, 8);
            const spentH = Math.max((item.spent / maxVal) * 100, item.spent > 0 ? 8 : 4);
            const isOver = item.spent > item.budget;
            const isHovered = hoveredIndex === index;
            const isSelected = selectedIndex === index;
            const isActive = isHovered || isSelected;

            return (
              <div
                key={item.fullName + index}
                className={`flex-1 max-w-[120px] flex flex-col items-center justify-end h-full relative rounded-xl p-1 transition-colors duration-150 ${
                  isActive ? 'bg-orange-50/90' : 'hover:bg-slate-50'
                }`}
              >
                {/* 
                  Isolated Full-Height Overlay Hitbox:
                  Captures 100% of pointer events so the mouse NEVER interacts with changing bars, 
                  labels, borders or child nodes. Completely eliminates hover flicker loops.
                */}
                <div
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
                  className="absolute inset-0 z-30 cursor-pointer"
                  title={`Click to inspect ${item.fullName}`}
                />

                {/* Bars Container — pointer-events-none ensures zero interference */}
                <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2.5 h-48 z-10 pointer-events-none">
                  {/* Budget Bar */}
                  <div className="flex flex-col items-center justify-end h-full w-6 sm:w-8">
                    <span className="text-[9px] font-black text-slate-800 mb-1 leading-none">
                      {formatShortNum(item.budget)}
                    </span>
                    <div
                      className={`w-full rounded-t-lg transition-colors duration-150 border ${
                        isActive
                          ? 'bg-slate-700 border-slate-900 shadow-md'
                          : 'bg-slate-300 border-slate-400'
                      }`}
                      style={{ height: `${budgetH}%` }}
                    />
                  </div>

                  {/* Actual Spend Bar */}
                  <div className="flex flex-col items-center justify-end h-full w-6 sm:w-8">
                    <span
                      className={`text-[9px] font-black mb-1 leading-none ${
                        isOver ? 'text-red-700 font-extrabold' : 'text-orange-700 font-extrabold'
                      }`}
                    >
                      {item.spent > 0 ? formatShortNum(item.spent) : '0'}
                    </span>
                    <div
                      className={`w-full rounded-t-lg transition-colors duration-150 border ${
                        item.spent === 0
                          ? 'bg-slate-200 border-slate-300'
                          : isOver
                          ? isActive
                            ? 'bg-gradient-to-t from-red-600 to-rose-500 shadow-md border-red-600'
                            : 'bg-gradient-to-t from-red-500 to-rose-400 border-red-500'
                          : isActive
                          ? 'bg-gradient-to-t from-orange-600 to-amber-500 shadow-md border-orange-600'
                          : 'bg-gradient-to-t from-orange-500 to-amber-400 border-orange-500'
                      }`}
                      style={{ height: `${spentH}%` }}
                    />
                  </div>
                </div>

                {/* Project Name Label — pointer-events-none */}
                <div className="mt-2 text-center w-full px-1 z-10 pointer-events-none">
                  <p
                    className={`text-[11px] font-black truncate transition-colors ${
                      isActive ? 'text-orange-600' : 'text-slate-900'
                    }`}
                  >
                    {item.name}
                  </p>
                  <span
                    className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded mt-0.5 ${
                      isOver
                        ? 'bg-red-100 text-red-700 font-extrabold'
                        : 'bg-slate-200 text-slate-800 font-bold'
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
      <div className="flex items-center justify-center gap-4 sm:gap-6 pt-2 pb-1 border-t border-slate-200 text-xs font-bold text-slate-700">
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

      {/* 
        Fixed-Height Stable Insight Card:
        Exact same 144px height for both active and default states.
        Guarantees zero layout shift, zero vertical push, and zero scroll bounce.
      */}
      <div className="h-36 w-full">
        {activeItem ? (
          <div className="h-full p-4 rounded-2xl bg-slate-900 text-white shadow-xl border-2 border-slate-700 flex flex-col justify-between animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-black text-white truncate">
                    {activeItem.fullName}
                  </p>
                  {activeItem.spent > activeItem.budget ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 shrink-0">
                      <AlertCircle className="w-3 h-3" />
                      Over Budget
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Within Budget
                    </span>
                  )}
                </div>
              </div>

              {activeItem.id && (
                <Link
                  href={`/projects/${activeItem.id}`}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-black shadow-md transition-all tap-scale shrink-0 cursor-pointer"
                >
                  <span>Show Details</span>
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                  Budget
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-200">
                  {formatPKR(activeItem.budget)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                  Spent
                </span>
                <span
                  className={`text-xs sm:text-sm font-black ${
                    activeItem.spent > activeItem.budget ? 'text-red-400' : 'text-orange-400'
                  }`}
                >
                  {formatPKR(activeItem.spent)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                  {activeItem.spent > activeItem.budget ? 'Over Limit' : 'Remaining'}
                </span>
                <span
                  className={`text-xs sm:text-sm font-black ${
                    activeItem.spent > activeItem.budget ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {formatPKR(Math.abs(activeItem.budget - activeItem.spent))}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full p-4 rounded-2xl bg-slate-100 border-2 border-slate-200 text-center text-xs font-bold text-slate-600 flex flex-col items-center justify-center gap-1.5">
            <div className="flex items-center gap-1.5 text-slate-900 font-black text-sm">
              <MousePointerClick className="w-4 h-4 text-orange-600" />
              <span>Interactive Chart Inspector</span>
            </div>
            <p className="text-slate-500 max-w-sm font-medium leading-relaxed">
              Hover or click on any project column to lock its financial status and view project details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
