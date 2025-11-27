// Last Modified: 2025-11-24 12:28
/**
 * React 18 Concurrent Rendering Patterns
 *
 * This module provides reusable patterns for optimizing components
 * for React 18's concurrent rendering capabilities.
 */

import { useTransition, useDeferredValue, startTransition, useCallback, useMemo, useRef, useEffect, useState } from 'react';

// ==================== Transition Patterns ====================

/**
 * Enhanced useTransition with automatic loading state management
 *
 * @param onStart - Callback when transition starts
 * @param onEnd - Callback when transition ends
 * @returns [isPending, startTransition] tuple
 *
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const [isPending, startSearch] = useTransitionWithCallbacks(
 *     () => console.log('Search started'),
 *     () => console.log('Search completed')
 *   );
 *
 *   const handleSearch = (query: string) => {
 *     startSearch(() => {
 *       setSearchQuery(query);
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <input onChange={(e) => handleSearch(e.target.value)} />
 *       {isPending && <Spinner />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTransitionWithCallbacks(
  onStart?: () => void,
  onEnd?: () => void
): [boolean, (callback: () => void) => void] {
  const [isPending, startReactTransition] = useTransition();
  const wasPending = useRef(isPending);

  useEffect(() => {
    if (!wasPending.current && isPending) {
      onStart?.();
    } else if (wasPending.current && !isPending) {
      onEnd?.();
    }
    wasPending.current = isPending;
  }, [isPending, onStart, onEnd]);

  const wrappedStartTransition = useCallback(
    (callback: () => void) => {
      startReactTransition(callback);
    },
    [startReactTransition]
  );

  return [isPending, wrappedStartTransition];
}

/**
 * Batches multiple state updates into a single transition
 *
 * @returns Function to batch updates
 *
 * @example
 * ```tsx
 * function MultiUpdateComponent() {
 *   const [filter, setFilter] = useState('');
 *   const [sort, setSort] = useState('name');
 *   const [page, setPage] = useState(1);
 *
 *   const batchUpdate = useBatchedTransition();
 *
 *   const handleComplexUpdate = () => {
 *     batchUpdate(() => {
 *       setFilter('new');
 *       setSort('date');
 *       setPage(1);
 *     });
 *   };
 *
 *   return <button onClick={handleComplexUpdate}>Update All</button>;
 * }
 * ```
 */
export function useBatchedTransition(): (callback: () => void) => void {
  return useCallback((callback: () => void) => {
    startTransition(callback);
  }, []);
}

// ==================== Deferred Value Patterns ====================

/**
 * Debounced deferred value with customizable delay
 *
 * @param value - Value to defer
 * @param delay - Delay in milliseconds before updating
 * @returns Deferred value
 *
 * @example
 * ```tsx
 * function SearchResults({ query }: { query: string }) {
 *   const deferredQuery = useDebouncedDeferredValue(query, 300);
 *
 *   // Expensive filtering only happens after 300ms of no changes
 *   const results = useMemo(
 *     () => expensiveSearch(deferredQuery),
 *     [deferredQuery]
 *   );
 *
 *   return <ResultsList results={results} />;
 * }
 * ```
 */
export function useDebouncedDeferredValue<T>(value: T, delay: number = 300): T {
  const deferredValue = useDeferredValue(value);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [debouncedValue, setDebouncedValue] = useState(deferredValue);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(deferredValue);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [deferredValue, delay]);

  return debouncedValue;
}

// ==================== Store Selector Patterns ====================

/**
 * Creates a shallow equality selector for Zustand stores
 *
 * @param selector - Function to select state slice
 * @returns Memoized selector with shallow equality
 *
 * @example
 * ```tsx
 * // Instead of:
 * const { name, email } = useUserStore();
 *
 * // Use:
 * const { name, email } = useUserStore(
 *   useShallowSelector(state => ({ name: state.name, email: state.email }))
 * );
 * ```
 */
export function useShallowSelector<T, U>(
  selector: (state: T) => U
): (state: T) => U {
  const prev = useRef<U>();

  return useCallback(
    (state: T) => {
      const next = selector(state);

      if (prev.current === undefined) {
        prev.current = next;
        return next;
      }

      if (shallowEqual(prev.current, next)) {
        return prev.current;
      }

      prev.current = next;
      return next;
    },
    [selector]
  );
}

/**
 * Shallow equality comparison for objects
 */
