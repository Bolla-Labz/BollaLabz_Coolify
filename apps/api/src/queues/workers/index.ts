/**
 * Worker Exports
 * Centralized exports for all job queue workers
 */

import type { Worker } from "bullmq";
import { createTranscriptionWorker } from "./transcription.worker";
import { createEmbeddingWorker } from "./embedding.worker";
import { createNotificationWorker } from "./notification.worker";
import { createSyncWorker } from "./sync.worker";

// Re-export worker factories
export { createTranscriptionWorker } from "./transcription.worker";
export { createEmbeddingWorker, addBatchEmbeddingJobs } from "./embedding.worker";
export { createNotificationWorker } from "./notification.worker";
export { createSyncWorker } from "./sync.worker";

// Re-export types
export type {
  TranscriptionJobData,
  TranscriptionJobResult,
} from "./transcription.worker";
export type {
  EmbeddingJobData,
  EmbeddingJobResult,
} from "./embedding.worker";
export type {
  NotificationJobData,
  NotificationJobResult,
} from "./notification.worker";
export type { SyncJobData, SyncJobResult } from "./sync.worker";

/**
 * Active worker instances
 */
let workers: Worker[] = [];

/**
 * Start all workers
 * Call this function to initialize and start all job processors
 */
export function startAllWorkers(): void {
  if (workers.length > 0) {
    console.warn("[Workers] Workers already started, skipping...");
    return;
  }

  console.log("[Workers] Starting all workers...");

  workers = [
    createTranscriptionWorker(),
    createEmbeddingWorker(),
    createNotificationWorker(),
    createSyncWorker(),
  ];

  console.log(`[Workers] ${workers.length} workers started successfully`);
}

/**
 * Stop all workers gracefully
 * Call this function during application shutdown
 */
export async function stopAllWorkers(): Promise<void> {
  if (workers.length === 0) {
    console.log("[Workers] No workers to stop");
    return;
  }

  console.log("[Workers] Stopping all workers...");

  await Promise.all(
    workers.map(async (worker) => {
      try {
        // Wait for active jobs to complete (5 second timeout)
        await worker.close();
        console.log(`[Workers] ${worker.name} worker stopped`);
      } catch (error) {
        console.error(`[Workers] Error stopping ${worker.name}:`, error);
      }
    })
  );

  workers = [];
  console.log("[Workers] All workers stopped");
}

/**
 * Get worker status for health checks
 */
export function getWorkerStatus(): Array<{
  name: string;
  running: boolean;
  concurrency: number;
}> {
  return workers.map((worker) => ({
    name: worker.name,
    running: worker.isRunning(),
    concurrency: worker.opts.concurrency || 1,
  }));
}

/**
 * Check if workers are healthy
 */
export function areWorkersHealthy(): boolean {
  if (workers.length === 0) {
    return false;
  }
  return workers.every((worker) => worker.isRunning());
}
