// 08 December 2025 15 10 00

/**
 * Twilio Service Usage Examples
 *
 * This file demonstrates how to use the TwilioService for various telephony operations.
 * These examples show real-world usage patterns for the service.
 */

import {
  TwilioService,
  getTwilioService,
  DSM_PHONE_NUMBERS,
  type OutboundCallOptions,
  type SMSOptions,
} from './twilio';

// =============================================================================
// BASIC SETUP
// =============================================================================

/**
 * Example 1: Initialize service with environment variables
 */
function example1_BasicSetup() {
  // Uses environment variables:
  // - TWILIO_ACCOUNT_SID
  // - TWILIO_AUTH_TOKEN
  // - TWILIO_DEFAULT_FROM (defaults to DSM_PHONE_NUMBERS.PRIMARY)
  const twilioService = getTwilioService();
  console.log('Service initialized with singleton pattern');
}

/**
 * Example 2: Initialize service with custom configuration
 */
function example2_CustomConfig() {
  const twilioService = new TwilioService({
    accountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authToken: 'your_auth_token_here',
    defaultFrom: DSM_PHONE_NUMBERS.MAIN,
    timeout: 60000, // 60 seconds
    retryAttempts: 5,
  });
  console.log('Service initialized with custom config');
}

// =============================================================================
// OUTBOUND CALLS
// =============================================================================

/**
 * Example 3: Make a simple outbound call
 */
async function example3_SimpleOutboundCall() {
  const twilioService = getTwilioService();

  try {
    const call = await twilioService.initiateCall({
      to: '+15551234567',
      url: 'https://your-domain.com/twiml/greeting',
      method: 'POST',
    });

    console.log('Call initiated:', {
      callSid: call.sid,
      status: call.status,
      direction: call.direction,
    });
  } catch (error) {
    console.error('Failed to initiate call:', error);
  }
}

/**
 * Example 4: Make a call with answering machine detection
 */
async function example4_CallWithAMD() {
  const twilioService = getTwilioService();

  const options: OutboundCallOptions = {
    to: '+15551234567',
    from: DSM_PHONE_NUMBERS.BUSINESS,
    url: 'https://your-domain.com/twiml/sales-pitch',
    machineDetection: 'DetectMessageEnd',
    machineDetectionTimeout: 30,
    machineDetectionSpeechThreshold: 2500,
    statusCallback: 'https://your-domain.com/webhooks/call-status',
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
  };

  try {
    const call = await twilioService.initiateCall(options);
    console.log('Call with AMD initiated:', call.sid);
  } catch (error) {
    console.error('Failed to initiate call with AMD:', error);
  }
}

/**
 * Example 5: Make a call with recording enabled
 */
async function example5_CallWithRecording() {
  const twilioService = getTwilioService();

  const options: OutboundCallOptions = {
    to: '+15551234567',
    url: 'https://your-domain.com/twiml/support-call',
    record: true,
    recordingChannels: 'dual',
    recordingStatusCallback: 'https://your-domain.com/webhooks/recording-ready',
    recordingStatusCallbackMethod: 'POST',
  };

  try {
    const call = await twilioService.initiateCall(options);
    console.log('Call with recording initiated:', call.sid);
  } catch (error) {
    console.error('Failed to initiate call with recording:', error);
  }
}

// =============================================================================
// CALL CONTROL
// =============================================================================

/**
 * Example 6: Hang up an active call
 */
async function example6_HangupCall() {
  const twilioService = getTwilioService();
  const callSid = 'CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

  try {
    await twilioService.hangupCall(callSid);
    console.log('Call hung up successfully');
  } catch (error) {
    console.error('Failed to hang up call:', error);
  }
}

/**
 * Example 7: Get call details
 */
async function example7_GetCallDetails() {
  const twilioService = getTwilioService();
  const callSid = 'CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

  try {
    const call = await twilioService.getCall(callSid);
    console.log('Call details:', {
      from: call.from,
      to: call.to,
      status: call.status,
      duration: call.duration,
      price: call.price,
    });
  } catch (error) {
    console.error('Failed to get call details:', error);
  }
}

