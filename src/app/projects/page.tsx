import { ProjectCard } from '@/components/project-card';
import { AddExpenseDialog } from '@/components/add-expense-dialog';
import { AddProjectDialog } from '@/components/add-project-dialog';
import { SeedButton } from '@/components/seed-button';
import { getProjects } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const { projects: allProjects } = await getProjects();
  const active = allProjects.filter((p) => p.status === 'active');
  const completed = allProjects.filter((p) => p.status === 'completed');

  return (
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <header className="pt-4 pb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">All Projects</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {allProjects.length} total · {active.length} active
          </p>
        </div>

        <div className="flex items-center gap-2">
          {allProjects.length === 0 && <SeedButton />}
          <AddProjectDialog buttonVariant="primary" />
        </div>
      </header>

      {/* Active projects */}
      {active.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Projects
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
              {active.length}
            </span>
          </div>
          <div className="space-y-3">
            {active.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}

      {/* Completed projects */}
      {completed.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Completed Projects
            </h2>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
              {completed.length}
            </span>
          </div>
          <div className="space-y-3 opacity-75">
            {completed.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}

      {allProjects.length === 0 && (
        <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-white mt-4">
          <p className="text-sm font-bold text-slate-800">No projects yet</p>
          <p className="text-xs text-slate-500 mt-1 mb-4 max-w-xs mx-auto">
            Create your first project or load sample Abbottabad projects.
          </p>
          <div className="flex items-center justify-center gap-2">
            <SeedButton />
            <AddProjectDialog buttonVariant="primary" />
          </div>
        </div>
      )}

      <AddExpenseDialog projects={active} />
    </div>
  );
}
