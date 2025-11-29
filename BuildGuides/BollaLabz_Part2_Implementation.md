# Part 2: Database & Backend APIs

**BollaLabz Command Center Implementation Guide**  
**Phase 2: Weeks 3-4 | Tasks 2.1-2.8 | 28 Files Total**

---

## Overview

This document covers database setup, schema creation, and API endpoint implementation for the BollaLabz Command Center. Includes PostgreSQL 17 with pgvector, Drizzle ORM schemas, Hono API endpoints, and Redis/BullMQ job queues.

### Prerequisites from Part 1
- ✅ VPS1 (Control Plane) and VPS2 (Application) configured
- ✅ Tailscale mesh networking operational
- ✅ Monorepo initialized with Turborepo
- ✅ Next.js and Hono apps scaffolded
- ✅ Clerk authentication configured

---

# Level 1: Phase 2 - Database & Core APIs

## Level 2: PostgreSQL + pgvector Setup

### Level 3: Task 2.0 - Install PostgreSQL 17 on VPS2 (Pre-requisite)

#### Level 4: Step 2.0.1 - Connect to VPS2

```bash
ssh root@93.127.197.222
# Or via Tailscale
ssh root@<vps2-tailscale-ip>
```

#### Level 4: Step 2.0.2 - Install PostgreSQL 17

```bash
# Add PostgreSQL APT repository
sudo apt install -y postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh

# Install PostgreSQL 17
sudo apt update
sudo apt install -y postgresql-17 postgresql-17-pgvector

# Verify installation
psql --version
# Expected: psql (PostgreSQL) 17.7
```

#### Level 4: Step 2.0.3 - Configure PostgreSQL for Production

Edit `/etc/postgresql/17/main/postgresql.conf`:

```bash
sudo nano /etc/postgresql/17/main/postgresql.conf
```

Apply these settings (optimized for 8GB VPS with 2GB allocated to PostgreSQL):

```ini
# Memory Settings
shared_buffers = 2GB
effective_cache_size = 4GB
work_mem = 64MB
maintenance_work_mem = 512MB

# Connections
max_connections = 100
listen_addresses = 'localhost,<vps2-tailscale-ip>'

# WAL Settings
wal_buffers = 64MB
checkpoint_completion_target = 0.9
max_wal_size = 2GB
min_wal_size = 512MB

# Query Planner
random_page_cost = 1.1
effective_io_concurrency = 200
default_statistics_target = 100

# Logging
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
```

#### Level 4: Step 2.0.4 - Configure Authentication

Edit `/etc/postgresql/17/main/pg_hba.conf`:

```bash
sudo nano /etc/postgresql/17/main/pg_hba.conf
```

Add at the end:

```
# Allow connections from Tailscale network
host    all             all             100.0.0.0/8             scram-sha-256
# Allow local connections
host    all             all             127.0.0.1/32            scram-sha-256
```

#### Level 4: Step 2.0.5 - Create Database and User

```bash
# Restart PostgreSQL
sudo systemctl restart postgresql

# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE USER bollalabz WITH PASSWORD 'your-secure-password-here';
CREATE DATABASE bollalabz_db OWNER bollalabz;

# Connect to new database
\c bollalabz_db

# Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

# Verify extension
SELECT * FROM pg_extension WHERE extname = 'vector';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE bollalabz_db TO bollalabz;
GRANT ALL ON SCHEMA public TO bollalabz;

\q
```

#### Level 4: Step 2.0.6 - Test Connection

```bash
# Test local connection
psql -h localhost -U bollalabz -d bollalabz_db -c "SELECT version();"

# Test pgvector is working
psql -h localhost -U bollalabz -d bollalabz_db -c "SELECT '[1,2,3]'::vector;"
```

> **✅ Verification Checkpoint: PostgreSQL Setup**
> - [ ] PostgreSQL 17.7 installed and running
> - [ ] pgvector extension enabled
> - [ ] Memory settings applied (shared_buffers=2GB)
> - [ ] Database `bollalabz_db` created
> - [ ] User `bollalabz` has full privileges
> - [ ] Can connect via localhost and Tailscale IP

---

### ⚠️ Debugging Gate: PostgreSQL + pgvector Connection

**Common Issues:**

| Symptom | Cause | Resolution |
|---------|-------|------------|
| "Connection refused" | PostgreSQL not running | `sudo systemctl start postgresql` |
| "Role does not exist" | User not created | Run CREATE USER command |
| "Extension not found" | pgvector not installed | `apt install postgresql-17-pgvector` |
| "FATAL: no pg_hba.conf entry" | Auth config missing | Add entry to pg_hba.conf, restart |
| Vector operations fail | Extension not enabled | `CREATE EXTENSION vector;` in target DB |
| Out of memory | shared_buffers too high | Reduce to 1GB if needed |

**Diagnostic Commands:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-17-main.log

# Check memory usage
free -h
ps aux | grep postgres

# Test pgvector
psql -U bollalabz -d bollalabz_db -c "SELECT '[1,2,3]'::vector <-> '[4,5,6]'::vector AS distance;"
```

---

## Level 2: Database Schema Creation

### Level 3: Task 2.1 - Create Contacts Schema with pgvector (4 Files)

#### Level 4: Step 2.1.1 - Create packages/db/src/schema/contacts.ts

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Custom halfvec type for 768-dimension embeddings (50% memory vs full vector)
// Note: Drizzle doesn't have native halfvec, use customType or vector with cast
export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    company: varchar("company", { length: 255 }),
    jobTitle: varchar("job_title", { length: 255 }),
    notes: text("notes"),
    tags: text("tags")
      .array()
      .default(sql`ARRAY[]::text[]`),
    // Vector embedding for semantic search (768 dimensions for most models)
    embedding: text("embedding"), // Store as text, cast to vector in queries
    relationshipScore: varchar("relationship_score", { length: 10 }).default(
      "0"
    ),
    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Standard indexes
    emailIdx: index("contacts_email_idx").on(table.email),
    phoneIdx: index("contacts_phone_idx").on(table.phone),
    companyIdx: index("contacts_company_idx").on(table.company),
    lastContactedIdx: index("contacts_last_contacted_idx").on(
      table.lastContactedAt
    ),
    // Full-text search index (created via migration)
    // Vector index (created via raw SQL migration for HNSW)
  })
);

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
```

