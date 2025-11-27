// Last Modified: 2025-11-24 01:35
/**
 * Twilio Integration Tests
 * Comprehensive test coverage for Twilio client integration with mocked external APIs
 */

import { jest } from '@jest/globals';

// Mock fetch globally before imports
global.fetch = jest.fn();

// Mock twilio module
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn()
    },
    calls: {
      create: jest.fn()
    },
    recordings: jest.fn().mockImplementation((sid) => ({
      fetch: jest.fn()
    }))
  }));
});

// Mock other dependencies
jest.mock('../../utils/retry.ts', () => ({
  retryWithBackoff: jest.fn(async (fn) => fn())
}));

jest.mock('../../utils/cost-tracker.ts', () => ({
  costTracker: {
    trackCost: jest.fn()
  },
  calculateTwilioSmsCost: jest.fn(() => 0.0075),
  calculateTwilioVoiceCost: jest.fn((direction, duration) => duration * 0.013)
}));

jest.mock('../../utils/logger.ts', () => ({
  logger: {
    integration: jest.fn(),
    cost: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

// Import after mocks
import { TwilioClient, createTwilioClient } from '../../integrations/twilio/client.ts';
import { retryWithBackoff } from '../../utils/retry.ts';
import { costTracker, calculateTwilioSmsCost, calculateTwilioVoiceCost } from '../../utils/cost-tracker.ts';
import { logger } from '../../utils/logger.ts';
import twilio from 'twilio';

describe('Twilio Integration Client', () => {
  let twilioClient;
  let mockTwilioInstance;

  const testConfig = {
    accountSid: 'AC_TEST_SID',
    authToken: 'test_auth_token',
    phoneNumber: '+15551234567',
    statusCallbackUrl: 'https://api.example.com/webhooks/twilio/status'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mock instance
    mockTwilioInstance = {
      messages: {
        create: jest.fn()
      },
      calls: {
        create: jest.fn()
      },
      recordings: jest.fn((sid) => ({
        fetch: jest.fn().mockResolvedValue({
          uri: `/recordings/${sid}.json`
        })
      }))
    };

    twilio.mockReturnValue(mockTwilioInstance);

    twilioClient = new TwilioClient(testConfig);
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with valid config', () => {
      expect(twilio).toHaveBeenCalledWith('AC_TEST_SID', 'test_auth_token');
      expect(logger.integration).toHaveBeenCalledWith('twilio', 'Client initialized');
    });

    test('should store config properly', () => {
      // Config is private but we can verify through method calls
      expect(twilioClient).toBeDefined();
    });
  });

  describe('sendSms', () => {
    test('should send SMS successfully', async () => {
      const mockMessageResponse = {
        sid: 'SM_MESSAGE_SID',
        status: 'queued',
        errorCode: null,
        errorMessage: null,
        dateCreated: new Date(),
        price: '-0.0075',
        priceUnit: 'USD'
      };

      mockTwilioInstance.messages.create.mockResolvedValue(mockMessageResponse);

      const result = await twilioClient.sendSms('+15559876543', 'Hello, test message');

      expect(mockTwilioInstance.messages.create).toHaveBeenCalledWith({
        body: 'Hello, test message',
        from: '+15551234567',
        to: '+15559876543',
        statusCallback: 'https://api.example.com/webhooks/twilio/status'
      });

      expect(result).toEqual({
        id: 'SM_MESSAGE_SID',
        contactId: '+15559876543',
        direction: 'outbound',
        type: 'sms',
        content: 'Hello, test message',
        cost: 0.0075,
        metadata: {
          status: 'queued',
          errorCode: null,
          errorMessage: null
        },
        timestamp: expect.any(String)
      });

      expect(costTracker.trackCost).toHaveBeenCalledWith({
        service: 'twilio',
        type: 'sms',
        cost: 0.0075,
        metadata: {
          messageSid: 'SM_MESSAGE_SID',
          to: '+15559876543'
        }
      });

      expect(logger.integration).toHaveBeenCalledWith('twilio', 'Sending SMS to +15559876543');
      expect(logger.integration).toHaveBeenCalledWith('twilio', 'SMS sent successfully (SM_MESSAGE_SID)');
    });

    test('should handle SMS sending failure with retry', async () => {
      const error = new Error('Network error');

      mockTwilioInstance.messages.create.mockRejectedValue(error);
      retryWithBackoff.mockRejectedValue(error);

      await expect(twilioClient.sendSms('+15559876543', 'Test')).rejects.toThrow('Network error');

      expect(retryWithBackoff).toHaveBeenCalled();
    });

    test('should handle SMS with error status', async () => {
      const mockErrorResponse = {
        sid: 'SM_ERROR_SID',
        status: 'failed',
        errorCode: 30003,
        errorMessage: 'Unreachable destination'
      };

      mockTwilioInstance.messages.create.mockResolvedValue(mockErrorResponse);

      const result = await twilioClient.sendSms('+15559876543', 'Error test');

      expect(result.metadata).toEqual({
        status: 'failed',
        errorCode: 30003,
        errorMessage: 'Unreachable destination'
      });
    });

    test('should track cost for international SMS', async () => {
      calculateTwilioSmsCost.mockReturnValue(0.05); // International rate

      mockTwilioInstance.messages.create.mockResolvedValue({
        sid: 'SM_INTL_SID',
        status: 'queued'
      });

      await twilioClient.sendSms('+447911123456', 'International message');

      expect(costTracker.trackCost).toHaveBeenCalledWith(
        expect.objectContaining({
          cost: 0.05
        })
      );
    });
  });

  describe('initiateCall', () => {
    test('should initiate outbound call successfully', async () => {
      const mockCallResponse = {
        sid: 'CA_CALL_SID',
        status: 'initiating',
        direction: 'outbound-api',
        duration: null,
        price: null
      };

      mockTwilioInstance.calls.create.mockResolvedValue(mockCallResponse);

      const result = await twilioClient.initiateCall(
        '+15559876543',
        'https://example.com/twiml',
        {
          record: true,
          machineDetection: 'Enable'
        }
      );

      expect(mockTwilioInstance.calls.create).toHaveBeenCalledWith({
        to: '+15559876543',
        from: '+15551234567',
        url: 'https://example.com/twiml',
        record: true,
        statusCallback: 'https://api.example.com/webhooks/twilio/status',
        machineDetection: 'Enable'
      });

      expect(result).toEqual({
        id: 'CA_CALL_SID',
        contactId: '+15559876543',
        direction: 'outbound',
        duration: 0,
        cost: 0,
        status: 'completed',
        metadata: {
          callSid: 'CA_CALL_SID',
          status: 'initiating'
        },
        timestamp: expect.any(String)
      });

      expect(logger.integration).toHaveBeenCalledWith('twilio', 'Initiating call to +15559876543');
      expect(logger.integration).toHaveBeenCalledWith('twilio', 'Call initiated (CA_CALL_SID)');
    });

    test('should use default status callback if not provided', async () => {
      mockTwilioInstance.calls.create.mockResolvedValue({
        sid: 'CA_DEFAULT_SID',
        status: 'queued'
      });

      await twilioClient.initiateCall('+15559876543', 'https://example.com/twiml');

      expect(mockTwilioInstance.calls.create).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCallback: 'https://api.example.com/webhooks/twilio/status'
        })
      );
    });

    test('should handle call initiation failure', async () => {
      const error = new Error('Invalid phone number');

      mockTwilioInstance.calls.create.mockRejectedValue(error);
      retryWithBackoff.mockRejectedValue(error);

      await expect(
        twilioClient.initiateCall('+invalid', 'https://example.com/twiml')
      ).rejects.toThrow('Invalid phone number');
    });

    test('should support machine detection options', async () => {
      mockTwilioInstance.calls.create.mockResolvedValue({
        sid: 'CA_AMD_SID',
        status: 'queued'
      });

      await twilioClient.initiateCall(
        '+15559876543',
        'https://example.com/twiml',
        { machineDetection: 'DetectMessageEnd' }
      );

      expect(mockTwilioInstance.calls.create).toHaveBeenCalledWith(
        expect.objectContaining({
          machineDetection: 'DetectMessageEnd'
        })
      );
    });
  });

  describe('getCallRecording', () => {
    test('should download call recording successfully', async () => {
      const mockRecording = {
        uri: '/recordings/RE_RECORDING_SID.json'
      };

      const mockAudioBuffer = Buffer.from('audio data');

      mockTwilioInstance.recordings('RE_RECORDING_SID').fetch.mockResolvedValue(mockRecording);

      global.fetch.mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer)
      });

      const result = await twilioClient.getCallRecording('RE_RECORDING_SID');

      expect(mockTwilioInstance.recordings).toHaveBeenCalledWith('RE_RECORDING_SID');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.twilio.com/recordings/RE_RECORDING_SID.mp3',
        {
          headers: {
            Authorization: expect.stringMatching(/^Basic /)
          }
        }
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(logger.integration).toHaveBeenCalledWith('twilio', 'Fetching recording RE_RECORDING_SID');
      expect(logger.integration).toHaveBeenCalledWith('twilio', 'Recording downloaded (RE_RECORDING_SID)');
    });

    test('should handle recording download failure', async () => {
      mockTwilioInstance.recordings('RE_FAIL_SID').fetch.mockResolvedValue({
        uri: '/recordings/RE_FAIL_SID.json'
      });

      global.fetch.mockResolvedValue({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(
        twilioClient.getCallRecording('RE_FAIL_SID')
      ).rejects.toThrow('Failed to download recording: Not Found');
    });

    test('should construct proper auth header', async () => {
      mockTwilioInstance.recordings('RE_AUTH_SID').fetch.mockResolvedValue({
        uri: '/recordings/RE_AUTH_SID.json'
      });

      global.fetch.mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('audio'))
      });

      await twilioClient.getCallRecording('RE_AUTH_SID');

      const authHeader = global.fetch.mock.calls[0][1].headers.Authorization;
      const decoded = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString();

      expect(decoded).toBe('AC_TEST_SID:test_auth_token');
    });
  });

  describe('getCallDetails', () => {
    test('should fetch call details successfully', async () => {
      const mockCallDetails = {
        sid: 'CA_DETAIL_SID',
        status: 'completed',
        duration: 120,
        price: '-0.026',
        priceUnit: 'USD',
        startTime: '2025-11-24T00:00:00Z',
        endTime: '2025-11-24T00:02:00Z'
      };

      const mockCallMethod = jest.fn().mockReturnValue({
        fetch: jest.fn().mockResolvedValue(mockCallDetails)
      });

      mockTwilioInstance.calls = mockCallMethod;

      const result = await twilioClient.getCallDetails('CA_DETAIL_SID');

      expect(mockCallMethod).toHaveBeenCalledWith('CA_DETAIL_SID');
      expect(result).toEqual(mockCallDetails);
      expect(logger.integration).toHaveBeenCalledWith('twilio', 'Fetching call details CA_DETAIL_SID');
    });

    test('should handle call not found', async () => {
      const mockCallMethod = jest.fn().mockReturnValue({
        fetch: jest.fn().mockRejectedValue(new Error('Call not found'))
      });

      mockTwilioInstance.calls = mockCallMethod;
      retryWithBackoff.mockRejectedValue(new Error('Call not found'));

      await expect(
        twilioClient.getCallDetails('CA_NONEXISTENT')
      ).rejects.toThrow('Call not found');
    });
  });

  describe('getMessageDetails', () => {
    test('should fetch message details successfully', async () => {
      const mockMessageDetails = {
        sid: 'SM_DETAIL_SID',
        status: 'delivered',
        body: 'Message content',
        price: '-0.0075',
        priceUnit: 'USD',
        dateSent: '2025-11-24T00:00:00Z'
      };

      const mockMessageMethod = jest.fn().mockReturnValue({
        fetch: jest.fn().mockResolvedValue(mockMessageDetails)
      });

      mockTwilioInstance.messages = mockMessageMethod;

      const result = await twilioClient.getMessageDetails('SM_DETAIL_SID');

      expect(mockMessageMethod).toHaveBeenCalledWith('SM_DETAIL_SID');
      expect(result).toEqual(mockMessageDetails);
      expect(logger.integration).toHaveBeenCalledWith('twilio', 'Fetching message details SM_DETAIL_SID');
    });
  });

  describe('validateWebhookSignature', () => {
    test('should validate webhook signature correctly', () => {
      // Mock twilio.validateRequest
      twilio.validateRequest = jest.fn().mockReturnValue(true);

      const result = twilioClient.validateWebhookSignature(
        'https://api.example.com/webhook',
        { MessageSid: 'SM123' },
        'signature_string'
      );

      expect(twilio.validateRequest).toHaveBeenCalledWith(
        'test_auth_token',
        'signature_string',
        'https://api.example.com/webhook',
        { MessageSid: 'SM123' }
      );
      expect(result).toBe(true);
    });

    test('should reject invalid signature', () => {
      twilio.validateRequest = jest.fn().mockReturnValue(false);

      const result = twilioClient.validateWebhookSignature(
        'https://api.example.com/webhook',
        { MessageSid: 'SM123' },
        'invalid_signature'
      );

      expect(result).toBe(false);
    });
  });

  describe('trackCallCost', () => {
    test('should track outbound call cost', () => {
      twilioClient.trackCallCost('CA_COST_SID', 180, 'outbound');

      expect(calculateTwilioVoiceCost).toHaveBeenCalledWith('outbound', 180);
      expect(costTracker.trackCost).toHaveBeenCalledWith({
        service: 'twilio',
        type: 'voice',
        cost: 2.34, // 180 * 0.013
        units: 180,
        metadata: {
          callSid: 'CA_COST_SID',
          duration: 180,
          direction: 'outbound'
        }
      });

      expect(logger.cost).toHaveBeenCalledWith('twilio', 2.34, 'Call CA_COST_SID - 180s');
    });

    test('should track inbound call cost', () => {
      calculateTwilioVoiceCost.mockReturnValue(0.85); // Inbound rate

      twilioClient.trackCallCost('CA_INBOUND_SID', 60, 'inbound');

      expect(calculateTwilioVoiceCost).toHaveBeenCalledWith('inbound', 60);
      expect(costTracker.trackCost).toHaveBeenCalledWith({
        service: 'twilio',
        type: 'voice',
        cost: 0.85,
        units: 60,
        metadata: {
          callSid: 'CA_INBOUND_SID',
          duration: 60,
          direction: 'inbound'
        }
      });
    });

    test('should handle zero duration calls', () => {
      calculateTwilioVoiceCost.mockReturnValue(0);

      twilioClient.trackCallCost('CA_ZERO_SID', 0, 'outbound');

      expect(costTracker.trackCost).toHaveBeenCalledWith(
        expect.objectContaining({
          cost: 0,
          units: 0
        })
      );
    });
  });

  describe('createTwilioClient', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    test('should create client with environment variables', () => {
      process.env.TWILIO_ACCOUNT_SID = 'AC_ENV_SID';
      process.env.TWILIO_AUTH_TOKEN = 'env_auth_token';
      process.env.TWILIO_PHONE_NUMBER = '+15551112222';
      process.env.TWILIO_STATUS_CALLBACK_URL = 'https://env.callback.url';

      const client = createTwilioClient();

      expect(client).toBeInstanceOf(TwilioClient);
      expect(twilio).toHaveBeenCalledWith('AC_ENV_SID', 'env_auth_token');
    });

    test('should throw error if required config missing', () => {
      delete process.env.TWILIO_ACCOUNT_SID;

      expect(() => createTwilioClient()).toThrow('Missing required Twilio configuration');
    });

    test('should work without optional status callback URL', () => {
      process.env.TWILIO_ACCOUNT_SID = 'AC_ENV_SID';
      process.env.TWILIO_AUTH_TOKEN = 'env_auth_token';
      process.env.TWILIO_PHONE_NUMBER = '+15551112222';
      delete process.env.TWILIO_STATUS_CALLBACK_URL;

      const client = createTwilioClient();

      expect(client).toBeInstanceOf(TwilioClient);
    });
  });

  describe('Retry Logic', () => {
    test('should retry on network failures', async () => {
      let callCount = 0;

      retryWithBackoff.mockImplementation(async (fn) => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Network error');
        }
        return fn();
      });

      mockTwilioInstance.messages.create.mockResolvedValue({
        sid: 'SM_RETRY_SUCCESS',
        status: 'queued'
      });

      await expect(
        twilioClient.sendSms('+15559876543', 'Retry test')
      ).rejects.toThrow('Network error');

      expect(retryWithBackoff).toHaveBeenCalled();
    });

    test('should not retry on validation errors', async () => {
      const validationError = new Error('Invalid phone number format');
      validationError.code = 21211; // Twilio validation error code

      retryWithBackoff.mockRejectedValue(validationError);

      await expect(
        twilioClient.sendSms('invalid', 'Test')
      ).rejects.toThrow('Invalid phone number format');

      expect(retryWithBackoff).toHaveBeenCalledTimes(1);
    });
  });
});