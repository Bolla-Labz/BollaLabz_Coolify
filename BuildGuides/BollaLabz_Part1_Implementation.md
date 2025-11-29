# Part 1: Foundation & Infrastructure

**BollaLabz Command Center Implementation Guide**  
**Phase 1: Weeks 1-2 | Tasks 1.1-1.8 | 26 Files Total**

---

## Overview

This document covers the foundational infrastructure setup for the BollaLabz AI Command Center, including VPS configuration, Coolify deployment platform, Tailscale mesh networking, and monorepo initialization.

### Infrastructure Summary

| VPS | Role | IP Address | RAM | OS |
|-----|------|------------|-----|-----|
| VPS1 | Control Plane | 31.220.55.252 | 8GB | Ubuntu 24.04 with Coolify |
| VPS2 | Application Workloads | 93.127.197.222 | 8GB | Ubuntu 24.04 with Docker |

### Validated Technology Stack (Version Matrix)

| Layer | Technology | Validated Version | Status | Notes |
|-------|------------|-------------------|--------|-------|
| **Frontend** | Next.js | **15.5** | ✅ | v16 optional; v15.5 safer |
| | shadcn/ui | CLI **3.5.1** | ✅ | Updated for Tailwind v4 |
| | Tailwind CSS | **4.1.17** | ✅ | Stable since Jan 22, 2025 |
| | TanStack Query | **5.90.11** | ✅ | Mature, excellent |
| | Zustand | **5.0.8** | ✅ | Use `useShallow` for objects |
| **Backend** | Hono | **4.10.7** | ✅ | Production-ready, ~12KB bundle |
| | FastAPI | **0.122.0** | ✅ | Requires Pydantic v2 |
| | Auth | **Clerk** | ✅ | NOT Auth.js v5 (experimental) |
| **Database** | PostgreSQL | **17.7** | ✅ | Recommended |
| | pgvector | **0.8.1** | ✅ | HNSW indexes, halfvec support |
| **Cache/Queue** | Redis | **7.4.x** | ✅ | License changed to RSALv2 |
| | BullMQ | **5.65.0** | ✅ | Stable |
| **Workflow** | Windmill | **1.538.0** | ✅ | 287MB verified |
| **Voice STT** | Deepgram Nova-3 | Streaming | ✅ | NOT Whisper API (batch-only) |
| **Voice TTS** | ElevenLabs | `eleven_flash_v2_5` | ✅ | ~75ms inference |
| **AI/LLM** | Claude Sonnet 4 | `claude-sonnet-4` | ✅ | Also Sonnet 4.5 available |
| **Telephony** | Telnyx | Latest | ✅ | 20-40% cheaper than Twilio |
| **Deployment** | Coolify | **4.0.0-beta.400+** | ✅ | Mature beta |
| **Networking** | Tailscale | Latest | ✅ | 20-40MB RAM overhead |

---

# Level 1: Phase 1 - Foundation

## Level 2: VPS Initial Configuration

### Level 3: Task 1.0 - VPS Baseline Setup (Pre-requisite)

#### Level 4: Step 1.0.1 - Connect to VPS1 (Control Plane)

```bash
# Connect via SSH
ssh root@31.220.55.252

# Verify system
uname -a
cat /etc/os-release
free -h
df -h
```

#### Level 4: Step 1.0.2 - Configure Swap on VPS1

```bash
# Create 4GB swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for production
sudo sysctl -w vm.swappiness=10
sudo sysctl -w vm.vfs_cache_pressure=50
echo "vm.swappiness=10" >> /etc/sysctl.conf
echo "vm.vfs_cache_pressure=50" >> /etc/sysctl.conf

# Verify swap
free -h
swapon --show
```

#### Level 4: Step 1.0.3 - Connect to VPS2 (Application Workloads)

```bash
# Connect via SSH
ssh root@93.127.197.222

# Verify system
uname -a
cat /etc/os-release
free -h
df -h
```

