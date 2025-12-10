# 10 December 2025 16 00 00
# BollaLabz Web - Coolify-Compatible Next.js Standalone Build
# Simplified for Coolify deployment (no BuildKit cache mounts)

# ============================================
# Build Stage
# ============================================
FROM node:22-alpine AS builder
WORKDIR /app

# CRITICAL: Override NODE_ENV to development for dependency installation
# Coolify injects NODE_ENV=production as build ARG which causes pnpm to skip devDeps
ENV NODE_ENV=development

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.14.0 --activate

# Copy .npmrc for hoisted node_modules
COPY .npmrc ./

# Copy dependency manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
COPY apps/web/package.json ./apps/web/

# Install dependencies (including devDeps needed for build)
# Override NODE_ENV at command level to prevent Coolify's injected ARG from skipping devDeps
RUN NODE_ENV=development pnpm install --frozen-lockfile

# Copy source code
COPY packages ./packages
COPY apps/web ./apps/web

# Build arguments for Clerk (must come after source copy for correct ordering)
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_API_URL

# Set build environment - NOW set production for Next.js build optimization
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

# Copy standalone output
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
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run server
CMD ["node", "apps/web/server.js"]
