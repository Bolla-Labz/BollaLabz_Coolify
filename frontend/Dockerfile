# Last Modified: 2025-11-25 03:10
# BollaLabz Frontend Dockerfile
# Multi-stage build optimized for production deployment with nginx
# Supports runtime environment variable injection

# ============================================================================
# Stage 1: Dependencies Installation
# ============================================================================
FROM node:22-alpine AS deps

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev

# Copy package files
COPY package*.json ./

# Install dependencies with legacy-peer-deps
# Use npm ci if lockfile exists, otherwise npm install
RUN if [ -f package-lock.json ]; then \
      npm ci --legacy-peer-deps; \
    else \
      npm install --legacy-peer-deps; \
    fi

# ============================================================================
# Stage 2: Build Application
# ============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Accept build arguments for environment variables
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_USE_MOCKS=false
ARG VITE_ENVIRONMENT=production
ARG VITE_SENTRY_DSN
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_USE_MOCKS=${VITE_USE_MOCKS}
ENV VITE_ENVIRONMENT=${VITE_ENVIRONMENT}
ENV VITE_SENTRY_DSN=${VITE_SENTRY_DSN}
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
ENV SENTRY_ORG=${SENTRY_ORG}

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the application (without typecheck for faster builds)
# Environment variables are baked into the build
RUN npm run build:no-typecheck

# Verify build output
RUN ls -la dist/ && \
    test -f dist/index.html || (echo "Build failed: index.html not found" && exit 1)

# ============================================================================
# Stage 3: Production with Nginx
# ============================================================================
FROM nginx:alpine AS production

# Install required tools for healthcheck and runtime config
RUN apk add --no-cache \
    wget \
    bash \
    nodejs \
    npm

WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built application from builder stage
COPY --from=builder /app/dist .

# Copy nginx configuration
COPY nginx.frontend.conf /etc/nginx/conf.d/default.conf

# Create environment variable injection script
COPY <<'EOF' /docker-entrypoint.d/40-envsubst-on-app.sh
#!/bin/sh
# Runtime environment variable injection for frontend
# This replaces __ENV_PLACEHOLDER__ patterns in built JS files

set -e

echo "🔧 Injecting runtime environment variables..."

# Default values if not provided
VITE_API_URL="${VITE_API_URL:-/api}"
VITE_WS_URL="${VITE_WS_URL:-/ws}"
VITE_USE_MOCKS="${VITE_USE_MOCKS:-false}"
VITE_ENVIRONMENT="${VITE_ENVIRONMENT:-production}"

# Find all JS files and replace environment placeholders
find /usr/share/nginx/html/assets/js -type f -name "*.js" -exec \
  sed -i \
    -e "s|__VITE_API_URL__|${VITE_API_URL}|g" \
    -e "s|__VITE_WS_URL__|${VITE_WS_URL}|g" \
    -e "s|__VITE_USE_MOCKS__|${VITE_USE_MOCKS}|g" \
    -e "s|__VITE_ENVIRONMENT__|${VITE_ENVIRONMENT}|g" \
  {} \; 2>/dev/null || true

echo "✅ Environment variables injected successfully"
echo "   VITE_API_URL: ${VITE_API_URL}"
echo "   VITE_WS_URL: ${VITE_WS_URL}"
echo "   VITE_USE_MOCKS: ${VITE_USE_MOCKS}"
echo "   VITE_ENVIRONMENT: ${VITE_ENVIRONMENT}"
EOF

RUN chmod +x /docker-entrypoint.d/40-envsubst-on-app.sh

# Expose port 80 (standard for nginx)
EXPOSE 80

# Health check using nginx
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Labels for metadata
LABEL maintainer="BollaLabz"
LABEL service="frontend"
LABEL version="1.0.0"
LABEL description="BollaLabz React/Vite frontend with nginx"

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]

# ============================================================================
# Stage 4: Node.js Server (Alternative to Nginx)
# ============================================================================
FROM node:22-alpine AS node-server

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Copy package files and built application
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY serve-frontend.js ./

# Install production dependencies only
RUN npm ci --omit=dev --legacy-peer-deps

# Environment variable defaults
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# Labels
LABEL maintainer="BollaLabz"
LABEL service="frontend-node"
LABEL version="1.0.0"
LABEL description="BollaLabz React/Vite frontend with Node.js server"

# Start the server
CMD ["node", "serve-frontend.js"]
