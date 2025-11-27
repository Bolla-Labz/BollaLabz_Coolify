// Last Modified: 2025-11-23 17:30
/**
 * Vapi Voice AI Integration Client
 * Handles AI-powered voice conversations
 */

import { VapiConfig, CallRecord } from '../../types';
import { retryWithBackoff } from '../../utils/retry';
import { costTracker, calculateVapiCost } from '../../utils/cost-tracker';
import { logger } from '../../utils/logger';

export interface VapiCallOptions {
  phoneNumber: string;
  assistantId?: string;
  name?: string;
  metadata?: Record<string, any>;
}

export interface VapiCallResponse {
  id: string;
  status: string;
  phoneNumber: string;
  assistantId?: string;
  createdAt: string;
}

export interface VapiTranscript {
  callId: string;
  transcript: string;
  duration: number;
  cost: number;
}

export class VapiClient {
  private config: VapiConfig;
  private baseUrl = 'https://api.vapi.ai';

  constructor(config: VapiConfig) {
    this.config = config;
    logger.integration('vapi', 'Client initialized');
  }

  /**
   * Start an AI-powered call
   */
  async startCall(options: VapiCallOptions): Promise<CallRecord> {
    logger.integration('vapi', `Starting AI call to ${options.phoneNumber}`);

    const response = await retryWithBackoff(async () => {
      const res = await fetch(`${this.baseUrl}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          phoneNumber: options.phoneNumber,
          assistantId: options.assistantId || this.config.assistantId,
          name: options.name,
          metadata: options.metadata,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Vapi API error: ${res.status} - ${error}`);
      }

      return res.json();
    });

    const callRecord: CallRecord = {
      id: response.id,
      contactId: options.phoneNumber,
      direction: 'outbound',
      duration: 0,
      cost: 0,
      status: 'completed',
      metadata: {
        vapiCallId: response.id,
        assistantId: options.assistantId,
        status: response.status,
      },
      timestamp: new Date().toISOString(),
    };

    logger.integration('vapi', `AI call started (${response.id})`);
    return callRecord;
  }

  /**
   * End an ongoing call
   */
  async endCall(callId: string): Promise<void> {
    logger.integration('vapi', `Ending call ${callId}`);

    await retryWithBackoff(async () => {
      const res = await fetch(`${this.baseUrl}/call/${callId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Vapi API error: ${res.status} - ${error}`);
      }
    });

    logger.integration('vapi', `Call ended (${callId})`);
  }

  /**
   * Get call transcript
   */
  async getTranscript(callId: string): Promise<VapiTranscript> {
    logger.integration('vapi', `Fetching transcript for call ${callId}`);

    const response = await retryWithBackoff(async () => {
      const res = await fetch(`${this.baseUrl}/call/${callId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Vapi API error: ${res.status} - ${error}`);
      }

      return res.json();
    });

    const duration = response.duration || 0;
    const cost = calculateVapiCost(duration);

    // Track cost
    costTracker.trackCost({
      service: 'vapi',
      type: 'voice',
      cost,
      units: duration,
      metadata: {
        callId,
      },
    });

    logger.integration('vapi', `Transcript retrieved (${callId})`);

    return {
      callId,
      transcript: response.transcript || '',
      duration,
      cost,
    };
  }

  /**
   * Get call analytics
   */
  async getCallAnalytics(callId: string): Promise<any> {
    logger.integration('vapi', `Fetching analytics for call ${callId}`);

    const response = await retryWithBackoff(async () => {
      const res = await fetch(`${this.baseUrl}/call/${callId}/analytics`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Vapi API error: ${res.status} - ${error}`);
      }

      return res.json();
    });

    logger.integration('vapi', `Analytics retrieved (${callId})`);
    return response;
  }

  /**
   * List all assistants
   */
  async listAssistants(): Promise<any[]> {
    logger.integration('vapi', 'Fetching assistants list');

    const response = await retryWithBackoff(async () => {
      const res = await fetch(`${this.baseUrl}/assistant`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Vapi API error: ${res.status} - ${error}`);
      }

      return res.json();
    });

    return response;
  }

  /**
   * Track call cost
   */
  trackCallCost(callId: string, durationSeconds: number): void {
    const cost = calculateVapiCost(durationSeconds);

    costTracker.trackCost({
      service: 'vapi',
      type: 'voice',
      cost,
      units: durationSeconds,
      metadata: {
        callId,
        duration: durationSeconds,
      },
    });

    logger.cost('vapi', cost, `Call ${callId} - ${durationSeconds}s`);
  }
}

/**
 * Create Vapi client from environment variables
 */
export function createVapiClient(): VapiClient {
  const config: VapiConfig = {
    apiKey: process.env.VAPI_API_KEY!,
    assistantId: process.env.VAPI_ASSISTANT_ID,
    webhookUrl: process.env.VAPI_WEBHOOK_URL,
  };

  if (!config.apiKey) {
    throw new Error('Missing required Vapi configuration: VAPI_API_KEY');
  }

  return new VapiClient(config);
}
