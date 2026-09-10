'use client';

import { useState, useMemo } from 'react';
import { Search, Briefcase, CheckCircle2, Layers } from 'lucide-react';
import { ProjectCard } from '@/components/project-card';
import type { ProjectWithExpenses } from '@/types/database';

interface ProjectListProps {
  projects: ProjectWithExpenses[];
}

export function ProjectList({ projects }: ProjectListProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
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
      // Tab filter
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
      {/* Search Input — Bold high-contrast border */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search projects by name or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-10 pr-12 text-xs font-bold rounded-xl border-2 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all shadow-xs"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Tabs — Bold, High-Contrast Distinct Active Styles */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl border-2 border-slate-300">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs rounded-xl transition-all tap-scale ${
            filter === 'all'
              ? 'bg-slate-900 text-white font-black shadow-md ring-1 ring-black/10'
              : 'text-slate-700 font-bold hover:text-slate-900 hover:bg-slate-300/60'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>All</span>
          <span
            className={`ml-0.5 text-[10px] px-2 py-0.5 rounded-full font-black ${
              filter === 'all'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-300 text-slate-700'
            }`}
          >
            {projects.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('active')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs rounded-xl transition-all tap-scale ${
            filter === 'active'
              ? 'bg-orange-600 text-white font-black shadow-md ring-1 ring-orange-700/20'
              : 'text-slate-700 font-bold hover:text-slate-900 hover:bg-slate-300/60'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          <span>Active</span>
          <span
            className={`ml-0.5 text-[10px] px-2 py-0.5 rounded-full font-black ${
              filter === 'active'
                ? 'bg-orange-800 text-white'
                : 'bg-slate-300 text-slate-700'
            }`}
          >
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('completed')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs rounded-xl transition-all tap-scale ${
            filter === 'completed'
              ? 'bg-emerald-600 text-white font-black shadow-md ring-1 ring-emerald-700/20'
              : 'text-slate-700 font-bold hover:text-slate-900 hover:bg-slate-300/60'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Completed</span>
          <span
            className={`ml-0.5 text-[10px] px-2 py-0.5 rounded-full font-black ${
              filter === 'completed'
                ? 'bg-emerald-800 text-white'
                : 'bg-slate-300 text-slate-700'
            }`}
          >
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
        <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-300 bg-white">
          <p className="text-sm font-black text-slate-800">No projects found</p>
          <p className="text-xs font-medium text-slate-500 mt-1">
            {search
              ? 'No projects match your search query.'
              : filter === 'active'
              ? 'No active projects right now. Create a new one!'
              : filter === 'completed'
              ? 'No projects completed yet.'
              : 'No projects available.'}
          </p>
        </div>
      )}
    </div>
  );
}
