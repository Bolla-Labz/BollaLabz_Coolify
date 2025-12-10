// 09 December 2025 03 45 00

/**
 * Worker Feature Validation Suite
 *
 * Comprehensive validation of Phase 3 worker implementations:
 * - Transcription Worker: Deepgram integration with speaker diarization
 * - Embedding Worker: Voyage/OpenAI vector generation with pgvector storage
 * - Notification Worker: Twilio SMS delivery with confirmation
 *
 * This script validates production-readiness across:
 * 1. Service integration (no placeholders/stubs)
 * 2. Database persistence
 * 3. Error handling
 * 4. Retry logic
 * 5. Performance (latency targets)
 */

// Load environment variables from .env file
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

// Get current file's directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the api root directory (override any pre-loaded values)
config({ path: resolve(__dirname, "../../.env"), override: true });

// Debug: Verify environment variables loaded
console.log("\n🔍 Environment Variables Check:");
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? "✅ SET" : "❌ NOT SET"}`);
console.log(`REDIS_HOST: ${process.env.REDIS_HOST || "❌ NOT SET (using localhost)"}`);
console.log(`REDIS_PORT: ${process.env.REDIS_PORT || "❌ NOT SET (using 6379)"}`);
console.log(`REDIS_PASSWORD: ${process.env.REDIS_PASSWORD ? "✅ SET" : "❌ NOT SET"}`);
console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 15) + "..." : "❌ NOT SET"}`);
console.log(`VOYAGE_API_KEY: ${process.env.VOYAGE_API_KEY ? process.env.VOYAGE_API_KEY.substring(0, 15) + "..." : "❌ NOT SET"}`);
console.log(`DEEPGRAM_API_KEY: ${process.env.DEEPGRAM_API_KEY ? process.env.DEEPGRAM_API_KEY.substring(0, 15) + "..." : "❌ NOT SET"}`);
console.log(`TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.substring(0, 10) + "..." : "❌ NOT SET"}\n`);

import { Queue, QueueEvents } from "bullmq";
import { createRedisConnection } from "@repo/db/redis";
import { QUEUE_NAMES } from "../queues/index";
import type {
  TranscriptionJobData,
  TranscriptionJobResult,
  EmbeddingJobData,
  EmbeddingJobResult,
  NotificationJobData,
  NotificationJobResult,
} from "../queues/types";

// =============================================================================
// CONFIGURATION
// =============================================================================

const LATENCY_TARGETS = {
  transcription: 5000, // < 5s for short audio
  embedding: 2000, // < 2s for text embedding
  sms: 10000, // < 10s for SMS delivery
};

const TEST_DATA = {
  // Deepgram's public test audio file (guaranteed to work with Deepgram API)
  audioUrl: process.env.TEST_AUDIO_URL || "https://static.deepgram.com/examples/Bueller-Life-moves-pretty-fast.wav",
  testPhone: process.env.TEST_PHONE_NUMBER || "+15155551234", // Replace with real test number
  sampleText: "BollaLabz Command Center is an AI-powered productivity platform integrating voice, CRM, and task management.",
  // Generate valid UUIDs for test entities
  testPhoneRecordId: randomUUID(),
  testContactId: randomUUID(),
  testUserId: randomUUID(),
  testInvalidPhoneRecordId: randomUUID(), // For error handling tests
};

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

interface ValidationResult {
  test: string;
  passed: boolean;
  details: string;
  latency?: number;
  error?: string;
}

const results: ValidationResult[] = [];

function addResult(test: string, passed: boolean, details: string, latency?: number, error?: string) {
  results.push({ test, passed, details, latency, error });

  const status = passed ? "✓ PASS" : "✗ FAIL";
  const latencyInfo = latency ? ` (${latency}ms)` : "";
  console.log(`${status}: ${test}${latencyInfo}`);
  if (details) console.log(`  Details: ${details}`);
  if (error) console.log(`  Error: ${error}`);
}

// =============================================================================
// TEST 1: TRANSCRIPTION WORKER VALIDATION
// =============================================================================

