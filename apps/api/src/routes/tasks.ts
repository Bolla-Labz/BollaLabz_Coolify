// 08 December 2025 04 15 00

/**
 * Task Management Routes
 * CRUD operations for tasks with filtering and status management
 *
 * Fixed type mismatches:
 * - Status enum mapping (API: pending/completed -> DB: todo/done)
 * - Priority enum mapping (API: urgent -> DB: high)
 * - Date to ISO string conversions
 * - Added null checks for query results
 * - Added contactId to schemas and queries
 */

import { Hono } from "hono";
import type {
  ApiResponse,
  PaginatedResponse,
  Task,
  TaskStatus,
} from "@repo/types";
import {
  validateBody,
  validateQuery,
  validateParams,
  apiRateLimiter,
  requireAuth,
} from "../middleware";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  listTasksQuerySchema,
  taskIdParamSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
  type UpdateTaskStatusInput,
  type ListTasksQuery,
} from "../schemas";
import { db } from "@repo/db";
import { tasks as tasksTable } from "@repo/db/schema";
import { eq, and, or, gte, lte, desc, asc, isNull, sql, like, inArray } from "drizzle-orm";

const tasks = new Hono();

// Apply rate limiting and authentication to all task routes
tasks.use("*", apiRateLimiter);
tasks.use("*", requireAuth);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map API status enum to database status enum
 * Database only supports: todo, in_progress, done
 * API supports: pending, in_progress, completed, cancelled, on_hold, blocked
 */
const mapStatusToDb = (status?: string): "todo" | "in_progress" | "done" | undefined => {
  if (!status) return undefined;
  if (status === "pending") return "todo";
  if (status === "completed") return "done";
  if (status === "in_progress") return "in_progress";
  // For cancelled, on_hold, blocked - map to todo for now
  return "todo";
};

/**
 * Map API priority enum to database priority enum
 * Database only supports: low, medium, high
 * API supports: low, medium, high, urgent
 */
const mapPriorityToDb = (priority?: string): "low" | "medium" | "high" | undefined => {
  if (!priority) return undefined;
  if (priority === "urgent") return "high"; // Map urgent to high
  if (priority === "low" || priority === "medium" || priority === "high") {
    return priority as "low" | "medium" | "high";
  }
  return undefined;
};

/**
 * Map database task to API Task type with proper date formatting
 */
const mapTaskToApi = (dbTask: typeof tasksTable.$inferSelect): Task => {
  return {
    id: dbTask.id,
    userId: dbTask.userId,
    title: dbTask.title,
    description: dbTask.description,
    status: dbTask.status as TaskStatus,
    priority: dbTask.priority as "low" | "medium" | "high",
    dueDate: dbTask.dueDate ? dbTask.dueDate.toISOString() : null,
    completedAt: dbTask.completedAt ? dbTask.completedAt.toISOString() : null,
    contactId: dbTask.contactId,
    tags: dbTask.tags || [],
    createdAt: dbTask.createdAt.toISOString(),
    updatedAt: dbTask.updatedAt.toISOString(),
    deletedAt: dbTask.deletedAt ? dbTask.deletedAt.toISOString() : null,
  };
};

/**
 * GET /tasks
 * List all tasks with filtering and pagination
 */
