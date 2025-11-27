// Last Modified: 2025-11-23 17:30
/**
 * Chart Utilities
 *
 * Helper functions for chart data transformation, formatting, and calculations.
 */

import { ChartColors } from '@/types/charts';

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Default chart color palette
 */
export const DEFAULT_CHART_COLORS: ChartColors = {
  primary: '#6366F1',    // Indigo
  secondary: '#8B5CF6',  // Purple
  success: '#22C55E',    // Green
  warning: '#F59E0B',    // Amber
  danger: '#EF4444',     // Red
  info: '#3B82F6',       // Blue
  muted: '#9CA3AF',      // Gray
};

/**
 * Get color by index with wraparound
 */
export function getChartColor(index: number, colors?: string[]): string {
  const palette = colors || Object.values(DEFAULT_CHART_COLORS);
  return palette[index % palette.length];
}

/**
 * Generate color scale for heatmaps
 */
export function generateColorScale(
  minColor: string,
  maxColor: string,
  steps: number = 5
): string[] {
  // Simple implementation - in production, use a proper color interpolation library
  const colors: string[] = [];
  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    // This is a simplified version - proper RGB interpolation would be better
    colors.push(ratio < 0.5 ? minColor : maxColor);
  }
  return colors;
}

/**
 * Get color based on value threshold
 */
export function getThresholdColor(
  value: number,
  thresholds: Array<{ value: number; color: string }>
): string {
  const sorted = [...thresholds].sort((a, b) => a.value - b.value);

  for (const threshold of sorted) {
    if (value <= threshold.value) {
      return threshold.color;
    }
  }

  return sorted[sorted.length - 1]?.color || DEFAULT_CHART_COLORS.primary;
}

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * Transform array of objects to chart data format
 */
export function transformToChartData<T extends Record<string, any>>(
  data: T[],
  xKey: keyof T,
  yKeys: Array<keyof T>
): Array<Record<string, any>> {
  return data.map(item => {
    const result: Record<string, any> = { [xKey as string]: item[xKey] };
    yKeys.forEach(key => {
      result[key as string] = item[key];
    });
    return result;
  });
}

/**
 * Group data by time period
 */
export function groupByPeriod<T extends { date: string | Date }>(
  data: T[],
  period: 'hour' | 'day' | 'week' | 'month' | 'year',
  aggregator: (items: T[]) => any
): Array<{ date: string; value: any }> {
  const groups = new Map<string, T[]>();

  data.forEach(item => {
    const date = new Date(item.date);
    let key: string;

    switch (period) {
      case 'hour':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
        break;
      case 'day':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate()) / 7)).padStart(2, '0')}`;
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = `${date.getFullYear()}`;
        break;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  });

  return Array.from(groups.entries())
    .map(([date, items]) => ({
      date,
      value: aggregator(items),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate percentage distribution
 */
export function calculatePercentages<T extends { value: number }>(
  data: T[]
): Array<T & { percentage: number }> {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return data.map(item => ({
    ...item,
    percentage: total > 0 ? (item.value / total) * 100 : 0,
  }));
}

/**
 * Fill missing dates in time series
 */
export function fillMissingDates(
  data: Array<{ date: string; [key: string]: any }>,
  startDate: Date,
  endDate: Date,
  defaultValue: any = 0
): Array<{ date: string; [key: string]: any }> {
  const filled: Array<{ date: string; [key: string]: any }> = [];
  const dataMap = new Map(data.map(item => [item.date, item]));

  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];

    if (dataMap.has(dateStr)) {
      filled.push(dataMap.get(dateStr)!);
    } else {
      const keys = data[0] ? Object.keys(data[0]).filter(k => k !== 'date') : [];
      const emptyData: any = { date: dateStr };
      keys.forEach(key => {
        emptyData[key] = defaultValue;
      });
      filled.push(emptyData);
    }

    current.setDate(current.getDate() + 1);
  }

  return filled;
}

// ============================================================================
// Statistical Functions
// ============================================================================

/**
 * Calculate average
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate sum
 */
export function sum(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0);
}

/**
 * Calculate trend (percentage change)
 */
export function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate moving average
 */
export function movingAverage(values: number[], window: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const windowValues = values.slice(start, i + 1);
    result.push(average(windowValues));
  }

  return result;
}

/**
 * Find min and max values
 */
export function findMinMax(values: number[]): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 0 };

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format number with abbreviation (K, M, B)
 */
export function formatNumber(value: number, decimals: number = 1): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(decimals)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(decimals)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(decimals)}K`;
  }
  return value.toFixed(decimals);
}

/**
 * Format currency
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format duration (seconds to human-readable)
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
}

/**
 * Format date for chart axis
 */
export function formatAxisDate(
  date: string | Date,
  period: 'hour' | 'day' | 'week' | 'month' | 'year'
): string {
  const d = new Date(date);

  switch (period) {
    case 'hour':
      return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    case 'day':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'week':
      return `Week ${Math.ceil(d.getDate() / 7)}`;
    case 'month':
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    case 'year':
      return d.getFullYear().toString();
  }
}

// ============================================================================
// Tooltip Formatters
// ============================================================================

/**
 * Default tooltip label formatter
 */
export function defaultLabelFormatter(label: string): string {
  return label;
}

/**
 * Default tooltip value formatter
 */
export function defaultValueFormatter(value: number): string {
  return value.toLocaleString();
}

/**
 * Currency tooltip formatter
 */
export function currencyFormatter(value: number): string {
  return formatCurrency(value);
}

/**
 * Percentage tooltip formatter
 */
export function percentageFormatter(value: number): string {
  return formatPercentage(value);
}

/**
 * Duration tooltip formatter
 */
export function durationFormatter(value: number): string {
  return formatDuration(value);
}
