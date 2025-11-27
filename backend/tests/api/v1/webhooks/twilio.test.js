// Last Modified: 2025-11-24 01:30
/**
 * Twilio Webhook Tests
 * Comprehensive test coverage for webhook signature validation and message handling
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import twilioWebhookRoutes from '../../../../api/v1/webhooks/twilio.js';

// Mock dependencies
jest.mock('../../../../services/twilio.js');
jest.mock('../../../../config/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Import mocked modules
import twilioService from '../../../../services/twilio.js';
import logger from '../../../../config/logger.js';

// Create Express app for testing
const app = express();
app.use(express.urlencoded({ extended: true })); // Twilio sends form-encoded data
app.use('/api/v1/webhooks/twilio', twilioWebhookRoutes);

// Helper function to generate valid Twilio signature
function generateTwilioSignature(authToken, url, params) {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);

  return crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');
}

describe('Twilio Webhook Endpoints', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up environment
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
    process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';
    process.env.SKIP_TWILIO_SIGNATURE_VALIDATION = 'false';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST /api/v1/webhooks/twilio/sms', () => {
    const smsWebhookData = {
      MessageSid: 'SM123456789',
      From: '+1234567890',
      To: '+0987654321',
      Body: 'Test SMS message',
      NumMedia: '0',
      AccountSid: 'AC123456789'
    };

    test('should process valid inbound SMS', async () => {
      // Mock signature validation
      twilioService.validateWebhookSignature.mockReturnValue(true);

      // Mock storing SMS
      twilioService.storeInboundSMS.mockResolvedValue({
        message: {
          id: 1,
          conversation_id: 'SM123456789',
          content: 'Test SMS message'
        }
      });

      const response = await request(app)
        .post('/api/v1/webhooks/twilio/sms')
        .set('X-Twilio-Signature', 'valid-signature')
        .send(smsWebhookData);

      expect(response.status).toBe(200);
      expect(response.type).toBe('text/xml');
      expect(response.text).toContain('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

      expect(twilioService.storeInboundSMS).toHaveBeenCalledWith(smsWebhookData);
      expect(logger.info).toHaveBeenCalledWith(
        'Received inbound SMS webhook from Twilio',
        expect.objectContaining({
          from: '+1234567890',
          to: '+0987654321',
          messageSid: 'SM123456789'
        })
      );
    });

    test('should reject request with invalid signature', async () => {
      twilioService.validateWebhookSignature.mockReturnValue(false);

      const response = await request(app)
        .post('/api/v1/webhooks/twilio/sms')
        .set('X-Twilio-Signature', 'invalid-signature')
        .send(smsWebhookData);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: 'Forbidden',
        message: 'Invalid Twilio signature'
      });

      expect(twilioService.storeInboundSMS).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Invalid Twilio webhook signature',
        expect.any(Object)
      );
    });

    test('should reject request without signature', async () => {
      const response = await request(app)
        .post('/api/v1/webhooks/twilio/sms')
        .send(smsWebhookData);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: 'Forbidden',
        message: 'Missing Twilio signature'
      });

      expect(logger.warn).toHaveBeenCalledWith('Missing Twilio signature header');
    });

    test('should skip validation in development when configured', async () => {
      process.env.NODE_ENV = 'development';
      process.env.SKIP_TWILIO_SIGNATURE_VALIDATION = 'true';

      twilioService.storeInboundSMS.mockResolvedValue({
        message: { id: 2 }
      });

      const response = await request(app)
        .post('/api/v1/webhooks/twilio/sms')
        .send(smsWebhookData);

      expect(response.status).toBe(200);
      expect(twilioService.validateWebhookSignature).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        'Skipping Twilio signature validation in development mode'
      );
    });

    test('should handle storage errors gracefully', async () => {
      twilioService.validateWebhookSignature.mockReturnValue(true);
      twilioService.storeInboundSMS.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/v1/webhooks/twilio/sms')
        .set('X-Twilio-Signature', 'valid-signature')
        .send(smsWebhookData);

      // Should still return 200 to prevent Twilio retries
      expect(response.status).toBe(200);
      expect(response.type).toBe('text/xml');

      expect(logger.error).toHaveBeenCalledWith(
        'Error processing inbound SMS webhook:',
        expect.any(Error)
      );
    });

    test('should handle MMS with media', async () => {
      twilioService.validateWebhookSignature.mockReturnValue(true);
      twilioService.storeInboundSMS.mockResolvedValue({
        message: { id: 3 }
      });

      const mmsData = {
        ...smsWebhookData,
        NumMedia: '2',
        MediaUrl0: 'https://example.com/image1.jpg',
        MediaContentType0: 'image/jpeg',
        MediaUrl1: 'https://example.com/image2.jpg',
        MediaContentType1: 'image/jpeg'
      };

      const response = await request(app)
        .post('/api/v1/webhooks/twilio/sms')
        .set('X-Twilio-Signature', 'valid-signature')
        .send(mmsData);

      expect(response.status).toBe(200);
      expect(twilioService.storeInboundSMS).toHaveBeenCalledWith(mmsData);
    });
  });

  describe('POST /api/v1/webhooks/twilio/status', () => {
    const statusWebhookData = {
      MessageSid: 'SM123456789',
      MessageStatus: 'delivered',
      To: '+1234567890',
      From: '+0987654321',
      Price: '-0.00750',
      PriceUnit: 'USD',
      ErrorCode: null,
      ErrorMessage: null
    };

    test('should update message status successfully', async () => {
      twilioService.validateWebhookSignature.mockReturnValue(true);
      twilioService.updateMessageStatus.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/v1/webhooks/twilio/status')
        .set('X-Twilio-Signature', 'valid-signature')
        .send(statusWebhookData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      expect(twilioService.updateMessageStatus).toHaveBeenCalledWith(
        'SM123456789',
        'delivered',
        {
          price: '-0.00750',
          priceUnit: 'USD',
          errorCode: null,
          errorMessage: null
        }
      );

      expect(logger.info).toHaveBeenCalledWith(
        'Message status updated: SM123456789 -> delivered'
      );
    });

    test('should handle failed message status', async () => {
      twilioService.validateWebhookSignature.mockReturnValue(true);
      twilioService.updateMessageStatus.mockResolvedValue(true);

      const failedStatus = {
        ...statusWebhookData,
        MessageStatus: 'failed',
        ErrorCode: '30003',
        ErrorMessage: 'Unreachable destination'
      };

      const response = await request(app)
        .post('/api/v1/webhooks/twilio/status')
        .set('X-Twilio-Signature', 'valid-signature')
        .send(failedStatus);

      expect(response.status).toBe(200);

      expect(twilioService.updateMessageStatus).toHaveBeenCalledWith(
        'SM123456789',
        'failed',
        expect.objectContaining({
          errorCode: '30003',
          errorMessage: 'Unreachable destination'
        })
      );
    });

    test('should handle database errors gracefully', async () => {
      twilioService.validateWebhookSignature.mockReturnValue(true);
      twilioService.updateMessageStatus.mockRejectedValue(new Error('DB error'));

      const response = await request(app)
        .post('/api/v1/webhooks/twilio/status')
        .set('X-Twilio-Signature', 'valid-signature')
        .send(statusWebhookData);

      // Should still return 200 to prevent Twilio retries
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      expect(logger.error).toHaveBeenCalledWith(
        'Error processing status webhook:',
        expect.any(Error)
      );
    });

    test('should validate signature for status updates', async () => {
      twilioService.validateWebhookSignature.mockReturnValue(false);

      const response = await request(app)
        .post('/api/v1/webhooks/twilio/status')
        .set('X-Twilio-Signature', 'invalid')
        .send(statusWebhookData);

      expect(response.status).toBe(403);
      expect(twilioService.updateMessageStatus).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/webhooks/twilio/voice', () => {
    const voiceWebhookData = {
      CallSid: 'CA123456789',
      From: '+1234567890',
      To: '+0987654321',
      CallStatus: 'ringing',
      Direction: 'inbound'
    };

    test('should handle inbound voice call', async () => {
      twilioService.validateWebhookSignature.mockReturnValue(true);

      const response = await request(app)
        .post('/api/v1/webhooks/twilio/voice')
        .set('X-Twilio-Signature', 'valid-signature')
        .send(voiceWebhookData);

      expect(response.status).toBe(200);
      expect(response.type).toBe('text/xml');
      expect(response.text).toContain('<Say voice="alice">');
      expect(response.text).toContain('Hello! Thank you for calling BollaLabz');
      expect(response.text).toContain('<Hangup/>');

      expect(logger.info).toHaveBeenCalledWith(
        'Received inbound voice call webhook from Twilio',
        expect.objectContaining({
          from: '+1234567890',
          to: '+0987654321',
          callSid: 'CA123456789'
        })
      );
    });

    test('should return error TwiML on processing error', async () => {
      twilioService.validateWebhookSignature.mockReturnValue(true);

      // Force an error by mocking logger to throw
      logger.info.mockImplementationOnce(() => {
        throw new Error('Processing error');
      });

      const response = await request(app)
        .post('/api/v1/webhooks/twilio/voice')
        .set('X-Twilio-Signature', 'valid-signature')
        .send(voiceWebhookData);

      expect(response.status).toBe(200);
      expect(response.type).toBe('text/xml');
      expect(response.text).toContain('Sorry, we encountered an error');
      expect(response.text).toContain('<Hangup/>');

      expect(logger.error).toHaveBeenCalledWith(
        'Error processing voice webhook:',
        expect.any(Error)
      );
    });

    test('should validate signature for voice calls', async () => {
      twilioService.validateWebhookSignature.mockReturnValue(false);

      const response = await request(app)
        .post('/api/v1/webhooks/twilio/voice')
        .set('X-Twilio-Signature', 'invalid')
        .send(voiceWebhookData);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/v1/webhooks/twilio/test', () => {
    test('should return webhook configuration info', async () => {
      const response = await request(app)
        .get('/api/v1/webhooks/twilio/test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Twilio webhook endpoint is active',
        endpoints: {
          inboundSMS: '/api/v1/webhooks/twilio/sms',
          statusCallback: '/api/v1/webhooks/twilio/status'
        },
        timestamp: expect.any(String)
      });

      // Verify timestamp is valid ISO string
      expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
    });

    test('should not require authentication', async () => {
      // No auth headers needed
      const response = await request(app)
        .get('/api/v1/webhooks/twilio/test');

      expect(response.status).toBe(200);
    });
  });

  describe('Signature Validation', () => {
    test('should construct correct URL for validation', async () => {
      twilioService.validateWebhookSignature.mockReturnValue(true);
      twilioService.storeInboundSMS.mockResolvedValue({ message: { id: 1 } });

      await request(app)
        .post('/api/v1/webhooks/twilio/sms')
        .set('X-Twilio-Signature', 'test-sig')
        .set('Host', 'api.example.com')
        .send(smsWebhookData);

      expect(twilioService.validateWebhookSignature).toHaveBeenCalledWith(
        'test-sig',
        expect.stringContaining('/api/v1/webhooks/twilio/sms'),
        smsWebhookData
      );
    });

    test('should handle production environment correctly', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SKIP_TWILIO_SIGNATURE_VALIDATION = 'true'; // Should be ignored in production

      twilioService.validateWebhookSignature.mockReturnValue(false);

      const response = await request(app)
        .post('/api/v1/webhooks/twilio/sms')
        .set('X-Twilio-Signature', 'invalid')
        .send(smsWebhookData);

      // Should still validate in production
      expect(response.status).toBe(403);
      expect(twilioService.validateWebhookSignature).toHaveBeenCalled();
    });

    test('should not skip validation if env var is not exactly "true"', async () => {
      process.env.NODE_ENV = 'development';
      process.env.SKIP_TWILIO_SIGNATURE_VALIDATION = 'TRUE'; // Case sensitive

      twilioService.validateWebhookSignature.mockReturnValue(false);

      const response = await request(app)
        .post('/api/v1/webhooks/twilio/sms')
        .set('X-Twilio-Signature', 'invalid')
        .send(smsWebhookData);

      expect(response.status).toBe(403);
      expect(twilioService.validateWebhookSignature).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed request body', async () => {
      twilioService.validateWebhookSignature.mockReturnValue(true);

      const response = await request(app)
        .post('/api/v1/webhooks/twilio/sms')
        .set('X-Twilio-Signature', 'valid')
        .send('malformed data');

      // Should still return 200 to prevent retries
      expect(response.status).toBe(200);
    });

    test('should handle missing required fields gracefully', async () => {
      twilioService.validateWebhookSignature.mockReturnValue(true);
      twilioService.storeInboundSMS.mockResolvedValue({ message: { id: 1 } });

      const incompleteData = {
        MessageSid: 'SM123',
        // Missing From, To, Body
      };

      const response = await request(app)
        .post('/api/v1/webhooks/twilio/sms')
        .set('X-Twilio-Signature', 'valid')
        .send(incompleteData);

      expect(response.status).toBe(200);
      expect(twilioService.storeInboundSMS).toHaveBeenCalledWith(incompleteData);
    });
  });
});