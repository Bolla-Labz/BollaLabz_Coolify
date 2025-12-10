/**
 * Services Index - Export all service modules
 * BollaLabz Command Center API
 */

// ---------------------------------------------------------------------------
// Embedding Service
// ---------------------------------------------------------------------------
export {
  generateEmbedding,
  generateEmbeddingWithMetadata,
  generateEmbeddingsBatch,
  getAvailableProviders,
  getEmbeddingDimensions,
} from "./embeddings";

export type {
  EmbeddingConfig,
  EmbeddingResponse,
  EmbeddingError,
} from "./embeddings";

// ---------------------------------------------------------------------------
// Vector Search Service
// ---------------------------------------------------------------------------
export {
  // Contact search
  searchContacts,
  findSimilarContacts,
  // Phone record search
  searchPhoneRecords,
  searchPhoneRecordsWithDateRange,
  // Embedding updates
  updateContactEmbedding,
  updatePhoneRecordEmbedding,
  // Backfill operations
  backfillContactEmbeddings,
  backfillPhoneRecordEmbeddings,
  // Statistics
  getEmbeddingStats,
} from "./vector-search";

export type {
  SearchResult,
  SearchOptions,
  ContactSearchResult,
  PhoneRecordSearchResult,
} from "./vector-search";

// ---------------------------------------------------------------------------
// Deepgram Transcription Service
// ---------------------------------------------------------------------------
export {
  DeepgramService,
  getDeepgramService,
  transcribeUrl,
  transcribeBuffer,
  createLiveTranscription,
} from "./deepgram";

export type {
  DeepgramConfig,
  TranscriptionOptions,
  StreamingOptions,
  TranscriptionResult,
  TranscriptionError,
  WordInfo,
  ParagraphInfo,
  SentenceInfo,
  UtteranceInfo,
  SpeakerInfo,
  TranscriptionMetadata,
  StreamTranscriptCallback,
  StreamErrorCallback,
  StreamCloseCallback,
  StreamMetadata,
  LiveConnection,
} from "./deepgram";

// ---------------------------------------------------------------------------
// Anthropic Claude AI Service
// ---------------------------------------------------------------------------
export {
  default as anthropicService,
  AnthropicService,
  getAnthropicService,
  // Convenience functions
  summarizeTranscript,
  analyzeSentiment,
  extractActionItems,
  generateFollowUps,
  classifyTopic,
  streamAnalysis,
  executePrompt,
  checkHealth,
} from "./anthropic";

export type {
  ClaudeConfig,
  SummarizeOptions,
  SummarizeResponse,
  SentimentType,
  SentimentScore,
  SentimentAnalysisResponse,
  ActionItem,
  ActionItemsResponse,
  FollowUpSuggestion,
  FollowUpResponse,
  TopicClassification,
  ClassificationResponse,
  StreamOptions,
} from "./anthropic";

// ---------------------------------------------------------------------------
// ElevenLabs Text-to-Speech Service
// ---------------------------------------------------------------------------
export {
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
} from "./elevenlabs";

export type {
  OutputFormat,
  ModelId,
  VoiceSettings,
  TTSGenerateConfig,
  TTSStreamConfig,
  Voice,
  TTSGenerateResponse,
  TTSStreamResponse,
  TTSError,
} from "./elevenlabs";

// ---------------------------------------------------------------------------
// Twilio Telephony Service (Primary telephony provider)
// ---------------------------------------------------------------------------
export {
  TwilioService,
  getTwilioService,
  TwilioServiceError,
  TwilioAuthError,
  TwilioValidationError,
  DSM_PHONE_NUMBERS,
} from "./twilio";

export type {
  TwilioServiceConfig,
  OutboundCallOptions,
  CallUpdateOptions,
  RecordingOptions as TwilioRecordingOptions,
  RecordingUpdateOptions,
  TransferOptions as TwilioTransferOptions,
  SMSOptions,
  TwiMLOptions,
  WebhookVerificationResult as TwilioWebhookVerificationResult,
} from "./twilio";
