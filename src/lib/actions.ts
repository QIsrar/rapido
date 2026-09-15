'use server';

import { revalidatePath } from 'next/cache';
import { isSupabaseConfigured } from './supabase';
import { createClient as createServerClient } from './supabase/server';

async function getDb() {
  return await createServerClient();
}
import {
  type Project,
  type Expense,
  type LaborLog,
  type ProjectWithExpenses,
  type ProjectType,
  type ProjectStatus,
  type ExpenseCategory,
  PROJECT_TYPES,
  EXPENSE_CATEGORIES,
  MIN_BUDGET_BY_TYPE,
} from '@/types/database';
import {
  projects as fallbackProjects,
  expenses as fallbackExpenses,
} from './placeholder-data';

const NOT_CONFIGURED_MSG =
  'Database not connected. Please verify your Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_URL and SUPABASE_ANON_KEY) in Vercel project settings, then redeploy.';

function formatErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    if (err.message.includes('fetch failed')) {
      return 'Supabase connection failed (fetch failed). Please check that your Supabase project is active and that your Supabase URL & Key are set in Vercel, then trigger a redeploy.';
    }
    return err.message;
  }
  return fallback;
}

/**
 * Fetch all projects from Supabase with their associated expenses and calculated total_spent.
 * Falls back gracefully to seed data if Supabase is not connected or tables not yet created.
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

    const supabase = await getDb();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.warn('Supabase projects query notice:', projectsError.message);
      return {
        projects: getFallbackProjectsWithExpenses(),
        isLive: false,
      };
    }

    // Defense-in-depth: Guests can only see demo projects
    if (!user && projectsData && projectsData.length > 0 && 'is_demo' in projectsData[0]) {
      projectsData = projectsData.filter((p: Project) => p.is_demo === true);
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

    // Fetch labor_logs to incorporate labor cost into total_spent
    let { data: laborData } = await supabase
      .from('labor_logs')
      .select('project_id, total_cost');
    const laborList: { project_id: string; total_cost: number | string }[] = laborData || [];

    const merged: ProjectWithExpenses[] = (projectsData || []).map((project: Project) => {
      const pExpenses = expensesList.filter((e) => e.project_id === project.id);
      const expenseSpend = pExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const laborSpend = laborList
        .filter((l: { project_id: string; total_cost: number | string }) => l.project_id === project.id)
        .reduce((sum: number, l: { project_id: string; total_cost: number | string }) => sum + Number(l.total_cost || 0), 0);
      const total_spent = expenseSpend + laborSpend;
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

    const supabase = await getDb();
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return null;
    }

    // Defense-in-depth: if project is a live client project (is_demo === false), verify authentication
    if (project.is_demo === false) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }
    }

    let { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('project_id', id)
      .is('deleted_at', null)
      .order('date', { ascending: false });

    // Fallback if deleted_at does not exist yet
    if (expensesError && expensesError.message?.includes('deleted_at')) {
      const retry = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', id)
        .order('date', { ascending: false });
      expenses = retry.data;
    }

    const expensesList: Expense[] = expenses || [];

    // Fetch labor_logs to incorporate labor cost into total_spent
    let { data: laborData } = await supabase
      .from('labor_logs')
      .select('total_cost')
      .eq('project_id', id);

    const laborSpend = (laborData || []).reduce(
      (sum, l) => sum + Number(l.total_cost || 0),
      0
    );
    const expenseSpend = expensesList.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );
    const total_spent = expenseSpend + laborSpend;

    return {
      ...project,
      expenses: expensesList,
      total_spent,
    };
  } catch (err) {
    console.error('getProjectById error:', err);
    return null;
  }
}

/**
 * Create a new project.
 * Start date is automatically recorded as now.
 */
