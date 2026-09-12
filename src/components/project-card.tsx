'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, MapPin, ExternalLink, CheckCircle2 } from 'lucide-react';
import type { ProjectWithExpenses } from '@/types/database';
import { formatPKR } from '@/lib/utils';

interface ProjectCardProps {
  project: ProjectWithExpenses;
  index?: number;
  highlightedId?: string;
}

export function ProjectCard({ project, index = 0, highlightedId = '' }: ProjectCardProps) {
  const [isRecentlyCreated, setIsRecentlyCreated] = useState(false);
  const [isRecentlyCompleted, setIsRecentlyCompleted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const recentId = sessionStorage.getItem('recentlyCreatedProjectId');
      if (recentId === project.id) {
        setIsRecentlyCreated(true);
      }
      const completedId = sessionStorage.getItem('recentlyCompletedProjectId');
      if (completedId === project.id || highlightedId === project.id) {
        setIsRecentlyCompleted(true);
        setTimeout(() => {
          cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    } catch {
      // Ignore storage errors
    }

    const handleCreated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.id === project.id) {
        setIsRecentlyCreated(true);
      }
    };

    window.addEventListener('project-created', handleCreated);
    return () => window.removeEventListener('project-created', handleCreated);
  }, [project.id, highlightedId]);

  const percentage = Math.min(
    project.total_budget > 0 ? (project.total_spent / project.total_budget) * 100 : 0,
    100
  );
  const remaining = project.total_budget - project.total_spent;
  const isOverBudget = remaining < 0;
  const isWarning = percentage >= 80 && !isOverBudget;

  const typeColorMap: Record<string, string> = {
    'New Build': 'bg-blue-50 text-blue-700 border-blue-200',
    Renovation: 'bg-purple-50 text-purple-700 border-purple-200',
    Maintenance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const displayPercentage = () => {
    if (project.total_spent <= 0) return '0% budget utilized';
    if (percentage < 0.1) return '<0.1% budget utilized';
    if (percentage < 1) return `${percentage.toFixed(1)}% budget utilized`;
    return `${percentage.toFixed(0)}% budget utilized`;
  };

  const visualProgressValue = project.total_spent > 0 ? Math.max(percentage, 2) : 0;

  const isLocationUrl =
    project.location &&
    (project.location.startsWith('http://') ||
      project.location.startsWith('https://') ||
      project.location.includes('maps.google') ||
      project.location.includes('goo.gl'));

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block animate-slide-up cursor-pointer"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Card
        ref={cardRef}
        className={`group relative overflow-hidden bg-white p-4 transition-all duration-300 hover:shadow-elevated-hover hover:border-orange-400 active:scale-[0.985] tap-scale ${
          isRecentlyCompleted
            ? 'border-2 border-emerald-500 ring-4 ring-emerald-500/30 shadow-xl shadow-emerald-500/15 bg-gradient-to-b from-emerald-50/30 via-white to-white'
            : isRecentlyCreated
            ? 'border-2 border-orange-500 ring-4 ring-orange-500/25 shadow-xl shadow-orange-500/10 bg-gradient-to-b from-orange-50/40 via-white to-white'
            : 'border border-slate-200/90 shadow-xs'
        }`}
      >
        {/* Top accent line */}
        <div
          className={`absolute inset-x-0 top-0 h-[3px] transition-opacity duration-300 ${
            isRecentlyCompleted
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 opacity-100'
              : isRecentlyCreated
              ? 'bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 opacity-100'
              : 'bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 opacity-0 group-hover:opacity-100'
          }`}
        />

        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-base text-slate-900 truncate">
                {project.name}
              </h3>
              {isRecentlyCompleted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-xs animate-pulse">
                  ✓ Just Completed
                </span>
              )}
              {isRecentlyCreated && !isRecentlyCompleted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-600 text-white shadow-xs animate-pulse">
                  ✨ Just Created
                </span>
              )}
            </div>

            {/* Badges & Expense Count */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 font-bold ${
                  typeColorMap[project.type] || 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {project.type}
              </Badge>
              <span className="text-xs font-semibold text-slate-500">
                {project.expenses.length} expense{project.expenses.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Site Location with Google Maps link */}
            {project.location && (
              <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-600">
                <MapPin className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                {isLocationUrl ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(project.location!, '_blank', 'noopener,noreferrer');
                    }}
                    className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 underline font-bold cursor-pointer"
                  >
                    <span>View Map Location</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                ) : (
                  <span className="truncate text-slate-700">{project.location}</span>
                )}
              </div>
            )}
          </div>

          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-orange-500 transition-all duration-300 group-hover:translate-x-0.5 shrink-0 mt-0.5" />
        </div>

        {/* 3 Explicit Financial Boxes (Budget, Spent, Remaining) */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
          <div className="px-1.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Budget
            </span>
            <span className="text-[11px] sm:text-xs font-black text-slate-900 block mt-0.5 tracking-tight">
              {formatPKR(project.total_budget)}
            </span>
          </div>

          <div className="px-1.5 py-2 rounded-xl bg-amber-50/70 border border-amber-200/70">
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">
              Spent
            </span>
            <span className="text-[11px] sm:text-xs font-black text-amber-950 block mt-0.5 tracking-tight">
              {formatPKR(project.total_spent)}
            </span>
          </div>

          <div
            className={`px-1.5 py-2 rounded-xl border ${
              isOverBudget
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-emerald-50/70 border-emerald-200/70 text-emerald-900'
            }`}
          >
            <span
              className={`text-[10px] font-black uppercase tracking-wider block ${
                isOverBudget ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {isOverBudget ? 'Over Budget' : 'Remaining'}
            </span>
            <span className="text-[11px] sm:text-xs font-black block mt-0.5 tracking-tight">
              {formatPKR(Math.abs(remaining))}
            </span>
          </div>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="mt-3 space-y-1.5">
          <Progress
            value={visualProgressValue}
            className={`h-2 rounded-full bg-slate-100 ${
              isOverBudget
                ? '[&>div]:bg-red-500'
                : isWarning
                ? '[&>div]:bg-amber-500'
                : '[&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-amber-500'
            }`}
          />
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className={isOverBudget ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-slate-500'}>
              {displayPercentage()}
            </span>
            <span className="text-slate-400 font-semibold">
              Tap to view details &rarr;
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
