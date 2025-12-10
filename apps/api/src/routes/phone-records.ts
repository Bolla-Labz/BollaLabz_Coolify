// 09 December 2025 10 30 00

/**
 * Phone Record Routes
 * CRUD operations for call history with transcription search
 */

import { Hono } from "hono";
import type {
  ApiResponse,
  PaginatedResponse,
  PhoneRecord,
  Transcript,
  CallStatus,
} from "@repo/types";
import {
  searchPhoneRecords as vectorSearchPhoneRecords,
  searchPhoneRecordsWithDateRange,
} from "../services";
import {
  validateBody,
  validateQuery,
  validateParams,
  apiRateLimiter,
  searchRateLimiter,
  webhookRateLimiter,
  requireAuth,
} from "../middleware";
import {
  createPhoneRecordSchema,
  listPhoneRecordsQuerySchema,
  searchPhoneRecordsQuerySchema,
  phoneRecordStatsQuerySchema,
  phoneRecordIdParamSchema,
  type CreatePhoneRecordInput,
  type ListPhoneRecordsQuery,
  type SearchPhoneRecordsQuery,
  type PhoneRecordStatsQuery,
} from "../schemas";
import { db } from "@repo/db";
import {
  phoneRecords as phoneRecordsTable,
  type PhoneRecord as DbPhoneRecord,
  type CallDirection,
  type CallStatus as DbCallStatus,
} from "@repo/db/schema";
import { eq, and, gte, lte, desc, asc, isNull, sql, count } from "drizzle-orm";

const phoneRecords = new Hono();

// Extended phone record with transcript data
interface PhoneRecordWithTranscript extends PhoneRecord {
  transcript?: Transcript;
}

/**
 * Maps database PhoneRecord to API PhoneRecord type
 * Handles missing fields by reading from metadata or computing defaults
 */
function mapDbRecordToApiRecord(dbRecord: DbPhoneRecord): PhoneRecord {
  const metadata = (dbRecord.metadata || {}) as Record<string, unknown>;

  // Extract or compute required API fields
  const startTime =
    typeof metadata.startTime === 'string'
      ? metadata.startTime
      : dbRecord.createdAt?.toISOString() || new Date().toISOString();

  const endTime =
    typeof metadata.endTime === 'string'
      ? metadata.endTime
      : dbRecord.updatedAt?.toISOString() || new Date().toISOString();

  const provider =
    typeof metadata.provider === 'string'
      ? metadata.provider
      : 'telnyx'; // Default to telnyx since we have telnyxCallControlId fields

  return {
    id: dbRecord.id,
    userId: dbRecord.userId,
    phoneNumber: dbRecord.phoneNumber,
    direction: dbRecord.direction as 'inbound' | 'outbound',
    status: dbRecord.status as CallStatus,
    duration: dbRecord.duration || 0,
    startTime,
    endTime,
    provider,
    ...(dbRecord.contactId && { contactId: dbRecord.contactId }),
    ...(dbRecord.recordingUrl && { recordingUrl: dbRecord.recordingUrl }),
    ...(typeof metadata.transcriptId === 'string' && { transcriptId: metadata.transcriptId }),
    ...(typeof metadata.cost === 'number' && { cost: metadata.cost }),
    ...(dbRecord.twilioCallSid && { providerId: dbRecord.twilioCallSid }),
    ...(dbRecord.metadata && { metadata: dbRecord.metadata }),
    ...(dbRecord.deletedAt && { deletedAt: dbRecord.deletedAt.toISOString() }),
  };
}

/**
 * GET /phone-records
 * List all phone records with filtering and pagination
 */
