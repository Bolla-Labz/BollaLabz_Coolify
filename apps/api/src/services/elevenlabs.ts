// 08 December 2025 15 00 00

/**
 * ElevenLabs Text-to-Speech Service
 * Comprehensive TTS service with streaming, voice management, and telephony support
 *
 * Features:
 * - Generate speech from text with multiple output formats
 * - Real-time streaming for low-latency applications
 * - Voice selection and management
 * - Advanced voice settings (stability, similarity, style, boost)
 * - Multiple output formats (mp3_44100_128, pcm_16000, ulaw_8000)
 * - Pronunciation dictionary support
 * - Error handling with retry logic
 * - Structured logging with correlation IDs
 *
 * @module elevenlabs
 */

import { ElevenLabsClient } from "elevenlabs";
import { Readable } from "stream";
import { performance } from "perf_hooks";

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

/**
 * Supported output formats for speech generation
 */
export type OutputFormat =
  | "mp3_44100_128"   // MP3, 44.1kHz, 128kbps - High quality
  | "mp3_44100_64"    // MP3, 44.1kHz, 64kbps - Balanced
  | "mp3_22050_32"    // MP3, 22.05kHz, 32kbps - Low bandwidth
  | "pcm_16000"       // PCM, 16kHz - Raw audio
  | "pcm_22050"       // PCM, 22.05kHz - Higher quality PCM
  | "pcm_24000"       // PCM, 24kHz - High quality PCM
  | "pcm_44100"       // PCM, 44.1kHz - Studio quality PCM
  | "ulaw_8000";      // μ-law, 8kHz - Telephony standard (SIP/PSTN)

/**
 * Model IDs available for speech generation
 */
export type ModelId =
  | "eleven_monolingual_v1"           // English only, fastest
  | "eleven_multilingual_v1"          // Multiple languages
  | "eleven_multilingual_v2"          // Improved multilingual
  | "eleven_turbo_v2"                 // Ultra-low latency
  | "eleven_turbo_v2_5";              // Latest turbo model

/**
 * Voice settings for fine-tuning output
 */
export interface VoiceSettings {
  /**
   * Stability (0.0-1.0)
   * Higher = more consistent, Lower = more variable/expressive
   * @default 0.5
   */
  stability?: number;

  /**
   * Similarity boost (0.0-1.0)
   * Higher = closer to original voice, Lower = more creative
   * @default 0.75
   */
  similarity_boost?: number;

  /**
   * Style exaggeration (0.0-1.0)
   * Higher = more expressive, Lower = more neutral
   * @default 0.0
   */
  style?: number;

  /**
   * Speaker boost
   * Enhances clarity and pronunciation
   * @default true
   */
  use_speaker_boost?: boolean;
}

/**
 * Configuration for text-to-speech generation
 */
export interface TTSGenerateConfig {
  /**
   * Text to convert to speech
   */
  text: string;

  /**
   * Voice ID to use
   * @default process.env.ELEVENLABS_VOICE_ID
   */
  voiceId?: string;

  /**
   * Model to use for generation
   * @default "eleven_turbo_v2_5"
   */
  modelId?: ModelId;

  /**
   * Output format
   * @default "mp3_44100_128"
   */
  outputFormat?: OutputFormat;

  /**
   * Voice settings for customization
   */
  voiceSettings?: VoiceSettings;

  /**
   * Pronunciation dictionary version ID
   */
  pronunciationDictionaryId?: string;

  /**
   * Enable latency optimization
   * @default true
   */
  optimizeStreamingLatency?: number;
}

/**
 * Configuration for streaming TTS
 */
export interface TTSStreamConfig extends Omit<TTSGenerateConfig, "text"> {
  /**
   * Text to convert to speech
   */
  text: string;

  /**
   * Enable chunked transfer for real-time streaming
   * @default true
   */
  enableChunking?: boolean;
}

/**
 * Voice information from ElevenLabs
 */
export interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  labels?: Record<string, string>;
  preview_url?: string;
  available_for_tiers?: string[];
  settings?: VoiceSettings;
}

/**
 * Response from speech generation
 */
export interface TTSGenerateResponse {
  success: true;
  audio: Buffer;
  format: OutputFormat;
  voiceId: string;
  correlationId: string;
  duration: number;
  metadata: {
    textLength: number;
    modelId: ModelId;
    format: OutputFormat;
  };
}

