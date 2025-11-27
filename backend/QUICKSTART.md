<!-- Last Modified: 2025-11-23 17:30 -->
# BollaLabz Backend Integration - Quick Start Guide

Get up and running with all integrations in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- API keys for Twilio, Vapi, ElevenLabs, and Anthropic

## Step 1: Install Dependencies

```bash
cd C:\Users\Sergio Bolla\Projects\bollalabz
npm install
```

## Step 2: Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys:

   ```env
   # Twilio (required for SMS/Voice)
   TWILIO_ACCOUNT_SID=your-actual-account-sid
   TWILIO_AUTH_TOKEN=your-actual-auth-token
   TWILIO_PHONE_NUMBER=+1234567890

   # Vapi (required for AI Voice)
   VAPI_API_KEY=your-actual-vapi-key

   # ElevenLabs (required for TTS)
   ELEVENLABS_API_KEY=your-actual-elevenlabs-key

   # Anthropic (required for AI)
   ANTHROPIC_API_KEY=your-actual-anthropic-key
   ```

## Step 3: Start the Backend Server

```bash
npm run dev:backend
```

You should see:
```
[INFO] BollaLabz Backend Server running on port 4000
[INFO] Environment: development
[INFO] Frontend URL: http://localhost:5173
```

## Step 4: Test Each Integration

Open a new terminal and test each integration:

### Test 1: Health Check

```bash
curl http://localhost:4000/api/v1/test/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-11-08T..."
}
```

### Test 2: Twilio SMS

```bash
curl -X POST http://localhost:4000/api/v1/test/twilio/sms \
  -H "Content-Type: application/json" \
  -d '{"to": "+1234567890", "message": "Hello from BollaLabz!"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "id": "SM...",
    "contactId": "+1234567890",
    "direction": "outbound",
    "type": "sms",
    "content": "Hello from BollaLabz!",
    "cost": 0.0079
  }
}
```

### Test 3: ElevenLabs Text-to-Speech

```bash
curl -X POST http://localhost:4000/api/v1/test/elevenlabs/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Welcome to BollaLabz! This is a test of the text to speech system."}' \
  --output test-speech.mp3
```

Expected: `test-speech.mp3` file created (play it to verify)

### Test 4: List ElevenLabs Voices

```bash
curl http://localhost:4000/api/v1/test/elevenlabs/voices
```

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "voice_id": "EXAVITQu4vr4xnSDxMaL",
      "name": "Bella",
      ...
    }
  ]
}
```

### Test 5: Anthropic Message Analysis

```bash
curl -X POST http://localhost:4000/api/v1/test/anthropic/analyze \
  -H "Content-Type: application/json" \
  -d '{"message": "I urgently need to schedule a meeting with the team for tomorrow at 2pm to discuss the new project proposal."}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "summary": "Request to schedule urgent team meeting...",
    "sentiment": "neutral",
    "intent": "schedule_meeting",
    "topics": ["meeting", "team", "project proposal"],
    "urgency": "high"
  }
}
```

### Test 6: Anthropic Response Generation

```bash
curl -X POST http://localhost:4000/api/v1/test/anthropic/respond \
  -H "Content-Type: application/json" \
  -d '{"message": "Can you help me plan my day?"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "response": "I'd be happy to help you plan your day! To create..."
  }
}
```

### Test 7: Task Extraction

```bash
curl -X POST http://localhost:4000/api/v1/test/anthropic/extract-tasks \
  -H "Content-Type: application/json" \
  -d '{"messages": ["I need to call the client by 3pm", "Also remember to send the report before Friday", "Schedule dentist appointment next week"]}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "title": "Call client",
        "dueDate": "today 3pm",
        "priority": "high"
      },
      {
        "title": "Send report",
        "dueDate": "Friday",
        "priority": "medium"
      },
      {
        "title": "Schedule dentist appointment",
        "dueDate": "next week",
        "priority": "low"
      }
    ]
  }
}
```

### Test 8: Check Cost Tracking

```bash
curl http://localhost:4000/api/v1/test/costs/current
```

Expected response:
```json
{
  "success": true,
  "data": {
    "breakdown": {
      "twilio": 0.0079,
      "vapi": 0,
      "elevenlabs": 0.0108,
      "anthropic": 0.0024
    },
    "total": 0.0211,
    "details": [...]
  }
}
```

## Step 5: Test Webhooks (Optional)

To test webhooks locally, you need to expose your local server:

### Using ngrok:

1. Install ngrok: https://ngrok.com/download

2. Start ngrok:
   ```bash
   ngrok http 4000
   ```

3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

4. Update Twilio webhook URLs:
   - Go to https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
   - Select your phone number
   - Set SMS webhook: `https://abc123.ngrok.io/api/v1/webhooks/twilio/sms`
   - Set Voice webhook: `https://abc123.ngrok.io/api/v1/webhooks/twilio/voice`

5. Send an SMS to your Twilio number and watch the webhook logs

## Troubleshooting

### Issue: "Missing required configuration"

**Solution:** Check that all API keys are set in `.env`

### Issue: "Connection refused" or "ECONNREFUSED"

**Solution:**
1. Make sure the backend server is running (`npm run dev:backend`)
2. Check that port 4000 is not in use by another application

### Issue: Twilio signature validation fails

**Solution:**
1. Ensure your ngrok URL is correct
2. Check that `TWILIO_AUTH_TOKEN` matches your Twilio account
3. Verify the webhook URL in Twilio console matches exactly

### Issue: "Rate limit exceeded"

**Solution:** Wait 1 minute - webhooks are rate-limited to 100 requests/minute

### Issue: Costs not tracking

**Solution:** Check the server logs for cost tracking messages

## Running Frontend + Backend Together

To run both frontend and backend simultaneously:

```bash
npm run dev:full
```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## Next Steps

1. **Explore the API:**
   - Check `backend/README.md` for full API documentation
   - Try different test endpoints
   - Monitor costs with `/api/v1/test/costs/current`

2. **Set up webhooks:**
   - Use ngrok for local testing
   - Configure Twilio and Vapi webhook URLs
   - Test incoming SMS and calls

3. **Integrate with database:**
   - Set up PostgreSQL
   - Uncomment database calls in webhook handlers
   - Enable persistent storage

4. **Deploy to production:**
   - Use environment variables for API keys
   - Set `NODE_ENV=production`
   - Configure HTTPS endpoints
   - Update webhook URLs to production domain

## Support

For detailed documentation:
- Backend README: `backend/README.md`
- Integration Summary: `INTEGRATION_SUMMARY.md`
- API Documentation: Check each client file in `backend/integrations/`

For issues:
- Check server logs
- Verify API keys
- Review error messages
- Test with curl/Postman first

## Example Workflow

Here's a complete workflow to test everything:

```bash
# 1. Start the server
npm run dev:backend

# 2. Test health
curl http://localhost:4000/api/v1/test/health

# 3. Send SMS
curl -X POST http://localhost:4000/api/v1/test/twilio/sms \
  -H "Content-Type: application/json" \
  -d '{"to": "+1234567890", "message": "Test SMS"}'

# 4. Generate speech
curl -X POST http://localhost:4000/api/v1/test/elevenlabs/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world"}' --output hello.mp3

# 5. Analyze message
curl -X POST http://localhost:4000/api/v1/test/anthropic/analyze \
  -H "Content-Type: application/json" \
  -d '{"message": "Need to schedule urgent meeting tomorrow"}'

# 6. Check costs
curl http://localhost:4000/api/v1/test/costs/current

# Done! All integrations working!
```

Happy coding! 🚀
