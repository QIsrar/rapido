'use client';

import { useState } from 'react';
import { formatPKR } from '@/lib/utils';
import { Calendar } from 'lucide-react';

interface MonthlyItem {
  month: string; // YYYY-MM
  total: number;
  count: number;
}

interface MonthlySpendingChartProps {
  data: MonthlyItem[];
}

export function MonthlySpendingChart({ data }: MonthlySpendingChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        No monthly spending history available yet.
      </div>
    );
  }

  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const lifetimePeriodSpend = data.reduce((acc, d) => acc + d.total, 0);

  const formatMonthLabel = (mStr: string) => {
    const [year, month] = mStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  const formatFullMonth = (mStr: string) => {
    const [year, month] = mStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const activeItem = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="space-y-4 select-none">
      {/* Responsive Bar Columns at top */}
      <div className="grid grid-cols-6 gap-2 items-end h-44 pt-4 px-1">
        {data.map((item, index) => {
          const heightPct = Math.max((item.total / maxTotal) * 100, 4);
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={item.month}
              className={`flex flex-col items-center justify-end h-full relative rounded-xl p-1 transition-colors duration-150 ${
                isHovered ? 'bg-orange-50/80' : 'hover:bg-slate-50'
              }`}
            >
              {/* Isolated Hitbox Overlay */}
              <div
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(index === hoveredIndex ? null : index)}
                className="absolute inset-0 z-30 cursor-pointer"
              />

              {/* Value on top of bar — pointer-events-none */}
              <span
                className={`text-[9px] font-bold mb-1 transition-all pointer-events-none ${
                  isHovered
                    ? 'text-orange-600 font-black'
                    : item.total > 0
                    ? 'text-slate-600'
                    : 'text-slate-300'
                }`}
              >
                {item.total >= 1000000
                  ? `${(item.total / 1000000).toFixed(1)}M`
                  : item.total >= 1000
                  ? `${Math.round(item.total / 1000)}k`
                  : item.total > 0
                  ? item.total
                  : '-'}
              </span>

              {/* Bar — pointer-events-none */}
              <div className="w-full max-w-[40px] bg-slate-100 rounded-t-lg relative flex items-end justify-center overflow-hidden h-32 pointer-events-none">
                <div
                  className={`w-full rounded-t-lg transition-all duration-150 ${
                    isHovered
                      ? 'bg-gradient-to-t from-orange-600 to-amber-500 shadow-md'
                      : item.total > 0
                      ? 'bg-gradient-to-t from-orange-500 to-amber-400'
                      : 'bg-slate-200'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>

              {/* Month Label — pointer-events-none */}
              <span
                className={`text-[10px] mt-2 font-bold uppercase tracking-wider transition-colors pointer-events-none ${
                  isHovered ? 'text-orange-600 font-black' : 'text-slate-500'
                }`}
              >
                {formatMonthLabel(item.month)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Fixed-height Interactive Tooltip Card placed below bars so no layout shift occurs */}
      <div className="h-20 w-full">
        {activeItem ? (
          <div className="h-full p-3.5 rounded-2xl bg-slate-900 text-white shadow-md flex flex-col justify-between animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-orange-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatFullMonth(activeItem.month)}
              </span>
              <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full">
                {lifetimePeriodSpend > 0
                  ? `${Math.round((activeItem.total / lifetimePeriodSpend) * 100)}% of total`
                  : '0%'}
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block leading-none">Total Spend</span>
                <span className="text-base font-black text-white">
                  {formatPKR(activeItem.total)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block leading-none">Transactions</span>
                <span className="text-xs font-bold text-slate-300">
                  {activeItem.count} {activeItem.count === 1 ? 'expense' : 'expenses'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-center text-xs text-slate-500 font-medium flex items-center justify-center">
            <span>💡 <strong className="text-slate-700">Interactive Trend:</strong> Hover or tap on any month column above to inspect spending details.</span>
          </div>
        )}
      </div>
    </div>
  );
}
