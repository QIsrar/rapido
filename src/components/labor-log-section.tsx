'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  HardHat,
  Users,
  Plus,
  Minus,
  Calendar,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coins,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  Filter,
  ArrowUpDown,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPKR, withTimeout, getLocalDateString } from '@/lib/utils';
import { createLaborLog, deleteLaborLog } from '@/lib/actions';
import { type LaborLog } from '@/types/database';
import { useAuth } from './auth-context';

interface LaborLogSectionProps {
  projectId: string;
  projectName: string;
  initialLogs: LaborLog[];
  isCompleted: boolean;
}

export function LaborLogSection({
  projectId,
  projectName,
  initialLogs = [],
  isCompleted,
}: LaborLogSectionProps) {
  const router = useRouter();
  const { isGuest, openAuthModal } = useAuth();
  const [logs, setLogs] = useState<LaborLog[]>(initialLogs);
  const [isPending, startTransition] = useTransition();

  // Headcount form state (Local timezone: advances at 12:00 AM midnight)
  const todayStr = getLocalDateString();
  const [date, setDate] = useState(todayStr);
  const [masonsCount, setMasonsCount] = useState(0);
  const [laborersCount, setLaborersCount] = useState(0);
  const [dailyRateMason, setDailyRateMason] = useState(2500);
  const [dailyRateLaborer, setDailyRateLaborer] = useState(1500);
  const [notes, setNotes] = useState('');
  const [showRateSettings, setShowRateSettings] = useState(false);

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [logToDelete, setLogToDelete] = useState<LaborLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtering & Sorting State
  const [filterCrew, setFilterCrew] = useState<'all' | 'masons' | 'laborers'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'amount_desc' | 'amount_asc'>('recent');

  // Computed total cost for current input
  const currentTotalCost =
    masonsCount * dailyRateMason + laborersCount * dailyRateLaborer;
  const totalHeadcount = masonsCount + laborersCount;

  // Cumulative statistics for this project
  const cumulativeLaborCost = logs.reduce((sum, l) => sum + (Number(l.total_cost) || 0), 0);
  const totalManDays = logs.reduce(
    (sum, l) => sum + (Number(l.masons_count) || 0) + (Number(l.laborers_count) || 0),
    0
  );

  const handleMasonChange = (delta: number) => {
    setMasonsCount((prev) => Math.max(0, prev + delta));
    setErrorMsg(null);
  };

  const handleLaborerChange = (delta: number) => {
    setLaborersCount((prev) => Math.max(0, prev + delta));
    setErrorMsg(null);
  };

  const handleSaveLaborLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isGuest) {
      openAuthModal('signin');
      return;
    }

    if (isCompleted) {
      setErrorMsg('This project is completed and sealed. New labor logs cannot be added.');
      return;
    }

    if (masonsCount === 0 && laborersCount === 0) {
      setErrorMsg('Please enter at least one mason or laborer before saving.');
      return;
    }

    setIsSaving(true);

    try {
      const res = await withTimeout(
        createLaborLog({
          projectId,
          date,
          masonsCount,
          laborersCount,
          dailyRateMason,
          dailyRateLaborer,
          notes: notes.trim() || undefined,
        }),
        15000,
        'Request timed out. Please check your internet connection.'
      );

      if (!res.success || !res.data) {
        setErrorMsg(res.error || 'Failed to save labor attendance.');
        setIsSaving(false);
        return;
      }

      // Optimistic update
      const newEntry: LaborLog = res.data;
      setLogs((prev) => [newEntry, ...prev.filter((item) => item.id !== newEntry.id)]);

      // Reset headcount and notes
      setMasonsCount(0);
      setLaborersCount(0);
      setNotes('');
      setSuccessMsg(
        `Logged ${totalHeadcount} workers for ${formatPKR(currentTotalCost)} successfully!`
      );

      startTransition(() => {
        router.refresh();
      });

      // Clear success message after 4 seconds
      setTimeout(() => {
        setSuccessMsg(null);
      }, 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error recording labor attendance.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!logToDelete) return;

    if (isGuest) {
      openAuthModal('signin');
      return;
    }

    if (isCompleted) return;

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const res = await withTimeout(
        deleteLaborLog(logToDelete.id, projectId),
        12000,
        'Request timed out deleting labor log.'
      );

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to delete labor log.');
      } else {
        const deletedId = logToDelete.id;
        setLogs((prev) => prev.filter((l) => l.id !== deletedId));
        setLogToDelete(null);
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete labor log.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter and sort the attendance logs
  const filteredAndSortedLogs = [...logs]
    .filter((log) => {
      if (filterCrew === 'masons') return log.masons_count > 0;
      if (filterCrew === 'laborers') return log.laborers_count > 0;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'amount_desc') {
        return Number(b.total_cost) - Number(a.total_cost);
      }
      if (sortBy === 'amount_asc') {
        return Number(a.total_cost) - Number(b.total_cost);
      }
      // default: recent entries first
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  return (
    <div className="space-y-5 animate-slide-up relative">
      {/* 
        Full Screen Non-Clickable Overlay when Saving:
        Freezes the entire screen so user cannot tap anything until completion.
      */}
      {isSaving && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white pointer-events-auto select-none animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-xs space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-600/30">
              <Loader2 className="w-7 h-7 animate-spin stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Saving Today&apos;s Attendance...</h3>
              <p className="text-xs text-slate-400 mt-1">
                Screen is locked until attendance muster roll is recorded safely.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 
        Custom Modal Confirmation Dialog for Deleting Labor Log:
        Replaces standard browser confirm() alert.
      */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 space-y-4 animate-in zoom-in-95 duration-150 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-red-600" />

            <div className="flex items-start justify-between pt-1">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border-2 border-red-200 text-red-600 flex items-center justify-center shadow-xs">
                <Trash2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <button
                type="button"
                onClick={() => setLogToDelete(null)}
                disabled={isDeleting}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900">
                Delete Attendance Record?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete attendance for{' '}
                <strong className="text-slate-900">
                  {new Date(logToDelete.date).toLocaleDateString('en-PK', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </strong>
                ? This will remove{' '}
                <strong className="text-slate-900">
                  {logToDelete.masons_count + logToDelete.laborers_count} workers ({formatPKR(logToDelete.total_cost)})
                </strong>{' '}
                from this project.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-2.5 text-amber-900 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>This action cannot be undone and will deduct the wages from project spent.</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setLogToDelete(null)}
                disabled={isDeleting}
                className="w-full py-2.5 px-3 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-black text-white shadow-md shadow-red-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overview Metric Banners */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 shadow-2xs">
          <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            <span>Total Labor Cost</span>
          </div>
          <p className="text-base sm:text-lg font-black text-slate-900 mt-1">
            {formatPKR(cumulativeLaborCost)}
          </p>
          <p className="text-[11px] text-amber-700 font-medium mt-0.5">
            Across {logs.length} logged {logs.length === 1 ? 'day' : 'days'}
          </p>
        </Card>

        <Card className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 shadow-2xs">
          <div className="flex items-center gap-1.5 text-blue-800 text-xs font-bold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Total Man-Days</span>
          </div>
          <p className="text-base sm:text-lg font-black text-slate-900 mt-1">
            {totalManDays} <span className="text-xs font-bold text-slate-500">Hazri</span>
          </p>
          <p className="text-[11px] text-blue-700 font-medium mt-0.5">
            {logs.length > 0
              ? `Avg ${(totalManDays / logs.length).toFixed(1)} workers / day`
              : 'No attendance yet'}
          </p>
        </Card>
      </div>

      {/* Daily Attendance Form Card */}
      {!isCompleted ? (
        <Card className="p-4 sm:p-5 bg-white border border-slate-200 shadow-elevated rounded-2xl relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <HardHat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Log Today&apos;s Attendance (Hazri)
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Tap + or - to adjust daily on-site headcount
                </p>
              </div>
            </div>

            {/* Date Picker: Standard frozen beyond current date */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                value={date}
                max={todayStr}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                title="Calendar is locked to today or past dates (future attendance is restricted)"
              />
            </div>
          </div>

          <form onSubmit={handleSaveLaborLog} className="space-y-4">
            {/* Error & Success alerts */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-bold">{successMsg}</span>
              </div>
            )}

            {/* Steppers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Masons (Mistri) Stepper - 'Raj' replaced per instructions */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/90 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👷</span>
                    <div>
                      <span className="text-xs font-black text-slate-900 block leading-tight">
                        Masons (Mistri)
                      </span>
                      <span className="text-[10px] font-semibold text-amber-700">
                        @{formatPKR(dailyRateMason)}/day
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-white border-amber-200 text-amber-800 font-bold text-[10px]">
                    Subtotal: {formatPKR(masonsCount * dailyRateMason)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between bg-white rounded-xl border border-amber-200/80 p-1.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleMasonChange(-1)}
                    disabled={masonsCount <= 0 || isSaving}
                    aria-label="Decrease masons count"
                    className="w-11 h-11 rounded-lg bg-amber-100/70 hover:bg-amber-200 text-amber-900 font-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all tap-scale cursor-pointer"
                  >
                    <Minus className="w-5 h-5 stroke-[2.5]" />
                  </button>

                  <div className="text-center px-4">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                      {masonsCount}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                      Headcount
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleMasonChange(1)}
                    disabled={isSaving}
                    aria-label="Increase masons count"
                    className="w-11 h-11 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black flex items-center justify-center active:scale-95 transition-all tap-scale cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Laborers (Mazdoor) Stepper */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/90 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔨</span>
                    <div>
                      <span className="text-xs font-black text-slate-900 block leading-tight">
                        Laborers (Mazdoor)
                      </span>
                      <span className="text-[10px] font-semibold text-blue-700">
                        @{formatPKR(dailyRateLaborer)}/day
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-white border-blue-200 text-blue-800 font-bold text-[10px]">
                    Subtotal: {formatPKR(laborersCount * dailyRateLaborer)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between bg-white rounded-xl border border-blue-200/80 p-1.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleLaborerChange(-1)}
                    disabled={laborersCount <= 0 || isSaving}
                    aria-label="Decrease laborers count"
                    className="w-11 h-11 rounded-lg bg-blue-100/70 hover:bg-blue-200 text-blue-900 font-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all tap-scale cursor-pointer"
                  >
                    <Minus className="w-5 h-5 stroke-[2.5]" />
                  </button>

                  <div className="text-center px-4">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                      {laborersCount}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                      Headcount
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLaborerChange(1)}
                    disabled={isSaving}
                    aria-label="Increase laborers count"
                    className="w-11 h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center justify-center active:scale-95 transition-all tap-scale cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Daily Wage Calculation Summary Banner */}
            <div className="p-3 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Today&apos;s Estimated Wage</span>
                  <span>•</span>
                  <span>{totalHeadcount} Workers Total</span>
                </div>
                <div className="text-lg sm:text-xl font-black text-amber-400 tracking-tight">
                  {formatPKR(currentTotalCost)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRateSettings(!showRateSettings)}
                disabled={isSaving}
                className="text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700 tap-scale transition-colors cursor-pointer"
              >
                <span>Edit Daily Rates</span>
                {showRateSettings ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Collapsible Daily Rate Settings */}
            {showRateSettings && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in text-xs">
                <div className="flex items-center justify-between text-slate-600 font-bold">
                  <span>Custom Daily Dihaadi Rates (PKR)</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Adjusts calculations for this entry
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Mason Rate (Mistri)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">
                        Rs.
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={dailyRateMason}
                        onChange={(e) => setDailyRateMason(Math.max(0, Number(e.target.value)))}
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Laborer Rate (Mazdoor)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">
                        Rs.
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={dailyRateLaborer}
                        onChange={(e) => setDailyRateLaborer(Math.max(0, Number(e.target.value)))}
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Optional Site Task / Notes */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Work Description / Notes (Optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Ground floor slab shuttering, brickwork on east wall"
                maxLength={140}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isSaving || (masonsCount === 0 && laborersCount === 0)}
              className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all tap-scale cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording Attendance...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    Save Attendance {totalHeadcount > 0 ? `(${totalHeadcount} Workers • ${formatPKR(currentTotalCost)})` : ''}
                  </span>
                </>
              )}
            </button>
          </form>
        </Card>
      ) : (
        <Card className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 text-slate-600 text-xs font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>This project is marked completed and sealed. Labor records cannot be modified.</span>
        </Card>
      )}

      {/* Attendance History Section with Filter & Sort */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Attendance History ({filteredAndSortedLogs.length})</span>
          </h4>

          {/* Filter and Sort controls */}
          {logs.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Pills */}
              <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setFilterCrew('all')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    filterCrew === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCrew('masons')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    filterCrew === 'masons'
                      ? 'bg-white text-amber-900 shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Only Mistris
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCrew('laborers')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    filterCrew === 'laborers'
                      ? 'bg-white text-blue-900 shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Only Mazdoors
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative inline-flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1 text-[10px] font-bold text-slate-700 shadow-2xs">
                <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as 'recent' | 'oldest' | 'amount_desc' | 'amount_asc')
                  }
                  className="bg-transparent text-[10px] font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="recent">Recent entries</option>
                  <option value="oldest">Oldest entries</option>
                  <option value="amount_desc">Highest amount</option>
                  <option value="amount_asc">Lowest amount</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {filteredAndSortedLogs.length === 0 ? (
          <Card className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-2.5">
              <HardHat className="w-6 h-6" />
            </div>
            <p className="text-sm font-black text-slate-800">
              {logs.length === 0 ? 'No Labor Logs Yet' : 'No entries matching filter'}
            </p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              {logs.length === 0
                ? 'Keep track of daily mistris and mazdoors headcount above. Total daily wages will be computed and counted in spent automatically.'
                : 'Try switching the filter to "All" to view previous attendance logs.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredAndSortedLogs.map((log) => {
              const formattedDate = new Date(log.date).toLocaleDateString('en-PK', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <Card
                  key={log.id}
                  className="p-3.5 bg-white border border-slate-200 shadow-2xs rounded-2xl hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Date & Day */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-900">
                          {formattedDate}
                        </span>
                        {log.date === todayStr && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] px-1.5 py-0 font-bold">
                            Today
                          </Badge>
                        )}
                      </div>

                      {/* Headcount Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {log.masons_count > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-800 border-amber-200 text-[11px] font-bold px-2 py-0.5"
                          >
                            👷 {log.masons_count} {log.masons_count === 1 ? 'Mason (Mistri)' : 'Masons (Mistri)'}
                          </Badge>
                        )}

                        {log.laborers_count > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-800 border-blue-200 text-[11px] font-bold px-2 py-0.5"
                          >
                            🔨 {log.laborers_count} {log.laborers_count === 1 ? 'Laborer (Mazdoor)' : 'Laborers (Mazdoor)'}
                          </Badge>
                        )}

                        <span className="text-[11px] font-semibold text-slate-400">
                          ({log.masons_count + log.laborers_count} total crew)
                        </span>
                      </div>

                      {/* Notes if any */}
                      {log.notes && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 mt-1 font-medium">
                          {log.notes}
                        </p>
                      )}
                    </div>

                    {/* Total Cost & Delete Modal Trigger */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-sm font-black text-slate-900 tracking-tight">
                        {formatPKR(log.total_cost)}
                      </span>

                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() => setLogToDelete(log)}
                          aria-label="Delete labor log entry"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer tap-scale"
                          title="Delete this attendance record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
