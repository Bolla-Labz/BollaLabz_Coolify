// Last Modified: 2025-11-24 00:00
/**
 * Resource Preloader Utility
 * Preload components and data for faster navigation
 * Implements intelligent preloading strategies
 */

import { ComponentType } from 'react';

// ============================================
// TYPES
// ============================================

interface PreloadedComponent {
  loader: () => Promise<{ default: ComponentType }>;
  promise: Promise<{ default: ComponentType }> | null;
  loaded: boolean;
}

interface PreloadedData<T = any> {
  fetcher: () => Promise<T>;
  promise: Promise<T> | null;
  data: T | null;
  error: Error | null;
  timestamp: number;
}

// ============================================
// STORAGE
// ============================================

// Component cache
const componentCache = new Map<string, PreloadedComponent>();

// Data cache with TTL
const dataCache = new Map<string, PreloadedData>();

// Default cache duration: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

// ============================================
// COMPONENT PRELOADING
// ============================================

/**
 * Preload a lazy-loaded component
 * Call this on hover or before navigation to reduce loading time
 *
 * @param loader - The dynamic import function
 * @returns Promise resolving to the loaded component
 *
 * @example
 * ```tsx
 * const LazyComponent = lazy(() => import('./Component'));
 *
 * // Preload on hover
 * <Link
 *   to="/page"
 *   onMouseEnter={() => preloadComponent(() => import('./Component'))}
 * >
 *   Go to Page
 * </Link>
 * ```
 */
export function preloadComponent(
  loader: () => Promise<{ default: ComponentType }>
): void {
  const key = loader.toString();

  // Check if already cached
  if (componentCache.has(key)) {
    const cached = componentCache.get(key)!;
    if (cached.loaded) return;
    if (cached.promise) return; // Already loading
  }

  // Start preloading
  const promise = loader();
  componentCache.set(key, {
    loader,
    promise,
    loaded: false,
  });

  // Mark as loaded when complete
  promise
    .then(() => {
      const cached = componentCache.get(key);
      if (cached) {
        cached.loaded = true;
      }
    })
    .catch((error) => {
      console.error('Failed to preload component:', error);
      // Remove from cache on error
      componentCache.delete(key);
    });
}

/**
 * Preload multiple components in parallel
 *
 * @example
 * ```tsx
 * preloadComponents([
 *   () => import('./Dashboard'),
 *   () => import('./Contacts'),
 *   () => import('./Tasks'),
 * ]);
 * ```
 */
export function preloadComponents(
  loaders: Array<() => Promise<{ default: ComponentType }>>
): Promise<void> {
  const promises = loaders.map(loader => {
    preloadComponent(loader);
    return componentCache.get(loader.toString())?.promise || Promise.resolve({ default: () => null });
  });

  return Promise.all(promises).then(() => undefined);
}

// ============================================
// DATA PRELOADING
// ============================================

/**
 * Preload data with caching
 * Useful for preloading API data before navigation
 *
 * @param key - Unique cache key
 * @param fetcher - Function that fetches the data
 * @param ttl - Time to live in milliseconds (default: 5 minutes)
 *
 * @example
 * ```tsx
 * // Preload on hover
 * <Link
 *   to="/contacts"
 *   onMouseEnter={() => preloadData('contacts', () => api.getContacts())}
 * >
 *   Contacts
 * </Link>
 *
 * // Use in component
 * const { data } = usePreloadedData('contacts', () => api.getContacts());
 * ```
 */
export function preloadData<T = any>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): void {
  const cached = dataCache.get(key);

  // Return cached data if still valid
  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < ttl && (cached.data || cached.promise)) {
      return;
    }
  }

  // Start fetching
  const promise = fetcher();
  dataCache.set(key, {
    fetcher,
    promise,
    data: null,
    error: null,
    timestamp: Date.now(),
  });

  // Store result when complete
  promise
    .then((data) => {
      const cached = dataCache.get(key);
      if (cached) {
        cached.data = data;
        cached.promise = null;
        cached.timestamp = Date.now();
      }
    })
    .catch((error) => {
      const cached = dataCache.get(key);
      if (cached) {
        cached.error = error;
        cached.promise = null;
      }
      console.error('Failed to preload data:', error);
    });
}