export async function createProject(formData: {
  name: string;
  type: ProjectType;
  total_budget: number;
  location?: string;
}): Promise<{ success: boolean; data?: Project; error?: string }> {
  try {
    if (!isSupabaseConfigured) {
      return { success: false, error: NOT_CONFIGURED_MSG };
    }

    const name = formData.name?.trim();
    if (!name) {
      return { success: false, error: 'Project name is required.' };
    }
    const budget = Number(formData.total_budget);
    if (isNaN(budget) || budget <= 0) {
      return { success: false, error: 'Total budget must be a positive number in PKR.' };
    }
    if (!Number.isInteger(budget)) {
      return { success: false, error: 'Total budget must be a whole number (no decimals or paisas).' };
    }
    if (!PROJECT_TYPES.includes(formData.type)) {
      return { success: false, error: 'Invalid project type.' };
    }

    const minThreshold = MIN_BUDGET_BY_TYPE[formData.type] || 10000;
    if (budget < minThreshold) {
      return {
        success: false,
        error: `Minimum budget for ${formData.type} is Rs. ${minThreshold.toLocaleString()} PKR (Maintenance: Rs. 10,000, Renovation: Rs. 50,000, New Build: Rs. 100,000).`,
      };
    }

    const supabase = await getDb();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Sign in required: Only approved contractors can create projects.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('must_reset_password')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.must_reset_password) {
      return { success: false, error: 'Mandatory password update required before creating projects.' };
    }

    const now = new Date().toISOString();
    const newProject: Record<string, unknown> = {
      name,
      type: formData.type,
      total_budget: budget,
      status: 'active',
      location: formData.location?.trim() || null,
      is_demo: false,
      start_date: now,
      created_at: now,
    };

    let { data, error } = await supabase
      .from('projects')
      .insert([newProject])
      .select()
      .single();

    // Fallback if location or is_demo column not yet present in Supabase
    if (error && (error.message?.includes('location') || error.message?.includes('is_demo'))) {
      if (error.message?.includes('location')) delete newProject.location;
      if (error.message?.includes('is_demo')) delete newProject.is_demo;
      const retry = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

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
      error: formatErrorMessage(err, 'Unknown error creating project'),
    };
  }
}

/**
 * Update an existing project's metadata (budget, name, type, location).
 */
export async function updateProject(
  id: string,
  formData: {
    name?: string;
    type?: ProjectType;
    total_budget?: number;
    location?: string;
    status?: ProjectStatus;
  }
): Promise<{ success: boolean; data?: Project; error?: string }> {
  try {
    if (!isSupabaseConfigured) {
      return { success: false, error: NOT_CONFIGURED_MSG };
    }
    if (!id) {
      return { success: false, error: 'Valid project ID is required.' };
    }

    const supabase = await getDb();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Sign in required to update projects.' };
    }

    const updates: Record<string, unknown> = {};
    if (formData.name?.trim()) updates.name = formData.name.trim();
    if (formData.type && PROJECT_TYPES.includes(formData.type)) updates.type = formData.type;
    if (formData.total_budget !== undefined && Number(formData.total_budget) > 0) {
      updates.total_budget = Number(formData.total_budget);
    }
    if (formData.location !== undefined) {
      updates.location = formData.location.trim() || null;
    }
    if (formData.status) {
      updates.status = formData.status;
    }

    let { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error && error.message?.includes('location')) {
      delete updates.location;
      const retry = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('updateProject error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/projects');
    revalidatePath(`/projects/${id}`);
    revalidatePath('/reports');
    return { success: true, data };
  } catch (err: unknown) {
    console.error('updateProject exception:', err);
    return {
      success: false,
      error: formatErrorMessage(err, 'Unknown error updating project'),
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
    if (!isSupabaseConfigured) {
      return { success: false, error: NOT_CONFIGURED_MSG };
    }

    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Valid project ID is required.' };
    }

    const supabase = await getDb();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Sign in required to complete projects.' };
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
      error: formatErrorMessage(err, 'Unknown error completing project'),
    };
  }
}

/**
 * Permanently delete a project and all associated expenses.
 * Allowed only for admin role.
 */
