/**
 * Rate Limiter Middleware
 * Redis-based rate limiting with configurable windows and limits
 *
 * Features:
 * - Sliding window rate limiting via Redis
 * - Per-IP tracking with X-Forwarded-For support
 * - Standard rate limit headers (X-RateLimit-*)
 * - Preset configurations for different use cases
 */

import type { MiddlewareHandler } from "hono";
import { redis } from "@repo/db";

/**
 * Rate limit configuration options
 */
interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests allowed per window */
  max: number;
  /** Redis key prefix for namespacing */
  keyPrefix?: string;
  /** Custom error message when rate limit exceeded */
  message?: string;
  /** Skip rate limiting for certain conditions */
  skip?: (c: Parameters<MiddlewareHandler>[0]) => boolean | Promise<boolean>;
  /** Custom key generator (default: IP-based) */
  keyGenerator?: (c: Parameters<MiddlewareHandler>[0]) => string | Promise<string>;
}

/**
 * Extract client IP address from request headers
 * Supports common proxy headers and falls back to unknown
 */
function getClientIp(c: Parameters<MiddlewareHandler>[0]): string {
  // Check standard proxy headers in order of reliability
  const forwardedFor = c.req.header("x-forwarded-for");
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first (client)
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    return ips[0] || "unknown";
  }

  const realIp = c.req.header("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = c.req.header("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return "unknown";
}

/**
 * Creates a rate limiter middleware with the specified configuration
 *
 * @example
 * ```typescript
 * // Basic usage - 100 requests per minute
 * app.use(rateLimiter({ windowMs: 60000, max: 100 }));
 *
 * // Auth endpoint - 5 attempts per 15 minutes
 * app.post('/login', rateLimiter({ windowMs: 900000, max: 5, keyPrefix: 'auth' }), handler);
 * ```
 */
export function rateLimiter(config: RateLimitConfig): MiddlewareHandler {
  const {
    windowMs,
    max,
    keyPrefix = "rl",
    message = "Too many requests, please try again later",
    skip,
    keyGenerator,
  } = config;

  return async (c, next) => {
    // Check if rate limiting should be skipped
    if (skip) {
      const shouldSkip = await skip(c);
      if (shouldSkip) {
        return next();
      }
    }

    // Generate rate limit key
    const identifier = keyGenerator ? await keyGenerator(c) : getClientIp(c);
    const key = `${keyPrefix}:${identifier}`;

    try {
      // Atomic increment and get current count
      const current = await redis.incr(key);

      // Set expiry on first request in window
      if (current === 1) {
        await redis.pexpire(key, windowMs);
      }

      // Get TTL for reset header
      const ttl = await redis.pttl(key);
      const resetTime = Date.now() + (ttl > 0 ? ttl : windowMs);

      // Set standard rate limit headers
      c.header("X-RateLimit-Limit", String(max));
      c.header("X-RateLimit-Remaining", String(Math.max(0, max - current)));
      c.header("X-RateLimit-Reset", String(Math.ceil(resetTime / 1000)));

      // Check if limit exceeded
      if (current > max) {
        c.header("Retry-After", String(Math.ceil((ttl > 0 ? ttl : windowMs) / 1000)));

        return c.json(
          {
            success: false,
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message,
              retryAfter: Math.ceil((ttl > 0 ? ttl : windowMs) / 1000),
              limit: max,
              windowMs,
            },
          },
          429
        );
      }

      await next();
    } catch (error) {
      // Log Redis errors but don't block requests
      console.error("[RateLimiter] Redis error:", error);
      // Fail open - allow request if Redis is unavailable
      await next();
    }
  };
}

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

/**
 * Standard API rate limiter
 * 60 requests per minute per IP
 * Suitable for most API endpoints
 */
export const apiRateLimiter = rateLimiter({
  windowMs: 60_000, // 1 minute
  max: 60,
  keyPrefix: "rl:api",
  message: "API rate limit exceeded. Please slow down your requests.",
});

/**
 * Authentication rate limiter
 * 5 attempts per 15 minutes per IP
 * Prevents brute force attacks on login/register
 */
export const authRateLimiter = rateLimiter({
  windowMs: 900_000, // 15 minutes
  max: 5,
  keyPrefix: "rl:auth",
  message: "Too many authentication attempts. Please try again later.",
});

/**
 * Webhook rate limiter
 * 100 requests per second per IP
 * High throughput for incoming webhooks
 */
export const webhookRateLimiter = rateLimiter({
  windowMs: 1_000, // 1 second
  max: 100,
  keyPrefix: "rl:webhook",
  message: "Webhook rate limit exceeded.",
});

/**
 * Search rate limiter
 * 30 requests per minute per IP
 * Prevents expensive search query abuse
 */
export const searchRateLimiter = rateLimiter({
  windowMs: 60_000, // 1 minute
  max: 30,
  keyPrefix: "rl:search",
  message: "Search rate limit exceeded. Please wait before searching again.",
});

/**
 * Upload rate limiter
 * 10 uploads per minute per IP
 * Prevents storage abuse
 */
export const uploadRateLimiter = rateLimiter({
  windowMs: 60_000, // 1 minute
  max: 10,
  keyPrefix: "rl:upload",
  message: "Upload rate limit exceeded. Please wait before uploading again.",
});

/**
 * Strict rate limiter
 * 10 requests per minute per IP
 * For sensitive operations like password reset
 */
export const strictRateLimiter = rateLimiter({
  windowMs: 60_000, // 1 minute
  max: 10,
  keyPrefix: "rl:strict",
  message: "Rate limit exceeded for this sensitive operation.",
});

export type { RateLimitConfig };
