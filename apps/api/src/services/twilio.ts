// 08 December 2025 15 10 00

/**
 * Twilio Telephony Service
 *
 * Production-grade implementation of Twilio Voice API with:
 * - Outbound call initiation with answering machine detection
 * - Inbound call webhook handling with TwiML generation
 * - Call control operations (answer, hangup, transfer, hold)
 * - Recording management (start, stop, fetch, delete)
 * - TwiML generation for complex call flows
 * - Webhook signature verification for security
 * - SMS messaging capability
 * - SIP integration support
 * - Comprehensive error handling and logging
 * - Rate limiting and retry logic
 * - Performance monitoring
 *
 * @see https://www.twilio.com/docs/voice
 */

import twilio from 'twilio';
import type { Twilio as TwilioClient } from 'twilio';

// Get TwiML from twilio default export
const TwiML = twilio.twiml;
const validateRequest = twilio.validateRequest;
import { randomUUID } from 'crypto';

// =============================================================================
// CONFIGURATION & TYPES
// =============================================================================

interface TwilioServiceConfig {
  accountSid: string;
  authToken: string;
  defaultFrom: string;
  timeout?: number;
  retryAttempts?: number;
}

interface OutboundCallOptions {
  to: string;
  from?: string;
  url?: string;
  method?: 'GET' | 'POST';
  statusCallback?: string;
  statusCallbackMethod?: 'GET' | 'POST';
  statusCallbackEvent?: string[];
  machineDetection?: 'Enable' | 'DetectMessageEnd' | 'Disabled';
  machineDetectionTimeout?: number;
  machineDetectionSpeechThreshold?: number;
  machineDetectionSpeechEndThreshold?: number;
  machineDetectionSilenceTimeout?: number;
  record?: boolean;
  recordingChannels?: 'mono' | 'dual';
  recordingStatusCallback?: string;
  recordingStatusCallbackMethod?: 'GET' | 'POST';
  timeout?: number;
  sipAuthUsername?: string;
  sipAuthPassword?: string;
  applicationSid?: string;
}

interface CallUpdateOptions {
  url?: string;
  method?: 'GET' | 'POST';
  status?: 'canceled' | 'completed';
  twiml?: string;
}

interface RecordingOptions {
  recordingChannels?: 'mono' | 'dual';
  recordingStatusCallback?: string;
  recordingStatusCallbackMethod?: 'GET' | 'POST';
  trim?: 'trim-silence' | 'do-not-trim';
}

interface RecordingUpdateOptions {
  status?: 'paused' | 'stopped';
  pauseBehavior?: 'skip' | 'silence';
}

interface TransferOptions {
  to: string;
  from?: string;
  url?: string;
  method?: 'GET' | 'POST';
  statusCallback?: string;
  statusCallbackMethod?: 'GET' | 'POST';
}

interface SMSOptions {
  to: string;
  from?: string;
  body: string;
  mediaUrl?: string[];
  statusCallback?: string;
  messagingServiceSid?: string;
  maxPrice?: number;
  provideFeedback?: boolean;
}

interface TwiMLOptions {
  voice?: 'man' | 'woman' | 'alice' | 'Polly.Joanna' | 'Polly.Matthew';
  language?: string;
  timeout?: number;
  maxLength?: number;
}

interface WebhookVerificationResult {
  valid: boolean;
  error?: string;
}

// Twilio phone numbers for Des Moines area
export const DSM_PHONE_NUMBERS = {
  PRIMARY: '+15156907696',
  MAIN: '+15156196701',
  OFFICE: '+15157094712',
  MOBILE: '+15156051524',
  HOME: '+15153617972',
  WORK: '+15154979734',
  BUSINESS: '+15157056220',
  DIRECT: '+15158541731',
  LINE: '+15156047722',
} as const;

// Custom error classes
class TwilioServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'TwilioServiceError';
  }
}

