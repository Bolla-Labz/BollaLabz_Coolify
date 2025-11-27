// Last Modified: 2025-11-23 17:30
/**
 * Store Index
 *
 * Central export point for all Zustand stores.
 * Provides organized imports for state management across the application.
 */

// Import stores for use within this module
import { useAuthStore } from '../authStore';
import { useConversationsStore } from '../conversationsStore';
import { useDashboardStore } from './dashboard';
import { useFinanceStore } from './finance';
import { useScheduleStore } from './schedule';
import { useTasksStore } from './tasks';
import { useNotesStore } from './notes';
import { usePeopleStore } from './people';
import { useWebhooksStore } from './webhooks';
import { useDataStore } from './data';

// ============================================================================
// Core Application Stores
// ============================================================================

// Authentication Store
export { useAuthStore } from '../authStore';

// UI Store
export { useUIStore } from '../uiStore';

// ============================================================================
// Entity Management Stores
// ============================================================================

// Conversations Store
export { useConversationsStore } from '../conversationsStore';

// ============================================================================
// Feature-Specific Stores
// ============================================================================

// Dashboard Store - Analytics and Metrics
export { useDashboardStore } from './dashboard';
export type {
  AnalyticsSummary,
  QuickStat,
  CallVolumeData,
  AgentPerformance,
  ConversationMetrics,
  CostSummary as DashboardCostSummary,
  ActivityEvent,
  AnalyticsFilters,
  TimePeriod,
  DateRange,
} from '@/types/analytics';

// Finance Store - Cost Tracking and Budgets
export { useFinanceStore } from './finance';
export type {
  CostEntry,
  CostSummary,
  CostBreakdown,
  SpendingTrendDataPoint,
  BudgetAlert,
  BudgetThreshold,
  ResourceCostStats,
  MonthlyBudget,
  ResourceType,
  BudgetStatus,
} from '@/types/finance';

// Schedule Store - Calendar and Events
export { useScheduleStore } from './schedule';
export type {
  CalendarEvent,
  EventType,
  EventStatus,
  EventReminder,
  CreateEventInput,
  UpdateEventInput,
  CalendarFilters,
  DaySchedule,
  WeekSchedule,
} from '@/types/event';

// Tasks Store - Task Management
export { useTasksStore } from './tasks';
export type {
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  TaskStats,
} from '@/types/task';

// Notes Store - Note Taking
export { useNotesStore } from './notes';
export type {
  Note,
  NoteColor,
  NoteAttachment,
  CreateNoteInput,
  UpdateNoteInput,
  NoteFilters,
  NoteFolder,
} from '@/types/note';

// People Store - Contacts and Relationships
export { usePeopleStore } from './people';
export type {
  Person,
  Interaction,
  CreatePersonInput,
  UpdatePersonInput,
  PeopleFilters,
} from './people';

// Webhooks Store - Webhook Management
export { useWebhooksStore } from './webhooks';
export type {
  WebhookConfig,
  WebhookExecution,
  WebhookStats,
  WebhookFilters,
} from './webhooks';

// ============================================================================
// Generic Stores
// ============================================================================

// Data Store - Generic Table State Management
export { createDataStore, useDataStore } from './data';
export type {
  SortConfig,
  SortDirection,
  PaginationConfig,
  FilterConfig,
} from '@/types/table';

// ============================================================================
// Store Utilities
// ============================================================================

/**
 * Helper function to reset all stores
 * Useful for logout or testing scenarios
 */
export const resetAllStores = async (): Promise<void> => {
  // Import stores dynamically to avoid circular dependencies
  const { useAuthStore } = await import('../authStore');
  const { useConversationsStore } = await import('../conversationsStore');
  const { useDashboardStore } = await import('./dashboard');
  const { useFinanceStore } = await import('./finance');
  const { useScheduleStore } = await import('./schedule');
  const { useTasksStore } = await import('./tasks');
  const { useNotesStore } = await import('./notes');
  const { usePeopleStore } = await import('./people');
  const { useWebhooksStore } = await import('./webhooks');
  const { useDataStore } = await import('./data');
  const { useUIStore } = await import('../uiStore');

  // Reset all stores (auth should be done through logout)
  // useConversationsStore.getState().reset?.(); // ConversationsStore doesn't have reset method
  useDashboardStore.getState().reset();
  useFinanceStore.getState().reset();
  useScheduleStore.getState().reset();
  useTasksStore.getState().reset();
  useNotesStore.getState().reset();
  usePeopleStore.getState().reset();
  useWebhooksStore.getState().reset();
  useDataStore.getState().reset();
};

/**
 * Helper function to check if any store is loading
 * Useful for global loading indicators
 */
export const useIsAnyStoreLoading = (): boolean => {
  const authLoading = useAuthStore((state) => state.isLoading);
  const conversationsLoading = useConversationsStore((state) => state.isLoading);
  const dashboardLoading = useDashboardStore((state) => state.isLoading);
  const financeLoading = useFinanceStore((state) => state.isLoading);
  const scheduleLoading = useScheduleStore((state) => state.isLoading);
  const tasksLoading = useTasksStore((state) => state.isLoading);
  const notesLoading = useNotesStore((state) => state.isLoading);
  const peopleLoading = usePeopleStore((state) => state.isLoading);
  const webhooksLoading = useWebhooksStore((state) => state.isLoading);

  return (
    authLoading ||
    conversationsLoading ||
    dashboardLoading ||
    financeLoading ||
    scheduleLoading ||
    tasksLoading ||
    notesLoading ||
    peopleLoading ||
    webhooksLoading
  );
};

/**
 * Helper function to get all store errors
 * Useful for global error handling
 */
export const useAllStoreErrors = (): string[] => {
  const errors: string[] = [];

  // AuthStore doesn't have error property - skip
  // const authError = useAuthStore((state) => state.error);
  const conversationsError = useConversationsStore((state) => state.error);
  const dashboardError = useDashboardStore((state) => state.error);
  const financeError = useFinanceStore((state) => state.error);
  const scheduleError = useScheduleStore((state) => state.error);
  const tasksError = useTasksStore((state) => state.error);
  const notesError = useNotesStore((state) => state.error);
  const peopleError = usePeopleStore((state) => state.error);
  const webhooksError = useWebhooksStore((state) => state.error);

  // if (authError) errors.push(authError);
  if (conversationsError) errors.push(conversationsError);
  if (dashboardError) errors.push(dashboardError);
  if (financeError) errors.push(financeError);
  if (scheduleError) errors.push(scheduleError);
  if (tasksError) errors.push(tasksError);
  if (notesError) errors.push(notesError);
  if (peopleError) errors.push(peopleError);
  if (webhooksError) errors.push(webhooksError);

  return errors;
};
