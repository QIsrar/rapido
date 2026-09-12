import { ProjectList } from '@/components/project-list';
import { AddExpenseDialog } from '@/components/add-expense-dialog';
import { AddProjectDialog } from '@/components/add-project-dialog';
import { SeedButton } from '@/components/seed-button';
import { getProjects } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; highlighted?: string }>;
}) {
  const { tab, highlighted } = (await searchParams) || {};
  const { projects: allProjects } = await getProjects();
  const active = allProjects.filter((p) => p.status === 'active');

  const initialFilter =
    tab === 'completed' ? 'completed' : tab === 'active' ? 'active' : 'all';

  return (
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <header className="pt-4 pb-4 flex items-start justify-between">
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

      {allProjects.length === 0 ? (
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
      ) : (
        <ProjectList
          projects={allProjects}
          initialFilter={initialFilter}
          highlightedId={highlighted || ''}
        />
      )}

      <AddExpenseDialog projects={active} />
    </div>
  );
}
