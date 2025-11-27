<!-- Last Modified: 2025-11-23 17:30 -->
# Production-Grade API Rate Limiting

## Overview

BollaLabz backend implements comprehensive rate limiting to protect the API from abuse and ensure fair usage across all endpoints. The rate limiting system uses `express-rate-limit` with custom configurations for different endpoint types.

## Rate Limit Configurations

### 1. General API Rate Limit
- **Limit:** 100 requests per 15 minutes per IP
- **Applied to:** All `/api/*` routes
- **Purpose:** Prevent general API abuse
- **Headers:** Standard RateLimit-* headers included

```javascript
// Example headers in response
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 900
```

### 2. Authentication Endpoints
- **Limit:** 5 requests per 15 minutes per IP
- **Applied to:** `/api/v1/auth/*`, `/api/auth/*`
- **Purpose:** Prevent brute force attacks
- **Special:** Doesn't count successful authentication attempts
- **Status Code:** 429 (Too Many Requests)

### 3. Webhook Endpoints
- **Limit:** 1000 requests per hour
- **Applied to:** `/api/webhooks/*`, `/api/v1/webhooks/*`
- **Purpose:** Allow high-throughput legitimate webhook traffic
- **Use Case:** Third-party integrations (Twilio, Vapi, etc.)

### 4. Per-User Rate Limit
- **Limit:** 500 requests per hour (after authentication)
- **Applied to:** All `/api/*` routes after authentication
- **Key:** User ID (if authenticated) or IP address
- **Purpose:** Fair usage per authenticated user

### 5. Write Operations
- **Limit:** 50 requests per 15 minutes
- **Applied to:** POST, PUT, DELETE, PATCH methods
- **Purpose:** Protect database from write-heavy abuse
- **Scope:** Per IP or authenticated user

### 6. Read Operations
- **Limit:** 200 requests per 15 minutes
- **Applied to:** GET methods
- **Purpose:** Allow more permissive read access
- **Scope:** Per IP or authenticated user

## Rate Limit Headers

All responses include standard rate limit headers:

### Standard Headers (RFC Draft)
```
RateLimit-Policy: 100;w=900
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 845
```

### Custom Headers (X-RateLimit-*)
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-01-10T12:45:00.000Z
```

## 429 Response Format

When rate limit is exceeded, the API returns:

```json
{
  "success": false,
  "error": "Too many requests",
  "message": "You have exceeded the rate limit. Please try again later.",
  "retryAfter": "300 seconds",
  "resetTime": "2025-01-10T12:45:00.000Z",
  "limit": 100,
  "remaining": 0
}
```

**HTTP Status:** 429 Too Many Requests

## Implementation Details

### Middleware Stack Order

Rate limiters are applied in this order in `server.js`:

1. **Custom headers middleware** - Adds X-RateLimit headers to all responses
2. **Webhook limiter** - Applied first for webhook routes (high limit)
3. **Auth limiter** - Applied to auth endpoints (strict limit)
4. **General limiter** - Applied to all API routes (moderate limit)
5. **Authentication** - User authentication middleware
6. **Per-user limiter** - Applied after authentication (per-user quota)

### Key Generation

Rate limits use intelligent key generation:

```javascript
// For unauthenticated requests
key = `ip:${req.ip}`

// For authenticated requests
key = `user:${req.user.id}:${req.ip}`

// For per-user limits (authenticated only)
key = `user:${req.user.id}`
```

### Skip Conditions

Certain endpoints are excluded from rate limiting:
- `/health` - Health check endpoint
- `/` - Root API info endpoint
- `/api/v1` - API documentation endpoint

## Testing Rate Limits

### Manual Testing with curl

#### Test general API rate limit:
```bash
# Make multiple requests
for i in {1..105}; do
  curl -i http://localhost:4000/api/v1 \
    -H "X-API-Key: your-api-key"
