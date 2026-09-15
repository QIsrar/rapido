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
    const rounded = Math.round(val);
    if (rounded >= 10000000) return `${(rounded / 10000000).toFixed(1)}Cr`;
    if (rounded >= 100000) return `${(rounded / 100000).toFixed(1)}L`;
    if (rounded >= 1000) return `${Math.round(rounded / 1000)}k`;
    return `${rounded}`;
  };

  return (
    <div className="space-y-4 select-none">
      {/* Side-by-Side Grouped Vertical Bar Chart */}
      <div className="w-full flex items-stretch border-b border-slate-200 pb-1">
        {/* 
          Dedicated Left Y-Axis Scale Column:
          Isolated in its own fixed-width column so Y-axis labels NEVER overlap or collide with project bars!
        */}
        <div className="w-12 shrink-0 flex flex-col justify-between text-right pr-2 pt-6 pb-14 text-[10px] font-black text-slate-700 border-r border-slate-200 select-none">
          {[1, 0.75, 0.5, 0.25, 0].map((frac) => (
            <span key={frac} className="leading-none">
              {formatShortNum(Math.round(maxVal * frac))}
            </span>
          ))}
        </div>

        {/* Scrollable Project Columns & Grid Area */}
        <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none relative">
          <div className="relative min-w-max h-64 pt-6 pb-2 px-3 flex items-end gap-3 sm:gap-5">
            {/* Background Grid Lines across the plot area */}
            <div className="absolute inset-x-0 top-6 bottom-14 flex flex-col justify-between pointer-events-none">
              {[1, 0.75, 0.5, 0.25, 0].map((frac) => (
                <div key={frac} className="w-full border-b border-dashed border-slate-200" />
              ))}
            </div>

            {/* Project Bar Columns */}
            {data.map((item, index) => {
              const budgetH = Math.max((item.budget / maxVal) * 100, 3);
              const spentH = item.spent > 0 ? Math.max((item.spent / maxVal) * 100, 1.5) : 0;
              const isOver = item.spent > item.budget;
              const isHovered = hoveredIndex === index;
              const isSelected = selectedIndex === index;
              const isActive = isHovered || isSelected;

              return (
                <div
                  key={item.fullName + index}
                  className={`w-24 sm:w-28 shrink-0 flex flex-col items-center justify-end h-full relative rounded-xl p-1.5 transition-colors duration-150 ${
                    isActive ? 'bg-orange-50/90 ring-1 ring-orange-500/20' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* 
                    Hitbox overlay:
                    Captures 100% of pointer events so the mouse NEVER interacts with changing bars.
                  */}
                  <div
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
                    className="absolute inset-0 z-30 cursor-pointer"
                    title={`Click to inspect ${item.fullName}`}
                  />

                  {/* Bars Container */}
                  <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2.5 h-40 z-10 pointer-events-none">
                    {/* Budget Bar */}
                    <div className="flex flex-col items-center justify-end h-full w-7 sm:w-8">
                      <span className="text-[10px] font-black text-slate-800 mb-1 leading-none">
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
                    <div className="flex flex-col items-center justify-end h-full w-7 sm:w-8">
                      <span
                        className={`text-[10px] font-black mb-1 leading-none ${
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

                  {/* Mini Sub-Labels for the Bars */}
                  <div className="w-full flex items-center justify-around text-[8px] font-black text-slate-400 mt-1 pointer-events-none uppercase tracking-tighter">
                    <span>Budget</span>
                    <span>Spent</span>
                  </div>

                  {/* Project Name & Percentage Label */}
                  <div className="mt-1 text-center w-full px-0.5 z-10 pointer-events-none">
                    <p
                      className={`text-xs font-black truncate transition-colors ${
                        isActive ? 'text-orange-600' : 'text-slate-900'
                      }`}
                      title={item.fullName}
                    >
                      {item.name}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-black px-1.5 py-0.5 rounded mt-0.5 ${
                        isOver
                          ? 'bg-red-100 text-red-700 font-extrabold'
                          : 'bg-slate-200 text-slate-800 font-bold'
                      }`}
                    >
                      {item.budget > 0
                        ? item.spent <= 0
                          ? '0%'
                          : (item.spent / item.budget) * 100 < 1
                          ? `${((item.spent / item.budget) * 100).toFixed(1)}%`
                          : `${Math.round((item.spent / item.budget) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-Axis Title & Scroll Helper */}
      <div className="flex items-center justify-between px-2 pt-1.5 pb-1 border-t border-slate-100 text-[11px] font-bold text-slate-500">
        <span className="uppercase tracking-wider">X-Axis: Project Sites</span>
        {data.length > 3 && (
          <span className="text-[10px] font-semibold text-slate-400">
            Swipe left/right to view all projects &rarr;
          </span>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 pt-1 pb-1 text-xs font-bold text-slate-700">
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

      {/* Fixed-Height Stable Insight Card */}
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
