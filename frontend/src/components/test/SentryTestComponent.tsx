// Last Modified: 2025-11-23 17:30
/**
 * Sentry Test Component
 * Component for testing Sentry error tracking in the frontend
 *
 * NOTE: This is for development/testing only - remove in production
 */

import React, { useState } from 'react'
import { captureException, captureMessage, addBreadcrumb } from '../../lib/monitoring/sentry'

export const SentryTestComponent: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const handleTestError = () => {
    try {
      addBreadcrumb('User clicked test error button', 'user')
      throw new Error('Test error: This is a test error from the frontend')
    } catch (error) {
      captureException(error as Error, {
        test: true,
        timestamp: new Date().toISOString(),
      })
      setResult('Error sent to Sentry! Check your Sentry dashboard.')
    }
  }

  const handleTestMessage = () => {
    addBreadcrumb('User clicked test message button', 'user')
    captureMessage('Test message: This is a test message from the frontend', 'info', {
      test: true,
      timestamp: new Date().toISOString(),
    })
    setResult('Message sent to Sentry! Check your Sentry dashboard.')
  }

  const handleTestBreadcrumbs = () => {
    addBreadcrumb('Step 1: User clicked breadcrumbs test button', 'user')
    addBreadcrumb('Step 2: Processing test', 'navigation')
    addBreadcrumb('Step 3: Generating test error', 'error')

    try {
      throw new Error('Test error with breadcrumbs')
    } catch (error) {
      captureException(error as Error)
      setResult('Error with breadcrumbs sent to Sentry! Check breadcrumb trail.')
    }
  }

  const handleTestAsyncError = async () => {
    setLoading(true)
    addBreadcrumb('User clicked async error test button', 'user')

    try {
      await new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Test async error: This error was thrown asynchronously'))
        }, 1000)
      })
    } catch (error) {
      captureException(error as Error, {
        type: 'async',
        test: true,
      })
      setResult('Async error sent to Sentry!')
    } finally {
      setLoading(false)
    }
  }

  const handleTestAPIError = async () => {
    setLoading(true)
    addBreadcrumb('User clicked API error test button', 'user')

    try {
      const response = await fetch('http://localhost:3001/api/v1/test/sentry/error')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'API error')
      }

      setResult('API error test completed! Check Sentry for backend error.')
    } catch (error) {
      captureException(error as Error, {
        type: 'api',
        test: true,
      })
      setResult('API error captured! Check Sentry dashboard.')
    } finally {
      setLoading(false)
    }
  }

  const handleTestPerformance = async () => {
    setLoading(true)
    addBreadcrumb('User clicked performance test button', 'user')

    try {
      const startTime = performance.now()
      await fetch('http://localhost:3001/api/v1/test/sentry/performance')
      const endTime = performance.now()
      const duration = endTime - startTime

      addBreadcrumb('Performance test completed', 'performance', {
        duration: `${duration.toFixed(2)}ms`,
      })

      setResult(`Performance test completed in ${duration.toFixed(2)}ms`)
    } catch (error) {
      captureException(error as Error)
      setResult('Performance test failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Development Only:</strong> This component is for testing Sentry integration.
              Remove before deploying to production.
            </p>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-6">Sentry Error Tracking Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleTestError}
          disabled={loading}
          className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Test Frontend Error
        </button>

        <button
          onClick={handleTestMessage}
          disabled={loading}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Test Message Capture
        </button>

        <button
          onClick={handleTestBreadcrumbs}
          disabled={loading}
          className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Test Breadcrumbs
        </button>

        <button
          onClick={handleTestAsyncError}
          disabled={loading}
          className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Testing...' : 'Test Async Error'}
        </button>

        <button
          onClick={handleTestAPIError}
          disabled={loading}
          className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Testing...' : 'Test Backend Error'}
        </button>

        <button
          onClick={handleTestPerformance}
          disabled={loading}
          className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Testing...' : 'Test Performance Monitoring'}
        </button>
      </div>

      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">Result:</p>
          <p className="text-green-700 mt-1">{result}</p>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Test Instructions:</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Make sure Sentry DSN is configured in .env file</li>
          <li>Click any test button above</li>
          <li>Check your Sentry dashboard for the captured error/message</li>
          <li>Verify breadcrumbs, stack traces, and context data</li>
          <li>Test performance monitoring in Sentry Performance tab</li>
        </ol>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Setup Sentry:</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Sign up at <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://sentry.io</a></li>
          <li>Create a new project (select "React" for frontend)</li>
          <li>Copy the DSN from Settings → Projects → Client Keys</li>
          <li>Add to .env: <code className="bg-gray-200 px-2 py-1 rounded">VITE_SENTRY_DSN=your_dsn_here</code></li>
          <li>Restart the development server</li>
        </ol>
      </div>
    </div>
  )
}

export default SentryTestComponent