// =============================================================================
// RECORDING MANAGEMENT
// =============================================================================

/**
 * Example 8: Start recording an active call
 */
async function example8_StartRecording() {
  const twilioService = getTwilioService();
  const callSid = 'CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

  try {
    const recording = await twilioService.startRecording(callSid, {
      recordingChannels: 'dual',
      recordingStatusCallback: 'https://your-domain.com/webhooks/recording-ready',
    });
    console.log('Recording started:', recording.sid);
  } catch (error) {
    console.error('Failed to start recording:', error);
  }
}

/**
 * Example 9: Stop recording
 */
async function example9_StopRecording() {
  const twilioService = getTwilioService();
  const callSid = 'CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
  const recordingSid = 'RExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

  try {
    await twilioService.stopRecording(callSid, recordingSid);
    console.log('Recording stopped');
  } catch (error) {
    console.error('Failed to stop recording:', error);
  }
}

/**
 * Example 10: Get recording URL and download
 */
async function example10_GetRecordingUrl() {
  const twilioService = getTwilioService();
  const recordingSid = 'RExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

  try {
    // Get recording details
    const recording = await twilioService.getRecording(recordingSid);
    console.log('Recording details:', {
      duration: recording.duration,
      status: recording.status,
      channels: recording.channels,
    });

    // Get download URL
    const mp3Url = twilioService.getRecordingUrl(recordingSid, 'mp3');
    const wavUrl = twilioService.getRecordingUrl(recordingSid, 'wav');

    console.log('Recording URLs:', { mp3Url, wavUrl });
  } catch (error) {
    console.error('Failed to get recording:', error);
  }
}

/**
 * Example 11: List all recordings for a call
 */
async function example11_ListRecordings() {
  const twilioService = getTwilioService();
  const callSid = 'CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

  try {
    const recordings = await twilioService.listRecordings(callSid);
    console.log(`Found ${recordings.length} recordings for call`);
    recordings.forEach((recording) => {
      console.log({
        sid: recording.sid,
        duration: recording.duration,
        status: recording.status,
      });
    });
  } catch (error) {
    console.error('Failed to list recordings:', error);
  }
}

// =============================================================================
// TWIML GENERATION
// =============================================================================

/**
 * Example 12: Generate TwiML for answering with a message
 */
function example12_GenerateAnswerTwiML() {
  const twilioService = getTwilioService();

  const twiml = twilioService.generateAnswerTwiML(
    'Thank you for calling BollaLabz. Your call is important to us.',
    {
      voice: 'Polly.Joanna',
      language: 'en-US',
    }
  );

  console.log('Generated TwiML:', twiml);
  return twiml;
}

/**
 * Example 13: Generate IVR menu TwiML
 */
function example13_GenerateIVRTwiML() {
  const twilioService = getTwilioService();

  const twiml = twilioService.generateGatherTwiML(
    'Press 1 for Sales, 2 for Support, or 3 for Billing.',
    'https://your-domain.com/ivr/process',
    {
      numDigits: 1,
      timeout: 5,
      voice: 'Polly.Joanna',
    }
  );

  console.log('Generated IVR TwiML:', twiml);
  return twiml;
}

/**
 * Example 14: Generate voicemail recording TwiML
 */
function example14_GenerateVoicemailTwiML() {
  const twilioService = getTwilioService();

  const twiml = twilioService.generateRecordTwiML(
    'Please leave a message after the beep.',
    'https://your-domain.com/voicemail/process',
    {
      maxLength: 120, // 2 minutes
      playBeep: true,
      voice: 'Polly.Joanna',
    }
  );

  console.log('Generated Voicemail TwiML:', twiml);
  return twiml;
}

/**
 * Example 15: Generate call forwarding TwiML
 */
