// Last Modified: 2025-11-24 12:35
/**
 * Intelligent Prefetch Manager
 *
 * Tracks user navigation patterns and predictively prefetches
 * the most likely next destinations to minimize perceived load times.
 *
 * Features:
 * - Navigation pattern learning
 * - Predictive prefetching
 * - Bandwidth-aware operation
 * - Priority queue management
 * - Exponential backoff for failures
 */

import { prefetchQuery, queryKeys } from '@/lib/query/queryClient';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/monitoring/sentry';

// ============================================
// TYPES
// ============================================

interface NavigationPattern {
  from: string;
  to: string;
  count: number;
  lastVisit: number;
}

interface PrefetchTask {
  route: string;
  priority: number;
  queryKey: unknown[];
  queryFn: () => Promise<any>;
  timestamp: number;
  retryCount: number;
}

interface PrefetchConfig {
  maxConcurrent: number;
  maxRetries: number;
  bandwidthLimit: number; // bytes per minute
  patternHistorySize: number;
  predictionThreshold: number;
}

interface BandwidthTracker {
  bytesTransferred: number;
  windowStart: number;
  windowSize: number; // 1 minute in ms
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

const DEFAULT_CONFIG: PrefetchConfig = {
  maxConcurrent: 3,
  maxRetries: 2,
  bandwidthLimit: 1024 * 1024, // 1MB per minute
  patternHistorySize: 100,
  predictionThreshold: 0.2, // 20% probability to trigger prefetch
};

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEY = 'bollalabz_navigation_patterns';
const LAST_ROUTE_KEY = 'bollalabz_last_route';

// ============================================
// PREFETCH MANAGER CLASS
// ============================================

class PrefetchManager {
  private config: PrefetchConfig;
  private patterns: Map<string, NavigationPattern[]>;
  private prefetchQueue: PrefetchTask[];
  private activePrefetches: Set<string>;
  private failedPrefetches: Map<string, number>;
  private bandwidth: BandwidthTracker;
  private currentRoute: string;

  constructor(config: Partial<PrefetchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.patterns = new Map();
    this.prefetchQueue = [];
    this.activePrefetches = new Set();
    this.failedPrefetches = new Map();
    this.bandwidth = {
      bytesTransferred: 0,
      windowStart: Date.now(),
      windowSize: 60 * 1000, // 1 minute
    };
    this.currentRoute = '';

    this.loadPatterns();
    this.startBandwidthWindowReset();
  }

  // ============================================
  // NAVIGATION TRACKING
  // ============================================

  /**
   * Track navigation to a new route
   * Updates patterns and triggers predictive prefetches
   */
  trackNavigation(route: string): void {
    const previousRoute = this.currentRoute || this.getLastRoute();

    if (previousRoute && previousRoute !== route) {
      this.recordPattern(previousRoute, route);
    }

    this.currentRoute = route;
    this.saveLastRoute(route);

    // Predict and prefetch next likely destinations
    this.predictAndPrefetch(route);

    logger.info('Navigation tracked', {
      from: previousRoute,
      to: route,
      patternsCount: this.patterns.size,
    });
  }

  /**
   * Record navigation pattern
   */
  private recordPattern(from: string, to: string): void {
    const patterns = this.patterns.get(from) || [];
    const existing = patterns.find((p) => p.to === to);

    if (existing) {
      existing.count++;
      existing.lastVisit = Date.now();
    } else {
      patterns.push({
        from,
        to,
        count: 1,
        lastVisit: Date.now(),
      });
    }

    // Limit pattern history size
    if (patterns.length > this.config.patternHistorySize) {
      patterns.sort((a, b) => b.count - a.count);
      patterns.splice(this.config.patternHistorySize);
    }

    this.patterns.set(from, patterns);
    this.savePatterns();
  }

  // ============================================
  // PREDICTIVE PREFETCHING
  // ============================================

  /**
   * Predict next routes and prefetch their data
   */
  private predictAndPrefetch(currentRoute: string): void {
    const predictions = this.predictNextRoutes(currentRoute, 3);

    predictions.forEach((prediction, index) => {
      const priority = prediction.probability * (3 - index); // Higher priority for higher probability
      this.queuePrefetch(prediction.route, priority);
    });
  }