function shallowEqual<T>(objA: T, objB: T): boolean {
  if (Object.is(objA, objB)) {
    return true;
  }

  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (
      !Object.prototype.hasOwnProperty.call(objB, key) ||
      !Object.is((objA as any)[key], (objB as any)[key])
    ) {
      return false;
    }
  }

  return true;
}

// ==================== Lazy Loading Patterns ====================

/**
 * Creates a lazy-loaded component with suspense boundary
 *
 * @param importFn - Dynamic import function
 * @param fallback - Fallback component during loading
 * @returns Lazy component wrapper
 *
 * @example
 * ```tsx
 * const LazyDashboard = createLazyComponent(
 *   () => import('./pages/Dashboard'),
 *   <Skeleton />
 * );
 *
 * function App() {
 *   return (
 *     <Suspense fallback={<Loading />}>
 *       <LazyDashboard />
 *     </Suspense>
 *   );
 * }
 * ```
 */
import React, { lazy, Suspense, ComponentType } from 'react';

export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: React.ReactNode = null
): React.FC<React.ComponentProps<T>> {
  const LazyComponent = lazy(importFn);

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// ==================== Concurrent Safe Hooks ====================

/**
 * Version of useState that batches updates in transitions
 *
 * @param initialValue - Initial state value
 * @returns [state, setState] with automatic transition batching
 *
 * @example
 * ```tsx
 * function FilteredList() {
 *   const [filter, setFilter] = useTransitionState('');
 *
 *   // Updates are automatically batched in transitions
 *   const handleFilterChange = (value: string) => {
 *     setFilter(value); // This will be low-priority
 *   };
 *
 *   return <input value={filter} onChange={e => handleFilterChange(e.target.value)} />;
 * }
 * ```
 */
export function useTransitionState<T>(
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState(initialValue);

  const setStateTransition = useCallback(
    (value: T | ((prev: T) => T)) => {
      startTransition(() => {
        setState(value);
      });
    },
    []
  );

  return [state, setStateTransition];
}

/**
 * Hook for splitting urgent and deferred state updates
 *
 * @param initialValue - Initial value
 * @returns [urgentValue, deferredValue, setUrgentValue]
 *
 * @example
 * ```tsx
 * function SearchWithResults() {
 *   const [inputValue, deferredQuery, setInputValue] = useSplitState('');
 *
 *   // inputValue updates immediately for UI responsiveness
 *   // deferredQuery updates with lower priority for expensive operations
 *   const results = useMemo(
 *     () => expensiveSearch(deferredQuery),
 *     [deferredQuery]
 *   );
 *
 *   return (
 *     <>
 *       <input value={inputValue} onChange={e => setInputValue(e.target.value)} />
 *       <Results data={results} />
 *     </>
 *   );
 * }
 * ```
 */
export function useSplitState<T>(
  initialValue: T
): [T, T, (value: T | ((prev: T) => T)) => void] {
  const [urgentValue, setUrgentValue] = useState(initialValue);
  const deferredValue = useDeferredValue(urgentValue);

  return [urgentValue, deferredValue, setUrgentValue];
}

// ==================== Performance Optimization Patterns ====================

/**
 * Memoized callback that only changes when dependencies actually change
 * (using deep equality instead of reference equality)
 *
 * @param callback - Function to memoize
 * @param deps - Dependency array
 * @returns Memoized callback
 */
export function useDeepCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
): T {
  const ref = useRef<T>(callback);
  const depsRef = useRef(deps);

  if (!deepEqual(deps, depsRef.current)) {
    ref.current = callback;
    depsRef.current = deps;
  }

  return useCallback(ref.current, []);
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => deepEqual(a[key], b[key]));
  }

  return false;
}

// ==================== Suspense Boundary Helpers ====================

/**
 * Creates a component with built-in error and suspense boundaries
 *
 * @param Component - Component to wrap
 * @param config - Configuration for boundaries
 * @returns Wrapped component
 */
export function withBoundaries<T extends ComponentType<any>>(
  Component: T,
  config: {
    suspenseFallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
  } = {}
): React.FC<React.ComponentProps<T>> {
  const { suspenseFallback = <div>Loading...</div>, errorFallback } = config;

  return (props: React.ComponentProps<T>) => (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={suspenseFallback}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div>
            <h2>Something went wrong</h2>
            <details>
              <summary>Error details</summary>
              <pre>{this.state.error?.message}</pre>
            </details>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
