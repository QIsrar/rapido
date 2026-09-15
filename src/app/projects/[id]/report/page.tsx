import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { getProjectById, getLaborLogs } from '@/lib/actions';
import { ProjectReportDocumentView } from '@/components/project-report-document-view';
import { ReportPeriod } from '@/lib/report-generator';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) {
    return {
      title: 'Report Restricted — Rapido',
    };
  }
  return {
    title: `${project.name} — Audit Report & Job Costing | Rapido`,
    description: `Official site job-costing and expense audit report for ${project.name}.`,
  };
}

export default async function ProjectReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ period?: string; labor?: string; expenses?: string }>;
}) {
  const { id } = await params;
  const sParams = searchParams ? await searchParams : {};

  const period = (sParams.period as ReportPeriod) || 'all';
  const includeLabor = sParams.labor !== '0';
  const includeExpenses = sParams.expenses !== '0';

  const [project, laborLogs] = await Promise.all([
    getProjectById(id),
    getLaborLogs(id),
  ]);

  // If project is null, it's either nonexistent or private client data inaccessible to guest
  if (!project) {
    return (
      <div className="no-chrome min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Access Restricted / پرائیویٹ پراجیکٹ
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              This project report contains private financial client data. Unauthenticated guest browsing is restricted to demo projects.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProjectReportDocumentView
      project={project}
      laborLogs={laborLogs}
      initialPeriod={period}
      initialIncludeLabor={includeLabor}
      initialIncludeExpenses={includeExpenses}
    />
  );
}
