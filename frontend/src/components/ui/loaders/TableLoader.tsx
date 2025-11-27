// Last Modified: 2025-11-24 00:00
/**
 * TableLoader Component
 * Skeleton loading state for table components
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface TableLoaderProps {
  className?: string;
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export function TableLoader({
  className,
  rows = 5,
  columns = 4,
  showHeader = true,
}: TableLoaderProps) {
  return (
    <div
      className={cn('w-full rounded-lg border bg-card overflow-hidden', className)}
      role="status"
      aria-label="Loading table"
    >
      <div className="animate-pulse">
        {/* Table header */}
        {showHeader && (
          <div className="border-b bg-muted/50">
            <div className="flex divide-x">
              {Array.from({ length: columns }).map((_, i) => (
                <div key={i} className="flex-1 p-4">
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table rows */}
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex divide-x hover:bg-muted/20">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="flex-1 p-4">
                  <div
                    className="h-3 bg-muted rounded"
                    style={{
                      width: `${Math.random() * 40 + 60}%`,
                      animationDelay: `${(rowIndex * columns + colIndex) * 0.05}s`,
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Compact table loader for smaller tables
export function CompactTableLoader({
  className,
  rows = 3,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div
      className={cn('w-full space-y-2', className)}
      role="status"
      aria-label="Loading table"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 bg-muted rounded animate-pulse"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

// List loader for list views
export function ListLoader({
  className,
  items = 5,
}: {
  className?: string;
  items?: number;
}) {
  return (
    <div
      className={cn('w-full space-y-3', className)}
      role="status"
      aria-label="Loading list"
    >
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-3 p-3 bg-card rounded-lg border animate-pulse"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          {/* Avatar/Icon */}
          <div className="h-10 w-10 bg-muted rounded-full flex-shrink-0" />

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>

          {/* Action */}
          <div className="h-8 w-20 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}
