<!-- Last Modified: 2025-11-23 17:30 -->
# BollaLabz Backend API - Complete Documentation

Production-grade REST API with 50+ endpoints for the BollaLabz Personal Command Center.

## Quick Start

```bash
cd backend
npm install
cp .env.example .env
# Configure .env with your database credentials
npm run dev
```

Server runs on: `http://localhost:3001`

## Authentication

All API endpoints require an API key:

**Header:**
```
X-API-Key: your-api-key
```

**Query Parameter:**
```
?api_key=your-api-key
```

## Complete Endpoint List (52 Total)

### Contacts API (7 endpoints)

#### 1. List Contacts
```http
GET /api/v1/contacts?page=1&limit=20&search=john
```

**Query Parameters:**
- `page` (integer, optional) - Page number (default: 1)
- `limit` (integer, optional) - Items per page (default: 20, max: 100)
- `search` (string, optional) - Search in name, phone, email
- `offset` (integer, optional) - Skip N records

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "phone_number": "+1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "conversation_count": 15,
      "last_contact": "2024-11-08T10:00:00Z",
      "metadata": {},
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-11-08T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### 2. Get Contact Details
```http
GET /api/v1/contacts/:id
```

#### 3. Create Contact
```http
POST /api/v1/contacts
```

**Request Body:**
```json
{
  "phone_number": "+1234567890",
  "name": "John Doe",
  "email": "john@example.com",
  "metadata": {
    "source": "manual_entry"
  }
}
```

#### 4. Update Contact
```http
PUT /api/v1/contacts/:id
```

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

#### 5. Delete Contact
```http
DELETE /api/v1/contacts/:id
```

#### 6. Get Contact Conversations
```http
GET /api/v1/contacts/:id/conversations?page=1&limit=20
```

#### 7. Get Contact Analytics
```http
GET /api/v1/contacts/:id/analytics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contact": {
      "id": 1,
      "name": "John Doe",
      "phone_number": "+1234567890",
      "conversation_count": 15
    },
    "analytics": {
      "conversations": {
        "total_conversations": "15",
        "inbound_count": "8",
        "outbound_count": "7",
        "total_cost": "0.1185"
      },
      "calls": {
        "total_calls": "3",
        "total_duration": "450",
        "total_call_cost": "0.0585"
      }
    }
  }
}
```

---

### Conversations API (7 endpoints)

#### 8. List Conversations
```http
GET /api/v1/conversations?contactId=1&startDate=2024-01-01&direction=inbound
```

**Query Parameters:**
- `page`, `limit` - Pagination
- `contactId` (integer) - Filter by contact
- `startDate`, `endDate` (ISO 8601) - Date range
- `direction` (string) - "inbound" or "outbound"

#### 9. Get Conversation
```http
GET /api/v1/conversations/:id
```

#### 10. Create Conversation
```http
POST /api/v1/conversations
```

**Request Body:**
```json
{
  "conversation_id": "conv_123",
  "contact_id": 1,
  "direction": "inbound",
  "content": "Hello, I need help!",
  "message_type": "sms",
  "cost": 0.0079
}
```

#### 11. Add Message to Conversation
```http
POST /api/v1/conversations/:conversationId/messages
```

#### 12. Get Conversation Messages
```http
GET /api/v1/conversations/:conversationId/messages?page=1&limit=50
```

#### 13. Update Message
```http
PUT /api/v1/conversations/messages/:msgId
```

#### 14. Search Messages
```http
GET /api/v1/conversations/search?q=meeting&contactId=1
```

---

### Calls API (5 endpoints)

#### 15. List Calls
```http
GET /api/v1/calls?contactId=1&startDate=2024-01-01
```

#### 16. Get Call Details
```http
GET /api/v1/calls/:id
```

#### 17. Log Call
```http
POST /api/v1/calls
```

**Request Body:**
```json
{
  "call_sid": "CA1234567890abcdef",
  "conversation_id": 1,
  "duration": 180,
  "cost": 0.039
}
```

#### 18. Get Cost Breakdown
```http
GET /api/v1/calls/analytics/costs?startDate=2024-01-01&endDate=2024-12-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_cost": "1.2345",
    "total_calls": "25",
    "total_duration": "3600",
    "avg_cost_per_call": "0.04938"
  }
}
```

#### 19. Get Call Volume Analytics
```http
GET /api/v1/calls/analytics/volume
```

