/**
 * Health Check Routes
 * Provides system health and readiness endpoints with real service checks
 */

import { Hono } from "hono";
import type { ApiResponse, HealthCheckResponse } from "@repo/types";
import { checkRedisHealth, getRedisInfo } from "@repo/db/redis";
import { getQueueHealth } from "../queues";
import { getWorkerStatus, areWorkersHealthy } from "../queues/workers";

const health = new Hono();

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<{
  status: "up" | "down";
  responseTime: number;
}> {
  const start = Date.now();
  try {
    const { db } = await import("@repo/db");
    await db.execute("SELECT 1");
    return {
      status: "up",
      responseTime: Date.now() - start,
    };
  } catch (error) {
    console.error("[Health] Database check failed:", error);
    return {
      status: "down",
      responseTime: Date.now() - start,
    };
  }
}

/**
 * GET /health
 * Basic health check endpoint with actual service checks
 */
health.get("/", async (c) => {
  const startTime = Date.now();

  // Perform actual health checks in parallel
  const [dbHealth, redisHealthy, queueHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    getQueueHealth(),
  ]);

  // Build services array
  const services: Array<{
    name: string;
    status: "up" | "down";
    responseTime?: number;
    details?: Record<string, unknown>;
  }> = [
    { name: "api", status: "up", responseTime: 1 },
    {
      name: "database",
      status: dbHealth.status,
      responseTime: dbHealth.responseTime,
    },
    {
      name: "redis",
      status: redisHealthy ? "up" : "down",
    },
  ];

  // Add queue health
  for (const queue of queueHealth) {
    services.push({
      name: `queue:${queue.name}`,
      status: queue.status,
      details: {
        waiting: queue.waiting,
        active: queue.active,
        completed: queue.completed,
        failed: queue.failed,
      },
    });
  }

  const allUp = services.every((s) => s.status === "up");
  const apiService = services[0];
  const criticalUp =
    dbHealth.status === "up" && redisHealthy && apiService !== undefined && apiService.status === "up";

  const response: ApiResponse<HealthCheckResponse> = {
    success: true,
    data: {
      status: allUp ? "healthy" : criticalUp ? "degraded" : "unhealthy",
      version: process.env.API_VERSION || "0.0.1",
      uptime: process.uptime(),
      services,
      timestamp: new Date().toISOString(),
    },
    metadata: {
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || "0.0.1",
      requestId: crypto.randomUUID(),
      duration: Date.now() - startTime,
    },
  };

  const statusCode = criticalUp ? 200 : 503;
  return c.json(response, statusCode);
});

/**
 * GET /health/ready
 * Readiness check for Kubernetes/load balancers
 */
health.get("/ready", async (c) => {
  const startTime = Date.now();

  const [dbHealth, redisHealthy] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
  ]);

  const isReady = dbHealth.status === "up" && redisHealthy;

  if (!isReady) {
    const reasons: string[] = [];
    if (dbHealth.status !== "up") reasons.push("database");
    if (!redisHealthy) reasons.push("redis");

    return c.json(
      {
        success: false,
        error: {
          code: "SERVICE_NOT_READY",
          message: `Service is not ready: ${reasons.join(", ")} unavailable`,
          timestamp: new Date().toISOString(),
        },
      },
      503
    );
  }

  return c.json({
    success: true,
    data: {
      ready: true,
      database: dbHealth.status,
      redis: redisHealthy ? "up" : "down",
    },
    metadata: {
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || "0.0.1",
      requestId: crypto.randomUUID(),
      duration: Date.now() - startTime,
    },
  });
});

/**
 * GET /health/live
 * Liveness check for Kubernetes
 */
health.get("/live", async (c) => {
  return c.json({
    success: true,
    data: { alive: true },
    metadata: {
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || "0.0.1",
      requestId: crypto.randomUUID(),
    },
  });
});

/**
 * GET /health/redis
 * Detailed Redis health information
 */
health.get("/redis", async (c) => {
  const startTime = Date.now();

  const [isHealthy, info] = await Promise.all([
    checkRedisHealth(),
    getRedisInfo(),
  ]);

  return c.json({
    success: true,
    data: {
      status: isHealthy ? "up" : "down",
      ...info,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || "0.0.1",
      requestId: crypto.randomUUID(),
      duration: Date.now() - startTime,
    },
  });
});

/**
 * GET /health/queues
 * Detailed queue health and statistics
 */
health.get("/queues", async (c) => {
  const startTime = Date.now();

  const [queueHealth, workerStatus] = await Promise.all([
    getQueueHealth(),
    Promise.resolve(getWorkerStatus()),
  ]);

  const workersHealthy = areWorkersHealthy();

  return c.json({
    success: true,
    data: {
      queues: queueHealth,
      workers: {
        healthy: workersHealthy,
        instances: workerStatus,
      },
    },
    metadata: {
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || "0.0.1",
      requestId: crypto.randomUUID(),
      duration: Date.now() - startTime,
    },
  });
});

export default health;
