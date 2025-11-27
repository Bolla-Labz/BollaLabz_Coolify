// Last Modified: 2025-11-23 17:30
/**
 * BollaLabz Backend Type Definitions
 * Shared types across all integrations
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface CostEntry {
  service: 'twilio' | 'vapi' | 'elevenlabs' | 'anthropic';
  type: 'sms' | 'voice' | 'tts' | 'ai';
  cost: number;
  units?: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface WebhookEvent {
  id: string;
  source: string;
  type: string;
  data: Record<string, any>;
  signature?: string;
  timestamp: string;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface ConversationMessage {
  id?: string;
  contactId: string;
  direction: 'inbound' | 'outbound';
  type: 'sms' | 'voice';
  content: string;
  transcript?: string;
  cost?: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface CallRecord {
  id?: string;
  contactId: string;
  direction: 'inbound' | 'outbound';
  duration: number;
  recordingUrl?: string;
  transcript?: string;
  cost: number;
  status: 'completed' | 'failed' | 'no-answer' | 'busy';
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  statusCallbackUrl?: string;
}

export interface VapiConfig {
  apiKey: string;
  assistantId?: string;
  webhookUrl?: string;
}

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId?: string;
  modelId?: string;
}

export interface AnthropicConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface IntegrationError extends Error {
  service: string;
  code?: string;
  statusCode?: number;
  retryable: boolean;
  originalError?: any;
}
