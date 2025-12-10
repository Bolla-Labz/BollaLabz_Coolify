/**
 * Embedding Worker
 * Generates vector embeddings for semantic search using AI/ML services
 */

import { Worker, Job } from "bullmq";
import { createRedisConnection } from "@repo/db/redis";
import { QUEUE_NAMES } from "../index";
import type { EmbeddingJobData, EmbeddingJobResult } from "../types";

// Embedding model configuration (dynamic)
const getBatchSize = () => 20;
const getMaxRetries = () => 3;

/**
 * Process embedding generation job
 * Integrates with Voyage AI (primary) and OpenAI (fallback) via embeddings service
 */
async function processEmbedding(
  job: Job<EmbeddingJobData>
): Promise<EmbeddingJobResult> {
  const { type, entityId, text, metadata } = job.data;
  const startTime = Date.now();

  console.log(
    `[Embedding] Starting job ${job.id} for ${type}:${entityId}`
  );

  try {
    // Update job progress
    await job.updateProgress(10);

    // Import embedding service and database
    const { generateEmbeddingWithMetadata } = await import("../../services/embeddings");
    const { db, contacts, phoneRecords, tasks } = await import("@repo/db");
    const { eq } = await import("drizzle-orm");

    // Step 1: Validate and prepare text
    const cleanedText = text.trim().slice(0, 8191); // Max tokens limit
    if (!cleanedText) {
      throw new Error("Empty text provided for embedding");
    }

    await job.updateProgress(30);

    // Step 2: Generate embedding using production service
    console.log(
      `[Embedding] Generating embedding for ${type}:${entityId} (${cleanedText.length} chars)`
    );
    const embeddingResult = await generateEmbeddingWithMetadata(cleanedText);

    await job.updateProgress(70);

    // Step 3: Store embedding in database based on entity type
    console.log(`[Embedding] Storing embedding for ${type}:${entityId}`);

    switch (type) {
      case "contact":
        await db.update(contacts)
          .set({ embedding: JSON.stringify(embeddingResult.embedding) })
          .where(eq(contacts.id, entityId));
        break;
      case "phone_record":
        await db.update(phoneRecords)
          .set({ embedding: JSON.stringify(embeddingResult.embedding) })
          .where(eq(phoneRecords.id, entityId));
        break;
      case "task":
        // Tasks table doesn't have embedding column, skip for now
        console.log(`[Embedding] Skipping embedding storage for task ${entityId} - not implemented in schema`);
        break;
      default:
        throw new Error(`Unknown entity type: ${type}`);
    }

    // Log metadata if provided
    if (metadata) {
      console.log(`[Embedding] Metadata: ${JSON.stringify(metadata)}`);
    }

    await job.updateProgress(100);

    const duration = Date.now() - startTime;
    console.log(
      `[Embedding] Completed job ${job.id} in ${duration}ms using ${embeddingResult.provider}/${embeddingResult.model}`
    );

    return {
      entityId,
      embedding: embeddingResult.embedding,
      model: embeddingResult.model,
      dimensions: embeddingResult.embedding.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Embedding] Failed job ${job.id}: ${errorMessage}`);
    throw error;
  }
}

/**
 * Create and start the embedding worker
 */
export function createEmbeddingWorker(): Worker<
  EmbeddingJobData,
  EmbeddingJobResult
> {
  const worker = new Worker<EmbeddingJobData, EmbeddingJobResult>(
    QUEUE_NAMES.EMBEDDING,
    processEmbedding,
    {
      connection: createRedisConnection(),
      concurrency: 5, // Higher concurrency - embeddings are fast
      lockDuration: 30000, // 30 seconds - embeddings are quick
      limiter: {
        max: 100, // Max 100 jobs per duration
        duration: 60000, // Per minute (rate limiting for API limits)
      },
      settings: {
        backoffStrategy: (attemptsMade: number) => {
          // Linear backoff for rate limit handling
          return attemptsMade * 1000;
        },
      },
    }
  );

  // Event handlers for monitoring
  worker.on("completed", (job, result) => {
    console.log(
      `[Embedding Worker] Job ${job.id} completed for ${job.data.type}:${result.entityId}`
    );
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[Embedding Worker] Job ${job?.id} failed:`,
      error.message
    );
  });

  worker.on("progress", (job, progress) => {
    console.log(`[Embedding Worker] Job ${job.id} progress: ${progress}%`);
  });

  worker.on("error", (error) => {
    console.error("[Embedding Worker] Worker error:", error);
  });

  worker.on("stalled", (jobId) => {
    console.warn(`[Embedding Worker] Job ${jobId} stalled`);
  });

  console.log("[Embedding Worker] Started");

  return worker;
}

/**
 * Batch add embedding jobs for multiple entities
 */
export async function addBatchEmbeddingJobs(
  jobs: Array<{
    type: EmbeddingJobData["type"];
    entityId: string;
    text: string;
    metadata?: Record<string, unknown>;
  }>
): Promise<void> {
  const { embeddingQueue } = await import("../index");
  const batchSize = getBatchSize();

  // Add jobs in batches
  const batches = [];
  for (let i = 0; i < jobs.length; i += batchSize) {
    batches.push(jobs.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    await embeddingQueue.addBulk(
      batch.map((job) => ({
        name: `embed-${job.type}-${job.entityId}`,
        data: job,
      }))
    );
  }

  console.log(`[Embedding] Added ${jobs.length} jobs in ${batches.length} batches`);
}

export type { EmbeddingJobData, EmbeddingJobResult };
