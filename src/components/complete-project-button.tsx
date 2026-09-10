'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { completeProject } from '@/lib/actions';

interface CompleteProjectButtonProps {
  projectId: string;
  projectName: string;
}

export function CompleteProjectButton({
  projectId,
  projectName,
}: CompleteProjectButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    const confirm = window.confirm(
      `Are you sure you want to mark "${projectName}" as completed? The completion timestamp will be recorded automatically.`
    );
    if (!confirm) return;

    setIsSubmitting(true);
    try {
      const res = await completeProject(projectId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || 'Failed to complete project.');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error completing project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleComplete}
      disabled={isSubmitting}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-xs font-bold text-emerald-700 shadow-xs transition-all disabled:opacity-50"
    >
      {isSubmitting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5" />
      )}
      Mark as Completed
    </button>
  );
}