tasks.get("/", validateQuery(listTasksQuerySchema), async (c) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    // Get validated query parameters
    const query = c.get("validatedQuery") as ListTasksQuery;
    const { page, pageSize, sortBy, sortOrder } = query;

    // Build WHERE conditions
    const whereConditions = [isNull(tasksTable.deletedAt)];

    // Filter by status (map API status to DB status)
    if (query.status) {
      const dbStatus = mapStatusToDb(query.status);
      if (dbStatus) {
        whereConditions.push(eq(tasksTable.status, dbStatus));
      }
    }

    // Filter by priority (map API priority to DB priority)
    if (query.priority) {
      const dbPriority = mapPriorityToDb(query.priority);
      if (dbPriority) {
        whereConditions.push(eq(tasksTable.priority, dbPriority));
      }
    }

    // Filter by contactId
    if (query.contactId) {
      whereConditions.push(eq(tasksTable.contactId, query.contactId));
    }

    // Filter by dueDate (exact date match)
    if (query.dueDate) {
      const targetDate = new Date(query.dueDate);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      whereConditions.push(
        and(
          gte(tasksTable.dueDate, startOfDay),
          lte(tasksTable.dueDate, endOfDay)
        )!
      );
    }

    // Filter by dueDate range
    if (query.dueBefore) {
      whereConditions.push(lte(tasksTable.dueDate, new Date(query.dueBefore)));
    }
    if (query.dueAfter) {
      whereConditions.push(gte(tasksTable.dueDate, new Date(query.dueAfter)));
    }

    // Filter by tag
    if (query.tag) {
      whereConditions.push(sql`${tasksTable.tags} && ARRAY[${query.tag}]::text[]`);
    }

    // Search in title and description
    if (query.search) {
      const searchPattern = `%${query.search}%`;
      whereConditions.push(
        or(
          like(tasksTable.title, searchPattern),
          like(tasksTable.description, searchPattern)
        )!
      );
    }

    // Combine all conditions
    const whereClause = and(...whereConditions);

    // Build ORDER BY
    const orderByColumn = sortBy === "createdAt" ? tasksTable.createdAt :
                          sortBy === "updatedAt" ? tasksTable.updatedAt :
                          sortBy === "dueDate" ? tasksTable.dueDate :
                          sortBy === "priority" ? tasksTable.priority :
                          sortBy === "status" ? tasksTable.status :
                          tasksTable.createdAt;

    const orderByClause = sortOrder === "asc" ? asc(orderByColumn) : desc(orderByColumn);

    // Execute query with pagination
    const offset = (page - 1) * pageSize;

    const [items, countResult] = await Promise.all([
      db.select()
        .from(tasksTable)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(pageSize)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` })
        .from(tasksTable)
        .where(whereClause)
    ]);

    const total = countResult[0]?.count || 0;

    const response: ApiResponse<PaginatedResponse<Task>> = {
      success: true,
      data: {
        items: items.map(mapTaskToApi),
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
    console.error(`[${requestId}] Error listing tasks:`, error);

    return c.json(
      {
        success: false,
        error: {
          code: "TASKS_LIST_ERROR",
          message: "Failed to retrieve tasks",
          timestamp: new Date().toISOString(),
        },
        correlationId: requestId,
      },
      500
    );
  }
});

/**
 * GET /tasks/:id
 * Get a single task by ID
 */
tasks.get("/:id", validateParams(taskIdParamSchema), async (c) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const params = c.get("validatedParams") as { id: string };
    const id = params.id;

    // Query task by ID, exclude soft-deleted
    const [task] = await db.select()
      .from(tasksTable)
      .where(and(eq(tasksTable.id, id), isNull(tasksTable.deletedAt)))
      .limit(1);

    if (!task) {
      return c.json(
        {
          success: false,
          error: {
            code: "TASK_NOT_FOUND",
            message: `Task with ID '${id}' not found`,
            timestamp: new Date().toISOString(),
          },
          correlationId: requestId,
        },
        404
      );
    }

    const response: ApiResponse<Task> = {
      success: true,
      data: mapTaskToApi(task),
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
    console.error(`[${requestId}] Error fetching task:`, error);

    return c.json(
      {
        success: false,
        error: {
          code: "TASK_FETCH_ERROR",
          message: "Failed to retrieve task",
          timestamp: new Date().toISOString(),
        },
        correlationId: requestId,
      },
      500
    );
  }
});

/**
 * POST /tasks
 * Create a new task
 */
tasks.post("/", validateBody(createTaskSchema), async (c) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    // Get validated body from middleware
    const body = c.get("validatedBody") as CreateTaskInput;

    // Get authenticated userId from auth middleware
    const userId = c.get("userId");

    // Build insert data
    const insertData = {
      userId,
      title: body.title,
      description: body.description || null,
      status: mapStatusToDb(body.status) || "todo",
      priority: mapPriorityToDb(body.priority) || "medium",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      contactId: body.contactId || null,
      tags: body.tags || [],
    };

    // Insert task and return the created record
    const [newTask] = await db.insert(tasksTable)
      .values(insertData)
      .returning();

    if (!newTask) {
      return c.json(
        {
          success: false,
          error: {
            code: "TASK_CREATE_ERROR",
            message: "Failed to create task - no record returned",
            timestamp: new Date().toISOString(),
          },
          correlationId: requestId,
        },
        500
      );
    }

    const response: ApiResponse<Task> = {
      success: true,
      data: mapTaskToApi(newTask),
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
    console.error(`[${requestId}] Error creating task:`, error);

    return c.json(
      {
        success: false,
        error: {
          code: "TASK_CREATE_ERROR",
          message: "Failed to create task",
          timestamp: new Date().toISOString(),
        },
        correlationId: requestId,
      },
      500
    );
  }
});

/**
 * PUT /tasks/:id
 * Update an existing task
 */
tasks.put(
  "/:id",
  validateParams(taskIdParamSchema),
  validateBody(updateTaskSchema),
  async (c) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      const params = c.get("validatedParams") as { id: string };
      const id = params.id;
      const body = c.get("validatedBody") as UpdateTaskInput;

      // Check if task exists and is not deleted
      const [existing] = await db.select()
        .from(tasksTable)
        .where(and(eq(tasksTable.id, id), isNull(tasksTable.deletedAt)))
        .limit(1);

      if (!existing) {
        return c.json(
          {
            success: false,
            error: {
              code: "TASK_NOT_FOUND",
              message: `Task with ID '${id}' not found`,
              timestamp: new Date().toISOString(),
            },
            correlationId: requestId,
          },
          404
        );
      }

      // Build update data - only include provided fields
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (body.title !== undefined) updateData.title = body.title;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.status !== undefined) {
        const dbStatus = mapStatusToDb(body.status);
        if (dbStatus) {
          updateData.status = dbStatus;
          // Auto-set completedAt when status changes to "done"
          if (dbStatus === "done" && !existing.completedAt) {
            updateData.completedAt = new Date();
          }
        }
      }
      if (body.priority !== undefined) {
        const dbPriority = mapPriorityToDb(body.priority);
        if (dbPriority) {
          updateData.priority = dbPriority;
        }
      }
      if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
      if (body.contactId !== undefined) updateData.contactId = body.contactId || null;
      if (body.tags !== undefined) updateData.tags = body.tags;

      // Update task in database
      const [updatedTask] = await db.update(tasksTable)
        .set(updateData)
        .where(eq(tasksTable.id, id))
        .returning();

      if (!updatedTask) {
        return c.json(
          {
            success: false,
            error: {
              code: "TASK_UPDATE_ERROR",
              message: "Failed to update task - no record returned",
              timestamp: new Date().toISOString(),
            },
            correlationId: requestId,
          },
          500
        );
      }

      const response: ApiResponse<Task> = {
        success: true,
        data: mapTaskToApi(updatedTask),
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
      console.error(`[${requestId}] Error updating task:`, error);

      return c.json(
        {
          success: false,
          error: {
            code: "TASK_UPDATE_ERROR",
            message: "Failed to update task",
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
 * PATCH /tasks/:id/status
 * Update task status only (convenience endpoint)
 */
tasks.patch(
  "/:id/status",
  validateParams(taskIdParamSchema),
  validateBody(updateTaskStatusSchema),
  async (c) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      const params = c.get("validatedParams") as { id: string };
      const id = params.id;
      const body = c.get("validatedBody") as UpdateTaskStatusInput;

      // Check if task exists and is not deleted
      const [existing] = await db.select()
        .from(tasksTable)
        .where(and(eq(tasksTable.id, id), isNull(tasksTable.deletedAt)))
        .limit(1);

      if (!existing) {
        return c.json(
          {
            success: false,
            error: {
              code: "TASK_NOT_FOUND",
              message: `Task with ID '${id}' not found`,
              timestamp: new Date().toISOString(),
            },
            correlationId: requestId,
          },
          404
        );
      }

      // Map status to database enum
      const dbStatus = mapStatusToDb(body.status);
      if (!dbStatus) {
        return c.json(
          {
            success: false,
            error: {
              code: "INVALID_STATUS",
              message: "Invalid status value",
              timestamp: new Date().toISOString(),
            },
            correlationId: requestId,
          },
          400
        );
      }

      // Build update data
      const updateData: Record<string, unknown> = {
        status: dbStatus,
        updatedAt: new Date(),
      };

      // Auto-set completedAt when status changes to "done"
      if (dbStatus === "done" && !existing.completedAt) {
        updateData.completedAt = new Date();
      }

      // Update status in database
      const [updatedTask] = await db.update(tasksTable)
        .set(updateData)
        .where(eq(tasksTable.id, id))
        .returning();

      if (!updatedTask) {
        return c.json(
          {
            success: false,
            error: {
              code: "TASK_STATUS_UPDATE_ERROR",
              message: "Failed to update task status - no record returned",
              timestamp: new Date().toISOString(),
            },
            correlationId: requestId,
          },
          500
        );
      }

      const response: ApiResponse<{ id: string; status: TaskStatus; updatedAt: string }> = {
        success: true,
        data: {
          id: updatedTask.id,
          status: updatedTask.status as TaskStatus,
          updatedAt: updatedTask.updatedAt.toISOString(),
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
      console.error(`[${requestId}] Error updating task status:`, error);

      return c.json(
        {
          success: false,
          error: {
            code: "TASK_STATUS_UPDATE_ERROR",
            message: "Failed to update task status",
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
 * DELETE /tasks/:id
 * Delete a task (soft delete)
 */
tasks.delete("/:id", validateParams(taskIdParamSchema), async (c) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const params = c.get("validatedParams") as { id: string };
    const id = params.id;

    // Check if task exists and is not already deleted
    const [existing] = await db.select()
      .from(tasksTable)
      .where(and(eq(tasksTable.id, id), isNull(tasksTable.deletedAt)))
      .limit(1);

    if (!existing) {
      return c.json(
        {
          success: false,
          error: {
            code: "TASK_NOT_FOUND",
            message: `Task with ID '${id}' not found`,
            timestamp: new Date().toISOString(),
          },
          correlationId: requestId,
        },
        404
      );
    }

    // Perform soft delete - set deletedAt timestamp
    await db.update(tasksTable)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tasksTable.id, id));

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
    console.error(`[${requestId}] Error deleting task:`, error);

    return c.json(
      {
        success: false,
        error: {
          code: "TASK_DELETE_ERROR",
          message: "Failed to delete task",
          timestamp: new Date().toISOString(),
        },
        correlationId: requestId,
      },
      500
    );
  }
});

export default tasks;
