import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import type {
  Task,
  TaskStatus,
  TaskPriority,
  PaginatedResponse,
  SearchParams,
} from "@repo/types";
import { buildQueryString } from "../lib/api-client";

// API base URL - in production this would come from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// Extended search params for tasks
interface TaskSearchParams extends SearchParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  dueAfter?: string;
  dueBefore?: string;
  projectId?: string;
}

// Create task input
interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  projectId?: string;
  tags?: string[];
}

// Update task input
interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
}

// Query keys
export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (params: TaskSearchParams) => [...taskKeys.lists(), params] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  upcoming: () => [...taskKeys.all, "upcoming"] as const,
  overdue: () => [...taskKeys.all, "overdue"] as const,
};

// API functions with authentication
async function fetchTasks(
  token: string | null,
  params: TaskSearchParams
): Promise<PaginatedResponse<Task>> {
  if (!token) throw new Error("Authentication required");

  const queryString = buildQueryString(params);
  const response = await fetch(`${API_BASE_URL}/tasks${queryString}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  return response.json();
}

async function fetchTask(token: string | null, id: string): Promise<Task> {
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch task");
  }
  return response.json();
}

async function fetchUpcomingTasks(token: string | null, limit = 5): Promise<Task[]> {
  if (!token) throw new Error("Authentication required");

  const response = await fetch(
    `${API_BASE_URL}/tasks?sortBy=dueDate&sortOrder=asc&status=todo,in_progress&pageSize=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch upcoming tasks");
  }
  const data: PaginatedResponse<Task> = await response.json();
  return data.items;
}

async function fetchOverdueTasks(token: string | null): Promise<Task[]> {
  if (!token) throw new Error("Authentication required");

  const now = new Date().toISOString();
  const response = await fetch(
    `${API_BASE_URL}/tasks?dueBefore=${now}&status=todo,in_progress`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch overdue tasks");
  }
  const data: PaginatedResponse<Task> = await response.json();
  return data.items;
}

async function createTask(token: string | null, input: CreateTaskInput): Promise<Task> {
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to create task");
  }
  return response.json();
}

async function updateTask(token: string | null, input: UpdateTaskInput): Promise<Task> {
  if (!token) throw new Error("Authentication required");

  const { id, ...data } = input;
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update task");
  }
  return response.json();
}

async function deleteTask(token: string | null, id: string): Promise<void> {
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete task");
  }
}

async function toggleTaskComplete(token: string | null, id: string): Promise<Task> {
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_BASE_URL}/tasks/${id}/toggle-complete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to toggle task completion");
  }
  return response.json();
}

// Query hooks

/**
 * Fetch paginated list of tasks with search and filtering
 */
export function useTasks(params: TaskSearchParams = {}) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: async () => {
      const token = await getToken();
      return fetchTasks(token, params);
    },
  });
}

/**
 * Fetch a single task by ID
 */
export function useTask(id: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const token = await getToken();
      return fetchTask(token, id);
    },
    enabled: !!id,
  });
}

/**
 * Fetch upcoming tasks (for dashboard widget)
 */
export function useUpcomingTasks(limit = 5) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: taskKeys.upcoming(),
    queryFn: async () => {
      const token = await getToken();
      return fetchUpcomingTasks(token, limit);
    },
  });
}

/**
 * Fetch overdue tasks
 */
export function useOverdueTasks() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: taskKeys.overdue(),
    queryFn: async () => {
      const token = await getToken();
      return fetchOverdueTasks(token);
    },
  });
}

// Mutation hooks

/**
 * Create a new task
 */
export function useCreateTask() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const token = await getToken();
      return createTask(token, input);
    },
    onSuccess: () => {
      // Invalidate task lists to refetch
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: taskKeys.overdue() });
    },
  });
}

/**
 * Update an existing task
 */
export function useUpdateTask() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const token = await getToken();
      return updateTask(token, input);
    },
    onSuccess: (data) => {
      // Update the specific task in cache
      queryClient.setQueryData(taskKeys.detail(data.id), data);
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: taskKeys.overdue() });
    },
  });
}

/**
 * Delete a task
 */
export function useDeleteTask() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return deleteTask(token, id);
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: taskKeys.overdue() });
    },
  });
}

/**
 * Toggle task completion status
 */
export function useToggleTaskComplete() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return toggleTaskComplete(token, id);
    },
    onSuccess: (data) => {
      // Update the specific task in cache
      queryClient.setQueryData(taskKeys.detail(data.id), data);
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.upcoming() });
      queryClient.invalidateQueries({ queryKey: taskKeys.overdue() });
    },
    // Optimistic update
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });

      // Snapshot the previous value
      const previousTask = queryClient.getQueryData<Task>(taskKeys.detail(id));

      // Optimistically update to the new value
      if (previousTask) {
        queryClient.setQueryData(taskKeys.detail(id), {
          ...previousTask,
          status: previousTask.status === "done" ? "todo" : "done",
          completedAt:
            previousTask.status === "done" ? undefined : new Date().toISOString(),
        });
      }

      // Return context with the snapshotted value
      return { previousTask };
    },
    // If mutation fails, rollback to the previous value
    onError: (err, id, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(id), context.previousTask);
      }
    },
  });
}

// Utility functions

/**
 * Prefetch a task for better UX
 */
export function usePrefetchTask() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: taskKeys.detail(id),
      queryFn: async () => {
        const token = await getToken();
        return fetchTask(token, id);
      },
    });
  };
}
