// Last Modified: 2025-11-23 17:30
/**
 * Backend Type Definitions
 * Extracted from existing backend to ensure type safety and compatibility
 *
 * These types define the contract between frontend and backend
 */

// Define UserRole enum locally (mirrors Prisma schema)
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

/**
 * Custom Application Error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Alias for compatibility
export interface JwtPayload extends JWTPayload {}

// Auth Tokens
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: Record<string, any>;
    field?: string;
  } | string;
  message?: string;
  requestId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword?: string;
  name?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Agent Types
export interface CreateAgentData {
  name: string;
  vapiAssistantId: string;
  voiceId: string;
  systemPrompt: string;
  phoneNumber?: string;
}

export interface UpdateAgentData {
  name?: string;
  vapiAssistantId?: string;
  voiceId?: string;
  systemPrompt?: string;
  isActive?: boolean;
  phoneNumber?: string;
}

// Phone Number Types
export interface AssignPhoneNumberData {
  agentId: string;
}

// Conversation Types
export interface CreateConversationData {
  phoneNumberId: string;
  agentId: string;
  userId: string;
  externalNumber: string;
  twilioCallSid?: string;
  vapiCallId?: string;
}

// Conversation Filter Types
export interface ConversationFilters {
  agentId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// WebSocket Event Types
export enum WebSocketEventType {
  CONVERSATION_STARTED = 'CONVERSATION_STARTED',
  CONVERSATION_UPDATED = 'CONVERSATION_UPDATED',
  CONVERSATION_ENDED = 'CONVERSATION_ENDED',
  CONVERSATION_STATUS_CHANGED = 'CONVERSATION_STATUS_CHANGED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  AGENT_STATUS_CHANGED = 'AGENT_STATUS_CHANGED',
  USER_CONNECTED = 'USER_CONNECTED',
  CALL_STATUS_CHANGED = 'CALL_STATUS_CHANGED',
}

export interface WebSocketEvent<T = any> {
  type: WebSocketEventType;
  timestamp: string;
  data: T;
  userId?: string;
  agentId?: string;
  conversationId?: string;
}

export interface ConversationStartedEvent {
  conversationId: string;
  agentId: string;
  phoneNumber: string;
  startTime: string;
}

export interface ConversationEndedEvent {
  conversationId: string;
  agentId: string;
  endTime: string;
  duration: number;
  messageCount: number;
}

export interface NewMessageEvent {
  messageId: string;
  conversationId: string;
  content: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: string;
}

export interface AgentStatusChangedEvent {
  agentId: string;
  status: 'active' | 'inactive';
  timestamp: string;
}

// External Service Types
export interface TwilioIncomingWebhook {
  CallSid: string;
  From: string;
  To: string;
  CallStatus: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer' | 'canceled';
  Direction: 'inbound' | 'outbound-api' | 'outbound-dial';
  AccountSid?: string;
  ApiVersion?: string;
  ForwardedFrom?: string;
  CallerName?: string;
  CallDuration?: string;
  RecordingUrl?: string;
}

export interface VapiEventWebhook {
  type: 'call-started' | 'call-ended' | 'transcript' | 'function-call' | 'hang' | 'speech-update';
  callId: string;
  assistantId: string;
  timestamp: string;
  data: VapiEventData;
}

export interface VapiEventData {
  transcript?: string;
  endedReason?: 'customer-ended-call' | 'assistant-ended-call' | 'assistant-error' | 'exceeded-max-duration';
  duration?: number;
  cost?: number;
  messages?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
  functionCall?: {
    name: string;
    parameters: Record<string, any>;
  };
}
