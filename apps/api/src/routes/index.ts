/**
 * API Routes Index
 * Combines all route modules into a single router
 */

import { Hono } from "hono";
import health from "./health";
import contacts from "./contacts";
import tasks from "./tasks";
import phoneRecords from "./phone-records";

const routes = new Hono();

/**
 * Mount route modules
 *
 * Route structure:
 * - /health        - Health check endpoints
 * - /contacts      - Contact management CRUD
 * - /tasks         - Task management CRUD
 * - /phone-records - Phone/call records CRUD
 */

// Health routes (no /api prefix needed as they're accessed directly)
routes.route("/health", health);

// Core resource routes
routes.route("/contacts", contacts);
routes.route("/tasks", tasks);
routes.route("/phone-records", phoneRecords);

/**
 * API Info endpoint
 * GET /api - Returns API information and available routes
 */
routes.get("/", (c) => {
  return c.json({
    success: true,
    data: {
      name: "BollaLabz API Gateway",
      version: process.env.API_VERSION || "0.0.1",
      description: "Command Center API for contacts, tasks, and voice pipeline",
      endpoints: {
        health: {
          "GET /api/health": "Health check with service status",
          "GET /api/health/ready": "Readiness check",
          "GET /api/health/live": "Liveness check",
        },
        contacts: {
          "GET /api/contacts": "List all contacts (paginated)",
          "GET /api/contacts/:id": "Get single contact",
          "POST /api/contacts": "Create new contact",
          "PUT /api/contacts/:id": "Update contact",
          "DELETE /api/contacts/:id": "Delete contact",
          "GET /api/contacts/search": "Vector similarity search",
        },
        tasks: {
          "GET /api/tasks": "List all tasks (paginated, filterable)",
          "GET /api/tasks/:id": "Get single task",
          "POST /api/tasks": "Create new task",
          "PUT /api/tasks/:id": "Update task",
          "DELETE /api/tasks/:id": "Delete task",
          "PATCH /api/tasks/:id/status": "Update task status",
        },
        phoneRecords: {
          "GET /api/phone-records": "List phone records (paginated)",
          "GET /api/phone-records/:id": "Get single record with transcription",
          "POST /api/phone-records": "Create phone record (internal)",
          "GET /api/phone-records/search": "Vector search on transcriptions",
          "GET /api/phone-records/stats": "Get call statistics",
        },
      },
      documentation: "/api/docs",
    },
    metadata: {
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || "0.0.1",
      requestId: crypto.randomUUID(),
    },
  });
});

export default routes;
