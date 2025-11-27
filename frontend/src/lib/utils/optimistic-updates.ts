// Last Modified: 2025-11-24 13:00
/**
 * Optimistic Update Utilities
 *
 * Helpers for implementing optimistic updates in Zustand stores
 * with automatic rollback on error.
 *
 * Pattern:
 * 1. Apply optimistic update to local state
 * 2. Make API call
 * 3. On success: Update state with server response
 * 4. On error: Rollback to previous state & show error
 */

import { toast } from 'react-hot-toast';
import { logger } from '@/lib/monitoring/sentry';

// ============================================
// TYPES
// ============================================

interface OptimisticUpdateConfig<T, R = T> {
  /**
   * The optimistic update to apply immediately
   */
  optimisticUpdate: (state: T) => T;

  /**
   * The API call to execute
   */
  apiCall: () => Promise<R>;

  /**
   * Update state with API response
   */
  onSuccess: (state: T, response: R) => T;

  /**
   * Optional: Rollback transformation
   * If not provided, reverts to snapshot
   */
  onError?: (state: T, error: Error) => T;

  /**
   * Optional: Success message
   */
  successMessage?: string;

  /**
   * Optional: Error message
   */
  errorMessage?: string;

  /**
   * Optional: Whether to show toast notifications
   * @default true
   */
  showToast?: boolean;

  /**
   * Optional: Log errors to Sentry
   * @default true
   */
  logErrors?: boolean;
}

interface OptimisticUpdateResult<R> {
  success: boolean;
  data?: R;
  error?: Error;
}

// ============================================
// OPTIMISTIC UPDATE EXECUTOR
// ============================================

/**
 * Execute an optimistic update with automatic rollback
 *
 * @param setState - Zustand setState function
 * @param getState - Zustand getState function
 * @param config - Configuration object
 *
 * @example
 * ```ts
 * // In Zustand store
 * addContact: async (contact) => {
 *   await executeOptimisticUpdate(set, get, {
 *     optimisticUpdate: (state) => ({
 *       ...state,
 *       contacts: [...state.contacts, { ...contact, id: 'temp-id' }],
 *     }),
 *     apiCall: () => contactsService.create(contact),
 *     onSuccess: (state, response) => ({
 *       ...state,
 *       contacts: state.contacts.map(c =>
 *         c.id === 'temp-id' ? response : c
 *       ),
 *     }),
 *     successMessage: 'Contact added',
 *     errorMessage: 'Failed to add contact',
 *   });
 * }
 * ```
 */
export async function executeOptimisticUpdate<T, R = T>(
  setState: (fn: (state: T) => T) => void,
  getState: () => T,
  config: OptimisticUpdateConfig<T, R>
): Promise<OptimisticUpdateResult<R>> {
  const {
    optimisticUpdate,
    apiCall,
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    showToast = true,
    logErrors = true,
  } = config;

  // Take snapshot of current state for rollback
  const snapshot = getState();

  try {
    // Apply optimistic update immediately
    setState(optimisticUpdate);

    // Execute API call
    const response = await apiCall();

    // Update with server response
    setState((state) => onSuccess(state, response));

    // Show success toast
    if (showToast && successMessage) {
      toast.success(successMessage);
    }

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    // Rollback to snapshot or use custom rollback
    if (onError) {
      setState((state) => onError(state, err));
    } else {
      setState(() => snapshot);
    }

    // Show error toast
    if (showToast) {
      const message = errorMessage || err.message || 'Operation failed';
      toast.error(message);
    }

    // Log to Sentry
    if (logErrors) {
      logger.error('Optimistic update failed', {
        error: err.message,
        errorMessage,
      });
    }

    return {
      success: false,
      error: err,
    };
  }
}

// ============================================
// COMMON OPTIMISTIC UPDATE PATTERNS
// ============================================

/**
 * Optimistic add item to array
 */
export function optimisticAdd<T extends { id: string | number }>(
  items: T[],
  newItem: T,
  tempId: string = `temp-${Date.now()}`
): T[] {
  return [...items, { ...newItem, id: tempId as any }];
}

/**
 * Optimistic update item in array
 */
export function optimisticUpdate<T extends { id: string | number }>(
  items: T[],
  id: string | number,
  updates: Partial<T>
): T[] {
  return items.map((item) => (item.id === id ? { ...item, ...updates } : item));
}

/**
 * Optimistic delete item from array
 */
export function optimisticDelete<T extends { id: string | number }>(
  items: T[],
  id: string | number
): T[] {
  return items.filter((item) => item.id !== id);
}

/**
 * Replace temp ID with real ID from server
 */
export function replaceTempId<T extends { id: string | number }>(
  items: T[],
  tempId: string,
  serverResponse: T
): T[] {
  return items.map((item) =>
    item.id === tempId ? serverResponse : item
  );
}

// ============================================
// DEBOUNCED OPTIMISTIC UPDATES
// ============================================

interface DebouncedUpdateConfig<T> {
  delay: number;
  maxWait?: number;
}

/**
 * Create a debounced optimistic update function
 * Useful for search inputs, auto-save, etc.
 *
 * @example
 * ```ts
 * const debouncedSearch = createDebouncedOptimisticUpdate(
 *   set,
 *   get,
 *   { delay: 300 },
 *   (query) => ({
 *     optimisticUpdate: (state) => ({ ...state, searchQuery: query }),
 *     apiCall: () => api.search(query),
 *     onSuccess: (state, results) => ({ ...state, searchResults: results }),
 *   })
 * );
 *
 * // Use in component
 * debouncedSearch('search term');
 * ```
 */
export function createDebouncedOptimisticUpdate<T, R, Args extends any[]>(
  setState: (fn: (state: T) => T) => void,
  getState: () => T,
  debounceConfig: DebouncedUpdateConfig<T>,
  configFactory: (...args: Args) => OptimisticUpdateConfig<T, R>
): (...args: Args) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;

  return (...args: Args) => {
    const now = Date.now();
    const { delay, maxWait } = debounceConfig;

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Force execution if maxWait exceeded
    const shouldForceExecution = maxWait && now - lastCallTime >= maxWait;

    if (shouldForceExecution) {
      lastCallTime = now;
      const config = configFactory(...args);
      executeOptimisticUpdate(setState, getState, config);
    } else {
      // Schedule execution
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        const config = configFactory(...args);
        executeOptimisticUpdate(setState, getState, config);
      }, delay);
    }
  };
}

// ============================================
// OPTIMISTIC UPDATE QUEUE
// ============================================

/**
 * Queue for managing multiple optimistic updates
 * Ensures updates are applied in order
 */
export class OptimisticUpdateQueue<T> {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  constructor(
    private setState: (fn: (state: T) => T) => void,
    private getState: () => T
  ) {}

  /**
   * Add update to queue
   */
  async enqueue<R>(config: OptimisticUpdateConfig<T, R>): Promise<OptimisticUpdateResult<R>> {
    return new Promise((resolve) => {
      this.queue.push(async () => {
        const result = await executeOptimisticUpdate(this.setState, this.getState, config);
        resolve(result);
      });

      this.processQueue();
    });
  }

  /**
   * Process queued updates
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const update = this.queue.shift();
      if (update) {
        await update();
      }
    }

    this.isProcessing = false;
  }

  /**
   * Clear all pending updates
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Get queue size
   */
  get size(): number {
    return this.queue.length;
  }
}

// ============================================
// EXPORTS
// ============================================

export type {
  OptimisticUpdateConfig,
  OptimisticUpdateResult,
  DebouncedUpdateConfig,
};
