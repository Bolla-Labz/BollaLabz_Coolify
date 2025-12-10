// 08 December 2025 15 10 00

/**
 * Deepgram Transcription Service
 * Production-grade audio transcription with comprehensive feature support
 *
 * Features:
 * - URL-based transcription
 * - Buffer/stream transcription
 * - Real-time streaming
 * - Speaker diarization
 * - Language detection
 * - Advanced formatting options
 *
 * @module services/deepgram
 */

import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import type {
  PrerecordedSchema,
  LiveSchema,
  DeepgramResponse,
  LiveTranscriptionEvent,
} from "@deepgram/sdk";
import { Readable } from "stream";

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface DeepgramConfig {
  apiKey: string;
  timeout?: number; // Request timeout in milliseconds
}

export interface TranscriptionOptions {
  // Core features
  model?: "nova-2" | "nova" | "enhanced" | "base" | "whisper";
  language?: string; // BCP-47 language tag (e.g., 'en-US', 'es', 'fr')
  punctuate?: boolean;
  paragraphs?: boolean;

  // Speaker diarization
  diarize?: boolean;
  diarizeVersion?: string;

  // Formatting
  smart_format?: boolean; // Smart formatting (replaces punctuate + capitalization)
  utterances?: boolean; // Segment by utterances
  utt_split?: number; // Utterance split threshold (ms)

  // Language detection
  detect_language?: boolean;

  // Advanced features
  profanity_filter?: boolean;
  redact?: string[]; // PCI, SSN, etc.
  keywords?: string[]; // Boost specific keywords
  search?: string[]; // Search for specific terms
  replace?: string[]; // Find and replace
  filler_words?: boolean;
  multichannel?: boolean;
  numerals?: boolean; // Convert numbers to numerals

  // Performance
  tier?: "nova" | "enhanced" | "base";
  version?: string; // API version
}

export interface StreamingOptions extends Omit<TranscriptionOptions, "paragraphs"> {
  // Real-time specific options
  interim_results?: boolean; // Send interim results
  endpointing?: number | boolean; // VAD endpointing (ms or boolean)
  vad_events?: boolean; // Voice activity detection events
  encoding?: "linear16" | "flac" | "mulaw" | "alaw" | "opus" | "speex";
  sample_rate?: number;
  channels?: number;
}

export interface TranscriptionResult {
  success: true;
  transcript: string;
  confidence: number;
  duration: number; // Audio duration in seconds
  words?: WordInfo[];
  paragraphs?: ParagraphInfo[];
  utterances?: UtteranceInfo[];
  speakers?: SpeakerInfo[];
  detectedLanguage?: string;
  metadata: TranscriptionMetadata;
  raw: any; // DeepgramResponse type varies based on request type
}

export interface TranscriptionError {
  success: false;
  error: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
  correlationId: string;
}

export interface WordInfo {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
  punctuated_word?: string;
}

export interface ParagraphInfo {
  sentences: SentenceInfo[];
  start: number;
  end: number;
  num_words: number;
}

export interface SentenceInfo {
  text: string;
  start: number;
  end: number;
}

export interface UtteranceInfo {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker: number;
  words: WordInfo[];
}

export interface SpeakerInfo {
  speaker: number;
  totalSpeakTime: number; // In seconds
  utteranceCount: number;
}

export interface TranscriptionMetadata {
  requestId: string;
  correlationId: string;
  created: string;
  duration: number;
  channels: number;
  modelInfo: {
    name: string;
    version: string;
    tier: string;
  };
}

export interface StreamTranscriptCallback {
  (transcript: string, isFinal: boolean, metadata?: StreamMetadata): void;
}

export interface StreamMetadata {
  duration: number;
  confidence: number;
  words?: WordInfo[];
  speaker?: number;
  speechFinal?: boolean;
}

export interface StreamErrorCallback {
  (error: Error): void;
}

export interface StreamCloseCallback {
  (): void;
}

export interface LiveConnection {
  send: (data: Buffer | Readable) => void;
  close: () => void;
  getReadyState: () => number;
}

// ---------------------------------------------------------------------------
// Service Class
// ---------------------------------------------------------------------------