done
```

#### Test auth rate limit:
```bash
# Should block after 5 attempts
for i in {1..10}; do
  curl -X POST http://localhost:4000/api/v1/auth/login \
    -H "X-API-Key: your-api-key" \
    -H "Content-Type: application/json" \
    -d '{"email":"test","password":"test"}'
done
```

#### Check rate limit headers:
```bash
curl -i http://localhost:4000/api/v1 \
  -H "X-API-Key: your-api-key" | grep RateLimit
```

### Automated Testing

Run the test suite:
```bash
# Node.js test script
node test-rate-limits.js

# Windows batch script
test-rate-limits.bat
```

## Production Deployment

### Environment Variables

Configure rate limits via environment variables:

```env
# General API rate limit
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100      # Max requests per window

# Trust proxy (important for accurate IP detection behind reverse proxy)
TRUST_PROXY=1
```

### Reverse Proxy Configuration

When behind a reverse proxy (Nginx, Apache), ensure proper IP forwarding:

**Nginx:**
```nginx
location /api {
    proxy_pass http://backend:4000;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

**Express:**
```javascript
app.set('trust proxy', 1);  // Already configured in server.js
```

### Redis for Distributed Rate Limiting (Optional)

For multi-server deployments, consider using Redis:

```javascript
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL });

export const generalLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'rl:general:'
  }),
  // ... other options
});
```

## Monitoring and Logging

Rate limit events are logged with context:

```javascript
// When rate limit is reached
logger.warn('Rate limit exceeded', {
  ip: req.ip,
  path: req.path,
  method: req.method,
  user: req.user?.id || 'unauthenticated',
  limit: req.rateLimit.limit,
  current: req.rateLimit.current
});
```

### Monitoring Queries

Track rate limit patterns:
```bash
# View rate limit warnings in logs
grep "Rate limit exceeded" logs/combined.log

# Count by IP
grep "Rate limit exceeded" logs/combined.log | grep -o '"ip":"[^"]*"' | sort | uniq -c

# Count by endpoint
grep "Rate limit exceeded" logs/combined.log | grep -o '"path":"[^"]*"' | sort | uniq -c
```

## Troubleshooting

### Common Issues

#### 1. Rate limits too strict
**Symptom:** Legitimate users hitting limits
**Solution:** Increase limits in `.env` or adjust per-endpoint limits

#### 2. IP address not detected correctly
**Symptom:** All requests share same rate limit
**Solution:** Ensure `trust proxy` is set correctly and reverse proxy forwards IP

#### 3. Rate limit not applied
**Symptom:** Can exceed limits without 429 response
**Solution:** Check middleware order in server.js, ensure rate limiter is before routes

#### 4. Rate limit persists after restart
**Symptom:** Rate limits don't reset on server restart
**Solution:** Using in-memory store (default) - limits reset on restart. Using Redis - limits persist.

## API Documentation

Rate limits should be documented in API docs:

```markdown
## Rate Limits

All API endpoints are rate limited to ensure fair usage:

- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes
- Webhooks: 1000 requests per hour
- Per User: 500 requests per hour (authenticated)

Rate limit info is included in response headers:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining in current window
- `RateLimit-Reset`: Seconds until limit resets
```

## Future Enhancements

Potential improvements to consider:

1. **Dynamic Rate Limits** - Adjust based on user tier (free/premium)
2. **Rate Limit Dashboard** - Real-time monitoring UI
3. **IP Whitelisting** - Bypass limits for trusted IPs
4. **Burst Allowance** - Allow short bursts above limit
5. **Cost-Based Limits** - Different costs for different endpoints
6. **Anomaly Detection** - Alert on unusual patterns

## References

- [express-rate-limit Documentation](https://github.com/express-rate-limit/express-rate-limit)
- [RFC 6585 - Additional HTTP Status Codes](https://tools.ietf.org/html/rfc6585)
- [RateLimit Header Fields Draft](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers)

---

**Last Updated:** 2025-11-10
**Version:** 1.0.0
