// Last Modified: 2025-11-23 17:30
/**
 * Backend Integration Adapter
 * Connects the frontend to the existing BollaLabz backend
 * Handles field mapping, authentication, and API transformations
 */

import { io, Socket } from 'socket.io-client';

// Types matching backend responses
interface BackendUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  settings?: Record<string, any>;
  lastLoginAt?: string;
}

interface BackendPhoneContact {
  id: number;
  phoneNumber: string;
  name?: string;
  email?: string;
  totalInteractions: number;
  totalSpend: string;
  lastContactedAt?: string;
  context?: {
    tags?: string[];
    notes?: string;
    priority?: string;
  };
  preferences?: Record<string, any>;
  assignedAgentId?: string;
}

interface BackendAgent {
  id: string;
  name: string;
  description?: string;
  phoneNumber?: string;
  systemPrompt: string;
  type: 'voice' | 'sms' | 'chat' | 'hybrid';
  isActive: boolean;
  configuration: Record<string, any>;
  metadata: {
    totalCalls?: number;
    totalMessages?: number;
    totalCost?: number;
    averageRating?: number;
  };
}

interface BackendConversation {
  id: number;
  phoneContactId: number;
  messages: BackendMessage[];
  startedAt: string;
  lastMessageAt: string;
}

interface BackendMessage {
  id: number;
  message: string;
  direction: 'inbound' | 'outbound';
  provider: string;
  messageType: string;
  status: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export class BollaLabzBackendAPI {
  private baseURL: string;
  private socket: Socket | null = null;
  private csrfToken: string | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
  }

  // ============================================
  // CSRF Token Management
  // ============================================

  private async getCsrfToken(): Promise<string> {
    if (this.csrfToken) return this.csrfToken;

    try {
      const response = await fetch(`${this.baseURL}/csrf-token`, {
        credentials: 'include'
      });
      const data = await response.json();
      this.csrfToken = data.token;
      return data.token;
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      return '';
    }
  }

  // ============================================
  // HTTP Request Helpers
  // ============================================