---

### Tasks API (10 endpoints)

#### 20. List Tasks
```http
GET /api/v1/tasks?status=pending&priority=high
```

**Query Parameters:**
- `status` - "pending", "in_progress", "completed", "cancelled"
- `priority` - "low", "medium", "high", "urgent"
- `assignee` - Filter by assignee name

#### 21. Get Task
```http
GET /api/v1/tasks/:id
```

#### 22. Create Task
```http
POST /api/v1/tasks
```

**Request Body:**
```json
{
  "title": "Follow up with client",
  "description": "Send quarterly report",
  "status": "pending",
  "priority": "high",
  "assignee": "John Doe",
  "due_date": "2024-12-01T10:00:00Z",
  "dependencies": [1, 2],
  "metadata": {
    "project": "Q4 Reports"
  }
}
```

#### 23. Update Task
```http
PUT /api/v1/tasks/:id
```

#### 24. Delete Task
```http
DELETE /api/v1/tasks/:id
```

#### 25. Add Task Dependency
```http
POST /api/v1/tasks/:id/dependencies
```

**Request Body:**
```json
{
  "dependencyId": 5
}
```

#### 26. Remove Task Dependency
```http
DELETE /api/v1/tasks/:id/dependencies/:dependencyId
```

#### 27. Get Overdue Tasks
```http
GET /api/v1/tasks/filter/overdue
```

#### 28. Get Today's Tasks
```http
GET /api/v1/tasks/filter/today
```

---

### Workflows API (7 endpoints)

#### 29. List Workflows
```http
GET /api/v1/workflows?page=1&limit=20
```

#### 30. Get Workflow
```http
GET /api/v1/workflows/:id
```

#### 31. Create Workflow
```http
POST /api/v1/workflows
```

**Request Body:**
```json
{
  "name": "New Contact Notification",
  "trigger_type": "webhook",
  "webhook_url": "https://example.com/notify",
  "conditions": {
    "event": "contact_created"
  },
  "actions": {
    "send_email": true
  }
}
```

**Trigger Types:**
- `webhook` - HTTP webhook
- `schedule` - Time-based
- `event` - System event
- `manual` - Manual trigger only

#### 32. Update Workflow
```http
PUT /api/v1/workflows/:id
```

#### 33. Delete Workflow
```http
DELETE /api/v1/workflows/:id
```

#### 34. Trigger Workflow
```http
POST /api/v1/workflows/:id/trigger
```

**Request Body (optional):**
```json
{
  "payload": {
    "custom_data": "value"
  }
}
```

#### 35. Get Workflow Stats
```http
GET /api/v1/workflows/:id/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_hits": 150,
    "last_triggered": "2024-11-08T15:30:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "uptime_days": 311
  }
}
```

---

### People API (8 endpoints)

#### 36. List People
```http
GET /api/v1/people?search=john&page=1
```

#### 37. Get Person
```http
GET /api/v1/people/:id
```

