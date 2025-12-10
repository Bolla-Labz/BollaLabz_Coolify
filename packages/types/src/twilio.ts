/**
 * Twilio Type Definitions
 *
 * Comprehensive types for Twilio Voice API integration including:
 * - Webhook payloads (voice, status, recording)
 * - Media Streams WebSocket messages
 * - TwiML configuration options
 * - API request/response types
 *
 * @see https://www.twilio.com/docs/voice
 */

// =============================================================================
// CALL STATUS TYPES
// =============================================================================

/**
 * All possible Twilio call status values
 * @see https://www.twilio.com/docs/voice/api/call-resource#status-values
 */
export type TwilioCallStatus =
  | 'queued'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'busy'
  | 'failed'
  | 'no-answer'
  | 'canceled';

/**
 * Call direction types
 */
export type TwilioCallDirection =
  | 'inbound'
  | 'outbound-api'
  | 'outbound-dial';

/**
 * Answering machine detection results
 */
export type TwilioAnsweredBy =
  | 'human'
  | 'machine_start'
  | 'machine_end_beep'
  | 'machine_end_silence'
  | 'machine_end_other'
  | 'fax'
  | 'unknown';

// =============================================================================
// VOICE WEBHOOK TYPES
// =============================================================================

/**
 * Phone number details included in webhooks
 * Base fields for Called, Caller, From, To prefixes
 */
export interface TwilioPhoneDetails {
  /** Phone number in E.164 format */
  number: string;
  /** City associated with the number (if available) */
  city?: string;
  /** Country code (e.g., "US", "GB") */
  country?: string;
  /** State or province */
  state?: string;
  /** Postal/ZIP code */
  zip?: string;
}

/**
 * Voice webhook request from Twilio
 * Sent when a call is received or TwiML is requested
 *
 * @see https://www.twilio.com/docs/voice/twiml#request-parameters
 */
export interface TwilioVoiceWebhook {
  /** Twilio Account SID */
  AccountSid: string;

  /** Twilio API version (e.g., "2010-04-01") */
  ApiVersion: string;

  /** Unique identifier for this call */
  CallSid: string;

  /** Current status of the call */
  CallStatus: TwilioCallStatus;

  /** Direction of the call */
  Direction: TwilioCallDirection;

  // Called party details (the number that received the call)
  /** The phone number that was called */
  Called: string;
  CalledCity?: string;
  CalledCountry?: string;
  CalledState?: string;
  CalledZip?: string;

  // Caller details (the party making the call)
  /** The phone number of the caller */
  Caller: string;
  CallerCity?: string;
  CallerCountry?: string;
  CallerState?: string;
  CallerZip?: string;

  // From details (originating party)
  /** The phone number the call is from */
  From: string;
  FromCity?: string;
  FromCountry?: string;
  FromState?: string;
  FromZip?: string;

  // To details (destination party)
  /** The phone number the call is to */
  To: string;
  ToCity?: string;
  ToCountry?: string;
  ToState?: string;
  ToZip?: string;

  // Optional fields present in specific scenarios

  /** Duration of the call in seconds (present after call ends) */
  CallDuration?: string;

  /** URL of the recording (if recording was enabled) */
  RecordingUrl?: string;

  /** SID of the recording resource */
  RecordingSid?: string;

  /** Duration of the recording in seconds */
  RecordingDuration?: string;

  /** DTMF digits collected via <Gather> */
  Digits?: string;

  /** Speech recognition result from <Gather> with speech input */
  SpeechResult?: string;

  /** Confidence score for speech recognition (0-1) */
  Confidence?: string;

  /** Answering machine detection result */
  AnsweredBy?: TwilioAnsweredBy;

  /** Forwarded from number (if call was forwarded) */
  ForwardedFrom?: string;

  /** Parent call SID (for child legs in <Dial>) */
  ParentCallSid?: string;

  /** SID of the Twilio phone number that received the call */
  CallToken?: string;

  /** Stirred/Shaken attestation indicator */
  StirVerstat?: string;
}

// =============================================================================
// STATUS CALLBACK TYPES
// =============================================================================

/**
 * Status callback webhook sent when call status changes
 * Extends the base voice webhook with additional status fields
 *
 * @see https://www.twilio.com/docs/voice/api/call-resource#statuscallback
 */
export interface TwilioStatusCallback extends TwilioVoiceWebhook {
  /** Timestamp when the call was created */
  Timestamp?: string;

