/**
 * Contact Management Routes
 * CRUD operations for contacts with pagination and vector search
 *
 * Updated: 08 December 2025 15 45 30
 */

import { Hono } from "hono";
import type {
  ApiResponse,
  PaginatedResponse,
  Contact,
} from "@repo/types";
import { searchContacts as vectorSearchContacts, findSimilarContacts } from "../services";
import {
  validateBody,
  validateQuery,
  validateParams,
  apiRateLimiter,
  searchRateLimiter,
  requireAuth,
} from "../middleware";
import {
  createContactSchema,
  updateContactSchema,
  listContactsQuerySchema,
  searchContactsQuerySchema,
  contactIdParamSchema,
  type CreateContactInput,
  type ListContactsQuery,
  type SearchContactsQuery,
} from "../schemas";
import { db } from "@repo/db";
import { contacts as contactsTable } from "@repo/db/schema";
import { eq, and, or, ilike, desc, asc, isNull, sql } from "drizzle-orm";

const contacts = new Hono();

// Apply rate limiting and authentication to all contact routes
contacts.use("*", apiRateLimiter);
contacts.use("*", requireAuth);

/**
 * Helper function to map database contact to API Contact type
 */
function mapDbContactToApi(dbContact: typeof contactsTable.$inferSelect): Contact {
  return {
    id: dbContact.id,
    firstName: dbContact.firstName ?? null,
    lastName: dbContact.lastName ?? null,
    email: dbContact.email ?? null,
    phone: dbContact.phone ?? null,
    company: dbContact.company ?? null,
    jobTitle: dbContact.jobTitle ?? null,
    notes: dbContact.notes ?? null,
    tags: (dbContact.tags as string[]) ?? [],
    avatarUrl: dbContact.avatarUrl ?? null,
    relationshipScore: (dbContact.relationshipScore as Contact['relationshipScore']) ?? 'neutral',
    lastContactedAt: dbContact.lastContactedAt ?? null,
    embedding: dbContact.embedding ?? null,
    createdAt: dbContact.createdAt,
    updatedAt: dbContact.updatedAt,
    deletedAt: dbContact.deletedAt ?? null,
    // Optional computed fields
    avatar: dbContact.avatarUrl ?? undefined,
  };
}

/**
 * GET /contacts
 * List all contacts with pagination and search
 */
contacts.get("/", validateQuery(listContactsQuerySchema), async (c) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    // Get validated query parameters
    const query = c.get("validatedQuery") as ListContactsQuery;
    const { page, pageSize, sortBy, sortOrder } = query;

    // Query parameters for filtering
    const searchTerm = query.q || query.search || "";
    const offset = (page - 1) * pageSize;

    // Build WHERE conditions
    const whereConditions = [
      isNull(contactsTable.deletedAt), // Filter out soft-deleted records
    ];

    // Add search condition if provided
    if (searchTerm) {
      whereConditions.push(
        or(
          ilike(contactsTable.firstName, `%${searchTerm}%`),
          ilike(contactsTable.lastName, `%${searchTerm}%`),
          ilike(contactsTable.email, `%${searchTerm}%`),
          ilike(contactsTable.company, `%${searchTerm}%`)
        )!
      );
    }

    // Add company filter if provided
    if (query.company) {
      whereConditions.push(eq(contactsTable.company, query.company));
    }

    // Combine all WHERE conditions
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Build ORDER BY clause
    type ValidSortColumn = keyof typeof contactsTable.$inferSelect;
    const validColumn = sortBy as ValidSortColumn;
    const orderByColumn = contactsTable[validColumn] ?? contactsTable.createdAt;
    const orderByClause = sortOrder === "asc" ? asc(orderByColumn) : desc(orderByColumn);

    // Execute query with pagination
    const dbContacts = await db
      .select()
      .from(contactsTable)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(offset);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contactsTable)
      .where(whereClause);

    const total = countResult[0]?.count ?? 0;
    const items: Contact[] = dbContacts.map(mapDbContactToApi);

    const response: ApiResponse<PaginatedResponse<Contact>> = {
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
    console.error(`[${requestId}] Error listing contacts:`, error);

    return c.json(
      {
        success: false,
        error: {
          code: "CONTACTS_LIST_ERROR",
          message: "Failed to retrieve contacts",
          timestamp: new Date().toISOString(),
        },
        correlationId: requestId,
      },
      500
    );
  }
});

