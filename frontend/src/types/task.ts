// Last Modified: 2025-11-23 17:30
/**
 * Task Type Definitions
 *
 * Types for tasks, to-do lists, and task management
 */

export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  completedAt?: Date;
  assignee?: string;
  assigneeId?: string;
  category?: string;
  tags: string[];
  parentTaskId?: string;
  subtasks?: Task[];
  dependencies?: string[];
  estimatedTime?: number;
  estimatedMinutes?: number;
  actualTime?: number;
  attachments?: TaskAttachment[];
  reminders?: Date[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  assignee?: string;
  assigneeId?: string;
  category?: string;
  tags?: string[];
  parentTaskId?: string;
  dependencies?: string[];
  estimatedTime?: number;
  estimatedMinutes?: number;
  reminders?: Date[];
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
  completedAt?: Date;
  actualTime?: number;
}

export interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  assignee?: string;
  assigneeId?: string;
  category?: string;
  tags?: string[];
  dueDateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
  search?: string;
  hasSubtasks?: boolean;
  isOverdue?: boolean;
}

export interface TaskStats {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  overdue: number;
  dueToday?: number;
  dueThisWeek?: number;
  completedThisWeek: number;
  completedThisMonth: number;
  avgCompletionTime?: number;
}
