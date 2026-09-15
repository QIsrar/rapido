import { ProjectWithExpenses, Expense, LaborLog, ExpenseCategory, EXPENSE_CATEGORIES } from '@/types/database';

export type ReportPeriod = 'all' | 'this_month' | 'last_30_days' | 'this_week';

export interface ReportFilterOptions {
  period: ReportPeriod;
  includeLabor?: boolean;
  includeExpenses?: boolean;
}

export interface CategoryBreakdown {
  category: ExpenseCategory;
  amount: number;
  count: number;
  percentage: number;
}

export interface ReportMetrics {
  periodLabel: string;
  totalBudget: number;
  expenseSpend: number;
  laborSpend: number;
  totalSpent: number;
  remainingBudget: number;
  percentSpent: number;
  isOverBudget: boolean;
  categories: CategoryBreakdown[];
  filteredExpenses: Expense[];
  filteredLaborLogs: LaborLog[];
  totalMasons: number;
  totalLaborers: number;
  totalLaborDays: number;
}

/**
 * Filter expenses and labor logs by period and calculate comprehensive project metrics
 */
export function computeReportMetrics(
  project: ProjectWithExpenses,
  laborLogs: LaborLog[] = [],
  options: ReportFilterOptions = { period: 'all', includeLabor: true, includeExpenses: true }
): ReportMetrics {
  const now = new Date();
  let startDate: Date | null = null;
  let periodLabel = 'All Time (مکمل ریکارڈ)';

  if (options.period === 'this_month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    periodLabel = `This Month (${now.toLocaleString('default', { month: 'short', year: 'numeric' })})`;
  } else if (options.period === 'last_30_days') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    periodLabel = 'Last 30 Days (گزشتہ 30 دن)';
  } else if (options.period === 'this_week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    periodLabel = 'Last 7 Days (گزشتہ 7 دن)';
  }

  // Filter expenses
  const filteredExpenses = (project.expenses || []).filter((exp) => {
    if (exp.deleted_at) return false;
    if (!startDate) return true;
    const expDate = new Date(exp.date);
    return expDate >= startDate;
  });

  // Filter labor logs
  const filteredLaborLogs = (laborLogs || []).filter((log) => {
    if (!startDate) return true;
    const logDate = new Date(log.date);
    return logDate >= startDate;
  });

  const expenseSpend = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const laborSpend = options.includeLabor !== false
    ? filteredLaborLogs.reduce((sum, l) => sum + Number(l.total_cost || 0), 0)
    : 0;

  const totalSpent = expenseSpend + laborSpend;
  const totalBudget = Number(project.total_budget || 0);
  const remainingBudget = totalBudget - totalSpent;
  const percentSpent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const isOverBudget = remainingBudget < 0;

  // Category breakdown
  const categoryMap = new Map<ExpenseCategory, { amount: number; count: number }>();
  for (const cat of EXPENSE_CATEGORIES) {
    categoryMap.set(cat, { amount: 0, count: 0 });
  }

  for (const exp of filteredExpenses) {
    const prev = categoryMap.get(exp.category) || { amount: 0, count: 0 };
    categoryMap.set(exp.category, {
      amount: prev.amount + Number(exp.amount || 0),
      count: prev.count + 1,
    });
  }

  // If labor is included, add laborSpend to 'Labor' category
  if (options.includeLabor !== false && laborSpend > 0) {
    const prev = categoryMap.get('Labor') || { amount: 0, count: 0 };
    categoryMap.set('Labor', {
      amount: prev.amount + laborSpend,
      count: prev.count + filteredLaborLogs.length,
    });
  }

  const categories: CategoryBreakdown[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: totalSpent > 0 ? Math.round((data.amount / totalSpent) * 100) : 0,
    }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const totalMasons = filteredLaborLogs.reduce((sum, l) => sum + Number(l.masons_count || 0), 0);
  const totalLaborers = filteredLaborLogs.reduce((sum, l) => sum + Number(l.laborers_count || 0), 0);
  const totalLaborDays = totalMasons + totalLaborers;

  return {
    periodLabel,
    totalBudget,
    expenseSpend,
    laborSpend,
    totalSpent,
    remainingBudget,
    percentSpent,
    isOverBudget,
    categories,
    filteredExpenses,
    filteredLaborLogs,
    totalMasons,
    totalLaborers,
    totalLaborDays,
  };
}

