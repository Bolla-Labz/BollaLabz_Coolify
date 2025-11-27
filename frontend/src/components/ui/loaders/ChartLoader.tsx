// Last Modified: 2025-11-24 00:00
/**
 * ChartLoader Component
 * Skeleton loading state for chart components
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ChartLoaderProps {
  className?: string;
  type?: 'line' | 'bar' | 'pie' | 'area';
  height?: number;
}

export function ChartLoader({
  className,
  type = 'line',
  height = 300,
}: ChartLoaderProps) {
  return (
    <div
      className={cn('w-full rounded-lg border bg-card p-4', className)}
      style={{ height: `${height}px` }}
      role="status"
      aria-label="Loading chart"
    >
      <div className="h-full flex flex-col space-y-4 animate-pulse">
        {/* Chart title skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-6 bg-muted rounded w-32" />
          <div className="h-4 bg-muted rounded w-20" />
        </div>

        {/* Chart content skeleton */}
        <div className="flex-1 flex items-end justify-between gap-2 px-2">
          {type === 'line' && <LineChartSkeleton />}
          {type === 'bar' && <BarChartSkeleton />}
          {type === 'pie' && <PieChartSkeleton />}
          {type === 'area' && <AreaChartSkeleton />}
        </div>

        {/* Legend skeleton */}
        <div className="flex justify-center space-x-4">
          <div className="h-3 bg-muted rounded w-16" />
          <div className="h-3 bg-muted rounded w-16" />
          <div className="h-3 bg-muted rounded w-16" />
        </div>
      </div>
    </div>
  );
}

// Line chart skeleton
function LineChartSkeleton() {
  return (
    <>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-muted rounded-t"
          style={{
            height: `${Math.random() * 60 + 40}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </>
  );
}

// Bar chart skeleton
function BarChartSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-muted rounded-t"
          style={{
            height: `${Math.random() * 70 + 30}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </>
  );
}

// Pie chart skeleton
function PieChartSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative">
        <div className="h-40 w-40 rounded-full bg-muted" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-24 rounded-full bg-card" />
        </div>
      </div>
    </div>
  );
}

// Area chart skeleton
function AreaChartSkeleton() {
  return (
    <>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end">
          <div
            className="bg-muted/60 rounded-t"
            style={{
              height: `${Math.random() * 60 + 40}%`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        </div>
      ))}
    </>
  );
}
