/**
 * Vector Similarity Search Service
 * PostgreSQL pgvector-powered semantic search for contacts and phone records
 *
 * November 2025 Production Standards:
 * - Type-safe results with Drizzle ORM
 * - Configurable similarity thresholds
 * - Pagination support
 * - Performance-optimized queries
 */

import { db, contacts, phoneRecords } from "@repo/db";
import { sql, isNull } from "drizzle-orm";
import { generateEmbedding } from "./embeddings";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchResult<T> {
  item: T;
  similarity: number;
}

export interface SearchOptions {
  limit?: number;
  minSimilarity?: number;
  offset?: number;
}

export interface ContactSearchResult extends SearchResult<typeof contacts.$inferSelect> {}
export interface PhoneRecordSearchResult extends SearchResult<typeof phoneRecords.$inferSelect> {}

// Default search configuration
const DEFAULT_LIMIT = 10;
const DEFAULT_MIN_SIMILARITY = 0.7;
const DEFAULT_OFFSET = 0;

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Format embedding array for PostgreSQL vector type
 */
function formatEmbeddingForPg(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/**
 * Parse raw database row to typed result
 */
function parseSearchRow<T>(row: Record<string, unknown>): SearchResult<T> {
  const { similarity, ...item } = row;
  return {
    item: item as T,
    similarity: Number(similarity) || 0,
  };
}

// ---------------------------------------------------------------------------
// Contact Search Functions
// ---------------------------------------------------------------------------

/**
 * Search contacts using vector similarity
 * Uses cosine distance operator (<=>)
 */
export async function searchContacts(
  query: string,
  options: SearchOptions = {}
): Promise<ContactSearchResult[]> {
  const {
    limit = DEFAULT_LIMIT,
    minSimilarity = DEFAULT_MIN_SIMILARITY,
    offset = DEFAULT_OFFSET,
  } = options;

  // Generate embedding for the search query
  const queryEmbedding = await generateEmbedding(query);
  const embeddingStr = formatEmbeddingForPg(queryEmbedding);

  // Execute vector similarity search
  // Using cosine distance: 1 - (embedding <=> query) gives similarity
  const results = await db.execute<Record<string, unknown>>(sql`
    SELECT
      id,
      first_name as "firstName",
      last_name as "lastName",
      email,
      phone,
      company,
      job_title as "jobTitle",
      notes,
      tags,
      avatar_url as "avatarUrl",
      relationship_score as "relationshipScore",
      last_contacted_at as "lastContactedAt",
      created_at as "createdAt",
      updated_at as "updatedAt",
      1 - (embedding::vector <=> ${embeddingStr}::vector) as similarity
    FROM contacts
    WHERE embedding IS NOT NULL
      AND 1 - (embedding::vector <=> ${embeddingStr}::vector) > ${minSimilarity}
    ORDER BY embedding::vector <=> ${embeddingStr}::vector
    LIMIT ${limit}
    OFFSET ${offset}
  `);

  return results.map((row) => parseSearchRow<typeof contacts.$inferSelect>(row));
}

/**
 * Find similar contacts to a given contact ID
 */
export async function findSimilarContacts(
  contactId: string,
  options: SearchOptions = {}
): Promise<ContactSearchResult[]> {
  const {
    limit = DEFAULT_LIMIT,
    minSimilarity = DEFAULT_MIN_SIMILARITY,
  } = options;

  // Get the source contact's embedding
  const sourceContact = await db.execute<{ embedding: string }>(sql`
    SELECT embedding FROM contacts WHERE id = ${contactId}
  `);

  if (!sourceContact[0]?.embedding) {
    throw new Error(`Contact ${contactId} not found or has no embedding`);
  }

  const embeddingStr = sourceContact[0].embedding;

  // Find similar contacts (excluding the source)
  const results = await db.execute<Record<string, unknown>>(sql`
    SELECT
      id,
      first_name as "firstName",
      last_name as "lastName",
      email,
      phone,
      company,
      job_title as "jobTitle",
      notes,
      tags,
      avatar_url as "avatarUrl",
      relationship_score as "relationshipScore",
      last_contacted_at as "lastContactedAt",
      created_at as "createdAt",
      updated_at as "updatedAt",
      1 - (embedding::vector <=> ${embeddingStr}::vector) as similarity
    FROM contacts
    WHERE embedding IS NOT NULL
      AND id != ${contactId}
      AND 1 - (embedding::vector <=> ${embeddingStr}::vector) > ${minSimilarity}
    ORDER BY embedding::vector <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `);

  return results.map((row) => parseSearchRow<typeof contacts.$inferSelect>(row));
}

// ---------------------------------------------------------------------------
// Phone Record Search Functions
// ---------------------------------------------------------------------------

/**
 * Search phone records by transcription content using vector similarity
 */
export async function searchPhoneRecords(
  query: string,
  options: SearchOptions & { contactId?: string } = {}
): Promise<PhoneRecordSearchResult[]> {
  const {
    limit = DEFAULT_LIMIT,
    minSimilarity = DEFAULT_MIN_SIMILARITY,
    offset = DEFAULT_OFFSET,
    contactId,
  } = options;

  // Generate embedding for the search query
  const queryEmbedding = await generateEmbedding(query);
  const embeddingStr = formatEmbeddingForPg(queryEmbedding);

  // Build the query with optional contact filter
  let results: Record<string, unknown>[];

  if (contactId) {
    results = await db.execute<Record<string, unknown>>(sql`
      SELECT
        id,
        contact_id as "contactId",
        phone_number as "phoneNumber",
        direction,
        status,
        duration,
        twilio_call_sid as "twilioCallSid",
        twilio_account_sid as "twilioAccountSid",
        twilio_from as "twilioFrom",
        twilio_to as "twilioTo",
        twilio_status as "twilioStatus",
        twilio_direction as "twilioDirection",
        recording_url as "recordingUrl",
        recording_sid as "recordingSid",
        transcription,
        summary,
        sentiment,
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt",
        1 - (embedding::vector <=> ${embeddingStr}::vector) as similarity
      FROM phone_records
      WHERE embedding IS NOT NULL
        AND contact_id = ${contactId}
        AND 1 - (embedding::vector <=> ${embeddingStr}::vector) > ${minSimilarity}
      ORDER BY embedding::vector <=> ${embeddingStr}::vector
      LIMIT ${limit}
      OFFSET ${offset}
    `);
  } else {
    results = await db.execute<Record<string, unknown>>(sql`
      SELECT
        id,
        contact_id as "contactId",
        phone_number as "phoneNumber",
        direction,
        status,
        duration,
        twilio_call_sid as "twilioCallSid",
        twilio_account_sid as "twilioAccountSid",
        twilio_from as "twilioFrom",
        twilio_to as "twilioTo",
        twilio_status as "twilioStatus",
        twilio_direction as "twilioDirection",
        recording_url as "recordingUrl",
        recording_sid as "recordingSid",
        transcription,
        summary,
        sentiment,
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt",
        1 - (embedding::vector <=> ${embeddingStr}::vector) as similarity
      FROM phone_records
      WHERE embedding IS NOT NULL
        AND 1 - (embedding::vector <=> ${embeddingStr}::vector) > ${minSimilarity}
      ORDER BY embedding::vector <=> ${embeddingStr}::vector
      LIMIT ${limit}
      OFFSET ${offset}
    `);
  }

  return results.map((row) => parseSearchRow<typeof phoneRecords.$inferSelect>(row));
}

/**
 * Search phone records with date range filtering
 */
export async function searchPhoneRecordsWithDateRange(
  query: string,
  startDate: Date,
  endDate: Date,
  options: SearchOptions = {}
): Promise<PhoneRecordSearchResult[]> {
  const {
    limit = DEFAULT_LIMIT,
    minSimilarity = DEFAULT_MIN_SIMILARITY,
    offset = DEFAULT_OFFSET,
  } = options;

  const queryEmbedding = await generateEmbedding(query);
  const embeddingStr = formatEmbeddingForPg(queryEmbedding);

  const results = await db.execute<Record<string, unknown>>(sql`
    SELECT
      id,
      contact_id as "contactId",
      phone_number as "phoneNumber",
      direction,
      status,
      duration,
      twilio_call_sid as "twilioCallSid",
      twilio_account_sid as "twilioAccountSid",
      twilio_from as "twilioFrom",
      twilio_to as "twilioTo",
      twilio_status as "twilioStatus",
      twilio_direction as "twilioDirection",
      recording_url as "recordingUrl",
      recording_sid as "recordingSid",
      transcription,
      summary,
      sentiment,
      metadata,
      created_at as "createdAt",
      updated_at as "updatedAt",
      1 - (embedding::vector <=> ${embeddingStr}::vector) as similarity
    FROM phone_records
    WHERE embedding IS NOT NULL
      AND created_at >= ${startDate.toISOString()}
      AND created_at <= ${endDate.toISOString()}
      AND 1 - (embedding::vector <=> ${embeddingStr}::vector) > ${minSimilarity}
    ORDER BY embedding::vector <=> ${embeddingStr}::vector
    LIMIT ${limit}
    OFFSET ${offset}
  `);

  return results.map((row) => parseSearchRow<typeof phoneRecords.$inferSelect>(row));
}

// ---------------------------------------------------------------------------
// Embedding Update Functions
// ---------------------------------------------------------------------------

/**
 * Update contact embedding
 */
export async function updateContactEmbedding(
  contactId: string,
  text: string
): Promise<void> {
  const embedding = await generateEmbedding(text);
  const embeddingStr = formatEmbeddingForPg(embedding);

  await db.execute(sql`
    UPDATE contacts
    SET embedding = ${embeddingStr}, updated_at = NOW()
    WHERE id = ${contactId}
  `);
}

/**
 * Update phone record embedding from transcription
 */
export async function updatePhoneRecordEmbedding(
  recordId: string,
  transcription: string
): Promise<void> {
  const embedding = await generateEmbedding(transcription);
  const embeddingStr = formatEmbeddingForPg(embedding);

  await db.execute(sql`
    UPDATE phone_records
    SET embedding = ${embeddingStr}, updated_at = NOW()
    WHERE id = ${recordId}
  `);
}

/**
 * Batch update embeddings for contacts without embeddings
 */
export async function backfillContactEmbeddings(
  batchSize: number = 50
): Promise<{ processed: number; failed: number }> {
  // Find contacts without embeddings
  const contactsWithoutEmbeddings = await db
    .select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      company: contacts.company,
      notes: contacts.notes,
    })
    .from(contacts)
    .where(isNull(contacts.embedding))
    .limit(batchSize);

  let processed = 0;
  let failed = 0;

  for (const contact of contactsWithoutEmbeddings) {
    try {
      // Build text representation for embedding
      const textParts = [
        contact.firstName,
        contact.lastName,
        contact.company,
        contact.notes,
      ].filter(Boolean);

      if (textParts.length === 0) continue;

      const text = textParts.join(" ");
      await updateContactEmbedding(contact.id, text);
      processed++;
    } catch (error) {
      console.error(`Failed to generate embedding for contact ${contact.id}:`, error);
      failed++;
    }
  }

  return { processed, failed };
}

