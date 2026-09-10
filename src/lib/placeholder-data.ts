import { Project, Expense, ProjectWithExpenses } from '@/types/database';

// ============================================================
// Placeholder Projects — Abbottabad / Hazara region
// ============================================================

export const projects: Project[] = [
  {
    id: 'p1',
    name: 'Jinnahabad 10-Marla Build',
    type: 'New Build',
    total_budget: 4500000,
    status: 'active',
    start_date: '2026-07-15T10:00:00Z',
    completed_at: null,
    created_at: '2026-07-15T10:00:00Z',
  },
  {
    id: 'p2',
    name: 'Mandian Plaza Renovation',
    type: 'Renovation',
    total_budget: 1800000,
    status: 'active',
    start_date: '2026-08-01T09:00:00Z',
    completed_at: null,
    created_at: '2026-08-01T09:00:00Z',
  },
  {
    id: 'p3',
    name: 'Supply Depot Maintenance',
    type: 'Maintenance',
    total_budget: 350000,
    status: 'active',
    start_date: '2026-08-20T14:00:00Z',
    completed_at: null,
    created_at: '2026-08-20T14:00:00Z',
  },
  {
    id: 'p4',
    name: 'Cantt Road Boundary Wall',
    type: 'New Build',
    total_budget: 750000,
    status: 'completed',
    start_date: '2026-05-10T08:00:00Z',
    completed_at: '2026-06-25T17:30:00Z',
    created_at: '2026-05-10T08:00:00Z',
  },
];

// ============================================================
// Placeholder Expenses — realistic PKR amounts
// ============================================================