export async function deleteProject(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured) {
      return { success: false, error: NOT_CONFIGURED_MSG };
    }

    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Valid project ID is required.' };
    }

    const supabase = await getDb();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Sign in required to delete projects.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'admin') {
      return { success: false, error: 'Admin privileges required: Only administrator (Qazi Israr) can delete projects.' };
    }

    // 1. Delete associated expenses first
    await supabase.from('expenses').delete().eq('project_id', id);

    // 2. Delete the project record
    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      console.error('deleteProject error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/projects');
    revalidatePath('/reports');
    return { success: true };
  } catch (err: unknown) {
    console.error('deleteProject exception:', err);
    return {
      success: false,
      error: formatErrorMessage(err, 'Failed to delete project'),
    };
  }
}

/**
 * Create a new expense.
 * Automatically defaults to today's date if not specified.
 * When category is 'Misc', a description/name is strictly required.
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
    if (!isSupabaseConfigured) {
      return { success: false, error: NOT_CONFIGURED_MSG };
    }

    if (!formData.project_id || typeof formData.project_id !== 'string') {
      return { success: false, error: 'Valid project ID is required.' };
    }
    const amount = Number(formData.amount);
    if (isNaN(amount) || amount < 10) {
      return { success: false, error: 'Expense amount must be at least Rs. 10.' };
    }
    if (!EXPENSE_CATEGORIES.includes(formData.category)) {
      return { success: false, error: 'Invalid expense category.' };
    }

    const trimmedDescription = formData.description?.trim() || '';

    // Enforce required description for Misc category
    if (formData.category === 'Misc' && !trimmedDescription) {
      return {
        success: false,
        error: 'Description / Item Name is required for Miscellaneous (Misc) expenses.',
      };
    }

    const supabase = await getDb();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Sign in required: Only approved contractors can log expenses.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('must_reset_password')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.must_reset_password) {
      return { success: false, error: 'Mandatory password update required before logging expenses.' };
    }

    // Verify project is active (completed projects are sealed)
    const { data: projectCheck } = await supabase
      .from('projects')
      .select('status')
      .eq('id', formData.project_id)
      .single();

    if (projectCheck && projectCheck.status === 'completed') {
      return {
        success: false,
        error: 'This project is marked as completed and locked. New expenses cannot be added.',
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newExpense = {
      project_id: formData.project_id,
      amount,
      category: formData.category,
      description: trimmedDescription || formData.category,
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
    revalidatePath('/reports');
    return { success: true, data };
  } catch (err: unknown) {
    console.error('createExpense exception:', err);
    return {
      success: false,
      error: formatErrorMessage(err, 'Unknown error creating expense'),
    };
  }
}

/**
 * Upload receipt via Server Action using buffer.
 * Ensures uploads succeed on Vercel even if client env vars are missing.
 */