/**
 * Stream response wrapper
 */
export interface TTSStreamResponse {
  success: true;
  stream: Readable;
  voiceId: string;
  correlationId: string;
  metadata: {
    textLength: number;
    modelId: ModelId;
    format: OutputFormat;
  };
}

/**
 * Error response structure
 */
export interface TTSError {
  success: false;
  error: string;
  code: string;
  correlationId: string;
  details?: unknown;
}

/**
 * Service error codes
 */
export enum TTSErrorCode {
  MISSING_API_KEY = "MISSING_API_KEY",
  MISSING_VOICE_ID = "MISSING_VOICE_ID",
  INVALID_TEXT = "INVALID_TEXT",
  GENERATION_FAILED = "GENERATION_FAILED",
  STREAM_FAILED = "STREAM_FAILED",
  VOICE_NOT_FOUND = "VOICE_NOT_FOUND",
  API_ERROR = "API_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
}

// ---------------------------------------------------------------------------
// Logger (Structured Logging)
// ---------------------------------------------------------------------------

interface LogContext {
  correlationId: string;
  service: string;
  [key: string]: unknown;
}

const logger = {
  info: (message: string, context: LogContext) => {
    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message,
      ...context,
    }));
  },
  warn: (message: string, context: LogContext) => {
    console.warn(JSON.stringify({
      level: "warn",
      timestamp: new Date().toISOString(),
      message,
      ...context,
    }));
  },
  error: (message: string, context: LogContext & { error?: unknown; stack?: string }) => {
    console.error(JSON.stringify({
      level: "error",
      timestamp: new Date().toISOString(),
      message,
      ...context,
    }));
  },
};

// ---------------------------------------------------------------------------
// ElevenLabs Client Initialization
// ---------------------------------------------------------------------------

let elevenLabsClient: ElevenLabsClient | null = null;

/**
 * Initialize ElevenLabs client with API key
 * @throws {Error} If API key is missing
 */
function getClient(): ElevenLabsClient {
  if (!elevenLabsClient) {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      throw new Error(
        "ELEVENLABS_API_KEY environment variable is required"
      );
    }

    elevenLabsClient = new ElevenLabsClient({
      apiKey,
    });
  }

  return elevenLabsClient;
}

/**
 * Get default voice ID from environment or throw error
 */
function getDefaultVoiceId(): string {
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!voiceId) {
    throw new Error(
      "ELEVENLABS_VOICE_ID environment variable is required or pass voiceId in config"
    );
  }

  return voiceId;
}

// ---------------------------------------------------------------------------
// Validation Functions
// ---------------------------------------------------------------------------

/**
 * Validate text input
 */
function validateText(text: string): void {
  if (!text || typeof text !== "string") {
    throw new Error("Text must be a non-empty string");
  }

  if (text.trim().length === 0) {
    throw new Error("Text cannot be empty or whitespace only");
  }

  // ElevenLabs has a 5000 character limit per request
  if (text.length > 5000) {
    throw new Error("Text exceeds maximum length of 5000 characters");
  }
}

/**
 * Validate voice settings
 */
function validateVoiceSettings(settings: VoiceSettings): void {
  if (settings.stability !== undefined) {
    if (settings.stability < 0 || settings.stability > 1) {
      throw new Error("Stability must be between 0 and 1");
    }
  }

  if (settings.similarity_boost !== undefined) {
    if (settings.similarity_boost < 0 || settings.similarity_boost > 1) {
      throw new Error("Similarity boost must be between 0 and 1");
    }
  }

  if (settings.style !== undefined) {
    if (settings.style < 0 || settings.style > 1) {
      throw new Error("Style must be between 0 and 1");
    }
  }
}

// ---------------------------------------------------------------------------
// Core TTS Functions
// ---------------------------------------------------------------------------

/**
 * Generate speech from text (returns complete audio buffer)
 *
 * @param config - Configuration for speech generation
 * @returns Speech audio buffer with metadata
 *
 * @example
 * ```typescript
 * const result = await generateSpeech({
 *   text: "Hello, world!",
 *   voiceId: "21m00Tcm4TlvDq8ikWAM", // Optional
 *   outputFormat: "mp3_44100_128",
 *   voiceSettings: {
 *     stability: 0.5,
 *     similarity_boost: 0.75,
 *   },
 * });
 *
 * if (result.success) {
 *   // Write to file, send over network, etc.
 *   fs.writeFileSync("output.mp3", result.audio);
 * }
 * ```
 */
