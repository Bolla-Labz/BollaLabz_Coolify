/**
 * Schema Index - Centralized Schema Exports for BollaLabz Command Center
 *
 * This file exports all database schemas and their relations for use
 * throughout the application. Import from "@repo/db/schema" or "@repo/db".
 */

import { relations } from "drizzle-orm";

// Import table definitions for relations
import { contacts } from "./contacts";
import { phoneRecords } from "./phone-records";
import { tasks } from "./tasks";
import { calendarEvents } from "./calendar-events";

// ============================================================================
// RELATIONS DEFINITIONS
// ============================================================================

/**
 * Contact Relations
 * - One contact has many phone records
 * - One contact has many tasks
 */
export const contactsRelations = relations(contacts, ({ many }) => ({
  phoneRecords: many(phoneRecords),
  tasks: many(tasks),
}));

/**
 * Phone Record Relations
 * - Each phone record belongs to one contact (optional)
 */
export const phoneRecordsRelations = relations(phoneRecords, ({ one }) => ({
  contact: one(contacts, {
    fields: [phoneRecords.contactId],
    references: [contacts.id],
  }),
}));

/**
 * Task Relations
 * - Each task belongs to one contact (optional)
 */
export const tasksRelations = relations(tasks, ({ one }) => ({
  contact: one(contacts, {
    fields: [tasks.contactId],
    references: [contacts.id],
  }),
}));

/**
 * Calendar Event Relations
 * - Each calendar event can be associated with multiple contacts via contactIds JSONB array
 * - No direct foreign key relation, but contactIds stores an array of contact UUIDs
 */
export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  // Note: Calendar events use a JSONB array (contactIds) to store multiple contact associations
  // This is a many-to-many relationship managed through the contactIds array
  // No direct relation definition needed, but this documents the relationship pattern
}));

// ============================================================================
// TABLE EXPORTS
// ============================================================================

export { contacts } from "./contacts";
export { phoneRecords } from "./phone-records";
export { tasks } from "./tasks";
export { calendarEvents } from "./calendar-events";

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Contact types
export type { Contact, NewContact } from "./contacts";
export { relationshipScores } from "./contacts";
export type { RelationshipScore } from "./contacts";

// Phone record types
export type { PhoneRecord, NewPhoneRecord } from "./phone-records";
export { callDirections, callStatuses, sentimentValues } from "./phone-records";
export type { CallDirection, CallStatus, Sentiment } from "./phone-records";

// Task types
export type { Task, NewTask } from "./tasks";
export { taskStatuses, taskPriorities } from "./tasks";
export type { TaskStatus, TaskPriority } from "./tasks";

// Calendar event types
export type { CalendarEvent, NewCalendarEvent } from "./calendar-events";
export { calendarSources } from "./calendar-events";
export type { CalendarSource } from "./calendar-events";
