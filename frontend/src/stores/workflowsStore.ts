// Last Modified: 2025-11-23 17:30
/**
 * Workflows Store
 *
 * Manages workflow automation configurations including:
 * - Workflow CRUD operations
 * - Trigger management (webhook, schedule, event, manual)
 * - Execution tracking and statistics
 * - Real-time status updates
 * - Integration with backend API
 */

import { create } from 'zustand';
import workflowsService, {
  APIWorkflow,
  CreateWorkflowDTO,
  UpdateWorkflowDTO,
  WorkflowStats,
  WorkflowTriggerResponse,
} from '@/services/workflowsService';

export interface Workflow {
  id: number;
  name: string;
  triggerType: 'webhook' | 'schedule' | 'event' | 'manual';
  webhookUrl?: string;
  conditions?: Record<string, any>;
  actions?: Record<string, any>;
  isActive: boolean;
  hitCount: number;
  lastTriggered?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: number;
  workflowName: string;
  status: 'success' | 'failed' | 'running';
  triggeredAt: Date;
  completedAt?: Date;
  duration?: number; // in milliseconds
  error?: string;
  payload?: any;
}

export interface WorkflowFilters {
  triggerType?: string[];
  isActive?: boolean;
  search?: string;
}

interface WorkflowsState {
  // Core Data
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;
  executions: WorkflowExecution[];

  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Filters
  filters: WorkflowFilters;
  sortBy: 'name' | 'createdAt' | 'lastTriggered' | 'hitCount';
  sortOrder: 'asc' | 'desc';

  // Pagination
  currentPage: number;
  totalPages: number;
  totalWorkflows: number;

  // Actions - Data Fetching
  fetchWorkflows: (page?: number) => Promise<void>;
  fetchWorkflowById: (id: number) => Promise<void>;
  fetchWorkflowStats: (id: number) => Promise<WorkflowStats | null>;

  // Actions - Workflow CRUD
  createWorkflow: (data: CreateWorkflowDTO) => Promise<Workflow | null>;
  updateWorkflow: (id: number, data: UpdateWorkflowDTO) => Promise<Workflow | null>;
  deleteWorkflow: (id: number) => Promise<boolean>;
  toggleWorkflow: (id: number) => Promise<boolean>;

  // Actions - Workflow Execution
  triggerWorkflow: (id: number, payload?: any) => Promise<WorkflowTriggerResponse | null>;
  addExecution: (execution: WorkflowExecution) => void;

  // Actions - Filters & Sorting
  setFilters: (filters: WorkflowFilters) => void;
  setSorting: (sortBy: WorkflowsState['sortBy'], sortOrder: 'asc' | 'desc') => void;
  resetFilters: () => void;

  // Actions - Selection
  selectWorkflow: (workflow: Workflow | null) => void;

  // Actions - Utility
  clearError: () => void;
  reset: () => void;

  // Selectors (Derived State)
  getFilteredWorkflows: () => Workflow[];
  getSortedWorkflows: () => Workflow[];
  getActiveWorkflows: () => Workflow[];
  getWorkflowsByType: (type: string) => Workflow[];
  getRecentExecutions: (workflowId?: number, limit?: number) => WorkflowExecution[];
  getSuccessRate: (workflowId?: number) => number;
}

// Transform API workflow to frontend format
const transformWorkflow = (apiWorkflow: APIWorkflow): Workflow => ({
  id: apiWorkflow.id,
  name: apiWorkflow.name,
  triggerType: apiWorkflow.trigger_type,
  webhookUrl: apiWorkflow.webhook_url,
  conditions: apiWorkflow.conditions,
  actions: apiWorkflow.actions,
  isActive: apiWorkflow.is_active,
  hitCount: apiWorkflow.hit_count,
  lastTriggered: apiWorkflow.last_triggered ? new Date(apiWorkflow.last_triggered) : undefined,
  metadata: apiWorkflow.metadata,
  createdAt: new Date(apiWorkflow.created_at),
  updatedAt: new Date(apiWorkflow.updated_at),
});