async function validateTranscriptionWorker(): Promise<void> {
  console.log("\n=== TRANSCRIPTION WORKER VALIDATION ===\n");

  const transcriptionQueue = new Queue<TranscriptionJobData, TranscriptionJobResult>(
    QUEUE_NAMES.TRANSCRIPTION,
    { connection: createRedisConnection() }
  );

  const queueEvents = new QueueEvents(QUEUE_NAMES.TRANSCRIPTION, {
    connection: createRedisConnection(),
  });

  try {
    // Test 1.1: Real Deepgram Integration (not placeholder)
    const jobData: TranscriptionJobData = {
      phoneRecordId: TEST_DATA.testPhoneRecordId,
      recordingUrl: TEST_DATA.audioUrl,
      language: "en",
      speakerDiarization: true,
    };

    const startTime = Date.now();
    const job = await transcriptionQueue.add("test-transcription", jobData, {
      removeOnComplete: false,
      removeOnFail: false,
    });

    // Wait for job completion (max 30s)
    const result = await job.waitUntilFinished(queueEvents, 30000);

    const latency = Date.now() - startTime;

    // Validation checks
    if (result.transcript.includes("[Transcription pending")) {
      addResult(
        "Transcription Worker: Real Deepgram Integration",
        false,
        "Worker still using placeholder transcript",
        latency,
        "Placeholder text detected"
      );
    } else if (result.transcript.length === 0) {
      addResult(
        "Transcription Worker: Real Deepgram Integration",
        false,
        "Empty transcript returned",
        latency,
        "No transcript content"
      );
    } else {
      addResult(
        "Transcription Worker: Real Deepgram Integration",
        true,
        `Transcript: "${result.transcript.substring(0, 100)}..."`,
        latency
      );
    }

    // Test 1.2: Speaker Diarization
    if (result.speakers && result.speakers.length > 0) {
      addResult(
        "Transcription Worker: Speaker Diarization",
        true,
        `Detected ${result.speakers.length} speaker(s)`
      );
    } else {
      addResult(
        "Transcription Worker: Speaker Diarization",
        false,
        "No speaker information returned despite diarization=true"
      );
    }

    // Test 1.3: Performance (Latency)
    const performancePass = latency < LATENCY_TARGETS.transcription;
    addResult(
      "Transcription Worker: Performance (< 5s)",
      performancePass,
      performancePass
        ? "Within acceptable latency"
        : `Exceeded target (${LATENCY_TARGETS.transcription}ms)`,
      latency
    );

    // Test 1.4: Database Storage (if implemented)
    try {
      const { db, phoneRecords } = await import("@repo/db");
      const { eq } = await import("drizzle-orm");

      const dbRecord = await db
        .select()
        .from(phoneRecords)
        .where(eq(phoneRecords.id, jobData.phoneRecordId))
        .limit(1);

      if (dbRecord.length > 0 && dbRecord[0].transcription) {
        addResult(
          "Transcription Worker: Database Storage",
          true,
          "Transcript persisted to database"
        );
      } else {
        addResult(
          "Transcription Worker: Database Storage",
          false,
          "Transcript not stored in database (optional enhancement)"
        );
      }
    } catch (dbError) {
      addResult(
        "Transcription Worker: Database Storage",
        false,
        "Could not check database storage",
        undefined,
        dbError instanceof Error ? dbError.message : String(dbError)
      );
    }
  } catch (error) {
    addResult(
      "Transcription Worker: Overall",
      false,
      "Worker failed to complete job",
      undefined,
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    await transcriptionQueue.close();
    await queueEvents.close();
  }
}

// =============================================================================
// TEST 2: EMBEDDING WORKER VALIDATION
// =============================================================================

async function validateEmbeddingWorker(): Promise<void> {
  console.log("\n=== EMBEDDING WORKER VALIDATION ===\n");

  const embeddingQueue = new Queue<EmbeddingJobData, EmbeddingJobResult>(
    QUEUE_NAMES.EMBEDDING,
    { connection: createRedisConnection() }
  );

  const queueEvents = new QueueEvents(QUEUE_NAMES.EMBEDDING, {
    connection: createRedisConnection(),
  });

  try {
    // Test 2.1: Real Vector Generation (not zero-filled)
    const jobData: EmbeddingJobData = {
      type: "contact",
      entityId: TEST_DATA.testContactId,
      text: TEST_DATA.sampleText,
    };

    const startTime = Date.now();
    const job = await embeddingQueue.add("test-embedding", jobData, {
      removeOnComplete: false,
      removeOnFail: false,
    });

    const result = await job.waitUntilFinished(queueEvents, 15000);

    const latency = Date.now() - startTime;

    // Check if embedding is real (not all zeros)
    const isZeroFilled = result.embedding.every((val) => val === 0);
    if (isZeroFilled) {
      addResult(
        "Embedding Worker: Real Vector Generation",
        false,
        "Embedding is zero-filled (placeholder still in use)",
        latency,
        "Placeholder embedding detected"
      );
    } else {
      addResult(
        "Embedding Worker: Real Vector Generation",
        true,
        `Generated ${result.dimensions}-dimensional vector via ${result.model}`,
        latency
      );
    }

    // Test 2.2: Provider Information
    const validProvider = result.model.includes("voyage") || result.model.includes("text-embedding");
    addResult(
      "Embedding Worker: Provider Integration",
      validProvider,
      validProvider
        ? `Using ${result.model}`
        : "Unknown or placeholder model"
    );

    // Test 2.3: Performance (< 2s)
    const performancePass = latency < LATENCY_TARGETS.embedding;
    addResult(
      "Embedding Worker: Performance (< 2s)",
      performancePass,
      performancePass
        ? "Within acceptable latency"
        : `Exceeded target (${LATENCY_TARGETS.embedding}ms)`,
      latency
    );

    // Test 2.4: pgvector Storage
    try {
      const { db, contacts } = await import("@repo/db");
      const { eq } = await import("drizzle-orm");

      const dbRecord = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, jobData.entityId))
        .limit(1);

      if (dbRecord.length > 0 && dbRecord[0]?.embedding) {
        const storedEmbedding = JSON.parse(dbRecord[0].embedding as string);
        const dimensionsMatch = Array.isArray(storedEmbedding) && storedEmbedding.length === result.dimensions;
        addResult(
          "Embedding Worker: pgvector Storage",
          dimensionsMatch,
          dimensionsMatch
            ? `Vector stored with ${storedEmbedding.length} dimensions`
            : "Dimension mismatch between result and database"
        );
      } else {
        addResult(
          "Embedding Worker: pgvector Storage",
          false,
          "Vector not stored in database"
        );
      }
    } catch (dbError) {
      addResult(
        "Embedding Worker: pgvector Storage",
        false,
        "Could not check database storage",
        undefined,
        dbError instanceof Error ? dbError.message : String(dbError)
      );
    }
  } catch (error) {
    addResult(
      "Embedding Worker: Overall",
      false,
      "Worker failed to complete job",
      undefined,
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    await embeddingQueue.close();
    await queueEvents.close();
  }
}

