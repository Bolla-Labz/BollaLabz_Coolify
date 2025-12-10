/**
 * Transcription Worker
 * Processes audio recordings into text transcripts using AI/ML services
 */

import { Worker, Job } from "bullmq";
import { createRedisConnection } from "@repo/db/redis";
import { QUEUE_NAMES } from "../index";
import type { TranscriptionJobData, TranscriptionJobResult } from "../types";

/**
 * Process transcription job
 * Integrates with Deepgram for production-grade speech-to-text
 */
async function processTranscription(
  job: Job<TranscriptionJobData>
): Promise<TranscriptionJobResult> {
  const { phoneRecordId, recordingUrl, language = "en", speakerDiarization = false } = job.data;
  const startTime = Date.now();

  console.log(
    `[Transcription] Starting job ${job.id} for record ${phoneRecordId}`
  );

  try {
    // Update job progress
    await job.updateProgress(10);

    // Import Deepgram service and database
    const { getDeepgramService } = await import("../../services/deepgram");
    const { db, phoneRecords } = await import("@repo/db");
    const { eq } = await import("drizzle-orm");

    await job.updateProgress(20);

    // Call Deepgram transcription service
    console.log(
      `[Transcription] Processing with Deepgram (language=${language}, diarization=${speakerDiarization})`
    );
    const deepgram = getDeepgramService();
    const result = await deepgram.transcribeFromUrl(recordingUrl, {
      model: "nova-2",
      language: language,
      diarize: speakerDiarization,
      smart_format: true,
      punctuate: true,
      utterances: true,
    });

    await job.updateProgress(70);

    if (!result.success) {
      throw new Error(`Transcription failed: ${result.error}`);
    }

    // Store transcript in database
    console.log(`[Transcription] Storing transcript for ${phoneRecordId}`);
    await db.update(phoneRecords)
      .set({
        transcription: result.transcript,
        duration: result.duration,
      })
      .where(eq(phoneRecords.id, phoneRecordId));

    await job.updateProgress(100);

    const processingTime = Date.now() - startTime;
    console.log(
      `[Transcription] Completed job ${job.id} in ${processingTime}ms`
    );

    // Build response with optional speaker diarization
    const response: TranscriptionJobResult = {
      phoneRecordId,
      transcript: result.transcript || "",
      audioDurationSeconds: result.duration || 0,
      processingTimeMs: processingTime,
      words: result.words?.map(w => ({
        word: w.word,
        start: w.start,
        end: w.end,
        confidence: w.confidence,
      })) || [],
    };

    if (speakerDiarization && result.speakers) {
      response.speakers = result.speakers.map(s => ({
        speaker: String(s.speaker),
        segments: result.utterances
          ?.filter(u => u.speaker === s.speaker)
          .map(u => ({
            start: u.start,
            end: u.end,
            text: u.text,
          })) || [],
      }));
    }

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[Transcription] Failed job ${job.id}: ${errorMessage}`
    );
    throw error;
  }
}

/**
 * Create and start the transcription worker
 */
export function createTranscriptionWorker(): Worker<
  TranscriptionJobData,
  TranscriptionJobResult
> {
  const worker = new Worker<TranscriptionJobData, TranscriptionJobResult>(
    QUEUE_NAMES.TRANSCRIPTION,
    processTranscription,
    {
      connection: createRedisConnection(),
      concurrency: 3, // Process up to 3 jobs concurrently
      lockDuration: 300000, // 5 minutes - transcription can take time
      limiter: {
        max: 10, // Max 10 jobs per duration
        duration: 60000, // Per minute (rate limiting)
      },
      settings: {
        backoffStrategy: (attemptsMade: number) => {
          // Exponential backoff: 1s, 2s, 4s, 8s, 16s
          return Math.min(Math.pow(2, attemptsMade) * 1000, 30000);
        },
      },
    }
  );

  // Event handlers for monitoring
  worker.on("completed", (job, result) => {
    console.log(
      `[Transcription Worker] Job ${job.id} completed for record ${result.phoneRecordId}`
    );
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[Transcription Worker] Job ${job?.id} failed:`,
      error.message
    );
  });

  worker.on("progress", (job, progress) => {
    console.log(
      `[Transcription Worker] Job ${job.id} progress: ${progress}%`
    );
  });

  worker.on("error", (error) => {
    console.error("[Transcription Worker] Worker error:", error);
  });

  worker.on("stalled", (jobId) => {
    console.warn(`[Transcription Worker] Job ${jobId} stalled`);
  });

  console.log("[Transcription Worker] Started");

  return worker;
}

export type { TranscriptionJobData, TranscriptionJobResult };
