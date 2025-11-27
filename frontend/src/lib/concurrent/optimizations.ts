// Last Modified: 2025-11-24 12:29
/**
 * Performance Optimization Utilities for React 18
 *
 * This module provides utilities for optimizing component rendering,
 * memory usage, and concurrent rendering performance.
 */

import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { startTransition } from 'react';

// ==================== Batching Utilities ====================

/**
 * Batches multiple state updates into a single render cycle
 *
 * @param updates - Array of update functions
 * @param delay - Optional delay before executing (for debouncing)
 *
 * @example
 * ```tsx
 * function MultiStateComponent() {
 *   const [state1, setState1] = useState(0);
 *   const [state2, setState2] = useState('');
 *   const [state3, setState3] = useState([]);
 *
 *   const handleBatchUpdate = () => {
 *     batchUpdates([
 *       () => setState1(1),
 *       () => setState2('updated'),
 *       () => setState3([1, 2, 3])
 *     ]);
 *   };
 *
 *   return <button onClick={handleBatchUpdate}>Update All</button>;
 * }
 * ```
 */
export function batchUpdates(updates: Array<() => void>, delay?: number): void {
  if (delay) {
    setTimeout(() => {
      startTransition(() => {
        updates.forEach((update) => update());
      });
    }, delay);
  } else {
    startTransition(() => {
      updates.forEach((update) => update());
    });
  }
}

/**
 * Creates a batched updater function that collects multiple calls
 * and executes them together
 *
 * @param callback - Function to execute with batched arguments
 * @param batchWindow - Time window to collect calls (ms)
 * @returns Batched function
 *
 * @example
 * ```tsx
 * function LoggingComponent() {
 *   const batchedLog = useBatchedUpdater(
 *     (items: string[]) => {
 *       console.log('Batched logs:', items);
 *     },
 *     100
 *   );
 *
 *   // Multiple calls within 100ms will be batched
 *   const handleClicks = () => {
 *     batchedLog('click 1');
 *     batchedLog('click 2');
 *     batchedLog('click 3');
 *     // Logs once: ['click 1', 'click 2', 'click 3']
 *   };
 *
 *   return <button onClick={handleClicks}>Click Me</button>;
 * }
 * ```
 */
export function useBatchedUpdater<T>(
  callback: (items: T[]) => void,
  batchWindow: number = 50
): (item: T) => void {
  const batchRef = useRef<T[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const flush = useCallback(() => {
    if (batchRef.current.length > 0) {
      const items = [...batchRef.current];
      batchRef.current = [];
      startTransition(() => {
        callback(items);
      });
    }
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        flush();
      }
    };
  }, [flush]);

  return useCallback(
    (item: T) => {
      batchRef.current.push(item);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(flush, batchWindow);
    },
    [flush, batchWindow]
  );
}

// ==================== Memoization Utilities ====================

/**
 * Deep memoization that works with objects and arrays
 *
 * @param factory - Function that creates the value
 * @param deps - Dependencies array
 * @returns Memoized value
 *
 * @example
 * ```tsx
 * function DataComponent({ filters }: { filters: Filter[] }) {
 *   // Regular useMemo would re-run on every render if filters array reference changes
 *   // useDeepMemo only re-runs if filters content actually changes
 *   const processedData = useDeepMemo(
 *     () => expensiveProcessing(filters),
 *     [filters]
 *   );
 *
 *   return <DataTable data={processedData} />;
 * }
 * ```
 */
export function useDeepMemo<T>(factory: () => T, deps: any[]): T {
  const ref = useRef<{ deps: any[]; value: T }>();

  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = {
      deps: [...deps],
      value: factory(),
    };
  }

  return ref.current.value;
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

/**
 * Memoization with size limit to prevent memory leaks
 *
 * @param fn - Function to memoize
 * @param maxSize - Maximum cache size
 * @returns Memoized function
 *
 * @example
 * ```tsx
 * function ExpensiveCalculator() {
 *   const calculate = useMemoizedFunction(
 *     (input: number) => {
 *       // Expensive calculation
 *       return input * 2;
 *     },
 *     100 // Keep only last 100 results
 *   );
 *
 *   return <button onClick={() => calculate(42)}>Calculate</button>;
 * }
 * ```
 */
export function useMemoizedFunction<T extends (...args: any[]) => any>(
  fn: T,
  maxSize: number = 100
): T {
  const cache = useRef<Map<string, ReturnType<T>>>(new Map());

  return useCallback(
    ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);

      if (cache.current.has(key)) {
        return cache.current.get(key)!;
      }

      const result = fn(...args);

      // Implement LRU eviction
      if (cache.current.size >= maxSize) {
        const firstKey = cache.current.keys().next().value;
        cache.current.delete(firstKey);
      }

      cache.current.set(key, result);
      return result;
    }) as T,
    [fn, maxSize]
  );
}

// ==================== Throttle & Debounce ====================

