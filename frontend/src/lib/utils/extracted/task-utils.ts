// Last Modified: 2025-11-23 17:30
/**
 * Task Utilities
 * Helper functions for task management
 */

import { Task, TaskStatus, TaskPriority, TaskFilters } from '@/types/task';
import { isAfter, isBefore, isToday, startOfDay, endOfDay, addDays } from 'date-fns';

/**
 * Get color for task status
 */
export function getStatusColor(status: TaskStatus): string {
  const colors: Record<TaskStatus, string> = {
    todo: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    in_progress: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    done: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
  };

  return colors[status];
}

/**
 * Get label for task status
 */
export function getStatusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    todo: 'To do',
    in_progress: 'In progress',
    done: 'Done',
    cancelled: 'Cancelled'
  };

  return labels[status];
}

/**
 * Get color for task priority
 */
export function getPriorityColor(priority: TaskPriority): string {
  const colors: Record<TaskPriority, string> = {
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    high: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
  };

  return colors[priority];
}

/**
 * Get label for task priority
 */
export function getPriorityLabel(priority: TaskPriority): string {
  const labels: Record<TaskPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent'
  };

  return labels[priority];
}

/**
 * Get border color for priority indicator
 */
export function getPriorityBorderColor(priority: TaskPriority): string {
  const colors: Record<TaskPriority, string> = {
    low: 'border-l-gray-400',
    medium: 'border-l-blue-500',
    high: 'border-l-yellow-500',
    urgent: 'border-l-red-500'
  };

  return colors[priority];
}

/**
 * Check if task is overdue
 */
export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'done' || task.status === 'cancelled') {
    return false;
  }

  return isAfter(new Date(), endOfDay(task.dueDate));
}

/**
 * Check if task is due today
 */
export function isTaskDueToday(task: Task): boolean {
  if (!task.dueDate) return false;
  return isToday(task.dueDate);
}

/**
 * Check if task is due this week
 */
export function isTaskDueThisWeek(task: Task): boolean {
  if (!task.dueDate) return false;

  const today = new Date();
  const weekEnd = addDays(today, 7);

  return isAfter(task.dueDate, today) && isBefore(task.dueDate, weekEnd);
}

/**
 * Filter tasks based on criteria
 */
export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  let filtered = [...tasks];

  // Filter by status
  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter(task => filters.status!.includes(task.status));
  }

  // Filter by priority
  if (filters.priority && filters.priority.length > 0) {
    filtered = filtered.filter(task => filters.priority!.includes(task.priority));
  }

  // Filter by assignee
  if (filters.assigneeId && filters.assigneeId.length > 0) {
    filtered = filtered.filter(task => task.assigneeId && filters.assigneeId!.includes(task.assigneeId));
  }

  // Filter by category
  if (filters.category && filters.category.length > 0) {
    filtered = filtered.filter(task => task.category && filters.category!.includes(task.category));
  }

  // Filter by due date range
  if (filters.dueDateRange) {
    filtered = filtered.filter(task => {
      if (!task.dueDate) return false;
      return (
        isAfter(task.dueDate, filters.dueDateRange!.start) &&
        isBefore(task.dueDate, filters.dueDateRange!.end)
      );
    });
  }

  // Filter by search term
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(task =>
      task.title.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.category?.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
}

/**
 * Sort tasks by priority (urgent first)
 */
export function sortByPriority(tasks: Task[]): Task[] {
  const priorityOrder: Record<TaskPriority, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3
  };

  return [...tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Sort tasks by due date
 */
export function sortByDueDate(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });
}

/**
 * Group tasks by status
 */
export function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const grouped: Record<TaskStatus, Task[]> = {
    todo: [],
    in_progress: [],
    done: [],
    cancelled: []
  };

  tasks.forEach(task => {
    grouped[task.status].push(task);
  });

  return grouped;
}

/**
 * Calculate task completion percentage
 */
export function calculateCompletionRate(tasks: Task[]): number {
  if (tasks.length === 0) return 0;

  const completed = tasks.filter(task => task.status === 'done').length;
  return Math.round((completed / tasks.length) * 100);
}

/**
 * Get tasks due soon (next 3 days)
 */
export function getTasksDueSoon(tasks: Task[]): Task[] {
  const today = startOfDay(new Date());
  const threeDaysFromNow = endOfDay(addDays(today, 3));

  return tasks.filter(task => {
    if (!task.dueDate || task.status === 'done' || task.status === 'cancelled') {
      return false;
    }

    return isAfter(task.dueDate, today) && isBefore(task.dueDate, threeDaysFromNow);
  });
}

/**
 * Get overdue tasks
 */
export function getOverdueTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => isTaskOverdue(task));
}

/**
 * Calculate time estimate display
 */
export function formatTimeEstimate(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}
