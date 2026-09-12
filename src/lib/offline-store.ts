'use client';

import type { ProjectType, ExpenseCategory, ProjectWithExpenses } from '@/types/database';

export interface DraftProject {
  tempId: string;
  name: string;
  type: ProjectType;
  total_budget: number;
  location?: string;
  created_at: string;
}

export interface DraftExpense {
  tempId: string;
  project_id: string;
  projectName?: string;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  created_at: string;
}

const PROJECT_DRAFTS_KEY = 'rapido_offline_project_drafts_v1';
const EXPENSE_DRAFTS_KEY = 'rapido_offline_expense_drafts_v1';
const CACHED_PROJECTS_KEY = 'rapido_cached_projects_v1';

/**
 * Save a newly created project as an offline draft.
 */
export function saveDraftProject(project: Omit<DraftProject, 'tempId' | 'created_at'>): DraftProject {
  const drafts = getDraftProjects();
  const newDraft: DraftProject = {
    ...project,
    tempId: 'draft-p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    created_at: new Date().toISOString(),
  };
  drafts.unshift(newDraft);
  try {
    localStorage.setItem(PROJECT_DRAFTS_KEY, JSON.stringify(drafts));
  } catch (e) {
    console.warn('Failed to save project draft to localStorage:', e);
  }
  return newDraft;
}

/**
 * Retrieve all pending offline project drafts.
 */
export function getDraftProjects(): DraftProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PROJECT_DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Update an existing project draft.
 */
export function updateDraftProject(tempId: string, updates: Partial<DraftProject>): void {
  const drafts = getDraftProjects().map((d) =>
    d.tempId === tempId ? { ...d, ...updates } : d
  );
  try {
    localStorage.setItem(PROJECT_DRAFTS_KEY, JSON.stringify(drafts));
  } catch {}
}

/**
 * Remove a synced project draft.
 */
export function removeDraftProject(tempId: string): void {
  const drafts = getDraftProjects().filter((d) => d.tempId !== tempId);
  try {
    localStorage.setItem(PROJECT_DRAFTS_KEY, JSON.stringify(drafts));
  } catch {}
}

/**
 * Save a newly recorded expense as an offline draft.
 */
export function saveDraftExpense(expense: Omit<DraftExpense, 'tempId' | 'created_at'>): DraftExpense {
  const drafts = getDraftExpenses();
  const newDraft: DraftExpense = {
    ...expense,
    tempId: 'draft-e-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    created_at: new Date().toISOString(),
  };
  drafts.unshift(newDraft);
  try {
    localStorage.setItem(EXPENSE_DRAFTS_KEY, JSON.stringify(drafts));
  } catch (e) {
    console.warn('Failed to save expense draft to localStorage:', e);
  }
  return newDraft;
}

/**
 * Retrieve all pending offline expense drafts.
 */
export function getDraftExpenses(): DraftExpense[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(EXPENSE_DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Update an existing expense draft.
 */
export function updateDraftExpense(tempId: string, updates: Partial<DraftExpense>): void {
  const drafts = getDraftExpenses().map((d) =>
    d.tempId === tempId ? { ...d, ...updates } : d
  );
  try {
    localStorage.setItem(EXPENSE_DRAFTS_KEY, JSON.stringify(drafts));
  } catch {}
}

/**
 * Remove a synced expense draft.
 */
export function removeDraftExpense(tempId: string): void {
  const drafts = getDraftExpenses().filter((d) => d.tempId !== tempId);
  try {
    localStorage.setItem(EXPENSE_DRAFTS_KEY, JSON.stringify(drafts));
  } catch {}
}

/**
 * Cache projects locally for offline browsing.
 */
export function cacheProjectsLocally(projects: ProjectWithExpenses[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHED_PROJECTS_KEY, JSON.stringify(projects));
  } catch {}
}

/**
 * Retrieve cached projects for offline browsing.
 */
export function getCachedProjectsLocally(): ProjectWithExpenses[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CACHED_PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Count total pending drafts.
 */
export function getTotalPendingDraftsCount(): number {
  return getDraftProjects().length + getDraftExpenses().length;
}
