// TypeScript types matching the Supabase database schema

export type ProjectType = 'Renovation' | 'Maintenance' | 'New Build';
export type ProjectStatus = 'active' | 'completed';
export type ExpenseCategory =
  | 'Materials'
  | 'Labor'
  | 'Equipment Rental'
  | 'Plumbing'
  | 'Electricity'
  | 'Permits'
  | 'Transport/Fuel'
  | 'Misc';

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  total_budget: number;
  status: ProjectStatus;
  location?: string | null;
  start_date: string;
  completed_at: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  project_id: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  receipt_url: string | null;
  description: string;
  created_at: string;
  deleted_at: string | null;
}

// Computed type for dashboard display
export interface ProjectWithExpenses extends Project {
  expenses: Expense[];
  total_spent: number;
}

// Constants for form dropdowns
export const PROJECT_TYPES: ProjectType[] = ['New Build', 'Renovation', 'Maintenance'];

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Materials',
  'Labor',
  'Equipment Rental',
  'Plumbing',
  'Electricity',
  'Permits',
  'Transport/Fuel',
  'Misc',
];
