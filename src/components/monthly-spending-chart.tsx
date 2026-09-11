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
    <div className="space-y-4">
      {/* Responsive Bar Columns at top */}
      <div className="grid grid-cols-6 gap-2 items-end h-44 pt-4 px-1">
        {data.map((item, index) => {
          const heightPct = Math.max((item.total / maxTotal) * 100, 4);
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={item.month}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => setHoveredIndex(index === hoveredIndex ? null : index)}
              className="flex flex-col items-center justify-end h-full group cursor-pointer"
            >
              {/* Value on top of bar */}
              <span
                className={`text-[9px] font-bold mb-1 transition-all ${
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

              {/* Bar */}
              <div className="w-full max-w-[40px] bg-slate-100 rounded-t-lg relative flex items-end justify-center overflow-hidden h-32">
                <div
                  className={`w-full rounded-t-lg transition-all duration-200 ${
                    isHovered
                      ? 'bg-gradient-to-t from-orange-600 to-amber-400 shadow-md ring-2 ring-orange-400/50'
                      : item.total > 0
                      ? 'bg-gradient-to-t from-orange-500 to-amber-400 group-hover:from-orange-600 group-hover:to-amber-400'
                      : 'bg-slate-200'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>

              {/* Month Label */}
              <span
                className={`text-[10px] mt-2 font-bold uppercase tracking-wider transition-colors ${
                  isHovered ? 'text-orange-600 font-black' : 'text-slate-500'
                }`}
              >
                {formatMonthLabel(item.month)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Interactive Tooltip Card placed below bars so no layout shift occurs */}
      <div className="min-h-[75px]">
        {activeItem ? (
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-md animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black text-orange-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatFullMonth(activeItem.month)}
              </span>
              <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full">
                {lifetimePeriodSpend > 0
                  ? `${Math.round((activeItem.total / lifetimePeriodSpend) * 100)}% of 6-mo total`
                  : '0%'}
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1.5 border-t border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Total Spend</span>
                <span className="text-base font-black text-white">
                  {formatPKR(activeItem.total)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block">Transactions</span>
                <span className="text-xs font-bold text-slate-300">
                  {activeItem.count} {activeItem.count === 1 ? 'expense' : 'expenses'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-center text-xs text-slate-500 font-medium">
            💡 <strong className="text-slate-700">Interactive Trend:</strong> Hover or tap on any month column above to inspect spending details.
          </div>
        )}
      </div>
    </div>
  );
}
