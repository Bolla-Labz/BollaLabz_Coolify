// Last Modified: 2025-11-23 17:30
/**
 * Integration Test Endpoints
 * Test endpoints for each integration
 */

import { Router, Request, Response } from 'express';
import { createTwilioClient } from '../integrations/twilio/client';
import { createVapiClient } from '../integrations/vapi/client';
import { createElevenLabsClient } from '../integrations/elevenlabs/client';
import { createAnthropicClient } from '../integrations/anthropic/client';
import { costTracker } from '../utils/cost-tracker';
import { logger } from '../utils/logger';

export function createTestRouter(): Router {
  const router = Router();

  /**
   * Test Twilio SMS
   */
  router.post('/twilio/sms', async (req: Request, res: Response) => {
    try {
      const { to, message } = req.body;

      if (!to || !message) {
        res.status(400).json({ error: 'Missing required fields: to, message' });
        return;
      }

      const twilioClient = createTwilioClient();
      const result = await twilioClient.sendSms(to, message);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Test SMS failed', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Test Twilio Voice Call
   */
  router.post('/twilio/call', async (req: Request, res: Response) => {
    try {
      const { to, twimlUrl } = req.body;

      if (!to || !twimlUrl) {
        res.status(400).json({ error: 'Missing required fields: to, twimlUrl' });
        return;
      }

      const twilioClient = createTwilioClient();
      const result = await twilioClient.initiateCall(to, twimlUrl);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Test call failed', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Test Vapi AI Call
   */
  router.post('/vapi/call', async (req: Request, res: Response) => {
    try {
      const { phoneNumber, assistantId, name } = req.body;

      if (!phoneNumber) {
        res.status(400).json({ error: 'Missing required field: phoneNumber' });
        return;
      }

      const vapiClient = createVapiClient();
      const result = await vapiClient.startCall({
        phoneNumber,
        assistantId,
        name,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Test Vapi call failed', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Test Vapi Transcript
   */
  router.get('/vapi/transcript/:callId', async (req: Request, res: Response) => {
    try {
      const { callId } = req.params;

      const vapiClient = createVapiClient();
      const result = await vapiClient.getTranscript(callId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Test transcript retrieval failed', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Test ElevenLabs TTS
   */
  router.post('/elevenlabs/tts', async (req: Request, res: Response) => {
    try {
      const { text, voiceId } = req.body;

      if (!text) {
        res.status(400).json({ error: 'Missing required field: text' });
        return;
      }

      const elevenLabsClient = createElevenLabsClient();
      const audioBuffer = await elevenLabsClient.textToSpeech(text, { voiceId });

      res.set('Content-Type', 'audio/mpeg');
      res.send(audioBuffer);
    } catch (error: any) {
      logger.error('Test TTS failed', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Test ElevenLabs Voices List
   */
  router.get('/elevenlabs/voices', async (req: Request, res: Response) => {
    try {
      const elevenLabsClient = createElevenLabsClient();
      const voices = await elevenLabsClient.listVoices();

      res.json({
        success: true,
        data: voices,
      });
    } catch (error: any) {
      logger.error('Test voices list failed', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Test Anthropic Message Analysis
   */
  router.post('/anthropic/analyze', async (req: Request, res: Response) => {
    try {
      const { message, context } = req.body;

      if (!message) {
        res.status(400).json({ error: 'Missing required field: message' });
        return;
      }

      const anthropicClient = createAnthropicClient();
      const result = await anthropicClient.analyzeMessage(message, context);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Test analysis failed', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Test Anthropic Response Generation
   */
  router.post('/anthropic/respond', async (req: Request, res: Response) => {
    try {
      const { message, context, systemContext } = req.body;

      if (!message) {
        res.status(400).json({ error: 'Missing required field: message' });
        return;
      }

      const anthropicClient = createAnthropicClient();
      const response = await anthropicClient.generateResponse(
        message,
        context,
        systemContext
      );

      res.json({
        success: true,
        data: { response },
      });
    } catch (error: any) {
      logger.error('Test response generation failed', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Test Anthropic Task Extraction
   */
  router.post('/anthropic/extract-tasks', async (req: Request, res: Response) => {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: 'Missing required field: messages (array)' });
        return;
      }

      const anthropicClient = createAnthropicClient();
      const result = await anthropicClient.extractTasks(messages);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Test task extraction failed', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Get current costs
   */
  router.get('/costs/current', async (req: Request, res: Response) => {
    try {
      const breakdown = costTracker.getCostBreakdown();
      const total = costTracker.getTotalCost();
      const allCosts = costTracker.getAllCosts();

      res.json({
        success: true,
        data: {
          breakdown,
          total,
          details: allCosts,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get costs', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * Health check
   */
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
