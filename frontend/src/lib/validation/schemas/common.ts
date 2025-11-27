// Last Modified: 2025-11-23 17:30
/**
 * Common validation schemas used across the application
 * Extracted from backend with frontend adaptations
 */

import { z } from 'zod';

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid({ message: 'Invalid UUID format' });

/**
 * Pagination schemas
 */
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().min(1, 'Page must be at least 1')),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(100, 'Limit must be between 1 and 100')),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/**
 * Date range schemas
 */
export const dateRangeSchema = z.object({
  startDate: z
    .string()
    .datetime({ message: 'Invalid start date format' })
    .optional(),
  endDate: z
    .string()
    .datetime({ message: 'Invalid end date format' })
    .optional(),
});

/**
 * ID parameter schema
 */
export const idParamSchema = z.object({
  id: uuidSchema,
});

/**
 * Search query schema
 */
export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query cannot be empty').optional(),
  filter: z.string().optional(),
});

/**
 * Status filter schema
 */
export const statusFilterSchema = z.object({
  status: z.enum(['active', 'inactive', 'all']).optional().default('all'),
});

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .email({ message: 'Invalid email address' })
  .toLowerCase()
  .trim();

/**
 * Password validation
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must not exceed 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Phone number validation (E.164 format for Twilio compatibility)
 */
export const phoneNumberSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format (e.g., +12345678900)');

/**
 * URL validation
 */
export const urlSchema = z.string().url({ message: 'Invalid URL format' });

/**
 * JSON validation
 */
export const jsonSchema = z.string().transform((str, ctx) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    ctx.addIssue({ code: 'custom', message: 'Invalid JSON format' });
    return z.NEVER;
  }
});

/**
 * Metadata schema (flexible JSON object)
 */
export const metadataSchema = z.record(z.any()).optional();

/**
 * Boolean string transformation (for query params)
 */
export const booleanStringSchema = z
  .string()
  .optional()
  .transform((val) => val === 'true')
  .pipe(z.boolean());

/**
 * ISO timestamp validation
 */
export const timestampSchema = z.string().datetime({ message: 'Invalid timestamp format' });

/**
 * Name validation (for users, agents, etc.)
 */
export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters')
  .trim();
