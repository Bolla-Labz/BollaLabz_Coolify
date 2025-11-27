// Last Modified: 2025-11-24 12:26
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import tasksService, {
  type APITask,
  type CreateTaskDTO,
  type UpdateTaskDTO,
} from '@/services/tasksService';
import { toast } from 'react-hot-toast';
import { websocketClient } from '@/lib/websocket/client';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

// Frontend interface (used in UI)
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  tags: string[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  blockedReason?: string;
  subtasks?: Subtask[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  dependencies?: string[]; // Task IDs this task depends on
  estimatedHours?: number;
  actualHours?: number;
  projectId?: string;
  columnOrder: number; // For ordering within columns
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface TaskComment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: Date;
  editedAt?: Date;
}

export interface TaskFilter {
  search?: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeId?: string[];
  tags?: string[];
  dueDateRange?: { start: Date; end: Date };
  projectId?: string;
}

interface TasksState {
  tasks: Task[];
  filter: TaskFilter;
  selectedTaskId: string | null;
  isCreating: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus, newOrder: number) => void;

  // Subtask actions
  addSubtask: (taskId: string, subtask: Omit<Subtask, 'id'>) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;

  // Comment actions
  addComment: (taskId: string, comment: Omit<TaskComment, 'id' | 'createdAt'>) => void;
  editComment: (taskId: string, commentId: string, text: string) => void;
  deleteComment: (taskId: string, commentId: string) => void;

  // Filter actions
  setFilter: (filter: TaskFilter) => void;
  clearFilter: () => void;

  // Selection
  selectTask: (id: string | null) => void;

  // Bulk operations
  bulkUpdateStatus: (taskIds: string[], status: TaskStatus) => void;
  bulkDelete: (taskIds: string[]) => void;

  // Computed values
  getTasksByStatus: (status: TaskStatus) => Task[];
  getFilteredTasks: () => Task[];
  getTaskById: (id: string) => Task | undefined;

  // WebSocket
  initializeWebSocket: () => void;
  getOverdueTasks: () => Task[];
  getTaskStats: () => TaskStats;
}

interface TaskStats {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  overdue: number;
  dueToday: number;
  completed: number;
  completionRate: number;
}

// Helper function to map backend status to frontend status
function mapBackendStatusToFrontend(backendStatus: string): TaskStatus {
  const statusMap: Record<string, TaskStatus> = {
    'pending': 'todo',
    'in_progress': 'in_progress',
    'completed': 'done',
    'cancelled': 'blocked',
    'failed': 'blocked',
  };
  return statusMap[backendStatus] || 'todo';
}

// Helper function to map frontend status to backend status
function mapFrontendStatusToBackend(frontendStatus: TaskStatus): string {
  const statusMap: Record<TaskStatus, string> = {
    'backlog': 'pending',
    'todo': 'pending',
    'in_progress': 'in_progress',
    'done': 'completed',
    'blocked': 'cancelled',
  };
  return statusMap[frontendStatus] || 'pending';
}

// Helper function to map backend priority to frontend priority
function mapBackendPriorityToFrontend(priority: string): TaskPriority {
  const priorityMap: Record<string, TaskPriority> = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high',
    'urgent': 'critical',
  };
  return priorityMap[priority] || 'medium';
}

// Helper function to map frontend priority to backend priority
function mapFrontendPriorityToBackend(priority: TaskPriority): string {
  const priorityMap: Record<TaskPriority, string> = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high',
    'critical': 'urgent',
  };
  return priorityMap[priority] || 'medium';
}

// Helper function to convert API task to frontend task
function apiTaskToFrontend(apiTask: APITask, columnOrder: number = 0): Task {
  const metadata = apiTask.metadata || {};

  return {
    id: apiTask.id.toString(),
    title: apiTask.title,
    description: apiTask.description,
    status: mapBackendStatusToFrontend(apiTask.status),
    priority: mapBackendPriorityToFrontend(apiTask.priority),
    assigneeName: apiTask.assignee,
    dueDate: apiTask.due_date ? new Date(apiTask.due_date) : undefined,
    completedAt: apiTask.completed_at ? new Date(apiTask.completed_at) : undefined,
    createdAt: new Date(apiTask.created_at),
    updatedAt: new Date(apiTask.updated_at),
    dependencies: apiTask.dependencies ? apiTask.dependencies.map(d => d.toString()) : [],
    // Default values for frontend-only fields
    tags: metadata.tags || [],
    columnOrder,
    subtasks: metadata.subtasks,
    comments: metadata.comments,
    attachments: metadata.attachments,
    estimatedHours: metadata.estimatedHours,
    actualHours: metadata.actualHours,
    blockedReason: metadata.blockedReason,
  };
}