export const expenses: Expense[] = [
  // --- Jinnahabad 10-Marla Build (p1) ---
  {
    id: 'e1',
    project_id: 'p1',
    amount: 185000,
    category: 'Materials',
    date: '2026-09-08',
    receipt_url: null,
    description: 'Sariya (steel bars) 40mm — 2 tonnes from Haripur Steel',
    created_at: '2026-09-08T09:30:00Z',
    deleted_at: null,
  },
  {
    id: 'e2',
    project_id: 'p1',
    amount: 96000,
    category: 'Materials',
    date: '2026-09-07',
    receipt_url: null,
    description: 'Margalla Crush + sand — 3 trolleys delivered',
    created_at: '2026-09-07T11:00:00Z',
    deleted_at: null,
  },
  {
    id: 'e3',
    project_id: 'p1',
    amount: 72000,
    category: 'Labor',
    date: '2026-09-06',
    receipt_url: null,
    description: 'Mason team (6 workers) — weekly wages',
    created_at: '2026-09-06T18:00:00Z',
    deleted_at: null,
  },
  {
    id: 'e4',
    project_id: 'p1',
    amount: 45000,
    category: 'Transport/Fuel',
    date: '2026-09-05',
    receipt_url: 'https://placehold.co/400x300/1a1a2e/f97316?text=Receipt',
    description: 'Dumper rental + diesel for material transport',
    created_at: '2026-09-05T08:00:00Z',
    deleted_at: null,
  },
  {
    id: 'e5',
    project_id: 'p1',
    amount: 340000,
    category: 'Materials',
    date: '2026-09-03',
    receipt_url: null,
    description: 'Bestway Cement — 200 bags @ Rs. 1,700/bag',
    created_at: '2026-09-03T10:00:00Z',
    deleted_at: null,
  },
  {
    id: 'e6',
    project_id: 'p1',
    amount: 25000,
    category: 'Permits',
    date: '2026-07-20',
    receipt_url: 'https://placehold.co/400x300/1a1a2e/f97316?text=Receipt',
    description: 'TMA Abbottabad — building plan approval fee',
    created_at: '2026-07-20T12:00:00Z',
    deleted_at: null,
  },
  {
    id: 'e7',
    project_id: 'p1',
    amount: 38000,
    category: 'Equipment Rental',
    date: '2026-09-01',
    receipt_url: null,
    description: 'Concrete mixer rental — 5 days',
    created_at: '2026-09-01T07:00:00Z',
    deleted_at: null,
  },

  // --- Mandian Plaza Renovation (p2) ---
  {
    id: 'e8',
    project_id: 'p2',
    amount: 210000,
    category: 'Materials',
    date: '2026-09-09',
    receipt_url: null,
    description: 'Pak Tile ceramic flooring — 1,200 sqft lot',
    created_at: '2026-09-09T14:00:00Z',
    deleted_at: null,
  },
  {
    id: 'e9',
    project_id: 'p2',
    amount: 85000,
    category: 'Plumbing',
    date: '2026-09-07',
    receipt_url: null,
    description: 'Complete bathroom fittings — Master brand',
    created_at: '2026-09-07T16:00:00Z',
    deleted_at: null,
  },
  {
    id: 'e10',
    project_id: 'p2',
    amount: 62000,
    category: 'Electricity',
    date: '2026-09-06',
    receipt_url: 'https://placehold.co/400x300/1a1a2e/f97316?text=Receipt',
    description: 'Rewiring + DB board + MCBs — ground floor',
    created_at: '2026-09-06T10:00:00Z',
    deleted_at: null,
  },
  {
    id: 'e11',
    project_id: 'p2',
    amount: 48000,
    category: 'Labor',
    date: '2026-09-05',
    receipt_url: null,
    description: 'Tile mason + helper — 8 days work',
    created_at: '2026-09-05T17:00:00Z',
    deleted_at: null,
  },
  {
    id: 'e12',
    project_id: 'p2',
    amount: 120000,
    category: 'Materials',
    date: '2026-09-02',
    receipt_url: null,
    description: 'Nippon paint + primer — full interior',
    created_at: '2026-09-02T11:00:00Z',
    deleted_at: null,
  },

  // --- Supply Depot Maintenance (p3) ---
  {
    id: 'e13',
    project_id: 'p3',
    amount: 35000,
    category: 'Plumbing',
    date: '2026-09-08',
    receipt_url: null,
    description: 'Water tank repair + pipe replacement',
    created_at: '2026-09-08T13:00:00Z',
    deleted_at: null,
  },
  {
    id: 'e14',
    project_id: 'p3',
    amount: 28000,
    category: 'Electricity',
    date: '2026-09-04',
    receipt_url: null,
    description: 'Generator servicing + new alternator belt',
    created_at: '2026-09-04T09:00:00Z',
    deleted_at: null,
  },
  {
    id: 'e15',
    project_id: 'p3',
    amount: 18000,
    category: 'Misc',
    date: '2026-09-02',
    receipt_url: null,
    description: 'Guard room whitewash + door lock replacement',
    created_at: '2026-09-02T15:00:00Z',
    deleted_at: null,
  },

  // --- Cantt Road Boundary Wall (p4 — completed) ---
  {
    id: 'e16',
    project_id: 'p4',
    amount: 290000,
    category: 'Materials',
    date: '2026-06-01',
    receipt_url: null,
    description: 'Bricks + cement + sand for 200ft wall',
    created_at: '2026-06-01T08:00:00Z',
    deleted_at: null,
  },
  {
    id: 'e17',
    project_id: 'p4',
    amount: 180000,
    category: 'Labor',
    date: '2026-06-15',
    receipt_url: null,
    description: 'Masonry team — full wall construction',
    created_at: '2026-06-15T18:00:00Z',
    deleted_at: null,
  },
  {
    id: 'e18',
    project_id: 'p4',
    amount: 95000,
    category: 'Materials',
    date: '2026-06-20',
    receipt_url: 'https://placehold.co/400x300/1a1a2e/f97316?text=Receipt',
    description: 'Razor wire + iron gate fabrication',
    created_at: '2026-06-20T12:00:00Z',
    deleted_at: null,
  },
];

// ============================================================
// Helper: Merge projects with their expenses
// ============================================================

export function getProjectsWithExpenses(): ProjectWithExpenses[] {
  return projects.map((project) => {
    const projectExpenses = expenses.filter(
      (e) => e.project_id === project.id
    );
    const total_spent = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      ...project,
      expenses: projectExpenses,
      total_spent,
    };
  });
}

export function getProjectById(id: string): ProjectWithExpenses | undefined {
  const all = getProjectsWithExpenses();
  return all.find((p) => p.id === id);
}

// ============================================================
// Helper: Format currency as PKR
// ============================================================

export function formatPKR(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-PK')}`;
}

// ============================================================
// Constants for form dropdowns
// ============================================================

export const PROJECT_TYPES = ['Renovation', 'Maintenance', 'New Build'] as const;

export const EXPENSE_CATEGORIES = [
  'Materials',
  'Labor',
  'Equipment Rental',
  'Plumbing',
  'Electricity',
  'Permits',
  'Transport/Fuel',
  'Misc',
] as const;