export class DeepgramService {
  private client: ReturnType<typeof createClient>;
  private apiKey: string;
  private timeout: number;

  constructor(config?: DeepgramConfig) {
    this.apiKey = config?.apiKey || process.env.DEEPGRAM_API_KEY || "";
    this.timeout = config?.timeout || 60000; // 60 second default timeout

    if (!this.apiKey) {
      throw new Error(
        "Deepgram API key is required. Set DEEPGRAM_API_KEY environment variable or pass in config."
      );
    }

    this.client = createClient(this.apiKey);
  }

  // ---------------------------------------------------------------------------
  // URL-based Transcription
  // ---------------------------------------------------------------------------

  /**
   * Transcribe audio from a URL
   *
   * @param url - Public URL to audio file
   * @param options - Transcription options
   * @returns Transcription result or error
   */
  async transcribeFromUrl(
    url: string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult | TranscriptionError> {
    const correlationId = crypto.randomUUID();
    const startTime = performance.now();

    try {
      // Validate URL
      if (!this.isValidUrl(url)) {
        return {
          success: false,
          error: "Invalid URL provided",
          code: "INVALID_URL",
          statusCode: 400,
          correlationId,
        };
      }

      // Build request options
      const requestOptions = this.buildPrerecordedOptions(options);

      // Execute transcription with timeout and proper cleanup
      let timeoutId: NodeJS.Timeout | null = null;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Request timeout")), this.timeout);
      });

      const transcriptionPromise = this.client.listen.prerecorded.transcribeUrl(
        { url },
        requestOptions as PrerecordedSchema
      );

      try {
        const response = await Promise.race([
          transcriptionPromise,
          timeoutPromise,
        ]);

        // Clear timeout on success
        if (timeoutId) clearTimeout(timeoutId);

        // Process and format response
        const result = this.processTranscriptionResponse(
          response,
          correlationId,
          performance.now() - startTime
        );

        return result;
      } catch (error) {
        // Clear timeout on error
        if (timeoutId) clearTimeout(timeoutId);
        throw error;
      }

    } catch (error) {
      return this.handleTranscriptionError(error, correlationId);
    }
  }

  // ---------------------------------------------------------------------------
  // Buffer/Stream Transcription
  // ---------------------------------------------------------------------------

  /**
   * Transcribe audio from buffer or readable stream
   *
   * @param source - Audio buffer or readable stream
   * @param mimeType - MIME type of audio (e.g., 'audio/wav', 'audio/mp3')
   * @param options - Transcription options
   * @returns Transcription result or error
   */
  async transcribeFromBuffer(
    source: Buffer | Readable,
    mimeType: string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult | TranscriptionError> {
    const correlationId = crypto.randomUUID();
    const startTime = performance.now();

    try {
      // Validate source
      if (!source) {
        return {
          success: false,
          error: "Audio source is required",
          code: "INVALID_SOURCE",
          statusCode: 400,
          correlationId,
        };
      }

      // Build request options
      const requestOptions = this.buildPrerecordedOptions(options);

      // Convert buffer to appropriate format
      const audioSource = Buffer.isBuffer(source) ? source : await this.streamToBuffer(source);

      // Execute transcription with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), this.timeout);
      });

      const transcriptionPromise = this.client.listen.prerecorded.transcribeFile(
        audioSource,
        requestOptions as PrerecordedSchema
      );

      const response = await Promise.race([
        transcriptionPromise,
        timeoutPromise,
      ]);

      // Process and format response
      const result = this.processTranscriptionResponse(
        response,
        correlationId,
        performance.now() - startTime
      );

      return result;

    } catch (error) {
      return this.handleTranscriptionError(error, correlationId);
    }
  }

  // ---------------------------------------------------------------------------
  // Real-time Streaming Transcription
  // ---------------------------------------------------------------------------

  /**
   * Create a live streaming transcription connection
   *
   * @param options - Streaming options
   * @param onTranscript - Callback for transcript events
   * @param onError - Callback for error events
   * @param onClose - Callback for connection close
   * @returns Live connection object
   */
  async createLiveStream(
    options: StreamingOptions,
    onTranscript: StreamTranscriptCallback,
    onError?: StreamErrorCallback,
    onClose?: StreamCloseCallback
  ): Promise<LiveConnection> {
    const streamOptions = this.buildLiveOptions(options);

    const connection = this.client.listen.live(streamOptions as LiveSchema);

    // Handle transcript events
    connection.on(LiveTranscriptionEvents.Transcript, (data: LiveTranscriptionEvent) => {
      try {
        const transcript = data.channel?.alternatives?.[0]?.transcript || "";
        const isFinal = data.is_final ?? false;

        if (transcript.length > 0) {
          const metadata: StreamMetadata = {
            duration: data.duration || 0,
            confidence: data.channel?.alternatives?.[0]?.confidence || 0,
            words: data.channel?.alternatives?.[0]?.words as WordInfo[] | undefined,
            speaker: data.channel?.alternatives?.[0]?.words?.[0]?.speaker,
            speechFinal: data.speech_final,
          };

          onTranscript(transcript, isFinal, metadata);
        }
      } catch (error) {
        if (onError) {
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    });

    // Handle error events
    connection.on(LiveTranscriptionEvents.Error, (error: Error) => {
      if (onError) {
        onError(error);
      }
    });

    // Handle close events
    connection.on(LiveTranscriptionEvents.Close, () => {
      if (onClose) {
        onClose();
      }
    });

    // Wait for connection to be ready
    await new Promise<void>((resolve, reject) => {
      connection.on(LiveTranscriptionEvents.Open, () => resolve());
      connection.on(LiveTranscriptionEvents.Error, reject);

      // Timeout after 10 seconds
      setTimeout(() => reject(new Error("Connection timeout")), 10000);
    });

    return {
      send: (data: Buffer | Readable) => {
        if (Buffer.isBuffer(data)) {
          // Convert Buffer to ArrayBuffer for WebSocket compatibility
          const arrayBuffer = data.buffer.slice(
            data.byteOffset,
            data.byteOffset + data.byteLength
          );
          connection.send(arrayBuffer);
        } else {
          // Handle stream
          data.on("data", (chunk: Buffer) => {
            const arrayBuffer = chunk.buffer.slice(
              chunk.byteOffset,
              chunk.byteOffset + chunk.byteLength
            );
            connection.send(arrayBuffer);
          });
          data.on("end", () => {
            connection.finish();
          });
        }
      },
      close: () => {
        connection.finish();
      },
      getReadyState: () => connection.getReadyState(),
    };
  }

  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------

  private buildPrerecordedOptions(options: TranscriptionOptions): Partial<PrerecordedSchema> {
    const requestOptions: Partial<PrerecordedSchema> = {
      model: options.model || "nova-2",
      smart_format: options.smart_format ?? true,
      punctuate: options.punctuate ?? true,
      paragraphs: options.paragraphs ?? false,
      diarize: options.diarize ?? false,
      utterances: options.utterances ?? false,
      detect_language: options.detect_language ?? false,
      filler_words: options.filler_words ?? false,
      numerals: options.numerals ?? true,
    };

    // Add optional parameters
    if (options.language) requestOptions.language = options.language;
    if (options.diarizeVersion) requestOptions.diarize_version = options.diarizeVersion;
    if (options.utt_split) requestOptions.utt_split = options.utt_split;
    if (options.profanity_filter) requestOptions.profanity_filter = options.profanity_filter;
    if (options.redact) requestOptions.redact = options.redact;
    if (options.keywords) requestOptions.keywords = options.keywords;
    if (options.search) requestOptions.search = options.search;
    if (options.replace) requestOptions.replace = options.replace;
    if (options.multichannel) requestOptions.multichannel = options.multichannel;
    if (options.tier) requestOptions.tier = options.tier;
    if (options.version) requestOptions.version = options.version;

    return requestOptions;
  }

  private buildLiveOptions(options: StreamingOptions): Partial<LiveSchema> {
    const streamOptions: Partial<LiveSchema> = {
      model: options.model || "nova-2",
      smart_format: options.smart_format ?? true,
      punctuate: options.punctuate ?? true,
      diarize: options.diarize ?? false,
      interim_results: options.interim_results ?? true,
      vad_events: options.vad_events ?? true,
      filler_words: options.filler_words ?? false,
      numerals: options.numerals ?? true,
    };

    // Add optional parameters
    if (options.language) streamOptions.language = options.language;
    if (options.encoding) streamOptions.encoding = options.encoding;
    if (options.sample_rate) streamOptions.sample_rate = options.sample_rate;
    if (options.channels) streamOptions.channels = options.channels;
    if (options.endpointing !== undefined) {
      // Handle endpointing: number or false (true is not valid)
      streamOptions.endpointing = options.endpointing === true ? 300 : options.endpointing;
    }
    if (options.utterances) streamOptions.utterances = options.utterances;
    if (options.utt_split) streamOptions.utt_split = options.utt_split;
    if (options.profanity_filter) streamOptions.profanity_filter = options.profanity_filter;
    if (options.redact) streamOptions.redact = options.redact;
    if (options.keywords) streamOptions.keywords = options.keywords;
    if (options.search) streamOptions.search = options.search;
    if (options.replace) streamOptions.replace = options.replace;
    if (options.multichannel) streamOptions.multichannel = options.multichannel;

    return streamOptions;
  }

  private processTranscriptionResponse(
    response: any,
    correlationId: string,
    processingTime: number
  ): TranscriptionResult | TranscriptionError {
    try {
      // Check for API error first
      if (response.error) {
        console.error('[Deepgram] API error:', response.error);
        return {
          success: false,
          error: typeof response.error === 'string' ? response.error : JSON.stringify(response.error),
          code: "API_ERROR",
          statusCode: 400,
          correlationId,
        };
      }

      // Deepgram SDK v3 wraps response in 'result' property
      const data = response.result || response;
      const result = data.results?.channels?.[0];

      if (!result || !result.alternatives || result.alternatives.length === 0) {
        // Log raw response for debugging
        console.error('[Deepgram] No results. Raw response:', JSON.stringify(response).substring(0, 500));
        return {
          success: false,
          error: "No transcription results returned",
          code: "NO_RESULTS",
          statusCode: 500,
          correlationId,
        };
      }

      const alternative = result.alternatives[0];
      const transcript = alternative.transcript || "";
      const confidence = alternative.confidence || 0;

      // Extract word-level information
      const words: WordInfo[] | undefined = alternative.words?.map((word: any) => ({
        word: word.word || "",
        start: word.start || 0,
        end: word.end || 0,
        confidence: word.confidence || 0,
        speaker: word.speaker,
        punctuated_word: word.punctuated_word,
      }));

      // Extract paragraph information
      const paragraphs: ParagraphInfo[] | undefined = alternative.paragraphs?.paragraphs?.map((para: any) => ({
        sentences: para.sentences?.map((sent: any) => ({
          text: sent.text || "",
          start: sent.start || 0,
          end: sent.end || 0,
        })) || [],
        start: para.start || 0,
        end: para.end || 0,
        num_words: para.num_words || 0,
      }));

      // Extract utterance information
      const utterances: UtteranceInfo[] | undefined = response.results?.utterances?.map((utt: any) => ({
        text: utt.transcript || "",
        start: utt.start || 0,
        end: utt.end || 0,
        confidence: utt.confidence || 0,
        speaker: utt.speaker || 0,
        words: utt.words?.map((word: any) => ({
          word: word.word || "",
          start: word.start || 0,
          end: word.end || 0,
          confidence: word.confidence || 0,
          speaker: word.speaker,
          punctuated_word: word.punctuated_word,
        })) || [],
      }));

      // Calculate speaker statistics
      const speakers = this.calculateSpeakerStats(utterances);

      // Extract detected language
      const detectedLanguage = response.results?.channels?.[0]?.detected_language;

      // Build metadata
      const metadata: TranscriptionMetadata = {
        requestId: response.metadata?.request_id || "",
        correlationId,
        created: response.metadata?.created || new Date().toISOString(),
        duration: response.metadata?.duration || 0,
        channels: response.metadata?.channels || 1,
        modelInfo: {
          name: response.metadata?.model_info?.name || "unknown",
          version: response.metadata?.model_info?.version || "unknown",
          tier: response.metadata?.model_info?.tier || "unknown",
        },
      };

      return {
        success: true,
        transcript,
        confidence,
        duration: metadata.duration,
        words,
        paragraphs,
        utterances,
        speakers,
        detectedLanguage,
        metadata,
        raw: response,
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to process transcription response: ${error instanceof Error ? error.message : String(error)}`,
        code: "PROCESSING_ERROR",
        statusCode: 500,
        correlationId,
      };
    }
  }

  private calculateSpeakerStats(utterances?: UtteranceInfo[]): SpeakerInfo[] | undefined {
    if (!utterances || utterances.length === 0) return undefined;

    const speakerMap = new Map<number, { totalTime: number; count: number }>();

    for (const utterance of utterances) {
      const existing = speakerMap.get(utterance.speaker) || { totalTime: 0, count: 0 };
      existing.totalTime += utterance.end - utterance.start;
      existing.count += 1;
      speakerMap.set(utterance.speaker, existing);
    }

    return Array.from(speakerMap.entries()).map(([speaker, stats]) => ({
      speaker,
      totalSpeakTime: stats.totalTime,
      utteranceCount: stats.count,
    }));
  }

  private handleTranscriptionError(
    error: unknown,
    correlationId: string
  ): TranscriptionError {
    if (error instanceof Error) {
      // Parse Deepgram-specific errors
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes("unauthorized") || errorMessage.includes("api key")) {
        return {
          success: false,
          error: "Invalid API key or unauthorized access",
          code: "UNAUTHORIZED",
          statusCode: 401,
          correlationId,
        };
      }

      if (errorMessage.includes("timeout")) {
        return {
          success: false,
          error: "Request timeout exceeded",
          code: "TIMEOUT",
          statusCode: 408,
          correlationId,
        };
      }

      if (errorMessage.includes("rate limit")) {
        return {
          success: false,
          error: "Rate limit exceeded",
          code: "RATE_LIMIT",
          statusCode: 429,
          correlationId,
        };
      }

      return {
        success: false,
        error: error.message,
        code: "UNKNOWN_ERROR",
        details: error.stack,
        correlationId,
      };
    }

    return {
      success: false,
      error: "An unknown error occurred",
      code: "UNKNOWN_ERROR",
      details: error,
      correlationId,
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }
}

// ---------------------------------------------------------------------------
// Singleton Instance
// ---------------------------------------------------------------------------

let deepgramInstance: DeepgramService | null = null;

/**
 * Get or create singleton Deepgram service instance
 *
 * @param config - Optional configuration (used only on first call)
 * @returns Deepgram service instance
 */
export function getDeepgramService(config?: DeepgramConfig): DeepgramService {
  if (!deepgramInstance) {
    deepgramInstance = new DeepgramService(config);
  }
  return deepgramInstance;
}

// ---------------------------------------------------------------------------
// Convenience Functions
// ---------------------------------------------------------------------------

/**
 * Transcribe audio from URL (convenience function)
 */
export async function transcribeUrl(
  url: string,
  options?: TranscriptionOptions
): Promise<TranscriptionResult | TranscriptionError> {
  const service = getDeepgramService();
  return service.transcribeFromUrl(url, options);
}

/**
 * Transcribe audio from buffer (convenience function)
 */
export async function transcribeBuffer(
  buffer: Buffer,
  mimeType: string,
  options?: TranscriptionOptions
): Promise<TranscriptionResult | TranscriptionError> {
  const service = getDeepgramService();
  return service.transcribeFromBuffer(buffer, mimeType, options);
}

/**
 * Create live streaming connection (convenience function)
 */
export async function createLiveTranscription(
  options: StreamingOptions,
  onTranscript: StreamTranscriptCallback,
  onError?: StreamErrorCallback,
  onClose?: StreamCloseCallback
): Promise<LiveConnection> {
  const service = getDeepgramService();
  return service.createLiveStream(options, onTranscript, onError, onClose);
}
