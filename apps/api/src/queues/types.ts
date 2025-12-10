/**
 * Queue Job Type Definitions
 * Defines the payload structures for all job queues
 */

/**
 * Transcription job payload
 * Processes phone call recordings into text transcripts
 */
export interface TranscriptionJobData {
  phoneRecordId: string;
  recordingUrl: string;
  language?: string;
  speakerDiarization?: boolean;
}

export interface TranscriptionJobResult {
  phoneRecordId: string;
  transcript: string;
  audioDurationSeconds: number; // Duration of the audio file in seconds
  processingTimeMs?: number; // Time taken to process the transcription in milliseconds
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  speakers?: Array<{
    speaker: string;
    segments: Array<{ start: number; end: number; text: string }>;
  }>;
}

/**
 * Embedding job payload
 * Generates vector embeddings for semantic search
 */
export interface EmbeddingJobData {
  type: "contact" | "phone_record" | "task";
  entityId: string;
  text: string;
  metadata?: Record<string, unknown>;
}

export interface EmbeddingJobResult {
  entityId: string;
  embedding: number[];
  model: string;
  dimensions: number;
}

/**
 * Notification job payload
 * Sends notifications via various channels
 */
export interface NotificationJobData {
  type: "email" | "sms" | "push" | "webhook";
  userId: string;
  template: string;
  data: Record<string, unknown>;
  priority?: "low" | "normal" | "high";
}

export interface NotificationJobResult {
  delivered: boolean;
  channel: string;
  messageId?: string;
  error?: string;
}

/**
 * Sync job payload
 * Synchronizes data with external services (CRM, calendar, etc.)
 */
export interface SyncJobData {
  provider: "google" | "outlook" | "salesforce" | "hubspot";
  userId: string;
  resourceType: "contacts" | "calendar" | "tasks";
  direction: "push" | "pull" | "bidirectional";
  lastSyncedAt?: string;
}

export interface SyncJobResult {
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsDeleted: number;
  errors: Array<{ itemId: string; error: string }>;
  nextSyncToken?: string;
}

/**
 * Union types for type-safe job handling
 */
export type JobData =
  | TranscriptionJobData
  | EmbeddingJobData
  | NotificationJobData
  | SyncJobData;

export type JobResult =
  | TranscriptionJobResult
  | EmbeddingJobResult
  | NotificationJobResult
  | SyncJobResult;