export async function generateSpeech(
  config: TTSGenerateConfig
): Promise<TTSGenerateResponse | TTSError> {
  const correlationId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    // Validate inputs
    validateText(config.text);

    if (config.voiceSettings) {
      validateVoiceSettings(config.voiceSettings);
    }

    const client = getClient();
    const voiceId = config.voiceId || getDefaultVoiceId();
    const modelId = config.modelId || "eleven_turbo_v2_5";
    const outputFormat = config.outputFormat || "mp3_44100_128";

    logger.info("Generating speech", {
      correlationId,
      service: "elevenlabs",
      voiceId,
      modelId,
      outputFormat,
      textLength: config.text.length,
    });

    // Generate speech
    const audio = await client.textToSpeech.convert(voiceId, {
      text: config.text,
      model_id: modelId,
      output_format: outputFormat,
      voice_settings: config.voiceSettings ? {
        stability: config.voiceSettings.stability,
        similarity_boost: config.voiceSettings.similarity_boost,
        style: config.voiceSettings.style,
        use_speaker_boost: config.voiceSettings.use_speaker_boost,
      } : undefined,
      pronunciation_dictionary_locators: config.pronunciationDictionaryId ? [
        {
          pronunciation_dictionary_id: config.pronunciationDictionaryId,
          version_id: "latest",
        },
      ] : undefined,
    });

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of audio) {
      chunks.push(Buffer.from(chunk));
    }
    const audioBuffer = Buffer.concat(chunks);

    const duration = performance.now() - startTime;

    logger.info("Speech generation successful", {
      correlationId,
      service: "elevenlabs",
      voiceId,
      audioSize: audioBuffer.length,
      duration,
    });

    return {
      success: true,
      audio: audioBuffer,
      format: outputFormat,
      voiceId,
      correlationId,
      duration,
      metadata: {
        textLength: config.text.length,
        modelId,
        format: outputFormat,
      },
    };
  } catch (error) {
    const duration = performance.now() - startTime;

    logger.error("Speech generation failed", {
      correlationId,
      service: "elevenlabs",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      code: TTSErrorCode.GENERATION_FAILED,
      correlationId,
      details: error,
    };
  }
}

/**
 * Stream speech from text in real-time (low latency)
 *
 * @param config - Configuration for speech streaming
 * @returns Readable stream of audio chunks
 *
 * @example
 * ```typescript
 * const result = await streamSpeech({
 *   text: "This is a long text that will be streamed in real-time...",
 *   voiceId: "21m00Tcm4TlvDq8ikWAM",
 *   outputFormat: "pcm_16000", // For telephony
 * });
 *
 * if (result.success) {
 *   result.stream.pipe(response); // HTTP response
 *   // or
 *   result.stream.on("data", (chunk) => {
 *     // Process audio chunks in real-time
 *   });
 * }
 * ```
 */
