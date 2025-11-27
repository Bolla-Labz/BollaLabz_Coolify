// Last Modified: 2025-11-23 17:30
/**
 * BollaLabz Error Boundary System
 * Production-grade error handling aligned with project vision:
 * - Zero cognitive load: Automatic error recovery
 * - Human-first design: Clear, actionable error messages
 * - Production reliability: Comprehensive error tracking
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { SecurityAudit } from '@/lib/security';

// ============================================
// ERROR TYPES
// ============================================

export interface ErrorDetails {
  error: Error;
  errorInfo: ErrorInfo;
  errorBoundary?: string;
  errorBoundaryProps?: Record<string, any>;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number;
  isRecovering: boolean;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'section' | 'component';
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  maxRetries?: number;
  showDetails?: boolean;
  enableRecovery?: boolean;
  recoveryDelay?: number;
  customMessage?: string;
  name?: string;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorInfo: ErrorInfo | null;
  level: 'page' | 'section' | 'component';
  showDetails: boolean;
  customMessage?: string;
  retryCount: number;
  maxRetries: number;
}

// ============================================
// ERROR RECOVERY STRATEGIES
// ============================================

class ErrorRecovery {
  private static recoveryStrategies = new Map<string, () => Promise<void>>();

  /**
   * Register a recovery strategy for specific error types
   */
  static registerStrategy(errorType: string, strategy: () => Promise<void>): void {
    this.recoveryStrategies.set(errorType, strategy);
  }

  /**
   * Attempt to recover from an error
   */
  static async attemptRecovery(error: Error): Promise<boolean> {
    const strategy = this.recoveryStrategies.get(error.name);
    if (strategy) {
      try {
        await strategy();
        return true;
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
        return false;
      }
    }
    return false;
  }

  /**
   * Common recovery strategies
   */
  static initializeDefaultStrategies(): void {
    // Network error recovery - retry the request
    this.registerStrategy('NetworkError', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      window.location.reload();
    });

    // Chunk load error - reload the page
    this.registerStrategy('ChunkLoadError', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.location.reload();
    });

    // Authentication error - redirect to login
    this.registerStrategy('AuthenticationError', async () => {
      window.location.href = '/login';
    });

    // Permission error - show permission request
    this.registerStrategy('PermissionError', async () => {
      // Request necessary permissions
      console.log('Requesting permissions...');
    });
  }
}

// Initialize default recovery strategies
ErrorRecovery.initializeDefaultStrategies();

