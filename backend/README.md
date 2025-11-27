<!-- Last Modified: 2025-11-23 17:30 -->
# BollaLabz Backend Integrations

Complete integration layer for Twilio, Vapi, ElevenLabs, and Anthropic Claude.

## Overview

This backend provides a production-ready integration layer for:

1. **Twilio** - SMS and Voice communications
2. **Vapi** - AI-powered voice conversations
3. **ElevenLabs** - Text-to-speech voice generation
4. **Anthropic Claude** - AI message analysis and processing

## Architecture

```
backend/
├── integrations/
│   ├── twilio/
│   │   ├── client.ts           # Twilio API client
│   │   └── webhooks.ts         # SMS/Voice webhook handlers
│   ├── vapi/
│   │   ├── client.ts           # Vapi API client
│   │   └── webhooks.ts         # Call event handlers
│   ├── elevenlabs/
│   │   └── client.ts           # ElevenLabs TTS client
│   └── anthropic/
│       └── client.ts           # Claude AI client
├── webhooks/
│   └── router.ts               # Central webhook routing
├── middleware/
│   └── webhook-security.ts    # Security & rate limiting
├── utils/
│   ├── retry.ts                # Retry logic with backoff
│   ├── cost-tracker.ts         # API cost tracking
│   └── logger.ts               # Logging utility
├── types/
│   └── index.ts                # TypeScript definitions
├── tests/
│   └── integration-tests.ts   # Test endpoints
└── server.ts                   # Main Express server
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Required API keys:
- **Twilio**: Get from https://console.twilio.com
- **Vapi**: Get from https://vapi.ai
- **ElevenLabs**: Get from https://elevenlabs.io
- **Anthropic**: Get from https://console.anthropic.com

### 3. Start the Server

```bash
npm run dev
```

The server will start on http://localhost:4000

## API Endpoints

### Webhooks (Production)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/webhooks/twilio/sms` | POST | Receive incoming SMS |
| `/api/v1/webhooks/twilio/voice` | POST | Receive incoming calls |
| `/api/v1/webhooks/twilio/call-status` | POST | Call status updates |
| `/api/v1/webhooks/twilio/sms-status` | POST | SMS status updates |
| `/api/v1/webhooks/vapi/call-started` | POST | Vapi call started |
| `/api/v1/webhooks/vapi/call-ended` | POST | Vapi call ended |
| `/api/v1/webhooks/vapi/transcript` | POST | Real-time transcript |
| `/api/v1/webhooks/vapi/function-call` | POST | Custom function calls |

### Test Endpoints (Development Only)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/test/twilio/sms` | POST | Send test SMS |
| `/api/v1/test/twilio/call` | POST | Make test call |
| `/api/v1/test/vapi/call` | POST | Start Vapi AI call |
| `/api/v1/test/vapi/transcript/:callId` | GET | Get call transcript |
| `/api/v1/test/elevenlabs/tts` | POST | Convert text to speech |
| `/api/v1/test/elevenlabs/voices` | GET | List available voices |
| `/api/v1/test/anthropic/analyze` | POST | Analyze message |
| `/api/v1/test/anthropic/respond` | POST | Generate response |
| `/api/v1/test/anthropic/extract-tasks` | POST | Extract tasks |
| `/api/v1/test/costs/current` | GET | Get cost breakdown |
| `/api/v1/test/health` | GET | Health check |

## Usage Examples

### Send SMS (Twilio)

```bash
curl -X POST http://localhost:4000/api/v1/test/twilio/sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "Hello from BollaLabz!"
  }'
```

### Convert Text to Speech (ElevenLabs)

```bash
curl -X POST http://localhost:4000/api/v1/test/elevenlabs/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello! This is BollaLabz speaking.",
    "voiceId": "EXAVITQu4vr4xnSDxMaL"
  }' \
  --output speech.mp3
```

### Analyze Message (Anthropic Claude)

