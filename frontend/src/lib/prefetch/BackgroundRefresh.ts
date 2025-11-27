// Last Modified: 2025-11-24 12:45
/**
 * Background Refresh Manager
 *
 * Intelligently refreshes stale data in the background without
 * disrupting user experience.
 *
 * Features:
 * - requestIdleCallback integration for non-blocking updates
 * - Page visibility API to pause when tab is hidden
 * - Smart staleness detection
 * - Configurable refresh intervals
 * - Automatic cleanup on unmount
 */

import { queryClient, queryKeys } from '@/lib/query/queryClient';
import { logger } from '@/lib/monitoring/sentry';

// ============================================
// TYPES
// ============================================

interface RefreshConfig {
  /**
   * Interval between refresh checks in milliseconds
   * @default 30000 (30 seconds)
   */
  interval?: number;

  /**
   * Maximum staleness age before forcing refresh
   * @default 300000 (5 minutes)
   */
  maxStaleAge?: number;

  /**
   * Whether to refresh when tab becomes visible
   * @default true
   */
  refreshOnFocus?: boolean;

  /**
   * Whether to use requestIdleCallback
   * @default true
   */
  useIdleCallback?: boolean;

  /**
   * Priority queries that should refresh more frequently
   */
  priorityQueries?: string[][];
}

interface RefreshTask {
  queryKey: unknown[];
  priority: 'high' | 'low';
  lastRefresh: number;
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

const DEFAULT_CONFIG: Required<RefreshConfig> = {
  interval: 30 * 1000, // 30 seconds
  maxStaleAge: 5 * 60 * 1000, // 5 minutes
  refreshOnFocus: true,
  useIdleCallback: true,
  priorityQueries: [
    ['dashboard', 'stats'],
    ['dashboard', 'activity'],
    ['notifications'],
  ],
};

// ============================================
// BACKGROUND REFRESH MANAGER CLASS
// ============================================

class BackgroundRefreshManager {
  private config: Required<RefreshConfig>;
  private intervalId: number | null = null;
  private isTabVisible: boolean = true;
  private isUserActive: boolean = true;
  private lastActivityTime: number = Date.now();
  private activityTimeoutId: number | null = null;

  constructor(config: RefreshConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupVisibilityTracking();
    this.setupActivityTracking();
  }

  // ============================================
  // LIFECYCLE
  // ============================================

  /**
   * Start background refresh
   */
  start(): void {
    if (this.intervalId !== null) {
      logger.warn('BackgroundRefresh already started');
      return;
    }

    logger.info('BackgroundRefresh started', {
      interval: this.config.interval,
      maxStaleAge: this.config.maxStaleAge,
    });

    // Schedule periodic refresh
    this.intervalId = window.setInterval(() => {
      this.performRefresh();
    }, this.config.interval);

    // Do initial refresh
    this.performRefresh();
  }

  /**
   * Stop background refresh
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('BackgroundRefresh stopped');
    }

    if (this.activityTimeoutId !== null) {
      clearTimeout(this.activityTimeoutId);
      this.activityTimeoutId = null;
    }
  }

  // ============================================
  // REFRESH LOGIC
  // ============================================

  /**
   * Perform background refresh
   */
  private async performRefresh(): Promise<void> {
    // Skip if tab is hidden
    if (!this.isTabVisible) {
      return;
    }

    // Skip if user is actively interacting
    if (this.isUserActive) {
      return;
    }

    const tasks = this.getRefreshTasks();

    if (tasks.length === 0) {
      return;
    }

    logger.info('BackgroundRefresh: Starting refresh', {
      taskCount: tasks.length,
    });

    // Use requestIdleCallback if available and enabled
    if (this.config.useIdleCallback && 'requestIdleCallback' in window) {
      this.refreshWithIdleCallback(tasks);
    } else {
      this.refreshImmediate(tasks);
    }
  }

