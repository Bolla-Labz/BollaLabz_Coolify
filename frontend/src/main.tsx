// Last Modified: 2025-11-24 16:56
import * as React from 'react' // Explicit full React import to ensure proper initialization
import * as ReactDOM from 'react-dom/client' // Explicit full ReactDOM import
import App from './App'
import './styles/globals.css'
import { ErrorFallback } from './components/errors/ErrorFallback'
import { initializeSentry, ErrorBoundary, addBreadcrumb } from './lib/monitoring/sentry'
import { initPerformanceMonitoring, initRenderMonitoring } from './lib/performance/metrics'

// Initialize Sentry for error monitoring (must be first)
initializeSentry()

// Initialize Core Web Vitals monitoring (non-blocking)
initPerformanceMonitoring()

// Initialize render monitoring in development
if (import.meta.env.DEV) {
  initRenderMonitoring()
}

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);

  // Add breadcrumb for Sentry
  addBreadcrumb('Unhandled Promise Rejection', 'error', {
    reason: event.reason?.message || String(event.reason),
    promise: event.promise
  });

  // Prevent default browser handling (console error)
  event.preventDefault();

  // Show user-friendly error message
  const errorMessage = event.reason instanceof Error
    ? event.reason.message
    : 'An unexpected error occurred. Please try again.';

  // You can integrate with your toast/notification system here
  console.error('Promise rejection:', errorMessage);
});

// Performance monitoring
if (typeof window !== 'undefined' && 'performance' in window) {
  // Log Web Vitals and send to Sentry
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (perfData) {
      const metrics = {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        domInteractive: perfData.domInteractive,
        domComplete: perfData.domComplete,
      }
      console.log('Page Load Metrics:', metrics)

      // Add performance metrics as breadcrumb for Sentry
      addBreadcrumb('Page Load Performance', 'performance', metrics)
    }
  })
}

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      registration => {
        console.log('ServiceWorker registration successful:', registration.scope)
      },
      err => {
        console.log('ServiceWorker registration failed:', err)
      }
    )
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error} resetErrorBoundary={resetError} />
      )}
      beforeCapture={(scope) => {
        // Add additional context before capturing error
        scope.setTag('error_boundary', 'root')
      }}
      onError={(error, errorInfo) => {
        console.error('Application Error:', error, errorInfo)
        // Error is automatically sent to Sentry by ErrorBoundary
        addBreadcrumb('React Error Boundary Triggered', 'error', {
          componentStack: errorInfo.componentStack,
        })
      }}
      onReset={() => {
        addBreadcrumb('Error Boundary Reset', 'navigation')
        window.location.href = '/'
      }}
    >
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)