/**
 * Format an executive bilingual Urdu/English WhatsApp summary message
 */
export function generateWhatsAppReport(
  project: ProjectWithExpenses,
  laborLogs: LaborLog[] = [],
  options: ReportFilterOptions = { period: 'all', includeLabor: true, includeExpenses: true }
): string {
  const metrics = computeReportMetrics(project, laborLogs, options);
  const formattedToday = new Date().toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const categoryUrdu: Record<ExpenseCategory, string> = {
    Materials: 'سیمنٹ، سریا، ریت، بجری',
    Labor: 'مزدور و مستری دیہاڑی',
    'Equipment Rental': 'مشینری و آلات کرایہ',
    Plumbing: 'پلمبنگ و سینیٹری',
    Electricity: 'وائرنگ و بجلی سامان',
    Permits: 'نقشہ فیس و قانونی اجازت',
    'Transport/Fuel': 'ٹرانسپورٹ و فیول',
    Misc: 'متفرق اخراجات',
  };

  const lines: string[] = [];

  // Header
  lines.push('🏗️ *PROJECT AUDIT REPORT / پراجیکٹ رپورٹ*');
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push(`📌 *Project:* ${project.name}`);
  if (project.location) {
    lines.push(`📍 *Location:* ${project.location}`);
  }
  lines.push(`🏷️ *Type:* ${project.type} | *Status:* ${project.status === 'completed' ? '✅ Completed' : '🔄 Active'}`);
  lines.push(`📅 *Period:* ${metrics.periodLabel}`);
  lines.push(`🕒 *Generated:* ${formattedToday}`);
  lines.push('');

  // Financial Summary
  lines.push('💰 *FINANCIAL SUMMARY / مالیاتی خلاصہ*');
  lines.push(`• Total Budget (کل بجٹ): *Rs. ${metrics.totalBudget.toLocaleString()}*`);
  lines.push(`• Material & Site Expenses: Rs. ${metrics.expenseSpend.toLocaleString()}`);
  if (options.includeLabor !== false && metrics.laborSpend > 0) {
    lines.push(`• Labor Hazri (دیہاڑی/حاضری): Rs. ${metrics.laborSpend.toLocaleString()}`);
  }
  lines.push(`• *Total Spent (کل خرچ): Rs. ${metrics.totalSpent.toLocaleString()}* (${metrics.percentSpent}% utilized)`);

  if (metrics.isOverBudget) {
    lines.push(`• ⚠️ *Budget Deficit (اضافی خرچ): -Rs. ${Math.abs(metrics.remainingBudget).toLocaleString()}*`);
  } else {
    lines.push(`• ✅ *Remaining Balance (بقایا رقم): Rs. ${metrics.remainingBudget.toLocaleString()}*`);
  }
  lines.push('');

  // Spending Breakdown
  if (metrics.categories.length > 0) {
    lines.push('📊 *TOP EXPENSES / اخراجات کی تفصیل*');
    for (const cat of metrics.categories.slice(0, 5)) {
      const urdu = categoryUrdu[cat.category] || '';
      lines.push(`• *${cat.category}* (${urdu}): Rs. ${cat.amount.toLocaleString()} (${cat.percentage}%)`);
    }
    lines.push('');
  }

  // Labor Attendance Roll
  if (options.includeLabor !== false && metrics.filteredLaborLogs.length > 0) {
    lines.push('👷 *LABOR MUSTER ROLL / یومیہ حاضری خلاصہ*');
    lines.push(`• Mistris (مستری): *${metrics.totalMasons}* total days`);
    lines.push(`• Mazdoors (مزدور): *${metrics.totalLaborers}* total days`);
    lines.push(`• Total Dihaadi Paid: *Rs. ${metrics.laborSpend.toLocaleString()}*`);
    lines.push('');
  }

  // Footer & Branding
  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push('📲 *Rapido Construction System*');
  lines.push('Real-time site job-costing & financial auditing.');

  return lines.join('\n');
}

/**
 * Generate a WhatsApp share URL
 */
export function getWhatsAppShareUrl(message: string, phone?: string): string {
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  const encodedText = encodeURIComponent(message);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}
