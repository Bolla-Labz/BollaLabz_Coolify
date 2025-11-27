// Last Modified: 2025-11-23 17:30
/**
 * Store API Adapter
 * Connects extracted Zustand stores to our backend API
 * Maps their API calls to our backend integration
 */

import { backendAPI } from './backend-integration';
import type {
  CostEntry,
  CostSummary,
  SpendingTrendDataPoint,
  BudgetAlert,
  BudgetThreshold,
  ResourceCostStats,
  MonthlyBudget,
} from '@/types/finance';

/**
 * Finance API Adapter
 * Maps finance store API calls to our backend
 */
export const financeAPI = {
  // Cost Entries
  async getCostEntries(filters?: any): Promise<{ data: CostEntry[] }> {
    try {
      const response = await backendAPI.apiRequest({
        method: 'GET',
        endpoint: '/api/v1/finance/costs',
        params: filters,
      });
      return { data: response.costs || [] };
    } catch (error) {
      console.error('Failed to fetch cost entries:', error);
      return { data: [] };
    }
  },

  async createCostEntry(entry: Omit<CostEntry, 'id'>): Promise<{ data: CostEntry }> {
    const response = await backendAPI.apiRequest({
      method: 'POST',
      endpoint: '/api/v1/finance/costs',
      data: entry,
    });
    return { data: response };
  },

  async updateCostEntry(id: string, updates: Partial<CostEntry>): Promise<{ data: CostEntry }> {
    const response = await backendAPI.apiRequest({
      method: 'PUT',
      endpoint: `/api/v1/finance/costs/${id}`,
      data: updates,
    });
    return { data: response };
  },

  async deleteCostEntry(id: string): Promise<boolean> {
    await backendAPI.apiRequest({
      method: 'DELETE',
      endpoint: `/api/v1/finance/costs/${id}`,
    });
    return true;
  },

  // Summary and Analytics
  async getCostSummary(period?: { start: Date; end: Date }): Promise<{ data: CostSummary }> {
    const response = await backendAPI.apiRequest({
      method: 'GET',
      endpoint: '/api/v1/finance/summary',
      params: period ? {
        startDate: period.start.toISOString(),
        endDate: period.end.toISOString(),
      } : undefined,
    });
    return { data: response };
  },

  async getSpendingTrends(period?: { start: Date; end: Date }): Promise<{ data: SpendingTrendDataPoint[] }> {
    const response = await backendAPI.apiRequest({
      method: 'GET',
      endpoint: '/api/v1/finance/trends',
      params: period ? {
        startDate: period.start.toISOString(),
        endDate: period.end.toISOString(),
      } : undefined,
    });
    return { data: response.trends || [] };
  },

  // Budget Management
  async getBudgetAlerts(): Promise<{ data: BudgetAlert[] }> {
    const response = await backendAPI.apiRequest({
      method: 'GET',
      endpoint: '/api/v1/finance/alerts',
    });
    return { data: response.alerts || [] };
  },

  async getBudgetThresholds(): Promise<{ data: BudgetThreshold[] }> {
    const response = await backendAPI.apiRequest({
      method: 'GET',
      endpoint: '/api/v1/finance/thresholds',
    });
    return { data: response.thresholds || [] };
  },

  async createBudgetThreshold(threshold: Omit<BudgetThreshold, 'id'>): Promise<{ data: BudgetThreshold }> {
    const response = await backendAPI.apiRequest({
      method: 'POST',
      endpoint: '/api/v1/finance/thresholds',
      data: threshold,
    });
    return { data: response };
  },

  async updateBudgetThreshold(id: string, updates: Partial<BudgetThreshold>): Promise<{ data: BudgetThreshold }> {
    const response = await backendAPI.apiRequest({
      method: 'PUT',
      endpoint: `/api/v1/finance/thresholds/${id}`,
      data: updates,
    });
    return { data: response };
  },

  async deleteBudgetThreshold(id: string): Promise<boolean> {
    await backendAPI.apiRequest({
      method: 'DELETE',
      endpoint: `/api/v1/finance/thresholds/${id}`,
    });
    return true;
  },

  // Resource Stats
  async getResourceStats(period?: { start: Date; end: Date }): Promise<{ data: ResourceCostStats[] }> {
    const response = await backendAPI.apiRequest({
      method: 'GET',
      endpoint: '/api/v1/finance/resource-stats',
      params: period ? {
        startDate: period.start.toISOString(),
        endDate: period.end.toISOString(),
      } : undefined,
    });
    return { data: response.stats || [] };
  },

  // Monthly Budgets
  async getMonthlyBudgets(year: number): Promise<{ data: MonthlyBudget[] }> {
    const response = await backendAPI.apiRequest({
      method: 'GET',
      endpoint: `/api/v1/finance/budgets/${year}`,
    });
    return { data: response.budgets || [] };
  },

  async setMonthlyBudget(year: number, month: number, amount: number): Promise<boolean> {
    await backendAPI.apiRequest({
      method: 'PUT',
      endpoint: `/api/v1/finance/budgets/${year}/${month}`,
      data: { amount },
    });
    return true;
  },
};

