// Last Modified: 2025-11-25 00:00
/**
 * Sentry Test Page
 * Used to manually test Sentry error tracking
 */

import { captureException, captureMessage } from '../lib/monitoring/sentry'

export default function SentryTest() {
  const triggerError = () => {
    // This will trigger an undefined function error
    (window as any).myUndefinedFunction()
  }

  const triggerManualError = () => {
    try {
      throw new Error('Manual test error from Sentry Test Page')
    } catch (error) {
      captureException(error as Error, {
        page: 'SentryTest',
        action: 'manual_error_test',
      })
    }
  }

  const triggerMessage = () => {
    captureMessage('Test message from Sentry Test Page', 'info', {
      page: 'SentryTest',
      timestamp: new Date().toISOString(),
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Sentry Error Tracking Test</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold mb-4">Test Sentry Integration</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Click the buttons below to trigger different types of errors and verify
              they appear in your Sentry dashboard.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={triggerError}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Trigger Undefined Function Error
            </button>

            <button
              onClick={triggerManualError}
              className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Trigger Manual Error (Captured)
            </button>

            <button
              onClick={triggerMessage}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Send Test Message to Sentry
            </button>
          </div>

          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold mb-2">What happens when you click:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li><strong>Undefined Function:</strong> Triggers a real JavaScript error that Sentry will capture automatically</li>
              <li><strong>Manual Error:</strong> Throws an error and manually sends it to Sentry with custom context</li>
              <li><strong>Test Message:</strong> Sends an informational message to Sentry for tracking</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>📊 Check your Sentry dashboard:</strong> Errors should appear within a few seconds in your configured Sentry project.
              {import.meta.env.VITE_SENTRY_DSN && (
                <span className="block mt-2 text-xs text-blue-600 dark:text-blue-300">
                  Project configured: {import.meta.env.VITE_SENTRY_PROJECT || 'bollalabz-frontend'}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
