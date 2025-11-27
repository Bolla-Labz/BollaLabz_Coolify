// Last Modified: 2025-11-24 00:00
/**
 * DataLoader Component
 * Inline loading fallback for data-fetching Suspense boundaries
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface DataLoaderProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'skeleton' | 'pulse';
}

export function DataLoader({
  message,
  className,
  size = 'md',
  variant = 'spinner',
}: DataLoaderProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  if (variant === 'skeleton') {
    return <SkeletonLoader className={className} />;
  }

  if (variant === 'pulse') {
    return <PulseLoader message={message} className={className} />;
  }

  return (
    <div
      className={cn('flex items-center justify-center p-4', className)}
      role="status"
      aria-live="polite"
      aria-label={message || 'Loading data'}
    >
      <div className="flex flex-col items-center space-y-2">
        <div
          className={cn(
            'animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary',
            sizeClasses[size]
          )}
        />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}

// Skeleton variant for content placeholders
function SkeletonLoader({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3 p-4', className)} role="status" aria-label="Loading content">
      <div className="h-4 bg-muted rounded animate-pulse" />
      <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
      <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
    </div>
  );
}

// Pulse variant for smooth loading states
function PulseLoader({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn('flex items-center justify-center p-4', className)}
      role="status"
      aria-label={message || 'Loading'}
    >
      <div className="flex space-x-2">
        <div className="h-3 w-3 bg-primary rounded-full animate-pulse [animation-delay:-0.3s]" />
        <div className="h-3 w-3 bg-primary rounded-full animate-pulse [animation-delay:-0.15s]" />
        <div className="h-3 w-3 bg-primary rounded-full animate-pulse" />
      </div>
      {message && (
        <p className="ml-3 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

// Inline spinner for buttons and small spaces
export function InlineLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
