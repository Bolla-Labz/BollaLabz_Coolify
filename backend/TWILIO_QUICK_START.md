<!-- Last Modified: 2025-11-23 17:30 -->
# Twilio SMS Integration - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Get Twilio Credentials
```bash
# Sign up at https://www.twilio.com
# From Console Dashboard, copy:
# - Account SID
# - Auth Token
# - Phone Number (purchase one if needed)
```

### 2. Configure Environment
```bash
# Edit backend/.env file
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
```

### 3. Start Server
```bash
cd backend
npm start
```

Server will log:
```
✓ Twilio SMS service initialized
```

---

## 📤 Send Your First SMS

### Using cURL
```bash
curl -X POST http://localhost:3001/api/v1/messages/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "to": "+15551234567",
    "message": "Hello from BollaLabz! 🚀"
  }'
```

### Using JavaScript
```javascript
const response = await fetch('http://localhost:3001/api/v1/messages/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key'
  },
  body: JSON.stringify({
    to: '+15551234567',
    message: 'Hello from BollaLabz!'
  })
});

const data = await response.json();
console.log('Message SID:', data.data.messageSid);
```

### Success Response
```json
{
  "success": true,
  "message": "SMS sent successfully",
  "data": {
    "messageSid": "SM...",
    "status": "queued",
    "to": "+15551234567",
    "from": "+15557654321",
    "body": "Hello from BollaLabz!",
    "dateCreated": "2025-11-10T12:00:00Z",
    "messageId": 123
  }
}
```

---

## 📥 Receive SMS (Webhooks)

### 1. Configure Public URL
```bash
# For local development, use ngrok
ngrok http 3001

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

### 2. Configure Twilio Webhook
1. Go to: https://console.twilio.com/
2. Phone Numbers → Active Numbers → Select your number
3. Messaging Configuration:
   - **Webhook URL**: `https://abc123.ngrok.io/api/v1/webhooks/twilio/sms`
   - **HTTP Method**: POST
   - **Status Callback**: `https://abc123.ngrok.io/api/v1/webhooks/twilio/status`

### 3. Test Receiving
Send SMS to your Twilio number from your phone. Check logs:
```bash
# Server logs
info: Received inbound SMS webhook from Twilio
info: Inbound SMS stored. Message ID: 456, Contact: +15551234567
```

### 4. Verify in Database
```sql
SELECT * FROM conversation_messages
WHERE message_type = 'sms' AND direction = 'inbound'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 📊 View Message History

### Get All Messages
```bash
curl http://localhost:3001/api/v1/messages?limit=20 \
  -H "X-API-Key: your_api_key"
```

### Get Messages by Phone Number
```bash
curl "http://localhost:3001/api/v1/messages?phoneNumber=+15551234567&limit=50" \
  -H "X-API-Key: your_api_key"
```

### Get Specific Message
```bash
curl http://localhost:3001/api/v1/messages/123 \
  -H "X-API-Key: your_api_key"
```

---

## 💰 Track Costs

### Get Total SMS Costs
```bash
curl http://localhost:3001/api/v1/messages/costs \
  -H "X-API-Key: your_api_key"
```

### Response
```json
{
  "success": true,
  "data": {
    "total_messages": 42,
    "total_cost": 3.15,
    "currency": "USD"
  }
}
```

### Get Costs by Date Range
```bash
curl "http://localhost:3001/api/v1/messages/costs?startDate=2025-01-01&endDate=2025-01-31" \
  -H "X-API-Key: your_api_key"
```

---

## 🔧 Testing

### Test Webhook Endpoint
```bash
curl http://localhost:3001/api/v1/webhooks/twilio/test
```

### Run Full Test Suite
```bash
cd backend
node test-twilio-integration.js
```

---

## 🌐 Production Deployment

### 1. Update Environment Variables
```env
# Production .env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_production_token
TWILIO_PHONE_NUMBER=+15551234567
TWILIO_WEBHOOK_URL=https://bollalabz.com/api/v1/webhooks/twilio/sms
TWILIO_STATUS_CALLBACK_URL=https://bollalabz.com/api/v1/webhooks/twilio/status
```

### 2. Configure Twilio Production Webhooks
```
SMS Webhook: https://bollalabz.com/api/v1/webhooks/twilio/sms
Status Callback: https://bollalabz.com/api/v1/webhooks/twilio/status
```

### 3. Test Production
```bash
# Send test message
curl -X POST https://bollalabz.com/api/v1/messages/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $PRODUCTION_API_KEY" \
  -d '{
    "to": "+15551234567",
    "message": "Production test"
  }'

# Check health
curl https://bollalabz.com/health
```

---

## 🎨 WebSocket Real-Time Updates

### Connect to WebSocket
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your_jwt_token'
  }
});

// Listen for incoming messages
socket.on('message:received', (data) => {
  console.log('New SMS received:', data.message);
  // Update UI with new message
});

// Listen for connection
socket.on('connection:established', (data) => {
  console.log('WebSocket connected:', data.socketId);
});
```

---

## 🔒 Security Notes

1. **API Key**: Always use API key for API endpoints
2. **Webhook Signature**: Webhooks validate Twilio signature automatically
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Built-in rate limiting protects endpoints
5. **Input Validation**: Phone numbers and messages are validated

---

## ⚠️ Common Issues

### "SMS service not available"
**Solution**: Check Twilio credentials in `.env`

### "Invalid phone number format"
**Solution**: Use E.164 format: `+15551234567` (include country code)

### "Webhook signature validation failed"
**Solution**: Ensure webhook URL matches exactly what's in Twilio console

### Messages sent but not stored in DB
**Solution**: Check status callback URL is configured in Twilio

---

## 📞 Phone Number Format

### ✅ Correct
```
+15551234567  (US)
+442071234567 (UK)
+61212345678  (Australia)
```

### ❌ Incorrect
```
5551234567    (Missing country code)
15551234567   (Missing + prefix)
+1 555 123 4567 (Contains spaces)
```

---

## 💡 Pro Tips

1. **Test with Your Phone**: Always test with real phone numbers first
2. **Monitor Costs**: Check `/api/v1/messages/costs` regularly
3. **Use ngrok for Dev**: Perfect for testing webhooks locally
4. **Check Logs**: Server logs show all SMS activity
5. **Database Queries**: Direct SQL queries help debug issues

---

## 🆘 Support

- **Twilio Docs**: https://www.twilio.com/docs
- **Server Logs**: `backend/logs/app.log`
- **Test Script**: `backend/test-twilio-integration.js`
- **Database Schema**: `database-schema.sql`

---

## 📋 Checklist

- [ ] Twilio account created
- [ ] Credentials added to `.env`
- [ ] Server started successfully
- [ ] Test message sent
- [ ] Webhook URL configured
- [ ] Test message received
- [ ] Costs tracked in database
- [ ] WebSocket events working
- [ ] Production deployment complete

---

**Ready to send messages!** 🚀
