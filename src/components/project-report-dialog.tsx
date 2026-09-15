'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  FileText,
  Share2,
  Copy,
  Check,
  Printer,
  Calendar,
  Layers,
  Users,
  TrendingDown,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { ProjectWithExpenses, LaborLog } from '@/types/database';
import {
  ReportPeriod,
  computeReportMetrics,
  generateWhatsAppReport,
  getWhatsAppShareUrl,
} from '@/lib/report-generator';

interface ProjectReportDialogProps {
  project: ProjectWithExpenses;
  laborLogs?: LaborLog[];
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectReportDialog({
  project,
  laborLogs = [],
  isOpen,
  onClose,
}: ProjectReportDialogProps) {
  const router = useRouter();
  const [period, setPeriod] = useState<ReportPeriod>('all');
  const [includeLabor, setIncludeLabor] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [copied, setCopied] = useState(false);

  const metrics = computeReportMetrics(project, laborLogs, {
    period,
    includeLabor,
    includeExpenses,
  });

  const whatsappMessage = generateWhatsAppReport(project, laborLogs, {
    period,
    includeLabor,
    includeExpenses,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleWhatsAppShare = () => {
    const url = getWhatsAppShareUrl(whatsappMessage);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenPrintView = () => {
    onClose();
    const query = new URLSearchParams({
      period,
      labor: includeLabor ? '1' : '0',
      expenses: includeExpenses ? '1' : '0',
    });
    router.push(`/projects/${project.id}/report?${query.toString()}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <DialogHeader className="text-left pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Export Project Report
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                Generate branded PDF summary or share on WhatsApp
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Period selector pills */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
              Report Period / دورانیہ
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'all', label: 'All Time' },
                { id: 'this_month', label: 'This Month' },
                { id: 'last_30_days', label: 'Last 30 Days' },
                { id: 'this_week', label: 'Last 7 Days' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id as ReportPeriod)}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all border text-center ${
                    period === p.id
                      ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Preview Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Financial Snapshot ({metrics.periodLabel})</span>
              <span className="font-semibold text-slate-800">{metrics.percentSpent}% utilized</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Budget</p>
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  Rs. {metrics.totalBudget.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Spent</p>
                <p className="text-xs sm:text-sm font-bold text-orange-600 truncate">
                  Rs. {metrics.totalSpent.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs">
                <p className="text-[10px] text-slate-500 font-semibold uppercase">Balance</p>
                <p
                  className={`text-xs sm:text-sm font-bold truncate ${
                    metrics.isOverBudget ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  Rs. {metrics.remainingBudget.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Sub-breakdown: expenses count and labor info */}
            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3 text-slate-400" />
                {metrics.filteredExpenses.length} Material & Site Expenses
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 text-slate-400" />
                {metrics.totalLaborDays} Labor Days (Hazri)
              </span>
            </div>
          </div>

          {/* Customization toggles */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Include In Export / رپورٹ میں شامل کریں
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIncludeLabor(!includeLabor)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  includeLabor
                    ? 'border-orange-500 bg-orange-50/50 text-orange-800'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                <span>Labor Muster Roll</span>
                <span
                  className={`h-4 w-4 rounded flex items-center justify-center text-[10px] ${
                    includeLabor ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  ✓
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIncludeExpenses(!includeExpenses)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  includeExpenses
                    ? 'border-orange-500 bg-orange-50/50 text-orange-800'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                <span>Expense Audit Ledger</span>
                <span
                  className={`h-4 w-4 rounded flex items-center justify-center text-[10px] ${
                    includeExpenses ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  ✓
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100">
          {/* Primary Action 1: Full Printable PDF View */}
          <button
            type="button"
            onClick={handleOpenPrintView}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Open Printable PDF Report / پرنٹ کریں
          </button>

          {/* Primary Action 2: WhatsApp Share */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              WhatsApp Share
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Copied! / کاپی ہو گیا
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  Copy WhatsApp Text
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