  /** Sequence number for ordering callbacks */
  CallbackSource?: string;

  /** The callback event type */
  SequenceNumber?: string;

  /** Duration the call was ringing before being answered */
  RingDuration?: string;

  /** SIP response code (for SIP calls) */
  SipResponseCode?: string;

  /** Machine detection duration (if AMD was enabled) */
  MachineDetectionDuration?: string;
}

// =============================================================================
// RECORDING CALLBACK TYPES
// =============================================================================

/**
 * Recording source types
 */
export type TwilioRecordingSource =
  | 'DialVerb'
  | 'Conference'
  | 'OutboundAPI'
  | 'Trunking'
  | 'RecordVerb'
  | 'StartCallRecordingAPI';

/**
 * Recording status values
 */
export type TwilioRecordingStatus =
  | 'in-progress'
  | 'completed'
  | 'absent'
  | 'failed';

/**
 * Recording completion webhook
 * Sent when a recording is available
 *
 * @see https://www.twilio.com/docs/voice/api/recording#recordingstatuscallback
 */
export interface TwilioRecordingCallback {
  /** Twilio Account SID */
  AccountSid: string;

  /** Call SID that the recording is associated with */
  CallSid: string;

  /** Unique identifier for the recording */
  RecordingSid: string;

  /** URL to access the recording */
  RecordingUrl: string;

  /** Status of the recording */
  RecordingStatus: TwilioRecordingStatus;

  /** Duration of the recording in seconds */
  RecordingDuration: string;

  /** Number of channels in the recording (1 = mono, 2 = stereo) */
  RecordingChannels: string;

  /** Recording source */
  RecordingSource: TwilioRecordingSource;

  /** Timestamp when the recording started */
  RecordingStartTime?: string;

  /** Error code if recording failed */
  ErrorCode?: string;
}

// =============================================================================
// MEDIA STREAM TYPES
// =============================================================================

/**
 * Base interface for all Media Stream messages
 */
export interface TwilioMediaStreamBase {
  /** Event type discriminator */
  event: string;

  /** Sequence number for ordering */
  sequenceNumber: string;

  /** Stream SID */
  streamSid: string;
}

/**
 * Media stream start event
 * Sent when a media stream connection is established
 *
 * @see https://www.twilio.com/docs/voice/media-streams/websocket-messages
 */
export interface TwilioMediaStreamStart extends TwilioMediaStreamBase {
  event: 'start';

  /** Start event metadata */
  start: {
    /** Stream SID */
    streamSid: string;

    /** Account SID */
    accountSid: string;

    /** Call SID */
    callSid: string;

    /** Custom parameters passed in TwiML */
    customParameters?: Record<string, string>;

    /** Media format information */
    mediaFormat: {
      /** Audio encoding (e.g., "audio/x-mulaw") */
      encoding: string;

      /** Sample rate in Hz (e.g., 8000) */
      sampleRate: number;

      /** Number of audio channels */
      channels: number;
    };

    /** Track name(s) being streamed */
    tracks: string[];
  };
}

/**
 * Media stream media event
 * Contains Base64-encoded audio data
 */
export interface TwilioMediaStreamMedia extends TwilioMediaStreamBase {
  event: 'media';

  /** Media payload */
  media: {
    /** Track identifier (e.g., "inbound", "outbound") */
    track: string;

    /** Chunk number for this track */
    chunk: string;

    /** Timestamp in milliseconds */
    timestamp: string;

    /** Base64-encoded mulaw audio payload */
    payload: string;
  };
}

/**
 * Media stream stop event
 * Sent when the media stream ends
 */
export interface TwilioMediaStreamStop extends TwilioMediaStreamBase {
  event: 'stop';

  /** Stop event metadata */
  stop: {
    /** Account SID */
    accountSid: string;

    /** Call SID */
    callSid: string;
  };
}

/**
 * Media stream mark event
 * Sent when a mark is received (used for synchronization)
 */
export interface TwilioMediaStreamMark extends TwilioMediaStreamBase {
  event: 'mark';

  /** Mark metadata */
  mark: {
    /** Custom name provided in the mark */
    name: string;
  };
}

/**
 * Connected event sent when WebSocket connection is established
 */
export interface TwilioMediaStreamConnected {
  event: 'connected';

  /** Protocol version */
  protocol: string;

  /** API version */
  version: string;
}

