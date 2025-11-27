// Last Modified: 2025-11-24 00:00
/**
 * Result type for safe error handling without exceptions
 * Inspired by Rust's Result<T, E> pattern for explicit error handling
 *
 * This pattern allows functions to return either success or failure without throwing exceptions,
 * making error handling more explicit and preventing unhandled promise rejections.
 */

/**
 * Result type representing either success with data or failure with error
 */
export type Result<T, E = ApiError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * API Error interface with structured error information
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

/**
 * Type guard to check if a Result is successful
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Type guard to check if a Result is a failure
 */
export function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return result.success === false;
}

/**
 * Helper to create a success result
 */
export function success<T>(data: T): Result<T, ApiError> {
  return { success: true, data };
}

/**
 * Helper to create a failure result
 */
export function failure<T>(error: ApiError): Result<T, ApiError> {
  return { success: false, error };
}

/**
 * Helper to unwrap a Result or throw if it's an error
 * Use this only when you're certain the operation succeeded
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isSuccess(result)) {
    return result.data;
  }
  throw new Error('Attempted to unwrap a failure result');
}

/**
 * Helper to get the value or a default if it's an error
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isSuccess(result)) {
    return result.data;
  }
  return defaultValue;
}

/**
 * Helper to map over a successful result
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (isSuccess(result)) {
    return { success: true, data: fn(result.data) };
  }
  return result;
}

/**
 * Helper to map over an error result
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (isFailure(result)) {
    return { success: false, error: fn(result.error) };
  }
  return result;
}
