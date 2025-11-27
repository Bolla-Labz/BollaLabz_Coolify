// Last Modified: 2025-11-23 17:30
import express from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../../../middleware/errorHandler.js';
import { handleValidationErrors } from '../../../validators/common.js';
import { writeLimiter, webhookLimiter } from '../../../middleware/rateLimiter.js';
import logger from '../../../config/logger.js';

const router = express.Router();

// POST /api/v1/integrations/webhook - Generic webhook receiver
// Note: webhookLimiter is already applied in server.js for /api/v1/webhooks
router.post(
  '/webhook',
  [
    body('source').notEmpty().isString(),
    body('event').notEmpty().isString(),
    body('payload').notEmpty().isObject()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { source, event, payload } = req.body;

    logger.info('Webhook received', {
      source,
      event,
      timestamp: new Date().toISOString()
    });

    // Here you would typically:
    // 1. Validate the webhook signature
    // 2. Process the event based on source
    // 3. Trigger workflows
    // 4. Store relevant data

    res.json({
      success: true,
      message: 'Webhook received successfully',
      received_at: new Date().toISOString(),
      data: {
        source,
        event,
        processed: true
      }
    });
  })
);

// POST /api/v1/integrations/twilio/incoming - Twilio webhook (future)
// Note: webhookLimiter applied at server level for webhook routes
router.post(
  '/twilio/incoming',
  asyncHandler(async (req, res) => {
    logger.info('Twilio webhook received', req.body);

    // TwiML response placeholder
    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thank you for calling. This feature is coming soon.</Say>
</Response>`);
  })
);

// POST /api/v1/integrations/elevenlabs/callback - ElevenLabs callback (future)
// Note: webhookLimiter applied at server level for webhook routes
router.post(
  '/elevenlabs/callback',
  asyncHandler(async (req, res) => {
    logger.info('ElevenLabs callback received', req.body);

    res.json({
      success: true,
      message: 'Callback received'
    });
  })
);

// GET /api/v1/integrations/status - Get integration status
router.get(
  '/status',
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      integrations: {
        twilio: {
          configured: !!process.env.TWILIO_ACCOUNT_SID,
          status: 'pending'
        },
        elevenlabs: {
          configured: !!process.env.ELEVENLABS_API_KEY,
          status: 'pending'
        },
        anthropic: {
          configured: !!process.env.ANTHROPIC_API_KEY,
          status: 'pending'
        }
      }
    });
  })
);

export default router;
