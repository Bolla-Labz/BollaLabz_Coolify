// Last Modified: 2025-11-24 12:30
/**
 * React Query Configuration with Optimized Prefetching
 *
 * This configuration enables:
 * - Intelligent stale-while-revalidate caching
 * - Background refetching during idle time
 * - Optimized retry strategies
 * - Prefetch-friendly cache management
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { logger } from '@/lib/monitoring/sentry';
import { toast } from 'react-hot-toast';

// ============================================
// CACHE EVENT HANDLERS
// ============================================

/**
 * Global query cache for handling query-level events
 */
const queryCache = new QueryCache({
  onError: (error, query) => {
    // Log all query errors to Sentry
    logger.error('React Query Error', {
      queryKey: query.queryKey,
      error: error instanceof Error ? error.message : String(error),
    });

    // Don't show toast for background refetch errors
    if (query.state.fetchStatus !== 'idle') {
      return;
    }

    // Show user-friendly error toast
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
    toast.error(errorMessage);
  },
  onSuccess: (data, query) => {
    // Track successful prefetches for analytics
    if (query.meta?.prefetched) {
      logger.info('Prefetch Success', {
        queryKey: query.queryKey,
        dataSize: JSON.stringify(data).length,
      });
    }
  },
});

/**
 * Global mutation cache for handling mutation-level events
 */
const mutationCache = new MutationCache({
  onError: (error, variables, context, mutation) => {
    // Log mutation errors
    logger.error('Mutation Error', {
      mutationKey: mutation.options.mutationKey,
      error: error instanceof Error ? error.message : String(error),
    });

    // Toast notification handled by mutation-specific handlers
  },
  onSuccess: (data, variables, context, mutation) => {
    // Track mutation success
    if (mutation.meta?.optimistic) {
      logger.info('Optimistic Update Success', {
        mutationKey: mutation.options.mutationKey,
      });
    }
  },
});

// ============================================
// QUERY CLIENT CONFIGURATION
// ============================================

/**
 * Optimized React Query client for BollaLabz
 *
 * Key Features:
 * - 5-minute stale time for most queries
 * - 10-minute garbage collection
 * - Smart retry logic with exponential backoff
 * - Network-aware refetching
 * - Prefetch-optimized settings
 */
export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      // Stale-While-Revalidate Strategy
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes (formerly cacheTime)

      // Refetch Behavior
      refetchOnWindowFocus: true, // Refresh when user returns to tab
      refetchOnReconnect: true, // Refresh when network reconnects
      refetchOnMount: true, // Refresh when component mounts

      // Retry Logic with Exponential Backoff
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status && error.status >= 400 && error.status < 500) {
          return false;
        }
        // Retry up to 3 times for server errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Network Mode
      networkMode: 'online', // Only fetch when online

      // Suspense (disabled by default, enable per-query if needed)
      suspense: false,

      // Placeholders
      placeholderData: undefined, // Don't use previous data as placeholder

      // Meta for tracking
      meta: {},
    },
    mutations: {
      // Retry Logic for Mutations
      retry: 1, // Retry failed mutations once
      retryDelay: 1000,

      // Network Mode
      networkMode: 'online',

      // Meta for tracking
      meta: {},
    },
  },
});

// ============================================
// PREFETCH UTILITIES
// ============================================

/**
 * Prefetch a query with optimized settings
 *
 * @param queryKey - React Query key
 * @param queryFn - Function to fetch data
 * @param options - Additional options
 *
 * @example
 * ```ts
 * // Prefetch contacts when hovering over link
 * prefetchQuery(['contacts'], () => api.get('/contacts'))
 * ```
 */
export async function prefetchQuery<T>(
  queryKey: unknown[],
  queryFn: () => Promise<T>,
  options?: {
    staleTime?: number;
    priority?: 'high' | 'medium' | 'low';
  }
) {
  // Use high priority queries immediately, queue low priority
  if (options?.priority === 'low' && 'requestIdleCallback' in window) {
    return new Promise<void>((resolve) => {
      requestIdleCallback(() => {
        queryClient.prefetchQuery({
          queryKey,
          queryFn,
          staleTime: options?.staleTime,
          meta: { prefetched: true },
        }).then(() => resolve());
      });
    });
  }

  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: options?.staleTime,
    meta: { prefetched: true },
  });
}

/**
 * Invalidate queries by pattern
 * Useful for invalidating related queries after mutations
 *
 * @example
 * ```ts
 * // Invalidate all contact-related queries
 * invalidateQueries(['contacts'])
 * ```
 */
export async function invalidateQueries(queryKey: unknown[]) {
  return queryClient.invalidateQueries({ queryKey });
}

/**
 * Set query data manually
 * Useful for optimistic updates
 *
 * @example
 * ```ts
 * // Optimistically add contact
 * setQueryData(['contacts'], (old) => [...old, newContact])
 * ```
 */
export function setQueryData<T>(queryKey: unknown[], updater: T | ((old: T | undefined) => T)) {
  return queryClient.setQueryData(queryKey, updater);
}

/**
 * Get query data without triggering a fetch
 *
 * @example
 * ```ts
 * const contacts = getQueryData(['contacts'])
 * ```
 */
export function getQueryData<T>(queryKey: unknown[]): T | undefined {
  return queryClient.getQueryData(queryKey);
}

/**
 * Cancel ongoing queries
 * Useful when navigating away or when prefetch is no longer needed
 */
export async function cancelQueries(queryKey: unknown[]) {
  return queryClient.cancelQueries({ queryKey });
}

// ============================================
// CACHE MANAGEMENT
// ============================================

/**
 * Clear all cached data
 * Use sparingly - typically only on logout
 */
export function clearCache() {
  queryClient.clear();
  logger.info('Query cache cleared');
}

/**
 * Remove specific query from cache
 */
export function removeQueries(queryKey: unknown[]) {
  queryClient.removeQueries({ queryKey });
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats() {
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();

  return {
    totalQueries: queries.length,
    activeQueries: queries.filter(q => q.state.fetchStatus !== 'idle').length,
    staleQueries: queries.filter(q => q.isStale()).length,
    cacheSize: new Blob([JSON.stringify(cache)]).size,
  };
}

// ============================================
// QUERY KEY FACTORIES
// ============================================

/**
 * Standard query key factories for consistency
 * This ensures we use the same keys for queries and prefetches
 */
export const queryKeys = {
  // Contacts
  contacts: {
    all: ['contacts'] as const,
    list: (filters?: any) => ['contacts', 'list', filters] as const,
    detail: (id: string) => ['contacts', 'detail', id] as const,
  },

  // Conversations
  conversations: {
    all: ['conversations'] as const,
    list: (filters?: any) => ['conversations', 'list', filters] as const,
    detail: (id: string) => ['conversations', 'detail', id] as const,
    messages: (id: string) => ['conversations', 'messages', id] as const,
  },

  // Tasks
  tasks: {
    all: ['tasks'] as const,
    list: (filters?: any) => ['tasks', 'list', filters] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
  },

  // Calendar
  calendar: {
    all: ['calendar'] as const,
    events: (start: string, end: string) => ['calendar', 'events', start, end] as const,
    event: (id: string) => ['calendar', 'event', id] as const,
  },

  // Dashboard
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    activity: ['dashboard', 'activity'] as const,
    health: ['dashboard', 'health'] as const,
  },

  // Analytics
  analytics: {
    people: ['analytics', 'people'] as const,
    financial: ['analytics', 'financial'] as const,
    costs: ['analytics', 'costs'] as const,
  },
};

// ============================================
// EXPORTS
// ============================================

export {
  queryCache,
  mutationCache,
};

export default queryClient;
