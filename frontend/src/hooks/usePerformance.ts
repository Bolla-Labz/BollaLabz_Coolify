// Last Modified: 2025-11-24 12:23
import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Performance Monitoring Hooks for React 18 Concurrent Rendering
 *
 * These hooks provide real-time performance metrics and debugging tools
 * for concurrent rendering, transitions, and suspense boundaries.
 */

// ==================== Types ====================

export interface RenderMetrics {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
  slowestRender: number;
  fastestRender: number;
  renderHistory: number[];
}

export interface ConcurrentMetrics {
  transitionCount: number;
  suspenseCount: number;
  deferredValueUpdates: number;
  avgTransitionTime: number;
  isPending: boolean;
}

export interface TransitionMetrics {
  transitionId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'completed' | 'interrupted';
  metadata?: Record<string, any>;
}

interface PerformanceEntry {
  timestamp: number;
  duration: number;
  metadata?: Record<string, any>;
}

// ==================== useRenderMetrics ====================

/**
 * Tracks render performance metrics for a component
 *
 * @param componentName - Name of the component being tracked
 * @param options - Configuration options
 * @returns RenderMetrics object with performance data
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const metrics = useRenderMetrics('MyComponent');
 *
 *   useEffect(() => {
 *     console.log('Avg render time:', metrics.averageRenderTime);
 *   }, [metrics.renderCount]);
 *
 *   return <div>Render count: {metrics.renderCount}</div>;
 * }
 * ```
 */
export function useRenderMetrics(
  componentName: string,
  options: {
    maxHistorySize?: number;
    logToConsole?: boolean;
    slowThreshold?: number;
  } = {}
): RenderMetrics {
  const {
    maxHistorySize = 100,
    logToConsole = false,
    slowThreshold = 16.67, // 60fps threshold
  } = options;

  const renderStartTime = useRef<number>(performance.now());
  const [metrics, setMetrics] = useState<RenderMetrics>({
    componentName,
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
    slowestRender: 0,
    fastestRender: Infinity,
    renderHistory: [],
  });

  useEffect(() => {
    const renderEndTime = performance.now();
    const renderDuration = renderEndTime - renderStartTime.current;

    setMetrics((prev) => {
      const newHistory = [...prev.renderHistory, renderDuration].slice(
        -maxHistorySize
      );
      const newTotalTime = prev.totalRenderTime + renderDuration;
      const newCount = prev.renderCount + 1;

      const newMetrics = {
        ...prev,
        renderCount: newCount,
        lastRenderTime: renderDuration,
        averageRenderTime: newTotalTime / newCount,
        totalRenderTime: newTotalTime,
        slowestRender: Math.max(prev.slowestRender, renderDuration),
        fastestRender: Math.min(prev.fastestRender, renderDuration),
        renderHistory: newHistory,
      };

      // Log slow renders
      if (logToConsole && renderDuration > slowThreshold) {
        console.warn(
          `[Performance] Slow render detected in ${componentName}:`,
          {
            duration: renderDuration.toFixed(2) + 'ms',
            threshold: slowThreshold + 'ms',
            renderCount: newCount,
          }
        );
      }

      return newMetrics;
    });

    // Reset timer for next render
    renderStartTime.current = performance.now();
  });

  return metrics;
}

// ==================== useConcurrentMetrics ====================

/**
 * Tracks concurrent rendering metrics across the application
 *
 * @returns ConcurrentMetrics object with transition and suspense data
 *
 * @example
 * ```tsx
 * function App() {
 *   const metrics = useConcurrentMetrics();
 *
 *   return (
 *     <div>
 *       <p>Transitions: {metrics.transitionCount}</p>
 *       <p>Suspense: {metrics.suspenseCount}</p>
 *       <p>Avg Transition: {metrics.avgTransitionTime}ms</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useConcurrentMetrics(): ConcurrentMetrics {
  const [metrics, setMetrics] = useState<ConcurrentMetrics>({
    transitionCount: 0,
    suspenseCount: 0,
    deferredValueUpdates: 0,
    avgTransitionTime: 0,
    isPending: false,
  });

  const transitionTimes = useRef<number[]>([]);

  const recordTransition = useCallback((duration: number) => {
    transitionTimes.current.push(duration);
    setMetrics((prev) => {
      const times = transitionTimes.current;
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

      return {
        ...prev,
        transitionCount: prev.transitionCount + 1,
        avgTransitionTime: avgTime,
      };
    });
  }, []);

  const recordSuspense = useCallback(() => {
    setMetrics((prev) => ({
      ...prev,
      suspenseCount: prev.suspenseCount + 1,
    }));
  }, []);

  const recordDeferredUpdate = useCallback(() => {
    setMetrics((prev) => ({
      ...prev,
      deferredValueUpdates: prev.deferredValueUpdates + 1,
    }));
  }, []);

  const setPending = useCallback((isPending: boolean) => {
    setMetrics((prev) => ({
      ...prev,
      isPending,
    }));
  }, []);

  return {
    ...metrics,
    // Expose internal methods via a custom hook pattern
    _recordTransition: recordTransition,
    _recordSuspense: recordSuspense,
    _recordDeferredUpdate: recordDeferredUpdate,
    _setPending: setPending,
  } as ConcurrentMetrics;
}

// ==================== useTransitionMetrics ====================

/**
 * Tracks individual transition performance with detailed timing
 *
 * @param transitionName - Name identifier for the transition
 * @returns Transition tracking functions and current metrics
 *
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const [isPending, startTransition] = useTransition();
 *   const { startTracking, endTracking, metrics } = useTransitionMetrics('search');
 *
 *   const handleSearch = (query: string) => {
 *     startTracking();
 *     startTransition(() => {
 *       setSearchQuery(query);
 *       endTracking();
 *     });
 *   };
 *
 *   return <div>Transition time: {metrics?.duration}ms</div>;
 * }
 * ```
 */
