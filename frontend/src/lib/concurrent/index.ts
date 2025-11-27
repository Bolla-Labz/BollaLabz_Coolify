// Last Modified: 2025-11-24 12:31
/**
 * React 18 Concurrent Rendering Library
 *
 * Central export point for all concurrent rendering utilities,
 * patterns, optimizations, and debugging tools.
 */

// Performance Monitoring
export {
  useRenderMetrics,
  useConcurrentMetrics,
  useTransitionMetrics,
  useMemoryMetrics,
  useRenderCount,
  useWhyDidYouUpdate,
  type RenderMetrics,
  type ConcurrentMetrics,
  type TransitionMetrics,
} from '../../hooks/usePerformance';

// Concurrent Patterns
export {
  useTransitionWithCallbacks,
  useBatchedTransition,
  useDebouncedDeferredValue,
  useShallowSelector,
  createLazyComponent,
  useTransitionState,
  useSplitState,
  useDeepCallback,
  withBoundaries,
} from './patterns';

// Performance Optimizations
export {
  batchUpdates,
  useBatchedUpdater,
  useDeepMemo,
  useMemoizedFunction,
  useThrottle,
  useDebounce,
  useVirtualScroll,
  useAutoCleanup,
  useLeakDetector,
  createOptimizedSelector,
  batchStoreUpdates,
} from './optimizations';

// Debugging Tools
export {
  useRenderLogger,
  usePropsTracker,
  usePerformanceMonitor,
  useConcurrentStateTracker,
  useRenderLoopDetector,
  useStoreSubscriptionTracker,
  useMemoryMonitor,
  useExposeToDevTools,
  useRenderHighlight,
  DebugTools,
} from './debugging';

// ==================== Quick Start Guide ====================

/**
 * ## Quick Start
 *
 * ### 1. Store Optimizations
 * ```tsx
 * import { useShallowSelector } from '@/lib/concurrent';
 *
 * // Before: triggers re-render even if only unrelated fields change
 * const { name, email, age, address } = useUserStore();
 *
 * // After: only re-renders when name or email change
 * const { name, email } = useUserStore(
 *   useShallowSelector(state => ({ name: state.name, email: state.email }))
 * );
 * ```
 *
 * ### 2. Transitions for Non-Urgent Updates
 * ```tsx
 * import { useTransitionWithCallbacks } from '@/lib/concurrent';
 *
 * function SearchComponent() {
 *   const [isPending, startTransition] = useTransitionWithCallbacks(
 *     () => setLoading(true),
 *     () => setLoading(false)
 *   );
 *
 *   const handleSearch = (query: string) => {
 *     startTransition(() => {
 *       setSearchQuery(query); // Low priority update
 *     });
 *   };
 *
 *   return (
 *     <>
 *       <input onChange={e => handleSearch(e.target.value)} />
 *       {isPending && <Spinner />}
 *     </>
 *   );
 * }
 * ```
 *
 * ### 3. Deferred Values for Expensive Renders
 * ```tsx
 * import { useDeferredValue } from 'react';
 *
 * function FilteredList({ items, filter }: Props) {
 *   const deferredFilter = useDeferredValue(filter);
 *
 *   // Expensive filtering only updates when React has free time
 *   const filtered = useMemo(
 *     () => items.filter(item => item.name.includes(deferredFilter)),
 *     [items, deferredFilter]
 *   );
 *
 *   return <List items={filtered} />;
 * }
 * ```
 *
 * ### 4. Performance Monitoring
 * ```tsx
 * import { useRenderMetrics } from '@/lib/concurrent';
 *
 * function Dashboard() {
 *   const metrics = useRenderMetrics('Dashboard', {
 *     logToConsole: true,
 *     slowThreshold: 16
 *   });
 *
 *   useEffect(() => {
 *     if (metrics.averageRenderTime > 50) {
 *       console.warn('Dashboard is rendering slowly!');
 *     }
 *   }, [metrics.averageRenderTime]);
 *
 *   return <div>Rendered {metrics.renderCount} times</div>;
 * }
 * ```
 *
 * ### 5. Debug Re-Renders
 * ```tsx
 * import { useWhyDidYouUpdate } from '@/lib/concurrent';
 *
 * function ExpensiveComponent(props: Props) {
 *   useWhyDidYouUpdate('ExpensiveComponent', props);
 *   // Logs which props changed causing re-render
 *
 *   return <div>...</div>;
 * }
 * ```
 */
