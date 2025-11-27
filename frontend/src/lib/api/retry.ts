// Last Modified: 2025-11-24 00:00
/**
 * Retry Logic Utility for API Calls
 * Provides automatic retry with exponential backoff for transient failures
 */

import { AxiosError, AxiosResponse } from 'axios';
import { logger } from '../monitoring/sentry';

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (including initial attempt) */
  maxAttempts: number;
  /** Initial delay in milliseconds before first retry */
  delayMs: number;
  /** Multiplier for exponential backoff (e.g., 2 = double delay each time) */
  backoffMultiplier: number;
  /** HTTP status codes that should trigger a retry */
  retryableStatuses: number[];
}

/**
 * Default retry configuration
 * - 3 total attempts (1 initial + 2 retries)
 * - 1 second initial delay
 * - Exponential backoff with 2x multiplier (1s, 2s, 4s)
 * - Retries on common transient errors (timeout, rate limit, server errors)
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  retryableStatuses: [
    408, // Request Timeout
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
  ],
};

/**
 * Executes an async operation with automatic retry logic
 *
 * @param fn - The async function to execute (should return AxiosResponse)
 * @param config - Optional retry configuration (merged with defaults)
 * @returns Promise resolving to the AxiosResponse on success
 * @throws AxiosError if all retry attempts are exhausted
 *
 * @example
 * ```typescript
 * const response = await withRetry(
 *   () => axios.get('/api/users'),
 *   { maxAttempts: 5, delayMs: 2000 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<AxiosResponse<T>>,
  config: Partial<RetryConfig> = {}
): Promise<AxiosResponse<T>> {
  const retryConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: AxiosError | undefined;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      // Execute the function
      const response = await fn();

      // Success! Log if this was a retry
      if (attempt > 1) {
        logger.info('[API Retry] Request succeeded after retry', {
          attempt,
          maxAttempts: retryConfig.maxAttempts,
          url: response.config?.url,
          method: response.config?.method?.toUpperCase(),
        });
      }

      return response;
    } catch (error) {
      lastError = error as AxiosError;

      // Determine if we should retry this error
      const shouldRetry = isRetryableError(lastError, retryConfig);

      // Don't retry on last attempt
      const isLastAttempt = attempt === retryConfig.maxAttempts;

      if (!shouldRetry || isLastAttempt) {
        // Log final failure
        logger.error('[API Retry] Request failed, no more retries', {
          attempt,
          maxAttempts: retryConfig.maxAttempts,
          shouldRetry,
          isLastAttempt,
          status: lastError.response?.status,
          url: lastError.config?.url,
          method: lastError.config?.method?.toUpperCase(),
          message: lastError.message,
        });

        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = retryConfig.delayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1);

      // Log retry attempt
      logger.warn('[API Retry] Request failed, will retry', {
        attempt,
        maxAttempts: retryConfig.maxAttempts,
        retryAfterMs: delay,
        status: lastError.response?.status,
        url: lastError.config?.url,
        method: lastError.config?.method?.toUpperCase(),
        message: lastError.message,
      });

      console.log(
        `[API Retry] Attempt ${attempt}/${retryConfig.maxAttempts} failed. Retrying in ${delay}ms...`,
        {
          status: lastError.response?.status,
          url: lastError.config?.url,
          message: lastError.message,
        }
      );

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached due to the throw in the loop
  throw lastError;
}

/**
 * Determines if an error is retryable based on configuration
 */
function isRetryableError(error: AxiosError, config: RetryConfig): boolean {
  // Network errors (no response) are retryable
  if (!error.response) {
    return true;
  }

  // Check if status code is in retryable list
  const status = error.response.status;
  return config.retryableStatuses.includes(status);
}

/**
 * Sleep utility for introducing delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a retry config for a specific scenario
 */
export function createRetryConfig(overrides: Partial<RetryConfig>): RetryConfig {
  return { ...DEFAULT_RETRY_CONFIG, ...overrides };
}

/**
 * Predefined retry configs for common scenarios
 */
export const RetryPresets = {
  /** Fast retry with minimal backoff (for low-latency operations) */
  fast: createRetryConfig({
    maxAttempts: 2,
    delayMs: 500,
    backoffMultiplier: 1.5,
  }),

  /** Standard retry with balanced backoff */
  standard: DEFAULT_RETRY_CONFIG,

  /** Aggressive retry for critical operations */
  aggressive: createRetryConfig({
    maxAttempts: 5,
    delayMs: 2000,
    backoffMultiplier: 2,
  }),

  /** Patient retry for operations that can wait */
  patient: createRetryConfig({
    maxAttempts: 3,
    delayMs: 3000,
    backoffMultiplier: 3,
  }),
} as const;
