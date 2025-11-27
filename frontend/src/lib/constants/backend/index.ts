// Last Modified: 2025-11-23 17:30
/**
 * Application-wide constants
 * Extracted from backend to ensure consistency across frontend/backend
 *
 * Frontend-relevant constants only (backend-specific ones like database pools excluded)
 */

/**
 * Password security constants
 */
export const PASSWORD_CONSTANTS = {
  /** Minimum password length */
  MIN_LENGTH: 8,
} as const;

/**
 * Rate limiting constants
 */
export const RATE_LIMIT_CONSTANTS = {
  /** Rate limit window in milliseconds (15 minutes) */
  WINDOW_MS: 15 * 60 * 1000,
  /** Maximum requests per window for general API endpoints */
  MAX_REQUESTS: 100,
  /** Maximum requests per window for authentication endpoints */
  AUTH_MAX_REQUESTS: 5,
} as const;

/**
 * File upload constants
 */
export const FILE_UPLOAD_CONSTANTS = {
  /** Maximum file size in bytes (10MB) */
  MAX_SIZE: 10 * 1024 * 1024,
  /** Maximum file size as string for display */
  MAX_SIZE_STRING: '10MB',
} as const;

/**
 * Pagination constants
 */
export const PAGINATION_CONSTANTS = {
  /** Default page size for list endpoints */
  DEFAULT_LIMIT: 20,
  /** Default page number */
  DEFAULT_PAGE: 1,
  /** Maximum page size allowed */
  MAX_LIMIT: 100,
  /** Messages per page in conversations */
  MESSAGES_PER_PAGE: 50,
} as const;

/**
 * Cache constants (for frontend caching strategies)
 */
export const CACHE_CONSTANTS = {
  /** Short cache TTL in milliseconds (2 minutes) - for list queries */
  SHORT_TTL: 2 * 60 * 1000,
  /** Default cache TTL in milliseconds (5 minutes) */
  DEFAULT_TTL: 5 * 60 * 1000,
  /** User profile cache TTL in milliseconds (10 minutes) */
  USER_PROFILE_TTL: 10 * 60 * 1000,
  /** Agent data cache TTL in milliseconds (3 minutes) */
  AGENT_DATA_TTL: 3 * 60 * 1000,
  /** Conversation cache TTL in milliseconds (2 minutes) */
  CONVERSATION_TTL: 2 * 60 * 1000,
} as const;

/**
 * API client constants
 */
export const API_CLIENT_CONSTANTS = {
  /** Request timeout in milliseconds */
  TIMEOUT: 30000,
  /** Maximum retry attempts for failed requests */
  MAX_RETRIES: 3,
  /** Base delay for exponential backoff in milliseconds */
  RETRY_BASE_DELAY: 1000,
  /** Maximum retry delay in milliseconds */
  RETRY_MAX_DELAY: 10000,
} as const;

/**
 * WebSocket constants
 */
export const WEBSOCKET_CONSTANTS = {
  /** Connection timeout in milliseconds */
  CONNECTION_TIMEOUT: 20000,
  /** Ping interval in milliseconds */
  PING_INTERVAL: 25000,
  /** Ping timeout in milliseconds */
  PING_TIMEOUT: 5000,
} as const;

/**
 * HTTP status codes for common scenarios
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  UNAUTHORIZED: 'Unauthorized access',

  // Resource errors
  NOT_FOUND: 'Resource not found',
  ALREADY_EXISTS: 'Resource already exists',

  // Validation errors
  INVALID_INPUT: 'Invalid input provided',
  MISSING_REQUIRED_FIELD: 'Required field is missing',

  // Server errors
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',

  // Rate limiting
  TOO_MANY_REQUESTS: 'Too many requests, please try again later',
} as const;
