// Last Modified: 2025-11-24 12:50
/**
 * Prefetch Analytics Tracker
 *
 * Tracks and analyzes prefetch performance to optimize the system.
 *
 * Metrics Tracked:
 * - Prefetch hit rate (navigated to prefetched route)
 * - Prefetch waste (prefetched but never used)
 * - Bandwidth usage
 * - Prediction accuracy
 * - Average time saved
 */

import { logger } from '@/lib/monitoring/sentry';

// ============================================
// TYPES
// ============================================

interface PrefetchEvent {
  route: string;
  timestamp: number;
  type: 'prefetch' | 'navigation' | 'hit' | 'miss' | 'waste';
  metadata?: {
    priority?: number;
    bytes?: number;
    timeElapsed?: number;
    predicted?: boolean;
  };
}

interface PrefetchMetrics {
  // Hit rate metrics
  totalPrefetches: number;
  totalNavigations: number;
  hits: number;
  misses: number;
  waste: number;
  hitRate: number;
  wasteRate: number;

  // Performance metrics
  averageTimeSaved: number;
  totalBytesPrefetched: number;
  totalBytesWasted: number;
  bandwidthEfficiency: number;

  // Prediction metrics
  predictionAccuracy: number;
  falsePositives: number;
  falseNegatives: number;

  // Time windows
  last24Hours: Partial<PrefetchMetrics>;
  lastHour: Partial<PrefetchMetrics>;
  lastSession: Partial<PrefetchMetrics>;
}

interface AnalyticsConfig {
  /**
   * Maximum number of events to store
   * @default 1000
   */
  maxEvents?: number;

  /**
   * Whether to log metrics to console in dev mode
   * @default true
   */
  logToConsole?: boolean;

  /**
   * Interval for metric calculation in milliseconds
   * @default 60000 (1 minute)
   */
  metricsInterval?: number;
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

const DEFAULT_CONFIG: Required<AnalyticsConfig> = {
  maxEvents: 1000,
  logToConsole: import.meta.env.DEV,
  metricsInterval: 60 * 1000, // 1 minute
};

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEY = 'bollalabz_prefetch_analytics';
const SESSION_START_KEY = 'bollalabz_session_start';

// ============================================
// ANALYTICS TRACKER CLASS
// ============================================

class PrefetchAnalytics {
  private config: Required<AnalyticsConfig>;
  private events: PrefetchEvent[] = [];
  private prefetchedRoutes: Set<string> = new Set();
  private sessionStart: number;
  private metricsIntervalId: number | null = null;

  constructor(config: AnalyticsConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionStart = this.getSessionStart();
    this.loadEvents();
    this.startMetricsLogging();
  }

  // ============================================
  // EVENT TRACKING
  // ============================================

  /**
   * Track a prefetch event
   */
  trackPrefetch(route: string, metadata?: PrefetchEvent['metadata']): void {
    this.addEvent({
      route,
      timestamp: Date.now(),
      type: 'prefetch',
      metadata,
    });

    this.prefetchedRoutes.add(route);

    logger.debug('Prefetch tracked', { route, metadata });
  }

  /**
   * Track a navigation event
   */
  trackNavigation(route: string, timeElapsed?: number): void {
    const wasPrefetched = this.prefetchedRoutes.has(route);

    // Track navigation
    this.addEvent({
      route,
      timestamp: Date.now(),
      type: 'navigation',
      metadata: { timeElapsed },
    });

    // Track hit or miss
    if (wasPrefetched) {
      this.addEvent({
        route,
        timestamp: Date.now(),
        type: 'hit',
        metadata: { timeElapsed },
      });

      // Remove from prefetched set
      this.prefetchedRoutes.delete(route);

      logger.info('Prefetch hit!', { route, timeElapsed });
    } else {
      this.addEvent({
        route,
        timestamp: Date.now(),
        type: 'miss',
      });

      logger.debug('Prefetch miss', { route });
    }
  }

  /**
   * Track wasted prefetch (prefetched but never navigated to)
   */
  private trackWaste(route: string, bytes?: number): void {
    this.addEvent({
      route,
      timestamp: Date.now(),
      type: 'waste',
      metadata: { bytes },
    });

    logger.debug('Prefetch waste', { route, bytes });
  }

