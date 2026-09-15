'use client';

import { useState, useEffect } from 'react';
import { Receipt, HardHat } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ExpenseRow } from '@/components/expense-row';
import { LaborLogSection } from '@/components/labor-log-section';
import { formatPKR } from '@/lib/utils';
import { type Expense, type LaborLog, type Project } from '@/types/database';

interface ProjectDetailsTabsProps {
  project: Project;
  sortedExpenses: Expense[];
  topCategories: [string, number][];
  categoryAccentMap: Record<string, string>;
  isCompleted: boolean;
  laborLogs: LaborLog[];
  highlightExpenseId?: string | null;
}

export function ProjectDetailsTabs({
  project,
  sortedExpenses,
  topCategories,
  categoryAccentMap,
  isCompleted,
  laborLogs,
  highlightExpenseId,
}: ProjectDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<'expenses' | 'labor'>('expenses');

  // Swipe detection state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const minSwipeDistance = 60;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeTab === 'expenses') {
      setActiveTab('labor');
      if (typeof window !== 'undefined' && window.history.replaceState) {
        window.history.replaceState(null, '', '#labor');
      }
    } else if (isRightSwipe && activeTab === 'labor') {
      setActiveTab('expenses');
      if (typeof window !== 'undefined' && window.history.replaceState) {
        window.history.replaceState(null, '', '#expenses');
      }
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#labor' || hash === '#hazri') {
        setActiveTab('labor');
      } else if (hash === '#expenses') {
        setActiveTab('expenses');
      }
    }
  }, []);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="space-y-4 select-none touch-pan-y"
    >
      {/* Segmented Tab Navigation Switcher */}
      <div className="flex p-1 bg-slate-100/90 backdrop-blur-sm rounded-2xl border border-slate-200/90 shadow-2xs">
        <button
          type="button"
          onClick={() => {
            setActiveTab('expenses');
            if (typeof window !== 'undefined' && window.history.replaceState) {
              window.history.replaceState(null, '', '#expenses');
            }
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer tap-scale ${
            activeTab === 'expenses'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-orange-600 shrink-0" />
          <span>Expenses</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
              activeTab === 'expenses'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {sortedExpenses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('labor');
            if (typeof window !== 'undefined' && window.history.replaceState) {
              window.history.replaceState(null, '', '#labor');
            }
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer tap-scale ${
            activeTab === 'labor'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <HardHat className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Labor Log (Hazri)</span>
          {laborLogs.length > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                activeTab === 'labor'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {laborLogs.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Expenses View */}
      {activeTab === 'expenses' && (
        <div className="space-y-5 animate-slide-up">
          {/* Category Breakdown */}
          {topCategories.length > 0 && (
            <section>
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
          <section id="expenses" className="scroll-mt-6">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                All Expenses ({sortedExpenses.length})
              </h2>
              <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
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
                    <ExpenseRow
                      expense={expense}
                      showDelete={!isCompleted}
                      isHighlighted={expense.id === highlightExpenseId}
                    />
                  </div>
                ))
              )}
            </Card>
          </section>
        </div>
      )}

      {/* Tab 2: Labor Attendance Log View */}
      {activeTab === 'labor' && (
        <section id="labor" className="scroll-mt-6 animate-slide-up">
          <LaborLogSection
            projectId={project.id}
            projectName={project.name}
            initialLogs={laborLogs}
            isCompleted={isCompleted}
          />
        </section>
      )}
    </div>
  );
}