#### Level 4: Step 1.0.4 - Configure Swap on VPS2

```bash
# Create 4GB swap (same commands as VPS1)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for production
sudo sysctl -w vm.swappiness=10
sudo sysctl -w vm.vfs_cache_pressure=50
echo "vm.swappiness=10" >> /etc/sysctl.conf
echo "vm.vfs_cache_pressure=50" >> /etc/sysctl.conf

# Verify swap
free -h
swapon --show
```

#### Level 4: Step 1.0.5 - Install Tailscale on Both VPS

**On VPS1 (31.220.55.252):**
```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Authenticate and connect
sudo tailscale up

# Follow the URL to authenticate in browser
# Note the Tailscale IP assigned (e.g., 100.x.x.x)

# Verify connection
tailscale status
tailscale ip -4
```

**On VPS2 (93.127.197.222):**
```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Authenticate and connect
sudo tailscale up

# Note the Tailscale IP assigned
tailscale status
tailscale ip -4
```

> **✅ Verification Checkpoint: VPS Baseline**
> - [ ] Both VPS accessible via SSH
> - [ ] Swap configured and active on both (4GB each)
> - [ ] Tailscale installed and authenticated on both
> - [ ] Both VPS visible in Tailscale admin console
> - [ ] Can ping VPS2 from VPS1 using Tailscale IP

---

### ⚠️ Debugging Gate: Tailscale Mesh Connectivity

**Common Issues:**

| Symptom | Cause | Resolution |
|---------|-------|------------|
| `tailscale up` hangs | Firewall blocking UDP 41641 | `sudo ufw allow 41641/udp` |
| Nodes not seeing each other | Different Tailscale accounts | Ensure same account on both |
| Connection times out | NAT traversal failing | Enable Tailscale relay: `tailscale up --accept-routes` |
| "Not connected" status | Authentication expired | Run `tailscale logout` then `tailscale up` again |

**Diagnostic Commands:**
```bash
# Check Tailscale status
tailscale status

# Check network connectivity
tailscale netcheck

# View detailed debug info
tailscale debug

# Check firewall rules
sudo ufw status
sudo iptables -L -n
```

---

## Level 2: Control Plane Setup (VPS1)

### Level 3: Task 1.0.6 - Verify Coolify Installation

VPS1 comes with Coolify pre-installed. Verify and configure:

#### Level 4: Step 1.0.6a - Access Coolify Dashboard

```bash
# On VPS1, check Coolify status
docker ps | grep coolify

# Check Coolify logs
docker logs coolify -f --tail 100
```

Access Coolify at: `http://31.220.55.252:8000`

#### Level 4: Step 1.0.6b - Initial Coolify Configuration

1. Navigate to `http://31.220.55.252:8000`
2. Complete initial setup wizard
3. Create admin account
4. Configure settings:
   - Set instance name: `bollalabz-control`
   - Configure email notifications (optional)
   - Set timezone

#### Level 4: Step 1.0.6c - Add VPS2 as Destination Server

In Coolify Dashboard:
1. Go to **Servers** → **Add Server**
2. Select "Remote Server"
3. Enter details:
   - Name: `bollalabz-app`
   - IP Address: Use Tailscale IP of VPS2 (100.x.x.x)
   - SSH Port: 22
   - User: root
4. Generate and copy SSH key to VPS2:
   ```bash
   # On VPS2, add Coolify's public key to authorized_keys
   # Copy the key shown in Coolify UI
   echo "ssh-ed25519 AAAA..." >> ~/.ssh/authorized_keys
   ```
5. Test connection in Coolify

> **✅ Verification Checkpoint: Control Plane**
> - [ ] Coolify dashboard accessible at port 8000
> - [ ] Admin account created
> - [ ] VPS2 added as remote server in Coolify
> - [ ] SSH connection from Coolify to VPS2 working

---

### ⚠️ Debugging Gate: Coolify to VPS2 Connection