#### Level 4: Step 2.1.2 - Create Vector Index Migration

Create `packages/db/drizzle/0001_create_vector_indexes.sql`:

```sql
-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column with proper type (using halfvec for 50% memory savings)
-- First, add as vector type
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS embedding_vec halfvec(768);

-- Create HNSW index for fast approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS contacts_embedding_hnsw_idx 
ON contacts 
USING hnsw (embedding_vec halfvec_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create function to update embedding_vec from text embedding
CREATE OR REPLACE FUNCTION update_contact_embedding()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.embedding IS NOT NULL THEN
    NEW.embedding_vec = NEW.embedding::halfvec(768);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update vector column
DROP TRIGGER IF EXISTS contact_embedding_trigger ON contacts;
CREATE TRIGGER contact_embedding_trigger
BEFORE INSERT OR UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION update_contact_embedding();

-- Full-text search index for name, company, notes
CREATE INDEX IF NOT EXISTS contacts_fts_idx ON contacts 
USING gin(to_tsvector('english', 
  coalesce(first_name, '') || ' ' || 
  coalesce(last_name, '') || ' ' || 
  coalesce(company, '') || ' ' || 
  coalesce(notes, '')
));
```

#### Level 4: Step 2.1.3 - Create Contact Zod Validation

Create `packages/db/src/schema/validators/contact.ts`:

```typescript
import { z } from "zod";

export const createContactSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  company: z.string().max(255).optional().nullable(),
  jobTitle: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
});

export const updateContactSchema = createContactSchema.partial();

export const contactQuerySchema = z.object({
  search: z.string().optional(),
  company: z.string().optional(),
  tags: z.array(z.string()).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactQuery = z.infer<typeof contactQuerySchema>;
```

> **✅ Verification Checkpoint: Contacts Schema**
> - [ ] `contacts` table schema defined with all fields
> - [ ] Vector column for embeddings configured
> - [ ] HNSW index migration created
> - [ ] Zod validators for input validation
> - [ ] Trigger for auto-updating vector column

---

### Level 3: Task 2.2 - Create Phone Records Schema (3 Files)

#### Level 4: Step 2.2.1 - Create packages/db/src/schema/phone-records.ts

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { contacts } from "./contacts";

// Enums for phone record status and direction
export const callDirectionEnum = pgEnum("call_direction", [
  "inbound",
  "outbound",
]);

export const callStatusEnum = pgEnum("call_status", [
  "completed",
  "missed",
  "voicemail",
  "busy",
  "failed",
]);

export const sentimentEnum = pgEnum("sentiment", [
  "positive",
  "neutral",
  "negative",
]);

export const phoneRecords = pgTable(
  "phone_records",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    phoneNumber: varchar("phone_number", { length: 50 }).notNull(),
    direction: callDirectionEnum("direction").notNull(),
    status: callStatusEnum("status").notNull(),
    duration: integer("duration").default(0), // Duration in seconds
    recordingUrl: text("recording_url"),
    transcription: text("transcription"),
    summary: text("summary"),
    sentiment: sentimentEnum("sentiment"),
    // Metadata from telephony provider
    externalId: varchar("external_id", { length: 255 }), // Telnyx/Twilio call SID
    callerName: varchar("caller_name", { length: 255 }),
    // Vector embedding for semantic search on transcription
    embedding: text("embedding"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    contactIdIdx: index("phone_records_contact_id_idx").on(table.contactId),
    phoneNumberIdx: index("phone_records_phone_number_idx").on(
      table.phoneNumber
    ),
    directionIdx: index("phone_records_direction_idx").on(table.direction),
    statusIdx: index("phone_records_status_idx").on(table.status),
    createdAtIdx: index("phone_records_created_at_idx").on(table.createdAt),
    externalIdIdx: index("phone_records_external_id_idx").on(table.externalId),
  })
);

// Relations
export const phoneRecordsRelations = relations(phoneRecords, ({ one }) => ({
  contact: one(contacts, {
    fields: [phoneRecords.contactId],
    references: [contacts.id],
  }),
}));

export type PhoneRecord = typeof phoneRecords.$inferSelect;
export type NewPhoneRecord = typeof phoneRecords.$inferInsert;
```

#### Level 4: Step 2.2.2 - Create Phone Records Vector Index Migration

Create `packages/db/drizzle/0002_phone_records_indexes.sql`:

```sql
-- Add vector column for phone record embeddings
ALTER TABLE phone_records 
ADD COLUMN IF NOT EXISTS embedding_vec halfvec(768);