/**
 * Get preloaded data
 * Returns cached data if available, otherwise fetches
 *
 * @param key - Cache key
 * @param fetcher - Function to fetch data if not cached
 * @param ttl - Time to live for cache
 */
export async function getPreloadedData<T = any>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const cached = dataCache.get(key);

  if (cached) {
    const age = Date.now() - cached.timestamp;

    // Return cached data if valid
    if (cached.data && age < ttl) {
      return cached.data;
    }

    // Return in-flight promise
    if (cached.promise) {
      return cached.promise;
    }

    // Throw cached error
    if (cached.error) {
      throw cached.error;
    }
  }

  // Fetch new data
  preloadData(key, fetcher, ttl);
  const newCached = dataCache.get(key);
  if (newCached?.promise) {
    return newCached.promise;
  }

  // Fallback: call fetcher directly
  return fetcher();
}

/**
 * Clear cached data
 */
export function clearPreloadedData(key?: string): void {
  if (key) {
    dataCache.delete(key);
  } else {
    dataCache.clear();
  }
}

/**
 * Check if data is preloaded
 */
export function isDataPreloaded(key: string, ttl: number = DEFAULT_TTL): boolean {
  const cached = dataCache.get(key);
  if (!cached) return false;

  const age = Date.now() - cached.timestamp;
  return !!cached.data && age < ttl;
}

// ============================================
// PRELOAD STRATEGIES
// ============================================

/**
 * Preload on idle
 * Uses requestIdleCallback to preload during browser idle time
 */
export function preloadOnIdle(
  loaders: Array<() => Promise<{ default: ComponentType }>>
): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadComponents(loaders);
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      preloadComponents(loaders);
    }, 1000);
  }
}

/**
 * Preload on hover
 * Returns an event handler for onMouseEnter
 */
export function createHoverPreloader(
  loader: () => Promise<{ default: ComponentType }>
): () => void {
  let preloaded = false;

  return () => {
    if (!preloaded) {
      preloadComponent(loader);
      preloaded = true;
    }
  };
}

/**
 * Preload on visible
 * Uses IntersectionObserver to preload when element becomes visible
 */
export function preloadOnVisible(
  element: HTMLElement,
  loader: () => Promise<{ default: ComponentType }>
): () => void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          preloadComponent(loader);
          observer.disconnect();
        }
      });
    },
    { rootMargin: '50px' }
  );

  observer.observe(element);

  // Return cleanup function
  return () => observer.disconnect();
}

// ============================================
// ROUTE-SPECIFIC PRELOADING
// ============================================

/**
 * Preload critical routes on app load
 * Call this in your main App component
 */
export function preloadCriticalRoutes(): void {
  // Define critical routes that should be preloaded immediately
  const criticalRoutes = [
    () => import('@/pages/Dashboard'),
    () => import('@/pages/Contacts'),
  ];

  preloadOnIdle(criticalRoutes);
}

/**
 * Preload all authenticated routes
 * Call this after successful login
 */
export function preloadAuthenticatedRoutes(): void {
  const routes = [
    () => import('@/pages/Dashboard'),
    () => import('@/pages/Contacts'),
    () => import('@/pages/Conversations'),
    () => import('@/pages/Tasks'),
    () => import('@/pages/Calendar'),
    () => import('@/pages/Settings'),
  ];

  preloadOnIdle(routes);
}

// ============================================
// EXPORTS
// ============================================

export default {
  preloadComponent,
  preloadComponents,
  preloadData,
  getPreloadedData,
  clearPreloadedData,
  isDataPreloaded,
  preloadOnIdle,
  createHoverPreloader,
  preloadOnVisible,
  preloadCriticalRoutes,
  preloadAuthenticatedRoutes,
};
