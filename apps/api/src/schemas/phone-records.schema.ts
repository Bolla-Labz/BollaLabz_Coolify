/**
 * Phone Record Validation Schemas
 * Zod schemas for phone/call record operations
 */

import { z } from "zod";

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const callDirectionSchema = z.enum(["inbound", "outbound"]);

export const callStatusSchema = z.enum([
  "queued",
  "ringing",
  "in-progress",
  "completed",
  "failed",
  "busy",
  "no-answer",
  "canceled",
]);

// ============================================================================
// PHONE NUMBER VALIDATION
// ============================================================================

/**
 * Phone number regex supporting international formats:
 * - E.164 format: +14155552671
 * - With spaces/dashes: +1 415-555-2671
 * - Local formats: (415) 555-2671
 */
const phoneNumberRegex = /^[+]?[\d\s\-().]{7,30}$/;

// ============================================================================
// CREATE PHONE RECORD SCHEMA
// ============================================================================

export const createPhoneRecordSchema = z.object({
  // userId is optional in schema - can come from auth context or webhook body
  userId: z.string().uuid("Invalid user ID").optional(),
  contactId: z.string().uuid("Invalid contact ID").optional(),
  phoneNumber: z
    .string()
    .min(7, "Phone number must be at least 7 characters")
    .max(30, "Phone number must be 30 characters or less")
    .regex(phoneNumberRegex, "Invalid phone number format"),
  direction: callDirectionSchema,
  status: callStatusSchema.default("completed"),
  duration: z.number().min(0, "Duration cannot be negative").default(0),
  startTime: z.string().datetime("Invalid start time format"),
  endTime: z.string().datetime("Invalid end time format"),
  recordingUrl: z.string().url("Invalid recording URL").optional(),
  transcriptId: z.string().uuid("Invalid transcript ID").optional(),
  cost: z.number().min(0, "Cost cannot be negative").optional(),
  provider: z.string().min(1, "Provider is required").max(100),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// UPDATE PHONE RECORD SCHEMA
// ============================================================================

export const updatePhoneRecordSchema = z.object({
  contactId: z.string().uuid("Invalid contact ID").optional(),
  status: callStatusSchema.optional(),
  recordingUrl: z.string().url("Invalid recording URL").optional(),
  transcriptId: z.string().uuid("Invalid transcript ID").optional(),
  cost: z.number().min(0, "Cost cannot be negative").optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const listPhoneRecordsQuerySchema = z.object({
  page: z.coerce.number().min(1, "Page must be at least 1").default(1),
  pageSize: z.coerce
    .number()
    .min(1, "Page size must be at least 1")
    .max(100, "Page size must be 100 or less")
    .default(20),
  contactId: z.string().uuid().optional(),
  direction: callDirectionSchema.optional(),
  status: callStatusSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  phoneNumber: z.string().max(30).optional(),
  provider: z.string().max(100).optional(),
  minDuration: z.coerce.number().min(0).optional(),
  maxDuration: z.coerce.number().min(0).optional(),
  hasRecording: z.coerce.boolean().optional(),
  hasTranscript: z.coerce.boolean().optional(),
  sortBy: z.enum(["startTime", "endTime", "duration", "cost"]).default("startTime"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const searchPhoneRecordsQuerySchema = z.object({
  q: z.string().min(1, "Search query is required").max(500),
  limit: z.coerce.number().min(1).max(50).default(10),
  threshold: z.coerce.number().min(0).max(1).default(0.7),
  contactId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const phoneRecordStatsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(["day", "week", "month"]).optional(),
  contactId: z.string().uuid().optional(),
  provider: z.string().max(100).optional(),
});

export const phoneRecordIdParamSchema = z.object({
  id: z.string().uuid("Invalid phone record ID format"),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreatePhoneRecordInput = z.infer<typeof createPhoneRecordSchema>;
export type UpdatePhoneRecordInput = z.infer<typeof updatePhoneRecordSchema>;
export type ListPhoneRecordsQuery = z.infer<typeof listPhoneRecordsQuerySchema>;
export type SearchPhoneRecordsQuery = z.infer<typeof searchPhoneRecordsQuerySchema>;
export type PhoneRecordStatsQuery = z.infer<typeof phoneRecordStatsQuerySchema>;
export type PhoneRecordIdParam = z.infer<typeof phoneRecordIdParamSchema>;
