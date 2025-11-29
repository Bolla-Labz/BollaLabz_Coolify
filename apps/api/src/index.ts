import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

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

// API routes will be added in Part 2
app.get("/", (c) => {
  return c.json({
    message: "BollaLabz API Gateway",
    docs: "/api/docs",
  });
});

const port = parseInt(process.env.PORT || "4000", 10);

console.log(`🚀 API Gateway running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;