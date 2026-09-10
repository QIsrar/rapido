'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import type { Expense } from '@/types/database';
import { formatPKR } from '@/lib/utils';
import { softDeleteExpense } from '@/lib/actions';
import { ReceiptViewer } from '@/components/receipt-viewer';

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
  const [isDeleting, setIsDeleting] = useState(false);

  const dateObj = new Date(expense.date);
  const formattedDate = dateObj.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
  });

  const handleDelete = async () => {
    const confirm = window.confirm(
      `Delete this ${expense.category} expense of ${formatPKR(expense.amount)}?`
    );
    if (!confirm) return;

    setIsDeleting(true);
    try {
      const res = await softDeleteExpense(expense.id, expense.project_id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || 'Failed to delete expense.');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting expense.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
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
          <span className="text-slate-300">·</span>
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

      {/* Delete button — visible on touch and hover */}
      {showDelete && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label="Delete expense"
          title="Delete expense"
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-70 hover:opacity-100 transition-all disabled:opacity-50 tap-scale"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}
