# BollaLabz Coolify Deployment Checklist
<!-- Last Modified: 2025-11-26 23:26 -->

## ✅ Repository Setup Complete
- [x] Clean deployment repository created at `C:\Users\Sergio Bolla\Projects\BollaLabz_Coolify`
- [x] Backend API with Dockerfile
- [x] Frontend React app with Dockerfile
- [x] PostgreSQL database schema
- [x] Optimized docker-compose.yml for Coolify v4
- [x] Environment variables template (.env file)
- [x] Removed all node_modules folders
- [x] Initial commit created

## 📋 Next Steps for Coolify Deployment

### 1. Push to GitHub
```bash
cd C:\Users\Sergio Bolla\Projects\BollaLabz_Coolify
git push -u origin main
```

### 2. Configure Coolify (Dashboard: http://31.220.55.252:3000)

#### A. Create PostgreSQL Database
1. Go to Coolify dashboard → Databases
2. Click "New Database" → Select PostgreSQL
3. Configure:
   - Name: `bollalabz-production`
   - Version: 17
   - Database: `bollalabz_production`
   - User: `bollalabz_user`
   - Password: (generate secure password)
4. Deploy and wait for healthy status
5. Copy connection string (will be like: `postgresql://bollalabz_user:password@postgres:5432/bollalabz_production`)

#### B. Add Application
1. Go to Projects → Select your project
2. Click "New Resource" → "Docker Compose"
3. Source: GitHub repository
   - Repository: `https://github.com/sergiobolla/BollaLabz_Coolify`
   - Branch: `main`
   - Docker Compose Path: `/docker-compose.yml`
4. Set destination: VPS #2 (93.127.197.222)

#### C. Environment Variables (from .env file)
Critical variables to set in Coolify UI:

**🔴 REQUIRED - Application will not start without these:**
```
# Domain
DOMAIN=bollalabz.com

# Database (from Coolify PostgreSQL)
DATABASE_URL=postgresql://bollalabz_user:YOUR_PASSWORD@postgres:5432/bollalabz_production

# Redis Cloud (External)
REDIS_HOST=redis-xxxxx.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your_redis_password

# Security (Generate new ones!)
JWT_SECRET=(64 char hex string)
JWT_REFRESH_SECRET=(different 64 char hex)
API_KEY=(48 char hex string)
SESSION_SECRET=(64 char hex string)

# URLs
FRONTEND_URL=https://bollalabz.com
ALLOWED_ORIGINS=https://bollalabz.com

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# AI Services
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

**🟡 OPTIONAL - Add as needed:**
```
# ElevenLabs (Voice AI)
ELEVENLABS_API_KEY=xxxxxxxxxxxxxxxx

# Sentry (Error Tracking)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your@email.com
SMTP_PASSWORD=app_password
```

### 3. Deploy
1. Click "Deploy" button in Coolify
2. Monitor build logs (~10-15 minutes)
3. Watch for:
   - Backend build success
   - Frontend build success
   - Health checks passing

### 4. Verify Deployment
- [ ] Backend API: https://bollalabz.com/api/v1/health
- [ ] Frontend: https://bollalabz.com
- [ ] WebSocket: wss://bollalabz.com/socket.io
- [ ] SSL Certificate active

### 5. Post-Deployment
1. **Initialize Database:**
   ```sql
   -- Run database-schema.sql via Coolify database console
   ```

2. **Create First User:**
   - Navigate to https://bollalabz.com/register
   - Create admin account

3. **Test Core Features:**
   - [ ] Login/Logout
   - [ ] Contact management
   - [ ] Conversation view
   - [ ] WebSocket connection
   - [ ] Twilio webhook (if configured)

## 🔧 Troubleshooting

### Common Issues:

**504 Gateway Timeout:**
- Check Traefik labels in docker-compose.yml
- Verify health checks are passing
- Check backend logs for startup errors

**Database Connection Failed:**
- Verify DATABASE_URL format
- Check PostgreSQL is running
- Confirm network connectivity

**Frontend Not Loading:**
- Check VITE_API_URL in build args
- Verify nginx config
- Check browser console for errors

**SSL Not Working:**
- Ensure DNS points to 93.127.197.222
- Check Traefik certificates
- Verify domain in Coolify settings

## 📝 Notes
- Build happens on VPS #2, not locally
- Coolify manages all networking automatically
- PostgreSQL is Coolify-managed, not in docker-compose
- Redis uses external Redis Cloud service
- Traefik handles all SSL and routing

## 🚀 Ready to Deploy!
Repository is clean and optimized for Coolify v4 deployment.