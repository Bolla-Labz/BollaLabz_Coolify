// Last Modified: 2025-11-23 17:30
import { api } from './client';
import { Conversation, Message } from '../../stores/conversationsStore';

// API endpoints for conversations
export const conversationsApi = {
  // Get all conversations
  getAll: async (params?: {
    search?: string;
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  }) => {
    return api.get<{ conversations: Conversation[]; total: number }>('/conversations', { params });
  },

  // Get single conversation
  getById: async (id: string) => {
    return api.get<Conversation>(`/conversations/${id}`);
  },

  // Get messages for a conversation
  getMessages: async (conversationId: string, params?: {
    page?: number;
    limit?: number;
    before?: string;
    after?: string;
  }) => {
    return api.get<{ messages: Message[]; hasMore: boolean }>(
      `/conversations/${conversationId}/messages`,
      { params }
    );
  },

  // Send a message
  sendMessage: async (conversationId: string, content: string, attachments?: File[]) => {
    const formData = new FormData();
    formData.append('content', content);

    if (attachments) {
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    return api.post<Message>(
      `/conversations/${conversationId}/messages`,
      formData,
      attachments ? {
        headers: { 'Content-Type': 'multipart/form-data' }
      } : undefined
    );
  },

  // Mark conversation as read
  markAsRead: async (id: string) => {
    return api.patch<Conversation>(`/conversations/${id}/read`);
  },

  // Pin/unpin conversation
  togglePin: async (id: string) => {
    return api.patch<Conversation>(`/conversations/${id}/pin`);
  },

  // Mute/unmute conversation
  toggleMute: async (id: string, duration?: number) => {
    return api.patch<Conversation>(`/conversations/${id}/mute`, { duration });
  },

  // Delete conversation
  delete: async (id: string) => {
    return api.delete(`/conversations/${id}`);
  },

  // Start new conversation
  create: async (contactId: string, initialMessage?: string) => {
    return api.post<Conversation>('/conversations', {
      contactId,
      initialMessage,
    });
  },

  // Search messages across all conversations
  searchMessages: async (query: string, params?: {
    conversationId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => {
    return api.get<{
      results: Array<{
        message: Message;
        conversation: Conversation;
        highlight: string;
      }>;
      total: number;
    }>('/conversations/search', {
      params: { query, ...params },
    });
  },

  // Get conversation statistics
  getStats: async () => {
    return api.get<{
      total: number;
      unread: number;
      today: number;
      thisWeek: number;
      thisMonth: number;
    }>('/conversations/stats');
  },

  // Report typing status
  sendTypingStatus: async (conversationId: string, isTyping: boolean) => {
    return api.post(`/conversations/${conversationId}/typing`, { isTyping });
  },

  // Get message delivery status
  getMessageStatus: async (conversationId: string, messageId: string) => {
    return api.get<{
      status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
      timestamp: string;
      error?: string;
    }>(`/conversations/${conversationId}/messages/${messageId}/status`);
  },

  // Retry failed message
  retryMessage: async (conversationId: string, messageId: string) => {
    return api.post<Message>(`/conversations/${conversationId}/messages/${messageId}/retry`);
  },
};