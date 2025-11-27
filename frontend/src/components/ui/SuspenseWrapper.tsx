// Last Modified: 2025-11-24 00:00
/**
 * SuspenseWrapper Component
 * Reusable wrapper for React Suspense with error boundaries
 * Provides consistent loading and error handling across the app
 */

import React, { Suspense, ReactNode } from 'react';
import { ErrorBoundary, type ErrorFallbackProps } from '@/components/errors/ErrorBoundary';
import { DataLoader } from './loaders/DataLoader';

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: React.ComponentType<ErrorFallbackProps>;
  errorBoundaryProps?: {
    level?: 'page' | 'section' | 'component';
    enableRecovery?: boolean;
    maxRetries?: number;
    name?: string;
  };
  loadingMessage?: string;
  loadingVariant?: 'spinner' | 'skeleton' | 'pulse';
  loadingSize?: 'sm' | 'md' | 'lg';
}

/**
 * SuspenseWrapper - Combines Suspense and ErrorBoundary
 *
 * Usage:
 * ```tsx
 * <SuspenseWrapper loadingMessage="Loading data...">
 *   <AsyncComponent />
 * </SuspenseWrapper>
 * ```
 */
export function SuspenseWrapper({
  children,
  fallback,
  errorFallback,
  errorBoundaryProps = {},
  loadingMessage,
  loadingVariant = 'spinner',
  loadingSize = 'md',
}: SuspenseWrapperProps) {
  const {
    level = 'component',
    enableRecovery = true,
    maxRetries = 3,
    name = 'SuspenseWrapper',
  } = errorBoundaryProps;

  // Default loading fallback
  const defaultFallback = (
    <DataLoader
      message={loadingMessage}
      variant={loadingVariant}
      size={loadingSize}
    />
  );

  return (
    <ErrorBoundary
      level={level}
      enableRecovery={enableRecovery}
      maxRetries={maxRetries}
      name={name}
      fallback={errorFallback}
      isolate={level === 'component'}
    >
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * Specialized wrappers for common use cases
 */

// For route-level components
export function RouteSuspenseWrapper({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <SuspenseWrapper
      fallback={fallback}
      errorBoundaryProps={{
        level: 'page',
        enableRecovery: true,
        maxRetries: 3,
        name: 'RouteWrapper',
      }}
    >
      {children}
    </SuspenseWrapper>
  );
}

// For section-level components
export function SectionSuspenseWrapper({
  children,
  name,
  loadingMessage,
}: {
  children: ReactNode;
  name: string;
  loadingMessage?: string;
}) {
  return (
    <SuspenseWrapper
      loadingMessage={loadingMessage}
      errorBoundaryProps={{
        level: 'section',
        enableRecovery: true,
        maxRetries: 2,
        name: `Section-${name}`,
      }}
    >
      {children}
    </SuspenseWrapper>
  );
}

// For data-fetching components
export function DataSuspenseWrapper({
  children,
  loadingMessage = 'Loading data...',
  variant = 'spinner',
}: {
  children: ReactNode;
  loadingMessage?: string;
  variant?: 'spinner' | 'skeleton' | 'pulse';
}) {
  return (
    <SuspenseWrapper
      loadingMessage={loadingMessage}
      loadingVariant={variant}
      errorBoundaryProps={{
        level: 'component',
        enableRecovery: true,
        maxRetries: 3,
        name: 'DataWrapper',
      }}
    >
      {children}
    </SuspenseWrapper>
  );
}

// For chart components
export function ChartSuspenseWrapper({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <SuspenseWrapper
      fallback={fallback}
      errorBoundaryProps={{
        level: 'component',
        enableRecovery: false,
        maxRetries: 1,
        name: 'ChartWrapper',
      }}
    >
      {children}
    </SuspenseWrapper>
  );
}

// For table components
export function TableSuspenseWrapper({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <SuspenseWrapper
      fallback={fallback}
      loadingVariant="skeleton"
      errorBoundaryProps={{
        level: 'component',
        enableRecovery: true,
        maxRetries: 2,
        name: 'TableWrapper',
      }}
    >
      {children}
    </SuspenseWrapper>
  );
}

// Export default
export default SuspenseWrapper;
