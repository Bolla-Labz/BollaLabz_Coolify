/**
 * Sentry Configuration for Frontend
 * Error monitoring and performance tracking
 * Last Modified: 2025-11-25 05:15
 */

import React from 'react';
import * as Sentry from '@sentry/react'
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom'

/**
 * Get Git commit hash from environment (set during build)
 */
function getGitCommitHash(): string {
  return import.meta.env.VITE_GIT_COMMIT_HASH || 'unknown'
}

// Track if Sentry is initialized
let sentryInitialized = false

/**
 * Initialize Sentry for the frontend
 * Simplified configuration to avoid circular dependency issues
 */
export function initializeSentry(): void {
  // Prevent double initialization
  if (sentryInitialized) {
    return
  }

  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
  const ENVIRONMENT = import.meta.env.MODE || 'development'

  // Skip Sentry initialization completely if no DSN is provided
  if (!SENTRY_DSN) {
    console.warn('⚠️  Sentry DSN not provided. Error monitoring disabled.')
    console.warn('   Set VITE_SENTRY_DSN in .env to enable error tracking.')
    sentryInitialized = true
    return
  }

  try {
    // Initialize Sentry with minimal, stable integrations
    // Removed browserProfilingIntegration and replayIntegration to avoid circular dependency
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,

      // Release tracking (uses git commit hash)
      release: `bollalabz-frontend@${getGitCommitHash()}`,

      // Performance Monitoring - basic integrations only
      integrations: [
        // React Router v6 integration for navigation tracking
        Sentry.reactRouterV6BrowserTracingIntegration({
          useEffect: React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes,
        }),

        // HTTP Client integration for API error tracking
        Sentry.httpClientIntegration(),
      ],

      // Performance monitoring sample rates
      tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

      // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/bollalabz\.com\/api/,
        /^https:\/\/api\.bollalabz\.com/,
      ],

      // Filter out sensitive data
      beforeSend(event, _hint) {
        // Remove sensitive data from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
            if (breadcrumb.data) {
              const sanitizedData = { ...breadcrumb.data }
              Object.keys(sanitizedData).forEach((key) => {
                if (
                  key.toLowerCase().includes('token') ||
                  key.toLowerCase().includes('key') ||
                  key.toLowerCase().includes('password') ||
                  key.toLowerCase().includes('secret')
                ) {
                  sanitizedData[key] = '[REDACTED]'
                }
              })
              breadcrumb.data = sanitizedData
            }
            return breadcrumb
          })
        }

        // Remove sensitive headers from fetch/xhr requests
        if (event.request?.headers) {
          delete event.request.headers['authorization']
          delete event.request.headers['x-api-key']
          delete event.request.headers['cookie']
        }

        return event
      },

      // Ignore specific errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        'atomicFindClose',
        // Random plugins/extensions
        'Can\'t find variable: ZiteReader',
        'jigsaw is not defined',
        'ComboSearch is not defined',
        'http://loading.retry.widdit.com/',
        'conduitPage',
        // Network errors that are expected
        'Network request failed',
        'NetworkError',
        'Failed to fetch',
        // ResizeObserver errors (harmless)
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        // Circular dependency errors from Sentry itself
        'Cannot access',
        'before initialization',
      ],

      // Ignore errors from specific URLs
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
        /^moz-extension:\/\//i,
      ],
    })

    sentryInitialized = true
    console.log('✓ Sentry initialized successfully')
    console.log(`  Environment: ${ENVIRONMENT}`)
    console.log(`  Release: bollalabz-frontend@${getGitCommitHash().substring(0, 7)}`)
  } catch (error) {
    console.warn('⚠️  Sentry initialization failed:', error)
    sentryInitialized = true // Mark as initialized to prevent retry loops
  }
}

/**
 * Manually capture an exception
 * @param error - Error to capture
 * @param context - Additional context
 */
export function captureException(error: Error, context: Record<string, unknown> = {}): void {
  Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Manually capture a message
 * @param message - Message to capture
 * @param level - Severity level
 * @param context - Additional context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context: Record<string, unknown> = {}
): void {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  })
}

/**
 * Add breadcrumb for debugging
 * @param message - Breadcrumb message
 * @param category - Breadcrumb category
 * @param data - Additional data
 */
export function addBreadcrumb(
  message: string,
  category = 'default',
  data: Record<string, unknown> = {}
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  })
}

/**
 * Set user context
 * @param user - User data
 */
export function setUser(user: {
  id?: string
  username?: string
  email?: string
  [key: string]: unknown
} | null): void {
  Sentry.setUser(user)
}

/**
 * Clear user context
 */
export function clearUser(): void {
  Sentry.setUser(null)
}

/**
 * Set custom context
 * @param name - Context name
 * @param context - Context data
 */
export function setContext(name: string, context: Record<string, unknown>): void {
  Sentry.setContext(name, context)
}

/**
 * Set tag for filtering
 * @param key - Tag key
 * @param value - Tag value
 */
export function setTag(key: string, value: string | number | boolean): void {
  Sentry.setTag(key, value)
}

/**
 * Create error boundary component
 */
export const ErrorBoundary = Sentry.ErrorBoundary

/**
 * Create profiler component for performance monitoring
 */
export const Profiler = Sentry.Profiler

/**
 * withProfiler HOC for performance monitoring
 */
export const withProfiler = Sentry.withProfiler

/**
 * Create Zustand middleware for Sentry state tracking
 * Captures state changes and errors in Zustand stores
 */
export function createSentryMiddleware<T>(
  storeName: string,
): (
  config: (set: any, get: any, api: any) => T,
) => (set: any, get: any, api: any) => T {
  return (config) => (set, get, api) => {
    const sentrySet = (partial: any, replace?: boolean) => {
      try {
        const previousState = get()
        const result = set(partial, replace)
        const nextState = get()

        // Add breadcrumb for state change
        Sentry.addBreadcrumb({
          category: 'zustand.state',
          message: `${storeName} state updated`,
          level: 'info',
          data: {
            store: storeName,
            previousState: JSON.stringify(previousState).substring(0, 1000),
            nextState: JSON.stringify(nextState).substring(0, 1000),
          },
        })

        return result
      } catch (error) {
        // Capture errors in state updates
        Sentry.captureException(error, {
          tags: {
            store: storeName,
            action: 'state_update',
          },
        })
        throw error
      }
    }

    return config(sentrySet, get, api)
  }
}

/**
 * Start a transaction for performance monitoring
 * @param name - Transaction name
 * @param op - Operation type
 * @returns Transaction object
 * @deprecated Use Sentry.startSpan() instead in Sentry v7+
 */
export function startTransaction(name: string, op = 'navigation'): any {
  // Note: startTransaction is deprecated in Sentry v7+
  // Use startSpan instead: https://docs.sentry.io/platforms/javascript/performance/
  if ('startTransaction' in Sentry && typeof (Sentry as any).startTransaction === 'function') {
    return (Sentry as any).startTransaction({
      name,
      op,
    })
  }
  console.warn('Sentry.startTransaction is not available. Consider using Sentry.startSpan instead.')
  return null
}

/**
 * Start a span for performance monitoring (modern API)
 * @param options - Span options
 * @param callback - Callback function to run within the span
 * @returns Result of callback
 */
export function startSpan<T>(
  options: { op: string; name: string },
  callback: (span: any) => T
): T {
  return Sentry.startSpan(options, callback)
}

/**
 * Sentry structured logger
 * Use for logging with automatic Sentry integration
 */
export const logger = Sentry.logger

export default Sentry
