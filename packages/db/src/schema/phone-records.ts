// 08 December 2025 05 30 00

/**
 * Phone Records Schema - Call Tracking for BollaLabz Command Center
 *
 * Features:
 * - Complete Telnyx integration fields
 * - Call transcription and AI-generated summaries
 * - Sentiment analysis storage
 * - Vector embeddings for semantic call search
 * - Recording management with URLs and SIDs
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { contacts } from "./contacts";

// Call direction enum values
export const callDirections = ["inbound", "outbound"] as const;
export type CallDirection = typeof callDirections[number];

// Call status enum values
export const callStatuses = [
  "queued",
  "ringing",
  "in-progress",
  "completed",
  "busy",
  "failed",
  "no-answer",
  "canceled",
] as const;
export type CallStatus = typeof callStatuses[number];

// Sentiment values
export const sentimentValues = ["positive", "negative", "neutral", "mixed"] as const;
export type Sentiment = typeof sentimentValues[number];

// Phone records table definition
export const phoneRecords = pgTable(
  "phone_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // User relationship
    userId: uuid("user_id").notNull(),

    // Contact relationship
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),

    // Basic call information
    phoneNumber: varchar("phone_number", { length: 50 }).notNull(),
    direction: varchar("direction", { length: 20 }).notNull().$type<CallDirection>(),
    status: varchar("status", { length: 30 }).notNull().$type<CallStatus>(),
    duration: integer("duration").default(0), // Duration in seconds

    // Twilio-specific fields
    twilioCallSid: varchar("twilio_call_sid", { length: 100 }).unique(),
    twilioAccountSid: varchar("twilio_account_sid", { length: 100 }),
    twilioFrom: varchar("twilio_from", { length: 50 }),
    twilioTo: varchar("twilio_to", { length: 50 }),
    twilioStatus: varchar("twilio_status", { length: 50 }),
    twilioDirection: varchar("twilio_direction", { length: 50 }),

    // Recording information
    recordingUrl: varchar("recording_url", { length: 1000 }),
    recordingSid: varchar("recording_sid", { length: 100 }),

    // AI-processed content
    transcription: text("transcription"),
    summary: text("summary"),
    sentiment: varchar("sentiment", { length: 20 }).$type<Sentiment>(),

    // Vector embedding for semantic search (stored as text, can be migrated to pgvector extension later)
    embedding: text("embedding"),

    // Flexible metadata storage
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    // Standard indexes for common queries
    index("phone_records_user_id_idx").on(table.userId),
    index("phone_records_contact_id_idx").on(table.contactId),
    index("phone_records_phone_number_idx").on(table.phoneNumber),
    index("phone_records_twilio_call_sid_idx").on(table.twilioCallSid),
    index("phone_records_created_at_idx").on(table.createdAt.desc()),
    index("phone_records_direction_idx").on(table.direction),
    index("phone_records_status_idx").on(table.status),
    index("phone_records_deleted_at_idx").on(table.deletedAt),
  ]
);

// Type exports for TypeScript inference
export type PhoneRecord = typeof phoneRecords.$inferSelect;
export type NewPhoneRecord = typeof phoneRecords.$inferInsert;
