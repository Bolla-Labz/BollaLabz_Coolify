// Last Modified: 2025-11-23 17:30
/**
 * Twilio Integration Client
 * Handles SMS and Voice operations
 */

import twilio from 'twilio';
import { TwilioConfig, ConversationMessage, CallRecord } from '../../types';
import { retryWithBackoff } from '../../utils/retry';
import { costTracker, calculateTwilioSmsCost, calculateTwilioVoiceCost } from '../../utils/cost-tracker';
import { logger } from '../../utils/logger';

export class TwilioClient {
  private client: twilio.Twilio;
  private config: TwilioConfig;

  constructor(config: TwilioConfig) {
    this.config = config;
    this.client = twilio(config.accountSid, config.authToken);
    logger.integration('twilio', 'Client initialized');
  }

  /**
   * Send SMS
   */
  async sendSms(to: string, message: string): Promise<ConversationMessage> {
    logger.integration('twilio', `Sending SMS to ${to}`);

    const result = await retryWithBackoff(async () => {
      return await this.client.messages.create({
        body: message,
        from: this.config.phoneNumber,
        to,
        statusCallback: this.config.statusCallbackUrl,
      });
    });

    const cost = calculateTwilioSmsCost('outbound');

    costTracker.trackCost({
      service: 'twilio',
      type: 'sms',
      cost,
      metadata: {
        messageSid: result.sid,
        to,
      },
    });

    const conversationMessage: ConversationMessage = {
      id: result.sid,
      contactId: to,
      direction: 'outbound',
      type: 'sms',
      content: message,
      cost,
      metadata: {
        status: result.status,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
      },
      timestamp: new Date().toISOString(),
    };

    logger.integration('twilio', `SMS sent successfully (${result.sid})`);
    return conversationMessage;
  }

  /**
   * Initiate outbound call
   */
  async initiateCall(
    to: string,
    twimlUrl: string,
    options?: {
      record?: boolean;
      statusCallback?: string;
      machineDetection?: 'Enable' | 'DetectMessageEnd';
    }
  ): Promise<CallRecord> {
    logger.integration('twilio', `Initiating call to ${to}`);

    const result = await retryWithBackoff(async () => {
      return await this.client.calls.create({
        to,
        from: this.config.phoneNumber,
        url: twimlUrl,
        record: options?.record,
        statusCallback: options?.statusCallback || this.config.statusCallbackUrl,
        machineDetection: options?.machineDetection,
      });
    });

    const callRecord: CallRecord = {
      id: result.sid,
      contactId: to,
      direction: 'outbound',
      duration: 0, // Will be updated when call completes
      cost: 0, // Will be updated when call completes
      status: 'completed',
      metadata: {
        callSid: result.sid,
        status: result.status,
      },
      timestamp: new Date().toISOString(),
    };

    logger.integration('twilio', `Call initiated (${result.sid})`);
    return callRecord;
  }

  /**
   * Download call recording
   */
  async getCallRecording(recordingSid: string): Promise<Buffer> {
    logger.integration('twilio', `Fetching recording ${recordingSid}`);

    const recording = await retryWithBackoff(async () => {
      return await this.client.recordings(recordingSid).fetch();
    });

    // Download recording media
    const mediaUrl = `https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`;

    const response = await fetch(mediaUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${this.config.accountSid}:${this.config.authToken}`
        ).toString('base64')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download recording: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    logger.integration('twilio', `Recording downloaded (${recordingSid})`);

    return Buffer.from(buffer);
  }

  /**
   * Get call details
   */
  async getCallDetails(callSid: string): Promise<any> {
    logger.integration('twilio', `Fetching call details ${callSid}`);

    const call = await retryWithBackoff(async () => {
      return await this.client.calls(callSid).fetch();
    });

    return call;
  }

  /**
   * Get message details
   */
  async getMessageDetails(messageSid: string): Promise<any> {
    logger.integration('twilio', `Fetching message details ${messageSid}`);

    const message = await retryWithBackoff(async () => {
      return await this.client.messages(messageSid).fetch();
    });

    return message;
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(
    url: string,
    params: Record<string, any>,
    signature: string
  ): boolean {
    return twilio.validateRequest(
      this.config.authToken,
      signature,
      url,
      params
    );
  }

  /**
   * Track call completion and cost
   */
  trackCallCost(callSid: string, durationSeconds: number, direction: 'inbound' | 'outbound'): void {
    const cost = calculateTwilioVoiceCost(direction, durationSeconds);

    costTracker.trackCost({
      service: 'twilio',
      type: 'voice',
      cost,
      units: durationSeconds,
      metadata: {
        callSid,
        duration: durationSeconds,
        direction,
      },
    });

    logger.cost('twilio', cost, `Call ${callSid} - ${durationSeconds}s`);
  }
}

/**
 * Create Twilio client from environment variables
 */
export function createTwilioClient(): TwilioClient {
  const config: TwilioConfig = {
    accountSid: process.env.TWILIO_ACCOUNT_SID!,
    authToken: process.env.TWILIO_AUTH_TOKEN!,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER!,
    statusCallbackUrl: process.env.TWILIO_STATUS_CALLBACK_URL,
  };

  if (!config.accountSid || !config.authToken || !config.phoneNumber) {
    throw new Error('Missing required Twilio configuration');
  }

  return new TwilioClient(config);
}
