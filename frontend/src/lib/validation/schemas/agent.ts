// Last Modified: 2025-11-23 17:30
/**
 * Validation schemas for Agent-related operations
 * Extracted from backend with frontend adaptations
 */

import { z } from 'zod';
import { uuidSchema, nameSchema, phoneNumberSchema } from './common';

/**
 * Create agent schema
 */
export const createAgentSchema = z.object({
  name: nameSchema,
  description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
  phoneNumber: phoneNumberSchema.optional(),
  systemPrompt: z.string().max(5000, 'System prompt must not exceed 5000 characters').optional(),
  type: z.enum(['voice', 'sms', 'chat', 'hybrid']).optional(),
  configuration: z.record(z.any()).optional(),
});

export type CreateAgentDto = z.infer<typeof createAgentSchema>;

/**
 * Update agent schema
 */
export const updateAgentSchema = z.object({
  name: nameSchema.optional(),
  description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
  phoneNumber: phoneNumberSchema.optional(),
  systemPrompt: z.string().max(5000, 'System prompt must not exceed 5000 characters').optional(),
  type: z.enum(['voice', 'sms', 'chat', 'hybrid']).optional(),
  isActive: z.boolean().optional(),
  configuration: z.record(z.any()).optional(),
});

export type UpdateAgentDto = z.infer<typeof updateAgentSchema>;

/**
 * Agent ID parameter
 */
export const agentIdSchema = z.object({
  id: uuidSchema,
});

export type AgentIdParam = z.infer<typeof agentIdSchema>;

/**
 * Agent query filters
 */
export const agentQuerySchema = z.object({
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined))
    .pipe(z.boolean().optional()),
  type: z.enum(['voice', 'sms', 'chat', 'hybrid']).optional(),
  search: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().min(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(100)),
});

export type AgentQueryDto = z.infer<typeof agentQuerySchema>;