/**
 * Union type for all incoming Media Stream messages
 */
export type TwilioMediaStreamMessage =
  | TwilioMediaStreamConnected
  | TwilioMediaStreamStart
  | TwilioMediaStreamMedia
  | TwilioMediaStreamStop
  | TwilioMediaStreamMark;

// =============================================================================
// OUTGOING MEDIA STREAM MESSAGES
// =============================================================================

/**
 * Send audio media to the stream
 */
export interface TwilioMediaStreamSendMedia {
  event: 'media';
  streamSid: string;
  media: {
    /** Base64-encoded mulaw audio */
    payload: string;
  };
}

/**
 * Send a mark for synchronization
 */
export interface TwilioMediaStreamSendMark {
  event: 'mark';
  streamSid: string;
  mark: {
    name: string;
  };
}

/**
 * Clear queued audio
 */
export interface TwilioMediaStreamClear {
  event: 'clear';
  streamSid: string;
}

/**
 * Union type for outgoing Media Stream commands
 */
export type TwilioMediaStreamOutgoing =
  | TwilioMediaStreamSendMedia
  | TwilioMediaStreamSendMark
  | TwilioMediaStreamClear;

// =============================================================================
// TWIML OPTIONS
// =============================================================================

/**
 * Speech recognition language codes
 */
export type TwilioSpeechLanguage =
  | 'en-US'
  | 'en-GB'
  | 'en-AU'
  | 'es-ES'
  | 'es-MX'
  | 'fr-FR'
  | 'de-DE'
  | 'it-IT'
  | 'ja-JP'
  | 'ko-KR'
  | 'pt-BR'
  | 'zh-CN'
  | string; // Allow other valid language codes

/**
 * Input types for <Gather>
 */
export type TwilioGatherInput =
  | 'dtmf'
  | 'speech'
  | 'dtmf speech';

/**
 * Speech model options
 */
export type TwilioSpeechModel =
  | 'default'
  | 'numbers_and_commands'
  | 'phone_call'
  | 'experimental_conversations'
  | 'experimental_utterances';

/**
 * Options for TwiML <Gather> verb
 *
 * @see https://www.twilio.com/docs/voice/twiml/gather
 */
export interface TwiMLGatherOptions {
  /** URL to submit gathered input */
  action?: string;

  /** HTTP method for action URL */
  method?: 'GET' | 'POST';

  /** Timeout in seconds for gathering input */
  timeout?: number;

  /** Key to finish gathering (DTMF) */
  finishOnKey?: string;

  /** Maximum number of digits to collect */
  numDigits?: number;

  /** Input types to accept */
  input?: TwilioGatherInput;

  /** Language for speech recognition */
  language?: TwilioSpeechLanguage;

  /** Speech recognition hints/phrases */
  hints?: string;

  /** Profanity filter for speech */
  profanityFilter?: boolean;

  /** Speech timeout in seconds */
  speechTimeout?: number | 'auto';

  /** Speech model to use */
  speechModel?: TwilioSpeechModel;

  /** Enable enhanced speech recognition */
  enhanced?: boolean;

  /** Enable partial speech results */
  partialResultCallback?: string;

  /** Method for partial result callback */
  partialResultCallbackMethod?: 'GET' | 'POST';

  /** Action URL on empty result */
  actionOnEmptyResult?: boolean;

  /** Enable barge-in (interrupt playback) */
  bargeIn?: boolean;

  /** Enable debug mode */
  debug?: boolean;
}

/**
 * Track options for Media Streams
 */
export type TwilioStreamTrack =
  | 'inbound_track'
  | 'outbound_track'
  | 'both_tracks';

/**
 * Options for TwiML <Stream> verb
 *
 * @see https://www.twilio.com/docs/voice/twiml/stream
 */
export interface TwiMLStreamOptions {
  /** WebSocket URL for the stream */
  url: string;

  /** Name for the stream */
  name?: string;

  /** Track(s) to stream */
  track?: TwilioStreamTrack;

  /** URL for status callbacks */
  statusCallback?: string;

  /** Method for status callback */
  statusCallbackMethod?: 'GET' | 'POST';

  /** Custom parameters to pass to WebSocket */
  parameters?: Record<string, string>;
}

/**
 * Options for TwiML <Record> verb
 *
 * @see https://www.twilio.com/docs/voice/twiml/record
 */
export interface TwiMLRecordOptions {
  /** URL to send recording to */
  action?: string;

