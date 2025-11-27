// Last Modified: 2025-11-23 17:30
import { apiClient } from '@/lib/api/client';

// Backend API interface (from backend Workflow model)
export interface APIWorkflow {
  id: number;
  name: string;
  trigger_type: 'webhook' | 'schedule' | 'event' | 'manual';
  webhook_url?: string;
  conditions?: Record<string, any>;
  actions?: Record<string, any>;
  is_active: boolean;
  hit_count: number;
  last_triggered?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Frontend DTO for creating workflows
export interface CreateWorkflowDTO {
  name: string;
  trigger_type: 'webhook' | 'schedule' | 'event' | 'manual';
  webhook_url?: string;
  conditions?: Record<string, any>;
  actions?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Frontend DTO for updating workflows
export interface UpdateWorkflowDTO {
  name?: string;
  trigger_type?: 'webhook' | 'schedule' | 'event' | 'manual';
  webhook_url?: string;
  conditions?: Record<string, any>;
  actions?: Record<string, any>;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

// Workflow execution/trigger response
export interface WorkflowTriggerResponse {
  workflow_id: number;
  name: string;
  trigger_type: string;
  hit_count: number;
  last_triggered: string;
}

// Workflow statistics
export interface WorkflowStats {
  total_hits: number;
  last_triggered?: string;
  created_at: string;
  uptime_days: number;
}

// API Response interfaces
export interface WorkflowsResponse {
  success: boolean;
  data: APIWorkflow[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SingleWorkflowResponse {
  success: boolean;
  data: APIWorkflow;
}

export interface WorkflowTriggerApiResponse {
  success: boolean;
  message: string;
  data: WorkflowTriggerResponse;
}

export interface WorkflowStatsResponse {
  success: boolean;
  data: WorkflowStats;
}

class WorkflowsService {
  private baseUrl = '/v1/workflows';

  /**
   * Get all workflows with optional pagination
   */
  async getAll(page = 1, limit = 20): Promise<{ workflows: APIWorkflow[]; pagination?: any }> {
    const response = await apiClient.get<WorkflowsResponse>(this.baseUrl, {
      params: { page, limit },
    });
    return {
      workflows: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Get workflow by ID
   */
  async getById(id: number): Promise<APIWorkflow> {
    const response = await apiClient.get<SingleWorkflowResponse>(
      `${this.baseUrl}/${id}`
    );
    return response.data.data;
  }

  /**
   * Create new workflow
   */
  async create(data: CreateWorkflowDTO): Promise<APIWorkflow> {
    const response = await apiClient.post<SingleWorkflowResponse>(
      this.baseUrl,
      data
    );
    return response.data.data;
  }

  /**
   * Update existing workflow
   */
  async update(id: number, data: UpdateWorkflowDTO): Promise<APIWorkflow> {
    const response = await apiClient.put<SingleWorkflowResponse>(
      `${this.baseUrl}/${id}`,
      data
    );
    return response.data.data;
  }

  /**
   * Delete workflow
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Toggle workflow active status
   */
  async toggle(id: number, isActive: boolean): Promise<APIWorkflow> {
    return this.update(id, { is_active: isActive });
  }

  /**
   * Manually trigger a workflow
   */
  async trigger(id: number, payload?: Record<string, any>): Promise<WorkflowTriggerResponse> {
    const response = await apiClient.post<WorkflowTriggerApiResponse>(
      `${this.baseUrl}/${id}/trigger`,
      { payload }
    );
    return response.data.data;
  }

  /**
   * Get workflow statistics
   */
  async getStats(id: number): Promise<WorkflowStats> {
    const response = await apiClient.get<WorkflowStatsResponse>(
      `${this.baseUrl}/${id}/stats`
    );
    return response.data.data;
  }

  /**
   * Test webhook endpoint (validation only)
   */
  async testWebhook(url: string): Promise<boolean> {
    try {
      // Basic URL validation
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export const workflowsService = new WorkflowsService();
export default workflowsService;
