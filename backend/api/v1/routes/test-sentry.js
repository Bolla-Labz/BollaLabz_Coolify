// Last Modified: 2025-11-23 17:30
/**
 * Test Sentry Error Tracking Routes
 * These routes are for testing Sentry integration
 */

import express from 'express';
import { captureException, captureMessage, addBreadcrumb } from '../../../config/sentry.js';

const router = express.Router();

/**
 * @route   GET /api/v1/test/sentry/error
 * @desc    Test error tracking - throws an error
 * @access  Public (for testing only - remove in production)
 */
router.get('/error', (req, res, next) => {
  addBreadcrumb('Test error endpoint called', 'test');

  const error = new Error('Test error: This is a test error from the backend');
  error.statusCode = 500;

  // This error will be caught by Sentry error handler
  next(error);
});

/**
 * @route   GET /api/v1/test/sentry/unhandled
 * @desc    Test unhandled error - throws synchronously
 * @access  Public (for testing only - remove in production)
 */
router.get('/unhandled', (req, res) => {
  addBreadcrumb('Test unhandled error endpoint called', 'test');

  // This will be caught by the global error handler
  throw new Error('Test unhandled error: This error was thrown synchronously');
});

/**
 * @route   GET /api/v1/test/sentry/async-error
 * @desc    Test async error - rejects promise
 * @access  Public (for testing only - remove in production)
 */
router.get('/async-error', async (req, res) => {
  addBreadcrumb('Test async error endpoint called', 'test');

  // This will trigger an unhandled promise rejection
  await Promise.reject(new Error('Test async error: This promise was rejected'));
});

/**
 * @route   GET /api/v1/test/sentry/message
 * @desc    Test message capture
 * @access  Public (for testing only - remove in production)
 */
router.get('/message', (req, res) => {
  addBreadcrumb('Test message endpoint called', 'test');

  captureMessage('Test message: This is a test message from the backend', 'info', {
    test: true,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Test message sent to Sentry',
  });
});

/**
 * @route   GET /api/v1/test/sentry/breadcrumbs
 * @desc    Test breadcrumb tracking
 * @access  Public (for testing only - remove in production)
 */
router.get('/breadcrumbs', (req, res, next) => {
  addBreadcrumb('Step 1: User accessed breadcrumbs test', 'navigation');
  addBreadcrumb('Step 2: Processing request', 'http');
  addBreadcrumb('Step 3: Generating test error', 'test');

  const error = new Error('Test error with breadcrumbs');
  error.statusCode = 500;

  next(error);
});

/**
 * @route   GET /api/v1/test/sentry/performance
 * @desc    Test performance monitoring
 * @access  Public (for testing only - remove in production)
 */
router.get('/performance', async (req, res) => {
  addBreadcrumb('Test performance endpoint called', 'test');

  // Simulate slow operation
  await new Promise(resolve => setTimeout(resolve, 2000));

  res.json({
    success: true,
    message: 'Performance test completed',
    duration: '2000ms',
  });
});

/**
 * @route   GET /api/v1/test/sentry/database-error
 * @desc    Test database error
 * @access  Public (for testing only - remove in production)
 */
router.get('/database-error', (req, res, next) => {
  addBreadcrumb('Test database error endpoint called', 'test');

  const error = new Error('Test database error: Connection failed');
  error.name = 'DatabaseError';
  error.statusCode = 503;
  error.code = 'ECONNREFUSED';

  next(error);
});

export default router;