  /** HTTP method for action URL */
  method?: 'GET' | 'POST';

  /** Maximum recording length in seconds */
  maxLength?: number;

  /** Silence timeout to end recording */
  timeout?: number;

  /** Key to finish recording */
  finishOnKey?: string;

  /** Play beep before recording */
  playBeep?: boolean;

  /** Enable transcription */
  transcribe?: boolean;

  /** URL for transcription callback */
  transcribeCallback?: string;

  /** Recording status callback URL */
  recordingStatusCallback?: string;

  /** Method for status callback */
  recordingStatusCallbackMethod?: 'GET' | 'POST';

  /** Events to receive callbacks for */
  recordingStatusCallbackEvent?: string[];

  /** Trim silence from recording */
  trim?: 'trim-silence' | 'do-not-trim';
}

/**
 * Options for TwiML <Dial> verb
 *
 * @see https://www.twilio.com/docs/voice/twiml/dial
 */
export interface TwiMLDialOptions {
  /** URL for call screening */
  action?: string;

  /** HTTP method for action URL */
  method?: 'GET' | 'POST';

  /** Timeout for dial attempt in seconds */
  timeout?: number;

  /** Hangup on star key */
  hangupOnStar?: boolean;

  /** Time limit for call in seconds */
  timeLimit?: number;

  /** Caller ID to display */
  callerId?: string;

  /** Enable recording */
  record?: 'do-not-record' | 'record-from-answer' | 'record-from-ringing' | 'record-from-answer-dual' | 'record-from-ringing-dual';

  /** Enable answering machine detection */
  answerOnBridge?: boolean;

  /** Ring tone to play */
  ringTone?: string;

  /** Recording status callback */
  recordingStatusCallback?: string;

  /** Method for recording callback */
  recordingStatusCallbackMethod?: 'GET' | 'POST';

  /** Refer URL for SIP */
  referUrl?: string;

  /** Refer method */
  referMethod?: 'GET' | 'POST';
}

// =============================================================================
// API ERROR TYPES
// =============================================================================

/**
 * Twilio API error response structure
 *
 * @see https://www.twilio.com/docs/api/errors
 */
export interface TwilioErrorResponse {
  /** Error code (e.g., 20404) */
  code: number;

  /** Human-readable error message */
  message: string;

  /** More detailed information URL */
  more_info: string;

  /** HTTP status code */
  status: number;

  /** Optional error details */
  details?: Record<string, unknown>;
}

/**
 * Twilio REST API error codes
 */
export type TwilioErrorCode =
  | 20001 // Invalid AccountSid
  | 20003 // Permission denied
  | 20404 // Resource not found
  | 20429 // Too many requests
  | 21201 // No 'To' number specified
  | 21211 // Invalid 'To' phone number
  | 21214 // 'To' phone number cannot be reached
  | 21217 // Invalid phone number
  | 21401 // Invalid phone number format
  | 21601 // Phone number not verified
  | 21610 // SMS not enabled for region
  | 31000 // Call failed
  | 31002 // Connection declined
  | 31003 // Connection timeout
  | 31005 // Connection error
  | 31009 // Transport error
  | number; // Allow other codes

// =============================================================================
// OUTBOUND CALL OPTIONS
// =============================================================================

/**
 * Options for creating an outbound call via Twilio API
 *
 * @see https://www.twilio.com/docs/voice/api/call-resource#create-a-call-resource
 */
export interface TwilioOutboundCallOptions {
  /** Phone number to call (E.164 format) */
  to: string;

  /** Caller ID (must be a verified Twilio number) */
  from: string;

  /** TwiML URL to fetch instructions from */
  url?: string;

  /** TwiML instructions (alternative to url) */
  twiml?: string;

  /** Application SID for handling the call */
  applicationSid?: string;

  /** HTTP method for fetching TwiML */
  method?: 'GET' | 'POST';

  /** URL for status callbacks */
  statusCallback?: string;

  /** Method for status callbacks */
  statusCallbackMethod?: 'GET' | 'POST';

  /** Events to receive callbacks for */
  statusCallbackEvent?: TwilioCallStatus[];

  /** Fallback URL if primary fails */
  fallbackUrl?: string;

  /** Fallback URL method */
  fallbackMethod?: 'GET' | 'POST';

  /** Timeout for the call in seconds */
  timeout?: number;

  /** Enable recording */
  record?: boolean;

