// Last Modified: 2025-11-23 17:30
/**
 * Sentry Test Button Component
 * Use this to test error tracking and logging in Sentry
 *
 * Add this to your app during development to verify Sentry integration
 */

import React from 'react';
import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui/button';

export function SentryTestButton() {
  const handleClick = () => {
    // Send a structured log before throwing the error
    Sentry.logger.info('User triggered test error', {
      action: 'test_error_button_click',
      timestamp: new Date().toISOString(),
    });

    // Send a test metric before throwing the error
    Sentry.metrics.count('test_counter', 1);

    // Add breadcrumb for context
    Sentry.addBreadcrumb({
      category: 'user-action',
      message: 'User clicked test error button',
      level: 'info',
    });

    // Throw test error
    throw new Error('This is your first error!');
  };

  return (
    <Button
      variant="destructive"
      onClick={handleClick}
      className="bg-red-600 hover:bg-red-700"
    >
      Break the world (Test Sentry)
    </Button>
  );
}

/**
 * Test custom span instrumentation
 */
export function TestCustomSpan() {
  const handleTestSpan = async () => {
    // Example: Custom span for button click
    Sentry.startSpan(
      {
        op: 'ui.click',
        name: 'Test Button Click Span',
      },
      (span) => {
        // Add attributes to the span
        span.setAttribute('config', 'test-config');
        span.setAttribute('metric', 'test-metric');

        console.log('Executing custom span operation');

        // Simulate some work
        const result = Math.random() * 100;
        span.setAttribute('result', result);
      }
    );

    // Example: Custom span for API call
    await Sentry.startSpan(
      {
        op: 'http.client',
        name: 'GET /api/test',
      },
      async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('API call completed');
      }
    );

    Sentry.logger.info('Test spans executed successfully');
  };

  return (
    <Button
      variant="outline"
      onClick={handleTestSpan}
      className="ml-2"
    >
      Test Custom Spans
    </Button>
  );
}