/**
 * GET /contacts/search
 * Vector similarity search on contacts
 */
contacts.get("/search", searchRateLimiter, validateQuery(searchContactsQuerySchema), async (c) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    // Get validated query parameters
    const validatedQuery = c.get("validatedQuery") as SearchContactsQuery;

    // Search parameters for vector similarity
    const searchParams = {
      limit: validatedQuery.limit,
      minSimilarity: validatedQuery.threshold,
      offset: 0,
    };

    const query = validatedQuery.q;

    // Execute vector similarity search using pgvector
    const searchResults = await vectorSearchContacts(query, searchParams);

    // Transform results to API response format
    const results: Array<Contact & { similarity: number }> = searchResults.map(
      ({ item, similarity }) => ({
        id: item.id,
        firstName: item.firstName ?? null,
        lastName: item.lastName ?? null,
        email: item.email ?? null,
        phone: item.phone ?? null,
        company: item.company ?? null,
        jobTitle: item.jobTitle ?? null,
        notes: item.notes ?? null,
        tags: (item.tags as string[]) ?? [],
        avatarUrl: item.avatarUrl ?? null,
        relationshipScore: (item.relationshipScore as Contact['relationshipScore']) ?? 'neutral',
        lastContactedAt: item.lastContactedAt ?? null,
        embedding: item.embedding ?? null,
        createdAt: item.createdAt ?? new Date(),
        updatedAt: item.updatedAt ?? new Date(),
        deletedAt: item.deletedAt ?? null,
        avatar: item.avatarUrl ?? undefined,
        similarity,
      })
    );

    const response: ApiResponse<Array<Contact & { similarity: number }>> = {
      success: true,
      data: results,
      metadata: {
        timestamp: new Date().toISOString(),
        version: process.env.API_VERSION || "0.0.1",
        requestId,
        duration: Date.now() - startTime,
        searchParams: {
          query,
          limit: searchParams.limit,
          minSimilarity: searchParams.minSimilarity,
          resultsCount: results.length,
        },
      },
      correlationId: requestId,
    };

    return c.json(response);
  } catch (error) {
    console.error(`[${requestId}] Error searching contacts:`, error);

    // Check if it's an embedding provider error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isProviderError = errorMessage.includes("No embedding provider configured");

    return c.json(
      {
        success: false,
        error: {
          code: isProviderError ? "EMBEDDING_PROVIDER_ERROR" : "CONTACTS_SEARCH_ERROR",
          message: isProviderError
            ? "Vector search unavailable: No embedding provider configured"
            : "Failed to search contacts",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
          timestamp: new Date().toISOString(),
        },
        correlationId: requestId,
      },
      isProviderError ? 503 : 500
    );
  }
});

/**
 * GET /contacts/:id/similar
 * Find contacts similar to a given contact
 */
