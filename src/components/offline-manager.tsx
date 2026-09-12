'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react';
import {
  getDraftProjects,
  getDraftExpenses,
  removeDraftProject,
  removeDraftExpense,
  getTotalPendingDraftsCount,
} from '@/lib/offline-store';
import { createProject, createExpense } from '@/lib/actions';

export function OfflineManager() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [pendingDraftsCount, setPendingDraftsCount] = useState(0);

  const updateDraftCount = useCallback(() => {
    setPendingDraftsCount(getTotalPendingDraftsCount());
  }, []);

  const syncDrafts = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    const projects = getDraftProjects();
    const expenses = getDraftExpenses();

    if (projects.length === 0 && expenses.length === 0) {
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg('Syncing offline drafts with cloud database...');

    let syncedProjectsCount = 0;
    let syncedExpensesCount = 0;

    // 1. Sync projects first
    for (const proj of projects) {
      try {
        const res = await createProject({
          name: proj.name,
          type: proj.type,
          total_budget: proj.total_budget,
          location: proj.location,
        });
        if (res.success) {
          removeDraftProject(proj.tempId);
          syncedProjectsCount++;
        }
      } catch (err) {
        console.warn('Draft project sync skipped:', err);
      }
    }

    // 2. Sync expenses
    for (const exp of expenses) {
      try {
        const res = await createExpense({
          project_id: exp.project_id,
          amount: exp.amount,
          category: exp.category,
          description: exp.description,
        });
        if (res.success) {
          removeDraftExpense(exp.tempId);
          syncedExpensesCount++;
        }
      } catch (err) {
        console.warn('Draft expense sync skipped:', err);
      }
    }

    const totalSynced = syncedProjectsCount + syncedExpensesCount;
    updateDraftCount();
    setIsSyncing(false);

    if (totalSynced > 0) {
      setSyncStatusMsg(`Successfully synced ${totalSynced} offline draft${totalSynced === 1 ? '' : 's'} to cloud database!`);
      startTransition(() => {
        router.refresh();
      });
      setTimeout(() => {
        setSyncStatusMsg(null);
      }, 4500);
    } else {
      setSyncStatusMsg(null);
    }
  }, [router, startTransition, updateDraftCount]);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Rapido Service Worker registered with scope:', registration.scope);
        })
        .catch((err) => {
          console.warn('Rapido Service Worker registration failed:', err);
        });
    }

    // 2. Initial online status & drafts
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }
    updateDraftCount();

    // 3. Online/offline event listeners
    const handleOnline = () => {
      setIsOffline(false);
      setSyncStatusMsg('Connection restored! Syncing your drafts...');
      syncDrafts();
    };

    const handleOffline = () => {
      setIsOffline(true);
      updateDraftCount();
    };

    const handleStorage = () => {
      updateDraftCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('rapido-draft-updated', updateDraftCount);

    // If online on initial mount with pending drafts, sync them
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      syncDrafts();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('rapido-draft-updated', updateDraftCount);
    };
  }, [syncDrafts, updateDraftCount]);

  // Sync notification banner
  if (syncStatusMsg) {
    return (
      <div className="fixed top-2 inset-x-3 max-w-md mx-auto z-[9999] animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="bg-emerald-900/95 backdrop-blur-md text-white border-2 border-emerald-500 rounded-2xl p-3 shadow-xl flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 text-emerald-300 animate-spin shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
            )}
            <p className="text-xs font-bold text-emerald-100 truncate">
              {syncStatusMsg}
            </p>
          </div>
          {!isSyncing && (
            <button
              type="button"
              onClick={() => setSyncStatusMsg(null)}
              className="text-emerald-300 hover:text-white text-xs font-bold px-2 py-1"
            >
              OK
            </button>
          )}
        </div>
      </div>
    );
  }

  // Offline banner
  if (isOffline) {
    return (
      <div className="fixed top-2 inset-x-3 max-w-md mx-auto z-[9999] animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="bg-amber-950/95 backdrop-blur-md text-amber-100 border-2 border-amber-500 rounded-2xl p-3 shadow-xl flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <WifiOff className="h-4 w-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-amber-200 flex items-center gap-1.5">
                No Internet Connection
                {pendingDraftsCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black">
                    {pendingDraftsCount} Draft{pendingDraftsCount === 1 ? '' : 's'}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-amber-300/80 leading-tight truncate">
                Limited features: viewing cached projects. New entries save as drafts.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Online with unsynced drafts button indicator (rare edge case if auto-sync failed)
  if (pendingDraftsCount > 0) {
    return (
      <div className="fixed top-2 inset-x-3 max-w-md mx-auto z-[9999] animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="bg-slate-900/95 backdrop-blur-md text-white border-2 border-orange-500 rounded-2xl p-2.5 shadow-xl flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <CloudUpload className="h-4 w-4 text-orange-400 shrink-0" />
            <p className="text-xs font-bold text-slate-200">
              {pendingDraftsCount} offline draft{pendingDraftsCount === 1 ? '' : 's'} ready to upload
            </p>
          </div>
          <button
            type="button"
            onClick={syncDrafts}
            disabled={isSyncing}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-black rounded-lg transition-all flex items-center gap-1.5 shrink-0"
          >
            {isSyncing ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Wifi className="h-3 w-3" />
            )}
            Sync Now
          </button>
        </div>
      </div>
    );
  }

  return null;
}
