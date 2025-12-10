/**
 * Calendar Events Schema - Event Management for BollaLabz Command Center
 *
 * Features:
 * - Start/end time tracking with timezone support
 * - All-day event support
 * - Multiple contact associations via JSONB
 * - External calendar integration (Google, Outlook, etc.)
 * - Reminder configuration
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// External calendar source enum values
export const calendarSources = ["google", "outlook", "apple", "manual"] as const;
export type CalendarSource = typeof calendarSources[number];

// Calendar events table definition
export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // User association
    userId: uuid("user_id").notNull(),

    // Event content
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),

    // Timing
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    allDay: boolean("all_day").default(false).notNull(),

    // Location
    location: varchar("location", { length: 500 }),

    // Contact associations (array of contact UUIDs)
    contactIds: jsonb("contact_ids").$type<string[]>().default([]),

    // Reminder configuration (minutes before event)
    reminderMinutes: integer("reminder_minutes").default(15),

    // External calendar integration
    externalId: varchar("external_id", { length: 255 }),
    externalSource: varchar("external_source", { length: 50 }).$type<CalendarSource>(),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    // User and soft delete indexes
    index("calendar_events_user_id_idx").on(table.userId),
    index("calendar_events_deleted_at_idx").on(table.deletedAt),
    // Standard indexes for common queries
    index("calendar_events_start_time_idx").on(table.startTime),
    index("calendar_events_end_time_idx").on(table.endTime),
    index("calendar_events_external_id_idx").on(table.externalId),
    index("calendar_events_external_source_idx").on(table.externalSource),
    index("calendar_events_created_at_idx").on(table.createdAt),
    // Composite index for date range queries
    index("calendar_events_time_range_idx").on(table.startTime, table.endTime),
    // Composite index for user-specific queries with soft delete filtering
    index("calendar_events_user_deleted_idx").on(table.userId, table.deletedAt),
  ]
);

// Type exports for TypeScript inference
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;