  /**
   * Get queries that need refreshing
   */
  private getRefreshTasks(): RefreshTask[] {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    const now = Date.now();
    const tasks: RefreshTask[] = [];

    for (const query of queries) {
      // Skip queries that are currently fetching
      if (query.state.fetchStatus !== 'idle') {
        continue;
      }

      // Skip queries without data
      if (!query.state.data) {
        continue;
      }

      const queryKey = query.queryKey;
      const dataUpdatedAt = query.state.dataUpdatedAt;
      const age = now - dataUpdatedAt;

      // Check if stale enough to refresh
      const isPriority = this.isPriorityQuery(queryKey);
      const staleThreshold = isPriority
        ? this.config.maxStaleAge * 0.5 // Refresh priority queries at 50% of max stale age
        : this.config.maxStaleAge;

      if (age < staleThreshold && !query.isStale()) {
        continue;
      }

      tasks.push({
        queryKey,
        priority: isPriority ? 'high' : 'low',
        lastRefresh: dataUpdatedAt,
      });
    }

    // Sort by priority, then by staleness
    tasks.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : 1;
      }
      return a.lastRefresh - b.lastRefresh;
    });

    return tasks;
  }

  /**
   * Check if query is in priority list
   */
  private isPriorityQuery(queryKey: unknown[]): boolean {
    return this.config.priorityQueries.some((priorityKey) => {
      if (priorityKey.length !== queryKey.length) {
        return false;
      }
      return priorityKey.every((key, index) => key === queryKey[index]);
    });
  }

  /**
   * Refresh using requestIdleCallback
   */
  private refreshWithIdleCallback(tasks: RefreshTask[]): void {
    if (tasks.length === 0) {
      return;
    }

    const task = tasks.shift()!;

    requestIdleCallback(
      async (deadline) => {
        // Only refresh if we have time
        if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
          try {
            await queryClient.invalidateQueries({
              queryKey: task.queryKey,
              refetchType: 'active',
            });

            logger.debug('BackgroundRefresh: Query refreshed', {
              queryKey: task.queryKey,
              priority: task.priority,
            });
          } catch (error) {
            logger.error('BackgroundRefresh: Refresh failed', {
              queryKey: task.queryKey,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        // Continue with next task
        if (tasks.length > 0) {
          this.refreshWithIdleCallback(tasks);
        }
      },
      { timeout: 1000 } // Force refresh after 1 second if idle never happens
    );
  }

  /**
   * Refresh immediately (fallback for browsers without requestIdleCallback)
   */
  private async refreshImmediate(tasks: RefreshTask[]): Promise<void> {
    for (const task of tasks) {
      try {
        await queryClient.invalidateQueries({
          queryKey: task.queryKey,
          refetchType: 'active',
        });

        logger.debug('BackgroundRefresh: Query refreshed (immediate)', {
          queryKey: task.queryKey,
          priority: task.priority,
        });

        // Add small delay to avoid overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        logger.error('BackgroundRefresh: Refresh failed', {
          queryKey: task.queryKey,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  // ============================================
  // VISIBILITY TRACKING
  // ============================================

  /**
   * Setup page visibility tracking
   */
  private setupVisibilityTracking(): void {
    const handleVisibilityChange = () => {
      this.isTabVisible = document.visibilityState === 'visible';

      if (this.isTabVisible && this.config.refreshOnFocus) {
        logger.info('Tab became visible, triggering refresh');
        // Trigger immediate refresh when tab becomes visible
        setTimeout(() => this.performRefresh(), 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  // ============================================
  // ACTIVITY TRACKING
  // ============================================

  /**
   * Setup user activity tracking
   */
  private setupActivityTracking(): void {
    const ACTIVITY_TIMEOUT = 3000; // 3 seconds

    const handleActivity = () => {
      this.isUserActive = true;
      this.lastActivityTime = Date.now();

      // Clear existing timeout
      if (this.activityTimeoutId !== null) {
        clearTimeout(this.activityTimeoutId);
      }

      // Set user as inactive after timeout
      this.activityTimeoutId = window.setTimeout(() => {
        this.isUserActive = false;
        logger.debug('User inactive, background refresh can proceed');
      }, ACTIVITY_TIMEOUT);
    };

    // Listen to various user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Manually trigger a refresh
   */
  refresh(): void {
    this.performRefresh();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RefreshConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('BackgroundRefresh config updated', config);

    // Restart with new config
    this.stop();
    this.start();
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.intervalId !== null,
      isTabVisible: this.isTabVisible,
      isUserActive: this.isUserActive,
      lastActivityTime: this.lastActivityTime,
      config: this.config,
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const backgroundRefresh = new BackgroundRefreshManager();

// ============================================
// REACT HOOK
// ============================================

/**
 * Hook to enable background refresh in a component
 *
 * @example
 * ```tsx
 * function App() {
 *   useBackgroundRefresh();
 *   return <div>...</div>;
 * }
 * ```
 */
export function useBackgroundRefresh(config?: RefreshConfig): void {
  // Only run on mount/unmount
  React.useEffect(() => {
    if (config) {
      backgroundRefresh.updateConfig(config);
    }

    backgroundRefresh.start();

    return () => {
      backgroundRefresh.stop();
    };
  }, []);
}

// ============================================
// IMPORTS (needed for hook)
// ============================================

import * as React from 'react';

// ============================================
// EXPORTS
// ============================================

export default BackgroundRefreshManager;
export type { RefreshConfig, RefreshTask };