phoneRecords.get("/", requireAuth, apiRateLimiter, validateQuery(listPhoneRecordsQuerySchema), async (c) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    // Get validated query parameters
    const query = c.get("validatedQuery") as ListPhoneRecordsQuery;
    const { page, pageSize, sortBy, sortOrder } = query;

    // Build filter conditions
    const conditions = [isNull(phoneRecordsTable.deletedAt)];

    if (query.contactId) {
      conditions.push(eq(phoneRecordsTable.contactId, query.contactId));
    }
    if (query.direction) {
      conditions.push(eq(phoneRecordsTable.direction, query.direction));
    }
    if (query.status) {
      conditions.push(eq(phoneRecordsTable.status, query.status));
    }
    if (query.startDate) {
      conditions.push(gte(phoneRecordsTable.createdAt, new Date(query.startDate)));
    }
    if (query.endDate) {
      conditions.push(lte(phoneRecordsTable.createdAt, new Date(query.endDate)));
    }
    if (query.phoneNumber) {
      conditions.push(eq(phoneRecordsTable.phoneNumber, query.phoneNumber));
    }
    if (query.minDuration !== undefined) {
      conditions.push(gte(phoneRecordsTable.duration, query.minDuration));
    }
    if (query.maxDuration !== undefined) {
      conditions.push(lte(phoneRecordsTable.duration, query.maxDuration));
    }
    if (query.hasRecording !== undefined) {
      if (query.hasRecording) {
        conditions.push(sql`${phoneRecordsTable.recordingUrl} IS NOT NULL`);
      } else {
        conditions.push(isNull(phoneRecordsTable.recordingUrl));
      }
    }
    if (query.hasTranscript !== undefined) {
      if (query.hasTranscript) {
        conditions.push(sql`${phoneRecordsTable.transcription} IS NOT NULL`);
      } else {
        conditions.push(isNull(phoneRecordsTable.transcription));
      }
    }

    // Determine sort column and order
    // Map schema sortBy values to actual database columns
    const sortColumn =
      sortBy === "duration"
        ? phoneRecordsTable.duration
        : // startTime, endTime, cost map to createdAt as fallback (schema uses these but DB doesn't have them)
          phoneRecordsTable.createdAt;

    const orderClause = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Execute query with filters
    const dbItems = await db
      .select()
      .from(phoneRecordsTable)
      .where(and(...conditions))
      .orderBy(orderClause)
      .limit(pageSize)
      .offset(offset);

    // Get total count for pagination
    const [totalResult] = await db
      .select({ totalCount: count() })
      .from(phoneRecordsTable)
      .where(and(...conditions));

    const total = Number(totalResult?.totalCount || 0);

    // Map database records to API format
    const items = dbItems.map(mapDbRecordToApiRecord);

    const response: ApiResponse<PaginatedResponse<PhoneRecord>> = {
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
        totalPages: Math.ceil(total / pageSize),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: process.env.API_VERSION || "0.0.1",
        requestId,
        duration: Date.now() - startTime,
      },
      correlationId: requestId,
    };

    return c.json(response);
  } catch (error) {
    console.error(`[${requestId}] Error listing phone records:`, error);

    return c.json(
      {
        success: false,
        error: {
          code: "PHONE_RECORDS_LIST_ERROR",
          message: "Failed to retrieve phone records",
          timestamp: new Date().toISOString(),
        },
        correlationId: requestId,
      },
      500
    );
  }
});

/**
 * GET /phone-records/search
 * Vector similarity search on transcriptions
 */
phoneRecords.get(
  "/search",
  requireAuth,
  searchRateLimiter,
  validateQuery(searchPhoneRecordsQuerySchema),
  async (c) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      // Get validated query parameters
      const validatedQuery = c.get("validatedQuery") as SearchPhoneRecordsQuery;
      const { q: query, limit, threshold, startDate, endDate } = validatedQuery;

      // Execute vector similarity search
      let searchResults;
      if (startDate && endDate) {
        // Use date range filter if provided
        searchResults = await searchPhoneRecordsWithDateRange(
          query,
          new Date(startDate),
          new Date(endDate),
          {
            limit,
            minSimilarity: threshold,
          }
        );
      } else {
        // Basic search without date filter
        searchResults = await vectorSearchPhoneRecords(query, {
          limit,
          minSimilarity: threshold,
        });
      }

      // Transform results to API response format
      const results: Array<PhoneRecordWithTranscript & { similarity: number }> = searchResults.map(
        ({ item, similarity }) => ({
          ...mapDbRecordToApiRecord(item),
          similarity,
        })
      );

      const response: ApiResponse<Array<PhoneRecordWithTranscript & { similarity: number }>> = {
        success: true,
        data: results,
        metadata: {
          timestamp: new Date().toISOString(),
          version: process.env.API_VERSION || "0.0.1",
          requestId,
          duration: Date.now() - startTime,
          searchParams: {
            query,
            limit,
            threshold,
            startDate: startDate || null,
            endDate: endDate || null,
            resultsCount: results.length,
          },
        },
        correlationId: requestId,
      };

      return c.json(response);
    } catch (error) {
      console.error(`[${requestId}] Error searching phone records:`, error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const isProviderError = errorMessage.includes("No embedding provider configured");

      return c.json(
        {
          success: false,
          error: {
            code: isProviderError ? "EMBEDDING_PROVIDER_ERROR" : "PHONE_RECORDS_SEARCH_ERROR",
            message: isProviderError
              ? "Vector search unavailable: No embedding provider configured"
              : "Failed to search phone records",
            details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
            timestamp: new Date().toISOString(),
          },
          correlationId: requestId,
        },
        isProviderError ? 503 : 500
      );
    }
  }
);