/**
 * Batch update embeddings for phone records with transcriptions but no embeddings
 */
export async function backfillPhoneRecordEmbeddings(
  batchSize: number = 50
): Promise<{ processed: number; failed: number }> {
  // Find phone records with transcriptions but no embeddings
  const recordsWithoutEmbeddings = await db
    .select({
      id: phoneRecords.id,
      transcription: phoneRecords.transcription,
      summary: phoneRecords.summary,
    })
    .from(phoneRecords)
    .where(isNull(phoneRecords.embedding))
    .limit(batchSize);

  let processed = 0;
  let failed = 0;

  for (const record of recordsWithoutEmbeddings) {
    try {
      // Use transcription or summary for embedding
      const text = record.transcription || record.summary;
      if (!text) continue;

      await updatePhoneRecordEmbedding(record.id, text);
      processed++;
    } catch (error) {
      console.error(`Failed to generate embedding for phone record ${record.id}:`, error);
      failed++;
    }
  }

  return { processed, failed };
}

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Get statistics about embeddings in the database
 */
export async function getEmbeddingStats(): Promise<{
  contacts: { total: number; withEmbeddings: number };
  phoneRecords: { total: number; withEmbeddings: number };
}> {
  const contactStats = await db.execute<{ total: string; with_embeddings: string }>(sql`
    SELECT
      COUNT(*) as total,
      COUNT(embedding) as with_embeddings
    FROM contacts
  `);

  const phoneRecordStats = await db.execute<{ total: string; with_embeddings: string }>(sql`
    SELECT
      COUNT(*) as total,
      COUNT(embedding) as with_embeddings
    FROM phone_records
  `);

  return {
    contacts: {
      total: parseInt(contactStats[0]?.total || "0", 10),
      withEmbeddings: parseInt(contactStats[0]?.with_embeddings || "0", 10),
    },
    phoneRecords: {
      total: parseInt(phoneRecordStats[0]?.total || "0", 10),
      withEmbeddings: parseInt(phoneRecordStats[0]?.with_embeddings || "0", 10),
    },
  };
}