  /**
   * Predict most likely next routes
   */
  private predictNextRoutes(
    from: string,
    limit: number = 3
  ): Array<{ route: string; probability: number }> {
    const patterns = this.patterns.get(from) || [];

    if (patterns.length === 0) {
      return this.getDefaultPredictions(from, limit);
    }

    // Calculate probabilities
    const totalCount = patterns.reduce((sum, p) => sum + p.count, 0);
    const predictions = patterns
      .map((p) => ({
        route: p.to,
        probability: p.count / totalCount,
        recency: Date.now() - p.lastVisit,
      }))
      // Boost recent visits
      .map((p) => ({
        ...p,
        probability: p.probability * (1 + 0.1 / (p.recency / (24 * 60 * 60 * 1000))),
      }))
      .filter((p) => p.probability >= this.config.predictionThreshold)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, limit);

    return predictions;
  }

  /**
   * Default predictions when no patterns exist
   */
  private getDefaultPredictions(
    currentRoute: string,
    limit: number
  ): Array<{ route: string; probability: number }> {
    const defaults: Record<string, string[]> = {
      '/dashboard': ['/contacts', '/tasks', '/conversations'],
      '/contacts': ['/conversations', '/tasks', '/dashboard'],
      '/conversations': ['/contacts', '/dashboard', '/tasks'],
      '/tasks': ['/dashboard', '/calendar', '/contacts'],
      '/calendar': ['/tasks', '/dashboard', '/contacts'],
    };

    const routes = defaults[currentRoute] || ['/dashboard', '/contacts', '/tasks'];
    return routes.slice(0, limit).map((route, index) => ({
      route,
      probability: 0.5 - index * 0.1,
    }));
  }

  // ============================================
  // PREFETCH QUEUE MANAGEMENT
  // ============================================

  /**
   * Queue a prefetch task
   */
  private queuePrefetch(route: string, priority: number): void {
    // Don't prefetch current route
    if (route === this.currentRoute) {
      return;
    }

    // Don't queue if already active or recently failed
    if (this.activePrefetches.has(route)) {
      return;
    }

    const failCount = this.failedPrefetches.get(route) || 0;
    if (failCount >= this.config.maxRetries) {
      return;
    }

    // Check bandwidth limit
    if (!this.checkBandwidthAvailable()) {
      logger.warn('Bandwidth limit reached, skipping prefetch', { route });
      return;
    }

    const task = this.createPrefetchTask(route, priority);
    if (!task) {
      return;
    }

    // Remove existing task for this route
    this.prefetchQueue = this.prefetchQueue.filter((t) => t.route !== route);

    // Add new task
    this.prefetchQueue.push(task);

    // Sort by priority (highest first)
    this.prefetchQueue.sort((a, b) => b.priority - a.priority);

    // Process queue
    this.processPrefetchQueue();
  }

  /**
   * Create a prefetch task for a route
   */
  private createPrefetchTask(route: string, priority: number): PrefetchTask | null {
    const routeConfig = this.getRouteQueryConfig(route);
    if (!routeConfig) {
      return null;
    }

    return {
      route,
      priority,
      queryKey: routeConfig.queryKey,
      queryFn: routeConfig.queryFn,
      timestamp: Date.now(),
      retryCount: 0,
    };
  }

  /**
   * Get query configuration for a route
   */
  private getRouteQueryConfig(route: string): {
    queryKey: unknown[];
    queryFn: () => Promise<any>;
  } | null {
    const configs: Record<string, { queryKey: unknown[]; queryFn: () => Promise<any> }> = {
      '/contacts': {
        queryKey: queryKeys.contacts.all,
        queryFn: () => api.get('/contacts'),
      },
      '/conversations': {
        queryKey: queryKeys.conversations.all,
        queryFn: () => api.get('/conversations'),
      },
      '/tasks': {
        queryKey: queryKeys.tasks.all,
        queryFn: () => api.get('/tasks'),
      },
      '/dashboard': {
        queryKey: queryKeys.dashboard.stats,
        queryFn: () => api.get('/dashboard/stats'),
      },
      '/calendar': {
        queryKey: queryKeys.calendar.all,
        queryFn: () => api.get('/calendar/events'),
      },
      '/analytics': {
        queryKey: queryKeys.analytics.people,
        queryFn: () => api.get('/analytics/people'),
      },
    };

    return configs[route] || null;
  }

