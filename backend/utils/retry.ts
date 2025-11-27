// Last Modified: 2025-11-23 17:30
/**
 * Retry Logic with Exponential Backoff
 * For handling failed API calls gracefully
 */

import { RetryConfig } from '../types';

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  retryCount = 0
): Promise<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  try {
    return await fn();
  } catch (error: any) {
    // Don't retry if max retries reached
    if (retryCount >= fullConfig.maxRetries) {
      throw error;
    }

    // Don't retry non-retryable errors (4xx client errors)
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      throw error;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      fullConfig.initialDelay * Math.pow(fullConfig.backoffMultiplier, retryCount),
      fullConfig.maxDelay
    );

    console.log(
      `Retry attempt ${retryCount + 1}/${fullConfig.maxRetries} after ${delay}ms`,
      error.message
    );

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Retry
    return retryWithBackoff(fn, config, retryCount + 1);
  }
}

export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // 5xx server errors
  if (error.statusCode && error.statusCode >= 500) {
    return true;
  }

  // Rate limit errors
  if (error.statusCode === 429) {
    return true;
  }

  return false;
}
