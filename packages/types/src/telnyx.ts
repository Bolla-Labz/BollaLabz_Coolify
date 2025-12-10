/**
 * Telnyx Type Definitions
 *
 * Comprehensive types for Telnyx Voice API integration including:
 * - Webhook payloads (voice, status, recording)
 * - Media Streams WebSocket messages
 * - TeXML configuration options
 * - API request/response types
 *
 * Created: 08 December 2025 20 45 00
 *
 * @see https://developers.telnyx.com/docs/v2/voice
 */

// =============================================================================
// CALL STATUS TYPES
// =============================================================================

/**
 * All possible Telnyx call status values
 * @see https://developers.telnyx.com/docs/v2/call-control
 */
export type TelnyxCallStatus =
  | 'queued'
  | 'ringing'
  | 'answered'
  | 'in-progress'
  | 'completed'
  | 'busy'
  | 'failed'
  | 'no-answer'
  | 'canceled';

/**
 * Call direction types
 */
export type TelnyxCallDirection =
  | 'incoming'
  | 'outgoing';

/**
 * Answering machine detection results
 */
export type TelnyxAnsweredBy =
  | 'human'
  | 'machine'
  | 'not-sure'
  | 'unknown';

// =============================================================================
// VOICE WEBHOOK TYPES
// =============================================================================

/**
 * Phone number details included in webhooks
 */
export interface TelnyxPhoneDetails {
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
 * Voice webhook request from Telnyx
 * Sent when a call is received or processed
 *
 * @see https://developers.telnyx.com/docs/v2/call-control/receiving-webhooks
 */
export interface TelnyxVoiceWebhook {
  /** Webhook event type */
  event_type: string;

  /** Unique identifier for this webhook */
  id: string;

  /** Timestamp when the event occurred */
  occurred_at: string;

  /** Record type (usually 'event') */
  record_type: string;

  /** Payload containing call details */
  payload: {
    /** Unique identifier for this call */
    call_control_id: string;

    /** Call leg ID */
    call_leg_id: string;

    /** Call session ID */
    call_session_id: string;

    /** Connection ID */
    connection_id?: string;

    /** Client state (custom data) */
    client_state?: string;

    /** Direction of the call */
    direction: TelnyxCallDirection;

    /** Current state of the call */
    state: TelnyxCallStatus;

    // From details
    from: string;
    from_number?: string;

    // To details
    to: string;
    to_number?: string;

    /** SIP call ID */
    sip_call_id?: string;

    /** Start time of the call */
    start_time?: string;

    /** End time of the call */
    end_time?: string;

    /** Duration in seconds */
    duration_secs?: number;

    /** Duration in milliseconds */
    duration_millis?: number;

    /** Recording URLs */
    recording_urls?: string[];

    /** Answering machine detection result */
    detect?: TelnyxAnsweredBy;

    /** Custom parameters */
    custom_headers?: Record<string, string>;
  };
}

// =============================================================================
// STATUS CALLBACK TYPES
// =============================================================================

/**
 * Status callback webhook sent when call status changes
 *
 * @see https://developers.telnyx.com/docs/v2/call-control/call-status
 */
export interface TelnyxStatusCallback extends TelnyxVoiceWebhook {
  event_type: 'call.hangup' | 'call.answered' | 'call.initiated';
}

// =============================================================================
// RECORDING CALLBACK TYPES
// =============================================================================

/**
 * Recording status values
 */
export type TelnyxRecordingStatus =
  | 'processing'
  | 'completed'
  | 'deleted'
  | 'failed';

/**
 * Recording completion webhook
 * Sent when a recording is available
 *
 * @see https://developers.telnyx.com/docs/v2/call-control/recording
 */
export interface TelnyxRecordingCallback {
  /** Event type */
  event_type: 'call.recording.saved';

  /** Recording ID */
  id: string;

  /** Occurred at timestamp */
  occurred_at: string;

  /** Payload */
  payload: {
    /** Call control ID */
    call_control_id: string;

    /** Call leg ID */
    call_leg_id: string;

    /** Call session ID */
    call_session_id: string;

    /** Recording ID */
    recording_id: string;

    /** Public recording URL */
    public_recording_url?: string;

    /** Recording URLs */
    recording_urls: {
      mp3?: string;
      wav?: string;
    };

    /** Duration in seconds */
    duration_secs: number;

    /** Duration in milliseconds */
    duration_millis: number;

    /** Number of channels */
    channels: number;

    /** Recording started at */
    started_at: string;

    /** Recording ended at */
    ended_at?: string;

    /** Client state */
    client_state?: string;
  };
}

// =============================================================================
// MEDIA STREAM TYPES
// =============================================================================

/**
 * Base interface for all Media Stream messages
 */
export interface TelnyxMediaStreamBase {
  /** Event type discriminator */
  event: string;

  /** Stream ID */
  stream_id: string;
}

/**
 * Media stream start event
 * Sent when a media stream connection is established
 *
 * @see https://developers.telnyx.com/docs/v2/call-control/streaming
 */
export interface TelnyxMediaStreamStart extends TelnyxMediaStreamBase {
  event: 'start';

  /** Start event metadata */
  start: {
    /** Stream ID */
    stream_id: string;

    /** Call control ID */
    call_control_id: string;

    /** Call leg ID */
    call_leg_id: string;

    /** Custom parameters */
    custom_headers?: Record<string, string>;

    /** Media format information */
    media_format: {
      /** Audio encoding */
      encoding: string;

      /** Sample rate in Hz */
      sample_rate: number;

      /** Number of audio channels */
      channels: number;
    };
  };
}

/**
 * Media stream media event
 * Contains Base64-encoded audio data
 */
export interface TelnyxMediaStreamMedia extends TelnyxMediaStreamBase {
  event: 'media';