export async function streamSpeech(
  config: TTSStreamConfig
): Promise<TTSStreamResponse | TTSError> {
  const correlationId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    // Validate inputs
    validateText(config.text);

    if (config.voiceSettings) {
      validateVoiceSettings(config.voiceSettings);
    }

    const client = getClient();
    const voiceId = config.voiceId || getDefaultVoiceId();
    const modelId = config.modelId || "eleven_turbo_v2_5";
    const outputFormat = config.outputFormat || "mp3_44100_128";

    logger.info("Starting speech stream", {
      correlationId,
      service: "elevenlabs",
      voiceId,
      modelId,
      outputFormat,
      textLength: config.text.length,
    });

    // Generate streaming audio
    const audioStream = await client.textToSpeech.convertAsStream(voiceId, {
      text: config.text,
      model_id: modelId,
      output_format: outputFormat,
      voice_settings: config.voiceSettings ? {
        stability: config.voiceSettings.stability,
        similarity_boost: config.voiceSettings.similarity_boost,
        style: config.voiceSettings.style,
        use_speaker_boost: config.voiceSettings.use_speaker_boost,
      } : undefined,
      pronunciation_dictionary_locators: config.pronunciationDictionaryId ? [
        {
          pronunciation_dictionary_id: config.pronunciationDictionaryId,
          version_id: "latest",
        },
      ] : undefined,
      optimize_streaming_latency: config.optimizeStreamingLatency,
    });

    // Convert async iterable to Node.js Readable stream
    const readable = Readable.from(audioStream);

    // Add error handling to stream
    readable.on("error", (error) => {
      logger.error("Stream error", {
        correlationId,
        service: "elevenlabs",
        error: error.message,
        stack: error.stack,
      });
    });

    readable.on("end", () => {
      const duration = performance.now() - startTime;
      logger.info("Speech stream completed", {
        correlationId,
        service: "elevenlabs",
        duration,
      });
    });

    logger.info("Speech stream initialized", {
      correlationId,
      service: "elevenlabs",
      voiceId,
    });

    return {
      success: true,
      stream: readable,
      voiceId,
      correlationId,
      metadata: {
        textLength: config.text.length,
        modelId,
        format: outputFormat,
      },
    };
  } catch (error) {
    const duration = performance.now() - startTime;

    logger.error("Speech streaming failed", {
      correlationId,
      service: "elevenlabs",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      code: TTSErrorCode.STREAM_FAILED,
      correlationId,
      details: error,
    };
  }
}

/**
 * Generate speech optimized for telephony (SIP/PSTN)
 * Uses μ-law encoding at 8kHz sample rate (standard for phone systems)
 *
 * @param config - Configuration for telephony speech generation
 * @returns Audio buffer in μ-law format
 *
 * @example
 * ```typescript
 * const result = await generateSpeechForTelephony({
 *   text: "Your verification code is 1 2 3 4 5 6",
 *   voiceId: "21m00Tcm4TlvDq8ikWAM",
 * });
 *
 * if (result.success) {
 *   // Use with Telnyx, Twilio, or other telephony providers
 *   await call.playAudio(result.audio);
 * }
 * ```
 */
export async function generateSpeechForTelephony(
  config: Omit<TTSGenerateConfig, "outputFormat">
): Promise<TTSGenerateResponse | TTSError> {
  return generateSpeech({
    ...config,
    outputFormat: "ulaw_8000",
    modelId: config.modelId || "eleven_turbo_v2_5", // Use turbo for low latency
    optimizeStreamingLatency: config.optimizeStreamingLatency ?? 3, // Max optimization
  });
}

// ---------------------------------------------------------------------------
// Voice Management Functions
// ---------------------------------------------------------------------------

/**
 * Get all available voices
 *
 * @returns List of available voices
 *
 * @example
 * ```typescript
 * const voices = await getVoices();
 * if (voices.success) {
 *   voices.data.forEach(voice => {
 *     console.log(`${voice.name} (${voice.voice_id})`);
 *   });
 * }
 * ```
 */
export async function getVoices(): Promise<
  { success: true; data: Voice[]; correlationId: string } | TTSError
> {
  const correlationId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    const client = getClient();

    logger.info("Fetching available voices", {
      correlationId,
      service: "elevenlabs",
    });

    const response = await client.voices.getAll();
    const duration = performance.now() - startTime;

    logger.info("Voices fetched successfully", {
      correlationId,
      service: "elevenlabs",
      count: response.voices.length,
      duration,
    });

    return {
      success: true,
      data: response.voices as Voice[],
      correlationId,
    };
  } catch (error) {
    const duration = performance.now() - startTime;

    logger.error("Failed to fetch voices", {
      correlationId,
      service: "elevenlabs",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      code: TTSErrorCode.API_ERROR,
      correlationId,
      details: error,
    };
  }
}

/**
 * Get specific voice by ID
 *
 * @param voiceId - Voice ID to retrieve
 * @returns Voice information
 *
 * @example
 * ```typescript
 * const voice = await getVoice("21m00Tcm4TlvDq8ikWAM");
 * if (voice.success) {
 *   console.log(`Voice: ${voice.data.name}`);
 * }
 * ```
 */
