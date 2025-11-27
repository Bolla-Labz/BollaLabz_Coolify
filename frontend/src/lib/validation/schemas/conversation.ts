// Last Modified: 2025-11-23 17:30
/**
 * Validation schemas for Conversation-related operations
 * Extracted from backend with frontend adaptations
 * Note: Backend-specific fields (twilioCallSid, vapiCallId) removed
 */

import { z } from 'zod';
import { uuidSchema, phoneNumberSchema, metadataSchema, paginationQuerySchema } from './common';

/**
 * Create conversation schema
 * Frontend version - backend handles Twilio/Vapi integration internally
 */
export const createConversationSchema = z.object({
  phoneNumberId: uuidSchema,
  agentId: uuidSchema,
  externalNumber: phoneNumberSchema,
  metadata: metadataSchema,
});

export type CreateConversationDto = z.infer<typeof createConversationSchema>;

/**
 * Update conversation schema
 */
export const updateConversationSchema = z.object({
  status: z.enum(['INITIATED', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).optional(),
  endedAt: z.string().datetime().optional(),
  duration: z.number().int().min(0).optional(),
  metadata: metadataSchema,
});

export type UpdateConversationDto = z.infer<typeof updateConversationSchema>;

/**
 * Conversation ID parameter
 */
export const conversationIdSchema = z.object({
  id: uuidSchema,
});

export type ConversationIdParam = z.infer<typeof conversationIdSchema>;

/**
 * Conversation query filters
 */
export const conversationQuerySchema = paginationQuerySchema.extend({
  agentId: uuidSchema.optional(),
  phoneNumberId: uuidSchema.optional(),
  status: z.enum(['INITIATED', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type ConversationQueryDto = z.infer<typeof conversationQuerySchema>;

/**
 * Add message schema
 */
export const addMessageSchema = z.object({
  role: z.enum(['USER', 'ASSISTANT', 'SYSTEM', 'FUNCTION']),
  content: z.string().min(1, 'Message content is required').max(10000),
  metadata: metadataSchema,
});

export type AddMessageDto = z.infer<typeof addMessageSchema>;
