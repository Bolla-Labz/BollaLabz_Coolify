// Last Modified: 2025-11-23 17:30
/**
 * Toast Notification System
 * Wrapper around sonner toast with error handling integration
 */

import { toast as sonnerToast } from 'sonner';
import { processError, type ProcessedError } from '../errors/handler';
import type { AppError } from '../errors';

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

/**
 * Toast options
 */
export interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Show a success toast
 */
export function showSuccess(message: string, options?: ToastOptions): void {
  sonnerToast.success(message, options);
}

/**
 * Show an error toast
 */
export function showError(message: string, options?: ToastOptions): void {
  sonnerToast.error(message, options);
}

/**
 * Show a warning toast
 */
export function showWarning(message: string, options?: ToastOptions): void {
  sonnerToast.warning(message, options);
}

/**
 * Show an info toast
 */
export function showInfo(message: string, options?: ToastOptions): void {
  sonnerToast.info(message, options);
}

/**
 * Show a loading toast
 */
export function showLoading(message: string, options?: ToastOptions): string | number {
  return sonnerToast.loading(message, options);
}

/**
 * Dismiss a specific toast
 */
export function dismissToast(toastId: string | number): void {
  sonnerToast.dismiss(toastId);
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts(): void {
  sonnerToast.dismiss();
}

/**
 * Show error from Error object or unknown error
 */
export function showErrorFromException(error: unknown, options?: ToastOptions): void {
  const processed = processError(error);

  const toastOptions: ToastOptions = {
    duration: 5000,
    ...options,
  };

  // Add retry action if applicable
  if (processed.canRetry && processed.details?.retryFn) {
    toastOptions.action = {
      label: 'Retry',
      onClick: processed.details.retryFn,
    };
  }

  sonnerToast.error(processed.message, toastOptions);
}

/**
 * Show error from AppError with detailed information
 */
export function showAppError(error: AppError, options?: ToastOptions): void {
  showErrorFromException(error, options);
}

/**
 * Show a promise toast (loading → success/error)
 */
export function showPromiseToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  },
  options?: ToastOptions
): Promise<T> {
  // Sonner's toast.promise takes 2 args and returns a special object, not the promise
  sonnerToast.promise(promise, messages);
  return promise; // Return the original promise for chaining
}

/**
 * Utility to wrap async operations with toast notifications
 */
export async function withToast<T>(
  operation: () => Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error?: string | ((error: any) => string);
  },
  options?: ToastOptions
): Promise<T> {
  const toastId = showLoading(messages.loading, options);

  try {
    const result = await operation();
    dismissToast(toastId);

    const successMessage = typeof messages.success === 'function'
      ? messages.success(result)
      : messages.success;
    showSuccess(successMessage, options);

    return result;
  } catch (error) {
    dismissToast(toastId);

    if (messages.error) {
      const errorMessage = typeof messages.error === 'function'
        ? messages.error(error)
        : messages.error;
      showError(errorMessage, options);
    } else {
      showErrorFromException(error, options);
    }

    throw error;
  }
}
