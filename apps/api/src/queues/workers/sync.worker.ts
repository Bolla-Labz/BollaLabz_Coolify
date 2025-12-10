/**
 * Sync Worker
 * Synchronizes data with external services (CRM, calendar, etc.)
 */

import { Worker, Job } from "bullmq";
import { createRedisConnection } from "@repo/db/redis";
import { QUEUE_NAMES } from "../index";
import type { SyncJobData, SyncJobResult } from "../types";

/**
 * Process sync job
 * This is the main job processor - implement actual sync logic here
 */
async function processSync(job: Job<SyncJobData>): Promise<SyncJobResult> {
  const { provider, userId, resourceType, direction, lastSyncedAt } = job.data;
  const startTime = Date.now();

  console.log(
    `[Sync] Starting job ${job.id} - ${provider}:${resourceType} for user ${userId}`
  );

  try {
    await job.updateProgress(10);

    let result: SyncJobResult;

    switch (provider) {
      case "google":
        result = await syncWithGoogle(userId, resourceType, direction, lastSyncedAt);
        break;
      case "outlook":
        result = await syncWithOutlook(userId, resourceType, direction, lastSyncedAt);
        break;
      case "salesforce":
        result = await syncWithSalesforce(userId, resourceType, direction, lastSyncedAt);
        break;
      case "hubspot":
        result = await syncWithHubspot(userId, resourceType, direction, lastSyncedAt);
        break;
      default:
        throw new Error(`Unknown sync provider: ${provider}`);
    }

    await job.updateProgress(100);

    const duration = Date.now() - startTime;
    console.log(
      `[Sync] Completed job ${job.id} in ${duration}ms - processed ${result.itemsProcessed} items`
    );

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Sync] Failed job ${job.id}: ${errorMessage}`);
    throw error;
  }
}

/**
 * Sync with Google (Contacts, Calendar, Tasks)
 */
async function syncWithGoogle(
  userId: string,
  resourceType: SyncJobData["resourceType"],
  direction: SyncJobData["direction"],
  _lastSyncedAt?: string
): Promise<SyncJobResult> {
  console.log(`[Sync] Google ${resourceType} sync for user ${userId} (${direction})`);

  // TODO: Implement Google sync
  // - Google People API for contacts
  // - Google Calendar API for calendar
  // - Google Tasks API for tasks

  return createPlaceholderResult();
}

/**
 * Sync with Microsoft Outlook (Contacts, Calendar, Tasks)
 */
async function syncWithOutlook(
  userId: string,
  resourceType: SyncJobData["resourceType"],
  direction: SyncJobData["direction"],
  _lastSyncedAt?: string
): Promise<SyncJobResult> {
  console.log(`[Sync] Outlook ${resourceType} sync for user ${userId} (${direction})`);

  // TODO: Implement Microsoft Graph sync
  // - Microsoft Graph API for contacts
  // - Microsoft Graph API for calendar
  // - Microsoft To Do API for tasks

  return createPlaceholderResult();
}

/**
 * Sync with Salesforce CRM
 */
async function syncWithSalesforce(
  userId: string,
  resourceType: SyncJobData["resourceType"],
  direction: SyncJobData["direction"],
  _lastSyncedAt?: string
): Promise<SyncJobResult> {
  console.log(`[Sync] Salesforce ${resourceType} sync for user ${userId} (${direction})`);

  // TODO: Implement Salesforce sync
  // - Salesforce REST API for contacts/leads
  // - Salesforce Events for calendar
  // - Salesforce Tasks for tasks

  return createPlaceholderResult();
}

/**
 * Sync with HubSpot CRM
 */
async function syncWithHubspot(
  userId: string,
  resourceType: SyncJobData["resourceType"],
  direction: SyncJobData["direction"],
  _lastSyncedAt?: string
): Promise<SyncJobResult> {
  console.log(`[Sync] HubSpot ${resourceType} sync for user ${userId} (${direction})`);

  // TODO: Implement HubSpot sync
  // - HubSpot Contacts API
  // - HubSpot Engagements API
  // - HubSpot Tasks API

  return createPlaceholderResult();
}

/**
 * Create placeholder sync result
 */
function createPlaceholderResult(): SyncJobResult {
  return {
    itemsProcessed: 0,
    itemsCreated: 0,
    itemsUpdated: 0,
    itemsDeleted: 0,
    errors: [],
    nextSyncToken: `sync-token-${Date.now()}`,
  };
}

/**
 * Create and start the sync worker
 */
export function createSyncWorker(): Worker<SyncJobData, SyncJobResult> {
  const worker = new Worker<SyncJobData, SyncJobResult>(
    QUEUE_NAMES.SYNC,
    processSync,
    {
      connection: createRedisConnection(),
      concurrency: 2, // Limited concurrency - API rate limits
      lockDuration: 600000, // 10 minutes - syncs can take significant time
      limiter: {
        max: 5, // Max 5 syncs per duration
        duration: 60000, // Per minute
      },
      settings: {
        backoffStrategy: (attemptsMade: number) => {
          // Longer backoff for rate-limited APIs
          return Math.min(Math.pow(2, attemptsMade) * 5000, 300000); // Max 5 minutes
        },
      },
    }
  );

  // Event handlers
  worker.on("completed", (job, result) => {
    console.log(
      `[Sync Worker] Job ${job.id} completed - ${result.itemsProcessed} items processed`
    );
  });

  worker.on("failed", (job, error) => {
    console.error(`[Sync Worker] Job ${job?.id} failed:`, error.message);
  });

  worker.on("error", (error) => {
    console.error("[Sync Worker] Worker error:", error);
  });

  worker.on("stalled", (jobId) => {
    console.warn(`[Sync Worker] Job ${jobId} stalled`);
  });

  console.log("[Sync Worker] Started");

  return worker;
}

export type { SyncJobData, SyncJobResult };
