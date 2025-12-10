/**
 * Task Validation Schemas
 * Zod schemas for task CRUD operations
 */

import { z } from "zod";

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const taskStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "cancelled",
  "on_hold",
  "blocked",
]);

export const taskPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

export const recurrenceFrequencySchema = z.enum(["daily", "weekly", "monthly", "yearly"]);

// ============================================================================
// NESTED OBJECT SCHEMAS
// ============================================================================

export const recurrenceRuleSchema = z.object({
  frequency: recurrenceFrequencySchema,
  interval: z.number().min(1).max(365).optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  monthOfYear: z.number().min(1).max(12).optional(),
  count: z.number().min(1).max(1000).optional(),
  until: z.string().datetime().optional(),
  exceptions: z.array(z.string().datetime()).optional(),
});

export const attachmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  url: z.string().url(),
  size: z.number().min(0),
  mimeType: z.string().max(100),
  uploadedAt: z.string().datetime(),
});

// ============================================================================
// CREATE TASK SCHEMA
// ============================================================================

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(500, "Title must be 500 characters or less")
    .trim(),
  description: z.string().max(10000, "Description must be 10000 characters or less").optional(),
  status: taskStatusSchema.optional().default("pending"),
  priority: taskPrioritySchema.optional().default("medium"),
  dueDate: z.string().datetime("Invalid date format").optional(),
  startDate: z.string().datetime("Invalid date format").optional(),
  contactId: z.string().uuid("Invalid contact ID").optional(),
  assigneeId: z.string().uuid("Invalid assignee ID").optional(),
  projectId: z.string().uuid("Invalid project ID").optional(),
  parentTaskId: z.string().uuid("Invalid parent task ID").optional(),
  tags: z.array(z.string().max(50)).max(20, "Maximum 20 tags allowed").optional(),
  category: z.string().max(100).optional(),
  estimatedHours: z.number().min(0).max(10000).optional(),
  recurrence: recurrenceRuleSchema.optional(),
  linkedContacts: z.array(z.string().uuid()).max(50).optional(),
  linkedEvents: z.array(z.string().uuid()).max(50).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// UPDATE TASK SCHEMA
// ============================================================================

export const updateTaskSchema = createTaskSchema.partial().extend({
  progress: z.number().min(0).max(100).optional(),
  actualHours: z.number().min(0).max(10000).optional(),
  completedAt: z.string().datetime("Invalid date format").optional(),
});

// ============================================================================
// STATUS UPDATE SCHEMA
// ============================================================================

export const updateTaskStatusSchema = z.object({
  status: taskStatusSchema,
});

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().min(1, "Page must be at least 1").default(1),
  pageSize: z.coerce
    .number()
    .min(1, "Page size must be at least 1")
    .max(100, "Page size must be 100 or less")
    .default(20),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  contactId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  assigneeId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  parentTaskId: z.string().uuid().optional(),
  tag: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
  includeSubtasks: z.coerce.boolean().default(false),
  sortBy: z
    .enum(["createdAt", "updatedAt", "dueDate", "priority", "status", "title"])
    .default("dueDate"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const taskIdParamSchema = z.object({
  id: z.string().uuid("Invalid task ID format"),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type TaskIdParam = z.infer<typeof taskIdParamSchema>;
