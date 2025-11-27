// Last Modified: 2025-11-23 17:30
import logger from '../config/logger.js';

// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  // Log the error (excluding sensitive information)
  logger.error('Error occurred:', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
    // Don't log request body or query params - may contain passwords/tokens
  });

  // Default error response
  const errorResponse = {
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      ...errorResponse,
      error: 'Validation error',
      details: err.details || err.message
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      ...errorResponse,
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      ...errorResponse,
      error: 'Duplicate entry',
      message: 'A record with this value already exists'
    });
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({
      ...errorResponse,
      error: 'Reference error',
      message: 'Referenced record does not exist'
    });
  }

  if (err.code === '23502') { // PostgreSQL not null violation
    return res.status(400).json({
      ...errorResponse,
      error: 'Missing required field',
      message: 'A required field is missing'
    });
  }

  // Default 500 error
  res.status(err.statusCode || 500).json(errorResponse);
};

// 404 handler for undefined routes
export const notFoundHandler = (req, res) => {
  logger.warn('404 - Route not found', { path: req.path, method: req.method });
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: {
      contacts: '/api/v1/contacts',
      conversations: '/api/v1/conversations',
      calls: '/api/v1/calls',
      tasks: '/api/v1/tasks',
      workflows: '/api/v1/workflows',
      people: '/api/v1/people',
      calendar: '/api/v1/calendar',
      analytics: '/api/v1/analytics',
      integrations: '/api/v1/integrations'
    }
  });
};

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
