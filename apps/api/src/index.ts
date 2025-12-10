/**
 * BollaLabz API Gateway
 * Main application entry point
 */

// Load environment variables first, before any other imports
import "dotenv/config";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import routes from "./routes";
import { startAllWorkers, stopAllWorkers } from "./queues/workers";
import { closeAllQueues } from "./queues";
import { closeRedisConnection } from "@repo/db";

const app = new Hono();

// Security headers
app.use("*", secureHeaders());

// Request timing
app.use("*", timing());

// Request logging
app.use("*", logger());

// Pretty JSON output in development
app.use("*", prettyJSON());

// CORS configuration
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposeHeaders: ["X-Request-ID", "X-Response-Time"],
    maxAge: 86400,
  })
);

// Request ID middleware
app.use("*", async (c, next) => {
  const requestId = c.req.header("X-Request-ID") || crypto.randomUUID();
  c.header("X-Request-ID", requestId);
  await next();
});

// Mount API routes under /api prefix
app.route("/api", routes);

// Root endpoint (outside /api)
app.get("/", (c) => {
  return c.json({
    message: "BollaLabz API Gateway",
    version: process.env.API_VERSION || "0.0.1",
    api: "/api",
    health: "/api/health",
    docs: "/api/docs",
  });
});

// Global 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${c.req.method} ${c.req.path} not found`,
        timestamp: new Date().toISOString(),
      },
    },
    404
  );
});

// Global error handler
app.onError((err, c) => {
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err);

  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          process.env.NODE_ENV === "production"
            ? "An unexpected error occurred"
            : err.message,
        timestamp: new Date().toISOString(),
      },
    },
    500
  );
});

// Server configuration
const port = parseInt(process.env.PORT || "4000", 10);
const host = process.env.HOST || "0.0.0.0";

console.log(`
=====================================
  BollaLabz API Gateway v${process.env.API_VERSION || "0.0.1"}
=====================================
  Environment: ${process.env.NODE_ENV || "development"}
  Host:        ${host}
  Port:        ${port}
  CORS:        ${process.env.CORS_ORIGIN || "http://localhost:3000"}
=====================================
`);

// Start background workers before starting the server
console.log("[Server] Starting BullMQ workers...");
startAllWorkers();
console.log("[Server] Workers started successfully");

// Graceful shutdown handlers
process.on("SIGTERM", async () => {
  console.log("[Server] SIGTERM received, shutting down gracefully...");
  await stopAllWorkers();
  await closeAllQueues();
  await closeRedisConnection();
  console.log("[Server] Shutdown complete");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[Server] SIGINT received, shutting down gracefully...");
  await stopAllWorkers();
  await closeAllQueues();
  await closeRedisConnection();
  console.log("[Server] Shutdown complete");
  process.exit(0);
});

serve({
  fetch: app.fetch,
  port,
  hostname: host,
});

export default app;
