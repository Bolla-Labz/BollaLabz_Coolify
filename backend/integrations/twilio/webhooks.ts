// Last Modified: 2025-11-23 17:30
/**
 * Twilio Webhook Handlers
 * Handle incoming SMS and Voice webhooks from Twilio
 */

import { Request, Response } from 'express';
import { TwilioClient } from './client';
import { ConversationMessage } from '../../types';
import { costTracker, calculateTwilioSmsCost, calculateTwilioVoiceCost } from '../../utils/cost-tracker';
import { logger } from '../../utils/logger';

/**
 * Handle incoming SMS webhook
 */
export async function handleIncomingSms(
  req: Request,
  res: Response,
  twilioClient: TwilioClient
): Promise<void> {
  try {
    const { From, To, Body, MessageSid, MessageStatus } = req.body;

    logger.webhook('twilio', 'Incoming SMS', { from: From, messageSid: MessageSid });

    // Validate webhook signature
    const signature = req.headers['x-twilio-signature'] as string;
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    if (!twilioClient.validateWebhookSignature(url, req.body, signature)) {
      logger.error('Invalid Twilio webhook signature');
      res.status(403).send('Invalid signature');
      return;
    }

    // Track cost
    const cost = calculateTwilioSmsCost('inbound');
    costTracker.trackCost({
      service: 'twilio',
      type: 'sms',
      cost,
      metadata: {
        messageSid: MessageSid,
        from: From,
      },
    });

    // Create conversation message
    const message: ConversationMessage = {
      id: MessageSid,
      contactId: From,
      direction: 'inbound',
      type: 'sms',
      content: Body,
      cost,
      metadata: {
        status: MessageStatus,
        to: To,
      },
      timestamp: new Date().toISOString(),
    };

    // TODO: Save to database
    // await db.conversationMessages.create({ data: message });

    logger.integration('twilio', `SMS received from ${From}`);

    // Respond with TwiML (optional - can send auto-reply)
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <!-- Optional: Send auto-reply -->
  <!-- <Message>Thanks for your message!</Message> -->
</Response>`);
  } catch (error) {
    logger.error('Error handling incoming SMS', error);
    res.status(500).send('Error processing SMS');
  }
}

/**
 * Handle incoming voice call webhook
 */
export async function handleIncomingCall(
  req: Request,
  res: Response,
  twilioClient: TwilioClient
): Promise<void> {
  try {
    const { From, To, CallSid, CallStatus } = req.body;

    logger.webhook('twilio', 'Incoming Call', { from: From, callSid: CallSid });

    // Validate webhook signature
    const signature = req.headers['x-twilio-signature'] as string;
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    if (!twilioClient.validateWebhookSignature(url, req.body, signature)) {
      logger.error('Invalid Twilio webhook signature');
      res.status(403).send('Invalid signature');
      return;
    }

    // Respond with TwiML to handle the call
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello! You have reached BollaLabz. Please hold while we connect you.</Say>
  <!-- Can forward to Vapi or handle with TwiML -->
  <Dial>${process.env.FORWARD_NUMBER || ''}</Dial>
</Response>`);
  } catch (error) {
    logger.error('Error handling incoming call', error);
    res.status(500).send('Error processing call');
  }
}

/**
 * Handle call status updates
 */
export async function handleCallStatus(
  req: Request,
  res: Response,
  twilioClient: TwilioClient
): Promise<void> {
  try {
    const {
      CallSid,
      CallStatus,
      CallDuration,
      Direction,
      RecordingUrl,
      RecordingSid,
    } = req.body;

    logger.webhook('twilio', 'Call Status Update', {
      callSid: CallSid,
      status: CallStatus,
      duration: CallDuration,
    });

    // Validate webhook signature
    const signature = req.headers['x-twilio-signature'] as string;
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    if (!twilioClient.validateWebhookSignature(url, req.body, signature)) {
      logger.error('Invalid Twilio webhook signature');
      res.status(403).send('Invalid signature');
      return;
    }

    // Track call cost when completed
    if (CallStatus === 'completed' && CallDuration) {
      const direction = Direction === 'inbound' ? 'inbound' : 'outbound';
      twilioClient.trackCallCost(CallSid, parseInt(CallDuration), direction);

      // TODO: Update call record in database
      // await db.callCosts.update({
      //   where: { callSid: CallSid },
      //   data: { duration: CallDuration, status: CallStatus }
      // });

      // Download recording if available
      if (RecordingSid) {
        try {
          const recording = await twilioClient.getCallRecording(RecordingSid);
          // TODO: Save recording to storage
          logger.integration('twilio', `Recording downloaded for call ${CallSid}`);
        } catch (error) {
          logger.error('Error downloading recording', error);
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error('Error handling call status', error);
    res.status(500).send('Error processing status');
  }
}

/**
 * Handle SMS status updates
 */
export async function handleSmsStatus(
  req: Request,
  res: Response,
  twilioClient: TwilioClient
): Promise<void> {
  try {
    const { MessageSid, MessageStatus, ErrorCode } = req.body;

    logger.webhook('twilio', 'SMS Status Update', {
      messageSid: MessageSid,
      status: MessageStatus,
      errorCode: ErrorCode,
    });

    // Validate webhook signature
    const signature = req.headers['x-twilio-signature'] as string;
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    if (!twilioClient.validateWebhookSignature(url, req.body, signature)) {
      logger.error('Invalid Twilio webhook signature');
      res.status(403).send('Invalid signature');
      return;
    }

    // TODO: Update message status in database
    // await db.conversationMessages.update({
    //   where: { id: MessageSid },
    //   data: { status: MessageStatus, errorCode: ErrorCode }
    // });

    res.status(200).send('OK');
  } catch (error) {
    logger.error('Error handling SMS status', error);
    res.status(500).send('Error processing status');
  }
}