  /**
   * Process prefetch queue
   */
  private async processPrefetchQueue(): Promise<void> {
    // Respect concurrency limit
    if (this.activePrefetches.size >= this.config.maxConcurrent) {
      return;
    }

    const task = this.prefetchQueue.shift();
    if (!task) {
      return;
    }

    this.activePrefetches.add(task.route);

    try {
      const startSize = this.bandwidth.bytesTransferred;

      await prefetchQuery(task.queryKey, task.queryFn, {
        staleTime: 5 * 60 * 1000,
        priority: task.priority > 2 ? 'high' : task.priority > 1 ? 'medium' : 'low',
      });

      // Estimate bandwidth (rough approximation)
      const estimatedSize = 50 * 1024; // Assume ~50KB per query
      this.trackBandwidth(estimatedSize);

      logger.info('Prefetch success', {
        route: task.route,
        priority: task.priority,
        queueLength: this.prefetchQueue.length,
      });

      // Clear failure count on success
      this.failedPrefetches.delete(task.route);
    } catch (error) {
      logger.error('Prefetch failed', {
        route: task.route,
        error: error instanceof Error ? error.message : String(error),
      });

      // Track failure
      const failCount = (this.failedPrefetches.get(task.route) || 0) + 1;
      this.failedPrefetches.set(task.route, failCount);

      // Retry with exponential backoff if under limit
      if (failCount < this.config.maxRetries) {
        const delay = Math.min(1000 * 2 ** failCount, 10000);
        setTimeout(() => {
          this.queuePrefetch(task.route, task.priority * 0.5);
        }, delay);
      }
    } finally {
      this.activePrefetches.delete(task.route);
      // Process next task
      this.processPrefetchQueue();
    }
  }

  // ============================================
  // BANDWIDTH MANAGEMENT
  // ============================================

  /**
   * Check if bandwidth is available
   */
  private checkBandwidthAvailable(): boolean {
    this.resetBandwidthWindowIfNeeded();
    return this.bandwidth.bytesTransferred < this.config.bandwidthLimit;
  }

  /**
   * Track bandwidth usage
   */
  private trackBandwidth(bytes: number): void {
    this.resetBandwidthWindowIfNeeded();
    this.bandwidth.bytesTransferred += bytes;
  }

  /**
   * Reset bandwidth window if expired
   */
  private resetBandwidthWindowIfNeeded(): void {
    const now = Date.now();
    if (now - this.bandwidth.windowStart >= this.bandwidth.windowSize) {
      this.bandwidth.bytesTransferred = 0;
      this.bandwidth.windowStart = now;
    }
  }

  /**
   * Start periodic bandwidth window reset
   */
  private startBandwidthWindowReset(): void {
    setInterval(() => {
      this.resetBandwidthWindowIfNeeded();
    }, 60 * 1000); // Check every minute
  }

  // ============================================
  // PERSISTENCE
  // ============================================

  /**
   * Load patterns from localStorage
   */
  private loadPatterns(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.patterns = new Map(Object.entries(data));
      }
    } catch (error) {
      logger.error('Failed to load navigation patterns', { error });
    }
  }

  /**
   * Save patterns to localStorage
   */
  private savePatterns(): void {
    try {
      const data = Object.fromEntries(this.patterns.entries());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save navigation patterns', { error });
    }
  }

  /**
   * Get last visited route
   */
  private getLastRoute(): string {
    return localStorage.getItem(LAST_ROUTE_KEY) || '';
  }

  /**
   * Save last visited route
   */
  private saveLastRoute(route: string): void {
    localStorage.setItem(LAST_ROUTE_KEY, route);
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Manual prefetch trigger
   */
  prefetch(route: string, priority: number = 1): void {
    this.queuePrefetch(route, priority);
  }

  /**
   * Get analytics data
   */
  getAnalytics() {
    const totalPatterns = Array.from(this.patterns.values()).reduce(
      (sum, patterns) => sum + patterns.length,
      0
    );

    const totalNavigations = Array.from(this.patterns.values()).reduce(
      (sum, patterns) => sum + patterns.reduce((s, p) => s + p.count, 0),
      0
    );

    return {
      totalRoutes: this.patterns.size,
      totalPatterns,
      totalNavigations,
      queueLength: this.prefetchQueue.length,
      activePrefetches: this.activePrefetches.size,
      failedRoutes: this.failedPrefetches.size,
      bandwidthUsed: this.bandwidth.bytesTransferred,
      bandwidthLimit: this.config.bandwidthLimit,
    };
  }

  /**
   * Clear all patterns
   */
  clearPatterns(): void {
    this.patterns.clear();
    this.savePatterns();
    logger.info('Navigation patterns cleared');
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const prefetchManager = new PrefetchManager();

// ============================================
// EXPORTS
// ============================================

export default PrefetchManager;
export type { PrefetchConfig, NavigationPattern };
