// Last Modified: 2025-11-23 17:30
/**
 * Finance Utilities
 * Helper functions for cost tracking and budget management
 */

import { BudgetStatus, ResourceType, RESOURCE_UNIT_COSTS } from '@/types/finance';

/**
 * Format currency with proper symbol and decimals
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompactCurrency(amount: number, currency: string = 'USD'): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount, currency);
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Format percentage with sign and color
 */
export function formatPercentage(value: number, includeSign: boolean = true): string {
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Get budget status based on percentage used
 */
export function getBudgetStatus(percentageUsed: number): BudgetStatus {
  if (percentageUsed >= 90) return 'critical';
  if (percentageUsed >= 75) return 'warning';
  return 'healthy';
}

/**
 * Get status color for badges and indicators
 */
export function getStatusColor(status: BudgetStatus): string {
  switch (status) {
    case 'healthy':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
  }
}

/**
 * Get trend indicator (up/down arrow with color)
 */
export function getTrendIndicator(trend: number): { icon: string; color: string } {
  if (trend > 0) {
    return { icon: '↑', color: 'text-red-600' }; // Up is bad for costs
  } else if (trend < 0) {
    return { icon: '↓', color: 'text-green-600' }; // Down is good for costs
  }
  return { icon: '→', color: 'text-gray-600' };
}

/**
 * Calculate estimated cost for a resource usage
 */
export function calculateEstimatedCost(resourceType: ResourceType, usage: number): number {
  const unitCost = RESOURCE_UNIT_COSTS[resourceType].cost;
  return usage * unitCost;
}

/**
 * Group costs by date period
 */
export function groupCostsByPeriod(
  costs: Array<{ date: Date; amount: number }>,
  period: 'day' | 'week' | 'month'
): Array<{ date: string; amount: number }> {
  const grouped = new Map<string, number>();

  costs.forEach(({ date, amount }) => {
    let key: string;
    const d = new Date(date);

    switch (period) {
      case 'day':
        key = d.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        break;
    }

    grouped.set(key, (grouped.get(key) || 0) + amount);
  });

  return Array.from(grouped.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate average cost per time period
 */
export function calculateAverageCost(
  costs: Array<{ amount: number }>,
  days: number
): number {
  const total = costs.reduce((sum, cost) => sum + cost.amount, 0);
  return days > 0 ? total / days : 0;
}

/**
 * Get date range label
 */
export function getDateRangeLabel(startDate: Date, endDate: Date): string {
  const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (startDate.getFullYear() !== endDate.getFullYear()) {
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  return `${start} - ${end}`;
}

/**
 * Export costs to CSV
 */
export function exportCostsToCSV(
  costs: Array<{ date: Date; resourceType: string; amount: number; description: string }>,
  filename: string = 'costs-export.csv'
): void {
  const headers = ['Date', 'Resource Type', 'Amount', 'Description'];
  const rows = costs.map(cost => [
    new Date(cost.date).toISOString(),
    cost.resourceType,
    cost.amount.toFixed(4),
    cost.description
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