/**
 * GET /phone-records/stats
 * Get call statistics summary
 */
phoneRecords.get("/stats", requireAuth, apiRateLimiter, validateQuery(phoneRecordStatsQuerySchema), async (c) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    // Get validated query parameters
    const query = c.get("validatedQuery") as PhoneRecordStatsQuery;

    // Build filter conditions
    const conditions = [isNull(phoneRecordsTable.deletedAt)];

    if (query.contactId) {
      conditions.push(eq(phoneRecordsTable.contactId, query.contactId));
    }
    if (query.startDate) {
      conditions.push(gte(phoneRecordsTable.createdAt, new Date(query.startDate)));
    }
    if (query.endDate) {
      conditions.push(lte(phoneRecordsTable.createdAt, new Date(query.endDate)));
    }

    // Get aggregate statistics
    const [aggregatesResult] = await db
      .select({
        totalCalls: count(),
        totalDuration: sql<number>`COALESCE(SUM(${phoneRecordsTable.duration}), 0)`,
        avgDuration: sql<number>`COALESCE(AVG(${phoneRecordsTable.duration}), 0)`,
      })
      .from(phoneRecordsTable)
      .where(and(...conditions));

    // Default values if no results
    const aggregates = aggregatesResult || {
      totalCalls: 0,
      totalDuration: 0,
      avgDuration: 0,
    };

    // Get calls by direction
    const directionStats = await db
      .select({
        direction: phoneRecordsTable.direction,
        count: count(),
      })
      .from(phoneRecordsTable)
      .where(and(...conditions))
      .groupBy(phoneRecordsTable.direction);

    // Get calls by status
    const statusStats = await db
      .select({
        status: phoneRecordsTable.status,
        count: count(),
      })
      .from(phoneRecordsTable)
      .where(and(...conditions))
      .groupBy(phoneRecordsTable.status);

    // Transform direction stats into flat structure
    const inboundCalls = directionStats.find(s => s.direction === 'inbound')?.count || 0;
    const outboundCalls = directionStats.find(s => s.direction === 'outbound')?.count || 0;

    // Transform status stats into object
    const callsByStatus = statusStats.reduce((acc, stat) => {
      if (stat.status) {
        acc[stat.status] = Number(stat.count);
      }
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      totalCalls: Number(aggregates.totalCalls),
      inboundCalls: Number(inboundCalls),
      outboundCalls: Number(outboundCalls),
      totalDuration: Number(aggregates.totalDuration),
      avgDuration: Math.round(Number(aggregates.avgDuration)),
      callsByDirection: {
        inbound: Number(inboundCalls),
        outbound: Number(outboundCalls),
      },
      callsByStatus,
      period: {
        startDate: query.startDate || null,
        endDate: query.endDate || null,
        groupBy: query.groupBy || null,
      },
      filters: {
        contactId: query.contactId || null,
      },
    };

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
      metadata: {
        timestamp: new Date().toISOString(),
        version: process.env.API_VERSION || "0.0.1",
        requestId,
        duration: Date.now() - startTime,
      },
      correlationId: requestId,
    };

    return c.json(response);
  } catch (error) {
    console.error(`[${requestId}] Error fetching phone record stats:`, error);

    return c.json(
      {
        success: false,
        error: {
          code: "PHONE_RECORDS_STATS_ERROR",
          message: "Failed to retrieve phone record statistics",
          timestamp: new Date().toISOString(),
        },
        correlationId: requestId,
      },
      500
    );
  }
});

/**
 * GET /phone-records/:id
 * Get a single phone record with transcription
 */
