// Last Modified: 2025-11-23 17:30
/**
 * Tasks Store
 *
 * Manages task and to-do list functionality including:
 * - Task CRUD operations
 * - Task status and priority management
 * - Task filtering and search
 * - Task statistics and analytics
 * - Subtasks and dependencies
 */

import { create } from 'zustand';
import { tasksAPI } from '@/lib/api/store-adapter';
import {
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  TaskStats,
} from '@/types/task';

interface TasksState {
  // Core Data
  tasks: Task[];
  selectedTask: Task | null;
  stats: TaskStats | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Filters
  filters: TaskFilters;
  sortBy: 'dueDate' | 'priority' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';

  // Actions - Data Fetching
  fetchTasks: (filters?: TaskFilters) => Promise<void>;
  fetchTaskById: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;

  // Actions - Task CRUD
  createTask: (input: CreateTaskInput) => Promise<Task | null>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  duplicateTask: (id: string) => Promise<Task | null>;

  // Actions - Task Status
  markAsComplete: (id: string) => Promise<boolean>;
  markAsInProgress: (id: string) => Promise<boolean>;
  markAsTodo: (id: string) => Promise<boolean>;
  cancelTask: (id: string) => Promise<boolean>;

  // Actions - Bulk Operations
  bulkUpdateStatus: (ids: string[], status: TaskStatus) => Promise<boolean>;
  bulkDelete: (ids: string[]) => Promise<boolean>;

  // Actions - Filters & Sorting
  setFilters: (filters: TaskFilters) => void;
  setSorting: (sortBy: TasksState['sortBy'], sortOrder: 'asc' | 'desc') => void;
  resetFilters: () => void;

  // Actions - Selection
  selectTask: (task: Task | null) => void;

  // Actions - Utility
  clearError: () => void;
  reset: () => void;

  // Selectors (Derived State)
  getFilteredTasks: () => Task[];
  getSortedTasks: () => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByPriority: (priority: TaskPriority) => Task[];
  getOverdueTasks: () => Task[];
  getDueTodayTasks: () => Task[];
  getDueThisWeekTasks: () => Task[];
  getCompletionRate: () => number;
}

// Default state
const defaultState = {
  tasks: [],
  selectedTask: null,
  stats: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  filters: {},
  sortBy: 'dueDate' as const,
  sortOrder: 'asc' as const,
};

