// Last Modified: 2025-11-24 00:00
/**
 * RouteLoader Component
 * Full-page loading fallback for route-level Suspense boundaries
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface RouteLoaderProps {
  message?: string;
  className?: string;
}

export function RouteLoader({
  message = 'Loading page...',
  className,
}: RouteLoaderProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 bg-background flex items-center justify-center z-50',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex flex-col items-center space-y-4">
        {/* Animated Logo/Icon */}
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-primary" />

          {/* Inner pulsing dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-primary/30 animate-pulse" />
            <div className="absolute h-4 w-4 rounded-full bg-primary animate-ping" />
          </div>
        </div>

        {/* Loading message */}
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground animate-pulse">
            {message}
          </p>
          <div className="flex items-center justify-center space-x-1">
            <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2 w-2 bg-primary rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Lightweight variant for nested routes
export function NestedRouteLoader({
  message = 'Loading...',
  className,
}: RouteLoaderProps) {
  return (
    <div
      className={cn(
        'w-full min-h-[400px] flex items-center justify-center',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex flex-col items-center space-y-3">
        <div className="h-12 w-12 animate-spin rounded-full border-3 border-muted-foreground/20 border-t-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}
