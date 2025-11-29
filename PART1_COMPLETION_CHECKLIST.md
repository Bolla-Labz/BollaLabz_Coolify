# BollaLabz Part 1 - Completion Checklist

**CRITICAL**: Complete ALL items before proceeding to Part 2

## 🚨 Immediate Security Fix
- [ ] Create `.gitignore` file with proper exclusions

## Task 1.1: Initialize Turborepo Monorepo ✅ PARTIAL
- [x] Create `package.json` (needs adjustment)
- [x] Create `pnpm-workspace.yaml`
- [x] Create `turbo.json`
- [ ] Run `pnpm install` to initialize

## Task 1.2: Setup Shared Configs Package (0/4 files)
- [ ] Create `packages/config/package.json`
- [ ] Create `packages/config/eslint/index.js`
- [ ] Create `packages/config/typescript/base.json`
- [ ] Create `packages/config/tailwind/config.ts`

## Task 1.3: Create Shared Types Package (0/3 files)
- [ ] Create `packages/types/package.json`
- [ ] Create `packages/types/tsconfig.json`
- [ ] Create `packages/types/src/index.ts` with all type definitions

## Task 1.4: Initialize Next.js App (0/4+ files)
- [ ] Run `pnpm create next-app@15.5 web` in apps directory
- [ ] Update `apps/web/package.json` with workspace deps
- [ ] Update `apps/web/tsconfig.json` to extend base
- [ ] Create `apps/web/src/app/layout.tsx` with ClerkProvider
- [ ] Create `apps/web/src/app/page.tsx`

## Task 1.5: Setup Hono API Gateway (0/3 files)
- [ ] Create `apps/api/package.json`
- [ ] Create `apps/api/tsconfig.json`
- [ ] Create `apps/api/src/index.ts` with health endpoint

## Task 1.6: Configure Database Package (0/4 files)
- [ ] Create `packages/db/package.json`
- [ ] Create `packages/db/drizzle.config.ts`
- [ ] Create `packages/db/src/index.ts`
- [ ] Create `packages/db/src/schema/index.ts` (placeholder)

## Task 1.7: Setup Clerk Authentication (0/5 files)
- [ ] Create Clerk account at clerk.com
- [ ] Enable passkeys in Clerk dashboard
- [ ] Create `apps/web/.env.local` with Clerk keys
- [ ] Create `apps/web/src/middleware.ts`
- [ ] Create sign-in page at `apps/web/src/app/sign-in/[[...sign-in]]/page.tsx`
- [ ] Create sign-up page at `apps/web/src/app/sign-up/[[...sign-up]]/page.tsx`

## Task 1.8: Configure Coolify Deployment (0/2 files)
- [ ] Create `apps/web/Dockerfile`
- [ ] Create `apps/api/Dockerfile`
- [ ] Configure Coolify project
- [ ] Add VPS2 as remote server
- [ ] Create application deployments

## Documentation (1/4 files)
- [ ] Create root `CLAUDE.md`
- [ ] Create `.claude/commands/fix-issue.md`
- [ ] Create `.claude/commands/add-feature.md`
- [ ] Create `.claude/commands/voice-test.md`

## Infrastructure Verification
- [ ] Test SSH access to VPS1 (31.220.55.252)
- [ ] Test SSH access to VPS2 (93.127.197.222)
- [ ] Verify Tailscale mesh connectivity
- [ ] Access Coolify dashboard at http://31.220.55.252:8000
- [ ] Add VPS2 as remote server in Coolify

## Final Validation
- [ ] Run `pnpm install` successfully
- [ ] Run `pnpm build` successfully
- [ ] Run `pnpm dev` and verify:
  - Next.js app starts on port 3000
  - Hono API starts on port 4000
- [ ] Access http://localhost:3000 and see home page
- [ ] Access http://localhost:4000/health and get JSON response
- [ ] Verify Clerk authentication flow works

## File Count Verification
**Current**: 7/26+ files (27% complete)
**Required**: 26+ files minimum

---

## Priority Order for Completion:

1. **Security**: Create .gitignore immediately
2. **Packages**: Create config, types, db packages (foundation)
3. **Applications**: Initialize Next.js and Hono apps
4. **Authentication**: Configure Clerk
5. **Deployment**: Create Dockerfiles
6. **Documentation**: Complete CLAUDE.md and commands
7. **Infrastructure**: Verify VPS setup
8. **Testing**: Run full integration tests

---

**IMPORTANT**: Each task builds on the previous one. Complete them in order for best results.