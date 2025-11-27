// Last Modified: 2025-11-24 16:56
/**
 * Search Analytics Tracking
 *
 * Philosophy: "Continuous Learning" - Track search behavior to improve
 * suggestions and identify content gaps.
 *
 * Features:
 * - Track all search queries
 * - Monitor zero-result searches
 * - Measure search-to-action conversion
 * - Popular search terms dashboard
 * - Performance metrics
 */

import { trackSearch } from './suggestions';

/**
 * Search event types
 */
export type SearchEventType =
  | 'search_performed'
  | 'search_cleared'
  | 'result_clicked'
  | 'filter_applied'
  | 'filter_saved'
  | 'zero_results'
  | 'suggestion_accepted'
  | 'suggestion_ignored';

/**
 * Search analytics event
 */
export interface SearchAnalyticsEvent {
  id: string;
  type: SearchEventType;
  query: string;
  category?: string; // contacts, tasks, etc.
  resultCount?: number;
  selectedResultIndex?: number;
  selectedResultId?: string;
  responseTime?: number; // milliseconds
  timestamp: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

/**
 * Search session tracking
 */
let currentSessionId = generateSessionId();
let sessionStartTime = Date.now();

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get or create session ID
 * Sessions expire after 30 minutes of inactivity
 */
export function getSessionId(): string {
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;

  if (now - sessionStartTime > thirtyMinutes) {
    // Session expired - create new one
    currentSessionId = generateSessionId();
    sessionStartTime = now;
  }

  return currentSessionId;
}

/**
 * Reset session (for testing or explicit session boundaries)
 */
export function resetSession(): void {
  currentSessionId = generateSessionId();
  sessionStartTime = Date.now();
}

/**
 * Local storage keys
 */
const ANALYTICS_KEY = 'bollalabz_search_analytics';
const MAX_STORED_EVENTS = 1000; // Keep last 1000 events

/**
 * Get stored analytics events
 */
export function getAnalyticsEvents(): SearchAnalyticsEvent[] {
  try {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load analytics:', error);
    return [];
  }
}

/**
 * Store analytics event
 */
function storeEvent(event: SearchAnalyticsEvent): void {
  try {
    const events = getAnalyticsEvents();
    events.push(event);

    // Keep only last N events
    const trimmed = events.slice(-MAX_STORED_EVENTS);

    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to store analytics event:', error);
  }
}

/**
 * Track search event
 */
export function trackSearchEvent(
  type: SearchEventType,
  query: string,
  options: {
    category?: string;
    resultCount?: number;
    selectedResultIndex?: number;
    selectedResultId?: string;
    responseTime?: number;
    metadata?: Record<string, any>;
  } = {}
): void {
  const event: SearchAnalyticsEvent = {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    query,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    ...options,
  };

  storeEvent(event);

  // Also track in popular searches for queries
  if (type === 'search_performed' && query) {
    trackSearch(query);
  }

  // Log performance warnings
  if (options.responseTime && options.responseTime > 50) {
    console.warn(
      `Slow search: ${query} took ${options.responseTime.toFixed(2)}ms (target: <50ms)`
    );
  }

  // Log zero results for improvement
  if (type === 'zero_results') {
    console.info(`Zero results for: "${query}" in ${options.category || 'global'}`);
  }
}

/**
 * Search metrics calculation
 */
export interface SearchMetrics {
  totalSearches: number;
  uniqueQueries: number;
  zeroResultRate: number; // Percentage
  avgResponseTime: number; // milliseconds
  avgResultCount: number;
  clickThroughRate: number; // Percentage of searches leading to clicks
  topQueries: Array<{ query: string; count: number }>;
  topCategories: Array<{ category: string; count: number }>;
  zeroResultQueries: Array<{ query: string; count: number }>;
}

/**
 * Calculate search metrics from events
 */
export function calculateMetrics(
  events: SearchAnalyticsEvent[] = getAnalyticsEvents()
): SearchMetrics {
  const searches = events.filter((e) => e.type === 'search_performed');
  const clicks = events.filter((e) => e.type === 'result_clicked');
  const zeroResults = events.filter((e) => e.type === 'zero_results');

  // Total searches
  const totalSearches = searches.length;

  // Unique queries
  const uniqueQueries = new Set(searches.map((e) => e.query.toLowerCase())).size;

  // Zero result rate
  const zeroResultRate = totalSearches > 0
    ? (zeroResults.length / totalSearches) * 100
    : 0;

  // Average response time
  const responseTimes = searches
    .map((e) => e.responseTime)
    .filter((t): t is number => t !== undefined);
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
    : 0;

  // Average result count
  const resultCounts = searches
    .map((e) => e.resultCount)
    .filter((c): c is number => c !== undefined);
  const avgResultCount = resultCounts.length > 0
    ? resultCounts.reduce((sum, c) => sum + c, 0) / resultCounts.length
    : 0;

  // Click-through rate
  const clickThroughRate = totalSearches > 0
    ? (clicks.length / totalSearches) * 100
    : 0;

  // Top queries
  const queryCounts = new Map<string, number>();
  searches.forEach((e) => {
    const query = e.query.toLowerCase();
    queryCounts.set(query, (queryCounts.get(query) || 0) + 1);
  });
  const topQueries = Array.from(queryCounts.entries())
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top categories
  const categoryCounts = new Map<string, number>();
  searches.forEach((e) => {
    if (e.category) {
      categoryCounts.set(e.category, (categoryCounts.get(e.category) || 0) + 1);
    }
  });
  const topCategories = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Zero result queries
  const zeroResultCounts = new Map<string, number>();
  zeroResults.forEach((e) => {
    const query = e.query.toLowerCase();
    zeroResultCounts.set(query, (zeroResultCounts.get(query) || 0) + 1);
  });
  const zeroResultQueries = Array.from(zeroResultCounts.entries())
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalSearches,
    uniqueQueries,
    zeroResultRate,
    avgResponseTime,
    avgResultCount,
    clickThroughRate,
    topQueries,
    topCategories,
    zeroResultQueries,
  };
}

