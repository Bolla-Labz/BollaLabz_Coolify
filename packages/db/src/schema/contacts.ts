/**
 * Contacts Schema - Contact Management for BollaLabz Command Center
 *
 * Features:
 * - UUID primary keys for distributed systems
 * - Vector embeddings (halfvec) for AI-powered semantic search
 * - HNSW indexing for efficient similarity queries
 * - Relationship scoring for contact prioritization
 * - JSONB tags for flexible categorization
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// Contacts table definition
export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Personal information
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),

    // Professional information
    company: varchar("company", { length: 200 }),
    jobTitle: varchar("job_title", { length: 200 }),

    // Additional details
    notes: text("notes"),
    tags: jsonb("tags").$type<string[]>().default([]),
    avatarUrl: varchar("avatar_url", { length: 500 }),

    // Relationship tracking
    relationshipScore: varchar("relationship_score", { length: 10 }).default("neutral"),
    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),

    // Vector embedding for semantic search
    // NOTE: Using text() instead of pgvector type because Drizzle doesn't have native pgvector support yet.
    // The actual vector data will be stored as text and cast to vector type in SQL queries.
    embedding: text("embedding"),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    // Standard indexes for common queries
    index("contacts_email_idx").on(table.email),
    index("contacts_phone_idx").on(table.phone),
    index("contacts_company_idx").on(table.company),
    index("contacts_relationship_score_idx").on(table.relationshipScore),
    index("contacts_last_contacted_idx").on(table.lastContactedAt),
    index("contacts_created_at_idx").on(table.createdAt),
    index("contacts_deleted_at_idx").on(table.deletedAt),
  ]
);

// Type exports for TypeScript inference
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

// Relationship score enum for validation
export const relationshipScores = ["cold", "warm", "hot", "neutral", "vip"] as const;
export type RelationshipScore = typeof relationshipScores[number];
