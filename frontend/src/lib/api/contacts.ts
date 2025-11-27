// Last Modified: 2025-11-23 17:30
import { api } from './client';
import { Contact } from '../../stores/contactsStore';

// API endpoints for contacts
export const contactsApi = {
  // Get all contacts
  getAll: async (params?: {
    search?: string;
    tags?: string[];
    importance?: string[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    return api.get<{ contacts: Contact[]; total: number }>('/contacts', { params });
  },

  // Get single contact
  getById: async (id: string) => {
    return api.get<Contact>(`/contacts/${id}`);
  },

  // Create new contact
  create: async (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    return api.post<Contact>('/contacts', data);
  },

  // Update contact
  update: async (id: string, data: Partial<Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>>) => {
    return api.patch<Contact>(`/contacts/${id}`, data);
  },

  // Delete contact
  delete: async (id: string) => {
    return api.delete(`/contacts/${id}`);
  },

  // Bulk delete contacts
  bulkDelete: async (ids: string[]) => {
    return api.post('/contacts/bulk-delete', { ids });
  },

  // Import contacts from CSV
  import: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ imported: number; failed: number; errors?: string[] }>(
      '/contacts/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  // Export contacts to CSV
  export: async (ids?: string[]) => {
    return api.post('/contacts/export', { ids }, {
      responseType: 'blob',
    });
  },

  // Get relationship health stats
  getHealthStats: async () => {
    return api.get<{
      healthy: number;
      needsAttention: number;
      atRisk: number;
      total: number;
    }>('/contacts/health-stats');
  },

  // Update relationship score
  updateScore: async (id: string, score: number) => {
    return api.patch<Contact>(`/contacts/${id}/score`, { score });
  },

  // Add tag to contact
  addTag: async (id: string, tag: string) => {
    return api.post<Contact>(`/contacts/${id}/tags`, { tag });
  },

  // Remove tag from contact
  removeTag: async (id: string, tag: string) => {
    return api.delete<Contact>(`/contacts/${id}/tags/${tag}`);
  },

  // Get all unique tags
  getTags: async () => {
    return api.get<string[]>('/contacts/tags');
  },

  // Schedule follow-up
  scheduleFollowUp: async (id: string, date: string, notes?: string) => {
    return api.post<Contact>(`/contacts/${id}/follow-up`, { date, notes });
  },

  // Get contacts with upcoming follow-ups
  getUpcomingFollowUps: async (days: number = 7) => {
    return api.get<Contact[]>(`/contacts/follow-ups`, {
      params: { days },
    });
  },
};