/**
 * Get metrics for a specific time period
 */
export function getMetricsForPeriod(
  startDate: Date,
  endDate: Date = new Date()
): SearchMetrics {
  const events = getAnalyticsEvents().filter((e) => {
    const eventDate = new Date(e.timestamp);
    return eventDate >= startDate && eventDate <= endDate;
  });

  return calculateMetrics(events);
}

/**
 * Get metrics for last N days
 */
export function getMetricsForLastDays(days: number): SearchMetrics {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return getMetricsForPeriod(startDate);
}

/**
 * Export analytics data as CSV
 */
export function exportAnalytics(): string {
  const events = getAnalyticsEvents();

  const headers = [
    'id',
    'type',
    'query',
    'category',
    'resultCount',
    'responseTime',
    'timestamp',
    'sessionId',
  ];

  const rows = events.map((e) => [
    e.id,
    e.type,
    `"${e.query}"`, // Quote to handle commas in queries
    e.category || '',
    e.resultCount ?? '',
    e.responseTime ?? '',
    e.timestamp,
    e.sessionId,
  ]);

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

  return csv;
}

/**
 * Clear old analytics data
 * Keeps only last N days
 */
export function cleanupOldAnalytics(daysToKeep: number = 30): void {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const events = getAnalyticsEvents().filter((e) => {
    const eventDate = new Date(e.timestamp);
    return eventDate >= cutoffDate;
  });

  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events));
    console.log(`Cleaned up analytics. Kept ${events.length} events from last ${daysToKeep} days.`);
  } catch (error) {
    console.error('Failed to cleanup analytics:', error);
  }
}

/**
 * Get search quality score (0-100)
 * Based on multiple factors
 */
export function getSearchQualityScore(metrics: SearchMetrics): number {
  let score = 100;

  // Penalize high zero-result rate
  score -= metrics.zeroResultRate * 0.5; // Max -50 for 100% zero results

  // Penalize slow searches
  if (metrics.avgResponseTime > 50) {
    score -= Math.min(20, (metrics.avgResponseTime - 50) / 10);
  }

  // Reward high click-through rate
  score += (metrics.clickThroughRate - 50) * 0.2; // Bonus for >50% CTR

  return Math.max(0, Math.min(100, score));
}

/**
 * Get search insights and recommendations
 */
export function getSearchInsights(metrics: SearchMetrics): string[] {
  const insights: string[] = [];

  // Zero results
  if (metrics.zeroResultRate > 20) {
    insights.push(
      `High zero-result rate (${metrics.zeroResultRate.toFixed(1)}%). Consider improving search coverage or adding suggestions.`
    );
  }

  // Performance
  if (metrics.avgResponseTime > 100) {
    insights.push(
      `Slow search performance (${metrics.avgResponseTime.toFixed(0)}ms avg). Target is <50ms.`
    );
  } else if (metrics.avgResponseTime < 50) {
    insights.push(
      `Excellent search performance (${metrics.avgResponseTime.toFixed(0)}ms avg). Well below 50ms target.`
    );
  }

  // Click-through rate
  if (metrics.clickThroughRate < 30) {
    insights.push(
      `Low click-through rate (${metrics.clickThroughRate.toFixed(1)}%). Users may not be finding relevant results.`
    );
  } else if (metrics.clickThroughRate > 70) {
    insights.push(
      `Excellent click-through rate (${metrics.clickThroughRate.toFixed(1)}%). Search is highly effective.`
    );
  }

  // Zero result queries
  if (metrics.zeroResultQueries.length > 0) {
    const top3 = metrics.zeroResultQueries.slice(0, 3).map((q) => `"${q.query}"`).join(', ');
    insights.push(
      `Top queries with zero results: ${top3}. Consider adding content or improving matching.`
    );
  }

  return insights;
}

// Auto-cleanup on module load (runs once per session)
if (typeof window !== 'undefined') {
  // Run cleanup in background
  setTimeout(() => {
    cleanupOldAnalytics(30);
  }, 5000); // Wait 5s after page load
}

export default {
  trackSearchEvent,
  calculateMetrics,
  getMetricsForPeriod,
  getMetricsForLastDays,
  exportAnalytics,
  getSearchQualityScore,
  getSearchInsights,
};
