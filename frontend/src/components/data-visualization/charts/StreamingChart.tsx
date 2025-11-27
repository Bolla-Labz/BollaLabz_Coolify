// Last Modified: 2025-11-24 21:25
/**
 * StreamingChart Component
 * Real-time data visualization with WebSocket streaming
 * Features:
 * - Live data updates with sliding window
 * - Smooth path transitions on new data
 * - Pause/resume streaming controls
 * - Multiple series support
 * - Performance optimized for 60fps updates
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '@/lib/websocket/useWebSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Maximize2,
  Minimize2,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';

// ============================================
// TYPES
// ============================================

export interface StreamingDataPoint {
  timestamp: number;
  [key: string]: number;
}

export interface StreamingSeries {
  key: string;
  name: string;
  color?: string;
  strokeWidth?: number;
  dot?: boolean;
}

export interface StreamingChartProps {
  series: StreamingSeries[];
  websocketChannel: string;
  maxDataPoints?: number;
  updateInterval?: number;
  initialData?: StreamingDataPoint[];
  xAxisFormatter?: (value: number) => string;
  yAxisFormatter?: (value: number) => string;
  title?: string;
  subtitle?: string;
  showControls?: boolean;
  showStats?: boolean;
  enableExport?: boolean;
  height?: number;
  className?: string;
  onDataUpdate?: (data: StreamingDataPoint[]) => void;
}

// ============================================
// STREAMING STATS COMPONENT
// ============================================

interface StreamingStatsProps {
  dataPoints: number;
  updateRate: number;
  isPaused: boolean;
  latency: number;
}

const StreamingStats = React.memo(function StreamingStats({
  dataPoints,
  updateRate,
  isPaused,
  latency
}: StreamingStatsProps) {
  return (
    <div className="flex gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        <span className="font-medium">Points:</span>
        <span>{dataPoints}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-medium">Rate:</span>
        <span>{updateRate.toFixed(1)} Hz</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-medium">Latency:</span>
        <span>{latency}ms</span>
      </div>
      <Badge variant={isPaused ? 'secondary' : 'default'} className="text-xs">
        {isPaused ? 'Paused' : 'Live'}
      </Badge>
    </div>
  );
});

// ============================================
// CUSTOM TOOLTIP
// ============================================

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-background/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border"
    >
      <p className="text-sm font-medium mb-2">
        {new Date(label).toLocaleTimeString()}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
          </div>
          <span className="font-medium">
            {formatter ? formatter(entry.value) : entry.value.toFixed(2)}
          </span>
        </div>
      ))}
    </motion.div>
  );
};

// ============================================
// STREAMING CHART COMPONENT
// ============================================

export const StreamingChart: React.FC<StreamingChartProps> = ({
  series,
  websocketChannel,
  maxDataPoints = 100,
  updateInterval = 1000,
  initialData = [],
  xAxisFormatter,
  yAxisFormatter,
  title,
  subtitle,
  showControls = true,
  showStats = true,
  enableExport = true,
  height = 400,
  className,
  onDataUpdate,
}) => {
  const [data, setData] = useState<StreamingDataPoint[]>(initialData);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [updateRate, setUpdateRate] = useState(0);
  const [latency, setLatency] = useState(0);

  const { subscribe, isConnected } = useWebSocket({
    url: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8000',
  });

  const lastUpdateRef = useRef<number>(Date.now());
  const updateCountRef = useRef<number>(0);
  const updateRateIntervalRef = useRef<NodeJS.Timeout>();

  // Color scheme
  const colors = useMemo(() => {
    const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    return series.map((s, i) => s.color || defaultColors[i % defaultColors.length]);
  }, [series]);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (!isConnected || isPaused) return;

    const unsubscribe = subscribe(websocketChannel, (newPoint: StreamingDataPoint) => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      // Calculate latency
      const pointLatency = now - newPoint.timestamp;
      setLatency(pointLatency);

      // Update data with sliding window
      setData((prev) => {
        const updated = [
          ...prev,
          { ...newPoint, timestamp: newPoint.timestamp || now },
        ];

        // Keep only maxDataPoints
        if (updated.length > maxDataPoints) {
          return updated.slice(-maxDataPoints);
        }

        return updated;
      });

      // Track update rate
      updateCountRef.current++;

      // Callback
      onDataUpdate?.(data);
    });

    return unsubscribe;
  }, [isConnected, isPaused, websocketChannel, subscribe, maxDataPoints, data, onDataUpdate]);

  // Calculate update rate
  useEffect(() => {
    updateRateIntervalRef.current = setInterval(() => {
      setUpdateRate(updateCountRef.current);
      updateCountRef.current = 0;
    }, 1000);

    return () => {
      if (updateRateIntervalRef.current) {
        clearInterval(updateRateIntervalRef.current);
      }
    };
  }, []);

  // Handle pause/resume
  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  // Handle reset
  const handleReset = useCallback(() => {
    setData(initialData);
    updateCountRef.current = 0;
    setUpdateRate(0);
    setLatency(0);
  }, [initialData]);

  // Handle export
  const handleExport = useCallback(() => {
    const csv = [
      ['timestamp', ...series.map((s) => s.key)].join(','),
      ...data.map((point) =>
        [
          new Date(point.timestamp).toISOString(),
          ...series.map((s) => point[s.key] || ''),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streaming-chart-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, series]);

  // Format default timestamp
  const defaultXFormatter = useCallback((timestamp: number) => {
    return format(new Date(timestamp), 'HH:mm:ss');
  }, []);

  const xFormatter = xAxisFormatter || defaultXFormatter;

  return (
    <Card
      className={cn(
        'relative',
        isFullscreen && 'fixed inset-0 z-50',
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {title && <CardTitle>{title}</CardTitle>}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>

          {/* Connection indicator */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                isConnected && !isPaused ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              )}
            />
            <span className="text-xs text-muted-foreground">
              {isConnected ? (isPaused ? 'Paused' : 'Live') : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Controls */}
        {showControls && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTogglePause}
                disabled={!isConnected}
              >
                {isPaused ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>

              {enableExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={data.length === 0}
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Stats */}
            {showStats && (
              <StreamingStats
                dataPoints={data.length}
                updateRate={updateRate}
                isPaused={isPaused}
                latency={latency}
              />
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Activity className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Waiting for data...
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={isFullscreen ? '80vh' : height}>
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={xFormatter}
                stroke="currentColor"
                className="text-muted-foreground"
                fontSize={12}
              />
              <YAxis
                tickFormatter={yAxisFormatter}
                stroke="currentColor"
                className="text-muted-foreground"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip formatter={yAxisFormatter} />} />
              <Legend />

              {series.map((s, index) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={colors[index]}
                  strokeWidth={s.strokeWidth || 2}
                  dot={s.dot || false}
                  isAnimationActive={false} // Disable animation for real-time
                />
              ))}

              {/* Current time reference line */}
              {!isPaused && data.length > 0 && (
                <ReferenceLine
                  x={data[data.length - 1]?.timestamp}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  label={{ value: 'Now', position: 'top' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default StreamingChart;
