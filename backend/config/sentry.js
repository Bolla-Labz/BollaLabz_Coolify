// Last Modified: 2025-11-23 17:30
/**
 * Sentry Configuration for Backend
 * Error monitoring and performance tracking
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { execSync } from 'child_process';

/**
 * Get Git commit hash for release tracking
 */
function getGitCommitHash() {
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Initialize Sentry for the backend
 */
export function initializeSentry() {
  const SENTRY_DSN = process.env.SENTRY_DSN;
  const NODE_ENV = process.env.NODE_ENV || 'development';

  // Skip Sentry initialization if no DSN is provided
  if (!SENTRY_DSN) {
    console.warn('⚠️  Sentry DSN not provided. Error monitoring disabled.');
    console.warn('   Set SENTRY_DSN in .env to enable error tracking.');
    return;
  }

  // Initialize Sentry
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: NODE_ENV,

    // Release tracking (uses git commit hash)
    release: `bollalabz-backend@${getGitCommitHash()}`,

    // Performance Monitoring
    tracesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

    // Profiling
    profilesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0,

    integrations: [
      // Enable HTTP request tracking
      Sentry.httpIntegration({
        tracing: {
          // Track incoming HTTP requests
          captureIncomingHeaders: true,
          captureOutgoingHeaders: true,
        },
      }),

      // Enable Node profiling
      nodeProfilingIntegration(),

      // Capture console messages
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn'],
      }),

      // Context lines around errors
      Sentry.contextLinesIntegration(),

      // Local variables in stack traces
      Sentry.localVariablesIntegration(),

      // Module metadata
      Sentry.modulesIntegration(),

      // Request data
      Sentry.requestDataIntegration(),
    ],

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['x-api-key'];
        delete event.request.headers['cookie'];
      }

      // Remove sensitive query params
      if (event.request?.query_string) {
        event.request.query_string = event.request.query_string
          .replace(/api_key=[^&]*/gi, 'api_key=[REDACTED]')
          .replace(/token=[^&]*/gi, 'token=[REDACTED]')
          .replace(/password=[^&]*/gi, 'password=[REDACTED]');
      }

      return event;
    },

    // Ignore specific errors
    ignoreErrors: [
      // Ignore client-side network errors
      'Network request failed',
      'NetworkError',
      'ECONNREFUSED',
      // Ignore rate limiting errors (these are expected)
      'Too Many Requests',
    ],
  });

  console.log('✓ Sentry initialized successfully');
  console.log(`  Environment: ${NODE_ENV}`);
  console.log(`  Release: bollalabz-backend@${getGitCommitHash().substring(0, 7)}`);
}

/**
 * Setup Sentry Express instrumentation
 * This must be called AFTER the app is created but BEFORE routes
 * @param {import('express').Application} app - Express app instance
 */
export function setupSentryMiddleware(app) {
  if (!process.env.SENTRY_DSN) {
    return; // Skip if Sentry is not initialized
  }

  // In Sentry v8+, instrumentation is handled automatically through integrations
  // We just need to set up the Express error handler
  console.log('  Sentry Express instrumentation configured via integrations');
}

/**
 * Setup Sentry error handler middleware
 * Must be added BEFORE any other error handlers but AFTER all routes
 * @param {import('express').Application} app - Express app instance
 */
export function setupSentryErrorHandler(app) {
  if (!process.env.SENTRY_DSN) {
    return; // Skip if Sentry is not initialized
  }

  // Error handler middleware to capture errors and send to Sentry
  app.use((err, req, res, next) => {
    // Capture all 5xx errors
    if (err.status >= 500 || !err.status) {
      Sentry.captureException(err, {
        extra: {
          url: req.url,
          method: req.method,
          body: req.body,
          query: req.query,
          params: req.params,
        },
      });
    }

    // Pass the error to the next error handler
    next(err);
  });
}

/**
 * Manually capture an exception
 * @param {Error} error - Error to capture
 * @param {Object} context - Additional context
 */
export function captureException(error, context = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Manually capture a message
 * @param {string} message - Message to capture
 * @param {string} level - Severity level (fatal, error, warning, info, debug)
 * @param {Object} context - Additional context
 */
export function captureMessage(message, level = 'info', context = {}) {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Add breadcrumb for debugging
 * @param {string} message - Breadcrumb message
 * @param {string} category - Breadcrumb category
 * @param {Object} data - Additional data
 */
export function addBreadcrumb(message, category = 'default', data = {}) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

/**
 * Set user context
 * @param {Object} user - User data
 */
export function setUser(user) {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Start a transaction for performance monitoring
 * @param {string} name - Transaction name
 * @param {string} op - Operation type
 * @returns {Object} Transaction object
 */
export function startTransaction(name, op = 'http.server') {
  return Sentry.startTransaction({
    name,
    op,
  });
}

export default Sentry;
