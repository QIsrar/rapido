'use client';

import { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, AlertTriangle, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { deleteProject } from '@/lib/actions';
import { useAuth } from './auth-context';

interface DeleteProjectButtonProps {
  projectId: string;
  projectName: string;
  expensesCount?: number;
}

export function DeleteProjectButton({
  projectId,
  projectName,
  expensesCount = 0,
}: DeleteProjectButtonProps) {
  const router = useRouter();
  const { isGuest, isAdmin, openAuthModal } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleted, setIsDeleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConfirmDelete = async () => {
    setErrorMsg('');
    try {
      const res = await deleteProject(projectId);
      if (res.success) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            'deletedProjectNotice',
            `Project "${projectName}" was deleted successfully.`
          );
        }
        setIsDeleted(true);
        setTimeout(() => {
          setIsOpen(false);
          if (typeof window !== 'undefined') {
            window.location.replace('/');
          }
        }, 900);
      } else {
        setErrorMsg(res.error || 'Failed to delete project.');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error deleting project.');
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-scale-up relative overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Danger Accent */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />

        {isDeleted ? (
          <div className="py-6 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-400 text-emerald-600 flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-1">
                Deleted Successfully
              </span>
              <h3 className="text-base font-black text-slate-900">
                &ldquo;{projectName}&rdquo;
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Project and associated expenses removed. Returning to dashboard...
              </p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-3">
              <div
                className="bg-emerald-500 h-full w-full origin-left"
                style={{ animation: 'shrink 1.2s linear forwards' }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="flex items-start justify-between pt-1">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border-2 border-red-200 text-red-600 flex items-center justify-center shadow-xs">
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setErrorMsg('');
                }}
                disabled={isPending}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                Delete Entire Project?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900 font-bold">&ldquo;{projectName}&rdquo;</strong>?
              </p>
            </div>

            {/* Project Summary Box */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>Permanent Data Deletion</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                This will erase the project along with its <strong className="text-slate-800">{expensesCount} logged expense{expensesCount === 1 ? '' : 's'}</strong> and receipts from your cloud database. This cannot be undone.
              </p>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
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
                className="w-full py-2.5 px-3 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all tap-scale disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isPending}
                className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-xs font-black text-white shadow-md shadow-red-600/30 transition-all tap-scale flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Project
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isGuest) {
            openAuthModal('signin');
            return;
          }
          if (!isAdmin) {
            alert('Admin privileges required: Only administrator (Qazi Israr) can delete projects.');
            return;
          }
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-200 hover:border-red-300 hover:bg-red-50 text-xs font-bold text-slate-600 hover:text-red-600 transition-all tap-scale cursor-pointer"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>Delete Project</span>
      </button>

      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
}
