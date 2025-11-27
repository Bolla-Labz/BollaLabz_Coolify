// Last Modified: 2025-11-24 12:40
/**
 * usePrefetchOnHover Hook
 *
 * Intelligently prefetches route data when user hovers over a link.
 * Includes debouncing to avoid unnecessary prefetches on quick mouse movements.
 *
 * Features:
 * - 100ms hover delay before prefetching
 * - Automatic cancellation if mouse leaves
 * - Priority-based prefetching
 * - Integration with PrefetchManager
 * - Cache-aware (won't refetch if already cached)
 */

import { useCallback, useRef } from 'react';
import { prefetchManager } from '@/lib/prefetch/PrefetchManager';
import { queryClient } from '@/lib/query/queryClient';

// ============================================
// TYPES
// ============================================

interface UsePrefetchOnHoverOptions {
  /**
   * Delay in milliseconds before triggering prefetch
   * @default 100
   */
  delay?: number;

  /**
   * Priority of the prefetch
   * @default 'medium'
   */
  priority?: 'high' | 'medium' | 'low';

  /**
   * Whether to prefetch even if already in cache
   * @default false
   */
  force?: boolean;

  /**
   * Callback when prefetch starts
   */
  onPrefetchStart?: (route: string) => void;

  /**
   * Callback when prefetch completes
   */
  onPrefetchComplete?: (route: string) => void;
}

interface UsePrefetchOnHoverReturn {
  /**
   * Handler for onMouseEnter event
   */
  onMouseEnter: () => void;

  /**
   * Handler for onMouseLeave event
   */
  onMouseLeave: () => void;

  /**
   * Handler for onTouchStart event (mobile support)
   */
  onTouchStart: () => void;

  /**
   * Check if route is currently being prefetched
   */
  isPrefetching: boolean;

  /**
   * Manually trigger prefetch
   */
  prefetch: () => void;

  /**
   * Cancel ongoing prefetch
   */
  cancel: () => void;
}

// ============================================
// PRIORITY MAPPING
// ============================================

const PRIORITY_VALUES = {
  high: 3,
  medium: 2,
  low: 1,
};

// ============================================
// HOOK IMPLEMENTATION
// ============================================

/**
 * Hook for prefetching route data on hover
 *
 * @param route - The route to prefetch
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function NavLink({ to, children }) {
 *   const { onMouseEnter, onMouseLeave } = usePrefetchOnHover(to);
 *
 *   return (
 *     <Link
 *       to={to}
 *       onMouseEnter={onMouseEnter}
 *       onMouseLeave={onMouseLeave}
 *     >
 *       {children}
 *     </Link>
 *   );
 * }
 * ```
 */
export function usePrefetchOnHover(
  route: string,
  options: UsePrefetchOnHoverOptions = {}
): UsePrefetchOnHoverReturn {
  const {
    delay = 100,
    priority = 'medium',
    force = false,
    onPrefetchStart,
    onPrefetchComplete,
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPrefetchingRef = useRef(false);
  const hasBeenPrefetchedRef = useRef(false);

  /**
   * Clear any pending timeout
   */
  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /**
   * Check if route data is already in cache
   */
  const isDataCached = useCallback((): boolean => {
    // Map routes to their query keys
    const routeToQueryKey: Record<string, unknown[]> = {
      '/contacts': ['contacts'],
      '/conversations': ['conversations'],
      '/tasks': ['tasks'],
      '/dashboard': ['dashboard', 'stats'],
      '/calendar': ['calendar'],
      '/analytics': ['analytics', 'people'],
    };

    const queryKey = routeToQueryKey[route];
    if (!queryKey) {
      return false;
    }

    const cache = queryClient.getQueryCache();
    const query = cache.find({ queryKey });

    // Check if data exists and is fresh
    if (query && query.state.data && !query.isStale()) {
      return true;
    }

    return false;
  }, [route]);

  /**
   * Execute the prefetch
   */
  const executePrefetch = useCallback(() => {
    // Don't prefetch if already in progress
    if (isPrefetchingRef.current) {
      return;
    }

    // Don't prefetch if already fetched (unless forced)
    if (hasBeenPrefetchedRef.current && !force) {
      return;
    }

    // Don't prefetch if data is cached (unless forced)
    if (isDataCached() && !force) {
      return;
    }

    isPrefetchingRef.current = true;
    hasBeenPrefetchedRef.current = true;

    // Notify start
    onPrefetchStart?.(route);

    // Trigger prefetch via PrefetchManager
    const priorityValue = PRIORITY_VALUES[priority];
    prefetchManager.prefetch(route, priorityValue);

    // Notify complete (approximate - we don't wait for actual completion)
    setTimeout(() => {
      isPrefetchingRef.current = false;
      onPrefetchComplete?.(route);
    }, 50);
  }, [route, force, priority, isDataCached, onPrefetchStart, onPrefetchComplete]);

  /**
   * Start prefetch timer on mouse enter
   */
  const handleMouseEnter = useCallback(() => {
    clearPendingTimeout();

    timeoutRef.current = setTimeout(() => {
      executePrefetch();
    }, delay);
  }, [delay, executePrefetch, clearPendingTimeout]);

  /**
   * Cancel prefetch timer on mouse leave
   */
  const handleMouseLeave = useCallback(() => {
    clearPendingTimeout();
  }, [clearPendingTimeout]);

  /**
   * Handle touch start for mobile devices
   */
  const handleTouchStart = useCallback(() => {
    // On mobile, prefetch immediately without delay
    executePrefetch();
  }, [executePrefetch]);

  /**
   * Manual prefetch trigger
   */
  const prefetch = useCallback(() => {
    clearPendingTimeout();
    executePrefetch();
  }, [executePrefetch, clearPendingTimeout]);

  /**
   * Cancel any ongoing operations
   */
  const cancel = useCallback(() => {
    clearPendingTimeout();
    isPrefetchingRef.current = false;
  }, [clearPendingTimeout]);

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onTouchStart: handleTouchStart,
    isPrefetching: isPrefetchingRef.current,
    prefetch,
    cancel,
  };
}

