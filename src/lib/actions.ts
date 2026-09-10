'use server';

import { revalidatePath } from 'next/cache';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  type Project,
  type Expense,
  type ProjectWithExpenses,
  type ProjectType,
  type ExpenseCategory,
  PROJECT_TYPES,
  EXPENSE_CATEGORIES,
} from '@/types/database';
import {
  projects as fallbackProjects,
  expenses as fallbackExpenses,
} from './placeholder-data';

/**
 * Fetch all projects from Supabase with their associated expenses and calculated total_spent.
 * Falls back gracefully to seed data if Supabase tables have not been created yet.
 */
export async function getProjects(): Promise<{
  projects: ProjectWithExpenses[];
  isLive: boolean;
}> {
  try {
    if (!isSupabaseConfigured) {
      return {
        projects: getFallbackProjectsWithExpenses(),
        isLive: false,
      };
    }
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.warn('Supabase projects query notice:', projectsError.message);
      // Fallback to placeholder data
      return {
        projects: getFallbackProjectsWithExpenses(),
        isLive: false,
      };
    }

    let { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .is('deleted_at', null)
      .order('date', { ascending: false });

    // Backward-compatible fallback if deleted_at column does not exist yet in Supabase
    if (expensesError && expensesError.message?.includes('deleted_at')) {
      const retry = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      expensesData = retry.data;
      expensesError = retry.error;
    }

    const expensesList: Expense[] = expensesError || !expensesData ? [] : expensesData;

    const merged: ProjectWithExpenses[] = (projectsData || []).map((project: Project) => {
      const pExpenses = expensesList.filter((e) => e.project_id === project.id);
      const total_spent = pExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      return {
        ...project,
        expenses: pExpenses,
        total_spent,
      };
    });

    return {
      projects: merged,
      isLive: true,
    };
  } catch (err) {
    console.error('getProjects error:', err);
    return {
      projects: getFallbackProjectsWithExpenses(),
      isLive: false,
    };
  }
}

/**
 * Fetch a single project with its expenses by ID.
 */
export async function getProjectById(
  id: string
): Promise<ProjectWithExpenses | null> {
  try {
    if (!isSupabaseConfigured) {
      const fallback = getFallbackProjectsWithExpenses().find((p) => p.id === id);
      return fallback || null;
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      // Check fallback data
      const fallback = getFallbackProjectsWithExpenses().find((p) => p.id === id);
      return fallback || null;
    }

    let { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('project_id', id)
      .is('deleted_at', null)
      .order('date', { ascending: false });

    // Backward-compatible fallback if deleted_at column does not exist yet in Supabase
    if (expensesError && expensesError.message?.includes('deleted_at')) {
      const retry = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', id)
        .order('date', { ascending: false });
      expenses = retry.data;
      expensesError = retry.error;
    }

    const pExpenses: Expense[] = expensesError || !expenses ? [] : expenses;
    const total_spent = pExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      ...project,
      expenses: pExpenses,
      total_spent,
    };
  } catch (err) {
    console.error('getProjectById error:', err);
    const fallback = getFallbackProjectsWithExpenses().find((p) => p.id === id);
    return fallback || null;
  }
}

/**
 * Create a new project.
 * Automatically sets `start_date` to now and status to 'active'.
 */
