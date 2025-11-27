// Last Modified: 2025-11-24 00:00
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { startSpan, logger } from '../monitoring/sentry';
import { Result, success, failure, ApiError as ApiErrorType } from './types';
import { withRetry } from './retry';
import { showError } from '@/lib/notifications/toast';

// API Error type
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

// Custom Error class that extends Error for proper error handling
// This ensures instanceof Error checks work correctly and prevents unhandled rejections
export class ApiErrorException extends Error {
  code?: string;
  status?: number;
  details?: any;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.name = 'ApiErrorException';
    this.code = apiError.code;
    this.status = apiError.status;
    this.details = apiError.details;

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiErrorException);
    }
  }
}

// Helper to get CSRF token from cookie
function getCSRFTokenFromCookie(): string | null {
  const name = 'csrfToken=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');

  for (let cookie of cookieArray) {
    cookie = cookie.trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }
  return null;
}

// Create axios instance with default config
const createApiClient = (): AxiosInstance => {
  const baseURL = import.meta.env.VITE_API_URL || 'https://bollalabz.com/api/v1';

  const client = axios.create({
    baseURL,
    timeout: 30000,
    withCredentials: true, // CRITICAL: Send httpOnly cookies with requests
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add CSRF token and start performance tracking
  client.interceptors.request.use(
    (config) => {
      // Add CSRF token from cookie to header for state-changing requests
      if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
        const csrfToken = getCSRFTokenFromCookie();
        if (csrfToken && config.headers) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }
      }

      // Add request start time for performance tracking
      (config as any)._requestStartTime = Date.now();

      return config;
    },
    (error) => {
      logger.error('API Request Error', {
        error: error.message,
        url: error.config?.url,
      });
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle errors, automatic token refresh, and performance tracking
  client.interceptors.response.use(
    (response) => {
      // Track API performance with custom span
      const config = response.config as any;
      if (config._requestStartTime) {
        const duration = Date.now() - config._requestStartTime;

        // Log performance to Sentry
        return startSpan(
          {
            op: 'http.client',
            name: `${config.method?.toUpperCase()} ${config.url}`,
          },
          (span) => {
            span.setAttribute('http.method', config.method?.toUpperCase() || 'GET');
            span.setAttribute('http.url', config.url || '');
            span.setAttribute('http.status_code', response.status);
            span.setAttribute('http.duration_ms', duration);

            if (duration > 3000) {
              logger.warn('Slow API Request', {
                method: config.method,
                url: config.url,
                duration_ms: duration,
                status: response.status,
              });
            }

            return response;
          }
        );
      }

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // Handle 401 Unauthorized - try to refresh token
      // With httpOnly cookies, the refresh token is automatically sent
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Call refresh endpoint - cookies are sent automatically
          await axios.post(
            `${baseURL}/auth/refresh`,
            {},
            { withCredentials: true }
          );

          // Refresh successful - new access token is set as httpOnly cookie
          // Retry original request (cookies will be sent automatically)
          return client(originalRequest);
        } catch (refreshError) {
          // Refresh failed - redirect to login
          // Cookies will be cleared by logout endpoint or browser
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      // Transform error for consistent handling
      const responseData = error.response?.data as any;
      const apiErrorData: ApiError = {
        message: responseData?.message || error.message || 'An unexpected error occurred',
        code: responseData?.code || error.code,
        status: error.response?.status,
        details: responseData?.details,
      };

      // Log API errors to Sentry with rich context
      logger.error('API Response Error', {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        status: error.response?.status,
        code: apiErrorData.code,
        message: apiErrorData.message,
        details: apiErrorData.details,
      });

      // Create proper Error instance using ApiErrorException class
      // This ensures instanceof Error checks work and prevents unhandled promise rejections
      const apiError = new ApiErrorException(apiErrorData);

      return Promise.reject(apiError);
    }
  );

  return client;
};

// Create and export the API client instance
export const apiClient = createApiClient();

// Helper functions for common HTTP methods
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((res) => res.data),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then((res) => res.data),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then((res) => res.data),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config).then((res) => res.data),

  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((res) => res.data),
};

// ============================================
// SAFE API WRAPPERS WITH RESULT PATTERN
// ============================================

/**
 * Handles API errors and converts them to Result failure
 * Also shows user-friendly toast notifications
 */
function handleApiError<T>(error: AxiosError): Result<T, ApiErrorType> {
  const responseData = error.response?.data as any;
  const apiError: ApiErrorType = {
    message: responseData?.message || error.message || 'An unexpected error occurred',
    status: error.response?.status,
    code: error.code,
    details: responseData,
  };

  // Show user-friendly toast notification based on error type
  if (apiError.status && apiError.status >= 500) {
    showError('Server error. Please try again later.');
  } else if (apiError.status === 404) {
    showError('Resource not found.');
  } else if (apiError.status === 401) {
    showError('Unauthorized. Please log in again.');
  } else if (apiError.status === 403) {
    showError('You don\'t have permission to perform this action.');
  } else if (apiError.status === 400) {
    showError(apiError.message);
  } else if (!apiError.status) {
    // Network error (no response)
    showError('Network error. Please check your connection.');
  } else {
    showError(apiError.message);
  }

  return failure(apiError);
}

/**
 * Safe GET request that returns Result instead of throwing
 * Automatically retries on 5xx errors
 *
 * @example
 * ```typescript
 * const result = await safeGet<User[]>('/users');
 * if (isSuccess(result)) {
 *   console.log('Users:', result.data);
 * } else {
 *   console.error('Error:', result.error.message);
 * }
 * ```
 */
export async function safeGet<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<Result<T, ApiErrorType>> {
  try {
    const response = await withRetry(() => apiClient.get<T>(url, config));
    return success(response.data);
  } catch (error) {
    return handleApiError<T>(error as AxiosError);
  }
}

/**
 * Safe POST request that returns Result instead of throwing
 * Automatically retries on 5xx errors
 */
export async function safePost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<Result<T, ApiErrorType>> {
  try {
    const response = await withRetry(() => apiClient.post<T>(url, data, config));
    return success(response.data);
  } catch (error) {
    return handleApiError<T>(error as AxiosError);
  }
}

/**
 * Safe PUT request that returns Result instead of throwing
 * Automatically retries on 5xx errors
 */
export async function safePut<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<Result<T, ApiErrorType>> {
  try {
    const response = await withRetry(() => apiClient.put<T>(url, data, config));
    return success(response.data);
  } catch (error) {
    return handleApiError<T>(error as AxiosError);
  }
}

/**
 * Safe PATCH request that returns Result instead of throwing
 * Automatically retries on 5xx errors
 */
export async function safePatch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<Result<T, ApiErrorType>> {
  try {
    const response = await withRetry(() => apiClient.patch<T>(url, data, config));
    return success(response.data);
  } catch (error) {
    return handleApiError<T>(error as AxiosError);
  }
}

/**
 * Safe DELETE request that returns Result instead of throwing
 * Automatically retries on 5xx errors
 */
export async function safeDelete<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<Result<T, ApiErrorType>> {
  try {
    const response = await withRetry(() => apiClient.delete<T>(url, config));
    return success(response.data);
  } catch (error) {
    return handleApiError<T>(error as AxiosError);
  }
}

// Export types for use in other modules
export type { AxiosInstance, AxiosRequestConfig, AxiosError };
export { isSuccess, isFailure } from './types';