// ============================================
// CONVENIENCE HOOK FOR ROUTE PRELOADING
// ============================================

/**
 * Hook for preloading route components on hover
 * Complementary to usePrefetchOnHover for component code splitting
 *
 * @example
 * ```tsx
 * const { onMouseEnter, onMouseLeave } = usePreloadRouteOnHover('/dashboard');
 * ```
 */
export function usePreloadRouteOnHover(route: string, delay: number = 100) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      // Dynamically import route component
      const routeMap: Record<string, () => Promise<any>> = {
        '/dashboard': () => import('@/pages/Dashboard'),
        '/contacts': () => import('@/pages/Contacts'),
        '/conversations': () => import('@/pages/Conversations'),
        '/tasks': () => import('@/pages/Tasks'),
        '/calendar': () => import('@/pages/Calendar'),
        '/workflows': () => import('@/pages/Workflows'),
        '/financial': () => import('@/pages/Financial'),
        '/analytics': () => import('@/pages/PeopleAnalytics'),
        '/settings': () => import('@/pages/Settings'),
      };

      const loader = routeMap[route];
      if (loader) {
        loader().catch((err) => {
          console.error(`Failed to preload route ${route}:`, err);
        });
      }
    }, delay);
  }, [route, delay]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };
}

// ============================================
// COMBINED HOOK
// ============================================

/**
 * Combined hook that prefetches both route component and data
 *
 * @example
 * ```tsx
 * const prefetchHandlers = usePrefetchRoute('/contacts', { priority: 'high' });
 *
 * <Link to="/contacts" {...prefetchHandlers}>
 *   Contacts
 * </Link>
 * ```
 */
export function usePrefetchRoute(
  route: string,
  options: UsePrefetchOnHoverOptions = {}
) {
  const dataPrefetch = usePrefetchOnHover(route, options);
  const componentPrefetch = usePreloadRouteOnHover(route, options.delay);

  const handleMouseEnter = useCallback(() => {
    dataPrefetch.onMouseEnter();
    componentPrefetch.onMouseEnter();
  }, [dataPrefetch, componentPrefetch]);

  const handleMouseLeave = useCallback(() => {
    dataPrefetch.onMouseLeave();
    componentPrefetch.onMouseLeave();
  }, [dataPrefetch, componentPrefetch]);

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onTouchStart: dataPrefetch.onTouchStart,
    isPrefetching: dataPrefetch.isPrefetching,
    prefetch: () => {
      dataPrefetch.prefetch();
      componentPrefetch.onMouseEnter();
    },
    cancel: dataPrefetch.cancel,
  };
}

// ============================================
// EXPORTS
// ============================================

export default usePrefetchOnHover;
export type { UsePrefetchOnHoverOptions, UsePrefetchOnHoverReturn };