export async function uploadReceiptAction(
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { url: null, error: 'Supabase storage is not configured.' };
    }

    const file = formData.get('file') as File | null;
    const expenseId = formData.get('expenseId') as string | null;

    if (!file || !expenseId) {
      return { url: null, error: 'File and expense ID are required.' };
    }

    const supabase = await getDb();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { url: null, error: 'Sign in required to upload receipts.' };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { url: null, error: 'File too large. Maximum size is 5MB.' };
    }

    if (!file.type.startsWith('image/')) {
      return { url: null, error: 'Only image files are allowed.' };
    }

    const rawExt = file.name.split('.').pop() || 'jpg';
    const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const timestamp = Date.now();
    const sanitizedExpenseId = expenseId.replace(/[^a-zA-Z0-9_-]/g, '');
    const path = `${sanitizedExpenseId}-${timestamp}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      console.error('uploadReceiptAction error:', uploadError);
      return { url: null, error: uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(path);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: unknown) {
    console.error('uploadReceiptAction exception:', err);
    return {
      url: null,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
}

/**
 * Seed initial sample projects and expenses into live Supabase.
 */
export async function seedDemoData(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    if (!isSupabaseConfigured) {
      return { success: false, error: NOT_CONFIGURED_MSG };
    }

    const supabase = await getDb();

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
    revalidatePath('/reports');
    return { success: true };
  } catch (err: unknown) {
    console.error('seedDemoData exception:', err);
    return {
      success: false,
      error: formatErrorMessage(err, 'Failed to seed sample data'),
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
    if (!isSupabaseConfigured) {
      return { success: false, error: NOT_CONFIGURED_MSG };
    }

    if (!expenseId || !receiptUrl) {
      return { success: false, error: 'Expense ID and receipt URL are required.' };
    }

    const supabase = await getDb();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Sign in required to update receipt.' };
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
    revalidatePath('/reports');
    return { success: true };
  } catch (err: unknown) {
    console.error('updateExpenseReceipt exception:', err);
    return {
      success: false,
      error: formatErrorMessage(err, 'Failed to update receipt'),
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
    if (!isSupabaseConfigured) {
      return { success: false, error: NOT_CONFIGURED_MSG };
    }

    if (!expenseId) {
      return { success: false, error: 'Valid expense ID is required.' };
    }

    const supabase = await getDb();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Sign in required to delete expenses.' };
    }

    // Verify project is not completed (completed projects are sealed from deletions)
    if (projectId) {
      const { data: proj } = await supabase
        .from('projects')
        .select('status')
        .eq('id', projectId)
        .single();

      if (proj && proj.status === 'completed') {
        return {
          success: false,
          error: 'Cannot delete expenses from a completed project. Financial logs are sealed.',
        };
      }
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
    revalidatePath('/reports');
    return { success: true };
  } catch (err: unknown) {
    console.error('softDeleteExpense exception:', err);
    return {
      success: false,
      error: formatErrorMessage(err, 'Failed to delete expense'),
    };
  }
}

/**
 * Aggregated analytics data for the Reports page.
 */
export interface ReportsData {
  categoryTotals: { category: string; total: number }[];
  monthlyTrend: { month: string; total: number; count: number }[];
  budgetVsActual: { id: string; name: string; fullName: string; budget: number; spent: number }[];
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

  // Include labor attendance in category totals and lifetime spend
  let totalLaborSpend = 0;
  if (isSupabaseConfigured) {
    try {
      const supabase = await getDb();
      const { data: laborData } = await supabase
        .from('labor_logs')
        .select('date, total_cost');
      if (laborData) {
        for (const l of laborData) {
          const cost = Number(l.total_cost || 0);
          totalLaborSpend += cost;
          catMap['Labor'] = (catMap['Labor'] || 0) + cost;
        }
      }
    } catch {
      // Non-blocking
    }
  }

  const categoryTotals = Object.entries(catMap)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  // Monthly spending trend (last 6 months)
  const monthMap: Record<string, { total: number; count: number }> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = { total: 0, count: 0 };
  }
  for (const e of allExpenses) {
    const key = e.date.substring(0, 7); // YYYY-MM
    if (key in monthMap) {
      monthMap[key].total += Number(e.amount);
      monthMap[key].count += 1;
    }
  }
  const monthlyTrend = Object.entries(monthMap).map(([month, val]) => ({
    month,
    total: val.total,
    count: val.count,
  }));

  // Budget vs Actual per project (active projects first, up to 10)
  const budgetVsActual = projects
    .filter((p) => p.total_budget > 0)
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      name: p.name.length > 14 ? p.name.substring(0, 14) + '…' : p.name,
      fullName: p.name,
      budget: Number(p.total_budget),
      spent: p.total_spent,
    }));

  // Quick stats
  const totalLifetimeSpend =
    allExpenses.reduce((sum, e) => sum + Number(e.amount), 0) + totalLaborSpend;
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

/**
 * Diagnostic ping test for Supabase connection.
 */
export async function testDatabaseConnection(): Promise<{
  connected: boolean;
  projectCount?: number;
  error?: string;
}> {
  try {
    if (!isSupabaseConfigured) {
      return {
        connected: false,
        error: 'Missing environment variables. Please check Vercel settings.',
      };
    }
    const supabase = await getDb();
    const { count, error } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return { connected: false, error: error.message };
    }
    return { connected: true, projectCount: count ?? 0 };
  } catch (err: unknown) {
    return {
      connected: false,
      error: formatErrorMessage(err, 'Connection failed'),
    };
  }
}

function getFallbackProjectsWithExpenses(): ProjectWithExpenses[] {
  return fallbackProjects.map((p) => {
    const pExpenses = fallbackExpenses.filter((e) => e.project_id === p.id);
    const total_spent = pExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    return {
      ...p,
      expenses: pExpenses,
      total_spent,
    };
  });
}

/**
 * Fetch daily labor attendance logs for a project.
 */
export async function getLaborLogs(projectId: string): Promise<LaborLog[]> {
  try {
    if (!isSupabaseConfigured) {
      return [];
    }
    const supabase = await getDb();
    const { data, error } = await supabase
      .from('labor_logs')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('getLaborLogs notice:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      project_id: row.project_id,
      date: row.date,
      masons_count: Number(row.masons_count || 0),
      laborers_count: Number(row.laborers_count || 0),
      daily_rate_mason: Number(row.daily_rate_mason || 0),
      daily_rate_laborer: Number(row.daily_rate_laborer || 0),
      total_cost: Number(row.total_cost || 0),
      notes: row.notes,
      created_at: row.created_at,
    }));
  } catch (err) {
    console.error('getLaborLogs exception:', err);
    return [];
  }
}

/**
 * Create a new daily labor attendance log.
 * Enforces authenticated contractor access, validates counts and rates,
 * and recalculates total daily labor wage.
 */
export async function createLaborLog(data: {
  projectId: string;
  date?: string;
  masonsCount: number;
  laborersCount: number;
  dailyRateMason?: number;
  dailyRateLaborer?: number;
  notes?: string;
}): Promise<{ success: boolean; data?: LaborLog; error?: string }> {
  try {
    if (!isSupabaseConfigured) {
      return { success: false, error: NOT_CONFIGURED_MSG };
    }

    if (!data.projectId || typeof data.projectId !== 'string') {
      return { success: false, error: 'Valid project ID is required.' };
    }

    const masons = Math.max(0, Math.floor(Number(data.masonsCount) || 0));
    const laborers = Math.max(0, Math.floor(Number(data.laborersCount) || 0));

    if (masons === 0 && laborers === 0) {
      return {
        success: false,
        error: 'Please enter at least one mason or laborer for attendance.',
      };
    }

    const rateMason = Math.max(0, Number(data.dailyRateMason ?? 2500));
    const rateLaborer = Math.max(0, Number(data.dailyRateLaborer ?? 1500));
    const computedTotal = masons * rateMason + laborers * rateLaborer;

    const supabase = await getDb();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'Sign in required: Only approved contractors can log labor attendance.',
      };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('must_reset_password')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.must_reset_password) {
      return {
        success: false,
        error: 'Mandatory password update required before logging labor attendance.',
      };
    }

    // Verify project is active
    const { data: projectCheck } = await supabase
      .from('projects')
      .select('status')
      .eq('id', data.projectId)
      .single();

    if (projectCheck && projectCheck.status === 'completed') {
      return {
        success: false,
        error: 'This project is marked as completed and locked. Labor logs cannot be added.',
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const logDate = data.date || todayStr;

    const payload = {
      project_id: data.projectId,
      date: logDate,
      masons_count: masons,
      laborers_count: laborers,
      daily_rate_mason: rateMason,
      daily_rate_laborer: rateLaborer,
      total_cost: computedTotal,
      notes: data.notes?.trim() || null,
      created_at: new Date().toISOString(),
    };

    const { data: inserted, error } = await supabase
      .from('labor_logs')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('createLaborLog error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/projects/${data.projectId}`);
    revalidatePath('/');
    return { success: true, data: inserted };
  } catch (err: unknown) {
    console.error('createLaborLog exception:', err);
    return {
      success: false,
      error: formatErrorMessage(err, 'Failed to log labor attendance'),
    };
  }
}

/**
 * Delete a labor log entry.
 */
export async function deleteLaborLog(
  id: string,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured) {
      return { success: false, error: NOT_CONFIGURED_MSG };
    }

    const supabase = await getDb();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Sign in required to delete labor logs.' };
    }

    const { error } = await supabase
      .from('labor_logs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('deleteLaborLog error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');
    return { success: true };
  } catch (err: unknown) {
    console.error('deleteLaborLog exception:', err);
    return {
      success: false,
      error: formatErrorMessage(err, 'Failed to delete labor log'),
    };
  }
}


