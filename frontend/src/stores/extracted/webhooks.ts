// Last Modified: 2025-11-23 17:30
/**
 * Webhooks Store
 *
 * Manages webhook configurations and execution tracking including:
 * - Webhook registration and management
 * - Execution logs and history
 * - Trigger configurations
 * - Payload inspection
 * - Success/failure tracking
 */

import { create } from 'zustand';
import { webhooksAPI } from '@/lib/api/store-adapter';

export type WebhookExecutionStatus = 'success' | 'error' | 'waiting' | 'running' | 'new' | 'SUCCESS' | 'ERROR';

export interface WebhookConfig {
  id: string;
  workflowId: string;
  workflowName: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  isActive: boolean;
  description?: string;
  headers?: Record<string, string>;
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'apiKey';
    config?: Record<string, string>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookExecution {
  id: string;
  webhookId: string;
  workflowId: string;
  executionId: string;
  status: WebhookExecutionStatus;
  method: string;
  path: string;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseStatus?: number;
  responseBody?: any;
  duration?: number; // in milliseconds
  error?: string;
  triggeredAt: Date;
  completedAt?: Date;
}

export interface WebhookStats {
  totalExecutions: number;
  successCount: number;
  errorCount: number;
  averageDuration: number;
  lastExecution?: Date;
  successRate: number;
}

export interface WebhookFilters {
  workflowId?: string;
  status?: WebhookExecutionStatus[];
  method?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

interface WebhooksState {
  // Core Data
  webhooks: WebhookConfig[];
  executions: WebhookExecution[];
  selectedWebhook: WebhookConfig | null;
  selectedExecution: WebhookExecution | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Filters
  filters: WebhookFilters;
  sortBy: 'triggeredAt' | 'duration' | 'status';
  sortOrder: 'asc' | 'desc';

  // Actions - Data Fetching
  fetchWebhooks: () => Promise<void>;
  fetchWebhookById: (id: string) => Promise<void>;
  fetchExecutions: (webhookId?: string, filters?: WebhookFilters) => Promise<void>;
  fetchStats: (webhookId?: string) => Promise<WebhookStats | null>;

