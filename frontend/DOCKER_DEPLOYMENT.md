<!-- Last Modified: 2025-11-25 03:35 -->
# BollaLabz Frontend - Docker Deployment Guide

Complete guide for containerizing and deploying the BollaLabz React/Vite frontend using Docker with production-grade optimizations.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Deployment Options](#deployment-options)
- [Quick Start](#quick-start)
- [Build Configuration](#build-configuration)
- [Environment Variables](#environment-variables)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

The BollaLabz frontend is containerized using a **multi-stage Docker build** that supports two deployment strategies:

1. **Nginx (Production)** - Lightweight static file serving with built-in proxy capabilities
2. **Node.js (Railway/Heroku)** - Dynamic server for platforms requiring Node.js runtime

### Key Features

- Multi-stage builds for optimized image size
- Runtime environment variable injection
- Automatic SPA routing configuration
- WebSocket proxy support
- Aggressive caching headers for static assets
- Health check endpoints
- Security headers (CSP, X-Frame-Options, etc.)
- Brotli and Gzip compression support

---

## Architecture

### Multi-Stage Build Process

```
Stage 1: deps          → Install dependencies
Stage 2: builder       → Build Vite application
Stage 3: production    → Nginx serving (target: production)
Stage 4: node-server   → Node.js serving (target: node-server)
```

### Image Sizes (Approximate)

- **Nginx variant**: ~50MB (Alpine + Nginx + built assets)
- **Node.js variant**: ~200MB (Alpine + Node.js + dependencies + built assets)

---

## Deployment Options

### Option 1: Nginx (Recommended for VPS/Cloud)

**Best for:**
- Traditional VPS deployments
- High-traffic production environments
- When you need a reverse proxy
- Cost-effective scaling

**Features:**
- Serves pre-built static files
- Built-in API and WebSocket proxying
- Automatic gzip/brotli compression
- Aggressive caching headers
- ~50MB image size

**Build command:**
```bash
docker build --target production -t bollalabz/frontend:nginx .
```

### Option 2: Node.js Server (Recommended for Railway)

**Best for:**
- Railway, Heroku, or similar PaaS platforms
- Environments requiring Node.js runtime
- When you need dynamic server-side logic

**Features:**
- Express.js server with SPA fallback
- Runtime environment variable support
- Health check endpoints
- ~200MB image size

**Build command:**
```bash
docker build --target node-server -t bollalabz/frontend:node .
```

---

## Quick Start

### Prerequisites

- Docker 20.10+ installed
- Docker Compose 1.29+ (optional)
- Node.js 18+ (for local development)

### 1. Local Development Build

```bash
# Build nginx variant
docker build --target production -t bollalabz-frontend:latest .

# Run container
docker run -p 8080:80 bollalabz-frontend:latest

# Visit http://localhost:8080
```

### 2. Using Docker Compose

```bash
# Nginx variant
docker-compose -f docker-compose.frontend.yml up -d frontend-nginx

# Node.js variant
docker-compose -f docker-compose.frontend.yml up -d frontend-node

# View logs
docker-compose -f docker-compose.frontend.yml logs -f
```

### 3. Using Build Script

```bash
# Build locally
./docker-build.sh

# Build and push to registry
./docker-build.sh --push --tag v1.0.0

# Build Node.js variant
./docker-build.sh --target node-server
```

---

## Build Configuration

### Build Arguments

Pass environment variables at build time:

```bash
docker build \
  --target production \
  --build-arg VITE_API_URL=https://api.bollalabz.com \
  --build-arg VITE_WS_URL=wss://api.bollalabz.com/ws \
  --build-arg VITE_ENVIRONMENT=production \
  --build-arg VITE_SENTRY_DSN=your-sentry-dsn \
  -t bollalabz/frontend:latest \
  .
```

### Multi-Platform Builds

```bash
# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --target production \
  -t bollalabz/frontend:latest \
  --push \
  .
```

---

## Environment Variables

### Build-Time Variables (ARG)

These are baked into the built JavaScript bundle:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | Backend API URL |
| `VITE_WS_URL` | `/ws` | WebSocket URL |
| `VITE_USE_MOCKS` | `false` | Enable mock data |
| `VITE_ENVIRONMENT` | `production` | Environment name |
| `VITE_SENTRY_DSN` | - | Sentry DSN for error tracking |
| `SENTRY_AUTH_TOKEN` | - | Sentry auth token for source maps |
| `SENTRY_ORG` | `bollalabz` | Sentry organization |

### Runtime Variables (ENV)

For the **nginx variant**, these are injected at container startup:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | Override API URL at runtime |
| `VITE_WS_URL` | `/ws` | Override WebSocket URL at runtime |

For the **Node.js variant**:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `8080` | Server port |

### Using .env Files

Create a `.env` file in the frontend directory:

```env
# Build-time variables
VITE_API_URL=https://api.bollalabz.com
VITE_WS_URL=wss://api.bollalabz.com/ws
VITE_ENVIRONMENT=production
VITE_SENTRY_DSN=your-sentry-dsn
```

Build with .env:

```bash
docker build --env-file .env --target production -t bollalabz/frontend:latest .
```

---

## Production Deployment

### Railway Deployment

Railway automatically detects and builds Docker images. Use the **node-server** target:

**Option 1: Railway.json configuration**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "frontend/Dockerfile",
    "buildTarget": "node-server"
  },
  "deploy": {
    "numReplicas": 1,
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**Option 2: Nixpacks override**

Create `frontend/nixpacks.toml`:

```toml
[phases.build]
cmds = ["docker build --target node-server -t frontend ."]
```

### VPS Deployment (Docker Compose)

1. **Clone repository on VPS:**

```bash
git clone https://github.com/yourusername/bollalabz-railway
cd bollalabz-railway/frontend
```

2. **Create production .env:**

```bash
cat > .env.production <<EOF
VITE_API_URL=https://api.bollalabz.com
VITE_WS_URL=wss://api.bollalabz.com/ws
VITE_ENVIRONMENT=production
EOF
```

3. **Build and run:**

```bash
# Using docker-compose
docker-compose -f docker-compose.frontend.yml up -d frontend-nginx

# Or using Docker directly
docker build --target production --env-file .env.production -t bollalabz-frontend .
docker run -d -p 80:80 --name bollalabz-frontend bollalabz-frontend
```

4. **Set up reverse proxy (optional):**

If you want SSL/TLS with Let's Encrypt, add nginx/Caddy in front:

```yaml
# Add to docker-compose.frontend.yml
services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - frontend-nginx
```

### Kubernetes Deployment

Example deployment manifest:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bollalabz-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bollalabz-frontend
  template:
    metadata:
      labels:
        app: bollalabz-frontend
    spec:
      containers:
      - name: frontend
        image: bollalabz/frontend:latest
        ports:
        - containerPort: 80
        env:
        - name: VITE_API_URL
          value: "https://api.bollalabz.com"
        - name: VITE_WS_URL
          value: "wss://api.bollalabz.com/ws"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
---
apiVersion: v1
kind: Service
metadata:
  name: bollalabz-frontend
spec:
  selector:
    app: bollalabz-frontend
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

---

## Nginx Configuration Details

### SPA Routing

The nginx configuration handles SPA routing by serving `index.html` for all non-file requests:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### API Proxy

Proxies `/api/*` requests to backend service:

```nginx
location /api/ {
    proxy_pass http://backend:3001;
    proxy_set_header Host $host;
    # ... additional headers
}
```

### WebSocket Proxy

Handles WebSocket connections at `/ws`:

```nginx
location /ws {
    proxy_pass http://backend:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Caching Strategy

- **Static assets** (JS, CSS, images): 1 year cache with immutable flag
- **Service worker** (`sw.js`): No cache (must be fresh)
- **HTML files**: No cache (for SPA updates)

---

## Troubleshooting

### Common Issues

#### 1. Build fails with "index.html not found"

**Cause:** Vite build failed during Docker build

**Solution:**
```bash
# Check build logs
docker build --target production --progress=plain -t test-build .

# Verify locally first
npm run build:no-typecheck
ls -la dist/
```

#### 2. Environment variables not working

**For nginx variant:**
- Build-time vars are baked into JS bundle
- Runtime vars require placeholder replacement (handled by startup script)

**For Node.js variant:**
- Use environment variables directly (no placeholder needed)

#### 3. WebSocket connections failing

**Check nginx configuration:**
```nginx
# Ensure these headers are present
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

**Check CORS/CSP headers:**
```nginx
# Update CSP to allow WebSocket connections
connect-src 'self' wss://*.bollalabz.com;
```

#### 4. Container won't start

**Check logs:**
```bash
docker logs bollalabz-frontend
```

**Common causes:**
- Port already in use: Change host port mapping
- Missing environment variables: Check .env file
- Insufficient resources: Increase Docker memory limit

#### 5. Assets not loading (404 errors)

**Verify build output is copied:**
```bash
docker run -it bollalabz/frontend:latest sh
ls -la /usr/share/nginx/html/
```

**Check nginx root directive:**
```nginx
root /usr/share/nginx/html;
```

---

## Performance Optimization

### Image Size Optimization

Current optimizations:
- Multi-stage build eliminates build dependencies
- Alpine Linux base (minimal OS)
- Only production npm dependencies
- Pre-compressed assets (gzip + brotli)

**Further optimization:**
```bash
# Analyze image layers
docker history bollalabz/frontend:latest

# Remove unused dependencies
npm prune --production
```

### Runtime Performance

- Enable brotli compression in nginx
- Use CDN for static assets
- Implement service worker caching
- Enable HTTP/2 in production

---

## Security Considerations

### Security Headers

The nginx configuration includes:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy` with appropriate directives
- `Referrer-Policy: strict-origin-when-cross-origin`

### Secrets Management

**Never hardcode secrets in:**
- Dockerfile
- docker-compose.yml
- Source code

**Use:**
- Environment variables
- Docker secrets (Swarm)
- Kubernetes secrets
- External secret managers (AWS Secrets Manager, HashiCorp Vault)

---

## Monitoring and Logging

### Health Checks

Both variants expose `/health` endpoint:

```bash
# Check health
curl http://localhost:8080/health
```

### Logging

**View real-time logs:**
```bash
docker logs -f bollalabz-frontend
```

**Configure log rotation:**
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

## Additional Resources

- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
- [Railway Docker Deployment](https://docs.railway.app/deploy/dockerfiles)

---

**Last Updated:** 2025-11-25
**Maintained By:** BollaLabz Team
