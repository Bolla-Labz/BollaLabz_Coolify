// Last Modified: 2025-11-23 17:30
/**
 * Webhook Router
 * Central routing for all webhook endpoints
 */

import { Router } from 'express';
import { createTwilioClient } from '../integrations/twilio/client';
import { createVapiClient } from '../integrations/vapi/client';
import {
  handleIncomingSms,
  handleIncomingCall,
  handleCallStatus,
  handleSmsStatus,
} from '../integrations/twilio/webhooks';
import {
  handleCallStarted,
  handleCallEnded,
  handleTranscript,
  handleFunctionCall,
} from '../integrations/vapi/webhooks';
import {
  webhookRateLimit,
  validateTwilioSignature,
  validateVapiSignature,
  validateWebhookRequest,
  logWebhookRequest,
} from '../middleware/webhook-security';

export function createWebhookRouter(): Router {
  const router = Router();

  // Initialize clients
  const twilioClient = createTwilioClient();
  const vapiClient = createVapiClient();

  // Apply rate limiting to all webhook routes
  router.use(webhookRateLimit);

  // Twilio Webhooks
  router.post(
    '/twilio/sms',
    validateWebhookRequest,
    logWebhookRequest('twilio'),
    validateTwilioSignature(process.env.TWILIO_AUTH_TOKEN!),
    async (req, res) => {
      await handleIncomingSms(req, res, twilioClient);
    }
  );

  router.post(
    '/twilio/voice',
    validateWebhookRequest,
    logWebhookRequest('twilio'),
    validateTwilioSignature(process.env.TWILIO_AUTH_TOKEN!),
    async (req, res) => {
      await handleIncomingCall(req, res, twilioClient);
    }
  );

  router.post(
    '/twilio/call-status',
    validateWebhookRequest,
    logWebhookRequest('twilio'),
    validateTwilioSignature(process.env.TWILIO_AUTH_TOKEN!),
    async (req, res) => {
      await handleCallStatus(req, res, twilioClient);
    }
  );

  router.post(
    '/twilio/sms-status',
    validateWebhookRequest,
    logWebhookRequest('twilio'),
    validateTwilioSignature(process.env.TWILIO_AUTH_TOKEN!),
    async (req, res) => {
      await handleSmsStatus(req, res, twilioClient);
    }
  );

  // Vapi Webhooks
  const vapiSecret = process.env.VAPI_WEBHOOK_SECRET || 'default-secret';

  router.post(
    '/vapi/call-started',
    validateWebhookRequest,
    logWebhookRequest('vapi'),
    // validateVapiSignature(vapiSecret), // Uncomment when Vapi signature is configured
    async (req, res) => {
      await handleCallStarted(req, res, vapiClient);
    }
  );

  router.post(
    '/vapi/call-ended',
    validateWebhookRequest,
    logWebhookRequest('vapi'),
    // validateVapiSignature(vapiSecret), // Uncomment when Vapi signature is configured
    async (req, res) => {
      await handleCallEnded(req, res, vapiClient);
    }
  );

  router.post(
    '/vapi/transcript',
    validateWebhookRequest,
    logWebhookRequest('vapi'),
    // validateVapiSignature(vapiSecret), // Uncomment when Vapi signature is configured
    async (req, res) => {
      await handleTranscript(req, res, vapiClient);
    }
  );

  router.post(
    '/vapi/function-call',
    validateWebhookRequest,
    logWebhookRequest('vapi'),
    // validateVapiSignature(vapiSecret), // Uncomment when Vapi signature is configured
    async (req, res) => {
      await handleFunctionCall(req, res, vapiClient);
    }
  );

  return router;
}