#### 38. Create Person
```http
POST /api/v1/people
```

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone_number": "+1234567890",
  "company": "Acme Corp",
  "title": "CEO",
  "relationships": {
    "spouse": "Jane Doe",
    "children": ["Jack", "Jill"]
  },
  "notes": "Met at conference 2024",
  "metadata": {
    "linkedin": "linkedin.com/in/johndoe"
  }
}
```

#### 39. Update Person
```http
PUT /api/v1/people/:id
```

#### 40. Delete Person
```http
DELETE /api/v1/people/:id
```

#### 41. Get Person Interactions
```http
GET /api/v1/people/:id/interactions?page=1
```

#### 42. Log Interaction
```http
POST /api/v1/people/:id/interactions
```

**Request Body:**
```json
{
  "interaction_type": "meeting",
  "description": "Discussed Q4 partnership",
  "metadata": {
    "location": "Office",
    "duration_minutes": 60
  }
}
```

**Interaction Types:**
- `call` - Phone call
- `email` - Email exchange
- `meeting` - In-person or virtual meeting
- `message` - Text message
- `note` - General note
- `other` - Other interaction

#### 43. Get Person Relationships
```http
GET /api/v1/people/:id/relationships
```

---

### Calendar API (7 endpoints)

#### 44. List Events
```http
GET /api/v1/calendar/events?startDate=2024-11-01&endDate=2024-11-30
```

#### 45. Get Event
```http
GET /api/v1/calendar/events/:id
```

#### 46. Create Event
```http
POST /api/v1/calendar/events
```

**Request Body:**
```json
{
  "title": "Team Meeting",
  "description": "Weekly sync",
  "start_time": "2024-11-15T14:00:00Z",
  "end_time": "2024-11-15T15:00:00Z",
  "location": "Conference Room A",
  "attendees": ["john@example.com", "jane@example.com"],
  "metadata": {
    "meeting_link": "https://zoom.us/j/123456"
  }
}
```

#### 47. Update Event
```http
PUT /api/v1/calendar/events/:id
```

#### 48. Delete Event
```http
DELETE /api/v1/calendar/events/:id
```

#### 49. Get Upcoming Events
```http
GET /api/v1/calendar/upcoming?limit=10
```

#### 50. Get Today's Events
```http
GET /api/v1/calendar/today
```

---

### Analytics API (5 endpoints)

#### 51. Dashboard Summary
```http
GET /api/v1/analytics/dashboard?startDate=2024-01-01
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contacts": {
      "total_contacts": "250",
      "active_contacts": "180",
      "total_conversations": "1500"
    },
    "messages": {
      "total_messages": "1500",
      "inbound_messages": "800",
      "outbound_messages": "700",
      "total_message_cost": "11.85"
    },
    "calls": {
      "total_calls": "50",
      "total_duration": "9000",
      "total_call_cost": "117.00",
      "avg_duration": "180.00"
    },
    "tasks": {
      "total_tasks": "120",
      "completed_tasks": "80",
      "pending_tasks": "30",
      "overdue_tasks": "10"
    },
    "workflows": {
      "total_workflows": "15",
      "active_workflows": "12",
      "total_hits": "1250"
    },
    "total_cost": "128.850000"
  }
}
```

#### 52. Call Analytics
```http
GET /api/v1/analytics/calls?startDate=2024-01-01
```

#### 53. Message Analytics
```http
GET /api/v1/analytics/messages
```

#### 54. Cost Breakdown
```http
GET /api/v1/analytics/costs
```

#### 55. Trend Analysis
```http
GET /api/v1/analytics/trends
```

---

### Integrations API (4 endpoints)

#### 56. Generic Webhook
```http
POST /api/v1/integrations/webhook
```

**Request Body:**
```json
{
  "source": "external_service",
  "event": "user.created",
  "payload": {
    "user_id": 123,
    "email": "user@example.com"
  }
}
```

#### 57. Twilio Webhook
```http
POST /api/v1/integrations/twilio/incoming
```

#### 58. ElevenLabs Callback
```http
POST /api/v1/integrations/elevenlabs/callback
```

#### 59. Integration Status
```http
GET /api/v1/integrations/status
```

**Response:**
```json
{
  "success": true,
  "integrations": {
    "twilio": {
      "configured": true,
      "status": "pending"
    },
    "elevenlabs": {
      "configured": true,
      "status": "pending"
    },
    "anthropic": {
      "configured": true,
      "status": "pending"
    }
  }
}
```

---

## Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| General | 100 requests | 15 minutes |
| Read | 200 requests | 15 minutes |
| Write | 50 requests | 15 minutes |
| Auth | 5 requests | 15 minutes |

**Rate Limit Headers:**
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1699459200
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Validation failed |
| 401 | Unauthorized - Missing/invalid API key |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate entry |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Database down |

**Error Response Format:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address",
      "value": "invalid-email"
    }
  ]
}
```

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `offset` - Alternative to page, skip N records

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 250,
    "totalPages": 13
  }
}
```

---

## Date Filtering

Use ISO 8601 format for dates:

```
?startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z
```

---

## Testing

Use curl for quick testing:

```bash
# Test health endpoint
curl http://localhost:3001/health

# List contacts
curl -H "X-API-Key: your-key" \
  http://localhost:3001/api/v1/contacts

# Create contact
curl -X POST \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+1234567890","name":"Test"}' \
  http://localhost:3001/api/v1/contacts
```

---

## Production Notes

1. Always use HTTPS in production
2. Store API keys securely
3. Enable database backups
4. Monitor rate limit headers
5. Use connection pooling
6. Set appropriate CORS origins
7. Enable production logging
8. Use process manager (PM2)

---

**Total Endpoints: 59**

**API Version:** 1.0.0
**Last Updated:** November 8, 2024