// ============================================
// MAIN ERROR BOUNDARY COMPONENT
// ============================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now(),
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, level = 'component', name } = this.props;

    // Create detailed error report
    const errorDetails: ErrorDetails = {
      error,
      errorInfo,
      errorBoundary: name || 'Unknown',
      errorBoundaryProps: this.props,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.group(`🚨 Error Boundary Caught Error [${level}]`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Props:', this.props);
      console.groupEnd();
    }

    // Log to security audit
    SecurityAudit.log(
      `Error Boundary: ${error.message}`,
      level === 'page' ? 'critical' : 'error',
      errorDetails
    );

    // Send to error tracking service (Sentry)
    if (import.meta.env.PROD) {
      Sentry.withScope((scope) => {
        scope.setTag('errorBoundary', true);
        scope.setTag('errorLevel', level);
        scope.setContext('errorBoundary', {
          name: name || 'Unknown',
          props: this.props,
          componentStack: errorInfo.componentStack,
        });
        Sentry.captureException(error);
      });
    }

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Update error count
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Attempt automatic recovery if enabled
    if (this.props.enableRecovery) {
      this.attemptAutomaticRecovery(error);
    }
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset on prop changes if enabled
    if (hasError && prevProps.children !== this.props.children && resetOnPropsChange) {
      this.resetError();
    }

    // Reset on resetKeys change
    if (hasError && resetKeys && resetKeys !== this.previousResetKeys) {
      if (resetKeys.some((key, idx) => key !== this.previousResetKeys[idx])) {
        this.resetError();
      }
    }

    this.previousResetKeys = resetKeys || [];
  }

  override componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  /**
   * Attempt automatic recovery from error
   */
  private async attemptAutomaticRecovery(error: Error): Promise<void> {
    const { recoveryDelay = 3000, maxRetries = 3 } = this.props;

    if (this.retryCount >= maxRetries) {
      console.error('Max retry attempts reached. Recovery failed.');
      return;
    }

    this.setState({ isRecovering: true });

    // Try error-specific recovery strategy
    const recovered = await ErrorRecovery.attemptRecovery(error);

    if (recovered) {
      this.resetError();
    } else {
      // Generic recovery: reset after delay
      this.resetTimeoutId = setTimeout(() => {
        this.retryCount++;
        this.resetError();
      }, recoveryDelay);
    }
  }

  /**
   * Reset error state
   */
  resetError = (): void => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
    });
  };

  /**
   * Get current user ID
   */
  private getUserId(): string | undefined {
    // This would integrate with your auth system
    try {
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.userId;
      }
    } catch {
      // Ignore parsing errors
    }
    return undefined;
  }

  /**
   * Get session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  override render(): ReactNode {
    const { hasError, error, errorInfo, isRecovering } = this.state;
    const {
      children,
      fallback: FallbackComponent = DefaultErrorFallback,
      level = 'component',
      showDetails = import.meta.env.DEV,
      customMessage,
      maxRetries = 3,
      isolate = false,
    } = this.props;

    if (hasError && error) {
      // Isolate error to prevent cascade
      if (isolate) {
        return (
          <div style={{ isolation: 'isolate' }}>
            <FallbackComponent
              error={error}
              resetError={this.resetError}
              errorInfo={errorInfo}
              level={level}
              showDetails={showDetails}
              customMessage={customMessage}
              retryCount={this.retryCount}
              maxRetries={maxRetries}
            />
          </div>
        );
      }

      return (
        <FallbackComponent
          error={error}
          resetError={this.resetError}
          errorInfo={errorInfo}
          level={level}
          showDetails={showDetails}
          customMessage={customMessage}
          retryCount={this.retryCount}
          maxRetries={maxRetries}
        />
      );
    }

    if (isRecovering) {
      return <RecoveringComponent />;
    }

    return children;
  }
}

// ============================================
// DEFAULT ERROR FALLBACK COMPONENT
// ============================================

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  errorInfo,
  level,
  showDetails,
  customMessage,
  retryCount,
  maxRetries,
}) => {
  const isPageLevel = level === 'page';
  const isSectionLevel = level === 'section';

  // Determine error severity and styling
  const getSeverityStyles = () => {
    if (isPageLevel) {
      return 'min-h-screen bg-red-50 dark:bg-red-950';
    }
    if (isSectionLevel) {
      return 'min-h-[400px] bg-orange-50 dark:bg-orange-950';
    }
    return 'min-h-[200px] bg-yellow-50 dark:bg-yellow-950';
  };

  const getIcon = () => {
    if (isPageLevel) {
      return '🚨'; // Critical error
    }
    if (isSectionLevel) {
      return '⚠️'; // Warning
    }
    return 'ℹ️'; // Info
  };

  return (
    <div className={`flex items-center justify-center p-8 ${getSeverityStyles()}`}>
      <div className="max-w-lg w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {/* Error Header */}
          <div className="flex items-center mb-4">
            <span className="text-4xl mr-3">{getIcon()}</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {customMessage || getDefaultMessage(level)}
              </h2>
              {retryCount > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Retry attempt {retryCount} of {maxRetries}
                </p>
              )}
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-300">
              {getErrorDescription(error)}
            </p>
          </div>

          {/* Error Details (Development Only) */}
          {showDetails && (
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                <div className="mb-2">
                  <strong>Type:</strong> {error.name}
                </div>
                {errorInfo && (
                  <div className="mb-2">
                    <strong>Component Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
                {error.stack && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-xs">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={resetError}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              disabled={retryCount >= maxRetries}
            >
              {retryCount >= maxRetries ? 'Max Retries Reached' : 'Try Again'}
            </button>
            {isPageLevel && (
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Go Home
              </button>
            )}
          </div>

          {/* Support Link */}
          <div className="mt-4 text-center">
            <a
              href="/support"
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Need help? Contact support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// RECOVERING COMPONENT
// ============================================

const RecoveringComponent: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">
          Attempting to recover...
        </p>
      </div>
    </div>
  );
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getDefaultMessage(level: 'page' | 'section' | 'component'): string {
  switch (level) {
    case 'page':
      return 'Something went wrong';
    case 'section':
      return 'This section encountered an error';
    case 'component':
      return 'A component error occurred';
    default:
      return 'An error occurred';
  }
}

function getErrorDescription(error: Error): string {
  // User-friendly error messages
  const errorMessages: Record<string, string> = {
    NetworkError: 'Unable to connect to the server. Please check your internet connection.',
    ChunkLoadError: 'Failed to load application resources. Please refresh the page.',
    AuthenticationError: 'Your session has expired. Please log in again.',
    PermissionError: 'You don\'t have permission to access this resource.',
    ValidationError: 'The information provided is invalid. Please check and try again.',
    NotFoundError: 'The requested resource could not be found.',
    TimeoutError: 'The operation took too long to complete. Please try again.',
    QuotaExceededError: 'Storage quota exceeded. Please free up some space.',
  };

  return errorMessages[error.name] || error.message || 'An unexpected error occurred.';
}

// ============================================
// SPECIALIZED ERROR BOUNDARIES
// ============================================

/**
 * Page-level error boundary
 * Wraps entire pages for critical error handling
 */
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      level="page"
      enableRecovery
      maxRetries={3}
      showDetails={import.meta.env.DEV}
      name="PageErrorBoundary"
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Section-level error boundary
 * Wraps major sections of a page
 */
export const SectionErrorBoundary: React.FC<{
  children: ReactNode;
  name: string;
}> = ({ children, name }) => {
  return (
    <ErrorBoundary
      level="section"
      enableRecovery
      maxRetries={2}
      isolate
      name={`Section-${name}`}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Component-level error boundary
 * Wraps individual components
 */
export const ComponentErrorBoundary: React.FC<{
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  name: string;
}> = ({ children, fallback, name }) => {
  return (
    <ErrorBoundary
      level="component"
      fallback={fallback}
      isolate
      name={`Component-${name}`}
    >
      {children}
    </ErrorBoundary>
  );
};

// ============================================
// ERROR BOUNDARY PROVIDER
// ============================================

/**
 * Global error boundary provider
 * Wraps the entire application
 */
export const ErrorBoundaryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      level="page"
      enableRecovery
      maxRetries={5}
      showDetails={import.meta.env.DEV}
      name="GlobalErrorBoundary"
      onError={(error, errorInfo) => {
        // Global error handler
        console.error('Global error caught:', error, errorInfo);

        // You can add global error handling logic here
        // For example, show a toast notification
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

// Export everything
export default ErrorBoundary;