/**
 * People API Adapter
 * Maps people store API calls to our backend
 */
export const peopleAPI = {
  async getContacts(filters?: any): Promise<{ data: any[] }> {
    const contacts = await backendAPI.getContacts();
    return { data: contacts };
  },

  async createContact(contact: any): Promise<{ data: any }> {
    const response = await backendAPI.apiRequest({
      method: 'POST',
      endpoint: '/api/v1/people',
      data: contact,
    });
    return { data: response };
  },

  async updateContact(id: string, updates: any): Promise<{ data: any }> {
    const response = await backendAPI.apiRequest({
      method: 'PUT',
      endpoint: `/api/v1/people/${id}`,
      data: updates,
    });
    return { data: response };
  },

  async deleteContact(id: string): Promise<boolean> {
    await backendAPI.apiRequest({
      method: 'DELETE',
      endpoint: `/api/v1/people/${id}`,
    });
    return true;
  },

  async getInteractions(contactId?: string): Promise<{ data: any[] }> {
    const response = await backendAPI.apiRequest({
      method: 'GET',
      endpoint: '/api/v1/people/interactions',
      params: contactId ? { contactId } : undefined,
    });
    return { data: response.interactions || [] };
  },
};

/**
 * Tasks API Adapter
 * Maps task store API calls to our backend
 */
export const tasksAPI = {
  async getTasks(filters?: any): Promise<{ data: any[] }> {
    const response = await backendAPI.apiRequest({
      method: 'GET',
      endpoint: '/api/v1/tasks',
      params: filters,
    });
    return { data: response.tasks || [] };
  },

  async createTask(task: any): Promise<{ data: any }> {
    const response = await backendAPI.apiRequest({
      method: 'POST',
      endpoint: '/api/v1/tasks',
      data: task,
    });
    return { data: response };
  },

  async updateTask(id: string, updates: any): Promise<{ data: any }> {
    const response = await backendAPI.apiRequest({
      method: 'PUT',
      endpoint: `/api/v1/tasks/${id}`,
      data: updates,
    });
    return { data: response };
  },

  async deleteTask(id: string): Promise<boolean> {
    await backendAPI.apiRequest({
      method: 'DELETE',
      endpoint: `/api/v1/tasks/${id}`,
    });
    return true;
  },

  async updateTaskStatus(id: string, status: string): Promise<{ data: any }> {
    const response = await backendAPI.apiRequest({
      method: 'PATCH',
      endpoint: `/api/v1/tasks/${id}/status`,
      data: { status },
    });
    return { data: response };
  },
};

/**
 * Schedule API Adapter
 * Maps schedule store API calls to our backend
 */