phoneRecords.get("/:id", requireAuth, apiRateLimiter, validateParams(phoneRecordIdParamSchema), async (c) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const params = c.get("validatedParams") as { id: string };
    const id = params.id;

    // Query phone record by ID (exclude soft-deleted)
    const [dbRecord] = await db
      .select()
      .from(phoneRecordsTable)
      .where(
        and(
          eq(phoneRecordsTable.id, id),
          isNull(phoneRecordsTable.deletedAt)
        )
      )
      .limit(1);

    if (!dbRecord) {
      return c.json(
        {
          success: false,
          error: {
            code: "PHONE_RECORD_NOT_FOUND",
            message: `Phone record with ID '${id}' not found`,
            timestamp: new Date().toISOString(),
          },
          correlationId: requestId,
        },
        404
      );
    }

    // Map to API format
    const record = mapDbRecordToApiRecord(dbRecord);

    const response: ApiResponse<PhoneRecordWithTranscript> = {
      success: true,
      data: record,
      metadata: {
        timestamp: new Date().toISOString(),
        version: process.env.API_VERSION || "0.0.1",
        requestId,
        duration: Date.now() - startTime,
      },
      correlationId: requestId,
    };

    return c.json(response);
  } catch (error) {
    console.error(`[${requestId}] Error fetching phone record:`, error);

    return c.json(
      {
        success: false,
        error: {
          code: "PHONE_RECORD_FETCH_ERROR",
          message: "Failed to retrieve phone record",
          timestamp: new Date().toISOString(),
        },
        correlationId: requestId,
      },
      500
    );
  }
});

/**
 * POST /phone-records
 * Create a new phone record (internal use - called by voice pipeline)
 *
 * Note: This endpoint uses webhookRateLimiter (no auth) for Telnyx/Twilio callbacks.
 * For authenticated user requests, userId comes from c.get("userId").
 * For webhook callbacks (no auth header), userId must be provided in the request body.
 */
phoneRecords.post("/", webhookRateLimiter, validateBody(createPhoneRecordSchema), async (c) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    // Get validated body from middleware
    const body = c.get("validatedBody") as CreatePhoneRecordInput;

    // Determine userId: prefer auth context, fallback to body.userId for webhooks
    // Webhooks from Telnyx/Twilio don't have auth headers, so they must provide userId in body
    const authUserId = c.get("userId") as string | undefined;
    const userId = authUserId || body.userId;

    if (!userId) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "userId is required - provide via authentication or request body",
            timestamp: new Date().toISOString(),
          },
          correlationId: requestId,
        },
        401
      );
    }

    // Build insert object with only fields that exist in database schema
    // Type the object properly to match Drizzle's expected types
    const insertData: Partial<DbPhoneRecord> & {
      userId: string;
      phoneNumber: string;
      direction: CallDirection;
      status: DbCallStatus;
    } = {
      userId,
      phoneNumber: body.phoneNumber,
      direction: body.direction as CallDirection,
      status: body.status as DbCallStatus,
      duration: body.duration || 0,
    };

    // Add optional fields if present
    if (body.contactId) insertData.contactId = body.contactId;
    if (body.recordingUrl) insertData.recordingUrl = body.recordingUrl;

    // Map schema fields to database fields if they exist in metadata
    // Store API schema fields (startTime, endTime, provider, etc.) in metadata for compatibility
    const metadataFields: Record<string, unknown> = body.metadata || {};
    if (body.startTime) metadataFields.startTime = body.startTime;
    if (body.endTime) metadataFields.endTime = body.endTime;
    if (body.provider) metadataFields.provider = body.provider;
    if (body.transcriptId) metadataFields.transcriptId = body.transcriptId;
    if (body.cost !== undefined) metadataFields.cost = body.cost;

    if (Object.keys(metadataFields).length > 0) {
      insertData.metadata = metadataFields;
    }

    // Insert into database
    const [dbNewRecord] = await db
      .insert(phoneRecordsTable)
      .values(insertData)
      .returning();

    if (!dbNewRecord) {
      throw new Error("Failed to create phone record");
    }

    // Map to API format
    const newRecord = mapDbRecordToApiRecord(dbNewRecord);

    const response: ApiResponse<PhoneRecord> = {
      success: true,
      data: newRecord,
      metadata: {
        timestamp: new Date().toISOString(),
        version: process.env.API_VERSION || "0.0.1",
        requestId,
        duration: Date.now() - startTime,
      },
      correlationId: requestId,
    };

    return c.json(response, 201);
  } catch (error) {
    console.error(`[${requestId}] Error creating phone record:`, error);

    return c.json(
      {
        success: false,
        error: {
          code: "PHONE_RECORD_CREATE_ERROR",
          message: "Failed to create phone record",
          timestamp: new Date().toISOString(),
        },
        correlationId: requestId,
      },
      500
    );
  }
});

export default phoneRecords;