// =============================================================================
// TEST 3: NOTIFICATION WORKER VALIDATION
// =============================================================================

async function validateNotificationWorker(): Promise<void> {
  console.log("\n=== NOTIFICATION WORKER VALIDATION ===\n");

  const notificationQueue = new Queue<NotificationJobData, NotificationJobResult>(
    QUEUE_NAMES.NOTIFICATION,
    { connection: createRedisConnection() }
  );

  const queueEvents = new QueueEvents(QUEUE_NAMES.NOTIFICATION, {
    connection: createRedisConnection(),
  });

  try {
    // Test 3.1: Real Twilio SMS Integration
    const jobData: NotificationJobData = {
      type: "sms",
      userId: TEST_DATA.testUserId,
      template: "Test message from BollaLabz validation suite",
      data: {
        phoneNumber: TEST_DATA.testPhone,
      },
    };

    const startTime = Date.now();
    const job = await notificationQueue.add("test-sms", jobData, {
      removeOnComplete: false,
      removeOnFail: false,
    });

    const result = await job.waitUntilFinished(queueEvents, 15000);

    const latency = Date.now() - startTime;

    // Check for real Twilio message SID (format: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
    const hasRealMessageId = result.messageId && result.messageId.startsWith("SM");
    const isPlaceholder = result.messageId?.startsWith("sms-");

    if (isPlaceholder) {
      addResult(
        "Notification Worker: Real Twilio Integration",
        false,
        "Worker using placeholder message ID",
        latency,
        "Placeholder detected"
      );
    } else if (hasRealMessageId) {
      addResult(
        "Notification Worker: Real Twilio Integration",
        true,
        `SMS sent with message SID: ${result.messageId}`,
        latency
      );
    } else {
      addResult(
        "Notification Worker: Real Twilio Integration",
        false,
        "Invalid or missing message ID",
        latency
      );
    }

    // Test 3.2: Delivery Status
    addResult(
      "Notification Worker: Delivery Status",
      result.delivered,
      result.delivered ? "Message marked as delivered" : "Delivery failed"
    );

    // Test 3.3: Performance (< 10s)
    const performancePass = latency < LATENCY_TARGETS.sms;
    addResult(
      "Notification Worker: Performance (< 10s)",
      performancePass,
      performancePass
        ? "Within acceptable latency"
        : `Exceeded target (${LATENCY_TARGETS.sms}ms)`,
      latency
    );
  } catch (error) {
    addResult(
      "Notification Worker: Overall",
      false,
      "Worker failed to complete job",
      undefined,
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    await notificationQueue.close();
    await queueEvents.close();
  }
}

// =============================================================================
// ERROR HANDLING & RETRY VALIDATION
// =============================================================================

async function validateErrorHandling(): Promise<void> {
  console.log("\n=== ERROR HANDLING & RETRY VALIDATION ===\n");

  // Test invalid input handling
  const transcriptionQueue = new Queue<TranscriptionJobData, TranscriptionJobResult>(
    QUEUE_NAMES.TRANSCRIPTION,
    { connection: createRedisConnection() }
  );

  const queueEvents = new QueueEvents(QUEUE_NAMES.TRANSCRIPTION, {
    connection: createRedisConnection(),
  });

  try {
    const invalidJobData: TranscriptionJobData = {
      phoneRecordId: TEST_DATA.testInvalidPhoneRecordId,
      recordingUrl: "https://invalid-url-404.com/nonexistent.wav",
      language: "en",
    };

    const job = await transcriptionQueue.add("test-error", invalidJobData, {
      removeOnComplete: false,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    });

    try {
      await job.waitUntilFinished(queueEvents, 20000);

      addResult(
        "Error Handling: Invalid Input",
        false,
        "Job should have failed but succeeded"
      );
    } catch (error) {
      addResult(
        "Error Handling: Invalid Input",
        true,
        "Worker correctly failed for invalid input"
      );
    }

    // Check retry attempts
    const jobState = await job.getState();
    addResult(
      "Error Handling: Retry Logic",
      jobState === "failed",
      `Job state: ${jobState} (should be 'failed' after retries)`
    );
  } finally {
    await transcriptionQueue.close();
    await queueEvents.close();
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║   BOLLALABZ PHASE 3 WORKER FEATURE VALIDATION SUITE          ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");

  console.log("⚠️  PREREQUISITE: Ensure workers are running (pnpm dev)");
  console.log("⚠️  PREREQUISITE: Update TEST_PHONE_NUMBER env var with real test number\n");

  try {
    await validateTranscriptionWorker();
    await validateEmbeddingWorker();
    await validateNotificationWorker();
    await validateErrorHandling();

    // Generate summary report
    console.log("\n╔═══════════════════════════════════════════════════════════════╗");
    console.log("║                    VALIDATION SUMMARY                         ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝\n");

    const totalTests = results.length;
    const passedTests = results.filter((r) => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

    // Critical failures
    const criticalFailures = results.filter(
      (r) =>
        !r.passed &&
        (r.test.includes("Real Deepgram") ||
          r.test.includes("Real Vector") ||
          r.test.includes("Real Twilio"))
    );

    if (criticalFailures.length > 0) {
      console.log("❌ CRITICAL FAILURES (Blocking Issues):\n");
      criticalFailures.forEach((r) => {
        console.log(`  - ${r.test}: ${r.details}`);
        if (r.error) console.log(`    Error: ${r.error}`);
      });
      console.log("");
    }

    // Performance summary
    const avgLatency = {
      transcription: results.find((r) => r.test.includes("Transcription Worker: Real"))?.latency,
      embedding: results.find((r) => r.test.includes("Embedding Worker: Real"))?.latency,
      sms: results.find((r) => r.test.includes("Notification Worker: Real"))?.latency,
    };

    console.log("⚡ PERFORMANCE METRICS:\n");
    if (avgLatency.transcription) {
      console.log(
        `  Transcription: ${avgLatency.transcription}ms (target: ${LATENCY_TARGETS.transcription}ms)`
      );
    }
    if (avgLatency.embedding) {
      console.log(
        `  Embedding: ${avgLatency.embedding}ms (target: ${LATENCY_TARGETS.embedding}ms)`
      );
    }
    if (avgLatency.sms) {
      console.log(`  SMS: ${avgLatency.sms}ms (target: ${LATENCY_TARGETS.sms}ms)`);
    }
    console.log("");

    // Final verdict
    const productionReady = failedTests === 0;
    if (productionReady) {
      console.log("✅ VERDICT: APPROVE - All features production-ready\n");
      process.exit(0);
    } else if (criticalFailures.length > 0) {
      console.log("❌ VERDICT: REQUEST ENHANCEMENTS - Critical blockers present\n");
      process.exit(1);
    } else {
      console.log("⚠️  VERDICT: APPROVE WITH RECOMMENDATIONS - Minor issues detected\n");
      process.exit(0);
    }
  } catch (error) {
    console.error("\n❌ FATAL ERROR during validation:");
    console.error(error);
    process.exit(1);
  }
}

main();
