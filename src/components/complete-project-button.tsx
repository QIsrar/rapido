'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, AlertCircle, X, ShieldCheck } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState('');

  const handleConfirm = async () => {
    setErrorMsg('');
    try {
      const res = await completeProject(projectId);
      if (res.success) {
        setIsOpen(false);
        startTransition(() => {
          router.refresh();
        });
      } else {
        setErrorMsg(res.error || 'Failed to complete project.');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error completing project.');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-emerald-400 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-xs font-black text-emerald-800 shadow-xs transition-all tap-scale"
      >
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        Mark as Completed
      </button>

      {/* Interactive Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border-2 border-slate-300 p-5 space-y-4 animate-scale-up"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setErrorMsg('');
                }}
                disabled={isPending}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                Mark as Completed?
              </h3>
              <p className="text-xs font-medium text-slate-600 mt-1 leading-relaxed">
                Are you sure you want to mark{' '}
                <strong className="text-slate-900 font-bold">&ldquo;{projectName}&rdquo;</strong> as
                finished?
              </p>
            </div>

            {/* Explanatory note */}
            <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-200 text-[11px] text-slate-600 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Automatic Job Archiving
              </div>
              <p className="text-slate-500">
                The completion timestamp will be recorded as now, and this project will be archived to your Completed history.
              </p>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 border-2 border-red-200 text-xs font-bold text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setErrorMsg('');
                }}
                disabled={isPending}
                className="w-full py-2.5 px-3 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all tap-scale disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-xs font-black text-white shadow-md transition-all tap-scale flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Yes, Complete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