export function useTransitionMetrics(transitionName: string) {
  const [currentMetrics, setCurrentMetrics] = useState<TransitionMetrics | null>(
    null
  );
  const [allMetrics, setAllMetrics] = useState<TransitionMetrics[]>([]);
  const activeTransition = useRef<TransitionMetrics | null>(null);

  const startTracking = useCallback(
    (metadata?: Record<string, any>) => {
      const newTransition: TransitionMetrics = {
        transitionId: `${transitionName}-${Date.now()}`,
        startTime: performance.now(),
        status: 'pending',
        metadata,
      };

      activeTransition.current = newTransition;
      setCurrentMetrics(newTransition);
    },
    [transitionName]
  );

  const endTracking = useCallback(
    (metadata?: Record<string, any>) => {
      if (!activeTransition.current) {
        console.warn(
          `[useTransitionMetrics] endTracking called without active transition for "${transitionName}"`
        );
        return;
      }

      const endTime = performance.now();
      const duration = endTime - activeTransition.current.startTime;

      const completedTransition: TransitionMetrics = {
        ...activeTransition.current,
        endTime,
        duration,
        status: 'completed',
        metadata: {
          ...activeTransition.current.metadata,
          ...metadata,
        },
      };

      setCurrentMetrics(completedTransition);
      setAllMetrics((prev) => [...prev, completedTransition]);
      activeTransition.current = null;

      // Log long transitions
      if (duration > 100) {
        console.warn(
          `[Performance] Long transition detected in "${transitionName}":`,
          {
            duration: duration.toFixed(2) + 'ms',
            metadata: completedTransition.metadata,
          }
        );
      }
    },
    [transitionName]
  );

  const interruptTracking = useCallback(() => {
    if (!activeTransition.current) return;

    const interruptedTransition: TransitionMetrics = {
      ...activeTransition.current,
      endTime: performance.now(),
      duration:
        performance.now() - activeTransition.current.startTime,
      status: 'interrupted',
    };

    setCurrentMetrics(interruptedTransition);
    setAllMetrics((prev) => [...prev, interruptedTransition]);
    activeTransition.current = null;
  }, []);

  const getAverageTransitionTime = useCallback(() => {
    const completed = allMetrics.filter((m) => m.status === 'completed');
    if (completed.length === 0) return 0;

    const total = completed.reduce((sum, m) => sum + (m.duration || 0), 0);
    return total / completed.length;
  }, [allMetrics]);

  const getTransitionStats = useCallback(() => {
    const completed = allMetrics.filter((m) => m.status === 'completed');
    const durations = completed.map((m) => m.duration || 0);

    if (durations.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        total: 0,
      };
    }

    return {
      count: durations.length,
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      total: durations.reduce((a, b) => a + b, 0),
    };
  }, [allMetrics]);

  return {
    startTracking,
    endTracking,
    interruptTracking,
    metrics: currentMetrics,
    allMetrics,
    getAverageTransitionTime,
    getTransitionStats,
  };
}

// ==================== useMemoryMetrics ====================

/**
 * Tracks memory usage (when available via Performance API)
 *
 * @param intervalMs - How often to sample memory (default: 5000ms)
 * @returns Current memory metrics
 *
 * @example
 * ```tsx
 * function MemoryMonitor() {
 *   const memory = useMemoryMetrics(1000);
 *
 *   if (!memory) return <div>Memory monitoring not available</div>;
 *
 *   return (
 *     <div>
 *       Used: {(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
 *       Limit: {(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB
 *     </div>
 *   );
 * }
 * ```
 */
export function useMemoryMetrics(intervalMs: number = 5000) {
  const [memory, setMemory] = useState<MemoryInfo | null>(null);

  useEffect(() => {
    // Check if memory API is available (Chrome/Edge only)
    if (!('memory' in performance)) {
      return;
    }

    const updateMemory = () => {
      const memInfo = (performance as any).memory;
      setMemory({
        usedJSHeapSize: memInfo.usedJSHeapSize,
        totalJSHeapSize: memInfo.totalJSHeapSize,
        jsHeapSizeLimit: memInfo.jsHeapSizeLimit,
      });
    };

    updateMemory();
    const interval = setInterval(updateMemory, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return memory;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// ==================== useRenderCount ====================

/**
 * Simple hook to track component render count
 *
 * @param componentName - Name for logging
 * @returns Current render count
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const renderCount = useRenderCount('MyComponent');
 *   return <div>Rendered {renderCount} times</div>;
 * }
 * ```
 */
export function useRenderCount(componentName?: string): number {
  const count = useRef(0);

  count.current += 1;

  useEffect(() => {
    if (componentName && count.current > 50) {
      console.warn(
        `[Performance] High render count detected in ${componentName}: ${count.current}`
      );
    }
  });

  return count.current;
}

// ==================== useWhyDidYouUpdate ====================

/**
 * Debug hook to identify what props changed causing a re-render
 *
 * @param name - Component name for logging
 * @param props - Props object to track
 *
 * @example
 * ```tsx
 * function MyComponent(props: Props) {
 *   useWhyDidYouUpdate('MyComponent', props);
 *   // Will log changed props to console
 *   return <div>...</div>;
 * }
 * ```
 */
export function useWhyDidYouUpdate(
  name: string,
  props: Record<string, any>
): void {
  const previousProps = useRef<Record<string, any>>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log('[Why-Did-You-Update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
}