// Default state
const defaultState = {
  workflows: [],
  selectedWorkflow: null,
  executions: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  filters: {},
  sortBy: 'createdAt' as const,
  sortOrder: 'desc' as const,
  currentPage: 1,
  totalPages: 1,
  totalWorkflows: 0,
};

export const useWorkflowsStore = create<WorkflowsState>((set, get) => ({
  ...defaultState,

  // ============================================================================
  // Data Fetching Actions
  // ============================================================================

  fetchWorkflows: async (page = 1): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const { workflows, pagination } = await workflowsService.getAll(page, 20);

      set({
        workflows: workflows.map(transformWorkflow),
        currentPage: pagination?.page || 1,
        totalPages: pagination?.totalPages || 1,
        totalWorkflows: pagination?.total || workflows.length,
        lastUpdated: new Date(),
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to fetch workflows';
      set({ error: errorMessage, isLoading: false });
      console.error('Fetch workflows error:', error);
    }
  },

  fetchWorkflowById: async (id: number): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const apiWorkflow = await workflowsService.getById(id);
      const workflow = transformWorkflow(apiWorkflow);

      set({
        selectedWorkflow: workflow,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to fetch workflow';
      set({ error: errorMessage, isLoading: false });
      console.error('Fetch workflow by ID error:', error);
    }
  },

  fetchWorkflowStats: async (id: number): Promise<WorkflowStats | null> => {
    try {
      const stats = await workflowsService.getStats(id);
      return stats;
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to fetch workflow stats';
      set({ error: errorMessage });
      console.error('Fetch workflow stats error:', error);
      return null;
    }
  },

  // ============================================================================
  // Workflow CRUD Actions
  // ============================================================================

  createWorkflow: async (data: CreateWorkflowDTO): Promise<Workflow | null> => {
    set({ isLoading: true, error: null });
    try {
      const apiWorkflow = await workflowsService.create(data);
      const workflow = transformWorkflow(apiWorkflow);

      set((state) => ({
        workflows: [workflow, ...state.workflows],
        totalWorkflows: state.totalWorkflows + 1,
        isLoading: false,
      }));

      return workflow;
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create workflow';
      set({ error: errorMessage, isLoading: false });
      console.error('Create workflow error:', error);
      return null;
    }
  },

  updateWorkflow: async (id: number, data: UpdateWorkflowDTO): Promise<Workflow | null> => {
    set({ isLoading: true, error: null });
    try {
      const apiWorkflow = await workflowsService.update(id, data);
      const workflow = transformWorkflow(apiWorkflow);

      set((state) => ({
        workflows: state.workflows.map((w) => (w.id === id ? workflow : w)),
        selectedWorkflow: state.selectedWorkflow?.id === id ? workflow : state.selectedWorkflow,
        isLoading: false,
      }));

      return workflow;
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update workflow';
      set({ error: errorMessage, isLoading: false });
      console.error('Update workflow error:', error);
      return null;
    }
  },

  deleteWorkflow: async (id: number): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      await workflowsService.delete(id);

      set((state) => ({
        workflows: state.workflows.filter((w) => w.id !== id),
        executions: state.executions.filter((e) => e.workflowId !== id),
        selectedWorkflow: state.selectedWorkflow?.id === id ? null : state.selectedWorkflow,
        totalWorkflows: state.totalWorkflows - 1,
        isLoading: false,
      }));

      return true;
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete workflow';
      set({ error: errorMessage, isLoading: false });
      console.error('Delete workflow error:', error);
      return false;
    }
  },

  toggleWorkflow: async (id: number): Promise<boolean> => {
    const workflow = get().workflows.find((w) => w.id === id);
    if (!workflow) return false;

    return (await get().updateWorkflow(id, { is_active: !workflow.isActive })) !== null;
  },

  // ============================================================================
  // Workflow Execution Actions
  // ============================================================================

  triggerWorkflow: async (id: number, payload?: any): Promise<WorkflowTriggerResponse | null> => {
    set({ isLoading: true, error: null });
    try {
      const result = await workflowsService.trigger(id, payload);

      // Update workflow hit count and last triggered
      set((state) => ({
        workflows: state.workflows.map((w) =>
          w.id === id
            ? {
                ...w,
                hitCount: result.hit_count,
                lastTriggered: new Date(result.last_triggered),
              }
            : w
        ),
        isLoading: false,
      }));

      // Add execution record
      const workflow = get().workflows.find((w) => w.id === id);
      if (workflow) {
        get().addExecution({
          id: `${id}-${Date.now()}`,
          workflowId: id,
          workflowName: workflow.name,
          status: 'success',
          triggeredAt: new Date(result.last_triggered),
          completedAt: new Date(),
          duration: 0,
          payload,
        });
      }

      return result;
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to trigger workflow';
      set({ error: errorMessage, isLoading: false });
      console.error('Trigger workflow error:', error);
      return null;
    }
  },

  addExecution: (execution: WorkflowExecution): void => {
    set((state) => ({
      executions: [execution, ...state.executions].slice(0, 100), // Keep last 100
    }));
  },

  // ============================================================================
  // Filter & Sorting Actions
  // ============================================================================

  setFilters: (filters: WorkflowFilters): void => {
    set({ filters });
  },

  setSorting: (sortBy: WorkflowsState['sortBy'], sortOrder: 'asc' | 'desc'): void => {
    set({ sortBy, sortOrder });
  },

  resetFilters: (): void => {
    set({ filters: {} });
  },

  // ============================================================================
  // Selection Actions
  // ============================================================================

  selectWorkflow: (workflow: Workflow | null): void => {
    set({ selectedWorkflow: workflow });
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

  getFilteredWorkflows: (): Workflow[] => {
    const { workflows, filters } = get();

    return workflows.filter((workflow) => {
      // Trigger type filter
      if (filters.triggerType?.length && !filters.triggerType.includes(workflow.triggerType)) {
        return false;
      }

      // Active status filter
      if (filters.isActive !== undefined && workflow.isActive !== filters.isActive) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = workflow.name.toLowerCase().includes(searchLower);
        const matchesUrl = workflow.webhookUrl?.toLowerCase().includes(searchLower);

        if (!matchesName && !matchesUrl) {
          return false;
        }
      }

      return true;
    });
  },

  getSortedWorkflows: (): Workflow[] => {
    const { sortBy, sortOrder } = get();
    const filteredWorkflows = get().getFilteredWorkflows();

    return [...filteredWorkflows].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'lastTriggered':
          const aTime = a.lastTriggered?.getTime() || 0;
          const bTime = b.lastTriggered?.getTime() || 0;
          comparison = aTime - bTime;
          break;
        case 'hitCount':
          comparison = a.hitCount - b.hitCount;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  },

  getActiveWorkflows: (): Workflow[] => {
    return get().workflows.filter((w) => w.isActive);
  },

  getWorkflowsByType: (type: string): Workflow[] => {
    return get().workflows.filter((w) => w.triggerType === type);
  },

  getRecentExecutions: (workflowId?: number, limit = 10): WorkflowExecution[] => {
    const executions = workflowId
      ? get().executions.filter((e) => e.workflowId === workflowId)
      : get().executions;

    return executions
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, limit);
  },

  getSuccessRate: (workflowId?: number): number => {
    const executions = workflowId
      ? get().executions.filter((e) => e.workflowId === workflowId)
      : get().executions;

    if (executions.length === 0) return 100; // Default to 100% if no executions

    const successCount = executions.filter((e) => e.status === 'success').length;
    return Math.round((successCount / executions.length) * 100);
  },
}));