**Common Issues:**

| Symptom | Cause | Resolution |
|---------|-------|------------|
| SSH connection refused | Wrong IP or firewall | Use Tailscale IP, check `ufw allow 22` |
| Permission denied | SSH key not added | Verify key in `~/.ssh/authorized_keys` |
| Timeout connecting | Tailscale not routing | Check `tailscale status` on both nodes |
| Docker not found | Docker not installed | Run `curl -fsSL https://get.docker.com | sh` on VPS2 |

**Diagnostic Commands:**
```bash
# From VPS1, test SSH to VPS2 via Tailscale
ssh root@<vps2-tailscale-ip>

# Check Docker on VPS2
docker version
docker info

# Check Coolify can reach VPS2
curl -v telnet://<vps2-tailscale-ip>:22
```

---

## Level 2: Memory Budget Allocation

### Level 3: VPS1 Control Plane Memory Budget (8GB Total)

| Service | Allocation | Notes |
|---------|------------|-------|
| Ubuntu 24.04 OS | 300MB | Base overhead |
| Coolify + internal DB + Redis | 1,000MB | Control plane services |
| Traefik reverse proxy | 50MB | Included with Coolify |
| Tailscale | 50MB | Mesh networking |
| Uptime Kuma | 300MB | Monitoring |
| **Build headroom** | 2,000MB | Temporary during deployments |
| **Available buffer** | 4,300MB | OS cache, emergencies |

### Level 3: VPS2 Application Workloads Memory Budget (8GB Total)

| Service | Allocation | Notes |
|---------|------------|-------|
| Ubuntu 24.04 OS | 300MB | Base overhead |
| Docker runtime | 200MB | Container management |
| Tailscale | 50MB | Mesh networking |
| PostgreSQL 17 + pgvector | 2,048MB | `shared_buffers=2GB` |
| Redis 7.4 | 512MB | Job queues, caching |
| Windmill | 300MB | Workflow engine |
| Next.js application | 512MB | Frontend + API |
| Hono API gateway | 128MB | Lightweight |
| FastAPI AI service | 512MB | Python ML endpoints |
| **Buffer** | 3,438MB | Peak loads, OS cache |

---

## Level 2: Monorepo Initialization

### Level 3: Task 1.1 - Initialize Turborepo Monorepo (3 Files)

#### Level 4: Step 1.1.1 - Create Project Directory

On your **local development machine**:

```bash
# Create project directory
mkdir ai-command-center
cd ai-command-center

# Initialize git
git init
```

#### Level 4: Step 1.1.2 - Create package.json (Root)

Create `package.json`:

```json
{
  "name": "ai-command-center",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "typecheck": "turbo run typecheck",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:migrate": "turbo run db:migrate",
    "db:studio": "pnpm --filter @repo/db db:studio"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.7.0"
  },
  "packageManager": "pnpm@9.14.0",
  "engines": {
    "node": ">=20.0.0"
  }
}
```

#### Level 4: Step 1.1.3 - Create pnpm-workspace.yaml

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "tools/*"
```

#### Level 4: Step 1.1.4 - Create turbo.json

Create `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["build"]
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

#### Level 4: Step 1.1.5 - Initialize pnpm and Install Dependencies

```bash
# Initialize pnpm
pnpm install

# Create directory structure
mkdir -p apps packages tools docs/plans .claude/commands
```

> **✅ Verification Checkpoint: Monorepo Init**
> - [ ] `package.json` created with correct scripts
> - [ ] `pnpm-workspace.yaml` created
> - [ ] `turbo.json` created
> - [ ] `pnpm install` completed without errors
> - [ ] Directory structure created

---

### Level 3: Task 1.2 - Setup Shared Configs Package (4 Files)

#### Level 4: Step 1.2.1 - Create Config Package Structure

```bash
mkdir -p packages/config/{eslint,typescript,tailwind}
```

#### Level 4: Step 1.2.2 - Create packages/config/package.json