  /** Recording channels */
  recordingChannels?: 'mono' | 'dual';

  /** Recording status callback URL */
  recordingStatusCallback?: string;

  /** Recording status callback method */
  recordingStatusCallbackMethod?: 'GET' | 'POST';

  /** Recording status callback events */
  recordingStatusCallbackEvent?: string[];

  /** Enable answering machine detection */
  machineDetection?: 'Enable' | 'DetectMessageEnd';

  /** AMD timeout in seconds */
  machineDetectionTimeout?: number;

  /** AMD silence timeout in ms */
  machineDetectionSilenceTimeout?: number;

  /** AMD speech threshold in ms */
  machineDetectionSpeechThreshold?: number;

  /** AMD speech end threshold in ms */
  machineDetectionSpeechEndThreshold?: number;

  /** Async AMD (non-blocking) */
  asyncAmd?: boolean;

  /** AMD status callback URL */
  asyncAmdStatusCallback?: string;

  /** AMD status callback method */
  asyncAmdStatusCallbackMethod?: 'GET' | 'POST';

  /** SIP authentication username */
  sipAuthUsername?: string;

  /** SIP authentication password */
  sipAuthPassword?: string;

  /** Caller name for SIP */
  callerName?: string;

  /** Send DTMF digits after connection */
  sendDigits?: string;

  /** If caller hangs up, try next number */
  ifMachine?: 'Continue' | 'Hangup';

  /** Time limit for the call in seconds */
  timeLimit?: number;

  /** Custom parameters for the call */
  parameters?: Record<string, string>;
}

// =============================================================================
// CALL RESOURCE TYPES
// =============================================================================

/**
 * Twilio Call resource representation
 *
 * @see https://www.twilio.com/docs/voice/api/call-resource
 */
export interface TwilioCallResource {
  /** Account SID */
  account_sid: string;

  /** Annotation for the call */
  annotation?: string;

  /** Who answered the call */
  answered_by?: TwilioAnsweredBy;

  /** API version */
  api_version: string;

  /** Caller name */
  caller_name?: string;

  /** Date/time the call was created */
  date_created: string;

  /** Date/time the call was last updated */
  date_updated: string;

  /** Call direction */
  direction: TwilioCallDirection;

  /** Duration of the call in seconds */
  duration?: string;

  /** End time of the call */
  end_time?: string;

  /** Forwarded from number */
  forwarded_from?: string;

  /** From phone number */
  from: string;

  /** Formatted from number */
  from_formatted: string;

  /** Group SID (for parallel dialing) */
  group_sid?: string;

  /** Parent call SID */
  parent_call_sid?: string;

  /** Phone number SID */
  phone_number_sid?: string;

  /** Price of the call */
  price?: string;

  /** Currency of the price */
  price_unit?: string;

  /** Queue time in milliseconds */
  queue_time?: string;

  /** Unique call SID */
  sid: string;

  /** Start time of the call */
  start_time?: string;

  /** Current call status */
  status: TwilioCallStatus;

  /** To phone number */
  to: string;

  /** Formatted to number */
  to_formatted: string;

  /** Trunk SID (for SIP trunking) */
  trunk_sid?: string;

  /** Resource URI */
  uri: string;

  /** Subresource URIs */
  subresource_uris?: {
    recordings?: string;
    notifications?: string;
    feedback?: string;
    events?: string;
    payments?: string;
    siprec?: string;
    streams?: string;
    user_defined_messages?: string;
    user_defined_message_subscriptions?: string;
  };
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Parsed phone number details from webhook fields
 */
export interface TwilioParsedPhoneInfo {
  number: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
}

/**
 * Helper type to extract phone info from a webhook
 */
export type ExtractPhoneInfo<T extends TwilioVoiceWebhook, Prefix extends 'Called' | 'Caller' | 'From' | 'To'> = {
  number: T[Prefix];
  city?: T[`${Prefix}City`];
  state?: T[`${Prefix}State`];
  country?: T[`${Prefix}Country`];
  zip?: T[`${Prefix}Zip`];
};

/**
 * Webhook validation result
 */
export interface TwilioWebhookValidation {
  isValid: boolean;
  error?: string;
  timestamp?: number;
}

/**
 * Configuration for Twilio client
 */
export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  apiKeySid?: string;
  apiKeySecret?: string;
  region?: 'us1' | 'ie1' | 'au1' | 'sg1';
  edge?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}
