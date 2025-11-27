# BollaLabz Frontend - Production Deployment Guide
<!-- Last Modified: 2025-11-25 07:50 -->

**Target:** Hostinger VPS (93.127.197.222)
**Stack:** React 18 + Vite + TypeScript + Nginx (Dockerized)
**Status:** ✅ Production Ready

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Environment Configuration](#environment-configuration)
4. [Build & Deployment](#build--deployment)
5. [Health Checks & Monitoring](#health-checks--monitoring)
6. [Troubleshooting](#troubleshooting)
7. [Performance Optimization](#performance-optimization)

---

## Architecture Overview

### Build System
- **Bundler:** Vite 7.2.4 (ES2020 target)
- **Bundle Size:**
  - Initial load: ~800KB (gzipped)
  - Route-based code splitting enabled
  - Lazy loading for all pages
- **Compression:** Gzip + Brotli
- **Caching:** Aggressive for static assets, none for HTML

### Production Stack
```
User Request
    ↓
Nginx (Port 80)
    ↓
Static Assets (Cached)
    ↓
API Proxy → Backend (Port 3001)
WebSocket Proxy → Backend (Port 3001)
```

### Key Features
✅ **Error Boundaries** - Graceful error handling at route level
✅ **API Retry Logic** - Automatic retry with exponential backoff
✅ **WebSocket Reconnection** - Auto-reconnect with 10 attempts
✅ **Token Refresh** - Automatic JWT refresh on 401
✅ **CSRF Protection** - Cookie-based CSRF tokens
✅ **PWA Support** - Offline functionality with Service Worker
✅ **Performance Monitoring** - Sentry integration ready

---

## Pre-Deployment Checklist

### 1. Environment Variables
- [ ] Copy `.env.production.vps` to `.env.production`
- [ ] Update `VITE_API_URL` with production domain
- [ ] Update `VITE_WS_URL` with WebSocket URL
- [ ] Configure Sentry DSN (optional but recommended)
- [ ] Verify all feature flags are set correctly

### 2. Build Verification
```bash
# Test production build locally
cd frontend
npm run build:no-typecheck

# Check dist/ output
ls -lh dist/
# Should contain:
# - index.html
# - assets/js/* (chunked bundles)
# - assets/css/* (styles)
# - sw.js (service worker)
# - manifest.webmanifest (PWA manifest)

# Test build with preview server
npm run preview
# Visit http://localhost:3000
```

### 3. Docker Build Test
```bash
# Build the Docker image
docker build --target production -t bollalabz/frontend:test .

# Run container locally
docker run -d -p 8080:80 --name frontend-test bollalabz/frontend:test

# Test health endpoint
curl http://localhost:8080/health
# Expected: healthy

# Test main page
curl -I http://localhost:8080
# Expected: 200 OK

# Cleanup
docker stop frontend-test && docker rm frontend-test
```

### 4. Backend Integration
- [ ] Verify backend is running on VPS
- [ ] Test API connectivity: `curl https://api.bollalabz.com/api/v1/health`
- [ ] Verify WebSocket endpoint is accessible
- [ ] Confirm CORS settings allow frontend domain
- [ ] Test authentication flow end-to-end

---

## Environment Configuration

### Production Environment File

Create `.env.production` on your VPS:

```bash
# Copy template
cp .env.production.vps .env.production

# Edit with your values
nano .env.production
```

**Critical Variables:**
```env
VITE_API_URL=https://api.bollalabz.com/api/v1
VITE_WS_URL=wss://api.bollalabz.com
VITE_ENVIRONMENT=production
NODE_ENV=production
```

### Docker Build Arguments

When building with custom environment variables:

```bash
docker build \
  --build-arg VITE_API_URL=https://api.bollalabz.com/api/v1 \
  --build-arg VITE_WS_URL=wss://api.bollalabz.com \
  --build-arg VITE_SENTRY_DSN=your-sentry-dsn \
  --target production \
  -t bollalabz/frontend:latest \
  .
```

---

## Build & Deployment

### Option 1: Docker Deployment (Recommended)

```bash
# 1. SSH into VPS
ssh root@93.127.197.222

# 2. Navigate to project directory
cd /opt/bollalabz/frontend

# 3. Pull latest code
git pull origin main

# 4. Build Docker image
docker build --target production -t bollalabz/frontend:latest .

# 5. Stop existing container (if any)
docker stop bollalabz-frontend 2>/dev/null || true
docker rm bollalabz-frontend 2>/dev/null || true

# 6. Start new container
docker run -d \
  --name bollalabz-frontend \
  -p 80:80 \
  --restart unless-stopped \
  --env-file .env.production \
  bollalabz/frontend:latest

# 7. Verify deployment
docker logs -f bollalabz-frontend
curl http://localhost/health
```

### Option 2: Direct Nginx Deployment

```bash
# 1. Build frontend locally or on VPS
npm run build:no-typecheck

# 2. Copy dist/ to nginx directory
rsync -avz --delete dist/ root@93.127.197.222:/var/www/bollalabz/

# 3. Copy nginx config
scp nginx.frontend.conf root@93.127.197.222:/etc/nginx/sites-available/bollalabz

# 4. Enable site
ssh root@93.127.197.222 "ln -sf /etc/nginx/sites-available/bollalabz /etc/nginx/sites-enabled/"

# 5. Test nginx config
ssh root@93.127.197.222 "nginx -t"

# 6. Reload nginx
ssh root@93.127.197.222 "systemctl reload nginx"
```

### Option 3: Node.js Server (Alternative)

```bash
# Build with Node.js server target
docker build --target node-server -t bollalabz/frontend:node .

# Run on port 8080
docker run -d \
  --name bollalabz-frontend-node \
  -p 8080:8080 \
  --restart unless-stopped \
  --env-file .env.production \
  bollalabz/frontend:node

# Behind nginx reverse proxy
# Update nginx.conf to proxy_pass to localhost:8080
```

---

## Health Checks & Monitoring

### Health Endpoint

```bash
# Check frontend health
curl http://bollalabz.com/health
# Expected: healthy

# Check with headers
curl -I http://bollalabz.com
# Expected: 200 OK with security headers
```

### Performance Metrics

Monitor these key metrics:

```bash
# Check bundle sizes
ls -lh frontend/dist/assets/js/
# Target: Main bundle < 300KB, vendor < 1MB

# Check compression
ls -lh frontend/dist/assets/js/*.gz
# Should see .gz and .br files

# Docker container stats
docker stats bollalabz-frontend
# Monitor CPU and memory usage
```

### Sentry Integration (Recommended)

Enable Sentry for production error tracking:

1. Create project: https://sentry.io
2. Get DSN from project settings
3. Add to `.env.production`:
   ```env
   VITE_SENTRY_DSN=https://your-key@sentry.io/project-id
   SENTRY_AUTH_TOKEN=your-auth-token
   ```
4. Rebuild with Sentry enabled
5. Verify errors are captured: https://sentry.io/organizations/bollalabz/projects/javascript-react/

---

## Troubleshooting

### Issue: Build Fails with Memory Error

**Solution:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build:no-typecheck
```

### Issue: API Requests Return CORS Error

**Symptoms:**
```
Access to fetch at 'https://api.bollalabz.com' from origin 'https://bollalabz.com'
has been blocked by CORS policy
```

**Solution:**
1. Check backend CORS configuration:
   ```javascript
   // backend/server.ts
   app.use(cors({
     origin: ['https://bollalabz.com', 'https://www.bollalabz.com'],
     credentials: true
   }));
   ```
2. Verify `withCredentials: true` in API client
3. Restart backend service

### Issue: WebSocket Connection Fails

**Symptoms:**
```
[WebSocket] Connection error: Error during WebSocket handshake
```

**Solution:**
1. Check nginx WebSocket proxy config:
   ```nginx
   location /ws {
     proxy_pass http://backend:3001;
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "upgrade";
   }
   ```
2. Verify backend Socket.IO configuration
3. Check firewall rules for WebSocket ports

### Issue: Page Loads Blank Screen

**Symptoms:**
- Blank page with no errors in console
- React not rendering

**Solution:**
1. Check browser console for JavaScript errors
2. Verify `dist/index.html` was generated correctly
3. Check nginx logs: `docker logs bollalabz-frontend`
4. Verify environment variables are set:
   ```bash
   docker exec bollalabz-frontend env | grep VITE_
   ```

### Issue: Large Vendor Bundle (>3MB)

**Current Status:** ⚠️ vendor bundle is 3.1MB (needs optimization)

**Solution:**
1. Analyze bundle:
   ```bash
   npm run build:analyze
   # Opens visualization in browser
   ```
2. Identify large dependencies
3. Consider lazy loading heavy libraries:
   ```typescript
   // Before
   import { Chart } from 'recharts';

   // After
   const Chart = lazy(() => import('recharts').then(m => ({ default: m.Chart })));
   ```
4. Check for duplicate dependencies:
   ```bash
   npm dedupe
   ```

---

## Performance Optimization

### Current Performance

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **First Contentful Paint** | < 1.5s | TBD | 🟡 |
| **Time to Interactive** | < 3.5s | TBD | 🟡 |
| **Initial Bundle Size** | < 300KB | ~320KB | ✅ |
| **Vendor Bundle** | < 1MB | 3.1MB | ⚠️ |
| **Route Chunk Size** | < 200KB | ~50KB avg | ✅ |

### Optimization Checklist

- [x] Code splitting by route
- [x] Lazy loading for pages
- [x] Image optimization (WebP with fallbacks)
- [x] Gzip + Brotli compression
- [x] Aggressive caching for static assets
- [x] Tree shaking enabled
- [ ] **Vendor bundle optimization needed** (Priority)
- [x] Prefetch critical routes
- [x] Service Worker for offline support
- [x] CSS code splitting

### Recommended Improvements

1. **Vendor Bundle Reduction:**
   - Move `antd` to lazy-loaded components only
   - Replace `recharts` with lighter alternative for simple charts
   - Consider CDN for heavy libraries

2. **Image Optimization:**
   - Use `next-gen` image formats (WebP, AVIF)
   - Implement responsive images
   - Lazy load images below the fold

3. **Progressive Web App:**
   - Enable install prompt
   - Cache API responses strategically
   - Implement offline fallback pages

---

## Security Checklist

- [x] Security headers configured (CSP, X-Frame-Options, etc.)
- [x] HTTPS enforced (via nginx or Caddy)
- [x] Source maps hidden in production
- [x] API keys in environment variables
- [x] CSRF protection enabled
- [x] Input sanitization (DOMPurify)
- [ ] Regular security audits: `npm audit`
- [ ] Dependency updates: `npm outdated`

---

## Deployment Automation (Future)

### GitHub Actions CI/CD

Create `.github/workflows/frontend-deploy.yml`:

```yaml
name: Deploy Frontend to VPS

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker Image
        run: |
          cd frontend
          docker build --target production -t bollalabz/frontend:${{ github.sha }} .
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            docker pull bollalabz/frontend:${{ github.sha }}
            docker stop bollalabz-frontend || true
            docker rm bollalabz-frontend || true
            docker run -d --name bollalabz-frontend -p 80:80 \
              --restart unless-stopped \
              bollalabz/frontend:${{ github.sha }}
```

---

## Contact & Support

**Deployment Issues:** Check logs first:
```bash
docker logs -f bollalabz-frontend
```

**Performance Issues:** Run bundle analysis:
```bash
npm run build:analyze
```

**Error Tracking:** Check Sentry dashboard if enabled

---

**Last Updated:** 2025-11-25 07:50
**Deployment Status:** ✅ Ready for Production
**Next Steps:** Vendor bundle optimization (Priority)
