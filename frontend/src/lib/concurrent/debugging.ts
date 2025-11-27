// Last Modified: 2025-11-24 12:30
/**
 * Debugging Utilities for React 18 Concurrent Rendering
 *
 * This module provides tools for debugging concurrent rendering issues,
 * identifying performance bottlenecks, and tracking re-renders.
 */

import { useEffect, useRef, useState } from 'react';

// ==================== Render Tracking ====================

/**
 * Logs component renders with timing information
 *
 * @param componentName - Name of component to track
 * @param props - Current props (optional)
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function MyComponent(props: Props) {
 *   useRenderLogger('MyComponent', props, {
 *     logProps: true,
 *     slowThreshold: 16
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useRenderLogger(
  componentName: string,
  props?: any,
  options: {
    enabled?: boolean;
    logProps?: boolean;
    logStack?: boolean;
    slowThreshold?: number;
  } = {}
): void {
  const {
    enabled = process.env.NODE_ENV === 'development',
    logProps = false,
    logStack = false,
    slowThreshold = 16.67, // 60fps
  } = options;

  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  if (!enabled) return;

  renderCount.current += 1;
  const now = Date.now();
  const timeSinceLastRender = now - lastRenderTime.current;
  lastRenderTime.current = now;

  const logData: any = {
    component: componentName,
    renderNumber: renderCount.current,
    timeSinceLastRender: `${timeSinceLastRender}ms`,
  };

  if (logProps && props) {
    logData.props = props;
  }

  if (logStack) {
    logData.stack = new Error().stack;
  }

  const logMethod =
    timeSinceLastRender > slowThreshold ? console.warn : console.log;

  logMethod('[Render]', logData);
}

/**
 * Tracks which props changed between renders
 *
 * @param componentName - Component name for logging
 * @param props - Current props object
 *
 * @example
 * ```tsx
 * function MyComponent(props: Props) {
 *   usePropsTracker('MyComponent', props);
 *   // Logs to console whenever props change
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePropsTracker(
  componentName: string,
  props: Record<string, any>
): void {
  const previousProps = useRef<Record<string, any>>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = new Set([
        ...Object.keys(previousProps.current),
        ...Object.keys(props),
      ]);

      const changes: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        const prev = previousProps.current![key];
        const current = props[key];

        if (!Object.is(prev, current)) {
          changes[key] = { from: prev, to: current };
        }
      });

      if (Object.keys(changes).length > 0) {
        console.log(`[Props Changed] ${componentName}:`, changes);
      }
    }

    previousProps.current = props;
  });
}

// ==================== Performance Monitoring ====================

/**
 * Monitors component performance and warns about issues
 *
 * @param componentName - Component name
 * @param options - Monitoring configuration
 * @returns Performance metrics
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const metrics = usePerformanceMonitor('Dashboard', {
 *     warnOnSlowRender: true,
 *     warnOnHighRenderCount: true
 *   });
 *
 *   console.log('Avg render time:', metrics.avgRenderTime);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePerformanceMonitor(
  componentName: string,
  options: {
    enabled?: boolean;
    warnOnSlowRender?: boolean;
    warnOnHighRenderCount?: boolean;
    slowThreshold?: number;
    highRenderCountThreshold?: number;
  } = {}
): {
  renderCount: number;
  avgRenderTime: number;
  slowestRender: number;
  fastestRender: number;
} {
  const {
    enabled = process.env.NODE_ENV === 'development',
    warnOnSlowRender = true,
    warnOnHighRenderCount = true,
    slowThreshold = 16.67,
    highRenderCountThreshold = 50,
  } = options;

  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const renderStart = useRef(performance.now());

  const [metrics, setMetrics] = useState({
    renderCount: 0,
    avgRenderTime: 0,
    slowestRender: 0,
    fastestRender: Infinity,
  });

  if (!enabled) return metrics;

  renderCount.current += 1;

  useEffect(() => {
    const renderTime = performance.now() - renderStart.current;
    renderTimes.current.push(renderTime);

    // Keep only last 100 render times
    if (renderTimes.current.length > 100) {
      renderTimes.current.shift();
    }

    const times = renderTimes.current;
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const slowest = Math.max(...times);
    const fastest = Math.min(...times);

    setMetrics({
      renderCount: renderCount.current,
      avgRenderTime: avgTime,
      slowestRender: slowest,
      fastestRender: fastest,
    });

    // Warnings
    if (warnOnSlowRender && renderTime > slowThreshold) {
      console.warn(
        `[Performance] Slow render in ${componentName}: ${renderTime.toFixed(2)}ms (threshold: ${slowThreshold}ms)`
      );
    }

    if (
      warnOnHighRenderCount &&
      renderCount.current > highRenderCountThreshold
    ) {
      console.warn(
        `[Performance] High render count in ${componentName}: ${renderCount.current} renders (threshold: ${highRenderCountThreshold})`
      );
    }

    renderStart.current = performance.now();
  });

  return metrics;
}

// ==================== Concurrent State Debugging ====================

/**
 * Tracks concurrent state updates and transitions
 *
 * @param stateName - Name of the state being tracked
 * @param value - Current state value
 *
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const [query, setQuery] = useState('');
 *   useConcurrentStateTracker('searchQuery', query);
 *
 *   return <input value={query} onChange={e => setQuery(e.target.value)} />;
 * }
 * ```
 */