export async function createProject(formData: {
  name: string;
  type: ProjectType;
  total_budget: number;
}): Promise<{ success: boolean; data?: Project; error?: string }> {
  try {
    const name = formData.name?.trim();
    if (!name) {
      return { success: false, error: 'Project name is required.' };
    }
    const budget = Number(formData.total_budget);
    if (isNaN(budget) || budget <= 0) {
      return { success: false, error: 'Total budget must be a positive number.' };
    }
    if (!PROJECT_TYPES.includes(formData.type)) {
      return { success: false, error: 'Invalid project type.' };
    }

    const now = new Date().toISOString();
    const newProject = {
      name,
      type: formData.type,
      total_budget: budget,
      status: 'active',
      start_date: now,
      created_at: now,
    };

    const { data, error } = await supabase
      .from('projects')
      .insert([newProject])
      .select()
      .single();

    if (error) {
      console.error('createProject error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/projects');
    return { success: true, data };
  } catch (err: unknown) {
    console.error('createProject exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error creating project',
    };
  }
}

/**
 * Mark a project as completed.
 * Automatically sets status to 'completed' and completed_at to now.
 */
export async function completeProject(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Valid project ID is required.' };
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('projects')
      .update({
        status: 'completed',
        completed_at: now,
      })
      .eq('id', id);

    if (error) {
      console.error('completeProject error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/projects');
    revalidatePath(`/projects/${id}`);
    return { success: true };
  } catch (err: unknown) {
    console.error('completeProject exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error completing project',
    };
  }
}

/**
 * Create a new expense.
 * Automatically defaults to today's date if not specified.
 */
export async function createExpense(formData: {
  project_id: string;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  receipt_url?: string;
  date?: string;
}): Promise<{ success: boolean; data?: Expense; error?: string }> {
  try {
    if (!formData.project_id || typeof formData.project_id !== 'string') {
      return { success: false, error: 'Valid project ID is required.' };
    }
    const amount = Number(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: 'Expense amount must be greater than 0.' };
    }
    if (!EXPENSE_CATEGORIES.includes(formData.category)) {
      return { success: false, error: 'Invalid expense category.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newExpense = {
      project_id: formData.project_id,
      amount,
      category: formData.category,
      description: formData.description?.trim() || formData.category,
      receipt_url: formData.receipt_url || null,
      date: formData.date || todayStr,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert([newExpense])
      .select()
      .single();

    if (error) {
      console.error('createExpense error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/projects');
    revalidatePath(`/projects/${formData.project_id}`);
    return { success: true, data };
  } catch (err: unknown) {
    console.error('createExpense exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error creating expense',
    };
  }
}

/**
 * Seed initial sample projects and expenses into live Supabase.
 */
export async function seedDemoData(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    for (const p of fallbackProjects) {
      const { data: newProj, error: pErr } = await supabase
        .from('projects')
        .insert([{
          name: p.name,
          type: p.type,
          total_budget: p.total_budget,
          status: p.status,
          start_date: p.start_date,
          completed_at: p.completed_at,
          created_at: p.created_at,
        }])
        .select()
        .single();

      if (pErr) {
        console.error('seedDemoData project error:', pErr);
        continue;
      }

      if (newProj) {
        const relatedExpenses = fallbackExpenses.filter((e) => e.project_id === p.id);
        if (relatedExpenses.length > 0) {
          const expenseInserts = relatedExpenses.map((e) => ({
            project_id: newProj.id,
            amount: e.amount,
            category: e.category,
            description: e.description,
            receipt_url: e.receipt_url,
            date: e.date,
            created_at: e.created_at,
          }));
          await supabase.from('expenses').insert(expenseInserts);
        }
      }
    }

    revalidatePath('/');
    revalidatePath('/projects');
    return { success: true };
  } catch (err: unknown) {
    console.error('seedDemoData exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to seed sample data',
    };
  }
}

/**
 * Update an expense row with a receipt URL after upload.
 */
export async function updateExpenseReceipt(
  expenseId: string,
  receiptUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!expenseId || !receiptUrl) {
      return { success: false, error: 'Expense ID and receipt URL are required.' };
    }

    const { error } = await supabase
      .from('expenses')
      .update({ receipt_url: receiptUrl })
      .eq('id', expenseId);

    if (error) {
      console.error('updateExpenseReceipt error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/projects');
    return { success: true };
  } catch (err: unknown) {
    console.error('updateExpenseReceipt exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update receipt',
    };
  }
}

/**
 * Soft-delete an expense by setting deleted_at timestamp.
 * Receipt files are left in storage (no public DELETE policy).
 */
export async function softDeleteExpense(
  expenseId: string,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!expenseId) {
      return { success: false, error: 'Valid expense ID is required.' };
    }

    const now = new Date().toISOString();
    let { error } = await supabase
      .from('expenses')
      .update({ deleted_at: now })
      .eq('id', expenseId);

    // Fallback if deleted_at column does not exist yet in Supabase
    if (error && error.message?.includes('deleted_at')) {
      const fallback = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);
      error = fallback.error;
    }

    if (error) {
      console.error('softDeleteExpense error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error('softDeleteExpense exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete expense',
    };
  }
}

/**
 * Aggregated analytics data for the Reports page.
 */
export interface ReportsData {
  categoryTotals: { category: string; total: number }[];
  monthlyTrend: { month: string; total: number }[];
  budgetVsActual: { name: string; budget: number; spent: number }[];
  quickStats: {
    totalProjects: number;
    totalLifetimeSpend: number;
    avgProjectCost: number;
    topCategory: string;
  };
}

export async function getReportsData(): Promise<ReportsData> {
  const { projects } = await getProjects();

  const allExpenses = projects.flatMap((p) => p.expenses);

  // Category totals
  const catMap: Record<string, number> = {};
  for (const e of allExpenses) {
    catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount);
  }
  const categoryTotals = Object.entries(catMap)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  // Monthly spending trend (last 6 months)
  const monthMap: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = 0;
  }
  for (const e of allExpenses) {
    const key = e.date.substring(0, 7); // YYYY-MM
    if (key in monthMap) {
      monthMap[key] += Number(e.amount);
    }
  }
  const monthlyTrend = Object.entries(monthMap).map(([month, total]) => ({
    month,
    total,
  }));

  // Budget vs Actual per project (active projects only)
  const budgetVsActual = projects
    .filter((p) => p.status === 'active')
    .map((p) => ({
      name: p.name.length > 18 ? p.name.substring(0, 18) + '…' : p.name,
      budget: Number(p.total_budget),
      spent: p.total_spent,
    }));

  // Quick stats
  const totalLifetimeSpend = allExpenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );
  const topCategory = categoryTotals.length > 0 ? categoryTotals[0].category : 'N/A';

  return {
    categoryTotals,
    monthlyTrend,
    budgetVsActual,
    quickStats: {
      totalProjects: projects.length,
      totalLifetimeSpend,
      avgProjectCost:
        projects.length > 0
          ? Math.round(totalLifetimeSpend / projects.length)
          : 0,
      topCategory,
    },
  };
}

function getFallbackProjectsWithExpenses(): ProjectWithExpenses[] {
  return fallbackProjects.map((p) => {
    const pExpenses = fallbackExpenses.filter((e) => e.project_id === p.id);
    const total_spent = pExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      ...p,
      expenses: pExpenses,
      total_spent,
    };
  });
}