function example15_GenerateForwardTwiML() {
  const twilioService = getTwilioService();

  const twiml = twilioService.generateTransferTwiML(
    DSM_PHONE_NUMBERS.MOBILE,
    'Transferring your call now. Please hold.',
    { voice: 'Polly.Joanna' }
  );

  console.log('Generated Forward TwiML:', twiml);
  return twiml;
}

/**
 * Example 16: Generate conference call TwiML
 */
function example16_GenerateConferenceTwiML() {
  const twilioService = getTwilioService();

  const twiml = twilioService.generateConferenceTwiML('TeamStandup', {
    startConferenceOnEnter: true,
    endConferenceOnExit: false,
    muted: false,
    beep: 'onEnter',
    statusCallback: 'https://your-domain.com/webhooks/conference-status',
  });

  console.log('Generated Conference TwiML:', twiml);
  return twiml;
}

// =============================================================================
// SMS MESSAGING
// =============================================================================

/**
 * Example 17: Send a simple SMS
 */
async function example17_SendSimpleSMS() {
  const twilioService = getTwilioService();

  const options: SMSOptions = {
    to: '+15551234567',
    body: 'Hello from BollaLabz! Your appointment is confirmed for tomorrow at 2 PM.',
  };

  try {
    const message = await twilioService.sendSMS(options);
    console.log('SMS sent:', {
      messageSid: message.sid,
      status: message.status,
      to: message.to,
    });
  } catch (error) {
    console.error('Failed to send SMS:', error);
  }
}

/**
 * Example 18: Send SMS with media (MMS)
 */
async function example18_SendMMS() {
  const twilioService = getTwilioService();

  const options: SMSOptions = {
    to: '+15551234567',
    from: DSM_PHONE_NUMBERS.BUSINESS,
    body: 'Check out this image!',
    mediaUrl: ['https://your-domain.com/images/promo.jpg'],
    statusCallback: 'https://your-domain.com/webhooks/sms-status',
  };

  try {
    const message = await twilioService.sendSMS(options);
    console.log('MMS sent:', message.sid);
  } catch (error) {
    console.error('Failed to send MMS:', error);
  }
}

/**
 * Example 19: Get SMS message status
 */
async function example19_GetMessageStatus() {
  const twilioService = getTwilioService();
  const messageSid = 'SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

  try {
    const message = await twilioService.getMessage(messageSid);
    console.log('Message status:', {
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
      price: message.price,
    });
  } catch (error) {
    console.error('Failed to get message status:', error);
  }
}

// =============================================================================
// WEBHOOK HANDLING
// =============================================================================

/**
 * Example 20: Verify webhook signature (Express middleware)
 */
function example20_WebhookVerification() {
  const twilioService = getTwilioService();

  // Use as Express middleware
  const webhookMiddleware = twilioService.createWebhookMiddleware();

  // Example usage in Express:
  // app.post('/webhooks/twilio/voice', webhookMiddleware, handleVoiceWebhook);

  console.log('Webhook middleware created');
}

/**
 * Example 21: Manual webhook signature verification
 */
