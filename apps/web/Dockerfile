# 10 December 2025 07 10 00
# BollaLabz Web - Production-Optimized Next.js Standalone Build
# Based on RAG: coolify-examples/turbo-nextjs/Dockerfile

# ============================================
# Base image with pnpm
# ============================================
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.14.0 --activate

# ============================================
# Build Stage
# ============================================
FROM base AS builder
WORKDIR /app

# Copy .npmrc for hoisted node_modules
COPY .npmrc ./

# Copy all files (monorepo structure)
COPY . .

# Install dependencies with hoisted node_modules
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build arguments for Clerk
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_API_URL

# Set build environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the Next.js app
RUN pnpm turbo run build --filter=@repo/web...

# ============================================
# Production Runner
# ============================================
FROM node:22-alpine AS runner
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl dumb-init && apk upgrade --no-cache

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output (following RAG turbo-nextjs pattern)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || curl -f http://localhost:3000 || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run server (path depends on standalone output structure)
CMD ["node", "apps/web/server.js"]
