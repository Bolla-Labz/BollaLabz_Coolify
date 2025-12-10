// 08 December 2025 06 45 30

/**
 * Core API Types
 */

// Generic API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ApiMetadata;
  correlationId?: string;
}

// API Error structure
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
  timestamp: string;
}

// API Metadata
export interface ApiMetadata {
  timestamp: string;
  version: string;
  requestId: string;
  duration?: number;
  // Allow additional custom properties for route-specific metadata
  [key: string]: unknown;
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  totalPages: number;
}

// Pagination request parameters
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Search parameters
export interface SearchParams extends PaginationParams {
  q?: string;
  filters?: Record<string, unknown>;
  [key: string]: unknown;
}

// Batch operation response
export interface BatchOperationResponse {
  successful: number;
  failed: number;
  errors?: Array<{
    index: number;
    error: ApiError;
  }>;
}

// File upload response
export interface FileUploadResponse {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

// Webhook event
export interface WebhookEvent {
  id: string;
  type: string;
  payload: unknown;
  timestamp: string;
  signature: string;
}

// Rate limit info
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  services: Array<{
    name: string;
    status: 'up' | 'down';
    responseTime?: number;
  }>;
  timestamp: string;
}