# 10 December 2025 09 10 00
# BollaLabz API - Coolify-Compatible Multi-Stage Build
# Simplified for Coolify deployment (no BuildKit cache mounts)

# ============================================
# Stage 1: Build Application
# ============================================
FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.0 --activate

# Copy dependency manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json .npmrc ./
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json ./apps/api/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages ./packages
COPY apps/api ./apps/api

# Build
RUN pnpm turbo run build --filter=@repo/api...

# ============================================
# Stage 2: Production Runtime
# ============================================
FROM node:22-alpine AS runner
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache curl dumb-init && apk upgrade --no-cache

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bollalabz

# Install pnpm for production deps
RUN corepack enable && corepack prepare pnpm@9.14.0 --activate

# Copy dependency manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy built artifacts from builder
COPY --from=builder --chown=bollalabz:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=bollalabz:nodejs /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=bollalabz:nodejs /app/packages/types/dist ./packages/types/dist

# Set ownership
RUN chown -R bollalabz:nodejs /app

USER bollalabz
WORKDIR /app/apps/api

# Environment
ENV NODE_ENV=production \
    PORT=4000 \
    HOST=0.0.0.0

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:4000/api/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/index.js"]
