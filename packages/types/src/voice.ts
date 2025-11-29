/**
 * Voice Pipeline Types
 */

// Voice session
export interface VoiceSession {
  id: string;
  userId: string;
  status: VoiceSessionStatus;
  startedAt: string;
  endedAt?: string;
  duration?: number;

  // Audio properties
  audioUrl?: string;
  audioFormat?: AudioFormat;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;

  // Transcription data
  transcript?: Transcript;
  language?: string;
  confidence?: number;

  // AI processing
  aiModel?: string;
  aiResponse?: string;
  sentiment?: SentimentAnalysis;
  entities?: ExtractedEntity[];
  intents?: DetectedIntent[];

  // Call data (if from phone)
  phoneCall?: PhoneCallData;

  // Metadata
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export type VoiceSessionStatus =
  | 'initializing'
  | 'recording'
  | 'processing'
  | 'transcribing'
  | 'analyzing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type AudioFormat = 'wav' | 'mp3' | 'ogg' | 'webm' | 'flac';

// Transcript
export interface Transcript {
  id: string;
  sessionId: string;
  text: string;
  segments: TranscriptSegment[];
  language: string;
  confidence: number;
  duration: number;
  wordCount: number;
}

// Transcript segment (for time-aligned text)
export interface TranscriptSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  speaker?: string;
  confidence: number;
  words?: Word[];
}

// Individual word with timing
export interface Word {
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

// Phone call data
export interface PhoneCallData {
  callId: string;
  from: string;
  to: string;
  direction: 'inbound' | 'outbound';
  status: CallStatus;
  provider: string;
  cost?: number;
  recordingUrl?: string;
}

export type CallStatus =
  | 'queued'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'busy'
  | 'no-answer'
  | 'canceled';

// Phone record (call history)
export interface PhoneRecord {
  id: string;
  userId: string;
  contactId?: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  status: CallStatus;
  duration: number;
  startTime: string;
  endTime: string;
  recordingUrl?: string;
  transcriptId?: string;
  cost?: number;
  provider: string;
  metadata?: Record<string, unknown>;
}

// Sentiment analysis
export interface SentimentAnalysis {
  overall: SentimentScore;
  segments?: Array<{
    text: string;
    sentiment: SentimentScore;
    startTime: number;
    endTime: number;
  }>;
}

export interface SentimentScore {
  label: 'positive' | 'negative' | 'neutral' | 'mixed';
  score: number;
  confidence: number;
}

// Extracted entities
export interface ExtractedEntity {
  text: string;
  type: EntityType;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export type EntityType =
  | 'person'
  | 'organization'
  | 'location'
  | 'date'
  | 'time'
  | 'money'
  | 'percentage'
  | 'phone'
  | 'email'
  | 'url'
  | 'custom';

// Detected intents
export interface DetectedIntent {
  name: string;
  confidence: number;
  parameters?: Record<string, unknown>;
}

// Voice command
export interface VoiceCommand {
  id: string;
  command: string;
  action: string;
  parameters?: Record<string, unknown>;
  confidence: number;
  timestamp: string;
}

// Real-time transcription event
export interface TranscriptionEvent {
  type: 'partial' | 'final';
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: number;
  speaker?: string;
}

// Voice settings
export interface VoiceSettings {
  userId: string;
  preferredLanguage: string;
  autoTranscribe: boolean;
  saveRecordings: boolean;
  enableSentimentAnalysis: boolean;
  enableEntityExtraction: boolean;
  wakeWord?: string;
  voiceProfile?: VoiceProfile;
}

// Voice profile for speaker identification
export interface VoiceProfile {
  id: string;
  userId: string;
  name: string;
  samples: string[];
  features?: number[];
  createdAt: string;
  updatedAt: string;
}