-- Create HNSW index for transcription semantic search
CREATE INDEX IF NOT EXISTS phone_records_embedding_hnsw_idx 
ON phone_records 
USING hnsw (embedding_vec halfvec_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create trigger for auto-updating vector column
CREATE OR REPLACE FUNCTION update_phone_record_embedding()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.embedding IS NOT NULL THEN
    NEW.embedding_vec = NEW.embedding::halfvec(768);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS phone_record_embedding_trigger ON phone_records;
CREATE TRIGGER phone_record_embedding_trigger
BEFORE INSERT OR UPDATE ON phone_records
FOR EACH ROW
EXECUTE FUNCTION update_phone_record_embedding();

-- Full-text search on transcription and summary
CREATE INDEX IF NOT EXISTS phone_records_fts_idx ON phone_records 
USING gin(to_tsvector('english', 
  coalesce(transcription, '') || ' ' || 
  coalesce(summary, '')
));
```

#### Level 4: Step 2.2.3 - Create Phone Record Validators

Create `packages/db/src/schema/validators/phone-record.ts`:

```typescript
import { z } from "zod";

export const createPhoneRecordSchema = z.object({
  contactId: z.string().uuid().optional().nullable(),
  phoneNumber: z.string().min(1).max(50),
  direction: z.enum(["inbound", "outbound"]),
  status: z.enum(["completed", "missed", "voicemail", "busy", "failed"]),
  duration: z.number().int().nonnegative().default(0),
  recordingUrl: z.string().url().optional().nullable(),
  transcription: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional().nullable(),
  externalId: z.string().max(255).optional().nullable(),
  callerName: z.string().max(255).optional().nullable(),
});

export const phoneRecordQuerySchema = z.object({
  contactId: z.string().uuid().optional(),
  direction: z.enum(["inbound", "outbound"]).optional(),
  status: z
    .enum(["completed", "missed", "voicemail", "busy", "failed"])
    .optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreatePhoneRecordInput = z.infer<typeof createPhoneRecordSchema>;
export type PhoneRecordQuery = z.infer<typeof phoneRecordQuerySchema>;
```

> **✅ Verification Checkpoint: Phone Records Schema**
> - [ ] `phone_records` table with all fields
> - [ ] Enums for direction, status, sentiment
> - [ ] Foreign key relationship to contacts
> - [ ] Vector index for transcription search
> - [ ] Zod validators created

---

### Level 3: Task 2.3 - Create Calendar Events and Tasks Schemas (3 Files)

#### Level 4: Step 2.3.1 - Create packages/db/src/schema/calendar-events.ts

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { contacts } from "./contacts";

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    allDay: boolean("all_day").default(false),
    location: varchar("location", { length: 500 }),
    // Store contact IDs as JSON array
    contactIds: text("contact_ids")
      .array()
      .default(sql`ARRAY[]::text[]`),
    reminderMinutes: integer("reminder_minutes"),
    // External calendar sync
    externalId: varchar("external_id", { length: 255 }),
    externalSource: varchar("external_source", { length: 50 }), // 'google', 'outlook', etc.
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    startTimeIdx: index("calendar_events_start_time_idx").on(table.startTime),
    endTimeIdx: index("calendar_events_end_time_idx").on(table.endTime),
    externalIdIdx: index("calendar_events_external_id_idx").on(
      table.externalId
    ),
  })
);

// Junction table for event-contact many-to-many
export const eventContacts = pgTable(
  "event_contacts",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => calendarEvents.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: index("event_contacts_pk").on(table.eventId, table.contactId),
  })
);

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;
```

#### Level 4: Step 2.3.2 - Create packages/db/src/schema/tasks.ts

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { contacts } from "./contacts";

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "done",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
]);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: taskStatusEnum("status").default("todo").notNull(),
    priority: taskPriorityEnum("priority").default("medium").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    tags: text("tags")
      .array()
      .default(sql`ARRAY[]::text[]`),
    // For recurring tasks
    recurringPattern: varchar("recurring_pattern", { length: 50 }), // 'daily', 'weekly', 'monthly'
    parentTaskId: uuid("parent_task_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    statusIdx: index("tasks_status_idx").on(table.status),
    priorityIdx: index("tasks_priority_idx").on(table.priority),
    dueDateIdx: index("tasks_due_date_idx").on(table.dueDate),
    contactIdIdx: index("tasks_contact_id_idx").on(table.contactId),
  })
);

// Self-referential relation for subtasks
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [tasks.contactId],
    references: [contacts.id],
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: "subtasks",
  }),
  subtasks: many(tasks, { relationName: "subtasks" }),
}));

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
```

#### Level 4: Step 2.3.3 - Create Calendar/Task Validators

Create `packages/db/src/schema/validators/calendar-task.ts`:

```typescript
import { z } from "zod";

// Calendar Event Validators
export const createCalendarEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  allDay: z.boolean().default(false),
  location: z.string().max(500).optional().nullable(),
  contactIds: z.array(z.string().uuid()).default([]),
  reminderMinutes: z.number().int().nonnegative().optional().nullable(),
});

export const updateCalendarEventSchema = createCalendarEventSchema.partial();

export const calendarEventQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  contactId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});

// Task Validators
export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.coerce.date().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).default([]),
  parentTaskId: z.string().uuid().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskQuerySchema = z.object({
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  contactId: z.string().uuid().optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
  tags: z.array(z.string()).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateCalendarEventInput = z.infer<
  typeof createCalendarEventSchema
>;
export type UpdateCalendarEventInput = z.infer<
  typeof updateCalendarEventSchema
>;
export type CalendarEventQuery = z.infer<typeof calendarEventQuerySchema>;

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;
```

#### Level 4: Step 2.3.4 - Update Schema Index Export

Update `packages/db/src/schema/index.ts`:

```typescript
// Export all schemas
export * from "./contacts";
export * from "./phone-records";
export * from "./calendar-events";
export * from "./tasks";

// Export validators
export * from "./validators/contact";
export * from "./validators/phone-record";
export * from "./validators/calendar-task";
```

> **✅ Verification Checkpoint: Calendar & Tasks Schemas**
> - [ ] `calendar_events` table with proper indexes
> - [ ] `tasks` table with status/priority enums
> - [ ] Junction table for event-contact relations
> - [ ] Self-referential relation for subtasks
> - [ ] All validators exported from schema index

---

### ⚠️ Debugging Gate: Drizzle Migration Issues

**Common Issues:**

| Symptom | Cause | Resolution |
|---------|-------|------------|
| "Cannot find module" | Schema not built | Run `pnpm --filter @repo/db build` |
| "Enum already exists" | Duplicate migration | Check and drop existing enum |
| "Relation does not exist" | Table not created | Run migrations in order |
| Type mismatch | Schema/DB out of sync | `pnpm db:push` to sync |
| "Invalid uuid" | Wrong UUID format | Use `sql\`gen_random_uuid()\`` |

**Diagnostic Commands:**
```bash
# Generate migrations from schema
cd packages/db
pnpm db:generate

# Push schema to database (dev only)
pnpm db:push

# Open Drizzle Studio to inspect
pnpm db:studio

# Check current schema in DB
psql -U bollalabz -d bollalabz_db -c "\dt"
psql -U bollalabz -d bollalabz_db -c "\d contacts"
```

---

## Level 2: API Endpoint Implementation

### Level 3: Task 2.4 - Build Contacts CRUD API (4 Files)

#### Level 4: Step 2.4.1 - Create apps/api/src/routes/contacts.ts

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@repo/db";
import { contacts } from "@repo/db/schema";
import {
  createContactSchema,
  updateContactSchema,
  contactQuerySchema,
} from "@repo/db/schema";
import { eq, ilike, or, sql, desc, asc } from "drizzle-orm";
import type { ApiResponse, PaginatedResponse, Contact } from "@repo/types";

const contactsRouter = new Hono();

// GET /contacts - List contacts with filtering and pagination
contactsRouter.get("/", zValidator("query", contactQuerySchema), async (c) => {
  const { search, company, tags, page, pageSize } = c.req.valid("query");

  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(contacts.firstName, `%${search}%`),
        ilike(contacts.lastName, `%${search}%`),
        ilike(contacts.email, `%${search}%`),
        ilike(contacts.phone, `%${search}%`)
      )
    );
  }

  if (company) {
    conditions.push(ilike(contacts.company, `%${company}%`));
  }

  // Query with pagination
  const [results, countResult] = await Promise.all([
    db
      .select()
      .from(contacts)
      .where(conditions.length > 0 ? sql`${conditions.join(" AND ")}` : undefined)
      .orderBy(desc(contacts.updatedAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(conditions.length > 0 ? sql`${conditions.join(" AND ")}` : undefined),
  ]);

  const total = Number(countResult[0]?.count || 0);

  const response: PaginatedResponse<Contact> = {
    data: results,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };

  return c.json(response);
});

// GET /contacts/:id - Get single contact
contactsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, id))
    .limit(1);

  if (!contact) {
    return c.json<ApiResponse<null>>(
      {
        data: null,
        success: false,
        message: "Contact not found",
        timestamp: new Date().toISOString(),
      },
      404
    );
  }

  return c.json<ApiResponse<Contact>>({
    data: contact,
    success: true,
    timestamp: new Date().toISOString(),
  });
});

