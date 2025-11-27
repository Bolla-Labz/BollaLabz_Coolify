// Last Modified: 2025-11-24 12:32
/**
 * Performance Monitor Debug Component
 *
 * Real-time performance monitoring dashboard for React 18 concurrent rendering.
 * Shows render metrics, memory usage, transition timing, and suspense tracking.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  useRenderMetrics,
  useConcurrentMetrics,
  useMemoryMetrics,
  type RenderMetrics,
} from '@/hooks/usePerformance';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PerformanceMonitorProps {
  /** Position on screen */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Show/hide individual sections */
  sections?: {
    renders?: boolean;
    memory?: boolean;
    concurrent?: boolean;
    stores?: boolean;
  };
}

/**
 * Performance Monitor Component
 *
 * @example
 * ```tsx
 * // Add to your app root (only in development)
 * function App() {
 *   return (
 *     <>
 *       {process.env.NODE_ENV === 'development' && (
 *         <PerformanceMonitor position="bottom-right" />
 *       )}
 *       <YourApp />
 *     </>
 *   );
 * }
 * ```
 */
export function PerformanceMonitor({
  position = 'bottom-right',
  defaultCollapsed = false,
  sections = {
    renders: true,
    memory: true,
    concurrent: true,
    stores: true,
  },
}: PerformanceMonitorProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [componentMetrics, setComponentMetrics] = useState<
    Map<string, RenderMetrics>
  >(new Map());

  const selfMetrics = useRenderMetrics('PerformanceMonitor');
  const memoryMetrics = useMemoryMetrics(2000);
  const concurrentMetrics = useConcurrentMetrics();

  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left': { top: 20, left: 20 },
    'top-right': { top: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
    'bottom-right': { bottom: 20, right: 20 },
  };

  // Register global performance tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Expose registration function for components
    (window as any).__PERF_MONITOR_REGISTER__ = (
      name: string,
      metrics: RenderMetrics
    ) => {
      setComponentMetrics((prev) => new Map(prev).set(name, metrics));
    };

    return () => {
      delete (window as any).__PERF_MONITOR_REGISTER__;
    };
  }, []);

  if (collapsed) {
    return (
      <div
        style={{
          position: 'fixed',
          ...positionStyles[position],
          zIndex: 9999,
        }}
      >
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCollapsed(false)}
          className="bg-black/80 text-white border-gray-700 hover:bg-black/90"
        >
          📊 Perf
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 9999,
        maxWidth: '400px',
        maxHeight: '600px',
      }}
    >
      <Card className="bg-black/90 text-white border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span className="font-semibold">Performance Monitor</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCollapsed(true)}
              className="h-6 w-6 p-0 hover:bg-gray-800"
            >
              −
            </Button>
          </div>
        </div>

        <Tabs defaultValue="renders" className="w-full">
          <TabsList className="w-full bg-gray-900 border-b border-gray-700">
            {sections.renders && <TabsTrigger value="renders">Renders</TabsTrigger>}
            {sections.memory && <TabsTrigger value="memory">Memory</TabsTrigger>}
            {sections.concurrent && (
              <TabsTrigger value="concurrent">Concurrent</TabsTrigger>
            )}
            {sections.stores && <TabsTrigger value="stores">Stores</TabsTrigger>}
          </TabsList>

          {sections.renders && (
            <TabsContent value="renders" className="p-3 max-h-[400px] overflow-y-auto">
              <RenderMetricsPanel
                selfMetrics={selfMetrics}
                componentMetrics={componentMetrics}
              />
            </TabsContent>
          )}

          {sections.memory && memoryMetrics && (
            <TabsContent value="memory" className="p-3">
              <MemoryMetricsPanel memory={memoryMetrics} />
            </TabsContent>
          )}

          {sections.concurrent && (
            <TabsContent value="concurrent" className="p-3">
              <ConcurrentMetricsPanel metrics={concurrentMetrics} />
            </TabsContent>
          )}

          {sections.stores && (
            <TabsContent value="stores" className="p-3">
              <StoreMetricsPanel />
            </TabsContent>
          )}
        </Tabs>
      </Card>
    </div>
  );
}

// ==================== Sub-Panels ====================

