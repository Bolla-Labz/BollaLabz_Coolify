# Last Modified: 2025-11-24 20:45
# BollaLabz Backend Production Dockerfile
# Multi-stage build for optimized image size and security

# Stage 1: Dependencies
FROM node:22-alpine AS deps

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for building)
RUN npm ci

# Stage 2: Builder
FROM node:22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Copy source code
COPY . .

# Build TypeScript if needed (check for tsconfig.json)
RUN if [ -f "tsconfig.json" ]; then npm run build || true; fi

# Prune dev dependencies
RUN npm prune --production

# Stage 3: Production
FROM node:22-alpine AS production

# Install only runtime dependencies (wget for healthcheck, dumb-init for proper signal handling)
RUN apk add --no-cache wget dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies and built app
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/server.js ./
COPY --from=builder --chown=nodejs:nodejs /app/api ./api
COPY --from=builder --chown=nodejs:nodejs /app/config ./config
COPY --from=builder --chown=nodejs:nodejs /app/middleware ./middleware
COPY --from=builder --chown=nodejs:nodejs /app/models ./models
COPY --from=builder --chown=nodejs:nodejs /app/services ./services
COPY --from=builder --chown=nodejs:nodejs /app/utils ./utils
COPY --from=builder --chown=nodejs:nodejs /app/validators ./validators
COPY --from=builder --chown=nodejs:nodejs /app/integrations ./integrations
COPY --from=builder --chown=nodejs:nodejs /app/types ./types
COPY --from=builder --chown=nodejs:nodejs /app/routes ./routes
COPY --from=builder --chown=nodejs:nodejs /app/webhooks ./webhooks

# If dist folder exists (TypeScript build), copy it (removed since backend doesn't have TypeScript)

# Create necessary directories
RUN mkdir -p logs uploads tmp public/audio && \
    chown -R nodejs:nodejs logs uploads tmp public

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check with proper endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start server
CMD ["node", "server.js"]
