// Last Modified: 2025-11-23 17:30
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useState } from 'react'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = useState(false)

  // Determine if it's a critical error
  const isCritical = error.message.toLowerCase().includes('critical') ||
                     error.message.toLowerCase().includes('fatal')

  // Log error to console in development
  if (import.meta.env.DEV) {
    console.error('Error caught by ErrorBoundary:', error)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-6 w-6 ${isCritical ? 'text-destructive' : 'text-yellow-600'}`} />
            <CardTitle className="text-2xl">
              {isCritical ? 'Critical Error Occurred' : 'Something went wrong'}
            </CardTitle>
          </div>
          <CardDescription>
            {isCritical
              ? 'A critical error has occurred. Please refresh the page or contact support if the problem persists.'
              : 'An unexpected error has occurred. You can try to recover by resetting the application.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Alert */}
          <Alert variant={isCritical ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Message</AlertTitle>
            <AlertDescription className="mt-2 font-mono text-sm">
              {error.message || 'An unknown error occurred'}
            </AlertDescription>
          </Alert>

          {/* Error Details (Collapsible) */}
          {import.meta.env.DEV && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full justify-between"
              >
                <span>Technical Details</span>
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              {showDetails && (
                <div className="rounded-lg bg-muted p-4">
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold text-sm">Stack Trace:</span>
                      <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap break-words">
                        {error.stack || 'No stack trace available'}
                      </pre>
                    </div>
                    {error.cause && (
                      <div>
                        <span className="font-semibold text-sm">Cause:</span>
                        <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap break-words">
                          {String(error.cause)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={resetErrorBoundary}
              variant="default"
              className="flex-1 sm:flex-initial"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="flex-1 sm:flex-initial"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
            {isCritical && (
              <Button
                onClick={() => window.location.reload()}
                variant="destructive"
                className="flex-1 sm:flex-initial"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
            )}
          </div>

          {/* Support Information */}
          {isCritical && (
            <Alert>
              <AlertTitle>Need Help?</AlertTitle>
              <AlertDescription>
                If this problem persists, please contact support with the following information:
                <ul className="mt-2 text-sm space-y-1">
                  <li>• Error Code: {error.name || 'Unknown'}</li>
                  <li>• Time: {new Date().toLocaleString()}</li>
                  <li>• Page: {window.location.pathname}</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}