// Last Modified: 2025-11-23 17:30
/**
 * Frontend-specific error classes
 * These handle errors unique to the client-side application
 */

import { AppError } from './base';

/**
 * Network Errors
 * Handle fetch failures, connection issues, timeouts
 */
export class NetworkError extends AppError {
  constructor(message = 'Network error occurred. Please check your internet connection and try again.', details?: any) {
    super(message, 0, true, details);
    this.name = 'NetworkError';
  }
}

export class FetchError extends NetworkError {
  constructor(url: string, statusCode?: number, statusText?: string) {
    const message = statusCode
      ? `Failed to fetch data from ${url}. Server returned ${statusCode} ${statusText}.`
      : `Failed to fetch data from ${url}. Please try again.`;
    super(message, { url, statusCode, statusText });
    this.name = 'FetchError';
  }
}

export class TimeoutError extends NetworkError {
  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms. The server is taking too long to respond.`, { timeout });
    this.name = 'TimeoutError';
  }
}

export class ConnectionError extends NetworkError {
  constructor() {
    super('Unable to connect to the server. Please check your internet connection.');
    this.name = 'ConnectionError';
  }
}

/**
 * Form Errors
 * Handle client-side form validation and submission errors
 */
export class FormError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, details);
    this.name = 'FormError';
  }
}

export class FormValidationError extends FormError {
  constructor(fieldErrors: Record<string, string[]>) {
    const errorCount = Object.keys(fieldErrors).length;
    super(
      `Form validation failed. Please correct ${errorCount} error${errorCount === 1 ? '' : 's'} and try again.`,
      { fieldErrors }
    );
    this.name = 'FormValidationError';
  }
}

export class FormSubmissionError extends FormError {
  constructor(message = 'Failed to submit the form. Please try again.') {
    super(message);
    this.name = 'FormSubmissionError';
  }
}

/**
 * State Management Errors
 * Handle errors in Zustand stores or state updates
 */
export class StateError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, true, details);
    this.name = 'StateError';
  }
}

export class StoreInitializationError extends StateError {
  constructor(storeName: string) {
    super(`Failed to initialize ${storeName} store. Please refresh the page.`, { storeName });
    this.name = 'StoreInitializationError';
  }
}

export class StateUpdateError extends StateError {
  constructor(storeName: string, action: string) {
    super(`Failed to update ${storeName} store (action: ${action}). Please try again.`, { storeName, action });
    this.name = 'StateUpdateError';
  }
}

/**
 * Component Errors
 * Handle errors in React components
 */
export class ComponentError extends AppError {
  constructor(componentName: string, message: string, details?: any) {
    super(`Error in ${componentName}: ${message}`, 500, true, { componentName, ...details });
    this.name = 'ComponentError';
  }
}

export class RenderError extends ComponentError {
  constructor(componentName: string, originalError: Error) {
    super(componentName, 'Component failed to render', { originalError: originalError.message });
    this.name = 'RenderError';
  }
}

/**
 * Local Storage Errors
 */
export class StorageError extends AppError {
  constructor(message = 'Failed to access browser storage.', details?: any) {
    super(message, 500, true, details);
    this.name = 'StorageError';
  }
}

export class QuotaExceededError extends StorageError {
  constructor() {
    super('Browser storage quota exceeded. Please clear some space and try again.');
    this.name = 'QuotaExceededError';
  }
}

/**
 * WebSocket Errors
 */
export class WebSocketError extends AppError {
  constructor(message = 'WebSocket connection error.', details?: any) {
    super(message, 0, true, details);
    this.name = 'WebSocketError';
  }
}

export class WebSocketConnectionError extends WebSocketError {
  constructor() {
    super('Failed to establish WebSocket connection. Real-time updates may not work.');
    this.name = 'WebSocketConnectionError';
  }
}

export class WebSocketDisconnectedError extends WebSocketError {
  constructor() {
    super('WebSocket connection lost. Attempting to reconnect...');
    this.name = 'WebSocketDisconnectedError';
  }
}
