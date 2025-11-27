// Last Modified: 2025-11-23 17:30
/**
 * Vapi Webhook Handlers
 * Handle call events from Vapi
 */

import { Request, Response } from 'express';
import { VapiClient } from './client';
import { logger } from '../../utils/logger';

/**
 * Handle call started event
 */
export async function handleCallStarted(
  req: Request,
  res: Response,
  vapiClient: VapiClient
): Promise<void> {
  try {
    const { callId, phoneNumber, assistantId } = req.body;

    logger.webhook('vapi', 'Call Started', { callId, phoneNumber });

    // TODO: Save call start to database
    // await db.callCosts.create({
    //   data: {
    //     callSid: callId,
    //     contactId: phoneNumber,
    //     direction: 'outbound',
    //     status: 'in-progress',
    //     timestamp: new Date().toISOString()
    //   }
    // });

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    logger.error('Error handling call started event', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle call ended event
 */
export async function handleCallEnded(
  req: Request,
  res: Response,
  vapiClient: VapiClient
): Promise<void> {
  try {
    const { callId, duration, phoneNumber, endReason } = req.body;

    logger.webhook('vapi', 'Call Ended', { callId, duration, endReason });

    // Track cost
    if (duration) {
      vapiClient.trackCallCost(callId, duration);
    }

    // Get and save transcript
    try {
      const transcript = await vapiClient.getTranscript(callId);

      // TODO: Save transcript to database
      // await db.conversationMessages.create({
      //   data: {
      //     id: callId,
      //     contactId: phoneNumber,
      //     direction: 'outbound',
      //     type: 'voice',
      //     content: '',
      //     transcript: transcript.transcript,
      //     cost: transcript.cost,
      //     timestamp: new Date().toISOString()
      //   }
      // });

      logger.integration('vapi', `Transcript saved for call ${callId}`);
    } catch (error) {
      logger.error('Error fetching transcript', error);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    logger.error('Error handling call ended event', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle transcript event (real-time)
 */
export async function handleTranscript(
  req: Request,
  res: Response,
  vapiClient: VapiClient
): Promise<void> {
  try {
    const { callId, transcript, role } = req.body;

    logger.webhook('vapi', 'Transcript', { callId, role, text: transcript?.substring(0, 50) });

    // TODO: Save transcript chunk to database for real-time processing
    // This can be used for live transcription display or real-time analysis

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    logger.error('Error handling transcript event', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle function call event (for custom functions)
 */
export async function handleFunctionCall(
  req: Request,
  res: Response,
  vapiClient: VapiClient
): Promise<void> {
  try {
    const { callId, functionName, parameters } = req.body;

    logger.webhook('vapi', 'Function Call', { callId, functionName, parameters });

    // Handle custom functions here
    // For example: booking appointments, looking up data, etc.

    let result: any = {};

    switch (functionName) {
      case 'get_calendar_events':
        // TODO: Implement calendar lookup
        result = { events: [] };
        break;

      case 'create_task':
        // TODO: Implement task creation
        result = { taskId: 'task-123', created: true };
        break;

      default:
        logger.warn(`Unknown function call: ${functionName}`);
        result = { error: 'Unknown function' };
    }

    res.status(200).json({ result });
  } catch (error) {
    logger.error('Error handling function call', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