export const useTasksStore = create<TasksState>()(
  subscribeWithSelector(
    devtools(
      (set, get) => ({
      // Initial state
      tasks: [],
      filter: {},
      selectedTaskId: null,
      isCreating: false,
      isLoading: false,
      error: null,

      // Fetch tasks from API
      fetchTasks: async () => {
        set({ isLoading: true, error: null });
        try {
          const apiTasks = await tasksService.getAll();

          // Group tasks by status for column ordering
          const tasksByStatus: Record<string, number> = {};
          const frontendTasks = apiTasks.map((apiTask) => {
            const status = mapBackendStatusToFrontend(apiTask.status);
            const columnOrder = tasksByStatus[status] || 0;
            tasksByStatus[status] = columnOrder + 1;
            return apiTaskToFrontend(apiTask, columnOrder);
          });

          set({ tasks: frontendTasks, isLoading: false });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to fetch tasks';
          set({ error: message, isLoading: false });
          toast.error(message);
        }
      },

      addTask: async (taskData) => {
        set({ isLoading: true, error: null });
        try {
          const createDTO: CreateTaskDTO = {
            title: taskData.title,
            description: taskData.description,
            priority: mapFrontendPriorityToBackend(taskData.priority) as any,
            status: mapFrontendStatusToBackend(taskData.status) as any,
            due_date: taskData.dueDate?.toISOString(),
            assignee: taskData.assigneeName,
            metadata: {
              tags: taskData.tags,
              subtasks: taskData.subtasks,
              comments: taskData.comments,
              attachments: taskData.attachments,
              estimatedHours: taskData.estimatedHours,
              actualHours: taskData.actualHours,
              blockedReason: taskData.blockedReason,
            },
          };

          const apiTask = await tasksService.create(createDTO);
          const columnOrder = get().getTasksByStatus(taskData.status).length;
          const frontendTask = apiTaskToFrontend(apiTask, columnOrder);

          set((state) => ({
            tasks: [...state.tasks, frontendTask],
            isLoading: false,
          }));

          toast.success('Task created successfully');
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to create task';
          set({ error: message, isLoading: false });
          toast.error(message);
          throw error;
        }
      },

      updateTask: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          const currentTask = get().tasks.find((t) => t.id === id);
          if (!currentTask) {
            throw new Error('Task not found');
          }

          const updateDTO: UpdateTaskDTO = {
            title: updates.title,
            description: updates.description,
            priority: updates.priority
              ? (mapFrontendPriorityToBackend(updates.priority) as any)
              : undefined,
            status: updates.status
              ? (mapFrontendStatusToBackend(updates.status) as any)
              : undefined,
            due_date: updates.dueDate?.toISOString(),
            assignee: updates.assigneeName,
            metadata: {
              tags: updates.tags || currentTask.tags,
              subtasks: updates.subtasks || currentTask.subtasks,
              comments: updates.comments || currentTask.comments,
              attachments: updates.attachments || currentTask.attachments,
              estimatedHours: updates.estimatedHours || currentTask.estimatedHours,
              actualHours: updates.actualHours || currentTask.actualHours,
              blockedReason: updates.blockedReason || currentTask.blockedReason,
            },
          };

          const apiTask = await tasksService.update(parseInt(id), updateDTO);
          const frontendTask = apiTaskToFrontend(apiTask, currentTask.columnOrder);

          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? frontendTask : t)),
            isLoading: false,
          }));

          toast.success('Task updated successfully');
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to update task';
          set({ error: message, isLoading: false });
          toast.error(message);
          throw error;
        }
      },

      deleteTask: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await tasksService.delete(parseInt(id));

          set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== id),
            selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
            isLoading: false,
          }));

          toast.success('Task deleted successfully');
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to delete task';
          set({ error: message, isLoading: false });
          toast.error(message);
          throw error;
        }
      },

      moveTask: (taskId, newStatus, newOrder) => {
        set((state) => {
          const task = state.tasks.find((t) => t.id === taskId);
          if (!task) return state;

          // Update column orders for affected tasks
          const updatedTasks = state.tasks.map((t) => {
            if (t.id === taskId) {
              return { ...t, status: newStatus, columnOrder: newOrder, updatedAt: new Date() };
            }
            // Adjust orders in the target column
            if (t.status === newStatus && t.columnOrder >= newOrder && t.id !== taskId) {
              return { ...t, columnOrder: t.columnOrder + 1 };
            }
            // Adjust orders in the source column
            if (t.status === task.status && t.columnOrder > task.columnOrder) {
              return { ...t, columnOrder: t.columnOrder - 1 };
            }
            return t;
          });

          // Update task on backend asynchronously
          const updatedTask = updatedTasks.find((t) => t.id === taskId);
          if (updatedTask) {
            tasksService.update(parseInt(taskId), {
              status: mapFrontendStatusToBackend(newStatus) as any,
            }).catch((error) => {
              toast.error('Failed to update task status');
              console.error(error);
            });
          }

          return { tasks: updatedTasks };
        });
      },

      addSubtask: (taskId, subtaskData) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === taskId) {
              const newSubtask: Subtask = {
                ...subtaskData,
                id: `subtask-${Date.now()}`,
              };
              return {
                ...task,
                subtasks: [...(task.subtasks || []), newSubtask],
                updatedAt: new Date(),
              };
            }
            return task;
          }),
        }));
      },

      toggleSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                subtasks: task.subtasks?.map((sub) =>
                  sub.id === subtaskId
                    ? { ...sub, completed: !sub.completed, completedAt: !sub.completed ? new Date() : undefined }
                    : sub
                ),
                updatedAt: new Date(),
              };
            }
            return task;
          }),
        }));
      },

      deleteSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                subtasks: task.subtasks?.filter((sub) => sub.id !== subtaskId),
                updatedAt: new Date(),
              };
            }
            return task;
          }),
        }));
      },

      addComment: (taskId, commentData) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === taskId) {
              const newComment: TaskComment = {
                ...commentData,
                id: `comment-${Date.now()}`,
                createdAt: new Date(),
              };
              return {
                ...task,
                comments: [...(task.comments || []), newComment],
                updatedAt: new Date(),
              };
            }
            return task;
          }),
        }));
      },

      editComment: (taskId, commentId, text) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                comments: task.comments?.map((comment) =>
                  comment.id === commentId
                    ? { ...comment, text, editedAt: new Date() }
                    : comment
                ),
                updatedAt: new Date(),
              };
            }
            return task;
          }),
        }));
      },

      deleteComment: (taskId, commentId) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                comments: task.comments?.filter((comment) => comment.id !== commentId),
                updatedAt: new Date(),
              };
            }
            return task;
          }),
        }));
      },

      setFilter: (filter) => set({ filter }),
      clearFilter: () => set({ filter: {} }),
      selectTask: (id) => set({ selectedTaskId: id }),

      bulkUpdateStatus: (taskIds, status) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            taskIds.includes(task.id)
              ? { ...task, status, updatedAt: new Date() }
              : task
          ),
        }));
      },

      bulkDelete: (taskIds) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => !taskIds.includes(task.id)),
          selectedTaskId: taskIds.includes(state.selectedTaskId || '') ? null : state.selectedTaskId,
        }));
      },

      getTasksByStatus: (status) => {
        return get()
          .tasks.filter((task) => task.status === status)
          .sort((a, b) => a.columnOrder - b.columnOrder);
      },

      getFilteredTasks: () => {
        const { tasks, filter } = get();
        return tasks.filter((task) => {
          if (
            filter.search &&
            !task.title.toLowerCase().includes(filter.search.toLowerCase()) &&
            !task.description?.toLowerCase().includes(filter.search.toLowerCase())
          ) {
            return false;
          }
          if (filter.status && filter.status.length > 0 && !filter.status.includes(task.status)) {
            return false;
          }
          if (filter.priority && filter.priority.length > 0 && !filter.priority.includes(task.priority)) {
            return false;
          }
          if (
            filter.assigneeId &&
            filter.assigneeId.length > 0 &&
            (!task.assigneeId || !filter.assigneeId.includes(task.assigneeId))
          ) {
            return false;
          }
          if (filter.tags && filter.tags.length > 0 && !filter.tags.some((tag) => task.tags.includes(tag))) {
            return false;
          }
          if (filter.dueDateRange) {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            if (dueDate < filter.dueDateRange.start || dueDate > filter.dueDateRange.end) {
              return false;
            }
          }
          if (filter.projectId && task.projectId !== filter.projectId) {
            return false;
          }
          return true;
        });
      },

      getTaskById: (id) => {
        return get().tasks.find((task) => task.id === id);
      },

      getOverdueTasks: () => {
        const now = new Date();
        return get().tasks.filter(
          (task) => task.dueDate && new Date(task.dueDate) < now && task.status !== 'done'
        );
      },

      getTaskStats: () => {
        const tasks = get().tasks;
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

        const byStatus = tasks.reduce(
          (acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
          },
          {} as Record<TaskStatus, number>
        );

        const byPriority = tasks.reduce(
          (acc, task) => {
            acc[task.priority] = (acc[task.priority] || 0) + 1;
            return acc;
          },
          {} as Record<TaskPriority, number>
        );

        const overdue = tasks.filter(
          (task) => task.dueDate && new Date(task.dueDate) < now && task.status !== 'done'
        ).length;

        const dueToday = tasks.filter(
          (task) =>
            task.dueDate &&
            new Date(task.dueDate) >= todayStart &&
            new Date(task.dueDate) < todayEnd &&
            task.status !== 'done'
        ).length;

        const completed = byStatus.done || 0;
        const total = tasks.length;
        const completionRate = total > 0 ? (completed / total) * 100 : 0;

        return {
          total,
          byStatus,
          byPriority,
          overdue,
          dueToday,
          completed,
          completionRate,
        };
      },

      // Initialize WebSocket listeners
      initializeWebSocket: () => {
        // Listen for task created
        websocketClient.on('task:created', (data) => {
          const { task } = data;
          if (task) {
            const frontendTask: Task = {
              id: task.id?.toString() || '',
              title: task.title || '',
              description: task.description,
              status: (task.status as TaskStatus) || 'todo',
              priority: (task.priority as TaskPriority) || 'medium',
              tags: [],
              dueDate: task.due_date ? new Date(task.due_date) : undefined,
              createdAt: new Date(task.created_at || Date.now()),
              updatedAt: new Date(task.updated_at || Date.now()),
              columnOrder: 0,
            };

            set((state) => ({
              tasks: [...state.tasks, frontendTask],
            }));
            toast.success('New task added');
          }
        });

        // Listen for task updated
        websocketClient.on('task:updated', (data) => {
          const { task } = data;
          if (task) {
            const frontendTask: Task = {
              id: task.id?.toString() || '',
              title: task.title || '',
              description: task.description,
              status: (task.status as TaskStatus) || 'todo',
              priority: (task.priority as TaskPriority) || 'medium',
              tags: [],
              dueDate: task.due_date ? new Date(task.due_date) : undefined,
              createdAt: new Date(task.created_at || Date.now()),
              updatedAt: new Date(task.updated_at || Date.now()),
              columnOrder: 0,
            };

            set((state) => ({
              tasks: state.tasks.map((t) =>
                t.id === frontendTask.id ? frontendTask : t
              ),
            }));
            toast.success('Task updated');
          }
        });

        // Listen for task deleted
        websocketClient.on('task:deleted', (data) => {
          const { taskId } = data;
          if (taskId) {
            set((state) => ({
              tasks: state.tasks.filter((t) => t.id !== taskId.toString()),
              selectedTaskId:
                state.selectedTaskId === taskId.toString()
                  ? null
                  : state.selectedTaskId,
            }));
            toast.success('Task deleted');
          }
        });

        // Listen for task status changed
        websocketClient.on('task:status-changed', (data) => {
          const { taskId, newStatus } = data;
          if (taskId && newStatus) {
            set((state) => ({
              tasks: state.tasks.map((t) =>
                t.id === taskId.toString()
                  ? { ...t, status: newStatus as TaskStatus }
                  : t
              ),
            }));
            toast.success(`Task status changed to ${newStatus}`);
          }
        });
      },
      }),
      {
        name: 'tasks-store',
      }
    )
  )
);