export function useConcurrentStateTracker(
  stateName: string,
  value: any
): void {
  const updateCount = useRef(0);
  const lastValue = useRef(value);
  const updateHistory = useRef<
    Array<{ timestamp: number; value: any; updateNumber: number }>
  >([]);

  useEffect(() => {
    if (!Object.is(value, lastValue.current)) {
      updateCount.current += 1;
      const update = {
        timestamp: Date.now(),
        value,
        updateNumber: updateCount.current,
      };

      updateHistory.current.push(update);

      // Keep only last 50 updates
      if (updateHistory.current.length > 50) {
        updateHistory.current.shift();
      }

      console.log(`[State Update] ${stateName}:`, {
        updateNumber: update.updateNumber,
        oldValue: lastValue.current,
        newValue: value,
        totalUpdates: updateCount.current,
      });

      lastValue.current = value;
    }
  });
}

/**
 * Detects render loops (component rendering excessively)
 *
 * @param componentName - Component name
 * @param threshold - Number of renders before warning
 * @param timeWindow - Time window in ms to check
 *
 * @example
 * ```tsx
 * function PotentiallyLoopingComponent() {
 *   useRenderLoopDetector('PotentiallyLoopingComponent', 10, 1000);
 *   // Warns if component renders more than 10 times in 1 second
 *   return <div>...</div>;
 * }
 * ```
 */
export function useRenderLoopDetector(
  componentName: string,
  threshold: number = 20,
  timeWindow: number = 1000
): void {
  const renders = useRef<number[]>([]);

  const now = Date.now();
  renders.current.push(now);

  // Remove renders outside time window
  renders.current = renders.current.filter(
    (timestamp) => now - timestamp < timeWindow
  );

  if (renders.current.length > threshold) {
    console.error(
      `[Render Loop Detected] ${componentName} rendered ${renders.current.length} times in ${timeWindow}ms!`,
      {
        threshold,
        actualRenders: renders.current.length,
        timeWindow,
      }
    );
  }
}

// ==================== Store Debugging ====================

/**
 * Tracks Zustand store subscription count
 *
 * @param store - Zustand store
 * @param storeName - Store name for logging
 *
 * @example
 * ```tsx
 * const useUserStore = create((set) => ({ ... }));
 *
 * function App() {
 *   useStoreSubscriptionTracker(useUserStore, 'userStore');
 *   return <div>...</div>;
 * }
 * ```
 */
export function useStoreSubscriptionTracker(
  store: any,
  storeName: string
): void {
  useEffect(() => {
    // Access internal zustand state (may not work in production builds)
    const listeners = (store as any).listeners;
    if (listeners) {
      console.log(`[Store Subscriptions] ${storeName}:`, {
        count: listeners.size || listeners.length || 'unknown',
      });
    }
  });
}

// ==================== Memory Debugging ====================

/**
 * Monitors component memory usage (Chrome only)
 *
 * @param componentName - Component name
 * @param interval - Check interval in ms
 *
 * @example
 * ```tsx
 * function MemoryIntensiveComponent() {
 *   useMemoryMonitor('MemoryIntensiveComponent', 5000);
 *   // Logs memory every 5 seconds
 *   return <div>...</div>;
 * }
 * ```
 */
export function useMemoryMonitor(
  componentName: string,
  interval: number = 5000
): void {
  useEffect(() => {
    if (!('memory' in performance)) {
      console.warn(
        `[Memory Monitor] performance.memory not available (Chrome only)`
      );
      return;
    }

    const checkMemory = () => {
      const mem = (performance as any).memory;
      const used = (mem.usedJSHeapSize / 1024 / 1024).toFixed(2);
      const total = (mem.totalJSHeapSize / 1024 / 1024).toFixed(2);
      const limit = (mem.jsHeapSizeLimit / 1024 / 1024).toFixed(2);

      console.log(`[Memory] ${componentName}:`, {
        used: `${used} MB`,
        total: `${total} MB`,
        limit: `${limit} MB`,
        usagePercent: `${((parseFloat(used) / parseFloat(limit)) * 100).toFixed(1)}%`,
      });
    };

    checkMemory();
    const timer = setInterval(checkMemory, interval);

    return () => clearInterval(timer);
  }, [componentName, interval]);
}

// ==================== DevTools Helpers ====================

/**
 * Exposes component state to window for debugging
 *
 * @param componentName - Component name
 * @param state - State object to expose
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const [state, setState] = useState({ ... });
 *
 *   useExposeToDevTools('MyComponent', { state, setState });
 *   // Access via window.__REACT_DEVTOOLS__.MyComponent
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useExposeToDevTools(
  componentName: string,
  state: Record<string, any>
): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!(window as any).__REACT_DEVTOOLS__) {
      (window as any).__REACT_DEVTOOLS__ = {};
    }

    (window as any).__REACT_DEVTOOLS__[componentName] = state;

    return () => {
      delete (window as any).__REACT_DEVTOOLS__[componentName];
    };
  }, [componentName, state]);
}

/**
 * Creates a visual indicator for re-renders
 *
 * @param color - Highlight color
 * @param duration - How long to show highlight (ms)
 * @returns Ref to attach to element
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const highlightRef = useRenderHighlight('red', 300);
 *
 *   return <div ref={highlightRef}>Flashes red on re-render</div>;
 * }
 * ```
 */
export function useRenderHighlight(
  color: string = 'rgba(255, 0, 0, 0.3)',
  duration: number = 300
): React.RefObject<HTMLElement> {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    const originalBackground = element.style.background;

    element.style.background = color;
    element.style.transition = `background ${duration}ms`;

    const timer = setTimeout(() => {
      element.style.background = originalBackground;
    }, duration);

    return () => clearTimeout(timer);
  });

  return ref;
}

// ==================== Export All ====================

export const DebugTools = {
  useRenderLogger,
  usePropsTracker,
  usePerformanceMonitor,
  useConcurrentStateTracker,
  useRenderLoopDetector,
  useStoreSubscriptionTracker,
  useMemoryMonitor,
  useExposeToDevTools,
  useRenderHighlight,
};