  /**
   * Add event to history
   */
  private addEvent(event: PrefetchEvent): void {
    this.events.push(event);

    // Trim if over limit
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents);
    }

    this.saveEvents();
  }

  // ============================================
  // METRICS CALCULATION
  // ============================================

  /**
   * Calculate comprehensive metrics
   */
  calculateMetrics(): PrefetchMetrics {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Overall metrics
    const overall = this.calculateMetricsForPeriod(0, now);

    // Time-windowed metrics
    const lastHour = this.calculateMetricsForPeriod(oneHourAgo, now);
    const last24Hours = this.calculateMetricsForPeriod(oneDayAgo, now);
    const lastSession = this.calculateMetricsForPeriod(this.sessionStart, now);

    return {
      ...overall,
      lastHour,
      last24Hours,
      lastSession,
    };
  }

  /**
   * Calculate metrics for a specific time period
   */
  private calculateMetricsForPeriod(startTime: number, endTime: number): Partial<PrefetchMetrics> {
    const periodEvents = this.events.filter(
      (e) => e.timestamp >= startTime && e.timestamp <= endTime
    );

    const prefetches = periodEvents.filter((e) => e.type === 'prefetch');
    const navigations = periodEvents.filter((e) => e.type === 'navigation');
    const hits = periodEvents.filter((e) => e.type === 'hit');
    const misses = periodEvents.filter((e) => e.type === 'miss');
    const waste = periodEvents.filter((e) => e.type === 'waste');

    const totalPrefetches = prefetches.length;
    const totalNavigations = navigations.length;
    const totalHits = hits.length;
    const totalMisses = misses.length;
    const totalWaste = waste.length;

    // Hit rate
    const hitRate = totalNavigations > 0 ? (totalHits / totalNavigations) * 100 : 0;

    // Waste rate
    const wasteRate = totalPrefetches > 0 ? (totalWaste / totalPrefetches) * 100 : 0;

    // Average time saved
    const timeSavings = hits
      .map((h) => h.metadata?.timeElapsed || 0)
      .filter((t) => t > 0);
    const averageTimeSaved = timeSavings.length > 0
      ? timeSavings.reduce((sum, t) => sum + t, 0) / timeSavings.length
      : 0;

    // Bandwidth metrics
    const totalBytesPrefetched = prefetches.reduce(
      (sum, p) => sum + (p.metadata?.bytes || 50 * 1024), // Estimate 50KB if not tracked
      0
    );

    const totalBytesWasted = waste.reduce(
      (sum, w) => sum + (w.metadata?.bytes || 50 * 1024),
      0
    );

    const bandwidthEfficiency = totalBytesPrefetched > 0
      ? ((totalBytesPrefetched - totalBytesWasted) / totalBytesPrefetched) * 100
      : 0;

    // Prediction metrics
    const predictedPrefetches = prefetches.filter((p) => p.metadata?.predicted);
    const predictedHits = hits.filter((h) => {
      const prefetch = prefetches.find((p) => p.route === h.route);
      return prefetch?.metadata?.predicted;
    });

    const predictionAccuracy = predictedPrefetches.length > 0
      ? (predictedHits.length / predictedPrefetches.length) * 100
      : 0;

    const falsePositives = predictedPrefetches.length - predictedHits.length;
    const falseNegatives = totalMisses;

    return {
      totalPrefetches,
      totalNavigations,
      hits: totalHits,
      misses: totalMisses,
      waste: totalWaste,
      hitRate: Math.round(hitRate * 10) / 10,
      wasteRate: Math.round(wasteRate * 10) / 10,
      averageTimeSaved: Math.round(averageTimeSaved),
      totalBytesPrefetched,
      totalBytesWasted,
      bandwidthEfficiency: Math.round(bandwidthEfficiency * 10) / 10,
      predictionAccuracy: Math.round(predictionAccuracy * 10) / 10,
      falsePositives,
      falseNegatives,
    };
  }

  /**
   * Start periodic metrics logging
   */
  private startMetricsLogging(): void {
    if (!this.config.logToConsole) {
      return;
    }

    this.metricsIntervalId = window.setInterval(() => {
      const metrics = this.calculateMetrics();

      console.group('📊 Prefetch Analytics');
      console.log('Overall Performance:');
      console.table({
        'Hit Rate': `${metrics.hitRate}%`,
        'Waste Rate': `${metrics.wasteRate}%`,
        'Avg Time Saved': `${metrics.averageTimeSaved}ms`,
        'Bandwidth Efficiency': `${metrics.bandwidthEfficiency}%`,
        'Prediction Accuracy': `${metrics.predictionAccuracy}%`,
      });

      console.log('Counts:');
      console.table({
        'Total Prefetches': metrics.totalPrefetches,
        'Total Navigations': metrics.totalNavigations,
        'Hits': metrics.hits,
        'Misses': metrics.misses,
        'Waste': metrics.waste,
      });

      console.log('Session Performance:');
      if (metrics.lastSession) {
        console.table({
          'Session Hit Rate': `${metrics.lastSession.hitRate}%`,
          'Session Prefetches': metrics.lastSession.totalPrefetches,
          'Session Hits': metrics.lastSession.hits,
        });
      }

      console.groupEnd();
    }, this.config.metricsInterval);
  }

  /**
   * Stop metrics logging
   */
  stop(): void {
    if (this.metricsIntervalId !== null) {
      clearInterval(this.metricsIntervalId);
      this.metricsIntervalId = null;
    }
  }

  // ============================================
  // WASTE DETECTION
  // ============================================

  /**
   * Check for wasted prefetches (older than 5 minutes and not used)
   */
  detectWaste(): void {
    const now = Date.now();
    const wasteThreshold = 5 * 60 * 1000; // 5 minutes

    const staleRoutes = Array.from(this.prefetchedRoutes).filter((route) => {
      const prefetchEvent = this.events
        .filter((e) => e.type === 'prefetch' && e.route === route)
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      if (!prefetchEvent) {
        return false;
      }

      const age = now - prefetchEvent.timestamp;
      return age > wasteThreshold;
    });

    staleRoutes.forEach((route) => {
      const prefetchEvent = this.events
        .filter((e) => e.type === 'prefetch' && e.route === route)
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      this.trackWaste(route, prefetchEvent?.metadata?.bytes);
      this.prefetchedRoutes.delete(route);
    });
  }

  // ============================================
  // PERSISTENCE
  // ============================================

  /**
   * Load events from storage
   */
  private loadEvents(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Failed to load analytics events', { error });
    }
  }

  /**
   * Save events to storage
   */
  private saveEvents(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
    } catch (error) {
      logger.error('Failed to save analytics events', { error });
    }
  }

  /**
   * Get session start time
   */
  private getSessionStart(): number {
    const stored = sessionStorage.getItem(SESSION_START_KEY);
    if (stored) {
      return parseInt(stored, 10);
    }

    const now = Date.now();
    sessionStorage.setItem(SESSION_START_KEY, now.toString());
    return now;
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Get current metrics
   */
  getMetrics(): PrefetchMetrics {
    // Detect waste before calculating metrics
    this.detectWaste();
    return this.calculateMetrics();
  }

  /**
   * Clear all analytics data
   */
  clear(): void {
    this.events = [];
    this.prefetchedRoutes.clear();
    this.saveEvents();
    logger.info('Analytics data cleared');
  }

  /**
   * Export analytics data for debugging
   */
  export(): { events: PrefetchEvent[]; metrics: PrefetchMetrics } {
    return {
      events: this.events,
      metrics: this.getMetrics(),
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const prefetchAnalytics = new PrefetchAnalytics();

// Auto-detect waste periodically
setInterval(() => {
  prefetchAnalytics.detectWaste();
}, 60 * 1000); // Every minute

// ============================================
// REACT HOOK
// ============================================

/**
 * Hook to access prefetch analytics
 *
 * @example
 * ```tsx
 * function AnalyticsDashboard() {
 *   const metrics = usePrefetchAnalytics();
 *   return <div>Hit Rate: {metrics.hitRate}%</div>;
 * }
 * ```
 */
export function usePrefetchAnalytics(): PrefetchMetrics {
  const [metrics, setMetrics] = React.useState<PrefetchMetrics>(
    prefetchAnalytics.getMetrics()
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prefetchAnalytics.getMetrics());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return metrics;
}

// ============================================
// IMPORTS
// ============================================

import * as React from 'react';

// ============================================
// EXPORTS
// ============================================

export default PrefetchAnalytics;
export type { PrefetchEvent, PrefetchMetrics, AnalyticsConfig };
