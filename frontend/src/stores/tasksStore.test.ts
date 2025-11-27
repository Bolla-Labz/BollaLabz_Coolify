// Last Modified: 2025-11-24 01:20
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTasksStore } from './tasksStore';
import type { Task } from '../types/task';

// Mock the tasks service
vi.mock('../services/tasksService', () => ({
  tasksService: {
    getTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    getTaskById: vi.fn(),
    assignTask: vi.fn(),
    updateTaskStatus: vi.fn(),
  },
}));

// Mock API client for direct calls
vi.mock('../lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('TasksStore', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'pending',
    priority: 'medium',
    assignee: null,
    due_date: '2025-12-31',
    created_at: '2025-11-24T00:00:00Z',
    updated_at: '2025-11-24T00:00:00Z',
    tags: ['test'],
    dependencies: [],
    attachments: [],
  };

  beforeEach(() => {
    // Reset store state
    useTasksStore.getState().reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty tasks array', () => {
      const { result } = renderHook(() => useTasksStore());

      expect(result.current.tasks).toEqual([]);
      expect(result.current.selectedTask).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.filters).toEqual({
        status: null,
        priority: null,
        assignee: null,
      });
    });
  });

  describe('Fetching Tasks', () => {
    it('should fetch and store tasks successfully', async () => {
      const { tasksService } = await import('../services/tasksService');
      const mockTasks = [mockTask, { ...mockTask, id: '2', title: 'Task 2' }];

      (tasksService.getTasks as any).mockResolvedValue(mockTasks);

      const { result } = renderHook(() => useTasksStore());

      await act(async () => {
        await result.current.fetchTasks();
      });

      expect(result.current.tasks).toEqual(mockTasks);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch tasks error', async () => {
      const { tasksService } = await import('../services/tasksService');
      const errorMessage = 'Failed to fetch tasks';

      (tasksService.getTasks as any).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTasksStore());

      await act(async () => {
        await result.current.fetchTasks();
      });

      expect(result.current.tasks).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });

    it('should set loading state while fetching', async () => {
      const { tasksService } = await import('../services/tasksService');
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (tasksService.getTasks as any).mockReturnValue(promise);

      const { result } = renderHook(() => useTasksStore());

      // Start fetching
      act(() => {
        result.current.fetchTasks();
      });

      expect(result.current.loading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!([mockTask]);
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Creating Tasks', () => {
    it('should create a new task and add to store', async () => {
      const { tasksService } = await import('../services/tasksService');
      const newTaskData = { title: 'New Task', description: 'New Description' };
      const createdTask = { ...mockTask, ...newTaskData, id: '3' };

      (tasksService.createTask as any).mockResolvedValue(createdTask);

      const { result } = renderHook(() => useTasksStore());

      await act(async () => {
        await result.current.createTask(newTaskData);
      });

      expect(result.current.tasks).toContainEqual(createdTask);
      expect(tasksService.createTask).toHaveBeenCalledWith(newTaskData);
    });

    it('should handle task creation failure', async () => {
      const { tasksService } = await import('../services/tasksService');
      const errorMessage = 'Failed to create task';

      (tasksService.createTask as any).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTasksStore());

      await act(async () => {
        try {
          await result.current.createTask({ title: 'Fail Task' });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.tasks).toEqual([]);
    });

    it('should validate required fields before creating', async () => {
      const { result } = renderHook(() => useTasksStore());

      await act(async () => {
        try {
          await result.current.createTask({ title: '' }); // Empty title
        } catch (error: any) {
          expect(error.message).toContain('Title is required');
        }
      });

      expect(result.current.tasks).toEqual([]);
    });
  });

  describe('Updating Tasks', () => {
    it('should update task in store', async () => {
      const { tasksService } = await import('../services/tasksService');
      const updatedTask = { ...mockTask, title: 'Updated Title' };

      (tasksService.updateTask as any).mockResolvedValue(updatedTask);

      const { result } = renderHook(() => useTasksStore());

      // Add initial task
      act(() => {
        result.current.setTasks([mockTask]);
      });

      await act(async () => {
        await result.current.updateTask('1', { title: 'Updated Title' });
      });

      expect(result.current.tasks[0].title).toBe('Updated Title');
      expect(tasksService.updateTask).toHaveBeenCalledWith('1', { title: 'Updated Title' });
    });

    it('should handle update for non-existent task', async () => {
      const { result } = renderHook(() => useTasksStore());

      await act(async () => {
        try {
          await result.current.updateTask('999', { title: 'Update' });
        } catch (error: any) {
          expect(error.message).toContain('Task not found');
        }
      });
    });

    it('should optimistically update task then revert on error', async () => {
      const { tasksService } = await import('../services/tasksService');

      (tasksService.updateTask as any).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useTasksStore());

      // Add initial task
      act(() => {
        result.current.setTasks([mockTask]);
      });

      const originalTitle = mockTask.title;

      await act(async () => {
        try {
          await result.current.updateTask('1', { title: 'Optimistic Update' });
        } catch {
          // Expected to fail
        }
      });

      // Should revert to original after failure
      expect(result.current.tasks[0].title).toBe(originalTitle);
    });
  });

  describe('Deleting Tasks', () => {
    it('should remove task from store', async () => {
      const { tasksService } = await import('../services/tasksService');

      (tasksService.deleteTask as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useTasksStore());

      // Add tasks
      act(() => {
        result.current.setTasks([mockTask, { ...mockTask, id: '2' }]);
      });

      expect(result.current.tasks).toHaveLength(2);

      await act(async () => {
        await result.current.deleteTask('1');
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks.find(t => t.id === '1')).toBeUndefined();
    });

    it('should handle delete failure and restore task', async () => {
      const { tasksService } = await import('../services/tasksService');

      (tasksService.deleteTask as any).mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useTasksStore());

      act(() => {
        result.current.setTasks([mockTask]);
      });

      await act(async () => {
        try {
          await result.current.deleteTask('1');
        } catch {
          // Expected to fail
        }
      });

      // Task should still exist after failed delete
      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].id).toBe('1');
    });
  });

  describe('Task Status Updates', () => {
    it('should update task status correctly', async () => {
      const { tasksService } = await import('../services/tasksService');
      const updatedTask = { ...mockTask, status: 'completed' };

      (tasksService.updateTaskStatus as any).mockResolvedValue(updatedTask);

      const { result } = renderHook(() => useTasksStore());

      act(() => {
        result.current.setTasks([mockTask]);
      });

      await act(async () => {
        await result.current.updateTaskStatus('1', 'completed');
      });

      expect(result.current.tasks[0].status).toBe('completed');
    });

    it('should validate status transitions', async () => {
      const { result } = renderHook(() => useTasksStore());

      const completedTask = { ...mockTask, status: 'completed' as const };

      act(() => {
        result.current.setTasks([completedTask]);
      });

      // Should not allow completed -> pending transition
      await act(async () => {
        try {
          await result.current.updateTaskStatus('1', 'pending');
        } catch (error: any) {
          expect(error.message).toContain('Invalid status transition');
        }
      });
    });
  });

  describe('Task Filtering', () => {
    it('should filter tasks by status', () => {
      const { result } = renderHook(() => useTasksStore());

      const tasks = [
        { ...mockTask, id: '1', status: 'pending' as const },
        { ...mockTask, id: '2', status: 'in_progress' as const },
        { ...mockTask, id: '3', status: 'completed' as const },
      ];

      act(() => {
        result.current.setTasks(tasks);
        result.current.setFilter('status', 'pending');
      });

      const filtered = result.current.getFilteredTasks();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe('pending');
    });

    it('should filter tasks by priority', () => {
      const { result } = renderHook(() => useTasksStore());

      const tasks = [
        { ...mockTask, id: '1', priority: 'low' as const },
        { ...mockTask, id: '2', priority: 'medium' as const },
        { ...mockTask, id: '3', priority: 'high' as const },
      ];

      act(() => {
        result.current.setTasks(tasks);
        result.current.setFilter('priority', 'high');
      });

      const filtered = result.current.getFilteredTasks();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].priority).toBe('high');
    });

    it('should apply multiple filters', () => {
      const { result } = renderHook(() => useTasksStore());

      const tasks = [
        { ...mockTask, id: '1', status: 'pending' as const, priority: 'high' as const },
        { ...mockTask, id: '2', status: 'pending' as const, priority: 'low' as const },
        { ...mockTask, id: '3', status: 'completed' as const, priority: 'high' as const },
      ];

      act(() => {
        result.current.setTasks(tasks);
        result.current.setFilter('status', 'pending');
        result.current.setFilter('priority', 'high');
      });

      const filtered = result.current.getFilteredTasks();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should clear filters', () => {
      const { result } = renderHook(() => useTasksStore());

      act(() => {
        result.current.setTasks([mockTask]);
        result.current.setFilter('status', 'pending');
        result.current.clearFilters();
      });

      expect(result.current.filters.status).toBeNull();
      expect(result.current.getFilteredTasks()).toHaveLength(1);
    });
  });

  describe('Task Selection', () => {
    it('should select and deselect tasks', async () => {
      const { tasksService } = await import('../services/tasksService');

      (tasksService.getTaskById as any).mockResolvedValue(mockTask);

      const { result } = renderHook(() => useTasksStore());

      await act(async () => {
        await result.current.selectTask('1');
      });

      expect(result.current.selectedTask).toEqual(mockTask);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedTask).toBeNull();
    });
  });

  describe('Task Dependencies', () => {
    it('should handle task dependencies correctly', () => {
      const { result } = renderHook(() => useTasksStore());

      const parentTask = { ...mockTask, id: '1' };
      const dependentTask = { ...mockTask, id: '2', dependencies: ['1'] };

      act(() => {
        result.current.setTasks([parentTask, dependentTask]);
      });

      const deps = result.current.getTaskDependencies('2');

      expect(deps).toHaveLength(1);
      expect(deps[0].id).toBe('1');
    });

    it('should prevent circular dependencies', async () => {
      const { result } = renderHook(() => useTasksStore());

      const task1 = { ...mockTask, id: '1', dependencies: ['2'] };
      const task2 = { ...mockTask, id: '2', dependencies: [] };

      act(() => {
        result.current.setTasks([task1, task2]);
      });

      await act(async () => {
        try {
          await result.current.updateTask('2', { dependencies: ['1'] });
        } catch (error: any) {
          expect(error.message).toContain('Circular dependency');
        }
      });
    });
  });

  describe('Batch Operations', () => {
    it('should update multiple tasks at once', async () => {
      const { result } = renderHook(() => useTasksStore());

      const tasks = [
        { ...mockTask, id: '1' },
        { ...mockTask, id: '2' },
        { ...mockTask, id: '3' },
      ];

      act(() => {
        result.current.setTasks(tasks);
      });

      await act(async () => {
        await result.current.batchUpdateTasks(['1', '2'], { status: 'in_progress' });
      });

      expect(result.current.tasks[0].status).toBe('in_progress');
      expect(result.current.tasks[1].status).toBe('in_progress');
      expect(result.current.tasks[2].status).toBe('pending');
    });

    it('should delete multiple tasks at once', async () => {
      const { result } = renderHook(() => useTasksStore());

      const tasks = [
        { ...mockTask, id: '1' },
        { ...mockTask, id: '2' },
        { ...mockTask, id: '3' },
      ];

      act(() => {
        result.current.setTasks(tasks);
      });

      await act(async () => {
        await result.current.batchDeleteTasks(['1', '3']);
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].id).toBe('2');
    });
  });

  describe('Store Reset', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useTasksStore());

      act(() => {
        result.current.setTasks([mockTask]);
        result.current.setFilter('status', 'pending');
        result.current.setError('Some error');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.tasks).toEqual([]);
      expect(result.current.filters.status).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });
});