// POST /contacts - Create contact
contactsRouter.post(
  "/",
  zValidator("json", createContactSchema),
  async (c) => {
    const input = c.req.valid("json");

    const [contact] = await db.insert(contacts).values(input).returning();

    return c.json<ApiResponse<Contact>>(
      {
        data: contact,
        success: true,
        message: "Contact created successfully",
        timestamp: new Date().toISOString(),
      },
      201
    );
  }
);

// PATCH /contacts/:id - Update contact
contactsRouter.patch(
  "/:id",
  zValidator("json", updateContactSchema),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");

    const [contact] = await db
      .update(contacts)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();

    if (!contact) {
      return c.json<ApiResponse<null>>(
        {
          data: null,
          success: false,
          message: "Contact not found",
          timestamp: new Date().toISOString(),
        },
        404
      );
    }

    return c.json<ApiResponse<Contact>>({
      data: contact,
      success: true,
      message: "Contact updated successfully",
      timestamp: new Date().toISOString(),
    });
  }
);

// DELETE /contacts/:id - Delete contact
contactsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const [deleted] = await db
    .delete(contacts)
    .where(eq(contacts.id, id))
    .returning({ id: contacts.id });

  if (!deleted) {
    return c.json<ApiResponse<null>>(
      {
        data: null,
        success: false,
        message: "Contact not found",
        timestamp: new Date().toISOString(),
      },
      404
    );
  }

  return c.json<ApiResponse<{ id: string }>>({
    data: { id: deleted.id },
    success: true,
    message: "Contact deleted successfully",
    timestamp: new Date().toISOString(),
  });
});

export { contactsRouter };
```

#### Level 4: Step 2.4.2 - Install Zod Validator Middleware

```bash
cd apps/api
pnpm add @hono/zod-validator
```

#### Level 4: Step 2.4.3 - Update apps/api/src/index.ts

```typescript
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { contactsRouter } from "./routes/contacts";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "0.0.1",
  });
});

// API routes
app.route("/api/contacts", contactsRouter);

// Root
app.get("/", (c) => {
  return c.json({
    message: "BollaLabz API Gateway",
    endpoints: {
      contacts: "/api/contacts",
      phoneRecords: "/api/phone-records",
      tasks: "/api/tasks",
      calendar: "/api/calendar",
    },
  });
});

const port = parseInt(process.env.PORT || "4000", 10);

