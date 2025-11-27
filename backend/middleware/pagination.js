// Last Modified: 2025-11-23 17:18
/**
 * Pagination Middleware
 * Enforces consistent pagination limits across all paginated endpoints
 * Prevents excessive data retrieval and performance issues
 */

import logger from '../config/logger.js';

// Pagination constraints
const MAX_LIMIT = 100;      // Maximum records per page
const DEFAULT_LIMIT = 20;   // Default records per page
const DEFAULT_OFFSET = 0;   // Default offset (starting record)

/**
 * Pagination middleware
 * Parses and validates pagination parameters (limit, offset, page)
 * Adds normalized pagination to req.pagination
 */
export function paginationMiddleware(req, res, next) {
  try {
    // Parse pagination parameters
    let limit = parseInt(req.query.limit) || DEFAULT_LIMIT;
    let offset = parseInt(req.query.offset) || DEFAULT_OFFSET;
    let page = parseInt(req.query.page);

    // Handle page-based pagination (convert to offset)
    if (page && !isNaN(page) && page > 0) {
      offset = (page - 1) * limit;
    }

    // Enforce maximum limit
    if (limit > MAX_LIMIT) {
      logger.warn('Pagination limit exceeded, capping to maximum', {
        requestedLimit: limit,
        maxLimit: MAX_LIMIT,
        path: req.path,
        userId: req.user?.userId
      });
      limit = MAX_LIMIT;
    }

    // Enforce positive values
    if (limit < 1) {
      limit = DEFAULT_LIMIT;
    }
    if (offset < 0) {
      offset = 0;
    }

    // Add normalized pagination to request
    req.pagination = {
      limit,
      offset,
      page: Math.floor(offset / limit) + 1,  // Calculate current page
      maxLimit: MAX_LIMIT
    };

    logger.debug('Pagination applied', {
      limit: req.pagination.limit,
      offset: req.pagination.offset,
      page: req.pagination.page,
      path: req.path
    });

    next();
  } catch (error) {
    logger.error('Pagination middleware error', {
      error: error.message,
      stack: error.stack,
      query: req.query
    });

    // Fail with default pagination
    req.pagination = {
      limit: DEFAULT_LIMIT,
      offset: DEFAULT_OFFSET,
      page: 1,
      maxLimit: MAX_LIMIT
    };
    next();
  }
}

/**
 * Helper function to build paginated response
 * @param {Array} data - The data array
 * @param {number} total - Total count of records
 * @param {object} pagination - Pagination object from req.pagination
 * @returns {object} - Standardized paginated response
 */
export function buildPaginatedResponse(data, total, pagination) {
  const { limit, offset, page } = pagination;
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    data,
    pagination: {
      total,
      count: data.length,
      page,
      limit,
      offset,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    }
  };
}

/**
 * Validation function for pagination parameters
 * Returns errors if validation fails
 */
export function validatePaginationParams(limit, offset) {
  const errors = [];

  if (limit !== undefined) {
    if (isNaN(limit) || limit < 1) {
      errors.push('Limit must be a positive integer');
    }
    if (limit > MAX_LIMIT) {
      errors.push(`Limit cannot exceed ${MAX_LIMIT}`);
    }
  }

  if (offset !== undefined) {
    if (isNaN(offset) || offset < 0) {
      errors.push('Offset must be a non-negative integer');
    }
  }

  return errors;
}

/**
 * Express error handler for pagination errors
 */
export function handlePaginationError(error, req, res, next) {
  if (error.name === 'PaginationError') {
    return res.status(400).json({
      success: false,
      error: 'Pagination error',
      message: error.message
    });
  }
  next(error);
}

// Export constants for use in routes
export const PAGINATION_CONSTANTS = {
  MAX_LIMIT,
  DEFAULT_LIMIT,
  DEFAULT_OFFSET
};

export default paginationMiddleware;