  // Actions - Webhook CRUD
  createWebhook: (config: Omit<WebhookConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<WebhookConfig | null>;
  updateWebhook: (id: string, updates: Partial<WebhookConfig>) => Promise<WebhookConfig | null>;
  deleteWebhook: (id: string) => Promise<boolean>;
  toggleWebhook: (id: string) => Promise<boolean>;

  // Actions - Execution Management
  retryExecution: (executionId: string) => Promise<boolean>;
  clearExecutions: (webhookId?: string) => Promise<boolean>;

  // Actions - Testing
  testWebhook: (id: string, payload?: any) => Promise<WebhookExecution | null>;

  // Actions - Real-time Updates
  addExecution: (execution: WebhookExecution) => void;
  updateExecution: (id: string, updates: Partial<WebhookExecution>) => void;

  // Actions - Filters & Sorting
  setFilters: (filters: WebhookFilters) => void;
  setSorting: (sortBy: WebhooksState['sortBy'], sortOrder: 'asc' | 'desc') => void;
  resetFilters: () => void;

  // Actions - Selection
  selectWebhook: (webhook: WebhookConfig | null) => void;
  selectExecution: (execution: WebhookExecution | null) => void;

  // Actions - Utility
  clearError: () => void;
  reset: () => void;

  // Selectors (Derived State)
  getFilteredExecutions: () => WebhookExecution[];
  getSortedExecutions: () => WebhookExecution[];
  getExecutionsByWebhook: (webhookId: string) => WebhookExecution[];
  getRecentExecutions: (limit?: number) => WebhookExecution[];
  getFailedExecutions: () => WebhookExecution[];
  getSuccessRate: (webhookId?: string) => number;
  getAverageDuration: (webhookId?: string) => number;
}

// Default state
const defaultState = {
  webhooks: [],
  executions: [],
  selectedWebhook: null,
  selectedExecution: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  filters: {},
  sortBy: 'triggeredAt' as const,
  sortOrder: 'desc' as const,
};

export const useWebhooksStore = create<WebhooksState>((set, get) => ({
  ...defaultState,

  // ============================================================================
  // Data Fetching Actions
  // ============================================================================

  fetchWebhooks: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // const response = await webhooksApi.getWebhooks();
      // set({ webhooks: response.data, lastUpdated: new Date() });

      set({ webhooks: [], isLoading: false, lastUpdated: new Date() });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch webhooks';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchWebhookById: async (id: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const webhook = get().webhooks.find((w) => w.id === id);
      set({ selectedWebhook: webhook || null, isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch webhook';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchExecutions: async (webhookId?: string, filters?: WebhookFilters): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // const response = await webhooksApi.getExecutions(webhookId, filters);
      // set({ executions: response.data, lastUpdated: new Date() });

      set({ executions: [], isLoading: false, lastUpdated: new Date() });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch executions';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchStats: async (webhookId?: string): Promise<WebhookStats | null> => {
    try {
      // Calculate stats from executions
      const executions = webhookId
        ? get().getExecutionsByWebhook(webhookId)
        : get().executions;

      const totalExecutions = executions.length;
      const successCount = executions.filter((e) => e.status === 'SUCCESS').length;
      const errorCount = executions.filter((e) => e.status === 'ERROR').length;

      const completedExecutions = executions.filter((e) => e.duration !== undefined);
      const averageDuration =
        completedExecutions.length > 0
          ? completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) /
            completedExecutions.length
          : 0;

      const lastExecution =
        executions.length > 0
          ? executions.reduce((latest, e) =>
              new Date(e.triggeredAt) > new Date(latest.triggeredAt) ? e : latest
            ).triggeredAt
          : undefined;

      const successRate = totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0;

      return {
        totalExecutions,
        successCount,
        errorCount,
        averageDuration,
        lastExecution,
        successRate,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stats';
      set({ error: errorMessage });
      return null;
    }
  },

  // ============================================================================
  // Webhook CRUD Actions
  // ============================================================================

  createWebhook: async (
    config: Omit<WebhookConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WebhookConfig | null> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // const response = await webhooksApi.createWebhook(config);
      // const newWebhook = response.data;

      const newWebhook: WebhookConfig = {
        ...config,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      set((state) => ({
        webhooks: [...state.webhooks, newWebhook],
        isLoading: false,
      }));

      return newWebhook;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create webhook';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  updateWebhook: async (
    id: string,
    updates: Partial<WebhookConfig>
  ): Promise<WebhookConfig | null> => {
    set({ isLoading: true, error: null });
    try {
      const webhook = get().webhooks.find((w) => w.id === id);
      if (!webhook) throw new Error('Webhook not found');

      const updatedWebhook: WebhookConfig = {
        ...webhook,
        ...updates,
        updatedAt: new Date(),
      };

      set((state) => ({
        webhooks: state.webhooks.map((w) => (w.id === id ? updatedWebhook : w)),
        selectedWebhook:
          state.selectedWebhook?.id === id ? updatedWebhook : state.selectedWebhook,
        isLoading: false,
      }));

      return updatedWebhook;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update webhook';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  deleteWebhook: async (id: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // await webhooksApi.deleteWebhook(id);

      set((state) => ({
        webhooks: state.webhooks.filter((w) => w.id !== id),
        executions: state.executions.filter((e) => e.webhookId !== id),
        selectedWebhook: state.selectedWebhook?.id === id ? null : state.selectedWebhook,
        isLoading: false,
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete webhook';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  toggleWebhook: async (id: string): Promise<boolean> => {
    const webhook = get().webhooks.find((w) => w.id === id);
    if (!webhook) return false;

    return (await get().updateWebhook(id, { isActive: !webhook.isActive })) !== null;
  },

  // ============================================================================
  // Execution Management Actions
  // ============================================================================

  retryExecution: async (executionId: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // await webhooksApi.retryExecution(executionId);

      set({ isLoading: false });
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retry execution';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  clearExecutions: async (webhookId?: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // await webhooksApi.clearExecutions(webhookId);

      set((state) => ({
        executions: webhookId
          ? state.executions.filter((e) => e.webhookId !== webhookId)
          : [],
        selectedExecution: null,
        isLoading: false,
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear executions';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // ============================================================================
  // Testing Actions
  // ============================================================================

  testWebhook: async (id: string, payload?: any): Promise<WebhookExecution | null> => {
    set({ isLoading: true, error: null });
    try {
      const webhook = get().webhooks.find((w) => w.id === id);
      if (!webhook) throw new Error('Webhook not found');

      // TODO: Replace with actual API call
      // const response = await webhooksApi.testWebhook(id, payload);
      // const execution = response.data;

      // Mock implementation
      const execution: WebhookExecution = {
        id: Math.random().toString(36).substr(2, 9),
        webhookId: id,
        workflowId: webhook.workflowId,
        executionId: Math.random().toString(36).substr(2, 9),
        status: 'SUCCESS',
        method: webhook.method,
        path: webhook.path,
        requestBody: payload,
        responseStatus: 200,
        duration: Math.floor(Math.random() * 1000) + 100,
        triggeredAt: new Date(),
        completedAt: new Date(),
      };

      get().addExecution(execution);

      set({ isLoading: false });
      return execution;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to test webhook';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  // ============================================================================
  // Real-time Update Actions
  // ============================================================================

  addExecution: (execution: WebhookExecution): void => {
    set((state) => ({
      executions: [execution, ...state.executions],
    }));
  },

  updateExecution: (id: string, updates: Partial<WebhookExecution>): void => {
    set((state) => ({
      executions: state.executions.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      selectedExecution:
        state.selectedExecution?.id === id
          ? { ...state.selectedExecution, ...updates }
          : state.selectedExecution,
    }));
  },

  // ============================================================================
  // Filter & Sorting Actions
  // ============================================================================

  setFilters: (filters: WebhookFilters): void => {
    set({ filters });
  },

  setSorting: (sortBy: WebhooksState['sortBy'], sortOrder: 'asc' | 'desc'): void => {
    set({ sortBy, sortOrder });
  },

  resetFilters: (): void => {
    set({ filters: {} });
  },

  // ============================================================================
  // Selection Actions
  // ============================================================================

  selectWebhook: (webhook: WebhookConfig | null): void => {
    set({ selectedWebhook: webhook });
  },

  selectExecution: (execution: WebhookExecution | null): void => {
    set({ selectedExecution: execution });
  },

  // ============================================================================
  // Utility Actions
  // ============================================================================

  clearError: (): void => {
    set({ error: null });
  },

  reset: (): void => {
    set(defaultState);
  },

  // ============================================================================
  // Selectors (Derived State)
  // ============================================================================

  getFilteredExecutions: (): WebhookExecution[] => {
    const { executions, filters } = get();

    return executions.filter((execution) => {
      // Workflow filter
      if (filters.workflowId && execution.workflowId !== filters.workflowId) {
        return false;
      }

      // Status filter
      if (filters.status?.length && !filters.status.includes(execution.status)) {
        return false;
      }

      // Method filter
      if (filters.method?.length && !filters.method.includes(execution.method)) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const triggeredAt = new Date(execution.triggeredAt);
        if (
          triggeredAt < filters.dateRange.start ||
          triggeredAt > filters.dateRange.end
        ) {
          return false;
        }
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesPath = execution.path.toLowerCase().includes(searchLower);
        const matchesId = execution.id.toLowerCase().includes(searchLower);

        if (!matchesPath && !matchesId) {
          return false;
        }
      }

      return true;
    });
  },

  getSortedExecutions: (): WebhookExecution[] => {
    const { sortBy, sortOrder } = get();
    const filteredExecutions = get().getFilteredExecutions();

    return [...filteredExecutions].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'triggeredAt':
          comparison =
            new Date(a.triggeredAt).getTime() - new Date(b.triggeredAt).getTime();
          break;
        case 'duration':
          comparison = (a.duration || 0) - (b.duration || 0);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  },

  getExecutionsByWebhook: (webhookId: string): WebhookExecution[] => {
    return get()
      .getFilteredExecutions()
      .filter((e) => e.webhookId === webhookId);
  },

  getRecentExecutions: (limit = 10): WebhookExecution[] => {
    return get()
      .getFilteredExecutions()
      .sort(
        (a, b) =>
          new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
      )
      .slice(0, limit);
  },

  getFailedExecutions: (): WebhookExecution[] => {
    return get()
      .getFilteredExecutions()
      .filter((e) => e.status === 'ERROR')
      .sort(
        (a, b) =>
          new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
      );
  },

  getSuccessRate: (webhookId?: string): number => {
    const executions = webhookId
      ? get().getExecutionsByWebhook(webhookId)
      : get().executions;

    if (executions.length === 0) return 0;

    const successCount = executions.filter((e) => e.status === 'SUCCESS').length;
    return Math.round((successCount / executions.length) * 100);
  },

  getAverageDuration: (webhookId?: string): number => {
    const executions = webhookId
      ? get().getExecutionsByWebhook(webhookId)
      : get().executions;

    const completedExecutions = executions.filter((e) => e.duration !== undefined);

    if (completedExecutions.length === 0) return 0;

    const totalDuration = completedExecutions.reduce(
      (sum, e) => sum + (e.duration || 0),
      0
    );
    return Math.round(totalDuration / completedExecutions.length);
  },
}));
