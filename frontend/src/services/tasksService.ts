// Last Modified: 2025-11-23 17:30
import { apiClient } from '@/lib/api/client';

// Backend API interface (from backend Task model)
export interface APITask {
  id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignee?: string;
  due_date?: string;
  dependencies?: number[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// Frontend DTO for creating tasks
export interface CreateTaskDTO {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignee?: string;
  due_date?: string;
  dependencies?: number[];
  metadata?: Record<string, any>;
}

// Frontend DTO for updating tasks
export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignee?: string;
  due_date?: string;
  dependencies?: number[];
  metadata?: Record<string, any>;
}

// API Response interfaces
export interface TasksResponse {
  success: boolean;
  data: APITask[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SingleTaskResponse {
  success: boolean;
  data: APITask;
}

class TasksService {
  private baseUrl = '/v1/tasks';

  async getAll(): Promise<APITask[]> {
    const response = await apiClient.get<TasksResponse>(this.baseUrl);
    return response.data.data;
  }

  async getById(id: number): Promise<APITask> {
    const response = await apiClient.get<SingleTaskResponse>(
      `${this.baseUrl}/${id}`
    );
    return response.data.data;
  }

  async create(data: CreateTaskDTO): Promise<APITask> {
    const response = await apiClient.post<SingleTaskResponse>(
      this.baseUrl,
      data
    );
    return response.data.data;
  }

  async update(id: number, data: UpdateTaskDTO): Promise<APITask> {
    const response = await apiClient.put<SingleTaskResponse>(
      `${this.baseUrl}/${id}`,
      data
    );
    return response.data.data;
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async search(query: string): Promise<APITask[]> {
    const response = await apiClient.get<TasksResponse>(this.baseUrl, {
      params: { search: query },
    });
    return response.data.data;
  }
}

export const tasksService = new TasksService();
export default tasksService;
