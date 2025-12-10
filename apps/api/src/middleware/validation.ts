/**
 * Validation Middleware
 * Zod-based request validation for body, query, and params
 *
 * Features:
 * - Type-safe validation with Zod schemas
 * - Validated data stored in context for handlers
 * - Consistent error response format
 * - Support for body, query params, and URL params
 */

import type { MiddlewareHandler, Context } from "hono";
import { z } from "zod";

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

/**
 * Extends Hono's context variables to include validated data
 */
declare module "hono" {
  interface ContextVariableMap {
    validatedBody: unknown;
    validatedQuery: unknown;
    validatedParams: unknown;
  }
}

/**
 * Helper type to extract validated data from context
 */
export type ValidatedBody<T extends z.ZodSchema> = z.infer<T>;
export type ValidatedQuery<T extends z.ZodSchema> = z.infer<T>;
export type ValidatedParams<T extends z.ZodSchema> = z.infer<T>;

// ============================================================================
// ERROR FORMATTING
// ============================================================================

/**
 * Formats Zod validation errors into a consistent structure
 */
function formatValidationError(error: z.ZodError) {
  return {
    fieldErrors: error.flatten().fieldErrors,
    formErrors: error.flatten().formErrors,
    issues: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    })),
  };
}

/**
 * Creates a validation error response
 */
function createValidationResponse(
  c: Context,
  source: "body" | "query" | "params",
  error: z.ZodError
) {
  return c.json(
    {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: `Invalid request ${source}`,
        details: formatValidationError(error),
        timestamp: new Date().toISOString(),
      },
    },
    400
  );
}

// ============================================================================
// MIDDLEWARE FACTORIES
// ============================================================================

/**
 * Validates request body against a Zod schema
 * Stores validated data in c.get("validatedBody")
 *
 * @example
 * ```typescript
 * const schema = z.object({ name: z.string(), email: z.string().email() });
 * app.post('/users', validateBody(schema), (c) => {
 *   const body = c.get("validatedBody") as z.infer<typeof schema>;
 *   // body is typed as { name: string; email: string }
 * });
 * ```
 */
export function validateBody<T extends z.ZodSchema>(schema: T): MiddlewareHandler {
  return async (c, next) => {
    try {
      const body = await c.req.json();
      const result = schema.safeParse(body);

      if (!result.success) {
        return createValidationResponse(c, "body", result.error);
      }

      c.set("validatedBody", result.data);
      return next();
    } catch (error) {
      // Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        return c.json(
          {
            success: false,
            error: {
              code: "INVALID_JSON",
              message: "Request body must be valid JSON",
              timestamp: new Date().toISOString(),
            },
          },
          400
        );
      }
      throw error;
    }
  };
}

/**
 * Validates query parameters against a Zod schema
 * Stores validated data in c.get("validatedQuery")
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   page: z.coerce.number().min(1).default(1),
 *   limit: z.coerce.number().min(1).max(100).default(20)
 * });
 * app.get('/users', validateQuery(schema), (c) => {
 *   const query = c.get("validatedQuery") as z.infer<typeof schema>;
 *   // query is typed as { page: number; limit: number }
 * });
 * ```
 */
export function validateQuery<T extends z.ZodSchema>(schema: T): MiddlewareHandler {
  return async (c, next) => {
    const query = c.req.query();
    const result = schema.safeParse(query);

    if (!result.success) {
      return createValidationResponse(c, "query", result.error);
    }

    c.set("validatedQuery", result.data);
    return next();
  };
}

/**
 * Validates URL parameters against a Zod schema
 * Stores validated data in c.get("validatedParams")
 *
 * @example
 * ```typescript
 * const schema = z.object({ id: z.string().uuid() });
 * app.get('/users/:id', validateParams(schema), (c) => {
 *   const params = c.get("validatedParams") as z.infer<typeof schema>;
 *   // params is typed as { id: string }
 * });
 * ```
 */
export function validateParams<T extends z.ZodSchema>(schema: T): MiddlewareHandler {
  return async (c, next) => {
    const params = c.req.param();
    const result = schema.safeParse(params);

    if (!result.success) {
      return createValidationResponse(c, "params", result.error);
    }

    c.set("validatedParams", result.data);
    return next();
  };
}

/**
 * Combined validator for body and query
 * Validates both and stores results in context
 *
 * @example
 * ```typescript
 * app.post('/search',
 *   validateRequest({
 *     body: z.object({ query: z.string() }),
 *     query: z.object({ limit: z.coerce.number().default(10) })
 *   }),
 *   handler
 * );
 * ```
 */
export function validateRequest<
  TBody extends z.ZodSchema | undefined = undefined,
  TQuery extends z.ZodSchema | undefined = undefined,
  TParams extends z.ZodSchema | undefined = undefined
>(schemas: {
  body?: TBody;
  query?: TQuery;
  params?: TParams;
}): MiddlewareHandler {
  return async (c, next) => {
    // Validate params if schema provided
    if (schemas.params) {
      const params = c.req.param();
      const result = schemas.params.safeParse(params);
      if (!result.success) {
        return createValidationResponse(c, "params", result.error);
      }
      c.set("validatedParams", result.data);
    }

    // Validate query if schema provided
    if (schemas.query) {
      const query = c.req.query();
      const result = schemas.query.safeParse(query);
      if (!result.success) {
        return createValidationResponse(c, "query", result.error);
      }
      c.set("validatedQuery", result.data);
    }

    // Validate body if schema provided
    if (schemas.body) {
      try {
        const body = await c.req.json();
        const result = schemas.body.safeParse(body);
        if (!result.success) {
          return createValidationResponse(c, "body", result.error);
        }
        c.set("validatedBody", result.data);
      } catch (error) {
        if (error instanceof SyntaxError) {
          return c.json(
            {
              success: false,
              error: {
                code: "INVALID_JSON",
                message: "Request body must be valid JSON",
                timestamp: new Date().toISOString(),
              },
            },
            400
          );
        }
        throw error;
      }
    }

    return next();
  };
}

// ============================================================================
// COMMON SCHEMA HELPERS
// ============================================================================

/**
 * Common UUID parameter schema
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid ID format - must be a valid UUID"),
});

/**
 * Common pagination query schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

/**
 * Common sort query schema factory
 */
export function createSortSchema<T extends readonly string[]>(allowedFields: T) {
  return z.object({
    sortBy: z.enum(allowedFields as unknown as [string, ...string[]]).optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  });
}
