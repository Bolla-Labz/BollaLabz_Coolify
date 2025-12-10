# 10 December 2025 16 30 00
# BollaLabz API - Coolify-Compatible Multi-Stage Build
# Simplified for Coolify deployment (no BuildKit cache mounts)

# ============================================
# Stage 1: Build Application
# ============================================
FROM node:22-alpine AS builder
WORKDIR /app

# CRITICAL: Override NODE_ENV to development for build stage
# Coolify injects NODE_ENV=production as build ARG which causes pnpm to skip devDeps
ENV NODE_ENV=development

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.0 --activate

# Copy dependency manifests (must include ALL workspace packages for pnpm)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json .npmrc ./
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install all dependencies (including devDeps needed for build)
# Override NODE_ENV at command level to prevent Coolify's injected ARG from skipping devDeps
# Use prefer-frozen-lockfile instead of frozen-lockfile to handle platform differences
RUN NODE_ENV=development pnpm install --prefer-frozen-lockfile

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

# Copy node_modules from builder (already installed all deps)
COPY --from=builder /app/node_modules ./node_modules

# Copy built artifacts from builder
COPY --from=builder --chown=bollalabz:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=bollalabz:nodejs /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=bollalabz:nodejs /app/packages/types/dist ./packages/types/dist

# Copy package.json for node resolution
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

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
