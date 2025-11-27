// Last Modified: 2025-11-24 00:00
/**
 * Chart Optimization Utilities
 * Provides React 18 performance optimizations for chart rendering
 * Uses useDeferredValue for smooth, non-blocking updates
 */

import { useMemo, useDeferredValue, useState, useEffect } from 'react';

// ============================================
// TYPES
// ============================================

export interface ChartData {
  [key: string]: any;
}

export interface OptimizedChartResult<T extends ChartData> {
  chartData: T[];
  isProcessing: boolean;
  isStale: boolean;
}

export interface ChartOptimizationOptions {
  /** Threshold to trigger optimization (default: 100) */
  threshold?: number;
  /** Debounce delay in ms (default: 0) */
  debounceMs?: number;
  /** Enable data aggregation for large datasets */
  aggregate?: boolean;
  /** Aggregation bucket size */
  bucketSize?: number;
}

// ============================================
// CUSTOM HOOKS
// ============================================

/**
 * Optimized chart data hook using React 18's useDeferredValue
 * Provides smooth, non-blocking chart updates for large datasets
 *
 * @param rawData - The raw data array that may update frequently
 * @param transformFn - Function to transform raw data into chart-ready format
 * @param options - Optimization options
 * @returns Optimized chart data with processing state indicators
 *
 * @example
 * ```typescript
 * const { chartData, isProcessing, isStale } = useOptimizedChartData(
 *   rawSensorData,
 *   (data) => data.map(d => ({ time: d.timestamp, value: d.reading })),
 *   { threshold: 100 }
 * );
 * ```
 */
export function useOptimizedChartData<T extends ChartData>(
  rawData: any[],
  transformFn: (data: any[]) => T[],
  options: ChartOptimizationOptions = {}
): OptimizedChartResult<T> {
  const {
    threshold = 100,
    debounceMs = 0,
    aggregate = false,
    bucketSize = 10,
  } = options;

  const [debouncedData, setDebouncedData] = useState(rawData);

  // Apply debouncing if configured
  useEffect(() => {
    if (debounceMs > 0) {
      const timer = setTimeout(() => {
        setDebouncedData(rawData);
      }, debounceMs);

      return () => clearTimeout(timer);
    } else {
      setDebouncedData(rawData);
    }
  }, [rawData, debounceMs]);

  // Use deferred value for non-blocking updates
  const deferredData = useDeferredValue(debouncedData);

  // Detect if data is stale (still processing)
  const isStale = debouncedData !== deferredData;

  // Transform and optionally aggregate data
  const processedData = useMemo(() => {
    if (!deferredData || deferredData.length === 0) {
      return [];
    }

    // For small datasets, just transform
    if (deferredData.length < threshold || !aggregate) {
      return transformFn(deferredData);
    }

    // For large datasets, aggregate into buckets
    const aggregated: any[] = [];
    for (let i = 0; i < deferredData.length; i += bucketSize) {
      const bucket = deferredData.slice(i, i + bucketSize);
      aggregated.push(bucket[Math.floor(bucket.length / 2)]); // Use median item
    }

    return transformFn(aggregated);
  }, [deferredData, transformFn, threshold, aggregate, bucketSize]);

  return {
    chartData: processedData,
    isProcessing: isStale,
    isStale,
  };
}

/**
 * Hook for optimizing table data with React 18's useDeferredValue
 * Specifically designed for virtual tables with 10,000+ rows
 *
 * @param rawData - Raw table data
 * @param filterFn - Optional filter function
 * @param sortFn - Optional sort function
 * @returns Optimized table data with processing state
 */
export function useOptimizedTableData<T>(
  rawData: T[],
  filterFn?: (data: T[]) => T[],
  sortFn?: (data: T[]) => T[]
): OptimizedChartResult<T> {
  const [processedData, setProcessedData] = useState(rawData);

  // Apply filters and sorting in a non-blocking way
  useEffect(() => {
    let data = rawData;

    if (filterFn) {
      data = filterFn(data);
    }

    if (sortFn) {
      data = sortFn(data);
    }

    setProcessedData(data);
  }, [rawData, filterFn, sortFn]);

  // Defer the processed data to prevent UI blocking
  const deferredData = useDeferredValue(processedData);
  const isStale = processedData !== deferredData;

  return {
    chartData: deferredData,
    isProcessing: isStale,
    isStale,
  };
}

/**
 * Hook for optimizing time-series data with windowing
 * Useful for real-time charts with streaming data
 *
 * @param rawData - Streaming time-series data
 * @param windowSize - Number of data points to keep
 * @param transformFn - Transform function for chart format
 * @returns Optimized windowed data
 */
