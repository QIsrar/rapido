'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight } from 'lucide-react';
import type { ProjectWithExpenses } from '@/types/database';
import { formatPKR } from '@/lib/utils';

interface ProjectCardProps {
  project: ProjectWithExpenses;
  index?: number;
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
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

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block animate-slide-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Card className="group relative overflow-hidden border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-300 hover:shadow-elevated-hover hover:border-orange-300 active:scale-[0.985] tap-scale">
        {/* Gradient accent bar at top */}
        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-slate-900 truncate">
              {project.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 font-semibold ${
                  typeColorMap[project.type] || 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {project.type}
              </Badge>
              <span className="text-xs text-slate-500">
                {project.expenses.length} expense{project.expenses.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-orange-500 transition-all duration-300 group-hover:translate-x-0.5" />
        </div>

        {/* Budget progress */}
        <div className="mt-3.5 space-y-2">
          <div className="flex items-end justify-between text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Spent</span>
              <p className="font-bold text-slate-900 text-sm">
                {formatPKR(project.total_spent)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[11px]">Budget</span>
              <p className="font-semibold text-slate-600 text-sm">
                {formatPKR(project.total_budget)}
              </p>
            </div>
          </div>

          <div className="relative">
            <Progress
              value={percentage}
              className={`h-2.5 rounded-full bg-slate-100 animate-progress-fill ${
                isOverBudget
                  ? '[&>div]:bg-red-500'
                  : isWarning
                  ? '[&>div]:bg-amber-500'
                  : '[&>div]:bg-gradient-to-r [&>div]:from-orange-400 [&>div]:to-orange-600'
              }`}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span
              className={`font-semibold ${
                isOverBudget
                  ? 'text-red-600'
                  : isWarning
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {isOverBudget
                ? `Over by ${formatPKR(Math.abs(remaining))}`
                : `${formatPKR(remaining)} remaining`}
            </span>
            <span className="text-slate-500 font-medium">
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
