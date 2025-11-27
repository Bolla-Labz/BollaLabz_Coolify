// Last Modified: 2025-11-23 17:36
import React from 'react';
import { cn } from '../lib/utils';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Lightweight loading spinner component for route-based code splitting
 * Optimized for minimal bundle size impact
 */
export function LoadingSpinner({
  message = 'Loading...',
  className,
  size = 'md'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4'
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[200px]',
        className
      )}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-muted-foreground/20 border-t-primary',
          sizeClasses[size]
        )}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * Full-page loading spinner for route transitions
 */
export function PageLoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <LoadingSpinner size="lg" message="Loading page..." />
    </div>
  );
}

/**
 * Inline loading spinner for smaller components
 */
export function InlineSpinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}