contacts.get("/:id/similar", validateParams(contactIdParamSchema), async (c) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const params = c.get("validatedParams") as { id: string };
    const contactId = params.id;
    const limit = Math.min(20, Math.max(1, Number(c.req.query("limit")) || 5));
    const minSimilarity = Number(c.req.query("threshold")) || 0.7;

    const searchResults = await findSimilarContacts(contactId, { limit, minSimilarity });

    const results: Array<Contact & { similarity: number }> = searchResults.map(
      ({ item, similarity }) => ({
        id: item.id,
        firstName: item.firstName ?? null,
        lastName: item.lastName ?? null,
        email: item.email ?? null,
        phone: item.phone ?? null,
        company: item.company ?? null,
        jobTitle: item.jobTitle ?? null,
        notes: item.notes ?? null,
        tags: (item.tags as string[]) ?? [],
        avatarUrl: item.avatarUrl ?? null,
        relationshipScore: (item.relationshipScore as Contact['relationshipScore']) ?? 'neutral',
        lastContactedAt: item.lastContactedAt ?? null,
        embedding: item.embedding ?? null,
        createdAt: item.createdAt ?? new Date(),
        updatedAt: item.updatedAt ?? new Date(),
        deletedAt: item.deletedAt ?? null,
        avatar: item.avatarUrl ?? undefined,
        similarity,
      })
    );

    const response: ApiResponse<Array<Contact & { similarity: number }>> = {
      success: true,
      data: results,
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
    console.error(`[${requestId}] Error finding similar contacts:`, error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isNotFound = errorMessage.includes("not found");

    return c.json(
      {
        success: false,
        error: {
          code: isNotFound ? "CONTACT_NOT_FOUND" : "SIMILAR_CONTACTS_ERROR",
          message: isNotFound ? errorMessage : "Failed to find similar contacts",
          timestamp: new Date().toISOString(),
        },
        correlationId: requestId,
      },
      isNotFound ? 404 : 500
    );
  }
});

/**
 * GET /contacts/:id
 * Get a single contact by ID
 */
contacts.get("/:id", validateParams(contactIdParamSchema), async (c) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const params = c.get("validatedParams") as { id: string };
    const id = params.id;

    // Query contact from database
    const [dbContact] = await db
      .select()
      .from(contactsTable)
      .where(and(eq(contactsTable.id, id), isNull(contactsTable.deletedAt)))
      .limit(1);

    const contact: Contact | null = dbContact ? mapDbContactToApi(dbContact) : null;

    if (!contact) {
      return c.json(
        {
          success: false,
          error: {
            code: "CONTACT_NOT_FOUND",
            message: `Contact with ID '${id}' not found`,
            timestamp: new Date().toISOString(),
          },
          correlationId: requestId,
        },
        404
      );
    }

    const response: ApiResponse<Contact> = {
      success: true,
      data: contact,
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
    console.error(`[${requestId}] Error fetching contact:`, error);

    return c.json(
      {
        success: false,
        error: {
          code: "CONTACT_FETCH_ERROR",
          message: "Failed to retrieve contact",
          timestamp: new Date().toISOString(),
        },
        correlationId: requestId,
      },
      500
    );
  }
});

/**
 * POST /contacts
 * Create a new contact
 */
contacts.post("/", validateBody(createContactSchema), async (c) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    // Get validated body from middleware
    const body = c.get("validatedBody") as CreateContactInput;

    // Insert new contact into database
    const [dbContact] = await db
      .insert(contactsTable)
      .values({
        firstName: body.firstName ?? null,
        lastName: body.lastName ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        company: body.company ?? null,
        jobTitle: body.jobTitle ?? null,
        avatarUrl: body.avatar ?? null,
        tags: body.tags ?? [],
        notes: null,
        relationshipScore: "neutral",
        lastContactedAt: null,
        embedding: null,
      })
      .returning();

    if (!dbContact) {
      return c.json(
        {
          success: false,
          error: {
            code: "CONTACT_CREATE_ERROR",
            message: "Failed to create contact in database",
            timestamp: new Date().toISOString(),
          },
          correlationId: requestId,
        },
        500
      );
    }

    const newContact: Contact = mapDbContactToApi(dbContact);

    const response: ApiResponse<Contact> = {
      success: true,
      data: newContact,
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
    console.error(`[${requestId}] Error creating contact:`, error);

    return c.json(
      {
        success: false,
        error: {
          code: "CONTACT_CREATE_ERROR",
          message: "Failed to create contact",
          timestamp: new Date().toISOString(),
        },
        correlationId: requestId,
      },
      500
    );
  }
});

