'use client';

import { useState, useMemo } from 'react';
import { Search, Briefcase, CheckCircle2, Layers } from 'lucide-react';
import { ProjectCard } from '@/components/project-card';
import type { ProjectWithExpenses } from '@/types/database';

interface ProjectListProps {
  projects: ProjectWithExpenses[];
}

type FilterStatus = 'all' | 'active' | 'completed';

export function ProjectList({ projects }: ProjectListProps) {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');

  const activeCount = useMemo(
    () => projects.filter((p) => p.status === 'active').length,
    [projects]
  );
  const completedCount = useMemo(
    () => projects.filter((p) => p.status === 'completed').length,
    [projects]
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Status filter
      if (filter === 'active' && p.status !== 'active') return false;
      if (filter === 'completed' && p.status !== 'completed') return false;

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesType = p.type.toLowerCase().includes(query);
        return matchesName || matchesType;
      }

      return true;
    });
  }, [projects, filter, search]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search projects by name or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-10 pr-4 text-xs font-medium rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-2xs"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
            filter === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>All</span>
          <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
            {projects.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('active')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
            filter === 'active'
              ? 'bg-white text-orange-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="h-3.5 w-3.5" />
          <span>Active</span>
          <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('completed')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
            filter === 'completed'
              ? 'bg-white text-emerald-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Completed</span>
          <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
            {completedCount}
          </span>
        </button>
      </div>

      {/* Projects List */}
      {filteredProjects.length > 0 ? (
        <div className="space-y-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-white">
          <p className="text-sm font-bold text-slate-700">No projects found</p>
          <p className="text-xs text-slate-400 mt-1">
            {search
              ? `No projects matching "${search}"`
              : `No ${filter} projects available`}
          </p>
        </div>
      )}
    </div>
  );
}