export const scheduleAPI = {
  async getEvents(filters?: any): Promise<{ data: any[] }> {
    const response = await backendAPI.apiRequest({
      method: 'GET',
      endpoint: '/api/v1/schedule/events',
      params: filters,
    });
    return { data: response.events || [] };
  },

  async createEvent(event: any): Promise<{ data: any }> {
    const response = await backendAPI.apiRequest({
      method: 'POST',
      endpoint: '/api/v1/schedule/events',
      data: event,
    });
    return { data: response };
  },

  async updateEvent(id: string, updates: any): Promise<{ data: any }> {
    const response = await backendAPI.apiRequest({
      method: 'PUT',
      endpoint: `/api/v1/schedule/events/${id}`,
      data: updates,
    });
    return { data: response };
  },

  async deleteEvent(id: string): Promise<boolean> {
    await backendAPI.apiRequest({
      method: 'DELETE',
      endpoint: `/api/v1/schedule/events/${id}`,
    });
    return true;
  },
};

/**
 * Webhooks API Adapter
 * Maps webhook store API calls to our backend
 */
export const webhooksAPI = {
  async getWebhooks(): Promise<{ data: any[] }> {
    const response = await backendAPI.apiRequest({
      method: 'GET',
      endpoint: '/api/v1/webhooks',
    });
    return { data: response.webhooks || [] };
  },

  async createWebhook(webhook: any): Promise<{ data: any }> {
    const response = await backendAPI.apiRequest({
      method: 'POST',
      endpoint: '/api/v1/webhooks',
      data: webhook,
    });
    return { data: response };
  },

  async updateWebhook(id: string, updates: any): Promise<{ data: any }> {
    const response = await backendAPI.apiRequest({
      method: 'PUT',
      endpoint: `/api/v1/webhooks/${id}`,
      data: updates,
    });
    return { data: response };
  },

  async deleteWebhook(id: string): Promise<boolean> {
    await backendAPI.apiRequest({
      method: 'DELETE',
      endpoint: `/api/v1/webhooks/${id}`,
    });
    return true;
  },

  async testWebhook(id: string): Promise<{ success: boolean; response?: any }> {
    const response = await backendAPI.apiRequest({
      method: 'POST',
      endpoint: `/api/v1/webhooks/${id}/test`,
    });
    return response;
  },
};

/**
 * Notes API Adapter
 * Maps notes store API calls to our backend
 */
export const notesAPI = {
  async getNotes(filters?: any): Promise<{ data: any[] }> {
    const response = await backendAPI.apiRequest({
      method: 'GET',
      endpoint: '/api/v1/notes',
      params: filters,
    });
    return { data: response.notes || [] };
  },

  async createNote(note: any): Promise<{ data: any }> {
    const response = await backendAPI.apiRequest({
      method: 'POST',
      endpoint: '/api/v1/notes',
      data: note,
    });
    return { data: response };
  },

  async updateNote(id: string, updates: any): Promise<{ data: any }> {
    const response = await backendAPI.apiRequest({
      method: 'PUT',
      endpoint: `/api/v1/notes/${id}`,
      data: updates,
    });
    return { data: response };
  },

  async deleteNote(id: string): Promise<boolean> {
    await backendAPI.apiRequest({
      method: 'DELETE',
      endpoint: `/api/v1/notes/${id}`,
    });
    return true;
  },
};

/**
 * Dashboard API Adapter
 * Maps dashboard store API calls to our backend
 */
export const dashboardAPI = {
  async getDashboardData(): Promise<{ data: any }> {
    const response = await backendAPI.apiRequest({
      method: 'GET',
      endpoint: '/api/v1/dashboard',
    });
    return { data: response };
  },

  async getAnalytics(type: string, period?: { start: Date; end: Date }): Promise<{ data: any }> {
    const response = await backendAPI.apiRequest({
      method: 'GET',
      endpoint: `/api/v1/dashboard/analytics/${type}`,
      params: period ? {
        startDate: period.start.toISOString(),
        endDate: period.end.toISOString(),
      } : undefined,
    });
    return { data: response };
  },
};

/**
 * Export all API adapters for easy import
 */
export const storeAPIs = {
  finance: financeAPI,
  people: peopleAPI,
  tasks: tasksAPI,
  schedule: scheduleAPI,
  webhooks: webhooksAPI,
  notes: notesAPI,
  dashboard: dashboardAPI,
};

export default storeAPIs;