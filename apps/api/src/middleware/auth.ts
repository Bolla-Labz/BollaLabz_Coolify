/**
 * Authentication Middleware
 * Clerk JWT verification for protected API routes
 */

import { createMiddleware } from "hono/factory";
import { verifyToken } from "@clerk/backend";

/**
 * Extend Hono context variables for type safety
 */
interface Variables {
  userId: string;
}

/**
 * Authentication middleware - requires valid Clerk JWT token
 *
 * Usage:
 * - Apply to routes that require authenticated users
 * - Extracts and verifies JWT from Authorization header
 * - Sets userId in context for downstream handlers
 *
 * @example
 * ```typescript
 * import { requireAuth } from "../middleware";
 *
 * // Apply to specific route
 * tasks.get("/", requireAuth, async (c) => {
 *   const userId = c.get("userId");
 *   // ... handle request
 * });
 * ```
 */
export const requireAuth = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    // Extract Authorization header
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Missing or invalid Authorization header",
            timestamp: new Date().toISOString(),
          },
        },
        401
      );
    }

    // Extract token (remove "Bearer " prefix)
    const token = authHeader.slice(7);

    try {
      // Verify JWT token with Clerk
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      // Extract userId from token payload (sub claim)
      if (!payload.sub) {
        return c.json(
          {
            success: false,
            error: {
              code: "INVALID_TOKEN",
              message: "Token missing subject claim",
              timestamp: new Date().toISOString(),
            },
          },
          401
        );
      }

      // Set userId in context for downstream handlers
      c.set("userId", payload.sub);

      // Continue to next handler
      await next();
    } catch (error) {
      console.error("[Auth] Token verification failed:", error);

      return c.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid or expired authentication token",
            timestamp: new Date().toISOString(),
          },
        },
        401
      );
    }
  }
);

/**
 * Optional authentication middleware
 *
 * Similar to requireAuth but doesn't reject requests without auth.
 * Sets userId if valid token present, otherwise continues without it.
 *
 * @example
 * ```typescript
 * tasks.get("/public", optionalAuth, async (c) => {
 *   const userId = c.get("userId"); // may be undefined
 *   // ... handle request
 * });
 * ```
 */
export const optionalAuth = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);

      try {
        const payload = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });

        if (payload.sub) {
          c.set("userId", payload.sub);
        }
      } catch (error) {
        // Silent fail for optional auth
        console.warn("[Auth] Optional auth verification failed:", error);
      }
    }

    await next();
  }
);
