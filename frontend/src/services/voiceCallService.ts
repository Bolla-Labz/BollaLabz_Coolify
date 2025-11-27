// Last Modified: 2025-11-23 17:30
/**
 * Voice Call Service
 * API client for Vapi voice calls
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface VoiceCall {
  id: string;
  callId: string;
  phoneNumber: string;
  contactName?: string;
  direction: 'inbound' | 'outbound';
  status: 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'failed';
  transcript?: string;
  duration?: number;
  cost?: number;
  currency?: string;
  createdAt: string;
  metadata?: {
    vapiCallId?: string;
    callStatus?: string;
    liveTranscript?: {
      transcript: string;
      speaker: string;
      timestamp: string;
    };
  };
}

export interface CallCostStats {
  totalCalls: number;
  totalCost: number;
  avgCostPerCall: number;
  minCost: number;
  maxCost: number;
  totalDurationSeconds: number;
  totalDurationMinutes: string;
  currency: string;
}

class VoiceCallService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/v1/calls/voice`;
  }

  /**
   * Initiate outbound call
   */
  async initiateCall(phoneNumber: string, assistantId?: string): Promise<VoiceCall> {
    const response = await fetch(`${this.baseUrl}/outbound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        assistantId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to initiate call');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * List all voice calls
   */
  async listCalls(params?: {
    page?: number;
    limit?: number;
    contactId?: number;
    status?: string;
  }): Promise<{
    calls: VoiceCall[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.contactId) queryParams.append('contactId', params.contactId.toString());
    if (params?.status) queryParams.append('status', params.status);

    const response = await fetch(`${this.baseUrl}?${queryParams.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch calls');
    }

    const result = await response.json();
    return {
      calls: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * Get call transcript
   */
  async getCallTranscript(callId: string): Promise<{
    callId: string;
    transcript: string;
    metadata: any;
    createdAt: string;
  }> {
    const response = await fetch(`${this.baseUrl}/${callId}/transcript`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch transcript');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get voice call cost statistics
   */
  async getCallCosts(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<CallCostStats> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await fetch(`${this.baseUrl}/costs?${queryParams.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch call costs');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Create or update AI assistant configuration
   */
  async createAssistant(config: {
    name?: string;
    systemPrompt?: string;
    firstMessage?: string;
    voiceId?: string;
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to create assistant');
    }

    const result = await response.json();
    return result.data;
  }
}

export const voiceCallService = new VoiceCallService();