```bash
curl -X POST http://localhost:4000/api/v1/test/anthropic/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need to schedule a meeting for next Tuesday at 2pm. This is urgent!",
    "context": ["Previous message context here"]
  }'
```

### Get Cost Breakdown

```bash
curl http://localhost:4000/api/v1/test/costs/current
```

## Webhook Configuration

### Local Testing with ngrok

1. Install ngrok: https://ngrok.com/download
2. Start ngrok:
   ```bash
   ngrok http 4000
   ```
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Update webhook URLs in Twilio and Vapi dashboards

### Twilio Configuration

1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Select your phone number
3. Configure webhooks:
   - SMS: `https://your-domain.com/api/v1/webhooks/twilio/sms`
   - Voice: `https://your-domain.com/api/v1/webhooks/twilio/voice`
   - Status Callback: `https://your-domain.com/api/v1/webhooks/twilio/call-status`

### Vapi Configuration

1. Go to your Vapi dashboard
2. Configure webhook URL: `https://your-domain.com/api/v1/webhooks/vapi`
3. Subscribe to events: `call.started`, `call.ended`, `transcript`

## Cost Tracking

All API usage is automatically tracked. View costs at:

```bash
GET /api/v1/test/costs/current
```

Response:
```json
{
  "success": true,
  "data": {
    "breakdown": {
      "twilio": 0.0158,
      "vapi": 0.15,
      "elevenlabs": 0.0036,
      "anthropic": 0.0012
    },
    "total": 0.1706,
    "details": [...]
  }
}
```

## Security Features

1. **Webhook Signature Validation** - All webhooks verify signatures
2. **Rate Limiting** - 100 requests per minute per IP
3. **Request Validation** - Content-type and body validation
4. **Helmet Security** - HTTP security headers
5. **CORS** - Configured for frontend origin

## Error Handling

- **Automatic Retries** - Failed API calls retry with exponential backoff
- **Comprehensive Logging** - All errors logged with context
- **Graceful Degradation** - Service failures don't crash server

## Integration Details

### Twilio Integration

**Features:**
- Send/receive SMS
- Initiate/receive voice calls
- Download call recordings
- Cost tracking per message/call
- Webhook signature verification

**Costs:**
- SMS: $0.0079 per message
- Voice: $0.013/min outbound, $0.0085/min inbound

### Vapi Integration

**Features:**
- AI-powered voice calls
- Real-time transcripts
- Call analytics
- Custom function calling
- Event webhooks

**Costs:**
- Voice: $0.05 per minute

### ElevenLabs Integration

**Features:**
- High-quality text-to-speech
- Multiple voice options
- Audio streaming
- Caching for efficiency
- Subscription quota tracking

**Costs:**
- TTS: $0.00018 per character

### Anthropic Claude Integration

**Features:**
- Message analysis (sentiment, intent, topics)
- Context-aware response generation
- Conversation summarization
- Task extraction
- Streaming responses

**Model:** Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

**Costs:**
- Input: $3.00 per million tokens
- Output: $15.00 per million tokens

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use HTTPS for all webhook URLs
3. Configure proper CORS origins
4. Set up database for persistent storage
5. Use environment variables for secrets
6. Enable production logging
7. Configure monitoring and alerts

## Database Integration

The current implementation logs to console. To persist data:

1. Uncomment database calls in webhook handlers
2. Set up PostgreSQL with schema from `docs/`
3. Update database URL in `.env`
4. Run migrations

## Contributing

When adding new integrations:

1. Create client in `backend/integrations/<service>/client.ts`
2. Add webhooks in `backend/integrations/<service>/webhooks.ts`
3. Update webhook router in `backend/webhooks/router.ts`
4. Add test endpoints in `backend/tests/integration-tests.ts`
5. Update `.env.example` with new variables
6. Document in this README

## Support

For issues or questions:
- Check integration docs: Twilio, Vapi, ElevenLabs, Anthropic
- Review error logs
- Test with curl/Postman
- Verify API keys and webhook URLs

## License

MIT
