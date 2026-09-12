'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Package,
  HardHat,
  Wrench,
  Droplets,
  Zap,
  FileText,
  Truck,
  MoreHorizontal,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
} from 'lucide-react';
import type { Expense } from '@/types/database';
import { formatPKR } from '@/lib/utils';
import { softDeleteExpense } from '@/lib/actions';
import { ReceiptViewer } from '@/components/receipt-viewer';
import { useAuth } from './auth-context';

const categoryConfig: Record<
  string,
  { icon: React.ElementType; color: string; bg: string }
> = {
  Materials: {
    icon: Package,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  Labor: {
    icon: HardHat,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  'Equipment Rental': {
    icon: Wrench,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  Plumbing: {
    icon: Droplets,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
  },
  Electricity: {
    icon: Zap,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  Permits: {
    icon: FileText,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  'Transport/Fuel': {
    icon: Truck,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  Misc: {
    icon: MoreHorizontal,
    color: 'text-slate-600',
    bg: 'bg-slate-100',
  },
};

interface ExpenseRowProps {
  expense: Expense;
  showDelete?: boolean;
}

export function ExpenseRow({ expense, showDelete = true }: ExpenseRowProps) {
  const router = useRouter();
  const config = categoryConfig[expense.category] || categoryConfig.Misc;
  const Icon = config.icon;
  const { isGuest, openAuthModal } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const dateObj = new Date(expense.date);
  const formattedDate = dateObj.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleConfirmDelete = async () => {
    setDeleteError('');
    setIsDeleting(true);
    try {
      const res = await softDeleteExpense(expense.id, expense.project_id);
      if (res.success) {
        setShowDeleteModal(false);
        router.refresh();
      } else {
        setDeleteError(res.error || 'Failed to delete expense.');
      }
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Error deleting expense.');
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteModalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-scale-up relative overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Accent top line */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-red-600" />

        {/* Header */}
        <div className="flex items-start justify-between pt-1">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border-2 border-red-200 text-red-600 flex items-center justify-center shadow-xs">
            <Trash2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <button
            type="button"
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteError('');
            }}
            disabled={isDeleting}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-black text-slate-900">
            Delete Expense?
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            This expense will be removed and deducted from the project spending total.
          </p>
        </div>

        {/* Expense Detail Preview Box */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
              {expense.category}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {formattedDate}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-black text-slate-800 truncate">
              {expense.description || expense.category}
            </p>
            <span className="text-sm font-black text-red-600 shrink-0">
              {formatPKR(expense.amount)}
            </span>
          </div>
        </div>

        {deleteError && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{deleteError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteError('');
            }}
            disabled={isDeleting}
            className="w-full py-2.5 px-3 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-50 active:scale-95 text-xs font-bold text-slate-700 transition-all tap-scale disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-xs font-black text-white shadow-md shadow-red-600/30 transition-all tap-scale flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex items-center gap-3 py-3 px-2 border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50/80 group">
        {/* Category icon */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${config.bg}`}
        >
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>

        {/* Description + category */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {expense.description || expense.category}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-medium text-slate-500">
              {expense.category}
            </span>
            <span className="text-slate-300">&middot;</span>
            <span className="text-xs text-slate-400">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Receipt thumbnail */}
        {expense.receipt_url && (
          <ReceiptViewer
            url={expense.receipt_url}
            description={expense.description || expense.category}
          />
        )}

        {/* Amount */}
        <div className="flex-shrink-0 text-right">
          <span className="text-sm font-bold text-slate-900">
            {formatPKR(expense.amount)}
          </span>
        </div>

        {/* Modern Delete trigger button */}
        {showDelete && (
          <button
            type="button"
            onClick={() => {
              if (isGuest) {
                openAuthModal('signin');
                return;
              }
              setShowDeleteModal(true);
            }}
            aria-label="Delete expense"
            title="Delete expense"
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all tap-scale cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Render modern modal via portal */}
      {showDeleteModal && mounted && createPortal(deleteModalContent, document.body)}
    </>
  );
}
