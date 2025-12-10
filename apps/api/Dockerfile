# 09 December 2025 14 47 00
# BollaLabz API - Production-Optimized Multi-Stage Build
# Optimized for: Coolify deployment, minimal layers, maximum caching

# ============================================
# Stage 1: Dependency Installation
# ============================================
FROM node:22-alpine AS deps
WORKDIR /app

# Install pnpm with specific version for reproducibility
RUN corepack enable && corepack prepare pnpm@9.14.0 --activate

# Copy only dependency manifests for optimal layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json ./apps/api/

# Install ALL dependencies (needed for build)
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ============================================
# Stage 2: Build Application
# ============================================
FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm in builder stage
RUN corepack enable && corepack prepare pnpm@9.14.0 --activate

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/config/node_modules ./packages/config/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy source code and configuration
COPY pnpm-workspace.yaml package.json turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Build with Turbo cache
RUN --mount=type=cache,target=/app/.turbo \
    pnpm turbo run build --filter=@repo/api...

# ============================================
# Stage 3: Production Dependencies Only
# ============================================
FROM node:22-alpine AS prod-deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.14.0 --activate

# Copy dependency manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/

# Install ONLY production dependencies
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod --ignore-scripts

# ============================================
# Stage 4: Final Runtime Image
# ============================================
FROM node:22-alpine AS runner
WORKDIR /app

# Install runtime dependencies and security updates
RUN apk add --no-cache \
    curl \
    dumb-init \
    && apk upgrade --no-cache

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bollalabz

# Copy production dependencies
COPY --from=prod-deps --chown=bollalabz:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=bollalabz:nodejs /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=prod-deps --chown=bollalabz:nodejs /app/apps/api/node_modules ./apps/api/node_modules

# Copy built artifacts
COPY --from=builder --chown=bollalabz:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=bollalabz:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=bollalabz:nodejs /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=bollalabz:nodejs /app/packages/db/package.json ./packages/db/package.json
COPY --from=builder --chown=bollalabz:nodejs /app/packages/types/dist ./packages/types/dist
COPY --from=builder --chown=bollalabz:nodejs /app/packages/types/package.json ./packages/types/package.json
COPY --from=builder --chown=bollalabz:nodejs /app/package.json ./package.json

# Set ownership
RUN chown -R bollalabz:nodejs /app

# Switch to non-root user
USER bollalabz

# Set working directory to API
WORKDIR /app/apps/api

# Environment configuration
ENV NODE_ENV=production \
    PORT=4000 \
    HOST=0.0.0.0 \
    NODE_OPTIONS="--max-old-space-size=512"

# Expose port
EXPOSE 4000

# Health check for Coolify
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:4000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
