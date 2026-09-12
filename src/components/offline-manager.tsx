'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  WifiOff,
  Wifi,
  RefreshCw,
  CheckCircle2,
  CloudUpload,
  X,
  Edit3,
  Trash2,
  Folder,
  Receipt,
  Check,
} from 'lucide-react';
import {
  getDraftProjects,
  getDraftExpenses,
  removeDraftProject,
  removeDraftExpense,
  updateDraftProject,
  updateDraftExpense,
  getTotalPendingDraftsCount,
  type DraftProject,
  type DraftExpense,
} from '@/lib/offline-store';
import { createProject, createExpense } from '@/lib/actions';

export function OfflineManager() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [pendingDraftsCount, setPendingDraftsCount] = useState(0);

  // Drafts Inspection Modal State
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [draftProjects, setDraftProjects] = useState<DraftProject[]>([]);
  const [draftExpenses, setDraftExpenses] = useState<DraftExpense[]>([]);

  // Editing draft state
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [editProjName, setEditProjName] = useState('');
  const [editProjBudget, setEditProjBudget] = useState('');

  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editExpAmount, setEditExpAmount] = useState('');
  const [editExpDesc, setEditExpDesc] = useState('');

  const refreshDrafts = useCallback(() => {
    const projects = getDraftProjects();
    const expenses = getDraftExpenses();
    setDraftProjects(projects);
    setDraftExpenses(expenses);
    setPendingDraftsCount(projects.length + expenses.length);
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
    refreshDrafts();
    setIsSyncing(false);

    if (totalSynced > 0) {
      setSyncStatusMsg(
        `Successfully synced ${totalSynced} offline draft${totalSynced === 1 ? '' : 's'} to database!`
      );
      startTransition(() => {
        router.refresh();
      });
      setTimeout(() => {
        setSyncStatusMsg(null);
      }, 4000);
    } else {
      setSyncStatusMsg(null);
    }
  }, [router, startTransition, refreshDrafts]);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Rapido Service Worker registered:', registration.scope);
        })
        .catch((err) => {
          console.warn('Rapido Service Worker registration failed:', err);
        });
    }

    // 2. Initial online status & drafts
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }
    refreshDrafts();

    // 3. Online/offline event listeners
    const handleOnline = () => {
      setIsOffline(false);
      setSyncStatusMsg('Connection restored! Syncing your drafts...');
      syncDrafts();
    };

    const handleOffline = () => {
      setIsOffline(true);
      refreshDrafts();
    };

    const handleStorage = () => {
      refreshDrafts();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('rapido-draft-updated', refreshDrafts);

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      syncDrafts();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('rapido-draft-updated', refreshDrafts);
    };
  }, [syncDrafts, refreshDrafts]);

  // Handle Project Draft Edit
  const handleStartEditProj = (p: DraftProject) => {
    setEditingProjId(p.tempId);
    setEditProjName(p.name);
    setEditProjBudget(String(p.total_budget));
  };

  const handleSaveEditProj = (tempId: string) => {
    const budgetNum = Number(editProjBudget);
    if (!editProjName.trim() || isNaN(budgetNum) || budgetNum <= 0) return;
    updateDraftProject(tempId, {
      name: editProjName.trim(),
      total_budget: budgetNum,
    });
    setEditingProjId(null);
    refreshDrafts();
  };

  const handleDeleteProj = (tempId: string) => {
    removeDraftProject(tempId);
    refreshDrafts();
  };

  // Handle Expense Draft Edit
  const handleStartEditExp = (e: DraftExpense) => {
    setEditingExpId(e.tempId);
    setEditExpAmount(String(e.amount));
    setEditExpDesc(e.description || '');
  };

  const handleSaveEditExp = (tempId: string) => {
    const amountNum = Number(editExpAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    updateDraftExpense(tempId, {
      amount: amountNum,
      description: editExpDesc.trim() || undefined,
    });
    setEditingExpId(null);
    refreshDrafts();
  };

  const handleDeleteExp = (tempId: string) => {
    removeDraftExpense(tempId);
    refreshDrafts();
  };

  return (
    <>
      {/* 1. Sync Notification Banner */}
      {syncStatusMsg && (
        <div className="fixed top-2 inset-x-3 max-w-md mx-auto z-[9999] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-emerald-950/95 backdrop-blur-md text-white border-2 border-emerald-500 rounded-2xl p-2.5 shadow-xl flex items-center justify-between gap-2.5">
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
                className="text-emerald-300 hover:text-white text-xs font-black px-2 py-1 cursor-pointer"
              >
                OK
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Offline Banner — Clean, single-line without overflowing */}
      {isOffline && !syncStatusMsg && (
        <div className="fixed top-2 inset-x-3 max-w-md mx-auto z-[9999] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-amber-950/95 backdrop-blur-md text-amber-100 border-2 border-amber-500 rounded-2xl p-2.5 shadow-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <WifiOff className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <p className="text-xs font-black text-amber-200 truncate">
                Offline · Limited Features
              </p>
            </div>

            {pendingDraftsCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  refreshDrafts();
                  setShowDraftsModal(true);
                }}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 tap-scale cursor-pointer"
              >
                {pendingDraftsCount} Draft{pendingDraftsCount === 1 ? '' : 's'} (View/Edit)
              </button>
            ) : (
              <span className="text-[10px] font-bold text-amber-400/80 shrink-0">
                Cached data
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. Online Banner when drafts are queued */}
      {!isOffline && pendingDraftsCount > 0 && !syncStatusMsg && (
        <div className="fixed top-2 inset-x-3 max-w-md mx-auto z-[9999] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white border-2 border-orange-500 rounded-2xl p-2.5 shadow-xl flex items-center justify-between gap-2">
            <div
              onClick={() => {
                refreshDrafts();
                setShowDraftsModal(true);
              }}
              className="flex items-center gap-2 min-w-0 cursor-pointer"
            >
              <CloudUpload className="h-4 w-4 text-orange-400 shrink-0" />
              <p className="text-xs font-bold text-slate-200 truncate">
                {pendingDraftsCount} draft{pendingDraftsCount === 1 ? '' : 's'} ready to upload
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  refreshDrafts();
                  setShowDraftsModal(true);
                }}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg cursor-pointer"
              >
                View
              </button>
              <button
                type="button"
                onClick={syncDrafts}
                disabled={isSyncing}
                className="px-3 py-1 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
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
        </div>
      )}

      {/* 4. Offline Drafts Inspection & Edit Drawer */}
      {showDraftsModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 max-h-[85dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                    📝
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Offline Drafts Queue
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-500">
                      {draftProjects.length + draftExpenses.length} pending items stored locally
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDraftsModal(false)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drafts List */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {/* Project Drafts */}
                {draftProjects.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Folder className="h-3.5 w-3.5 text-orange-600" />
                      Projects ({draftProjects.length})
                    </h4>
                    <div className="space-y-2">
                      {draftProjects.map((proj) => {
                        const isEditing = editingProjId === proj.tempId;
                        return (
                          <div
                            key={proj.tempId}
                            className="p-3 rounded-xl border-2 border-slate-200 bg-white shadow-2xs space-y-2"
                          >
                            {isEditing ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editProjName}
                                  onChange={(e) => setEditProjName(e.target.value)}
                                  className="w-full h-9 px-2 text-xs font-bold border rounded-lg"
                                  placeholder="Project Name"
                                />
                                <input
                                  type="number"
                                  value={editProjBudget}
                                  onChange={(e) => setEditProjBudget(e.target.value)}
                                  className="w-full h-9 px-2 text-xs font-bold border rounded-lg"
                                  placeholder="Budget in PKR"
                                />
                                <div className="flex justify-end gap-1.5 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingProjId(null)}
                                    className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditProj(proj.tempId)}
                                    className="px-3 py-1 text-xs font-black bg-emerald-600 text-white rounded-lg flex items-center gap-1"
                                  >
                                    <Check className="h-3 w-3" /> Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-xs font-black text-slate-900">
                                    {proj.name}
                                  </p>
                                  <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                                    {proj.type} · Rs. {proj.total_budget.toLocaleString('en-PK')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditProj(proj)}
                                    className="w-7 h-7 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                                    title="Edit Draft"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProj(proj.tempId)}
                                    className="w-7 h-7 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                                    title="Delete Draft"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Expense Drafts */}
                {draftExpenses.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Receipt className="h-3.5 w-3.5 text-orange-600" />
                      Expenses ({draftExpenses.length})
                    </h4>
                    <div className="space-y-2">
                      {draftExpenses.map((exp) => {
                        const isEditing = editingExpId === exp.tempId;
                        return (
                          <div
                            key={exp.tempId}
                            className="p-3 rounded-xl border-2 border-slate-200 bg-white shadow-2xs space-y-2"
                          >
                            {isEditing ? (
                              <div className="space-y-2">
                                <input
                                  type="number"
                                  value={editExpAmount}
                                  onChange={(e) => setEditExpAmount(e.target.value)}
                                  className="w-full h-9 px-2 text-xs font-bold border rounded-lg"
                                  placeholder="Amount in PKR"
                                />
                                <input
                                  type="text"
                                  value={editExpDesc}
                                  onChange={(e) => setEditExpDesc(e.target.value)}
                                  className="w-full h-9 px-2 text-xs font-bold border rounded-lg"
                                  placeholder="Description / Note"
                                />
                                <div className="flex justify-end gap-1.5 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingExpId(null)}
                                    className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditExp(exp.tempId)}
                                    className="px-3 py-1 text-xs font-black bg-emerald-600 text-white rounded-lg flex items-center gap-1"
                                  >
                                    <Check className="h-3 w-3" /> Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-xs font-black text-slate-900">
                                    Rs. {exp.amount.toLocaleString('en-PK')}
                                  </p>
                                  <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                                    {exp.category} · {exp.projectName || 'Project'}
                                  </p>
                                  {exp.description && (
                                    <p className="text-[10px] text-slate-400 italic">
                                      &ldquo;{exp.description}&rdquo;
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditExp(exp)}
                                    className="w-7 h-7 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                                    title="Edit Draft"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteExp(exp.tempId)}
                                    className="w-7 h-7 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                                    title="Delete Draft"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {draftProjects.length === 0 && draftExpenses.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-xs font-bold text-slate-500">
                      No pending offline drafts.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      New projects or expenses created while offline will appear here.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500">
                  {isOffline ? 'Syncs automatically once online.' : 'Connected to database.'}
                </p>
                {!isOffline && (draftProjects.length > 0 || draftExpenses.length > 0) && (
                  <button
                    type="button"
                    onClick={syncDrafts}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSyncing ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CloudUpload className="h-3.5 w-3.5" />
                    )}
                    Sync All Drafts
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