/**
 * Throttles a function to execute at most once per specified interval
 *
 * @param callback - Function to throttle
 * @param delay - Minimum time between executions (ms)
 * @returns Throttled function
 *
 * @example
 * ```tsx
 * function ScrollTracker() {
 *   const trackScroll = useThrottle(
 *     (position: number) => {
 *       console.log('Scroll position:', position);
 *     },
 *     100
 *   );
 *
 *   useEffect(() => {
 *     const handler = () => trackScroll(window.scrollY);
 *     window.addEventListener('scroll', handler);
 *     return () => window.removeEventListener('scroll', handler);
 *   }, [trackScroll]);
 *
 *   return <div>Tracking scroll...</div>;
 * }
 * ```
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        lastRun.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(
          () => {
            lastRun.current = Date.now();
            callback(...args);
          },
          delay - timeSinceLastRun
        );
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Debounces a function to execute only after specified delay of inactivity
 *
 * @param callback - Function to debounce
 * @param delay - Delay after last call before executing (ms)
 * @returns Debounced function
 *
 * @example
 * ```tsx
 * function SearchInput() {
 *   const [query, setQuery] = useState('');
 *
 *   const performSearch = useDebounce(
 *     (searchQuery: string) => {
 *       console.log('Searching for:', searchQuery);
 *       // API call here
 *     },
 *     300
 *   );
 *
 *   const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
 *     const value = e.target.value;
 *     setQuery(value);
 *     performSearch(value);
 *   };
 *
 *   return <input value={query} onChange={handleChange} />;
 * }
 * ```
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

// ==================== Virtual Rendering ====================

/**
 * Hook for implementing virtual scrolling with concurrent rendering
 *
 * @param items - Array of items to render
 * @param itemHeight - Height of each item
 * @param containerHeight - Height of visible container
 * @param overscan - Number of items to render outside viewport
 * @returns Visible items and scroll handler
 *
 * @example
 * ```tsx
 * function VirtualList({ data }: { data: Item[] }) {
 *   const { visibleItems, scrollHandler } = useVirtualScroll(
 *     data,
 *     50,  // item height
 *     600, // container height
 *     5    // overscan
 *   );
 *
 *   return (
 *     <div style={{ height: 600, overflow: 'auto' }} onScroll={scrollHandler}>
 *       <div style={{ height: data.length * 50 }}>
 *         {visibleItems.map(item => (
 *           <div key={item.index} style={{ height: 50 }}>
 *             {item.data.name}
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 3
) {
  const [scrollTop, setScrollTop] = useState(0);

  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visible = items.slice(start, end + 1).map((item, i) => ({
      index: start + i,
      data: item,
      offset: (start + i) * itemHeight,
    }));

    return { startIndex: start, endIndex: end, visibleItems: visible };
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  const scrollHandler = useThrottle((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, 16); // ~60fps

  return {
    visibleItems,
    scrollHandler,
    startIndex,
    endIndex,
    totalHeight: items.length * itemHeight,
  };
}

// ==================== Memory Management ====================

/**
 * Automatically cleans up large objects when component unmounts
 *
 * @param value - Value to track for cleanup
 * @param cleanup - Cleanup function
 *
 * @example
 * ```tsx
 * function ImageViewer({ imageData }: { imageData: Uint8Array }) {
 *   useAutoCleanup(imageData, () => {
 *     console.log('Cleaning up large image data');
 *     // Free memory, revoke object URLs, etc.
 *   });
 *
 *   return <img src={...} />;
 * }
 * ```
 */
export function useAutoCleanup<T>(value: T, cleanup: (value: T) => void): void {
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    return () => {
      cleanup(valueRef.current);
    };
  }, [cleanup]);
}

/**
 * Tracks component mount count to detect memory leaks
 *
 * @param componentName - Name for tracking
 * @param threshold - Warn if mount count exceeds this
 */
export function useLeakDetector(
  componentName: string,
  threshold: number = 10
): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const key = `__leak_detector_${componentName}`;
    const count = ((window as any)[key] || 0) + 1;
    (window as any)[key] = count;

    if (count > threshold) {
      console.warn(
        `[Memory Leak Detector] ${componentName} has mounted ${count} times. Possible memory leak!`
      );
    }

    return () => {
      (window as any)[key] = Math.max(0, (window as any)[key] - 1);
    };
  }, [componentName, threshold]);
}

// ==================== Store Utilities ====================

/**
 * Creates a selector that only triggers re-renders when selected value changes
 *
 * @param selector - Function to select from store
 * @returns Optimized selector
 */
export function createOptimizedSelector<TState, TSelected>(
  selector: (state: TState) => TSelected
) {
  let lastState: TState;
  let lastSelected: TSelected;

  return (state: TState): TSelected => {
    if (state === lastState) {
      return lastSelected;
    }

    const nextSelected = selector(state);

    if (Object.is(nextSelected, lastSelected)) {
      return lastSelected;
    }

    lastState = state;
    lastSelected = nextSelected;
    return nextSelected;
  };
}

/**
 * Batch store updates to minimize re-renders
 *
 * @param store - Zustand store
 * @param updates - Array of update functions
 */
export function batchStoreUpdates<T>(
  store: any,
  updates: Array<(state: T) => Partial<T>>
): void {
  startTransition(() => {
    store.setState((state: T) => {
      return updates.reduce((acc, update) => {
        return { ...acc, ...update(state) };
      }, {} as Partial<T>);
    });
  });
}
