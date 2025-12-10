/**
 * BullMQ Queue Definitions
 * Centralized queue configuration for background job processing
 */

import { Queue, QueueEvents } from "bullmq";
import { createRedisConnection } from "@repo/db/redis";
import type {
  TranscriptionJobData,
  EmbeddingJobData,
  NotificationJobData,
  SyncJobData,
} from "./types";

// Queue names - centralized for consistency
export const QUEUE_NAMES = {
  TRANSCRIPTION: "transcription",
  EMBEDDING: "embedding",
  NOTIFICATION: "notification",
  SYNC: "sync",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Default job options for all queues
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 1000,
  },
  removeOnComplete: {
    age: 24 * 3600, // Keep completed jobs for 24 hours
    count: 1000, // Keep last 1000 completed jobs
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    count: 5000, // Keep last 5000 failed jobs
  },
};

/**
 * Transcription Queue
 * Processes audio recordings into text transcripts
 */
export const transcriptionQueue = new Queue<TranscriptionJobData>(
  QUEUE_NAMES.TRANSCRIPTION,
  {
    connection: createRedisConnection(),
    defaultJobOptions: {
      ...defaultJobOptions,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
  }
);

/**
 * Embedding Queue
 * Generates vector embeddings for semantic search
 */
export const embeddingQueue = new Queue<EmbeddingJobData>(
  QUEUE_NAMES.EMBEDDING,
  {
    connection: createRedisConnection(),
    defaultJobOptions: {
      ...defaultJobOptions,
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 500,
      },
    },
  }
);

/**
 * Notification Queue
 * Sends notifications via email, SMS, push, or webhooks
 */
export const notificationQueue = new Queue<NotificationJobData>(
  QUEUE_NAMES.NOTIFICATION,
  {
    connection: createRedisConnection(),
    defaultJobOptions: {
      ...defaultJobOptions,
      priority: 2, // Higher priority for notifications
    },
  }
);

/**
 * Sync Queue
 * Synchronizes data with external services
 */
export const syncQueue = new Queue<SyncJobData>(QUEUE_NAMES.SYNC, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

// Queue events for monitoring (optional - attach listeners as needed)
export const transcriptionQueueEvents = new QueueEvents(
  QUEUE_NAMES.TRANSCRIPTION,
  {
    connection: createRedisConnection(),
  }
);

export const embeddingQueueEvents = new QueueEvents(QUEUE_NAMES.EMBEDDING, {
  connection: createRedisConnection(),
});

/**
 * Get all queues for health checks and monitoring
 */
export function getAllQueues(): Queue[] {
  return [transcriptionQueue, embeddingQueue, notificationQueue, syncQueue];
}

/**
 * Get queue health status
 */
export async function getQueueHealth(): Promise<
  Array<{
    name: string;
    status: "up" | "down";
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }>
> {
  const queues = getAllQueues();
  const results = await Promise.all(
    queues.map(async (queue) => {
      try {
        const [waiting, active, completed, failed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
        ]);

        return {
          name: queue.name,
          status: "up" as const,
          waiting,
          active,
          completed,
          failed,
        };
      } catch (error) {
        console.error(`[Queue] Health check failed for ${queue.name}:`, error);
        return {
          name: queue.name,
          status: "down" as const,
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
        };
      }
    })
  );

  return results;
}

/**
 * Graceful shutdown for all queues
 */
export async function closeAllQueues(): Promise<void> {
  const queues = getAllQueues();
  await Promise.all(
    queues.map(async (queue) => {
      try {
        await queue.close();
        console.log(`[Queue] ${queue.name} closed`);
      } catch (error) {
        console.error(`[Queue] Error closing ${queue.name}:`, error);
      }
    })
  );

  // Close queue events
  await transcriptionQueueEvents.close();
  await embeddingQueueEvents.close();
}

// Export types
export * from "./types";