export const useTasksStore = create<TasksState>((set, get) => ({
  ...defaultState,

  // ============================================================================
  // Data Fetching Actions
  // ============================================================================

  fetchTasks: async (filters?: TaskFilters): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // const response = await tasksApi.getTasks(filters);
      // set({ tasks: response.data, lastUpdated: new Date() });

      // Mock implementation
      set({ tasks: [], isLoading: false, lastUpdated: new Date() });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tasks';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchTaskById: async (id: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // const response = await tasksApi.getTaskById(id);
      // set({ selectedTask: response.data, isLoading: false });

      // Mock implementation
      const task = get().tasks.find((t) => t.id === id);
      set({ selectedTask: task || null, isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch task';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchStats: async (): Promise<void> => {
    try {
      // TODO: Replace with actual API call
      // const response = await tasksApi.getStats();
      // set({ stats: response.data });

      // Calculate stats from current tasks
      const tasks = get().tasks;
      const total = tasks.length;

      const byStatus = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<TaskStatus, number>);

      const byPriority = tasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {} as Record<TaskPriority, number>);

      const overdue = get().getOverdueTasks().length;
      const dueToday = get().getDueTodayTasks().length;
      const dueThisWeek = get().getDueThisWeekTasks().length;
      // const completionRate = get().getCompletionRate(); // Not in TaskStats interface

      set({
        stats: {
          total,
          byStatus,
          byPriority,
          overdue,
          dueToday,
          dueThisWeek,
          completedThisWeek: 0, // TODO: Calculate this properly
          completedThisMonth: 0, // TODO: Calculate this properly
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stats';
      set({ error: errorMessage });
    }
  },

  // ============================================================================
  // Task CRUD Actions
  // ============================================================================

  createTask: async (input: CreateTaskInput): Promise<Task | null> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // const response = await tasksApi.createTask(input);
      // const newTask = response.data;

      // Mock implementation
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title: input.title,
        description: input.description,
        status: input.status || 'todo',
        priority: input.priority || 'medium',
        dueDate: input.dueDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        assigneeId: input.assigneeId,
        category: input.category,
        tags: input.tags || [],
        estimatedMinutes: input.estimatedMinutes,
      };

      set((state) => ({
        tasks: [...state.tasks, newTask],
        isLoading: false,
      }));

      // Update stats
      get().fetchStats();

      return newTask;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  updateTask: async (id: string, input: UpdateTaskInput): Promise<Task | null> => {
    set({ isLoading: true, error: null });
    try {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) throw new Error('Task not found');

      // TODO: Replace with actual API call
      // const response = await tasksApi.updateTask(id, input);
      // const updatedTask = response.data;

      // Mock implementation
      const updatedTask: Task = {
        ...task,
        ...input,
        updatedAt: new Date(),
      };

      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        selectedTask: state.selectedTask?.id === id ? updatedTask : state.selectedTask,
        isLoading: false,
      }));

      // Update stats
      get().fetchStats();

      return updatedTask;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  deleteTask: async (id: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // await tasksApi.deleteTask(id);

      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
        isLoading: false,
      }));

      // Update stats
      get().fetchStats();

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  duplicateTask: async (id: string): Promise<Task | null> => {
    try {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) throw new Error('Task not found');

      return get().createTask({
        title: `${task.title} (Copy)`,
        description: task.description,
        status: 'todo',
        priority: task.priority,
        dueDate: task.dueDate,
        assigneeId: task.assigneeId,
        category: task.category,
        tags: task.tags,
        estimatedMinutes: task.estimatedMinutes,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate task';
      set({ error: errorMessage });
      return null;
    }
  },

  // ============================================================================
  // Task Status Actions
  // ============================================================================

  markAsComplete: async (id: string): Promise<boolean> => {
    return (await get().updateTask(id, { id, status: 'completed' })) !== null;
  },

  markAsInProgress: async (id: string): Promise<boolean> => {
    return (await get().updateTask(id, { id, status: 'in-progress' })) !== null;
  },

  markAsTodo: async (id: string): Promise<boolean> => {
    return (await get().updateTask(id, { id, status: 'todo' })) !== null;
  },

  cancelTask: async (id: string): Promise<boolean> => {
    return (await get().updateTask(id, { id, status: 'cancelled' })) !== null;
  },

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  bulkUpdateStatus: async (ids: string[], status: TaskStatus): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // await tasksApi.bulkUpdateStatus(ids, status);

      set((state) => ({
        tasks: state.tasks.map((task) =>
          ids.includes(task.id)
            ? { ...task, status, updatedAt: new Date() }
            : task
        ),
        isLoading: false,
      }));

      // Update stats
      get().fetchStats();

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update status';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  bulkDelete: async (ids: string[]): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with actual API call
      // await tasksApi.bulkDelete(ids);

      set((state) => ({
        tasks: state.tasks.filter((task) => !ids.includes(task.id)),
        selectedTask: ids.includes(state.selectedTask?.id || '') ? null : state.selectedTask,
        isLoading: false,
      }));

      // Update stats
      get().fetchStats();

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk delete';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  // ============================================================================
  // Filter & Sorting Actions
  // ============================================================================

  setFilters: (filters: TaskFilters): void => {
    set({ filters });
  },

  setSorting: (sortBy: TasksState['sortBy'], sortOrder: 'asc' | 'desc'): void => {
    set({ sortBy, sortOrder });
  },

  resetFilters: (): void => {
    set({ filters: {} });
  },

  // ============================================================================
  // Selection Actions
  // ============================================================================

  selectTask: (task: Task | null): void => {
    set({ selectedTask: task });
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

  getFilteredTasks: (): Task[] => {
    const { tasks, filters } = get();

    return tasks.filter((task) => {
      // Status filter
      if (filters.status?.length && !filters.status.includes(task.status)) {
        return false;
      }

      // Priority filter
      if (filters.priority?.length && !filters.priority.includes(task.priority)) {
        return false;
      }

      // Assignee filter
      if (filters.assigneeId?.length && !filters.assigneeId.includes(task.assigneeId || '')) {
        return false;
      }

      // Category filter
      if (filters.category?.length && !filters.category.includes(task.category || '')) {
        return false;
      }

      // Due date range filter
      if (filters.dueDateRange && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (dueDate < filters.dueDateRange.start || dueDate > filters.dueDateRange.end) {
          return false;
        }
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(searchLower);
        const matchesDescription = task.description?.toLowerCase().includes(searchLower);
        const matchesTags = task.tags?.some((tag) => tag.toLowerCase().includes(searchLower));

        if (!matchesTitle && !matchesDescription && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  },

  getSortedTasks: (): Task[] => {
    const { sortBy, sortOrder } = get();
    const filteredTasks = get().getFilteredTasks();

    return [...filteredTasks].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;

        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;

        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;

        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  },

  getTasksByStatus: (status: TaskStatus): Task[] => {
    return get().getFilteredTasks().filter((task) => task.status === status);
  },

  getTasksByPriority: (priority: TaskPriority): Task[] => {
    return get().getFilteredTasks().filter((task) => task.priority === priority);
  },

  getOverdueTasks: (): Task[] => {
    const now = new Date();
    return get()
      .getFilteredTasks()
      .filter(
        (task) =>
          task.dueDate &&
          new Date(task.dueDate) < now &&
          task.status !== 'completed' &&
          task.status !== 'cancelled'
      );
  },

  getDueTodayTasks: (): Task[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return get()
      .getFilteredTasks()
      .filter((task) => {
        if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') {
          return false;
        }

        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate < tomorrow;
      });
  },

  getDueThisWeekTasks: (): Task[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return get()
      .getFilteredTasks()
      .filter((task) => {
        if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') {
          return false;
        }

        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate < weekEnd;
      });
  },

  getCompletionRate: (): number => {
    const tasks = get().tasks;
    const total = tasks.length;

    if (total === 0) return 0;

    const completed = tasks.filter((task) => task.status === 'completed').length;
    return Math.round((completed / total) * 100);
  },
}));