console.log(`🚀 API Gateway running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
```

> **✅ Verification Checkpoint: Contacts API**
> - [ ] GET /api/contacts - List with pagination/filtering
> - [ ] GET /api/contacts/:id - Get single contact
> - [ ] POST /api/contacts - Create contact
> - [ ] PATCH /api/contacts/:id - Update contact
> - [ ] DELETE /api/contacts/:id - Delete contact
> - [ ] Zod validation on all inputs

---

### Level 3: Task 2.5 - Build Phone Records API (4 Files)

#### Level 4: Step 2.5.1 - Create apps/api/src/routes/phone-records.ts

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@repo/db";
import { phoneRecords, contacts } from "@repo/db/schema";
import {
  createPhoneRecordSchema,
  phoneRecordQuerySchema,
} from "@repo/db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import type { ApiResponse, PaginatedResponse, PhoneRecord } from "@repo/types";

const phoneRecordsRouter = new Hono();

// GET /phone-records - List with filtering
phoneRecordsRouter.get(
  "/",
  zValidator("query", phoneRecordQuerySchema),
  async (c) => {
    const {
      contactId,
      direction,
      status,
      startDate,
      endDate,
      search,
      page,
      pageSize,
    } = c.req.valid("query");

    const offset = (page - 1) * pageSize;

    // Build conditions
    const conditions = [];

    if (contactId) {
      conditions.push(eq(phoneRecords.contactId, contactId));
    }
    if (direction) {
      conditions.push(eq(phoneRecords.direction, direction));
    }
    if (status) {
      conditions.push(eq(phoneRecords.status, status));
    }
    if (startDate) {
      conditions.push(gte(phoneRecords.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(phoneRecords.createdAt, endDate));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [results, countResult] = await Promise.all([
      db
        .select({
          phoneRecord: phoneRecords,
          contact: contacts,
        })
        .from(phoneRecords)
        .leftJoin(contacts, eq(phoneRecords.contactId, contacts.id))
        .where(whereClause)
        .orderBy(desc(phoneRecords.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(phoneRecords)
        .where(whereClause),
    ]);

    const total = Number(countResult[0]?.count || 0);

    const response: PaginatedResponse<PhoneRecord & { contact?: typeof contacts.$inferSelect }> = {
      data: results.map((r) => ({
        ...r.phoneRecord,
        contact: r.contact || undefined,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };

    return c.json(response);
  }
);

// GET /phone-records/:id
phoneRecordsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  const [result] = await db
    .select({
      phoneRecord: phoneRecords,
      contact: contacts,
    })
    .from(phoneRecords)
    .leftJoin(contacts, eq(phoneRecords.contactId, contacts.id))
    .where(eq(phoneRecords.id, id))
    .limit(1);

  if (!result) {
    return c.json<ApiResponse<null>>(
      {
        data: null,
        success: false,
        message: "Phone record not found",
        timestamp: new Date().toISOString(),
      },
      404
    );
  }

  return c.json<ApiResponse<PhoneRecord>>({
    data: { ...result.phoneRecord, contact: result.contact || undefined },
    success: true,
    timestamp: new Date().toISOString(),
  });
});

// POST /phone-records
phoneRecordsRouter.post(
  "/",
  zValidator("json", createPhoneRecordSchema),
  async (c) => {
    const input = c.req.valid("json");

    // Auto-match contact by phone number if not provided
    let contactId = input.contactId;
    if (!contactId && input.phoneNumber) {
      const [matchedContact] = await db
        .select({ id: contacts.id })
        .from(contacts)
        .where(eq(contacts.phone, input.phoneNumber))
        .limit(1);

      if (matchedContact) {
        contactId = matchedContact.id;
      }
    }

    const [record] = await db
      .insert(phoneRecords)
      .values({ ...input, contactId })
      .returning();

    // Update contact's last contacted date
    if (contactId) {
      await db
        .update(contacts)
        .set({ lastContactedAt: new Date() })
        .where(eq(contacts.id, contactId));
    }

    return c.json<ApiResponse<PhoneRecord>>(
      {
        data: record,
        success: true,
        message: "Phone record created successfully",
        timestamp: new Date().toISOString(),
      },
      201
    );
  }
);

// GET /phone-records/stats - Get call statistics
phoneRecordsRouter.get("/stats/summary", async (c) => {
  const stats = await db
    .select({
      totalCalls: sql<number>`count(*)`,
      totalDuration: sql<number>`sum(duration)`,
      inboundCount: sql<number>`count(*) filter (where direction = 'inbound')`,
      outboundCount: sql<number>`count(*) filter (where direction = 'outbound')`,
      completedCount: sql<number>`count(*) filter (where status = 'completed')`,
      missedCount: sql<number>`count(*) filter (where status = 'missed')`,
    })
    .from(phoneRecords);

  return c.json<ApiResponse<typeof stats[0]>>({
    data: stats[0],
    success: true,
    timestamp: new Date().toISOString(),
  });
});

export { phoneRecordsRouter };
```

#### Level 4: Step 2.5.2 - Register Phone Records Route

Update `apps/api/src/index.ts`:

```typescript
import { phoneRecordsRouter } from "./routes/phone-records";

// Add after contacts route
app.route("/api/phone-records", phoneRecordsRouter);
```

> **✅ Verification Checkpoint: Phone Records API**
> - [ ] GET /api/phone-records - List with date range filtering
> - [ ] GET /api/phone-records/:id - Get single record with contact
> - [ ] POST /api/phone-records - Create with auto contact matching
> - [ ] GET /api/phone-records/stats/summary - Aggregate statistics

---

### Level 3: Task 2.6 - Build Calendar/Tasks API (4 Files)

#### Level 4: Step 2.6.1 - Create apps/api/src/routes/calendar.ts

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@repo/db";
import { calendarEvents, eventContacts, contacts } from "@repo/db/schema";
import {
  createCalendarEventSchema,
  updateCalendarEventSchema,
  calendarEventQuerySchema,
} from "@repo/db/schema";
import { eq, and, gte, lte, desc, sql, inArray } from "drizzle-orm";
import type { ApiResponse, PaginatedResponse, CalendarEvent } from "@repo/types";

const calendarRouter = new Hono();

// GET /calendar - List events
calendarRouter.get(
  "/",
  zValidator("query", calendarEventQuerySchema),
  async (c) => {
    const { startDate, endDate, contactId, page, pageSize } =
      c.req.valid("query");

    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (startDate) {
      conditions.push(gte(calendarEvents.startTime, startDate));
    }
    if (endDate) {
      conditions.push(lte(calendarEvents.endTime, endDate));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [results, countResult] = await Promise.all([
      db
        .select()
        .from(calendarEvents)
        .where(whereClause)
        .orderBy(calendarEvents.startTime)
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(calendarEvents)
        .where(whereClause),
    ]);

    const total = Number(countResult[0]?.count || 0);

    return c.json<PaginatedResponse<CalendarEvent>>({
      data: results,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  }
);

// GET /calendar/:id
calendarRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  const [event] = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.id, id))
    .limit(1);

  if (!event) {
    return c.json<ApiResponse<null>>(
      {
        data: null,
        success: false,
        message: "Event not found",
        timestamp: new Date().toISOString(),
      },
      404
    );
  }

  // Get associated contacts
  const eventContactsList = await db
    .select({ contact: contacts })
    .from(eventContacts)
    .innerJoin(contacts, eq(eventContacts.contactId, contacts.id))
    .where(eq(eventContacts.eventId, id));

  return c.json<ApiResponse<CalendarEvent & { contacts: typeof contacts.$inferSelect[] }>>({
    data: {
      ...event,
      contacts: eventContactsList.map((ec) => ec.contact),
    },
    success: true,
    timestamp: new Date().toISOString(),
  });
});

// POST /calendar
calendarRouter.post(
  "/",
  zValidator("json", createCalendarEventSchema),
  async (c) => {
    const input = c.req.valid("json");
    const { contactIds, ...eventData } = input;

    const [event] = await db
      .insert(calendarEvents)
      .values(eventData)
      .returning();

    // Add contact associations
    if (contactIds && contactIds.length > 0) {
      await db.insert(eventContacts).values(
        contactIds.map((contactId) => ({
          eventId: event.id,
          contactId,
        }))
      );
    }

    return c.json<ApiResponse<CalendarEvent>>(
      {
        data: event,
        success: true,
        message: "Event created successfully",
        timestamp: new Date().toISOString(),
      },
      201
    );
  }
);

// PATCH /calendar/:id
calendarRouter.patch(
  "/:id",
  zValidator("json", updateCalendarEventSchema),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const { contactIds, ...eventData } = input;

    const [event] = await db
      .update(calendarEvents)
      .set({ ...eventData, updatedAt: new Date() })
      .where(eq(calendarEvents.id, id))
      .returning();

    if (!event) {
      return c.json<ApiResponse<null>>(
        {
          data: null,
          success: false,
          message: "Event not found",
          timestamp: new Date().toISOString(),
        },
        404
      );
    }

    // Update contact associations if provided
    if (contactIds !== undefined) {
      await db.delete(eventContacts).where(eq(eventContacts.eventId, id));
      if (contactIds.length > 0) {
        await db.insert(eventContacts).values(
          contactIds.map((contactId) => ({
            eventId: id,
            contactId,
          }))
        );
      }
    }

    return c.json<ApiResponse<CalendarEvent>>({
      data: event,
      success: true,
      message: "Event updated successfully",
      timestamp: new Date().toISOString(),
    });
  }
);

// DELETE /calendar/:id
calendarRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const [deleted] = await db
    .delete(calendarEvents)
    .where(eq(calendarEvents.id, id))
    .returning({ id: calendarEvents.id });

  if (!deleted) {
    return c.json<ApiResponse<null>>(
      {
        data: null,
        success: false,
        message: "Event not found",
        timestamp: new Date().toISOString(),
      },
      404
    );
  }

  return c.json<ApiResponse<{ id: string }>>({
    data: { id: deleted.id },
    success: true,
    message: "Event deleted successfully",
    timestamp: new Date().toISOString(),
  });
});

export { calendarRouter };
```

#### Level 4: Step 2.6.2 - Create apps/api/src/routes/tasks.ts

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@repo/db";
import { tasks, contacts } from "@repo/db/schema";
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
} from "@repo/db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import type { ApiResponse, PaginatedResponse, Task } from "@repo/types";

const tasksRouter = new Hono();

// GET /tasks
tasksRouter.get("/", zValidator("query", taskQuerySchema), async (c) => {
  const { status, priority, contactId, dueBefore, dueAfter, page, pageSize } =
    c.req.valid("query");

  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (status) {
    conditions.push(eq(tasks.status, status));
  }
  if (priority) {
    conditions.push(eq(tasks.priority, priority));
  }
  if (contactId) {
    conditions.push(eq(tasks.contactId, contactId));
  }
  if (dueBefore) {
    conditions.push(lte(tasks.dueDate, dueBefore));
  }
  if (dueAfter) {
    conditions.push(gte(tasks.dueDate, dueAfter));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [results, countResult] = await Promise.all([
    db
      .select({
        task: tasks,
        contact: contacts,
      })
      .from(tasks)
      .leftJoin(contacts, eq(tasks.contactId, contacts.id))
      .where(whereClause)
      .orderBy(
        desc(sql`CASE WHEN ${tasks.priority} = 'high' THEN 1 WHEN ${tasks.priority} = 'medium' THEN 2 ELSE 3 END`),
        tasks.dueDate
      )
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(whereClause),
  ]);

  const total = Number(countResult[0]?.count || 0);

  return c.json<PaginatedResponse<Task & { contact?: typeof contacts.$inferSelect }>>({
    data: results.map((r) => ({
      ...r.task,
      contact: r.contact || undefined,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

// GET /tasks/:id
tasksRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  const [result] = await db
    .select({
      task: tasks,
      contact: contacts,
    })
    .from(tasks)
    .leftJoin(contacts, eq(tasks.contactId, contacts.id))
    .where(eq(tasks.id, id))
    .limit(1);

  if (!result) {
    return c.json<ApiResponse<null>>(
      {
        data: null,
        success: false,
        message: "Task not found",
        timestamp: new Date().toISOString(),
      },
      404
    );
  }

  return c.json<ApiResponse<Task>>({
    data: { ...result.task, contact: result.contact || undefined },
    success: true,
    timestamp: new Date().toISOString(),
  });
});

// POST /tasks
tasksRouter.post("/", zValidator("json", createTaskSchema), async (c) => {
  const input = c.req.valid("json");

  const [task] = await db.insert(tasks).values(input).returning();

  return c.json<ApiResponse<Task>>(
    {
      data: task,
      success: true,
      message: "Task created successfully",
      timestamp: new Date().toISOString(),
    },
    201
  );
});

// PATCH /tasks/:id
tasksRouter.patch(
  "/:id",
  zValidator("json", updateTaskSchema),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");

    // Handle completion
    const updateData: any = { ...input, updatedAt: new Date() };
    if (input.status === "done" && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }

    const [task] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();

    if (!task) {
      return c.json<ApiResponse<null>>(
        {
          data: null,
          success: false,
          message: "Task not found",
          timestamp: new Date().toISOString(),
        },
        404
      );
    }

    return c.json<ApiResponse<Task>>({
      data: task,
      success: true,
      message: "Task updated successfully",
      timestamp: new Date().toISOString(),
    });
  }
);

// DELETE /tasks/:id
tasksRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const [deleted] = await db
    .delete(tasks)
    .where(eq(tasks.id, id))
    .returning({ id: tasks.id });

  if (!deleted) {
    return c.json<ApiResponse<null>>(
      {
        data: null,
        success: false,
        message: "Task not found",
        timestamp: new Date().toISOString(),
      },
      404
    );
  }

  return c.json<ApiResponse<{ id: string }>>({
    data: { id: deleted.id },
    success: true,
    message: "Task deleted successfully",
    timestamp: new Date().toISOString(),
  });
});

export { tasksRouter };
```

#### Level 4: Step 2.6.3 - Register Routes in Main App

Update `apps/api/src/index.ts`:

```typescript
import { calendarRouter } from "./routes/calendar";
import { tasksRouter } from "./routes/tasks";

// Add routes
app.route("/api/calendar", calendarRouter);
app.route("/api/tasks", tasksRouter);
```

> **✅ Verification Checkpoint: Calendar & Tasks API**
> - [ ] Full CRUD for calendar events
> - [ ] Event-contact associations working
> - [ ] Full CRUD for tasks
> - [ ] Task priority sorting working
> - [ ] Date range filtering on both entities

---

## Level 2: Redis & Job Queue Setup

### Level 3: Task 2.7 - Setup Redis + BullMQ (3 Files)

#### Level 4: Step 2.7.1 - Install Redis on VPS2

```bash
# SSH to VPS2
ssh root@93.127.197.222

# Install Redis
sudo apt update
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
```

Edit configuration:

```ini
# Memory limit (512MB as per budget)
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security - bind to localhost and Tailscale
bind 127.0.0.1 <vps2-tailscale-ip>

# Require password
requirepass your-redis-password-here
```

```bash
# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Test connection
redis-cli -a your-redis-password-here ping
# Expected: PONG
```

#### Level 4: Step 2.7.2 - Create Queue Infrastructure Package

Create `packages/queue/package.json`:

```json
{
  "name": "@repo/queue",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "bullmq": "^5.65.0",
    "ioredis": "^5.4.0"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "tsup": "^8.3.0",
    "typescript": "^5.7.0"
  }
}
```

#### Level 4: Step 2.7.3 - Create packages/queue/src/index.ts

```typescript
import { Queue, Worker, QueueEvents } from "bullmq";
import Redis from "ioredis";

// Redis connection
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

// Create Redis connection for BullMQ
export const redisConnection = new Redis(redisConfig);

// Queue names
export const QUEUE_NAMES = {
  EMBEDDING_GENERATION: "embedding-generation",
  CALL_TRANSCRIPTION: "call-transcription",
  CALL_SUMMARY: "call-summary",
  NOTIFICATION: "notification",
  CONTACT_SYNC: "contact-sync",
} as const;

// Queue factory
export function createQueue(name: string) {
  return new Queue(name, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: {
        count: 100,
        age: 24 * 3600, // 24 hours
      },
      removeOnFail: {
        count: 500,
      },
    },
  });
}

// Worker factory
export function createWorker<T>(
  name: string,
  processor: (job: { data: T; id?: string }) => Promise<void>,
  concurrency: number = 1
) {
  return new Worker(name, processor, {
    connection: redisConnection,
    concurrency,
  });
}

// Queue events for monitoring
export function createQueueEvents(name: string) {
  return new QueueEvents(name, {
    connection: redisConnection,
  });
}

// Pre-configured queues
export const embeddingQueue = createQueue(QUEUE_NAMES.EMBEDDING_GENERATION);
export const transcriptionQueue = createQueue(QUEUE_NAMES.CALL_TRANSCRIPTION);
export const summaryQueue = createQueue(QUEUE_NAMES.CALL_SUMMARY);
export const notificationQueue = createQueue(QUEUE_NAMES.NOTIFICATION);

// Job type definitions
export interface EmbeddingJob {
  type: "contact" | "phone_record";
  id: string;
  text: string;
}

export interface TranscriptionJob {
  phoneRecordId: string;
  recordingUrl: string;
}

export interface SummaryJob {
  phoneRecordId: string;
  transcription: string;
}

export interface NotificationJob {
  type: "email" | "push" | "sms";
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// Helper to add jobs
export async function addEmbeddingJob(data: EmbeddingJob) {
  return embeddingQueue.add("generate", data);
}

export async function addTranscriptionJob(data: TranscriptionJob) {
  return transcriptionQueue.add("transcribe", data);
}

export async function addSummaryJob(data: SummaryJob) {
  return summaryQueue.add("summarize", data);
}

export async function addNotificationJob(data: NotificationJob) {
  return notificationQueue.add("send", data);
}
```

#### Level 4: Step 2.7.4 - Add Redis Environment Variables

Update `.env` files:

```bash
# apps/api/.env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password-here
```

For production (via Tailscale):
```bash
REDIS_HOST=<vps2-tailscale-ip>
```

> **✅ Verification Checkpoint: Redis & BullMQ**
> - [ ] Redis installed and running on VPS2
> - [ ] Password authentication configured
> - [ ] Memory limit set to 512MB
> - [ ] @repo/queue package created
> - [ ] Queue factories and job types defined

---

### ⚠️ Debugging Gate: Redis + BullMQ Issues

**Common Issues:**

| Symptom | Cause | Resolution |
|---------|-------|------------|
| "NOAUTH" error | Password not set | Add `REDIS_PASSWORD` env var |
| "Connection refused" | Redis not running | `systemctl start redis-server` |
| Jobs stuck in waiting | Worker not started | Create and start worker instances |
| Memory limit exceeded | Too many jobs | Check `maxmemory-policy`, clear old jobs |
| "CROSSSLOT" error | Wrong cluster config | Use single Redis instance, not cluster |

**Diagnostic Commands:**
```bash
# Check Redis status
sudo systemctl status redis-server

# Monitor Redis in real-time
redis-cli -a <password> monitor

# Check memory usage
redis-cli -a <password> info memory

# List queues
redis-cli -a <password> keys "bull:*"

# Check queue length
redis-cli -a <password> llen "bull:embedding-generation:wait"
```

---

## Level 2: Vector Similarity Search

### Level 3: Task 2.8 - Add Vector Similarity Search Endpoint (3 Files)

#### Level 4: Step 2.8.1 - Create apps/api/src/routes/search.ts

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@repo/db";
import { contacts, phoneRecords } from "@repo/db/schema";
import { sql } from "drizzle-orm";
import type { ApiResponse } from "@repo/types";

const searchRouter = new Hono();

const semanticSearchSchema = z.object({
  query: z.string().min(1).max(1000),
  type: z.enum(["contacts", "phone_records", "all"]).default("all"),
  limit: z.coerce.number().int().positive().max(50).default(10),
  threshold: z.coerce.number().min(0).max(1).default(0.7),
});

// Placeholder for embedding generation - will be replaced with actual API call in Part 3
async function generateEmbedding(text: string): Promise<number[]> {
  // This will call the AI service to generate embeddings
  // For now, return a mock embedding
  console.log("Generating embedding for:", text.slice(0, 50));
  return Array(768).fill(0).map(() => Math.random());
}

// POST /search/semantic - Vector similarity search
searchRouter.post(
  "/semantic",
  zValidator("json", semanticSearchSchema),
  async (c) => {
    const { query, type, limit, threshold } = c.req.valid("json");

    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    const results: any = {
      contacts: [],
      phoneRecords: [],
    };

    // Search contacts
    if (type === "contacts" || type === "all") {
      const contactResults = await db.execute(sql`
        SELECT 
          id, first_name, last_name, email, phone, company, job_title, notes,
          1 - (embedding_vec <=> ${embeddingStr}::halfvec) as similarity
        FROM contacts
        WHERE embedding_vec IS NOT NULL
          AND 1 - (embedding_vec <=> ${embeddingStr}::halfvec) >= ${threshold}
        ORDER BY embedding_vec <=> ${embeddingStr}::halfvec
        LIMIT ${limit}
      `);

      results.contacts = contactResults.rows;
    }

    // Search phone records (transcriptions)
    if (type === "phone_records" || type === "all") {
      const phoneResults = await db.execute(sql`
        SELECT 
          pr.id, pr.phone_number, pr.direction, pr.status, pr.duration,
          pr.transcription, pr.summary, pr.created_at,
          c.first_name as contact_first_name, c.last_name as contact_last_name,
          1 - (pr.embedding_vec <=> ${embeddingStr}::halfvec) as similarity
        FROM phone_records pr
        LEFT JOIN contacts c ON pr.contact_id = c.id
        WHERE pr.embedding_vec IS NOT NULL
          AND 1 - (pr.embedding_vec <=> ${embeddingStr}::halfvec) >= ${threshold}
        ORDER BY pr.embedding_vec <=> ${embeddingStr}::halfvec
        LIMIT ${limit}
      `);

      results.phoneRecords = phoneResults.rows;
    }

    return c.json<ApiResponse<typeof results>>({
      data: results,
      success: true,
      timestamp: new Date().toISOString(),
    });
  }
);

// GET /search/fulltext - Full-text search
const fulltextSearchSchema = z.object({
  query: z.string().min(1).max(500),
  type: z.enum(["contacts", "phone_records", "all"]).default("all"),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

searchRouter.get(
  "/fulltext",
  zValidator("query", fulltextSearchSchema),
  async (c) => {
    const { query, type, limit } = c.req.valid("query");

    const results: any = {
      contacts: [],
      phoneRecords: [],
    };

    // Full-text search on contacts
    if (type === "contacts" || type === "all") {
      const contactResults = await db.execute(sql`
        SELECT 
          id, first_name, last_name, email, phone, company, job_title, notes,
          ts_rank(
            to_tsvector('english', 
              coalesce(first_name, '') || ' ' || 
              coalesce(last_name, '') || ' ' || 
              coalesce(company, '') || ' ' || 
              coalesce(notes, '')
            ),
            plainto_tsquery('english', ${query})
          ) as rank
        FROM contacts
        WHERE to_tsvector('english', 
          coalesce(first_name, '') || ' ' || 
          coalesce(last_name, '') || ' ' || 
          coalesce(company, '') || ' ' || 
          coalesce(notes, '')
        ) @@ plainto_tsquery('english', ${query})
        ORDER BY rank DESC
        LIMIT ${limit}
      `);

      results.contacts = contactResults.rows;
    }

    // Full-text search on phone records
    if (type === "phone_records" || type === "all") {
      const phoneResults = await db.execute(sql`
        SELECT 
          pr.id, pr.phone_number, pr.direction, pr.status, pr.duration,
          pr.transcription, pr.summary, pr.created_at,
          c.first_name as contact_first_name, c.last_name as contact_last_name,
          ts_rank(
            to_tsvector('english', 
              coalesce(pr.transcription, '') || ' ' || 
              coalesce(pr.summary, '')
            ),
            plainto_tsquery('english', ${query})
          ) as rank
        FROM phone_records pr
        LEFT JOIN contacts c ON pr.contact_id = c.id
        WHERE to_tsvector('english', 
          coalesce(pr.transcription, '') || ' ' || 
          coalesce(pr.summary, '')
        ) @@ plainto_tsquery('english', ${query})
        ORDER BY rank DESC
        LIMIT ${limit}
      `);

      results.phoneRecords = phoneResults.rows;
    }

    return c.json<ApiResponse<typeof results>>({
      data: results,
      success: true,
      timestamp: new Date().toISOString(),
    });
  }
);

export { searchRouter };
```

#### Level 4: Step 2.8.2 - Register Search Route

Update `apps/api/src/index.ts`:

```typescript
import { searchRouter } from "./routes/search";

// Add route
app.route("/api/search", searchRouter);
```

> **✅ Verification Checkpoint: Vector Search**
> - [ ] POST /api/search/semantic - Vector similarity search
> - [ ] GET /api/search/fulltext - Full-text search
> - [ ] Threshold filtering working
> - [ ] Results include similarity/rank scores

---

## Part 2 Summary

**Tasks Completed:** 8 (2.1-2.8)  
**Files Created:** 28+  
**Time Estimate:** Week 3-4

### What Was Established:

1. ✅ PostgreSQL 17 installed with production config
2. ✅ pgvector extension enabled with HNSW indexes
3. ✅ All database schemas created (contacts, phone_records, calendar_events, tasks)
4. ✅ Full CRUD API endpoints for all entities
5. ✅ Redis installed and configured
6. ✅ BullMQ job queue infrastructure
7. ✅ Vector similarity search endpoint
8. ✅ Full-text search endpoint

### Database Connection String

```
postgresql://bollalabz:your-password@<vps2-tailscale-ip>:5432/bollalabz_db
```

### API Endpoints Summary

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/contacts` | GET, POST | List/Create contacts |
| `/api/contacts/:id` | GET, PATCH, DELETE | Single contact operations |
| `/api/phone-records` | GET, POST | List/Create phone records |
| `/api/phone-records/:id` | GET | Single phone record |
| `/api/phone-records/stats/summary` | GET | Call statistics |
| `/api/calendar` | GET, POST | List/Create events |
| `/api/calendar/:id` | GET, PATCH, DELETE | Single event operations |
| `/api/tasks` | GET, POST | List/Create tasks |
| `/api/tasks/:id` | GET, PATCH, DELETE | Single task operations |
| `/api/search/semantic` | POST | Vector similarity search |
| `/api/search/fulltext` | GET | Full-text search |

### Next Steps (Part 3):
- Build frontend UI components with shadcn/ui
- Implement TanStack Query data fetching
- Set up Zustand state management
- Initialize FastAPI AI service
- Integrate Deepgram streaming STT
- Integrate ElevenLabs TTS
- Build Claude Sonnet 4 streaming endpoint
- Create voice pipeline orchestration

---

**End of Part 2**
