// Last Modified: 2025-11-23 17:30
/**
 * Twilio Webhook Routes
 * Handles inbound SMS and message status updates from Twilio
 */

import express from 'express';
import twilioService from '../../../services/twilio.js';
import logger from '../../../config/logger.js';

const router = express.Router();

/**
 * Middleware to validate Twilio webhook signature
 */
const validateTwilioSignature = (req, res, next) => {
  // Skip validation in development if explicitly disabled
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_TWILIO_SIGNATURE_VALIDATION === 'true') {
    logger.warn('Skipping Twilio signature validation in development mode');
    return next();
  }

  const signature = req.headers['x-twilio-signature'];
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  if (!signature) {
    logger.warn('Missing Twilio signature header');
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Missing Twilio signature'
    });
  }

  // Validate signature
  const isValid = twilioService.validateWebhookSignature(
    signature,
    url,
    req.body
  );

  if (!isValid) {
    logger.error('Invalid Twilio webhook signature', {
      url,
      signature,
      body: req.body
    });
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid Twilio signature'
    });
  }

  next();
};

/**
 * @route   POST /api/v1/webhooks/twilio/sms
 * @desc    Receive inbound SMS from Twilio
 * @access  Public (validated by Twilio signature)
 */
router.post('/sms', validateTwilioSignature, async (req, res) => {
  try {
    logger.info('Received inbound SMS webhook from Twilio', {
      from: req.body.From,
      to: req.body.To,
      messageSid: req.body.MessageSid
    });

    // Store the inbound SMS
    const result = await twilioService.storeInboundSMS(req.body);

    logger.info(`Inbound SMS processed successfully. Message ID: ${result.message.id}`);

    // Respond to Twilio with TwiML (empty response to acknowledge)
    res.type('text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  } catch (error) {
    logger.error('Error processing inbound SMS webhook:', error);

    // Still respond with 200 to prevent Twilio retries
    res.type('text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
});

/**
 * @route   POST /api/v1/webhooks/twilio/status
 * @desc    Receive message status updates from Twilio
 * @access  Public (validated by Twilio signature)
 */
router.post('/status', validateTwilioSignature, async (req, res) => {
  try {
    logger.info('Received message status webhook from Twilio', {
      messageSid: req.body.MessageSid,
      messageStatus: req.body.MessageStatus
    });

    // Update message status in database
    await twilioService.updateMessageStatus(
      req.body.MessageSid,
      req.body.MessageStatus,
      {
        price: req.body.Price,
        priceUnit: req.body.PriceUnit,
        errorCode: req.body.ErrorCode,
        errorMessage: req.body.ErrorMessage
      }
    );

    logger.info(`Message status updated: ${req.body.MessageSid} -> ${req.body.MessageStatus}`);

    // Acknowledge receipt
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error processing status webhook:', error);

    // Still respond with 200 to prevent Twilio retries
    res.status(200).json({ success: true });
  }
});

/**
 * @route   GET /api/v1/webhooks/twilio/test
 * @desc    Test endpoint for webhook configuration
 * @access  Public
 */
router.get('/test', (req, res) => {
  res.status(200).json({
    message: 'Twilio webhook endpoint is active',
    endpoints: {
      inboundSMS: '/api/v1/webhooks/twilio/sms',
      statusCallback: '/api/v1/webhooks/twilio/status'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   POST /api/v1/webhooks/twilio/voice
 * @desc    Receive inbound voice calls (placeholder for future implementation)
 * @access  Public (validated by Twilio signature)
 */
router.post('/voice', validateTwilioSignature, async (req, res) => {
  try {
    logger.info('Received inbound voice call webhook from Twilio', {
      from: req.body.From,
      to: req.body.To,
      callSid: req.body.CallSid
    });

    // Respond with TwiML to handle the call
    // For now, just play a greeting and hang up
    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello! Thank you for calling BollaLabz. This voice feature is coming soon.</Say>
  <Pause length="1"/>
  <Hangup/>
</Response>`);
  } catch (error) {
    logger.error('Error processing voice webhook:', error);

    // Return error TwiML
    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, we encountered an error. Please try again later.</Say>
  <Hangup/>
</Response>`);
  }
});

export default router;