```json
{
  "name": "@repo/config",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./eslint": "./eslint/index.js",
    "./typescript": "./typescript/base.json",
    "./tailwind": "./tailwind/config.ts"
  },
  "devDependencies": {
    "@eslint/js": "^9.16.0",
    "eslint": "^9.16.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-react": "^7.37.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "typescript-eslint": "^8.17.0"
  }
}
```

#### Level 4: Step 1.2.3 - Create packages/config/eslint/index.js

```javascript
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const reactPlugin = require("eslint-plugin-react");
const reactHooksPlugin = require("eslint-plugin-react-hooks");
const prettierConfig = require("eslint-config-prettier");

module.exports = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  prettierConfig
);
```

#### Level 4: Step 1.2.4 - Create packages/config/typescript/base.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "noEmit": false,
    "incremental": true,
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  },
  "exclude": ["node_modules", "dist", ".next", "build"]
}
```

#### Level 4: Step 1.2.5 - Create packages/config/tailwind/config.ts

```typescript
import type { Config } from "tailwindcss";

const config: Partial<Config> = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
```

> **✅ Verification Checkpoint: Config Package**
> - [ ] `packages/config/package.json` created
> - [ ] ESLint config exports correctly
> - [ ] TypeScript base config created
> - [ ] Tailwind config with CSS variables created

---

### Level 3: Task 1.3 - Create Shared Types Package (3 Files)

#### Level 4: Step 1.3.1 - Create Types Package Structure

```bash
mkdir -p packages/types/src
```

#### Level 4: Step 1.3.2 - Create packages/types/package.json

```json
{
  "name": "@repo/types",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

#### Level 4: Step 1.3.3 - Create packages/types/tsconfig.json

```json
{
  "extends": "@repo/config/typescript/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### Level 4: Step 1.3.4 - Create packages/types/src/index.ts

```typescript
// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Contact Types
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  tags: string[];
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  tags?: string[];
}

// Phone Record Types
export interface PhoneRecord {
  id: string;
  contactId?: string;
  phoneNumber: string;
  direction: "inbound" | "outbound";
  status: "completed" | "missed" | "voicemail" | "busy";
  duration: number;
  recordingUrl?: string;
  transcription?: string;
  summary?: string;
  sentiment?: "positive" | "neutral" | "negative";
  embedding?: number[];
  createdAt: Date;
}

// Task Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  contactId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Calendar Event Types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  location?: string;
  contactIds: string[];
  reminderMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Voice Types (for Part 3)
export interface VoiceSession {
  id: string;
  status: "active" | "ended";
  startTime: Date;
  endTime?: Date;
  transcripts: TranscriptSegment[];
}

