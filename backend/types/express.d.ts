// Last Modified: 2025-11-24 00:30
/**
 * Express Type Extensions
 * Augments Express Request/Response with custom properties
 */

import { JwtPayload } from 'jsonwebtoken';
import { QueryResult } from 'pg';

declare global {
  namespace Express {
    /**
     * Extended Request interface with authentication and custom properties
     */
    export interface Request {
      // Authentication (uses 'userId' not 'id' - matches JWT payload)
      user?: {
        userId: number;
        email: string;
        role?: string;
        permissions?: string[];
      };
      userId?: number; // Deprecated: use req.user.userId instead

      // CSRF Protection
      csrfToken?: string;

      // Rate Limiting
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime: Date;
      };

      // Request Tracking
      requestId?: string;
      startTime?: number;

      // Validated Data
      validatedBody?: Record<string, unknown>;
      validatedQuery?: Record<string, unknown>;
      validatedParams?: Record<string, unknown>;
    }

    /**
     * Extended Response interface for custom methods
     */
    export interface Response {
      // Custom response helpers
      success?: <T = any>(data: T, message?: string) => Response;
      error?: (message: string, statusCode?: number, errorCode?: string) => Response;
      paginated?: <T = any>(data: T[], total: number, page: number, limit: number) => Response;
    }
  }
}

/**
 * Database Query Result Types
 */
export interface DbUser {
  id: number;
  email: string;
  password_hash: string;
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  is_verified: boolean;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface DbContact {
  id: number;
  user_id: number;
  phone_number: string;
  name?: string | null;
  email?: string | null;
  context?: string | null;
  relationship_score?: number | null;
  last_contact_date?: Date | null;
  conversation_count: number;
  total_spend: number;
  created_at: Date;
  updated_at: Date;
}

export interface DbConversation {
  id: number;
  user_id: number;
  contact_id: number;
  direction: 'inbound' | 'outbound';
  type: 'sms' | 'voice' | 'email';
  content: string;
  transcript?: string | null;
  ai_summary?: string | null;
  cost?: number | null;
  metadata?: Record<string, unknown> | null;
  created_at: Date;
}

export interface DbTask {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: Date | null;
  completed_at?: Date | null;
  assigned_to?: number | null;
  parent_task_id?: number | null;
  metadata?: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface DbCalendarEvent {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  start_time: Date;
  end_time: Date;
  location?: string | null;
  attendees?: string[] | null;
  google_event_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface DbWorkflow {
  id: number;
  user_id: number;
  name: string;
  description?: string | null;
  trigger_type: 'webhook' | 'schedule' | 'manual' | 'event';
  trigger_config?: Record<string, unknown> | null;
  actions?: Record<string, unknown>[] | null;
  is_active: boolean;
  last_run_at?: Date | null;
  run_count: number;
  success_count: number;
  failure_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface DbCallCost {
  id: number;
  user_id: number;
  contact_id?: number | null;
  service: 'twilio' | 'vapi' | 'elevenlabs' | 'anthropic';
  operation_type: 'sms_send' | 'sms_receive' | 'voice_call' | 'voice_minute' | 'tts_character' | 'ai_prompt' | 'ai_completion';
  units: number;
  cost_per_unit: number;
  total_cost: number;
  conversation_id?: number | null;
  metadata?: Record<string, unknown> | null;
  created_at: Date;
}

export interface DbPerson {
  id: number;
  user_id: number;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  title?: string | null;
  relationship_type?: 'professional' | 'personal' | 'family' | 'other' | null;
  relationship_strength?: number | null;
  last_interaction_date?: Date | null;
  interaction_count: number;
  notes?: string | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface DbRelationshipInteraction {
  id: number;
  person_id: number;
  user_id: number;
  interaction_type: 'call' | 'sms' | 'email' | 'meeting' | 'note';
  subject?: string | null;
  summary?: string | null;
  sentiment?: 'positive' | 'neutral' | 'negative' | null;
  duration_minutes?: number | null;
  metadata?: Record<string, unknown> | null;
  created_at: Date;
}

/**
 * API Response Types
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginatedResponse<T = any> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

/**
 * JWT Payload Types
 */
export interface JwtUserPayload extends JwtPayload {
  userId: number;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload extends JwtPayload {
  userId: number;
  tokenId: string;
  iat?: number;
  exp?: number;
}

/**
 * Validation Error Types
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface CustomError extends Error {
  statusCode?: number;
  errorCode?: string;
  details?: Record<string, unknown>;
  isOperational?: boolean;
}

/**
 * WebSocket Event Types
 */
export interface WebSocketMessage {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
  userId?: number;
}

/**
 * Helper type for database queries that ensures proper typing
 */
export type DbQueryResult<T> = QueryResult<T>;

/**
 * Utility type for partial updates (all fields optional)
 */
export type PartialUpdate<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;

/**
 * Utility type for creating new records (excludes auto-generated fields)
 */
export type NewRecord<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