/**
 * PUT /contacts/:id
 * Update an existing contact
 */
contacts.put(
  "/:id",
  validateParams(contactIdParamSchema),
  validateBody(updateContactSchema),
  async (c) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      const params = c.get("validatedParams") as { id: string };
      const id = params.id;
      const body = c.get("validatedBody") as Partial<CreateContactInput>;

      // Check if contact exists and is not deleted
      const [existing] = await db
        .select()
        .from(contactsTable)
        .where(and(eq(contactsTable.id, id), isNull(contactsTable.deletedAt)))
        .limit(1);

      if (!existing) {
        return c.json(
          {
            success: false,
            error: {
              code: "CONTACT_NOT_FOUND",
              message: `Contact with ID '${id}' not found`,
              timestamp: new Date().toISOString(),
            },
            correlationId: requestId,
          },
          404
        );
      }

      // Build update object with only provided fields
      const updateData: Partial<typeof contactsTable.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (body.firstName !== undefined) updateData.firstName = body.firstName;
      if (body.lastName !== undefined) updateData.lastName = body.lastName;
      if (body.email !== undefined) updateData.email = body.email || null;
      if (body.phone !== undefined) updateData.phone = body.phone || null;
      if (body.company !== undefined) updateData.company = body.company || null;
      if (body.jobTitle !== undefined) updateData.jobTitle = body.jobTitle || null;
      if (body.avatar !== undefined) updateData.avatarUrl = body.avatar || null;
      if (body.tags !== undefined) updateData.tags = body.tags;

      // Execute update
      const [dbContact] = await db
        .update(contactsTable)
        .set(updateData)
        .where(eq(contactsTable.id, id))
        .returning();

      if (!dbContact) {
        return c.json(
          {
            success: false,
            error: {
              code: "CONTACT_UPDATE_ERROR",
              message: `Failed to update contact with ID '${id}'`,
              timestamp: new Date().toISOString(),
            },
            correlationId: requestId,
          },
          500
        );
      }

      const updatedContact: Contact = mapDbContactToApi(dbContact);

      const response: ApiResponse<Contact> = {
        success: true,
        data: updatedContact,
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
      console.error(`[${requestId}] Error updating contact:`, error);

      return c.json(
        {
          success: false,
          error: {
            code: "CONTACT_UPDATE_ERROR",
            message: "Failed to update contact",
            timestamp: new Date().toISOString(),
          },
          correlationId: requestId,
        },
        500
      );
    }
  }
);

/**
 * DELETE /contacts/:id
 * Delete a contact (soft delete)
 */
contacts.delete("/:id", validateParams(contactIdParamSchema), async (c) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const params = c.get("validatedParams") as { id: string };
    const id = params.id;

    // Check if contact exists and is not already deleted
    const [existing] = await db
      .select()
      .from(contactsTable)
      .where(and(eq(contactsTable.id, id), isNull(contactsTable.deletedAt)))
      .limit(1);

    if (!existing) {
      return c.json(
        {
          success: false,
          error: {
            code: "CONTACT_NOT_FOUND",
            message: `Contact with ID '${id}' not found`,
            timestamp: new Date().toISOString(),
          },
          correlationId: requestId,
        },
        404
      );
    }

    // Perform soft delete by setting deletedAt timestamp
    await db
      .update(contactsTable)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contactsTable.id, id));

    const response: ApiResponse<{ id: string; deleted: boolean }> = {
      success: true,
      data: { id, deleted: true },
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
    console.error(`[${requestId}] Error deleting contact:`, error);

    return c.json(
      {
        success: false,
        error: {
          code: "CONTACT_DELETE_ERROR",
          message: "Failed to delete contact",
          timestamp: new Date().toISOString(),
        },
        correlationId: requestId,
      },
      500
    );
  }
});

export default contacts;