function example21_ManualWebhookVerification() {
  const twilioService = getTwilioService();

  const url = 'https://your-domain.com/webhooks/twilio/voice';
  const params = {
    CallSid: 'CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    From: '+15551234567',
    To: DSM_PHONE_NUMBERS.PRIMARY,
    CallStatus: 'in-progress',
  };
  const signature = 'X-Twilio-Signature-Header-Value';

  const result = twilioService.verifyWebhookSignature(url, params, signature);

  if (result.valid) {
    console.log('Webhook signature is valid');
  } else {
    console.error('Invalid webhook signature:', result.error);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Example 22: Format phone numbers
 */
function example22_FormatPhoneNumber() {
  const twilioService = getTwilioService();

  // Format various phone number formats to E.164
  console.log(twilioService.formatPhoneNumber('(515) 690-7696')); // +15156907696
  console.log(twilioService.formatPhoneNumber('515-690-7696')); // +15156907696
  console.log(twilioService.formatPhoneNumber('5156907696')); // +15156907696
  console.log(twilioService.formatPhoneNumber('15156907696')); // +15156907696
  console.log(twilioService.formatPhoneNumber('+15156907696')); // +15156907696

  // Validate phone numbers
  console.log(twilioService.validatePhoneNumber('+15156907696')); // true
  console.log(twilioService.validatePhoneNumber('5156907696')); // false
}

/**
 * Example 23: Get available Des Moines phone numbers
 */
function example23_GetAvailableNumbers() {
  const twilioService = getTwilioService();

  const numbers = twilioService.getAvailablePhoneNumbers();
  console.log('Available Des Moines numbers:', numbers);
}

/**
 * Example 24: Clean up rate limit cache (periodic maintenance)
 * Note: Cleanup is now automatic via internal interval timer in TwilioService
 */
function example24_CleanupCache() {
  const twilioService = getTwilioService();

  // Cleanup happens automatically - no manual intervention needed
  // The service automatically cleans up cache every 60 seconds
  console.log('Rate limit cache cleanup is handled automatically by TwilioService');

  // To stop the service and cleanup:
  // twilioService.cleanup();
}

// =============================================================================
// SIP INTEGRATION
// =============================================================================

/**
 * Example 25: Generate SIP call TwiML
 */
function example25_GenerateSipTwiML() {
  const twilioService = getTwilioService();

  const twiml = twilioService.generateSipTwiML(
    'sip:user@your-sip-domain.com',
    'sipUsername',
    'sipPassword'
  );

  console.log('Generated SIP TwiML:', twiml);
  return twiml;
}

/**
 * Example 26: Make a SIP call
 */
async function example26_MakeSipCall() {
  const twilioService = getTwilioService();

  const options: OutboundCallOptions = {
    to: 'sip:conference@your-sip-domain.com',
    from: DSM_PHONE_NUMBERS.PRIMARY,
    sipAuthUsername: 'your-sip-username',
    sipAuthPassword: 'your-sip-password',
    url: 'https://your-domain.com/twiml/sip-call',
  };

  try {
    const call = await twilioService.initiateCall(options);
    console.log('SIP call initiated:', call.sid);
  } catch (error) {
    console.error('Failed to initiate SIP call:', error);
  }
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Example 27: Handle different error types
 */
async function example27_ErrorHandling() {
  const twilioService = getTwilioService();

  try {
    await twilioService.initiateCall({
      to: 'invalid-number',
    });
  } catch (error: any) {
    if (error.name === 'TwilioValidationError') {
      console.error('Validation error:', error.message);
      console.error('Details:', error.details);
    } else if (error.name === 'TwilioAuthError') {
      console.error('Authentication error:', error.message);
    } else if (error.name === 'TwilioServiceError') {
      console.error('Service error:', error.message);
      console.error('Error code:', error.code);
    } else {
      console.error('Unknown error:', error);
    }
  }
}

// =============================================================================
// EXPORT EXAMPLES
// =============================================================================

export {
  example1_BasicSetup,
  example2_CustomConfig,
  example3_SimpleOutboundCall,
  example4_CallWithAMD,
  example5_CallWithRecording,
  example6_HangupCall,
  example7_GetCallDetails,
  example8_StartRecording,
  example9_StopRecording,
  example10_GetRecordingUrl,
  example11_ListRecordings,
  example12_GenerateAnswerTwiML,
  example13_GenerateIVRTwiML,
  example14_GenerateVoicemailTwiML,
  example15_GenerateForwardTwiML,
  example16_GenerateConferenceTwiML,
  example17_SendSimpleSMS,
  example18_SendMMS,
  example19_GetMessageStatus,
  example20_WebhookVerification,
  example21_ManualWebhookVerification,
  example22_FormatPhoneNumber,
  example23_GetAvailableNumbers,
  example24_CleanupCache,
  example25_GenerateSipTwiML,
  example26_MakeSipCall,
  example27_ErrorHandling,
};
