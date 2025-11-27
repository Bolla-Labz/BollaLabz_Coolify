// Last Modified: 2025-11-23 17:30
/**
 * Central Type Exports
 *
 * Re-exports all type definitions for easy importing
 */

// Analytics types
export type {
  TimePeriod,
  AnalyticsSummary,
  QuickStat,
  CallVolumeData,
  AgentPerformance,
  ConversationMetrics,
  ActivityEvent,
  AnalyticsFilters
} from './analytics';
export type { DateRange as AnalyticsDateRange, CostSummary as AnalyticsCostSummary } from './analytics';

// Table types
export * from './table';

// Event/Calendar types
export * from './event';

// Note types
export * from './note';

// Task types
export * from './task';

// Financial types (with re-exports to avoid conflicts)
export type { DateRange, CostSummary } from './finance';
export * from './financial';

// People Analytics types
export * from './people-analytics';

// Backend types
export * from './backend';

// Common shared types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  loadingState: LoadingState;
}
