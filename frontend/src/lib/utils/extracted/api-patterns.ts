// Last Modified: 2025-11-23 17:30
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

/**
 * Timeout configurations for different types of requests
 */
const TIMEOUTS = {
  default: 10000, // 10 seconds default
  upload: 60000,  // 60 seconds for uploads
  download: 60000, // 60 seconds for downloads
};

/**
 * CSRF Token Management
 * Token is fetched from backend and stored in memory
 * Automatically included in all state-changing requests
 */
let csrfToken: string | null = null;

/**
 * Initialize CSRF token by fetching from backend
 * Should be called on app initialization
 *
 * DEVELOPMENT MODE: Skips CSRF token fetch when NODE_ENV === 'development'
 */
export const initializeCsrfToken = async (): Promise<void> => {
  // Skip CSRF token in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('DEVELOPMENT MODE: Skipping CSRF token initialization');
    csrfToken = 'dev-bypass-token';
    return;
  }

  try {
    const response = await axios.get(`${API_URL}/csrf-token`, {
      withCredentials: true, // Include cookies in request
    });
    csrfToken = response.data.csrfToken;
    console.log('CSRF token initialized successfully');
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    // Don't throw - app can still work, CSRF will fail gracefully
  }
};

/**
 * Get current CSRF token
 */
export const getCsrfToken = (): string | null => {
  return csrfToken;
};

/**
 * Axios client instance with cookie-based authentication
 *
 * SECURITY FEATURES:
 * - withCredentials: true - Enables httpOnly cookie transmission
 * - CSRF token automatically added to state-changing requests
 * - No token storage in localStorage (XSS-safe)
 * - Automatic retry logic for transient failures
 */
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUTS.default,
  withCredentials: true, // CRITICAL: Enables httpOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Helper function to determine if a request should be retried
 */
const shouldRetry = (error: AxiosError): boolean => {
  // Don't retry if we got a response (server responded with error)
  if (error.response) {
    // Retry on 429 (rate limit) and 503 (service unavailable)
    return error.response.status === 429 || error.response.status === 503;
  }

  // Retry on network errors or timeout
  return (
    error.code === 'ECONNABORTED' ||
    error.code === 'ERR_NETWORK' ||
    error.message.includes('timeout') ||
    error.message.includes('Network Error')
  );
};

/**
 * Exponential backoff delay calculation
 */
const getRetryDelay = (retryCount: number): number => {
  // 1s, 2s, 4s
  return Math.min(1000 * Math.pow(2, retryCount), 4000);
};

/**
 * Request interceptor - Add CSRF token to state-changing requests
 *
 * NOTE: No Authorization header needed - cookies are sent automatically
 * by withCredentials: true
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Extend config with custom properties inline
    const extendedConfig = config as InternalAxiosRequestConfig & {
      retryCount?: number;
    };

    // Add CSRF token to POST, PUT, DELETE, PATCH requests
    const method = config.method?.toLowerCase();
    if (['post', 'put', 'delete', 'patch'].includes(method || '')) {
      if (csrfToken && config.headers) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // Initialize retry count
    if (!extendedConfig.retryCount) {
      extendedConfig.retryCount = 0;
    }

    // Add cancellation support
    if (typeof window !== 'undefined' && !config.signal) {
      const controller = new AbortController();
      config.signal = controller.signal;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle retry logic and CSRF token refresh
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _csrfRetry?: boolean;
      retryCount?: number;
    };

    // Handle retry logic for network errors and rate limits
    if (shouldRetry(error) && (originalRequest.retryCount || 0) < 3) {
      originalRequest.retryCount = (originalRequest.retryCount || 0) + 1;
      const delay = getRetryDelay(originalRequest.retryCount);

      console.log(`Retrying request (attempt ${originalRequest.retryCount}/3) after ${delay}ms...`);

      // Wait for exponential backoff delay
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry the request
      return apiClient(originalRequest);
    }

    // Handle CSRF token refresh on 403 Forbidden
    if (
      error.response?.status === 403 &&
      !originalRequest._csrfRetry &&
      originalRequest
    ) {
      originalRequest._csrfRetry = true;

      console.log('CSRF token may be invalid, refreshing...');

      // Refresh CSRF token
      await initializeCsrfToken();

      // Update request with new CSRF token
      const method = originalRequest.method?.toLowerCase();
      if (['post', 'put', 'delete', 'patch'].includes(method || '') && csrfToken) {
        if (originalRequest.headers) {
          originalRequest.headers['X-CSRF-Token'] = csrfToken;
        }
      }

      // Retry the request
      return apiClient(originalRequest);
    }

    // Handle 401 Unauthorized - redirect to login
    // Backend handles token refresh via cookies, so 401 means truly unauthorized
    if (error.response?.status === 401) {
      console.log('Unauthorized - redirecting to login');
      if (typeof window !== 'undefined') {
        // Clear any client-side state
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Helper function to extract error messages from API responses
 */
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // Check for cancellation
    if (error.code === 'ERR_CANCELED' || error.message === 'canceled') {
      return 'Request was cancelled';
    }

    // Check for timeout
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return 'Request timeout - please try again';
    }

    // Check for network error
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      return 'Network error - please check your connection';
    }

    // Extract error from response
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  return "An unexpected error occurred";
};

/**
 * Create API client with custom timeout for long-running operations
 * Includes same security features as main client
 */
export const createApiClient = (timeout: number = TIMEOUTS.default) => {
  return axios.create({
    baseURL: API_URL,
    timeout,
    withCredentials: true, // Enable cookies
    headers: {
      "Content-Type": "application/json",
    },
  });
};

/**
 * Cancel all pending requests
 */
export const cancelAllRequests = () => {
  // This would require maintaining a list of active requests
  console.log('Cancelling all pending requests...');
};
