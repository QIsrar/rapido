'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { ProjectWithExpenses, LaborLog } from '@/types/database';
import { ProjectReportDialog } from './project-report-dialog';

interface ProjectReportButtonProps {
  project: ProjectWithExpenses;
  laborLogs?: LaborLog[];
}

export function ProjectReportButton({ project, laborLogs = [] }: ProjectReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100/80 border border-orange-200/80 px-3 py-1.5 rounded-xl shadow-2xs transition-colors min-h-[36px] tap-scale cursor-pointer"
        title="Export Project PDF Report & WhatsApp Summary"
      >
        <FileText className="h-3.5 w-3.5 text-orange-600" />
        <span className="hidden xs:inline">Export</span> Report
      </button>

      <ProjectReportDialog
        project={project}
        laborLogs={laborLogs}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