class TwilioAuthError extends TwilioServiceError {
  constructor(message: string, details?: unknown) {
    super(message, 'AUTH_ERROR', details);
    this.name = 'TwilioAuthError';
  }
}

class TwilioValidationError extends TwilioServiceError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'TwilioValidationError';
  }
}

// =============================================================================
// LOGGER SETUP
// =============================================================================

interface LogContext {
  correlationId?: string;
  callSid?: string;
  messageSid?: string;
  duration?: number;
  [key: string]: unknown;
}

class TwilioLogger {
  private serviceName = 'TwilioService';

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      message,
      ...context,
    };

    // In production, use structured logging (pino, winston, etc.)
    console[level](JSON.stringify(logEntry));
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }
}

// =============================================================================
// TWILIO SERVICE CLASS
// =============================================================================

export class TwilioService {
  private client: TwilioClient;
  private config: TwilioServiceConfig;
  private logger: TwilioLogger;
  private rateLimitCache: Map<string, number[]> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<TwilioServiceConfig>) {
    this.logger = new TwilioLogger();

    // Load configuration from environment variables with fallbacks
    this.config = {
      accountSid: config?.accountSid || process.env.TWILIO_ACCOUNT_SID || '',
      authToken: config?.authToken || process.env.TWILIO_AUTH_TOKEN || '',
      defaultFrom: config?.defaultFrom || process.env.TWILIO_DEFAULT_FROM || DSM_PHONE_NUMBERS.PRIMARY,
      timeout: config?.timeout || 30000,
      retryAttempts: config?.retryAttempts || 3,
    };

    // Validate required configuration
    this.validateConfig();

    // Initialize Twilio client
    this.client = twilio(this.config.accountSid, this.config.authToken);

    // Start rate limit cache cleanup interval
    this.startRateLimitCleanup();

    this.logger.info('TwilioService initialized', {
      accountSid: this.maskSensitive(this.config.accountSid),
      defaultFrom: this.config.defaultFrom,
    });
  }

  /**
   * Clean up rate limit cache periodically to prevent memory leaks
   */
  private startRateLimitCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupRateLimitCache();
    }, 60000); // Cleanup every minute
  }

  /**
   * Cleanup expired entries from rate limit cache
   */
  private cleanupRateLimitCache(): void {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    let cleanedCount = 0;

    for (const [key, timestamps] of this.rateLimitCache.entries()) {
      const recentRequests = timestamps.filter((timestamp) => now - timestamp < windowMs);

      if (recentRequests.length === 0) {
        this.rateLimitCache.delete(key);
        cleanedCount++;
      } else {
        this.rateLimitCache.set(key, recentRequests);
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug('Cleaned up rate limit cache', { cleanedCount });
    }
  }

  /**
   * Cleanup method to be called on service shutdown
   */
  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.rateLimitCache.clear();
  }

  // ===========================================================================
  // CONFIGURATION VALIDATION
  // ===========================================================================

  private validateConfig(): void {
    const required = ['accountSid', 'authToken', 'defaultFrom'];
    const missing = required.filter((key) => !this.config[key as keyof TwilioServiceConfig]);

    if (missing.length > 0) {
      throw new TwilioValidationError(
        `Missing required Twilio configuration: ${missing.join(', ')}`,
        { missing }
      );
    }

    // Validate phone number format (E.164)
    if (!/^\+[1-9]\d{1,14}$/.test(this.config.defaultFrom)) {
      throw new TwilioValidationError(
        'Default phone number must be in E.164 format (e.g., +15156907696)',
        { defaultFrom: this.config.defaultFrom }
      );
    }

    // Validate Account SID format
    if (!this.config.accountSid.startsWith('AC')) {
      throw new TwilioValidationError(
        'Account SID must start with AC',
        { accountSid: this.maskSensitive(this.config.accountSid) }
      );
    }
  }

  // ===========================================================================
  // WEBHOOK SIGNATURE VERIFICATION
  // ===========================================================================

  /**
   * Verify webhook signature to ensure request authenticity
   *
   * Implements HMAC-SHA1 signature verification as per Twilio security docs
   *
   * @see https://www.twilio.com/docs/usage/security#validating-requests
   */
  verifyWebhookSignature(
    url: string,
    params: Record<string, string>,
    signature: string
  ): WebhookVerificationResult {
    const correlationId = randomUUID();
    const startTime = performance.now();

    try {
      // Validate inputs
      if (!signature || !url) {
        return {
          valid: false,
          error: 'Missing signature or URL',
        };
      }

      // Use Twilio's built-in validation
      const isValid = validateRequest(
        this.config.authToken,
        signature,
        url,
        params
      );

      this.logger.info('Webhook signature verification completed', {
        correlationId,
        valid: isValid,
        duration: performance.now() - startTime,
      });

      return { valid: isValid };
    } catch (error) {
      this.logger.error('Webhook signature verification failed', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      });

      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Express/Fastify middleware for webhook validation
   */
  createWebhookMiddleware() {
    return (req: any, res: any, next: any) => {
      const signature = req.headers['x-twilio-signature'] as string;
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const params = req.body;

      const result = this.verifyWebhookSignature(url, params, signature);

      if (!result.valid) {
        this.logger.warn('Webhook validation failed', {
          url,
          error: result.error,
        });
        return res.status(403).json({
          success: false,
          error: 'Invalid webhook signature',
        });
      }

      next();
    };
  }

  // ===========================================================================
  // OUTBOUND CALLS
  // ===========================================================================

  /**
   * Initiate an outbound call with comprehensive options
   *
   * Features:
   * - Answering machine detection (AMD)
   * - Custom webhook URLs
   * - Call recording
   * - Status callbacks
   * - SIP authentication
   */
  async initiateCall(options: OutboundCallOptions): Promise<any> {
    const correlationId = randomUUID();
    const startTime = performance.now();

    try {
      // Validate destination number
      if (!options.to) {
        throw new TwilioValidationError('Destination number (to) is required');
      }

      if (!/^\+[1-9]\d{1,14}$/.test(options.to)) {
        throw new TwilioValidationError(
          'Destination number must be in E.164 format',
          { to: options.to }
        );
      }

      this.logger.info('Initiating outbound call', {
        correlationId,
        to: options.to,
        from: options.from || this.config.defaultFrom,
        machineDetection: options.machineDetection,
      });

      // Prepare call options
      const callOptions: any = {
        to: options.to,
        from: options.from || this.config.defaultFrom,
        timeout: options.timeout || 30,
      };

      // Add optional parameters
      if (options.url) callOptions.url = options.url;
      if (options.method) callOptions.method = options.method;
      if (options.statusCallback) callOptions.statusCallback = options.statusCallback;
      if (options.statusCallbackMethod) callOptions.statusCallbackMethod = options.statusCallbackMethod;
      if (options.statusCallbackEvent) callOptions.statusCallbackEvent = options.statusCallbackEvent;
      if (options.machineDetection) callOptions.machineDetection = options.machineDetection;
      if (options.machineDetectionTimeout) callOptions.machineDetectionTimeout = options.machineDetectionTimeout;
      if (options.machineDetectionSpeechThreshold) callOptions.machineDetectionSpeechThreshold = options.machineDetectionSpeechThreshold;
      if (options.machineDetectionSpeechEndThreshold) callOptions.machineDetectionSpeechEndThreshold = options.machineDetectionSpeechEndThreshold;
      if (options.machineDetectionSilenceTimeout) callOptions.machineDetectionSilenceTimeout = options.machineDetectionSilenceTimeout;
      if (options.record !== undefined) callOptions.record = options.record;
      if (options.recordingChannels) callOptions.recordingChannels = options.recordingChannels;
      if (options.recordingStatusCallback) callOptions.recordingStatusCallback = options.recordingStatusCallback;
      if (options.recordingStatusCallbackMethod) callOptions.recordingStatusCallbackMethod = options.recordingStatusCallbackMethod;
      if (options.sipAuthUsername) callOptions.sipAuthUsername = options.sipAuthUsername;
      if (options.sipAuthPassword) callOptions.sipAuthPassword = options.sipAuthPassword;
      if (options.applicationSid) callOptions.applicationSid = options.applicationSid;

      // Execute call with retry logic
      const call = await this.executeWithRetry(async () => {
        return await this.client.calls.create(callOptions);
      }, correlationId);

      this.logger.info('Outbound call initiated successfully', {
        correlationId,
        callSid: call.sid,
        status: call.status,
        duration: performance.now() - startTime,
      });

      return call;
    } catch (error) {
      this.logger.error('Failed to initiate outbound call', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      });

      throw this.handleTwilioError(error);
    }
  }

  // ===========================================================================
  // CALL CONTROL OPERATIONS
  // ===========================================================================

  /**
   * Get call details by Call SID
   */
  async getCall(callSid: string): Promise<any> {
    const correlationId = randomUUID();
    const startTime = performance.now();

    try {
      this.logger.info('Retrieving call details', {
        correlationId,
        callSid,
      });

      const call = await this.executeWithRetry(async () => {
        return await this.client.calls(callSid).fetch();
      }, correlationId);

      this.logger.info('Call details retrieved successfully', {
        correlationId,
        callSid,
        duration: performance.now() - startTime,
      });

      return call;
    } catch (error) {
      this.logger.error('Failed to retrieve call details', {
        correlationId,
        callSid,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      });

      throw this.handleTwilioError(error);
    }
  }

  /**
   * Update an in-progress call
   */
  async updateCall(callSid: string, options: CallUpdateOptions): Promise<any> {
    const correlationId = randomUUID();
    const startTime = performance.now();

    try {
      this.logger.info('Updating call', {
        correlationId,
        callSid,
        options,
      });

      const call = await this.executeWithRetry(async () => {
        return await this.client.calls(callSid).update(options as any);
      }, correlationId);

      this.logger.info('Call updated successfully', {
        correlationId,
        callSid,
        duration: performance.now() - startTime,
      });

      return call;
    } catch (error) {
      this.logger.error('Failed to update call', {
        correlationId,
        callSid,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      });

      throw this.handleTwilioError(error);
    }
  }

  /**
   * Hang up a call
   */
  async hangupCall(callSid: string): Promise<any> {
    const correlationId = randomUUID();
    const startTime = performance.now();

    try {
      this.logger.info('Hanging up call', {
        correlationId,
        callSid,
      });

      const call = await this.updateCall(callSid, { status: 'completed' });

      this.logger.info('Call hung up successfully', {
        correlationId,
        callSid,
        duration: performance.now() - startTime,
      });

      return call;
    } catch (error) {
      this.logger.error('Failed to hang up call', {
        correlationId,
        callSid,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      });

      throw this.handleTwilioError(error);
    }
  }

  /**
   * Cancel a call that hasn't been answered yet
   */
  async cancelCall(callSid: string): Promise<any> {
    const correlationId = randomUUID();
    const startTime = performance.now();

    try {
      this.logger.info('Canceling call', {
        correlationId,
        callSid,
      });

      const call = await this.updateCall(callSid, { status: 'canceled' });

      this.logger.info('Call canceled successfully', {
        correlationId,
        callSid,
        duration: performance.now() - startTime,
      });

      return call;
    } catch (error) {
      this.logger.error('Failed to cancel call', {
        correlationId,
        callSid,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      });

      throw this.handleTwilioError(error);
    }
  }

  // ===========================================================================
  // RECORDING MANAGEMENT
  // ===========================================================================

  /**
   * Start recording a call
   */
  async startRecording(callSid: string, options?: RecordingOptions): Promise<any> {
    const correlationId = randomUUID();
    const startTime = performance.now();

    try {
      this.logger.info('Starting call recording', {
        correlationId,
        callSid,
        options,
      });

      const recording = await this.executeWithRetry(async () => {
        return await this.client.calls(callSid).recordings.create(options as any);
      }, correlationId);

      this.logger.info('Call recording started successfully', {
        correlationId,
        callSid,
        recordingSid: recording.sid,
        duration: performance.now() - startTime,
      });

      return recording;
    } catch (error) {
      this.logger.error('Failed to start call recording', {
        correlationId,
        callSid,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      });

      throw this.handleTwilioError(error);
    }
  }

  /**
   * Stop recording a call
   */
  async stopRecording(callSid: string, recordingSid: string): Promise<any> {
    const correlationId = randomUUID();
    const startTime = performance.now();

    try {
      this.logger.info('Stopping call recording', {
        correlationId,
        callSid,
        recordingSid,
      });

      const recording = await this.executeWithRetry(async () => {
        return await this.client.calls(callSid).recordings(recordingSid).update({
          status: 'stopped',
        });
      }, correlationId);

      this.logger.info('Call recording stopped successfully', {
        correlationId,
        callSid,
        recordingSid,
        duration: performance.now() - startTime,
      });

      return recording;
    } catch (error) {
      this.logger.error('Failed to stop call recording', {
        correlationId,
        callSid,
        recordingSid,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      });

      throw this.handleTwilioError(error);
    }
  }

  /**
   * Pause recording a call
   */
  async pauseRecording(callSid: string, recordingSid: string): Promise<any> {
    const correlationId = randomUUID();
    const startTime = performance.now();

    try {
      this.logger.info('Pausing call recording', {
        correlationId,
        callSid,
        recordingSid,
      });

      const recording = await this.executeWithRetry(async () => {
        return await this.client.calls(callSid).recordings(recordingSid).update({
          status: 'paused',
        });
      }, correlationId);

      this.logger.info('Call recording paused successfully', {
        correlationId,
        callSid,
        recordingSid,
        duration: performance.now() - startTime,
      });

      return recording;
    } catch (error) {
      this.logger.error('Failed to pause call recording', {
        correlationId,
        callSid,
        recordingSid,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      });

      throw this.handleTwilioError(error);
    }
  }

  /**
   * Get recording details
   */
  async getRecording(recordingSid: string): Promise<any> {
    const correlationId = randomUUID();
    const startTime = performance.now();

    try {
      this.logger.info('Retrieving recording', {
        correlationId,
        recordingSid,
      });

      const recording = await this.executeWithRetry(async () => {
        return await this.client.recordings(recordingSid).fetch();
      }, correlationId);

      this.logger.info('Recording retrieved successfully', {
        correlationId,
        recordingSid,
        duration: performance.now() - startTime,
      });

      return recording;
    } catch (error) {
      this.logger.error('Failed to retrieve recording', {
        correlationId,
        recordingSid,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      });

      throw this.handleTwilioError(error);
    }
  }

  /**
   * Get recording URL
   */
  getRecordingUrl(recordingSid: string, format: 'mp3' | 'wav' = 'mp3'): string {
    return `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Recordings/${recordingSid}.${format}`;
  }

  /**
   * Delete a recording
   */
  async deleteRecording(recordingSid: string): Promise<void> {
    const correlationId = randomUUID();
    const startTime = performance.now();

    try {
      this.logger.info('Deleting recording', {
        correlationId,
        recordingSid,
      });

      await this.executeWithRetry(async () => {
        return await this.client.recordings(recordingSid).remove();
      }, correlationId);

      this.logger.info('Recording deleted successfully', {
        correlationId,
        recordingSid,
        duration: performance.now() - startTime,
      });
    } catch (error) {
      this.logger.error('Failed to delete recording', {
        correlationId,
        recordingSid,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      });

      throw this.handleTwilioError(error);
    }
  }

  /**
   * List recordings for a call
   */
  async listRecordings(callSid: string): Promise<any[]> {
    const correlationId = randomUUID();
    const startTime = performance.now();

    try {
      this.logger.info('Listing recordings for call', {
        correlationId,
        callSid,
      });

      const recordings = await this.executeWithRetry(async () => {
        return await this.client.calls(callSid).recordings.list();
      }, correlationId);

      this.logger.info('Recordings listed successfully', {
        correlationId,
        callSid,
        count: recordings.length,
        duration: performance.now() - startTime,
      });

      return recordings;
    } catch (error) {
      this.logger.error('Failed to list recordings', {
        correlationId,
        callSid,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      });

      throw this.handleTwilioError(error);
    }
  }

  // ===========================================================================
  // TWIML GENERATION
  // ===========================================================================

  /**
   * Generate TwiML for answering a call with a message
   */
  generateAnswerTwiML(message: string, options?: TwiMLOptions): string {
    const twiml = new TwiML.VoiceResponse();

    twiml.say(
      {
        voice: options?.voice || 'Polly.Joanna',
        language: (options?.language || 'en-US') as 'en-US',
      },
      message
    );

    return twiml.toString();
  }

  /**
   * Generate TwiML for gathering input (IVR)
   */
  generateGatherTwiML(
    message: string,
    action: string,
    options?: TwiMLOptions & { numDigits?: number; finishOnKey?: string }
  ): string {
    const twiml = new TwiML.VoiceResponse();

    const gather = twiml.gather({
      action,
      method: 'POST',
      numDigits: options?.numDigits || 1,
      timeout: options?.timeout || 5,
      finishOnKey: options?.finishOnKey || '#',
    });

    gather.say(
      {
        voice: options?.voice || 'Polly.Joanna',
        language: (options?.language || 'en-US') as 'en-US',
      },
      message
    );

    // If no input, repeat the message
    twiml.redirect(action);

    return twiml.toString();
  }

  /**
   * Generate TwiML for recording a message
   */
  generateRecordTwiML(
    message: string,
    action: string,
    options?: TwiMLOptions & { playBeep?: boolean }
  ): string {
    const twiml = new TwiML.VoiceResponse();

    twiml.say(
      {
        voice: options?.voice || 'Polly.Joanna',
        language: (options?.language || 'en-US') as 'en-US',
      },
      message
    );

    twiml.record({
      action,
      method: 'POST',
      maxLength: options?.maxLength || 120,
      timeout: options?.timeout || 5,
      playBeep: options?.playBeep ?? true,
      transcribe: true,
    });

    return twiml.toString();
  }

  /**
   * Generate TwiML for forwarding/transferring a call
   */
  generateTransferTwiML(
    to: string,
    message?: string,
    options?: TwiMLOptions
  ): string {
    const twiml = new TwiML.VoiceResponse();

    if (message) {
      twiml.say(
        {
          voice: options?.voice || 'Polly.Joanna',
          language: (options?.language || 'en-US') as 'en-US',
        },
        message
      );
    }

    twiml.dial(to);

    return twiml.toString();
  }

  /**
   * Generate TwiML for a conference
   */
  generateConferenceTwiML(
    conferenceName: string,
    options?: {
      startConferenceOnEnter?: boolean;
      endConferenceOnExit?: boolean;
      muted?: boolean;
      beep?: boolean | 'onEnter' | 'onExit';
      waitUrl?: string;
      statusCallback?: string;
    }
  ): string {
    const twiml = new TwiML.VoiceResponse();

    twiml.dial().conference(
      {
        startConferenceOnEnter: options?.startConferenceOnEnter ?? true,
        endConferenceOnExit: options?.endConferenceOnExit ?? false,
        muted: options?.muted ?? false,
        beep: options?.beep === false ? 'false' : options?.beep === true ? 'true' : (options?.beep ?? 'true') as 'true' | 'false' | 'onEnter' | 'onExit',
        waitUrl: options?.waitUrl,
        statusCallback: options?.statusCallback,
        statusCallbackEvent: ['start', 'end', 'join', 'leave'],
        statusCallbackMethod: 'POST',
      },
      conferenceName
    );

    return twiml.toString();
  }

  /**
   * Generate TwiML for hanging up
   */
  generateHangupTwiML(message?: string, options?: TwiMLOptions): string {
    const twiml = new TwiML.VoiceResponse();

    if (message) {
      twiml.say(
        {
          voice: options?.voice || 'Polly.Joanna',
          language: (options?.language || 'en-US') as 'en-US',
        },
        message
      );
    }

    twiml.hangup();

    return twiml.toString();
  }

  /**
   * Generate TwiML for playing audio
   */
  generatePlayTwiML(audioUrl: string, loop?: number): string {
    const twiml = new TwiML.VoiceResponse();

    twiml.play({ loop: loop || 1 }, audioUrl);

    return twiml.toString();
  }

  /**
   * Generate TwiML for SIP call
   */
  generateSipTwiML(
    sipUri: string,
    username?: string,
    password?: string
  ): string {
    const twiml = new TwiML.VoiceResponse();

    const dial = twiml.dial();

    dial.sip({
      username,
      password,
    }, sipUri);

    return twiml.toString();
  }

  // ===========================================================================
  // SMS MESSAGING
  // ===========================================================================

  /**
   * Send an SMS message
   */
  async sendSMS(options: SMSOptions): Promise<any> {
    const correlationId = randomUUID();
    const startTime = performance.now();

    try {
      // Validate destination number
      if (!options.to) {
        throw new TwilioValidationError('Destination number (to) is required');
      }

      if (!/^\+[1-9]\d{1,14}$/.test(options.to)) {
        throw new TwilioValidationError(
          'Destination number must be in E.164 format',
          { to: options.to }
        );
      }

      // Validate message body
      if (!options.body || options.body.trim().length === 0) {
        throw new TwilioValidationError('Message body is required');
      }

      this.logger.info('Sending SMS', {
        correlationId,
        to: options.to,
        from: options.from || this.config.defaultFrom,
        bodyLength: options.body.length,
      });

      // Prepare message options
      const messageOptions: any = {
        to: options.to,
        body: options.body,
      };

      // Use messaging service SID or from number
      if (options.messagingServiceSid) {
        messageOptions.messagingServiceSid = options.messagingServiceSid;
      } else {
        messageOptions.from = options.from || this.config.defaultFrom;
      }

      // Add optional parameters
      if (options.mediaUrl) messageOptions.mediaUrl = options.mediaUrl;
      if (options.statusCallback) messageOptions.statusCallback = options.statusCallback;
      if (options.maxPrice !== undefined) messageOptions.maxPrice = options.maxPrice;
      if (options.provideFeedback !== undefined) messageOptions.provideFeedback = options.provideFeedback;

      // Execute send with retry logic
      const message = await this.executeWithRetry(async () => {
        return await this.client.messages.create(messageOptions);
      }, correlationId);

      this.logger.info('SMS sent successfully', {
        correlationId,
        messageSid: message.sid,
        status: message.status,
        duration: performance.now() - startTime,
      });

      return message;
    } catch (error) {
      this.logger.error('Failed to send SMS', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      });

      throw this.handleTwilioError(error);
    }
  }

  /**
   * Get SMS message details
   */
  async getMessage(messageSid: string): Promise<any> {
    const correlationId = randomUUID();
    const startTime = performance.now();

    try {
      this.logger.info('Retrieving message details', {
        correlationId,
        messageSid,
      });

      const message = await this.executeWithRetry(async () => {
        return await this.client.messages(messageSid).fetch();
      }, correlationId);

      this.logger.info('Message details retrieved successfully', {
        correlationId,
        messageSid,
        duration: performance.now() - startTime,
      });

      return message;
    } catch (error) {
      this.logger.error('Failed to retrieve message details', {
        correlationId,
        messageSid,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime,
      });

      throw this.handleTwilioError(error);
    }
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Rate limiting check
   * Prevents exceeding Twilio API rate limits
   */
  private checkRateLimit(key: string, maxRequests: number = 100, windowMs: number = 60000): void {
    const now = Date.now();
    const requests = this.rateLimitCache.get(key) || [];

    // Filter out requests outside the time window
    const recentRequests = requests.filter((timestamp) => now - timestamp < windowMs);

    if (recentRequests.length >= maxRequests) {
      throw new TwilioServiceError(
        'Rate limit exceeded',
        'RATE_LIMIT_EXCEEDED',
        { key, maxRequests, windowMs }
      );
    }

    recentRequests.push(now);
    this.rateLimitCache.set(key, recentRequests);
  }

  /**
   * Execute operation with exponential backoff retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    correlationId: string,
    attempt: number = 1,
    operationType: string = 'api_call'
  ): Promise<T> {
    try {
      // Check rate limit before executing (use operation type, not correlationId)
      this.checkRateLimit(`twilio_${operationType}`);

      return await operation();
    } catch (error) {
      if (attempt >= (this.config.retryAttempts ?? 3)) {
        throw error;
      }

      // Check if error is retryable
      if (this.isRetryableError(error)) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);

        this.logger.warn('Retrying operation after error', {
          correlationId,
          attempt,
          backoffMs,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        return this.executeWithRetry(operation, correlationId, attempt + 1, operationType);
      }

      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'status' in error) {
      const statusCode = (error as any).status;
      // Retry on 429 (rate limit), 500, 502, 503, 504
      return [429, 500, 502, 503, 504].includes(statusCode);
    }
    return false;
  }

  /**
   * Handle and transform Twilio errors
   */
  private handleTwilioError(error: unknown): TwilioServiceError {
    if (error && typeof error === 'object') {
      const twilioError = error as any;

      // Handle authentication errors
      if (twilioError.status === 401 || twilioError.status === 403) {
        return new TwilioAuthError(
          twilioError.message || 'Authentication failed',
          twilioError
        );
      }

      // Handle validation errors
      if (twilioError.status === 400 || twilioError.status === 422) {
        return new TwilioValidationError(
          twilioError.message || 'Validation failed',
          twilioError
        );
      }

      // Handle other errors
      return new TwilioServiceError(
        twilioError.message || 'Twilio API error',
        twilioError.code || 'UNKNOWN_ERROR',
        twilioError
      );
    }

    return new TwilioServiceError(
      error instanceof Error ? error.message : 'Unknown error',
      'UNKNOWN_ERROR'
    );
  }

  /**
   * Mask sensitive data for logging
   */
  private maskSensitive(value: string): string {
    if (!value) return '';
    if (value.length <= 8) return '***';
    return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
  }

  /**
   * Get available Des Moines phone numbers
   */
  getAvailablePhoneNumbers(): typeof DSM_PHONE_NUMBERS {
    return DSM_PHONE_NUMBERS;
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    return /^\+[1-9]\d{1,14}$/.test(phoneNumber);
  }

  /**
   * Format phone number to E.164
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');

    // If it's a 10-digit US number, add +1
    if (digits.length === 10) {
      return `+1${digits}`;
    }

    // If it's already 11 digits starting with 1, add +
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }

    // Otherwise, return as is (might be invalid)
    return phoneNumber;
  }
}

// =============================================================================
// SINGLETON INSTANCE EXPORT
// =============================================================================

/**
 * Singleton instance for convenience
 * Can be initialized once and imported throughout the application
 */
let twilioServiceInstance: TwilioService | null = null;

export const getTwilioService = (): TwilioService => {
  if (!twilioServiceInstance) {
    twilioServiceInstance = new TwilioService();
  }
  return twilioServiceInstance;
};

// Named exports
export {
  TwilioServiceError,
  TwilioAuthError,
  TwilioValidationError,
};

export type {
  TwilioServiceConfig,
  OutboundCallOptions,
  CallUpdateOptions,
  RecordingOptions,
  RecordingUpdateOptions,
  TransferOptions,
  SMSOptions,
  TwiMLOptions,
  WebhookVerificationResult,
};
