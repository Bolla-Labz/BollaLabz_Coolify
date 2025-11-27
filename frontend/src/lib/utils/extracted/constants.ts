// Last Modified: 2025-11-23 17:30
/**
 * Frontend application constants
 * Extract all magic numbers and strings to named constants
 */

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
  /** HTTP status codes that should trigger a retry */
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504],
} as const;

/**
 * Pagination constants
 */
export const PAGINATION_CONSTANTS = {
  /** Default items per page */
  DEFAULT_PAGE_SIZE: 20,
  /** Page size options for user selection */
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

/**
 * UI Constants
 */
export const UI_CONSTANTS = {
  /** Debounce delay for search inputs in milliseconds */
  SEARCH_DEBOUNCE_MS: 300,
  /** Toast notification duration in milliseconds */
  TOAST_DURATION: 5000,
  /** Loading spinner minimum display time in milliseconds */
  MIN_LOADING_TIME: 500,
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_PREFERENCES: 'userPreferences',
  THEME: 'theme',
} as const;

/**
 * Route paths
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  AGENTS: '/agents',
  CONVERSATIONS: '/conversations',
  SETTINGS: '/settings',
} as const;