  /** Media payload */
  media: {
    /** Track identifier */
    track: string;

    /** Chunk sequence number */
    chunk: number;

    /** Timestamp in milliseconds */
    timestamp: number;

    /** Base64-encoded audio payload */
    payload: string;
  };
}

/**
 * Media stream stop event
 * Sent when the media stream ends
 */
export interface TelnyxMediaStreamStop extends TelnyxMediaStreamBase {
  event: 'stop';

  /** Stop event metadata */
  stop: {
    /** Call control ID */
    call_control_id: string;

    /** Call leg ID */
    call_leg_id: string;
  };
}

/**
 * Connected event sent when WebSocket connection is established
 */
export interface TelnyxMediaStreamConnected {
  event: 'connected';

  /** Protocol version */
  version: string;
}

/**
 * Union type for all incoming Media Stream messages
 */
export type TelnyxMediaStreamMessage =
  | TelnyxMediaStreamConnected
  | TelnyxMediaStreamStart
  | TelnyxMediaStreamMedia
  | TelnyxMediaStreamStop;

// =============================================================================
// OUTGOING MEDIA STREAM MESSAGES
// =============================================================================

/**
 * Send audio media to the stream
 */
export interface TelnyxMediaStreamSendMedia {
  event: 'media';
  stream_id: string;
  media: {
    /** Base64-encoded audio */
    payload: string;
  };
}

/**
 * Clear queued audio
 */
export interface TelnyxMediaStreamClear {
  event: 'clear';
  stream_id: string;
}

/**
 * Union type for outgoing Media Stream commands
 */
export type TelnyxMediaStreamOutgoing =
  | TelnyxMediaStreamSendMedia
  | TelnyxMediaStreamClear;

// =============================================================================
// API ERROR TYPES
// =============================================================================

/**
 * Telnyx API error response structure
 *
 * @see https://developers.telnyx.com/docs/v2/development/errors
 */
export interface TelnyxErrorResponse {
  /** Error code */
  code: string;

  /** Human-readable error message */
  title: string;

  /** Detailed error information */
  detail?: string;

  /** Additional metadata */
  meta?: Record<string, unknown>;
}

// =============================================================================
// OUTBOUND CALL OPTIONS
// =============================================================================

/**
 * Options for creating an outbound call via Telnyx API
 *
 * @see https://developers.telnyx.com/docs/api/v2/call-control/Call-Commands#callControlDial
 */
export interface TelnyxOutboundCallOptions {
  /** Phone number to call (E.164 format) */
  to: string;

  /** Caller ID (must be a verified Telnyx number) */
  from: string;

  /** Connection ID to use for the call */
  connection_id: string;

  /** Webhook URL for call events */
  webhook_url?: string;

  /** Webhook URL HTTP method */
  webhook_url_method?: 'GET' | 'POST';

  /** Enable answering machine detection */
  answering_machine_detection?: 'detect' | 'detect_beep' | 'detect_words' | 'disabled';

  /** Timeout for answering machine detection */
  answering_machine_detection_config?: {
    total_analysis_time_millis?: number;
    after_greeting_silence_millis?: number;
    between_words_silence_millis?: number;
    greeting_duration_millis?: number;
    initial_silence_millis?: number;
    maximum_number_of_words?: number;
    maximum_word_length_millis?: number;
    silence_threshold?: number;
  };

  /** Custom headers */
  custom_headers?: Array<{
    name: string;
    value: string;
  }>;

  /** SIP authentication */
  sip_auth_username?: string;
  sip_auth_password?: string;

  /** Client state (custom data) */
  client_state?: string;

  /** Command ID for tracking */
  command_id?: string;

  /** Timeout in seconds */
  timeout_secs?: number;

  /** Time limit for the call in seconds */
  time_limit_secs?: number;

  /** Record the call */
  record?: 'audio' | 'both' | 'disabled';

  /** Recording channels */
  record_channels?: 'single' | 'dual';

  /** Recording format */
  record_format?: 'wav' | 'mp3';

  /** Billing group ID */
  billing_group_id?: string;

  /** Media name for streaming */
  stream_url?: string;
  stream_track?: 'inbound_track' | 'outbound_track' | 'both_tracks';
}

// =============================================================================
// CALL RESOURCE TYPES
// =============================================================================

/**
 * Telnyx Call Control resource representation
 *
 * @see https://developers.telnyx.com/docs/api/v2/call-control
 */
export interface TelnyxCallResource {
  /** Record type */
  record_type: 'call';

  /** Call control ID */
  call_control_id: string;

  /** Call leg ID */
  call_leg_id: string;

  /** Call session ID */
  call_session_id: string;

  /** Connection ID */
  connection_id: string;

  /** Client state */
  client_state?: string;

  /** Is alive */
  is_alive: boolean;

  /** Call direction */
  direction: TelnyxCallDirection;

  /** Call state */
  state: TelnyxCallStatus;

  /** From number */
  from: string;

  /** To number */
  to: string;

  /** Created at timestamp */
  created_at: string;

  /** Updated at timestamp */
  updated_at: string;
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

/**
 * Configuration for Telnyx client
 */
export interface TelnyxConfig {
  apiKey: string;
  apiVersion?: 'v2';
  connectionId?: string;
  webhookUrl?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}