export interface TranscriptSegment {
  speaker: "user" | "assistant";
  text: string;
  timestamp: Date;
  confidence?: number;
}
```

> **✅ Verification Checkpoint: Types Package**
> - [ ] `packages/types/package.json` created
> - [ ] `packages/types/tsconfig.json` extends base config
> - [ ] Core types defined (Contact, PhoneRecord, Task, CalendarEvent)
> - [ ] API response types defined

---

### Level 3: Task 1.4 - Initialize Next.js 15.5 App (4 Files)

#### Level 4: Step 1.4.1 - Create Next.js App

```bash
cd apps
pnpm create next-app@15.5 web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd ..
```

#### Level 4: Step 1.4.2 - Update apps/web/package.json

```json
{
  "name": "@repo/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@clerk/nextjs": "^6.9.0",
    "@repo/types": "workspace:*",
    "@repo/ui": "workspace:*",
    "@tanstack/react-query": "^5.90.11",
    "next": "15.5.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.8"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^4.1.17",
    "typescript": "^5.7.0"
  }
}
```

#### Level 4: Step 1.4.3 - Update apps/web/tsconfig.json

```json
{
  "extends": "@repo/config/typescript/base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "noEmit": true,
    "module": "esnext",
    "jsx": "preserve",
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@repo/types": ["../../packages/types/src"],
      "@repo/ui": ["../../packages/ui/src"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### Level 4: Step 1.4.4 - Create apps/web/src/app/layout.tsx

```typescript
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "BollaLabz Command Center",
  description: "AI-powered personal command center",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-background font-sans antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
```

#### Level 4: Step 1.4.5 - Create apps/web/src/app/page.tsx

```typescript
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">BollaLabz Command Center</h1>
      <p className="mt-4 text-muted-foreground">
        AI-powered personal command center
      </p>
    </main>
  );
}
```

> **✅ Verification Checkpoint: Next.js App**
> - [ ] Next.js 15.5 installed
> - [ ] Package.json updated with workspace dependencies
> - [ ] ClerkProvider wrapped in layout
> - [ ] `pnpm dev` starts without errors

---

### Level 3: Task 1.5 - Setup Hono API Gateway (3 Files)

#### Level 4: Step 1.5.1 - Create API App Structure

```bash
mkdir -p apps/api/src/{routes,middleware}
```

#### Level 4: Step 1.5.2 - Create apps/api/package.json

```json
{
  "name": "@repo/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format esm --dts",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@hono/node-server": "^1.13.0",
    "@repo/db": "workspace:*",
    "@repo/types": "workspace:*",
    "hono": "^4.10.7",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@types/node": "^22.10.0",
    "tsup": "^8.3.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

#### Level 4: Step 1.5.3 - Create apps/api/tsconfig.json

```json
{
  "extends": "@repo/config/typescript/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "ESNext",
    "moduleResolution": "bundler"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### Level 4: Step 1.5.4 - Create apps/api/src/index.ts

```typescript
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "0.0.1",
  });
});

// API routes will be added in Part 2
app.get("/", (c) => {
  return c.json({
    message: "BollaLabz API Gateway",
    docs: "/api/docs",
  });
});

const port = parseInt(process.env.PORT || "4000", 10);

console.log(`🚀 API Gateway running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
```

> **✅ Verification Checkpoint: Hono API**
> - [ ] `apps/api/package.json` created with Hono 4.10.7
> - [ ] Health endpoint at `/health` returns JSON
> - [ ] CORS configured for frontend origin
> - [ ] `pnpm dev` starts without errors

---

### Level 3: Task 1.6 - Configure Database Package (4 Files)

#### Level 4: Step 1.6.1 - Create Database Package Structure

```bash
mkdir -p packages/db/src/schema packages/db/drizzle
```

#### Level 4: Step 1.6.2 - Create packages/db/package.json

```json
{
  "name": "@repo/db",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./schema": {
      "types": "./dist/schema/index.d.ts",
      "import": "./dist/schema/index.js"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts src/schema/index.ts --format esm --dts",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "drizzle-orm": "^0.38.0",
    "pg": "^8.13.0",
    "postgres": "^3.4.5"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@types/pg": "^8.11.10",
    "drizzle-kit": "^0.30.0",
    "tsup": "^8.3.0",
    "typescript": "^5.7.0"
  }
}
```

#### Level 4: Step 1.6.3 - Create packages/db/drizzle.config.ts

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

#### Level 4: Step 1.6.4 - Create packages/db/src/index.ts

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Connection for queries
const queryClient = postgres(connectionString);

// Drizzle instance
export const db = drizzle(queryClient, { schema });

// Export schema for use in other packages
export * from "./schema";
export type { schema };
```

#### Level 4: Step 1.6.5 - Create packages/db/src/schema/index.ts (Placeholder)

```typescript
// Schema definitions will be added in Part 2
// This file exports all schema tables

export {};
```

> **✅ Verification Checkpoint: Database Package**
> - [ ] `packages/db/package.json` created with Drizzle ORM
> - [ ] `drizzle.config.ts` configured for PostgreSQL
> - [ ] Database connection module created
> - [ ] Schema placeholder created

---

### Level 3: Task 1.7 - Setup Clerk Authentication (3 Files)

#### Level 4: Step 1.7.1 - Create Clerk Account and Application

1. Go to [clerk.com](https://clerk.com) and sign up
2. Create new application: "BollaLabz Command Center"
3. Enable authentication methods:
   - Email/Password
   - Passkeys (enabled)
   - Google OAuth (optional)
4. Copy API keys from Dashboard

#### Level 4: Step 1.7.2 - Create apps/web/.env.local

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# API
NEXT_PUBLIC_API_URL=http://localhost:4000
```

#### Level 4: Step 1.7.3 - Create apps/web/src/middleware.ts

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
```

#### Level 4: Step 1.7.4 - Create Sign-In Page (apps/web/src/app/sign-in/[[...sign-in]]/page.tsx)

```bash
mkdir -p apps/web/src/app/sign-in/\[\[...sign-in\]\]
```

```typescript
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

#### Level 4: Step 1.7.5 - Create Sign-Up Page (apps/web/src/app/sign-up/[[...sign-up]]/page.tsx)

```bash
mkdir -p apps/web/src/app/sign-up/\[\[...sign-up\]\]
```

```typescript
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

> **✅ Verification Checkpoint: Clerk Auth**
> - [ ] Clerk account created with passkeys enabled
> - [ ] Environment variables set in `.env.local`
> - [ ] Middleware protects non-public routes
> - [ ] Sign-in and sign-up pages render Clerk components

---

### ⚠️ Debugging Gate: Clerk + Next.js Integration

**Common Issues:**

| Symptom | Cause | Resolution |
|---------|-------|------------|
| "Invalid publishable key" | Wrong key format | Ensure key starts with `pk_` |
| Middleware not running | Wrong matcher config | Check `config.matcher` patterns |
| Redirect loops | Incorrect URL config | Verify `NEXT_PUBLIC_CLERK_*_URL` values |
| Passkeys not showing | Not enabled in dashboard | Enable in Clerk Dashboard > User & Auth |
| CORS errors | API not allowing Clerk domain | Add Clerk domain to CORS allowlist |

**Diagnostic Steps:**
```typescript
// Add to layout.tsx temporarily to debug
console.log("Clerk Key:", process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.slice(0, 10));

// Check middleware is running
// In middleware.ts
console.log("Middleware running for:", request.url);
```

---

### Level 3: Task 1.8 - Configure Coolify Deployment (2 Files)

#### Level 4: Step 1.8.1 - Create Dockerfile for Next.js App

Create `apps/web/Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.0 --activate

FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/db/package.json ./packages/db/

# Install dependencies
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build packages first
RUN pnpm --filter @repo/types build
RUN pnpm --filter @repo/ui build

# Build the web app
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @repo/web build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "apps/web/server.js"]
```

#### Level 4: Step 1.8.2 - Create Dockerfile for Hono API

Create `apps/api/Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.0 --activate

FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY packages/db/package.json ./packages/db/

# Install dependencies
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build packages first
RUN pnpm --filter @repo/types build
RUN pnpm --filter @repo/db build

# Build the API
RUN pnpm --filter @repo/api build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000

CMD ["node", "dist/index.js"]
```

#### Level 4: Step 1.8.3 - Configure Coolify Applications

In Coolify Dashboard (http://31.220.55.252:8000):

**For Next.js Web App:**
1. Go to **Projects** → **Create Project** → "BollaLabz"
2. **Add Resource** → **Application** → **Docker**
3. Configure:
   - Name: `bollalabz-web`
   - Server: `bollalabz-app` (VPS2)
   - Repository: Your Git repository URL
   - Build Path: `apps/web`
   - Dockerfile Path: `apps/web/Dockerfile`
   - Port: 3000
4. Add Environment Variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_API_URL`
5. Set Domain (optional): `app.yourdomain.com`

**For Hono API:**
1. **Add Resource** → **Application** → **Docker**
2. Configure:
   - Name: `bollalabz-api`
   - Server: `bollalabz-app` (VPS2)
   - Build Path: `apps/api`
   - Dockerfile Path: `apps/api/Dockerfile`
   - Port: 4000
3. Add Environment Variables:
   - `DATABASE_URL`
   - `CORS_ORIGIN`
   - `CLERK_SECRET_KEY`
4. Set Domain (optional): `api.yourdomain.com`

> **✅ Verification Checkpoint: Coolify Deployment**
> - [ ] Dockerfiles created for web and API apps
> - [ ] Both applications configured in Coolify
> - [ ] Environment variables set
> - [ ] Test deployment succeeds

---

### ⚠️ Debugging Gate: Coolify Deployment Pipeline

**Common Issues:**

| Symptom | Cause | Resolution |
|---------|-------|------------|
| Build fails at pnpm install | Missing lockfile | Run `pnpm install` locally, commit lockfile |
| "Module not found" | Workspace deps not built | Ensure build order in Dockerfile |
| Container exits immediately | Missing env vars | Check Coolify env var configuration |
| Port not accessible | Firewall blocking | `ufw allow 3000` and `ufw allow 4000` on VPS2 |
| Deploy timeout | Low memory during build | Check VPS1 has enough headroom for builds |

**Diagnostic Commands:**
```bash
# On VPS2, check running containers
docker ps

# View container logs
docker logs <container_id> -f

# Check resource usage
docker stats

# Verify ports are listening
ss -tlnp | grep -E '3000|4000'
```

---

## Level 2: CLAUDE.md and Development Configuration

### Level 3: Create Root CLAUDE.md

Create `CLAUDE.md` in project root:

```markdown
# AI Command Center - Claude Code Instructions

When working in this codebase, prioritize type safety, follow the established patterns, 
and keep files under 200 lines. Always run typecheck after changes.

## Project Overview
Personal AI-powered command center with phone management, calendar/task management, 
relationship intelligence, and voice-first interaction. Monorepo using Turborepo.

## Tech Stack
- Frontend: Next.js 15.5, shadcn/ui, Tailwind CSS 4.1, TanStack Query 5, Zustand 5
- Backend: Hono 4.10 (API gateway), FastAPI 0.122 (AI service)
- Database: PostgreSQL 17 + pgvector 0.8.1
- Queue: Redis 7.4 + BullMQ 5.65
- Workflow: Windmill 1.538
- Auth: Clerk (passkeys enabled)
- Voice: Deepgram Nova-3 (STT), ElevenLabs Flash v2.5 (TTS), Claude Sonnet 4 (LLM)

## Key Directories
```
apps/
├── web/              # Next.js frontend application
├── api/              # Hono API gateway
└── ai-service/       # FastAPI Python AI endpoints

packages/
├── ui/               # Shared shadcn/ui components
├── db/               # Drizzle ORM schema + migrations
├── types/            # Shared TypeScript types
└── config/           # ESLint, TS, Tailwind configs
```

## Common Commands
```bash
pnpm dev              # Start all services in dev mode
pnpm build            # Build all packages
pnpm typecheck        # Run TypeScript checks
pnpm test             # Run test suites
pnpm db:migrate       # Run database migrations
pnpm db:studio        # Open Drizzle Studio
turbo run lint        # Lint all packages
```

## Code Standards
- TypeScript strict mode everywhere
- Use Zod for runtime validation
- Prefer server components; use 'use client' sparingly
- TanStack Query for server state, Zustand for client UI state
- All API responses typed with shared `@repo/types`
- Test files: `*.test.ts` colocated with source

## Workflow
1. Run `pnpm typecheck` after completing changes
2. Run single test files during development: `pnpm test -- path/to/file.test.ts`
3. Keep PRs focused: 3-5 files maximum per task
4. Document non-obvious logic inline
5. Use barrel exports (`index.ts`) for package public APIs

## Database Patterns
- Use Drizzle ORM for all queries
- Vector columns: use `halfvec(768)` for embeddings (50% memory savings)
- Always add indexes for filtered + vector columns

## Voice Pipeline
- STT: Deepgram streaming WebSocket at `/api/voice/transcribe`
- TTS: ElevenLabs streaming at `/api/voice/synthesize`  
- LLM: Claude streaming at `/api/voice/respond`
- End-to-end latency target: <1.2 seconds

## IMPORTANT
- NEVER commit .env files
- Use Clerk for all auth—Auth.js passkeys are experimental
- PostgreSQL only—no Supabase self-hosted (too heavy for 8GB VPS)
- Voice STT must use Deepgram, NOT Whisper API (batch-only, too slow)
```

### Level 3: Create Custom Claude Commands

Create `.claude/commands/fix-issue.md`:

```markdown
Analyze and fix GitHub issue: $ARGUMENTS

1. Run `gh issue view $ARGUMENTS` to get details
2. Search codebase for relevant files
3. Implement fix following project patterns
4. Write/update tests
5. Run `pnpm typecheck && pnpm test`
6. Create descriptive commit
7. Push and create PR with `gh pr create`
```

Create `.claude/commands/add-feature.md`:

```markdown
Implement feature: $ARGUMENTS

1. Create plan in `docs/plans/$ARGUMENTS.md`
2. Identify affected packages (max 3-5 files per session)
3. Start with types in `@repo/types`
4. Implement backend endpoints
5. Add frontend components
6. Write integration tests
7. Update CLAUDE.md if new patterns introduced
```

Create `.claude/commands/voice-test.md`:

```markdown
Test voice pipeline end-to-end:

1. Start local services: `pnpm dev`
2. Verify Deepgram WebSocket connection
3. Test STT with sample audio
4. Verify Claude streaming response
5. Test ElevenLabs TTS output
6. Measure total latency (target: <1.2s)
7. Log results to `docs/voice-latency-log.md`
```

---

## Final Directory Structure (Part 1 Complete)

```
ai-command-center/
├── CLAUDE.md                    # Root project context
├── turbo.json                   # Turborepo configuration
├── pnpm-workspace.yaml
├── package.json
│
├── .claude/
│   └── commands/
│       ├── fix-issue.md
│       ├── add-feature.md
│       └── voice-test.md
│
├── apps/
│   ├── web/                     # Next.js 15.5 frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   │   └── sign-up/[[...sign-up]]/page.tsx
│   │   │   └── middleware.ts
│   │   ├── .env.local
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api/                     # Hono API gateway
│       ├── src/
│       │   └── index.ts
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── config/                  # Shared configs
│   │   ├── eslint/index.js
│   │   ├── typescript/base.json
│   │   ├── tailwind/config.ts
│   │   └── package.json
│   │
│   ├── db/                      # Database schema
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── schema/index.ts
│   │   ├── drizzle/
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   └── types/                   # Shared TypeScript types
│       ├── src/index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── tools/
└── docs/
    └── plans/
```

---

## Part 1 Summary

**Tasks Completed:** 8 (1.1-1.8)  
**Files Created:** 26+  
**Time Estimate:** Week 1-2

### What Was Established:

1. ✅ Both VPS configured with swap and Tailscale mesh
2. ✅ Coolify control plane operational
3. ✅ Turborepo monorepo initialized
4. ✅ Shared config, types, and database packages created
5. ✅ Next.js 15.5 frontend with Clerk authentication
6. ✅ Hono API gateway with health endpoint
7. ✅ Dockerfiles for deployment
8. ✅ CLAUDE.md and custom commands

### Next Steps (Part 2):
- PostgreSQL + pgvector installation on VPS2
- Database schema creation (contacts, phone_records, tasks, calendar_events)
- Full CRUD API endpoints in Hono
- Redis + BullMQ job queue setup
- Vector similarity search implementation

---

**End of Part 1**
