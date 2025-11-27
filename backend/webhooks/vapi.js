// Last Modified: 2025-11-23 17:30
/**
 * Vapi Webhook Handler
 * Processes webhook events from Vapi voice AI system
 */

import express from 'express';
import vapiService from '../services/vapi.js';
import logger from '../config/logger.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * POST /api/webhooks/vapi
 * Main webhook endpoint for all Vapi events
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const event = req.body;

    logger.info('Received Vapi webhook:', {
      type: event.type,
      callId: event.callId,
      timestamp: new Date().toISOString()
    });

    try {
      const result = await vapiService.handleWebhook(event);

      res.json({
        success: true,
        message: 'Webhook processed successfully',
        ...result
      });
    } catch (error) {
      logger.error('Error processing Vapi webhook:', error);

      // Still return 200 to Vapi to avoid retries on unrecoverable errors
      res.json({
        success: false,
        error: error.message
      });
    }
  })
);

/**
 * POST /api/webhooks/vapi/call-started
 * Specific endpoint for call started events
 */
router.post(
  '/call-started',
  asyncHandler(async (req, res) => {
    const event = { ...req.body, type: 'call-started' };

    logger.info('Call started webhook:', { callId: event.callId });

    const result = await vapiService.handleWebhook(event);

    res.json({
      success: true,
      ...result
    });
  })
);

/**
 * POST /api/webhooks/vapi/call-ended
 * Specific endpoint for call ended events
 */
router.post(
  '/call-ended',
  asyncHandler(async (req, res) => {
    const event = { ...req.body, type: 'call-ended' };

    logger.info('Call ended webhook:', {
      callId: event.callId,
      duration: event.duration
    });

    const result = await vapiService.handleWebhook(event);

    res.json({
      success: true,
      ...result
    });
  })
);

/**
 * POST /api/webhooks/vapi/function-call
 * Specific endpoint for function call events
 */
router.post(
  '/function-call',
  asyncHandler(async (req, res) => {
    const event = { ...req.body, type: 'function-call' };

    logger.info('Function call webhook:', {
      callId: event.callId,
      functionName: event.functionName
    });

    const result = await vapiService.handleWebhook(event);

    res.json({
      success: true,
      ...result
    });
  })
);

/**
 * POST /api/webhooks/vapi/transcript
 * Specific endpoint for transcript events
 */
router.post(
  '/transcript',
  asyncHandler(async (req, res) => {
    const event = { ...req.body, type: 'transcript' };

    logger.info('Transcript webhook:', {
      callId: event.callId,
      speaker: event.speaker
    });

    const result = await vapiService.handleWebhook(event);

    res.json({
      success: true,
      ...result
    });
  })
);

/**
 * POST /api/webhooks/vapi/status-update
 * Specific endpoint for status update events
 */
router.post(
  '/status-update',
  asyncHandler(async (req, res) => {
    const event = { ...req.body, type: 'status-update' };

    logger.info('Status update webhook:', {
      callId: event.callId,
      status: event.status
    });

    const result = await vapiService.handleWebhook(event);

    res.json({
      success: true,
      ...result
    });
  })
);

/**
 * GET /api/webhooks/vapi/health
 * Health check for webhook endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Vapi webhook endpoint is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