export function useOptimizedTimeSeriesData<T extends ChartData>(
  rawData: any[],
  windowSize: number,
  transformFn: (data: any[]) => T[]
): OptimizedChartResult<T> {
  // Keep only the most recent data points
  const windowedData = useMemo(() => {
    if (rawData.length <= windowSize) {
      return rawData;
    }
    return rawData.slice(-windowSize);
  }, [rawData, windowSize]);

  // Defer the windowed data
  const deferredData = useDeferredValue(windowedData);
  const isStale = windowedData !== deferredData;

  // Transform the data
  const chartData = useMemo(() => {
    return transformFn(deferredData);
  }, [deferredData, transformFn]);

  return {
    chartData,
    isProcessing: isStale,
    isStale,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Aggregate data points into buckets for better performance
 * @param data - Original data array
 * @param bucketSize - Number of items per bucket
 * @param aggregator - Aggregation function (default: average)
 */
export function aggregateDataPoints<T extends ChartData>(
  data: T[],
  bucketSize: number,
  aggregator: (bucket: T[]) => T = (bucket) => bucket[Math.floor(bucket.length / 2)]
): T[] {
  if (data.length <= bucketSize) {
    return data;
  }

  const aggregated: T[] = [];
  for (let i = 0; i < data.length; i += bucketSize) {
    const bucket = data.slice(i, i + bucketSize);
    aggregated.push(aggregator(bucket));
  }

  return aggregated;
}

/**
 * Calculate moving average for smoothing time-series data
 * @param data - Data array with numeric values
 * @param valueKey - Key to extract numeric value
 * @param windowSize - Window size for moving average
 */
export function calculateMovingAverage<T extends ChartData>(
  data: T[],
  valueKey: keyof T,
  windowSize: number
): T[] {
  if (data.length < windowSize) {
    return data;
  }

  return data.map((item, index) => {
    if (index < windowSize - 1) {
      return item;
    }

    const window = data.slice(index - windowSize + 1, index + 1);
    const sum = window.reduce((acc, d) => acc + Number(d[valueKey]), 0);
    const avg = sum / windowSize;

    return {
      ...item,
      [`${String(valueKey)}_ma`]: avg,
    };
  });
}

/**
 * Downsample data using Largest Triangle Three Buckets (LTTB) algorithm
 * Preserves visual characteristics while reducing data points
 *
 * @param data - Original data array
 * @param threshold - Target number of data points
 * @param xKey - Key for x-axis values
 * @param yKey - Key for y-axis values
 */
export function downsampleLTTB<T extends ChartData>(
  data: T[],
  threshold: number,
  xKey: keyof T = 'x' as keyof T,
  yKey: keyof T = 'y' as keyof T
): T[] {
  if (data.length <= threshold) {
    return data;
  }

  const sampled: T[] = [];
  const bucketSize = (data.length - 2) / (threshold - 2);

  // Always include first point
  sampled.push(data[0]);

  for (let i = 0; i < threshold - 2; i++) {
    const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1;
    const avgRangeLength = avgRangeEnd - avgRangeStart;

    let avgX = 0;
    let avgY = 0;

    for (let j = avgRangeStart; j < avgRangeEnd && j < data.length; j++) {
      avgX += Number(data[j][xKey]);
      avgY += Number(data[j][yKey]);
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    const rangeStart = Math.floor(i * bucketSize) + 1;
    const rangeEnd = Math.floor((i + 1) * bucketSize) + 1;

    let maxArea = -1;
    let maxAreaPoint = rangeStart;

    const prevX = Number(sampled[sampled.length - 1][xKey]);
    const prevY = Number(sampled[sampled.length - 1][yKey]);

    for (let j = rangeStart; j < rangeEnd && j < data.length; j++) {
      const currX = Number(data[j][xKey]);
      const currY = Number(data[j][yKey]);

      // Calculate triangle area
      const area = Math.abs(
        (prevX - avgX) * (currY - prevY) - (prevX - currX) * (avgY - prevY)
      ) * 0.5;

      if (area > maxArea) {
        maxArea = area;
        maxAreaPoint = j;
      }
    }

    sampled.push(data[maxAreaPoint]);
  }

  // Always include last point
  sampled.push(data[data.length - 1]);

  return sampled;
}

/**
 * Create a loading overlay component for charts
 */
export function ChartLoadingOverlay({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center pointer-events-none backdrop-blur-sm transition-opacity duration-200">
      <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Updating...</span>
      </div>
    </div>
  );
}

/**
 * Create a skeleton state for charts during loading
 */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="w-full animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg"
      style={{ height }}
    >
      <div className="h-full flex items-end justify-around p-4 gap-2">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-300 dark:bg-gray-700 rounded-t"
            style={{
              height: `${Math.random() * 60 + 40}%`,
              width: '10%',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default {
  useOptimizedChartData,
  useOptimizedTableData,
  useOptimizedTimeSeriesData,
  aggregateDataPoints,
  calculateMovingAverage,
  downsampleLTTB,
  ChartLoadingOverlay,
  ChartSkeleton,
};
