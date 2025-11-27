// Last Modified: 2025-11-24 16:58
import { Component } from 'react' // Import Component directly to avoid React access
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './components/providers/ThemeProvider'
import { AuthProvider } from './components/providers/AuthProvider'
import { WebSocketProvider } from './components/providers/WebSocketProvider'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { GlobalSearch, useGlobalSearch } from './components/search/GlobalSearch'

// Lazy load pages for better performance
import { lazy, Suspense, ReactNode, useEffect } from 'react'
import { RouteLoader } from './components/ui/loaders/RouteLoader'
import { PageErrorBoundary } from './components/errors/ErrorBoundary'
import { preloadCriticalRoutes, preloadAuthenticatedRoutes } from './lib/utils/resource-preloader'

// Lazy load pages with preload exports
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Contacts = lazy(() => import('./pages/Contacts'))
const Conversations = lazy(() => import('./pages/Conversations'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Workflows = lazy(() => import('./pages/Workflows'))
const Financial = lazy(() => import('./pages/Financial'))
const CreditScore = lazy(() => import('./pages/CreditScore'))
const PeopleAnalytics = lazy(() => import('./pages/PeopleAnalytics'))
const Settings = lazy(() => import('./pages/Settings'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const SentryTest = lazy(() => import('./pages/SentryTest'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Import prefetch system
import { prefetchManager } from './lib/prefetch/PrefetchManager'
import { backgroundRefresh } from './lib/prefetch/BackgroundRefresh'
import { prefetchAnalytics } from './lib/prefetch/analytics'
import { useLocation } from 'react-router-dom'

// Configure React Query for real-time updates
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchOnReconnect: true, // Refetch when reconnecting
      retry: 2, // Retry failed requests twice
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30 * 1000, // Consider data stale after 30 seconds
      gcTime: 5 * 60 * 1000, // Garbage collect after 5 minutes
    },
    mutations: {
      retry: 1, // Retry failed mutations once
      retryDelay: 1000,
    },
  },
})

// Enhanced error boundary for production
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: any) {
    console.error('React Error Boundary Caught:', error, errorInfo)
    // In production, this would send to Sentry
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.href = '/'
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Navigation tracking component
function NavigationTracker() {
  const location = useLocation()

  useEffect(() => {
    // Track navigation for prefetch analytics
    const startTime = Date.now()
    prefetchManager.trackNavigation(location.pathname)

    return () => {
      const timeElapsed = Date.now() - startTime
      prefetchAnalytics.trackNavigation(location.pathname, timeElapsed)
    }
  }, [location.pathname])

  return null
}

function App() {
  // Initialize prefetch system on mount
  useEffect(() => {
    // Preload critical routes
    preloadCriticalRoutes();

    // Start background refresh
    backgroundRefresh.start();

    // Cleanup on unmount
    return () => {
      backgroundRefresh.stop();
    };
  }, []);

  // Global search (Cmd+K / Ctrl+K)
  const { open: searchOpen, setOpen: setSearchOpen } = useGlobalSearch();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="bollalabz-theme">
          <Router>
            <NavigationTracker />
            <AuthProvider>
              <WebSocketProvider>
                {/* Global Search - Accessible everywhere with Cmd+K */}
                <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
                <Routes>
                  {/* Public routes with individual Suspense boundaries */}
                  <Route
                    path="/login"
                    element={
                      <PageErrorBoundary>
                        <Suspense fallback={<RouteLoader message="Loading login..." />}>
                          <Login />
                        </Suspense>
                      </PageErrorBoundary>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PageErrorBoundary>
                        <Suspense fallback={<RouteLoader message="Loading registration..." />}>
                          <Register />
                        </Suspense>
                      </PageErrorBoundary>
                    }
                  />
                  <Route
                    path="/sentry-test"
                    element={
                      <PageErrorBoundary>
                        <Suspense fallback={<RouteLoader message="Loading test..." />}>
                          <SentryTest />
                        </Suspense>
                      </PageErrorBoundary>
                    }
                  />

                  {/* Protected routes with nested Suspense boundaries */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                      <Route index element={<Navigate to="/dashboard" replace />} />
                      <Route
                        path="/dashboard"
                        element={
                          <PageErrorBoundary>
                            <Suspense fallback={<RouteLoader message="Loading dashboard..." />}>
                              <Dashboard />
                            </Suspense>
                          </PageErrorBoundary>
                        }
                      />
                      <Route
                        path="/contacts"
                        element={
                          <PageErrorBoundary>
                            <Suspense fallback={<RouteLoader message="Loading contacts..." />}>
                              <Contacts />
                            </Suspense>
                          </PageErrorBoundary>
                        }
                      />
                      <Route
                        path="/conversations"
                        element={
                          <PageErrorBoundary>
                            <Suspense fallback={<RouteLoader message="Loading conversations..." />}>
                              <Conversations />
                            </Suspense>
                          </PageErrorBoundary>
                        }
                      />
                      <Route
                        path="/tasks"
                        element={
                          <PageErrorBoundary>
                            <Suspense fallback={<RouteLoader message="Loading tasks..." />}>
                              <Tasks />
                            </Suspense>
                          </PageErrorBoundary>
                        }
                      />
                      <Route
                        path="/calendar"
                        element={
                          <PageErrorBoundary>
                            <Suspense fallback={<RouteLoader message="Loading calendar..." />}>
                              <Calendar />
                            </Suspense>
                          </PageErrorBoundary>
                        }
                      />
                      <Route
                        path="/workflows"
                        element={
                          <PageErrorBoundary>
                            <Suspense fallback={<RouteLoader message="Loading workflows..." />}>
                              <Workflows />
                            </Suspense>
                          </PageErrorBoundary>
                        }
                      />
                      <Route
                        path="/financial"
                        element={
                          <PageErrorBoundary>
                            <Suspense fallback={<RouteLoader message="Loading financial..." />}>
                              <Financial />
                            </Suspense>
                          </PageErrorBoundary>
                        }
                      />
                      <Route
                        path="/credit-score"
                        element={
                          <PageErrorBoundary>
                            <Suspense fallback={<RouteLoader message="Loading credit score..." />}>
                              <CreditScore />
                            </Suspense>
                          </PageErrorBoundary>
                        }
                      />
                      <Route
                        path="/analytics"
                        element={
                          <PageErrorBoundary>
                            <Suspense fallback={<RouteLoader message="Loading analytics..." />}>
                              <PeopleAnalytics />
                            </Suspense>
                          </PageErrorBoundary>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <PageErrorBoundary>
                            <Suspense fallback={<RouteLoader message="Loading settings..." />}>
                              <Settings />
                            </Suspense>
                          </PageErrorBoundary>
                        }
                      />
                    </Route>
                  </Route>

                  {/* 404 route */}
                  <Route
                    path="*"
                    element={
                      <PageErrorBoundary>
                        <Suspense fallback={<RouteLoader message="Loading..." />}>
                          <NotFound />
                        </Suspense>
                      </PageErrorBoundary>
                    }
                  />
                </Routes>

                {/* Global notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#333',
                      color: '#fff',
                    },
                    success: {
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />

                {/* React Query Devtools (development only) */}
                {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
              </WebSocketProvider>
            </AuthProvider>
          </Router>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App