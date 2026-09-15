'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Printer,
  Share2,
  Calendar,
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  Receipt,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { ProjectWithExpenses, LaborLog, ExpenseCategory } from '@/types/database';
import {
  ReportPeriod,
  computeReportMetrics,
  generateWhatsAppReport,
  getWhatsAppShareUrl,
} from '@/lib/report-generator';

interface ProjectReportDocumentViewProps {
  project: ProjectWithExpenses;
  laborLogs?: LaborLog[];
  initialPeriod?: ReportPeriod;
  initialIncludeLabor?: boolean;
  initialIncludeExpenses?: boolean;
}

const categoryUrdu: Record<ExpenseCategory, string> = {
  Materials: 'سیمنٹ، سریا، ریت، بجری',
  Labor: 'مزدور و مستری دیہاڑی',
  'Equipment Rental': 'مشینری و آلات کرایہ',
  Plumbing: 'پلمبنگ و سینیٹری',
  Electricity: 'وائرنگ و بجلی سامان',
  Permits: 'نقشہ فیس و منظوری',
  'Transport/Fuel': 'ٹرانسپورٹ و فیول',
  Misc: 'متفرق اخراجات',
};

export function ProjectReportDocumentView({
  project,
  laborLogs = [],
  initialPeriod = 'all',
  initialIncludeLabor = true,
  initialIncludeExpenses = true,
}: ProjectReportDocumentViewProps) {
  const [period, setPeriod] = useState<ReportPeriod>(initialPeriod);
  const [includeLabor, setIncludeLabor] = useState(initialIncludeLabor);
  const [includeExpenses, setIncludeExpenses] = useState(initialIncludeExpenses);

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

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const url = getWhatsAppShareUrl(whatsappMessage);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const generatedDate = new Date().toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const generatedTime = new Date().toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="no-chrome min-h-screen bg-slate-100 text-slate-900 pb-16 print:bg-white print:p-0 print:pb-0">
      {/* ============================================================
          TOP UTILITY BAR (SCREEN ONLY - HIDDEN ON PRINT)
          ============================================================ */}
      <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Back link */}
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-2 rounded-xl transition-all tap-scale"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Project</span>
          </Link>

          {/* Period selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_30_days', label: '30 Days' },
              { id: 'this_week', label: '7 Days' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id as ReportPeriod)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  period === p.id
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span> WhatsApp
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-all active:scale-95"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Browser Tips Banner for Mobile Users */}
        <div className="max-w-5xl mx-auto mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Info className="h-3.5 w-3.5 text-orange-500" />
            <span>
              <strong>PDF Tip:</strong> On <strong>Android</strong>, choose &quot;Save as PDF&quot;.
              On <strong>iOS Safari</strong>, choose &quot;Print&quot; then pinch-to-zoom preview to save/share PDF.
            </span>
          </span>

          <div className="hidden md:flex items-center gap-3 font-medium">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeLabor}
                onChange={(e) => setIncludeLabor(e.target.checked)}
                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
              Labor Roll
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeExpenses}
                onChange={(e) => setIncludeExpenses(e.target.checked)}
                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
              Itemized Expenses
            </label>
          </div>
        </div>
      </header>

      {/* ============================================================
          PRINTABLE DOCUMENT CANVAS (A4 Standard Vector Sheet)
          ============================================================ */}
      <main className="max-w-[210mm] mx-auto my-4 sm:my-8 bg-white p-6 sm:p-12 sm:rounded-2xl shadow-md border border-slate-200 print:max-w-none print:m-0 print:p-0 print:border-none print:shadow-none">
        {/* DOCUMENT HEADER */}
        <div className="print-avoid-break border-b-2 border-slate-900 pb-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="font-black text-xl tracking-tight uppercase px-2.5 py-1 rounded"
                  style={{ backgroundColor: '#ea580c', color: '#ffffff' }}
                >
                  RAPIDO
                </span>
                <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                  Construction Management
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
                Project Audit & Job-Costing Report
              </h1>
              <p className="text-xs font-medium text-slate-600 mt-0.5">
                خلاصہ اخراجات، مالیاتی تفصیل اور یومیہ لیبر حاضری
              </p>
            </div>

            {/* Verification Badge */}
            <div className="sm:text-right text-xs text-slate-600 space-y-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[11px] bg-slate-100 text-slate-800 border border-slate-200">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Verified Site Record
              </div>
              <p className="text-[11px] text-slate-500">
                Date: <strong>{generatedDate}</strong> at {generatedTime}
              </p>
              <p className="text-[11px] text-slate-500">
                Scope: <strong>{metrics.periodLabel}</strong>
              </p>
            </div>
          </div>

          {/* Project Details Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Project Name</span>
              <span className="font-bold text-slate-900 text-sm">{project.name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Site Location</span>
              <span className="font-semibold text-slate-800">{project.location || 'Abbottabad / Hazara'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Type / Category</span>
              <span className="font-semibold text-slate-800">{project.type}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Project Status</span>
              <span className="font-bold text-slate-900">
                {project.status === 'completed' ? '✅ Completed (مکمل)' : '🔄 Active (زیرِ تعمیر)'}
              </span>
            </div>
          </div>
        </div>

        {/* FINANCIAL SUMMARY KPI CARDS (Resolved Inline Colors for iOS & Android Print) */}
        <div className="print-avoid-break mb-8">
          <h2 className="text-xs font-black tracking-wider text-slate-700 uppercase mb-2.5">
            Financial Health & Expenditure / مالیاتی خلاصہ
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Budget */}
            <div
              className="p-3.5 rounded-xl border border-slate-800"
              style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
                Total Budget / کل بجٹ
              </span>
              <span className="text-base sm:text-lg font-black block mt-1 tracking-tight">
                Rs. {metrics.totalBudget.toLocaleString()}
              </span>
              <span className="text-[10px] opacity-70 block mt-0.5">Approved Allocation</span>
            </div>

            {/* Spent */}
            <div
              className="p-3.5 rounded-xl border border-orange-700"
              style={{ backgroundColor: '#ea580c', color: '#ffffff' }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-90">
                Total Spent / کل خرچ
              </span>
              <span className="text-base sm:text-lg font-black block mt-1 tracking-tight">
                Rs. {metrics.totalSpent.toLocaleString()}
              </span>
              <span className="text-[10px] opacity-90 block mt-0.5">
                {metrics.percentSpent}% utilized
              </span>
            </div>

            {/* Balance */}
            <div
              className="p-3.5 rounded-xl border"
              style={{
                backgroundColor: metrics.isOverBudget ? '#b91c1c' : '#15803d',
                color: '#ffffff',
                borderColor: metrics.isOverBudget ? '#991b1b' : '#166534',
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-90">
                {metrics.isOverBudget ? 'Budget Overrun / اضافی خرچ' : 'Remaining Balance / بقایا'}
              </span>
              <span className="text-base sm:text-lg font-black block mt-1 tracking-tight">
                Rs. {metrics.remainingBudget.toLocaleString()}
              </span>
              <span className="text-[10px] opacity-90 block mt-0.5">
                {metrics.isOverBudget ? 'Deficit' : 'Available Funds'}
              </span>
            </div>

            {/* Spend Ratio */}
            <div
              className="p-3.5 rounded-xl border border-slate-200"
              style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Utilization / تناسب
              </span>
              <span className="text-base sm:text-lg font-black block mt-1 tracking-tight text-slate-900">
                {metrics.percentSpent}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {metrics.filteredExpenses.length} bills • {metrics.totalLaborDays} labor days
              </span>
            </div>
          </div>
        </div>

        {/* EXPENDITURE BY CATEGORY TABLE */}
        <div className="print-avoid-break mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black tracking-wider text-slate-700 uppercase">
              Cost Breakdown by Category / شعبہ وار اخراجات
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">
              {metrics.categories.length} Active Categories
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }} className="border-b border-slate-200">
                  <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-slate-600">Category</th>
                  <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-slate-600">Urdu / تفصیل</th>
                  <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-slate-600 text-center">Entries</th>
                  <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-slate-600 text-right">Share</th>
                  <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-slate-600 text-right">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {metrics.categories.map((cat, idx) => (
                  <tr key={cat.category} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{cat.category}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">{categoryUrdu[cat.category] || '-'}</td>
                    <td className="py-2.5 px-3 text-center text-slate-700">{cat.count}</td>
                    <td className="py-2.5 px-3 text-right text-slate-700 font-medium">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="text-[11px]">{cat.percentage}%</span>
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden inline-block print:hidden">
                          <div
                            className="h-full bg-orange-600 rounded-full"
                            style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900">
                      Rs. {cat.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {metrics.categories.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500">
                      No expenses logged in this period.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#f8fafc' }} className="border-t-2 border-slate-300 font-black">
                  <td colSpan={3} className="py-2.5 px-3 text-slate-900">
                    TOTAL EXPENDITURE / کل خرچ
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-900">100%</td>
                  <td className="py-2.5 px-3 text-right text-orange-600 text-sm">
                    Rs. {metrics.totalSpent.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* DAILY LABOR MUSTER ROLL (HAZRI / DIHAADI) */}
        {includeLabor && metrics.filteredLaborLogs.length > 0 && (
          <div className="print-avoid-break mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-black tracking-wider text-slate-700 uppercase">
                Daily Labor Muster Roll (Hazri) / یومیہ حاضری و دیہاڑی
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                {metrics.filteredLaborLogs.length} Days Logged
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }} className="border-b border-slate-200">
                    <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-slate-600">Date</th>
                    <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-slate-600 text-center">Mistris (مستری)</th>
                    <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-slate-600 text-center">Mazdoors (مزدور)</th>
                    <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-slate-600">Notes / کام کی نوعیت</th>
                    <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-slate-600 text-right">Daily Cost (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {metrics.filteredLaborLogs.map((log, idx) => (
                    <tr key={log.id} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                      <td className="py-2 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {new Date(log.date).toLocaleDateString('en-PK', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-900">
                        {log.masons_count > 0 ? log.masons_count : '-'}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-900">
                        {log.laborers_count > 0 ? log.laborers_count : '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-[11px] max-w-[200px] truncate">
                        {log.notes || 'Routine site work'}
                      </td>
                      <td className="py-2 px-3 text-right font-black text-slate-900">
                        Rs. {Number(log.total_cost || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f8fafc' }} className="border-t-2 border-slate-300 font-black">
                    <td className="py-2.5 px-3 text-slate-900">TOTAL LABOR ROLL</td>
                    <td className="py-2.5 px-3 text-center text-slate-900">{metrics.totalMasons} Mistris</td>
                    <td className="py-2.5 px-3 text-center text-slate-900">{metrics.totalLaborers} Mazdoors</td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">{metrics.totalLaborDays} Total Days</td>
                    <td className="py-2.5 px-3 text-right text-orange-600 text-sm">
                      Rs. {metrics.laborSpend.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ITEMIZED SITE EXPENSES AUDIT LEDGER */}
        {includeExpenses && metrics.filteredExpenses.length > 0 && (
          <div className="print-avoid-break mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-black tracking-wider text-slate-700 uppercase">
                Itemized Site Expenses Ledger / بل و رسیدات کا اندراج
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                {metrics.filteredExpenses.length} Records
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }} className="border-b border-slate-200">
                    <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-slate-600">Date</th>
                    <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-slate-600">Category</th>
                    <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-slate-600">Description / تفصیل</th>
                    <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-slate-600 text-center">Receipt</th>
                    <th className="py-2.5 px-3 font-bold uppercase text-[10px] text-slate-600 text-right">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {metrics.filteredExpenses.map((exp, idx) => (
                    <tr key={exp.id} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                      <td className="py-2 px-3 font-medium text-slate-700 whitespace-nowrap">
                        {new Date(exp.date).toLocaleDateString('en-PK', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">{exp.category}</td>
                      <td className="py-2 px-3 text-slate-600 max-w-[240px] truncate">{exp.description || '-'}</td>
                      <td className="py-2 px-3 text-center">
                        {exp.receipt_url ? (
                          <span className="text-emerald-600 font-bold text-[10px]">Attached</span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-black text-slate-900">
                        Rs. {Number(exp.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f8fafc' }} className="border-t-2 border-slate-300 font-black">
                    <td colSpan={3} className="py-2.5 px-3 text-slate-900">TOTAL MATERIAL & SITE EXPENSES</td>
                    <td className="py-2.5 px-3 text-center text-slate-500 text-[10px]">
                      {metrics.filteredExpenses.filter((e) => !!e.receipt_url).length} receipts
                    </td>
                    <td className="py-2.5 px-3 text-right text-orange-600 text-sm">
                      Rs. {metrics.expenseSpend.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* OFFICIAL VERIFICATION & SIGN-OFF BLOCK */}
        <div className="print-avoid-break pt-8 mt-10 border-t-2 border-slate-900">
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-10">
                Prepared & Verified By (ٹھیکیدار / سائٹ انچارج)
              </p>
              <div className="border-t border-slate-400 pt-1.5 flex justify-between items-center text-slate-700">
                <span className="font-bold">Contractor Signature</span>
                <span className="text-[11px] text-slate-400">Date: ____________</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-10">
                Client / Property Owner Acknowledgment (مالک مکان)
              </p>
              <div className="border-t border-slate-400 pt-1.5 flex justify-between items-center text-slate-700">
                <span className="font-bold">Client Signature</span>
                <span className="text-[11px] text-slate-400">Date: ____________</span>
              </div>
            </div>
          </div>

          {/* System Footer Note */}
          <div className="mt-8 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>Rapido Construction Management System • Hazara Division, KPK</span>
            <span>Generated Digitally • Page 1 of 1</span>
          </div>
        </div>
      </main>
    </div>
  );
}
