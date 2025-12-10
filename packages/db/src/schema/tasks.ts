// 08 December 2025 01 15 00

/**
 * Tasks Schema - Task Management for BollaLabz Command Center
 *
 * Features:
 * - Priority levels (low/medium/high)
 * - Status tracking (todo/in_progress/done)
 * - Contact association for relationship-based tasks
 * - Tags for flexible categorization
 * - Completion tracking with timestamps
 * - Soft deletes via deletedAt field
 * - User ownership via userId field
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { contacts } from "./contacts";

// Task status enum values
export const taskStatuses = ["todo", "in_progress", "done"] as const;
export type TaskStatus = typeof taskStatuses[number];

// Task priority enum values
export const taskPriorities = ["low", "medium", "high"] as const;
export type TaskPriority = typeof taskPriorities[number];

// Tasks table definition
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),

    // Task content
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),

    // Status and priority
    status: varchar("status", { length: 20 }).notNull().default("todo").$type<TaskStatus>(),
    priority: varchar("priority", { length: 20 }).notNull().default("medium").$type<TaskPriority>(),

    // Scheduling
    dueDate: timestamp("due_date", { withTimezone: true }),

    // Contact relationship
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),

    // Categorization (using text[] for PostgreSQL array)
    tags: text("tags").array().default(sql`ARRAY[]::text[]`),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    // Standard indexes for common queries
    index("tasks_user_id_idx").on(table.userId),
    index("tasks_contact_id_idx").on(table.contactId),
    index("tasks_status_idx").on(table.status),
    index("tasks_priority_idx").on(table.priority),
    index("tasks_due_date_idx").on(table.dueDate),
    index("tasks_created_at_idx").on(table.createdAt),
    index("tasks_deleted_at_idx").on(table.deletedAt),
    // Composite index for common filter patterns
    index("tasks_status_priority_idx").on(table.status, table.priority),
    index("tasks_status_due_date_idx").on(table.status, table.dueDate),
  ]
);

// Type exports for TypeScript inference
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