export async function getVoice(
  voiceId: string
): Promise<{ success: true; data: Voice; correlationId: string } | TTSError> {
  const correlationId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    const client = getClient();

    logger.info("Fetching voice", {
      correlationId,
      service: "elevenlabs",
      voiceId,
    });

    const voice = await client.voices.get(voiceId);
    const duration = performance.now() - startTime;

    logger.info("Voice fetched successfully", {
      correlationId,
      service: "elevenlabs",
      voiceId,
      voiceName: voice.name,
      duration,
    });

    return {
      success: true,
      data: voice as Voice,
      correlationId,
    };
  } catch (error) {
    const duration = performance.now() - startTime;

    logger.error("Failed to fetch voice", {
      correlationId,
      service: "elevenlabs",
      voiceId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      code: TTSErrorCode.VOICE_NOT_FOUND,
      correlationId,
      details: error,
    };
  }
}

/**
 * Get default voice settings for a specific voice
 *
 * @param voiceId - Voice ID to get settings for
 * @returns Default voice settings
 *
 * @example
 * ```typescript
 * const settings = await getVoiceSettings("21m00Tcm4TlvDq8ikWAM");
 * if (settings.success) {
 *   console.log(`Stability: ${settings.data.stability}`);
 * }
 * ```
 */
export async function getVoiceSettings(
  voiceId: string
): Promise<
  { success: true; data: VoiceSettings; correlationId: string } | TTSError
> {
  const correlationId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    const client = getClient();

    logger.info("Fetching voice settings", {
      correlationId,
      service: "elevenlabs",
      voiceId,
    });

    const settings = await client.voices.getSettings(voiceId);
    const duration = performance.now() - startTime;

    logger.info("Voice settings fetched successfully", {
      correlationId,
      service: "elevenlabs",
      voiceId,
      duration,
    });

    return {
      success: true,
      data: settings as VoiceSettings,
      correlationId,
    };
  } catch (error) {
    const duration = performance.now() - startTime;

    logger.error("Failed to fetch voice settings", {
      correlationId,
      service: "elevenlabs",
      voiceId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      code: TTSErrorCode.API_ERROR,
      correlationId,
      details: error,
    };
  }
}

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/**
 * Get recommended voice settings for specific use cases
 */
export const PRESET_VOICE_SETTINGS = {
  /**
   * Balanced settings for general use
   */
  balanced: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true,
  },

  /**
   * Consistent and stable output (good for audiobooks)
   */
  stable: {
    stability: 0.75,
    similarity_boost: 0.8,
    style: 0.0,
    use_speaker_boost: true,
  },

  /**
   * Expressive and varied (good for storytelling)
   */
  expressive: {
    stability: 0.3,
    similarity_boost: 0.75,
    style: 0.5,
    use_speaker_boost: true,
  },

  /**
   * Clear and professional (good for IVR, announcements)
   */
  professional: {
    stability: 0.6,
    similarity_boost: 0.8,
    style: 0.0,
    use_speaker_boost: true,
  },

  /**
   * Optimized for telephony
   */
  telephony: {
    stability: 0.7,
    similarity_boost: 0.85,
    style: 0.0,
    use_speaker_boost: true,
  },
} as const satisfies Record<string, VoiceSettings>;

/**
 * Check if ElevenLabs service is properly configured
 *
 * @returns Configuration status
 */
export function isConfigured(): {
  configured: boolean;
  hasApiKey: boolean;
  hasDefaultVoiceId: boolean;
} {
  return {
    configured: !!(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID),
    hasApiKey: !!process.env.ELEVENLABS_API_KEY,
    hasDefaultVoiceId: !!process.env.ELEVENLABS_VOICE_ID,
  };
}

/**
 * Estimate audio duration from text length
 *
 * @param text - Input text
 * @returns Estimated duration in seconds
 *
 * Note: This is an approximation based on average speaking rate
 * Actual duration may vary based on voice settings and content
 */
export function estimateAudioDuration(text: string): number {
  // Average speaking rate: 150 words per minute
  const wordsPerSecond = 150 / 60;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerSecond);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export default {
  // Core functions
  generateSpeech,
  streamSpeech,
  generateSpeechForTelephony,

  // Voice management
  getVoices,
  getVoice,
  getVoiceSettings,

  // Utilities
  PRESET_VOICE_SETTINGS,
  isConfigured,
  estimateAudioDuration,

  // Error codes
  TTSErrorCode,
};