function RenderMetricsPanel({
  selfMetrics,
  componentMetrics,
}: {
  selfMetrics: RenderMetrics;
  componentMetrics: Map<string, RenderMetrics>;
}) {
  const sortedComponents = useMemo(() => {
    return Array.from(componentMetrics.entries()).sort(
      ([, a], [, b]) => b.renderCount - a.renderCount
    );
  }, [componentMetrics]);

  return (
    <div className="space-y-3">
      <div className="text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-400">Total Components:</span>
          <span className="font-mono">{componentMetrics.size}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Monitor Renders:</span>
          <span className="font-mono">{selfMetrics.renderCount}</span>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-2">
        <h4 className="text-sm font-semibold mb-2">Top Components by Renders</h4>
        <div className="space-y-2">
          {sortedComponents.slice(0, 5).map(([name, metrics]) => (
            <ComponentMetricCard key={name} name={name} metrics={metrics} />
          ))}
          {sortedComponents.length === 0 && (
            <div className="text-xs text-gray-500 text-center py-2">
              No components tracked yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComponentMetricCard({
  name,
  metrics,
}: {
  name: string;
  metrics: RenderMetrics;
}) {
  const isSlow = metrics.averageRenderTime > 16.67;

  return (
    <div className="bg-gray-900 rounded p-2 text-xs space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-medium truncate flex-1">{name}</span>
        {isSlow && (
          <Badge variant="destructive" className="ml-2 text-xs">
            Slow
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-2 text-gray-400">
        <div>
          Renders: <span className="text-white">{metrics.renderCount}</span>
        </div>
        <div>
          Avg: <span className="text-white">{metrics.averageRenderTime.toFixed(1)}ms</span>
        </div>
        <div>
          Fastest: <span className="text-white">{metrics.fastestRender.toFixed(1)}ms</span>
        </div>
        <div>
          Slowest: <span className="text-white">{metrics.slowestRender.toFixed(1)}ms</span>
        </div>
      </div>
    </div>
  );
}

function MemoryMetricsPanel({
  memory,
}: {
  memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
}) {
  const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
  const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
  const limitMB = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
  const usagePercent = (
    (memory.usedJSHeapSize / memory.jsHeapSizeLimit) *
    100
  ).toFixed(1);

  const isHighUsage = parseFloat(usagePercent) > 80;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">Heap Memory</h4>
        <Badge variant={isHighUsage ? 'destructive' : 'default'}>
          {usagePercent}%
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Used:</span>
          <span className="font-mono">{usedMB} MB</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Total:</span>
          <span className="font-mono">{totalMB} MB</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Limit:</span>
          <span className="font-mono">{limitMB} MB</span>
        </div>
      </div>

      <div className="mt-3">
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isHighUsage ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>

      {isHighUsage && (
        <div className="text-xs text-yellow-400 mt-2">
          ⚠️ High memory usage detected
        </div>
      )}
    </div>
  );
}

function ConcurrentMetricsPanel({
  metrics,
}: {
  metrics: ReturnType<typeof useConcurrentMetrics>;
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Transitions:</span>
          <span className="font-mono">{metrics.transitionCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Avg Transition Time:</span>
          <span className="font-mono">{metrics.avgTransitionTime.toFixed(1)}ms</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Suspense Count:</span>
          <span className="font-mono">{metrics.suspenseCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Deferred Updates:</span>
          <span className="font-mono">{metrics.deferredValueUpdates}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Status:</span>
          <Badge variant={metrics.isPending ? 'default' : 'secondary'}>
            {metrics.isPending ? 'Pending' : 'Idle'}
          </Badge>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-3">
        <h4 className="text-sm font-semibold mb-2">React 18 Features</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Concurrent Rendering</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Automatic Batching</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Transitions API</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Suspense</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreMetricsPanel() {
  // This would connect to actual store metrics
  // For now, showing placeholder
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-400">
        Store metrics tracking coming soon...
      </div>
      <div className="space-y-2 text-xs">
        <div className="bg-gray-900 rounded p-2">
          <div className="font-medium mb-1">authStore</div>
          <div className="text-gray-400">Subscriptions: 3</div>
        </div>
        <div className="bg-gray-900 rounded p-2">
          <div className="font-medium mb-1">contactsStore</div>
          <div className="text-gray-400">Subscriptions: 5</div>
        </div>
        <div className="bg-gray-900 rounded p-2">
          <div className="font-medium mb-1">tasksStore</div>
          <div className="text-gray-400">Subscriptions: 2</div>
        </div>
      </div>
    </div>
  );
}

export default PerformanceMonitor;