  private async request(
    path: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.baseURL}${path}`;

    // Add CSRF token for state-changing operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET')) {
      const token = await this.getCsrfToken();
      options.headers = {
        ...options.headers,
        'X-CSRF-Token': token
      };
    }

    return fetch(url, {
      ...options,
      credentials: 'include', // Always include cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }

  // ============================================
  // Data Transformation Helpers
  // ============================================

  private transformUser(backend: BackendUser): any {
    return {
      id: backend.id,
      email: backend.email,
      name: backend.name,
      displayName: backend.name,
      role: backend.role,
      active: backend.isActive,
      settings: backend.settings || {},
      lastLogin: backend.lastLoginAt
    };
  }

  private transformContact(backend: BackendPhoneContact): any {
    return {
      id: backend.id,
      name: backend.name || 'Unknown Contact',
      phone: backend.phoneNumber,
      email: backend.email || '',
      interactionCount: backend.totalInteractions,
      totalSpend: parseFloat(backend.totalSpend || '0'),
      lastInteraction: backend.lastContactedAt,
      tags: backend.context?.tags || [],
      notes: backend.context?.notes || '',
      priority: backend.context?.priority || 'normal',
      assignedAgent: backend.assignedAgentId || null
    };
  }

  private transformAgent(backend: BackendAgent): any {
    return {
      id: backend.id,
      name: backend.name,
      description: backend.description,
      phone: backend.phoneNumber,
      instructions: backend.systemPrompt,
      type: backend.type,
      active: backend.isActive,
      settings: backend.configuration,
      stats: {
        callCount: backend.metadata.totalCalls || 0,
        messageCount: backend.metadata.totalMessages || 0,
        totalCost: backend.metadata.totalCost || 0,
        rating: backend.metadata.averageRating || 0
      }
    };
  }

  private transformConversation(backend: BackendConversation): any {
    return {
      id: backend.id,
      contactId: backend.phoneContactId,
      messages: backend.messages.map(m => this.transformMessage(m)),
      startedAt: backend.startedAt,
      lastMessageAt: backend.lastMessageAt,
      messageCount: backend.messages.length
    };
  }

  private transformMessage(backend: BackendMessage): any {
    return {
      id: backend.id,
      content: backend.message,
      direction: backend.direction,
      type: backend.messageType,
      status: backend.status,
      timestamp: backend.createdAt,
      provider: backend.provider,
      metadata: backend.metadata
    };
  }

  // ============================================
  // Public Generic API Request Method
  // ============================================

  /**
   * Generic API request method for store adapters
   * Accepts object-style configuration for flexible API calls
   */
  async apiRequest<T = any>(config: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    endpoint: string;
    params?: Record<string, any>;
    data?: any;
  }): Promise<T> {
    const { method, endpoint, params, data } = config;

    // Build query string from params
    let path = endpoint;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        path += `?${queryString}`;
      }
    }

    // Build request options
    const options: RequestInit = {
      method
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    // Make the request
    const response = await this.request(path, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API request failed: ${response.status}`);
    }

    return await response.json();
  }

  // ============================================
  // Authentication API
  // ============================================

  async register(data: {
    email: string;
    password: string;
    name: string;
  }) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Registration failed');
    }

    // Start token refresh timer
    this.startTokenRefreshTimer();

    return {
      success: true,
      user: this.transformUser(result.user)
    };
  }

  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Login failed');
    }

    // Start token refresh timer
    this.startTokenRefreshTimer();

    // Connect WebSocket after successful login
    this.connectWebSocket();

    return {
      success: true,
      user: this.transformUser(result.user)
    };
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST'
      });
    } finally {
      this.disconnectWebSocket();
      this.stopTokenRefreshTimer();
      this.csrfToken = null;
    }
  }

  async getCurrentUser() {
    const response = await this.request('/auth/me');

    if (!response.ok) {
      throw new Error('Not authenticated');
    }

    const result = await response.json();
    return this.transformUser(result.user);
  }

  async refreshToken() {
    const response = await this.request('/auth/refresh', {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return { success: true };
  }

  // ============================================
  // Token Refresh Management
  // ============================================

  private startTokenRefreshTimer() {
    this.stopTokenRefreshTimer();

    // Refresh token every 10 minutes (before 15-minute expiry)
    this.refreshTimer = setInterval(async () => {
      try {
        await this.refreshToken();
        console.log('Token refreshed successfully');
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Optionally trigger re-login flow
      }
    }, 10 * 60 * 1000); // 10 minutes
  }

  private stopTokenRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // ============================================
  // Contacts API
  // ============================================

  async getContacts(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const response = await this.request(`/numbers?${queryParams}`);

    if (!response.ok) {
      throw new Error('Failed to fetch contacts');
    }

    const result = await response.json();

    // Handle paginated or non-paginated response
    if (Array.isArray(result)) {
      return result.map(c => this.transformContact(c));
    } else if (result.data && Array.isArray(result.data)) {
      return {
        ...result,
        data: result.data.map(c => this.transformContact(c))
      };
    }

    return [];
  }

  async getContact(id: string | number) {
    const response = await this.request(`/numbers/${id}`);

    if (!response.ok) {
      throw new Error('Contact not found');
    }

    const result = await response.json();
    return this.transformContact(result);
  }

  async assignContactToAgent(contactId: string | number, agentId: string) {
    const response = await this.request(`/numbers/${contactId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ agentId })
    });

    if (!response.ok) {
      throw new Error('Failed to assign contact');
    }

    return { success: true };
  }

  // ============================================
  // Agents API
  // ============================================

  async getAgents(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await this.request(`/agents?${queryParams}`);

    if (!response.ok) {
      throw new Error('Failed to fetch agents');
    }

    const result = await response.json();

    if (Array.isArray(result)) {
      return result.map(a => this.transformAgent(a));
    } else if (result.data && Array.isArray(result.data)) {
      return {
        ...result,
        data: result.data.map(a => this.transformAgent(a))
      };
    }

    return [];
  }

  async getAgent(id: string) {
    const response = await this.request(`/agents/${id}`);

    if (!response.ok) {
      throw new Error('Agent not found');
    }

    const result = await response.json();
    return this.transformAgent(result);
  }

  async createAgent(data: {
    name: string;
    description?: string;
    systemPrompt: string;
    type: 'voice' | 'sms' | 'chat' | 'hybrid';
    configuration?: Record<string, any>;
  }) {
    const response = await this.request('/agents', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to create agent');
    }

    const result = await response.json();
    return this.transformAgent(result);
  }

  async updateAgent(id: string, data: Partial<{
    name: string;
    description: string;
    systemPrompt: string;
    configuration: Record<string, any>;
  }>) {
    const response = await this.request(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to update agent');
    }

    const result = await response.json();
    return this.transformAgent(result);
  }

  async toggleAgent(id: string, active: boolean) {
    const response = await this.request(`/agents/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: active })
    });

    if (!response.ok) {
      throw new Error('Failed to toggle agent');
    }

    return { success: true };
  }

  async getAgentStatistics(id: string) {
    const response = await this.request(`/agents/${id}/statistics`);

    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }

    return await response.json();
  }

  // ============================================
  // Conversations API
  // ============================================

  async getConversations(params?: {
    contactId?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.contactId) queryParams.append('contactId', params.contactId.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await this.request(`/conversations?${queryParams}`);

    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }

    const result = await response.json();

    if (Array.isArray(result)) {
      return result.map(c => this.transformConversation(c));
    }

    return [];
  }

  async getConversation(id: string | number) {
    const response = await this.request(`/conversations/${id}`);

    if (!response.ok) {
      throw new Error('Conversation not found');
    }

    const result = await response.json();
    return this.transformConversation(result);
  }

  async getConversationMessages(id: string | number) {
    const response = await this.request(`/conversations/${id}/messages`);

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    const result = await response.json();
    return result.map(m => this.transformMessage(m));
  }

  // ============================================
  // Metrics API
  // ============================================

  async getMetricsSummary(timeWindow?: string) {
    const queryParams = new URLSearchParams();
    if (timeWindow) queryParams.append('timeWindow', timeWindow);

    const response = await this.request(`/metrics/summary?${queryParams}`);

    if (!response.ok) {
      throw new Error('Failed to fetch metrics');
    }

    return await response.json();
  }

  async getDashboardData() {
    try {
      // Aggregate data from multiple endpoints for dashboard
      const [metrics, contacts, conversations] = await Promise.all([
        this.getMetricsSummary('24h'),
        this.getContacts({ limit: 10 }),
        this.getConversations({ limit: 5 })
      ]);

      return {
        totalContacts: metrics.totalContacts || contacts.length,
        activeConversations: metrics.activeConversations || conversations.length,
        todaysCalls: metrics.todaysCalls || 0,
        totalSpend: metrics.totalSpend || 0,
        recentActivity: [
          ...conversations.map(c => ({
            type: 'conversation',
            timestamp: c.lastMessageAt,
            description: `Conversation with contact ${c.contactId}`,
            data: c
          }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      };
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to load dashboard data');
    }
  }

  // ============================================
  // WebSocket Integration
  // ============================================

  connectWebSocket() {
    if (this.socket?.connected) return;

    const wsURL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

    this.socket = io(wsURL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Handle token expiration
    this.socket.on('token-expiring-soon', async () => {
      console.log('Token expiring soon, refreshing...');
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }
    });

    this.socket.on('token-expired', () => {
      console.log('Token expired, user needs to re-login');
      // Trigger re-login flow in your app
      window.dispatchEvent(new CustomEvent('auth:token-expired'));
    });
  }

  disconnectWebSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Subscribe to conversation updates
  subscribeToConversation(conversationId: string | number) {
    this.socket?.emit('join-conversation', { conversationId });
  }

  unsubscribeFromConversation(conversationId: string | number) {
    this.socket?.emit('leave-conversation', { conversationId });
  }

  // WebSocket event listeners
  onConversationUpdate(callback: (data: any) => void) {
    this.socket?.on('conversation-update', callback);
  }

  onMessageReceived(callback: (data: any) => void) {
    this.socket?.on('message-received', callback);
  }

  onCallStatusChange(callback: (data: any) => void) {
    this.socket?.on('call-status-change', callback);
  }

  onAgentStatusChange(callback: (data: any) => void) {
    this.socket?.on('agent-status-change', callback);
  }

  // Cleanup method
  dispose() {
    this.disconnectWebSocket();
    this.stopTokenRefreshTimer();
    this.csrfToken = null;
  }
}

// Export singleton instance
export const backendAPI = new BollaLabzBackendAPI();