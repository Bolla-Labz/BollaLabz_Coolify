// Last Modified: 2025-11-23 17:30
/**
 * Error Handler Utility
 * Handles error processing, logging, and user notification
 */

import { AppError, isOperationalError } from './base';
import { NetworkError } from './frontend';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Processed error for display
 */
export interface ProcessedError {
  message: string;
  title: string;
  severity: ErrorSeverity;
  details?: any;
  suggestion?: string;
  canRetry: boolean;
}

/**
 * Process an error for user display
 */
export function processError(error: unknown): ProcessedError {
  // Handle AppError instances
  if (error instanceof AppError) {
    return {
      message: error.message,
      title: getErrorTitle(error),
      severity: getErrorSeverity(error),
      details: error.details,
      suggestion: error.details?.suggestion,
      canRetry: isRetryableError(error),
    };
  }

  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Network error. Please check your internet connection and try again.',
      title: 'Connection Error',
      severity: ErrorSeverity.ERROR,
      canRetry: true,
    };
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred.',
      title: 'Error',
      severity: ErrorSeverity.ERROR,
      canRetry: false,
    };
  }

  // Handle unknown errors
  return {
    message: 'An unexpected error occurred. Please try again.',
    title: 'Error',
    severity: ErrorSeverity.ERROR,
    canRetry: false,
  };
}

/**
 * Get user-friendly error title
 */
function getErrorTitle(error: AppError): string {
  const titleMap: Record<string, string> = {
    AuthenticationError: 'Authentication Required',
    InvalidTokenError: 'Session Expired',
    TokenExpiredError: 'Session Expired',
    InvalidCredentialsError: 'Login Failed',
    AuthorizationError: 'Access Denied',
    NotFoundError: 'Not Found',
    ValidationError: 'Validation Error',
    ConflictError: 'Conflict',
    RateLimitError: 'Too Many Requests',
    ExternalServiceError: 'Service Unavailable',
    BusinessLogicError: 'Operation Failed',
    NetworkError: 'Network Error',
    FormError: 'Form Error',
    StateError: 'Application Error',
  };

  return titleMap[error.name] || 'Error';
}

/**
 * Get error severity
 */
function getErrorSeverity(error: AppError): ErrorSeverity {
  if (error.statusCode >= 500) return ErrorSeverity.CRITICAL;
  if (error.statusCode >= 400 && error.statusCode < 500) return ErrorSeverity.WARNING;
  return ErrorSeverity.ERROR;
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: AppError): boolean {
  // Network errors, timeouts, service unavailable
  if (error instanceof NetworkError) return true;
  if (error.statusCode === 503 || error.statusCode === 504) return true;
  if (error.statusCode === 429) return true; // Rate limit

  return false;
}

/**
 * Log error to console (and potentially external service)
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  if (error instanceof AppError) {
    console.error(`[${error.name}]`, {
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      context,
    });
  } else if (error instanceof Error) {
    console.error('[Error]', {
      message: error.message,
      stack: error.stack,
      context,
    });
  } else {
    console.error('[Unknown Error]', { error, context });
  }

  // TODO: Send to error tracking service (Sentry, etc.)
}

/**
 * Create error from API response
 */
export function createErrorFromResponse(status: number, data: any): AppError {
  const message = data?.error?.message || data?.message || 'An error occurred';
  const code = data?.error?.code || 'UNKNOWN_ERROR';
  const details = data?.error?.details || data?.details;

  return new AppError(message, status, true, { code, ...details });
}
