/**
 * Middleware Index
 * Central export for all API middleware
 */

// Authentication middleware
export { requireAuth, optionalAuth } from "./auth";

// Rate limiting middleware
export {
  rateLimiter,
  apiRateLimiter,
  authRateLimiter,
  webhookRateLimiter,
  searchRateLimiter,
  uploadRateLimiter,
  strictRateLimiter,
  type RateLimitConfig,
} from "./rate-limiter";

// Validation middleware
export {
  validateBody,
  validateQuery,
  validateParams,
  validateRequest,
  uuidParamSchema,
  paginationSchema,
  createSortSchema,
  type ValidatedBody,
  type ValidatedQuery,
  type ValidatedParams,
} from "./validation";
