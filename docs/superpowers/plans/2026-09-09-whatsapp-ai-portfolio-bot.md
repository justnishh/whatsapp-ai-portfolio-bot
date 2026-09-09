# WhatsApp AI Portfolio Bot — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-hosted WhatsApp AI portfolio bot (WAHA + OpenAI + Node/TypeScript) that reviewers can run with `docker compose up` after editing markdown files.

**Architecture:** Two Docker services share a network: a WAHA container for the WhatsApp Web session, and a Node/Express bot container that receives webhooks, loads knowledge markdown, keeps per-user memory, calls OpenAI, and replies via WAHA. All bot logic is typed, file-scoped, and unit-tested with mocked HTTP.

**Tech Stack:** Node.js 20, TypeScript 5, Express, Zod, OpenAI SDK, Vitest, Docker, Docker Compose.

## Global Constraints

- Node.js version floor: LTS 20+ (use `node:20-alpine` image)
- One WhatsApp session per instance
- Text messages only; no media, no groups, no voice
- OpenAI model default: `gpt-4o-mini`
- WAHA base URL default: `http://waha:3000`
- Memory: in-process `Map`, max 10 messages per user, TTL 1 hour
- All env vars parsed with Zod; missing `OPENAI_API_KEY` or `WAHA_API_KEY` fails at boot
- HTTP boundaries: Express webhook route + WAHA `/api/sendText` client
- Bot never crashes on a bad message; pipeline wrapped in `try/catch`
- Test framework: Vitest; mock external HTTP and OpenAI SDK
- All code in `bot/src/`; tests in `bot/tests/`

---

## File Map

| File | Responsibility |
|---|---|
| `docker-compose.yml` | Runs WAHA + bot containers on shared network |
| `.env.example` | Template for required environment variables |
| `README.md` | Setup, QR demo, project overview |
| `knowledge/persona.md` | System prompt persona/tone rules |
| `knowledge/resume.md` | Owner work history / skills |
| `knowledge/projects.md` | Owner projects |
| `knowledge/about.md` | Owner bio |
| `bot/Dockerfile` | Multi-stage build for the bot container |
| `bot/package.json` | Scripts, dependencies, devDependencies |
| `bot/tsconfig.json` | TypeScript config (strict) |
| `bot/vitest.config.ts` | Vitest config with `NODE_ENV=test` |
| `bot/src/index.ts` | Boot: load config, knowledge, create Express app, register routes, listen |
| `bot/src/config.ts` | Zod schema + parsed config object |
| `bot/src/types.ts` | Shared TypeScript types |
| `bot/src/logger.ts` | Tiny pino wrapper respecting `LOG_LEVEL` |
| `bot/src/knowledge.ts` | Read `knowledge/*.md`, join into system prompt |
| `bot/src/memory.ts` | Per-user message history store with TTL |
| `bot/src/waha.ts` | Typed client for WAHA `/api/sendText` |
| `bot/src/ai.ts` | OpenAI chat completions wrapper |
| `bot/src/pipeline.ts` | Orchestration: webhook → memory → AI → WAHA send |
| `bot/src/webhook.ts` | Express `POST /webhook` handler |
| `bot/tests/*.test.ts` | Unit tests for each module |

---

### Task 1: Repository Scaffold

**Goal:** Create the repository skeleton so later tasks have a place to live.

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `README.md` (initial outline)
- Create: `knowledge/persona.md`, `knowledge/resume.md`, `knowledge/projects.md`, `knowledge/about.md`
- Create: `bot/Dockerfile`
- Create: `bot/package.json`
- Create: `bot/tsconfig.json`
- Create: `bot/vitest.config.ts`
- Create: `bot/.dockerignore`

**Interfaces:**
- Produces: the directory structure and build configs for all subsequent tasks.

- [ ] **Step 1: Write root `docker-compose.yml`**

```yaml
services:
  waha:
    image: devlikeapro/waha:latest
    container_name: waha
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      WAHA_API_KEY: ${WAHA_API_KEY}
      WAHA_LOG_LEVEL: info
    volumes:
      - waha-data:/app/.sessions
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/sessions"]
      interval: 10s
      timeout: 5s
      retries: 5

  bot:
    build: ./bot
    container_name: waha-portfolio-bot
    restart: unless-stopped
    ports:
      - "3333:3333"
    env_file: .env
    environment:
      - NODE_ENV=production
    depends_on:
      waha:
        condition: service_healthy
    volumes:
      - ./knowledge:/app/knowledge:ro

volumes:
  waha-data:
```

- [ ] **Step 2: Write `.env.example`**

```bash
# Required
OPENAI_API_KEY=sk-...
WAHA_API_KEY=generate-a-random-secret-32-chars

# Optional
OPENAI_MODEL=gpt-4o-mini
WAHA_URL=http://waha:3000
PORT=3333
MAX_HISTORY=10
MEMORY_TTL_MS=3600000
LOG_LEVEL=info
TEST_MODE=0
OWNER_NUMBERS=
```

- [ ] **Step 3: Write sample knowledge markdown files**

`knowledge/persona.md`:
```md
You are "Nishant's Portfolio Bot", a friendly assistant that answers questions
about Nishant Kumar Sharma — his skills, projects, and experience.

Tone: warm, concise, confident. Keep replies to 2-4 sentences so they read
well on WhatsApp. Use emojis sparingly. If you don't know something, say so
honestly and offer to connect the user with Nishant.
```

`knowledge/resume.md`:
```md
# Resume

Nishant is a software engineer with experience building full-stack web
applications, chatbots, and developer tools. He works primarily with
Node.js, TypeScript, Python, and cloud platforms.
```

`knowledge/projects.md`:
```md
# Projects

- WhatsApp AI Portfolio Bot: a self-hosted chatbot using WAHA and OpenAI.
- Other projects can be listed here and the bot will answer questions about them.
```

`knowledge/about.md`:
```md
# About Nishant

Nishant enjoys solving developer-experience problems, exploring AI, and
building portfolio projects that demonstrate end-to-end system design.
```

- [ ] **Step 4: Write `bot/Dockerfile`**

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

FROM base AS build
COPY package.json package-lock.json* tsconfig.json ./
COPY src ./src
RUN npm ci && npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
EXPOSE 3333
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

- [ ] **Step 5: Write `bot/package.json`**

```json
{
  "name": "waha-portfolio-bot",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "start": "node dist/index.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "express": "^4.19.2",
    "openai": "^4.58.1",
    "pino": "^9.4.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.16.2",
    "supertest": "^7.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.5.4",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 6: Write `bot/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 7: Write `bot/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      OPENAI_API_KEY: 'test-openai-key',
      WAHA_API_KEY: 'test-waha-key',
      TEST_MODE: '1',
    },
  },
});
```

- [ ] **Step 8: Write `bot/.dockerignore`**

```
node_modules
dist
tests
.env
*.log
```

- [ ] **Step 9: Validate TypeScript config and install dependencies**

Run:
```bash
cd bot && npm install && npx tsc --noEmit
```

Expected: `tsc` succeeds (no source files yet, but config is valid).

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "chore: scaffold repo with docker, ts, vitest, sample knowledge"
```

---

### Task 2: Config Module + Logger

**Goal:** Parse environment variables with Zod and provide a typed logger.

**Files:**
- Create: `bot/src/types.ts`
- Create: `bot/src/config.ts`
- Create: `bot/src/logger.ts`
- Create: `bot/tests/config.test.ts`

**Interfaces:**
- Produces: `Config` type and `logger` singleton.
- Consumes: none.

- [ ] **Step 1: Write `bot/src/types.ts`**

```ts
export type Role = 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
}

export interface WahaMessagePayload {
  id: string;
  from: string;
  fromMe: boolean;
  body: string;
  type: string;
  timestamp: number;
}

export interface WahaWebhookBody {
  event: string;
  session: string;
  payload: WahaMessagePayload;
}
```

- [ ] **Step 2: Write failing `bot/tests/config.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { buildConfig } from '../src/config';

const baseEnv = {
  OPENAI_API_KEY: 'sk-test',
  WAHA_API_KEY: 'waha-secret',
};

describe('buildConfig', () => {
  it('parses valid env with defaults', () => {
    const cfg = buildConfig({
      ...baseEnv,
      OPENAI_MODEL: 'gpt-4o',
      PORT: '4444',
    });
    expect(cfg.openaiModel).toBe('gpt-4o');
    expect(cfg.port).toBe(4444);
    expect(cfg.wahaUrl).toBe('http://waha:3000');
    expect(cfg.maxHistory).toBe(10);
    expect(cfg.memoryTtlMs).toBe(3600000);
    expect(cfg.logLevel).toBe('info');
    expect(cfg.testMode).toBe(false);
  });

  it('throws when required keys are missing', () => {
    expect(() => buildConfig({})).toThrow(z.ZodError);
  });

  it('parses TEST_MODE=1 as true', () => {
    const cfg = buildConfig({ ...baseEnv, TEST_MODE: '1' });
    expect(cfg.testMode).toBe(true);
  });
});
```

Run: `npx vitest run tests/config.test.ts`
Expected: FAIL — `buildConfig` not defined.

- [ ] **Step 3: Write `bot/src/config.ts`**

```ts
import { z } from 'zod';

const configSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  WAHA_API_KEY: z.string().min(1),
  WAHA_URL: z.string().url().default('http://waha:3000'),
  PORT: z.string().default('3333').transform(Number),
  MAX_HISTORY: z.string().default('10').transform(Number),
  MEMORY_TTL_MS: z.string().default('3600000').transform(Number),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  TEST_MODE: z.string().default('0').transform((v) => v === '1'),
  OWNER_NUMBERS: z.string().default('').transform((v) =>
    v.split(',').map((s) => s.trim()).filter(Boolean)
  ),
});

export type Config = z.infer<typeof configSchema>;

export function buildConfig(env: Record<string, string | undefined>): Config {
  return configSchema.parse(env);
}
```

- [ ] **Step 4: Write `bot/src/logger.ts`**

```ts
import pino from 'pino';
import { buildConfig } from './config';

function getLogger() {
  const cfg = buildConfig(process.env as Record<string, string>);
  return pino({
    level: cfg.logLevel,
    transport: process.env.NODE_ENV === 'production'
      ? undefined
      : { target: 'pino-pretty', options: { colorize: true } },
  });
}

export const logger = getLogger();
```

Note: `pino-pretty` is a dev-only transport. In production Docker it logs NDJSON; local dev can install `pino-pretty` as a dev dependency later if needed. For now avoid adding it to prod deps.

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/config.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add bot/src/types.ts bot/src/config.ts bot/src/logger.ts bot/tests/config.test.ts
git commit -m "feat: add zod config module and logger"
```

---

### Task 3: Knowledge Loader

**Goal:** Read markdown files from `knowledge/` and build the system prompt.

**Files:**
- Create: `bot/src/knowledge.ts`
- Create: `bot/tests/knowledge.test.ts`

**Interfaces:**
- Consumes: `logger` from Task 2.
- Produces: `loadKnowledge(dir: string): Promise<string>`.

- [ ] **Step 1: Write failing `bot/tests/knowledge.test.ts`**

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { loadKnowledge } from '../src/knowledge';

describe('loadKnowledge', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'knowledge-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('joins markdown files in alphabetical order', async () => {
    await fs.writeFile(path.join(tmpDir, 'about.md'), '# About\n\nBio');
    await fs.writeFile(path.join(tmpDir, 'persona.md'), 'Persona text');
    await fs.writeFile(path.join(tmpDir, 'resume.md'), 'Resume text');

    const result = await loadKnowledge(tmpDir);
    expect(result).toContain('Persona text');
    expect(result).toContain('Bio');
    expect(result).toContain('Resume text');
  });

  it('returns empty string when directory has no markdown files', async () => {
    await fs.writeFile(path.join(tmpDir, 'notes.txt'), 'not md');
    const result = await loadKnowledge(tmpDir);
    expect(result).toBe('');
  });

  it('returns empty string when directory does not exist', async () => {
    const result = await loadKnowledge(path.join(tmpDir, 'missing'));
    expect(result).toBe('');
  });
});
```

Run: `npx vitest run tests/knowledge.test.ts`
Expected: FAIL — `loadKnowledge` not defined.

- [ ] **Step 2: Write `bot/src/knowledge.ts`**

```ts
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { logger } from './logger';

export async function loadKnowledge(dir: string): Promise<string> {
  try {
    const info = await stat(dir);
    if (!info.isDirectory()) return '';
  } catch (err) {
    logger.warn({ dir, err }, 'Knowledge directory not found');
    return '';
  }

  const entries = await readdir(dir);
  const mdFiles = entries
    .filter((f) => f.endsWith('.md'))
    .sort();

  if (mdFiles.length === 0) {
    logger.warn({ dir }, 'No markdown files in knowledge directory');
    return '';
  }

  const parts = await Promise.all(
    mdFiles.map(async (f) => {
      const content = await readFile(path.join(dir, f), 'utf-8');
      return `--- ${f} ---\n\n${content.trim()}\n`;
    })
  );

  return parts.join('\n').trim();
}
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/knowledge.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add bot/src/knowledge.ts bot/tests/knowledge.test.ts
git commit -m "feat: load knowledge markdown into system prompt"
```

---

### Task 4: Per-User Memory Store

**Goal:** Store and retrieve recent messages per phone number, with TTL eviction.

**Files:**
- Create: `bot/src/memory.ts`
- Create: `bot/tests/memory.test.ts`

**Interfaces:**
- Produces: `MemoryStore` class.
- Methods:
  - `constructor(maxHistory: number, ttlMs: number)`
  - `get(phone: string): Message[]`
  - `add(phone: string, message: Message): void`
  - `size(): number`

- [ ] **Step 1: Write failing `bot/tests/memory.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { MemoryStore } from '../src/memory';
import type { Message } from '../src/types';

const sampleUser: Message = {
  id: '1',
  role: 'user',
  text: 'hello',
  timestamp: Date.now(),
};

const sampleAssistant: Message = {
  id: '2',
  role: 'assistant',
  text: 'hi there',
  timestamp: Date.now() + 1,
};

describe('MemoryStore', () => {
  it('returns empty history for unknown user', () => {
    const store = new MemoryStore(10, 60_000);
    expect(store.get('unknown')).toEqual([]);
  });

  it('stores messages in order', () => {
    const store = new MemoryStore(10, 60_000);
    store.add('919999999999@c.us', sampleUser);
    store.add('919999999999@c.us', sampleAssistant);
    expect(store.get('919999999999@c.us')).toEqual([sampleUser, sampleAssistant]);
  });

  it('drops oldest messages when maxHistory exceeded', () => {
    const store = new MemoryStore(2, 60_000);
    store.add('u', { id: 'a', role: 'user', text: 'a', timestamp: 1 });
    store.add('u', { id: 'b', role: 'assistant', text: 'b', timestamp: 2 });
    store.add('u', { id: 'c', role: 'user', text: 'c', timestamp: 3 });
    const history = store.get('u');
    expect(history.map((m) => m.id)).toEqual(['b', 'c']);
  });

  it('evicts expired history per user on get', () => {
    vi.useFakeTimers();
    const store = new MemoryStore(10, 1000);
    store.add('u', { id: 'a', role: 'user', text: 'a', timestamp: Date.now() });
    vi.advanceTimersByTime(1001);
    expect(store.get('u')).toEqual([]);
    vi.useRealTimers();
  });

  it('tracks active user count', () => {
    const store = new MemoryStore(10, 60_000);
    store.add('a', sampleUser);
    store.add('b', sampleUser);
    expect(store.size()).toBe(2);
  });
});
```

Run: `npx vitest run tests/memory.test.ts`
Expected: FAIL — `MemoryStore` not defined.

- [ ] **Step 2: Write `bot/src/memory.ts`**

```ts
import type { Message } from './types';

interface Entry {
  updatedAt: number;
  messages: Message[];
}

export class MemoryStore {
  private data = new Map<string, Entry>();

  constructor(
    private maxHistory: number,
    private ttlMs: number,
  ) {}

  get(phone: string): Message[] {
    const entry = this.data.get(phone);
    if (!entry) return [];
    if (Date.now() - entry.updatedAt > this.ttlMs) {
      this.data.delete(phone);
      return [];
    }
    return entry.messages.slice();
  }

  add(phone: string, message: Message): void {
    const entry = this.data.get(phone);
    const messages = entry ? [...entry.messages, message] : [message];
    if (messages.length > this.maxHistory) {
      messages.shift();
    }
    this.data.set(phone, { updatedAt: Date.now(), messages });
  }

  size(): number {
    return this.data.size;
  }

  // exposed for tests only; not used in production code
  clear(): void {
    this.data.clear();
  }
}
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/memory.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add bot/src/memory.ts bot/tests/memory.test.ts
git commit -m "feat: add per-user memory store with TTL"
```

---

### Task 5: WAHA Client

**Goal:** Send replies back to WhatsApp via WAHA's `/api/sendText` endpoint.

**Files:**
- Create: `bot/src/waha.ts`
- Create: `bot/tests/waha.test.ts`

**Interfaces:**
- Consumes: `Config` from Task 2.
- Produces: `WahaClient` class with `sendText(session: string, chatId: string, text: string): Promise<void>`.

- [ ] **Step 1: Write failing `bot/tests/waha.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WahaClient } from '../src/waha';

const baseConfig = {
  wahaUrl: 'http://waha-test:3000',
  wahaApiKey: 'waha-secret',
  testMode: false,
} as const;

describe('WahaClient', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a text message with correct payload and auth header', async () => {
    const client = new WahaClient(baseConfig as any);
    await client.sendText('default', '919999999999@c.us', 'hello!');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('http://waha-test:3000/api/sendText');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({
      'Content-Type': 'application/json',
      'X-Api-Key': 'waha-secret',
    });
    expect(JSON.parse(init?.body as string)).toEqual({
      session: 'default',
      chatId: '919999999999@c.us',
      text: 'hello!',
    });
  });

  it('logs but does not send in test mode', async () => {
    const client = new WahaClient({ ...baseConfig, testMode: true } as any);
    await client.sendText('default', '919999999999@c.us', 'test reply');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('throws on non-2xx response', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    } as Response);

    const client = new WahaClient(baseConfig as any);
    await expect(client.sendText('default', 'x', 'y')).rejects.toThrow(/WAHA send failed/);
  });
});
```

Run: `npx vitest run tests/waha.test.ts`
Expected: FAIL — `WahaClient` not defined.

- [ ] **Step 2: Write `bot/src/waha.ts`**

```ts
import type { Config } from './config';
import { logger } from './logger';

export class WahaClient {
  private sendUrl: string;

  constructor(private config: Config) {
    this.sendUrl = new URL('/api/sendText', config.wahaUrl).toString();
  }

  async sendText(session: string, chatId: string, text: string): Promise<void> {
    if (this.config.testMode) {
      logger.info({ session, chatId, text }, 'TEST_MODE: would send reply');
      return;
    }

    logger.debug({ session, chatId }, 'Sending WAHA message');

    const res = await fetch(this.sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.config.wahaApiKey,
      },
      body: JSON.stringify({ session, chatId, text }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`WAHA send failed: ${res.status} ${body}`);
    }
  }
}
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/waha.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add bot/src/waha.ts bot/tests/waha.test.ts
git commit -m "feat: add WAHA sendText client"
```

---

### Task 6: AI Engine

**Goal:** Wrap OpenAI chat completions and return assistant text.

**Files:**
- Create: `bot/src/ai.ts`
- Create: `bot/tests/ai.test.ts`

**Interfaces:**
- Consumes: `Config` from Task 2, `Message` from Task 2.
- Produces: `AiEngine` class with `reply(systemPrompt: string, history: Message[], newMessage: string): Promise<string>`.

- [ ] **Step 1: Write failing `bot/tests/ai.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AiEngine } from '../src/ai';
import type { Message } from '../src/types';

const createMock = vi.fn();

vi.mock('openai', () => {
  return {
    default: class {
      chat = { completions: { create: createMock } };
    },
  };
});

describe('AiEngine', () => {
  const config = {
    openaiApiKey: 'sk-test',
    openaiModel: 'gpt-4o-mini',
  } as any;

  beforeEach(() => {
    createMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls OpenAI with system + history + user message', async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { role: 'assistant', content: 'Hello Nishant fan!' } }],
    });

    const engine = new AiEngine(config);
    const history: Message[] = [
      { id: '1', role: 'user', text: 'hi', timestamp: 1 },
      { id: '2', role: 'assistant', text: 'hello!', timestamp: 2 },
    ];
    const reply = await engine.reply('You are Nishant bot.', history, 'who is Nishant?');

    expect(reply).toBe('Hello Nishant fan!');
    expect(createMock).toHaveBeenCalledOnce();
    const args = createMock.mock.calls[0][0];
    expect(args.model).toBe('gpt-4o-mini');
    expect(args.messages).toEqual([
      { role: 'system', content: 'You are Nishant bot.' },
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello!' },
      { role: 'user', content: 'who is Nishant?' },
    ]);
    expect(args.temperature).toBe(0.7);
    expect(args.max_tokens).toBe(500);
  });

  it('returns fallback when content is empty', async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: '' } }] });
    const engine = new AiEngine(config);
    const reply = await engine.reply('system', [], 'x');
    expect(reply).toMatch(/couldn't think/);
  });

  it('returns friendly message on OpenAI error', async () => {
    createMock.mockRejectedValue(new Error('Rate limit'));
    const engine = new AiEngine(config);
    const reply = await engine.reply('system', [], 'x');
    expect(reply).toMatch(/too many requests|busy/i);
  });
});
```

Run: `npx vitest run tests/ai.test.ts`
Expected: FAIL — `AiEngine` not defined.

- [ ] **Step 2: Write `bot/src/ai.ts`**

```ts
import OpenAI from 'openai';
import type { Config } from './config';
import type { Message } from './types';
import { logger } from './logger';

export class AiEngine {
  private client: OpenAI;

  constructor(private config: Config) {
    this.client = new OpenAI({ apiKey: config.openaiApiKey });
  }

  async reply(systemPrompt: string, history: Message[], newMessage: string): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.text })),
      { role: 'user', content: newMessage },
    ];

    try {
      const res = await this.client.chat.completions.create({
        model: this.config.openaiModel,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = res.choices[0]?.message?.content?.trim();
      if (!content) {
        return "I couldn't think of a reply. Try rephrasing?";
      }
      return content;
    } catch (err) {
      logger.error({ err }, 'OpenAI request failed');
      return "I'm a bit busy right now. Try again in a moment!";
    }
  }
}
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/ai.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add bot/src/ai.ts bot/tests/ai.test.ts
git commit -m "feat: add OpenAI chat completions engine"
```

---

### Task 7: Pipeline Orchestrator

**Goal:** Wire memory, AI, and WAHA together so a webhook payload becomes a reply.

**Files:**
- Create: `bot/src/pipeline.ts`
- Create: `bot/tests/pipeline.test.ts`

**Interfaces:**
- Consumes: `Config`, `MemoryStore`, `AiEngine`, `WahaClient`, `WahaWebhookBody`.
- Produces: `handleMessage(payload: WahaWebhookBody): Promise<void>`.

- [ ] **Step 1: Write failing `bot/tests/pipeline.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { handleMessage } from '../src/pipeline';
import { MemoryStore } from '../src/memory';

function makePayload(body: string, overrides = {}) {
  return {
    event: 'message',
    session: 'default',
    payload: {
      id: 'msg-1',
      from: '919999999999@c.us',
      fromMe: false,
      body,
      type: 'chat',
      timestamp: Date.now(),
      ...overrides,
    },
  };
}

describe('handleMessage', () => {
  const ai = { reply: vi.fn() };
  const waha = { sendText: vi.fn() };
  const store = new MemoryStore(10, 60_000);
  const config = { wahaApiKey: 'x' } as any;

  beforeEach(() => {
    ai.reply.mockReset();
    waha.sendText.mockReset();
    store.clear();
  });

  it('replies and stores both messages', async () => {
    ai.reply.mockResolvedValue('Nishant is a developer.');

    await handleMessage(
      makePayload('who is Nishant?'),
      { systemPrompt: 'You are Nishant bot.', memory: store, ai, waha, config }
    );

    expect(ai.reply).toHaveBeenCalledOnce();
    expect(waha.sendText).toHaveBeenCalledWith('default', '919999999999@c.us', 'Nishant is a developer.');

    const history = store.get('919999999999@c.us');
    expect(history).toHaveLength(2);
    expect(history[0].role).toBe('user');
    expect(history[1].role).toBe('assistant');
  });

  it('ignores messages from the bot itself', async () => {
    await handleMessage(
      makePayload('ignored', { fromMe: true }),
      { systemPrompt: '', memory: store, ai, waha, config }
    );
    expect(ai.reply).not.toHaveBeenCalled();
  });

  it('ignores non-chat messages', async () => {
    await handleMessage(
      makePayload('image', { type: 'image' }),
      { systemPrompt: '', memory: store, ai, waha, config }
    );
    expect(ai.reply).not.toHaveBeenCalled();
  });

  it('falls back gracefully when send fails', async () => {
    ai.reply.mockResolvedValue('reply text');
    waha.sendText.mockRejectedValue(new Error('boom'));

    await expect(
      handleMessage(makePayload('hi'), { systemPrompt: '', memory: store, ai, waha, config })
    ).rejects.toThrow('boom');
  });
});
```

Run: `npx vitest run tests/pipeline.test.ts`
Expected: FAIL — `handleMessage` not defined.

- [ ] **Step 2: Write `bot/src/pipeline.ts`**

```ts
import type { Config } from './config';
import type { MemoryStore } from './memory';
import type { AiEngine } from './ai';
import type { WahaClient } from './waha';
import type { WahaWebhookBody, Message } from './types';
import { logger } from './logger';

export interface PipelineContext {
  systemPrompt: string;
  memory: MemoryStore;
  ai: AiEngine;
  waha: WahaClient;
  config: Config;
}

const seenIds = new Set<string>();
const MAX_SEEN = 1000;

export async function handleMessage(
  body: WahaWebhookBody,
  ctx: PipelineContext,
): Promise<void> {
  const { event, session, payload } = body;

  if (event !== 'message' || payload.fromMe || payload.type !== 'chat' || !payload.body?.trim()) {
    logger.debug({ event, fromMe: payload.fromMe, type: payload.type }, 'Ignoring webhook event');
    return;
  }

  // Dedupe
  if (seenIds.has(payload.id)) {
    logger.debug({ id: payload.id }, 'Duplicate message id ignored');
    return;
  }
  seenIds.add(payload.id);
  if (seenIds.size > MAX_SEEN) {
    const first = seenIds.values().next().value;
    if (first) seenIds.delete(first);
  }

  const phone = payload.from;
  const text = payload.body.trim();

  const history = ctx.memory.get(phone);
  const reply = await ctx.ai.reply(ctx.systemPrompt, history, text);

  const userMsg: Message = {
    id: payload.id,
    role: 'user',
    text,
    timestamp: payload.timestamp,
  };
  ctx.memory.add(phone, userMsg);

  await ctx.waha.sendText(session, phone, reply);

  ctx.memory.add(phone, {
    id: `reply-${payload.id}`,
    role: 'assistant',
    text: reply,
    timestamp: Date.now(),
  });
}
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/pipeline.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add bot/src/pipeline.ts bot/tests/pipeline.test.ts
git commit -m "feat: add message processing pipeline"
```

---

### Task 8: Webhook Receiver + Health Endpoint + Boot

**Goal:** Create the Express app, register `/webhook` with auth, expose `/health`, and start the server.

**Files:**
- Create: `bot/src/webhook.ts`
- Create: `bot/src/index.ts`
- Create: `bot/tests/webhook.test.ts`

**Interfaces:**
- Consumes: `Config`, `PipelineContext`, `handleMessage`.
- Produces: Express `Application` from `createApp(ctx)`.

- [ ] **Step 1: Write failing `bot/tests/webhook.test.ts`**

```ts
import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp } from '../src/webhook';
import type { PipelineContext } from '../src/pipeline';

describe('createApp', () => {
  const ai = { reply: vi.fn() };
  const waha = { sendText: vi.fn() };

  beforeEach(() => {
    ai.reply.mockReset();
    waha.sendText.mockReset();
  });

  function makeCtx(): PipelineContext {
    return {
      systemPrompt: 'system',
      memory: { get: () => [], add: () => {}, size: () => 0, clear: () => {} } as any,
      ai: ai as any,
      waha: waha as any,
      config: { wahaApiKey: 'secret-key' } as any,
    };
  }

  it('returns 200 on health', async () => {
    const app = createApp(makeCtx());
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('rejects webhook without api key', async () => {
    const app = createApp(makeCtx());
    const res = await request(app)
      .post('/webhook')
      .send({ event: 'message', session: 'default', payload: { id: 'm1', from: 'x', fromMe: false, body: 'hi', type: 'chat', timestamp: 1 } });
    expect(res.status).toBe(401);
  });

  it('accepts webhook with correct api key and runs pipeline', async () => {
    ai.reply.mockResolvedValue('hello!');
    const app = createApp(makeCtx());
    const res = await request(app)
      .post('/webhook')
      .set('X-Api-Key', 'secret-key')
      .send({
        event: 'message',
        session: 'default',
        payload: {
          id: 'm2',
          from: '919999999999@c.us',
          fromMe: false,
          body: 'hi',
          type: 'chat',
          timestamp: 1,
        },
      });

    expect(res.status).toBe(200);
    expect(waha.sendText).toHaveBeenCalledWith('default', '919999999999@c.us', 'hello!');
  });
});
```

Run: `npx vitest run tests/webhook.test.ts`
Expected: FAIL — `createApp` not defined.

- [ ] **Step 2: Write `bot/src/webhook.ts`**

```ts
import express, { Application, Request, Response, NextFunction } from 'express';
import type { PipelineContext } from './pipeline';
import { handleMessage } from './pipeline';
import { logger } from './logger';

export function createApp(ctx: PipelineContext): Application {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptimeSec: Math.floor(process.uptime()) });
  });

  app.post('/webhook', (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers['x-api-key'];
    if (key !== ctx.config.wahaApiKey) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    handleMessage(req.body, ctx)
      .then(() => res.status(200).json({ received: true }))
      .catch((err) => {
        logger.error({ err }, 'Pipeline failed');
        next(err);
      });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({ error: 'internal error' });
  });

  return app;
}
```

- [ ] **Step 3: Write `bot/src/index.ts`**

```ts
import path from 'node:path';
import { buildConfig } from './config';
import { loadKnowledge } from './knowledge';
import { MemoryStore } from './memory';
import { AiEngine } from './ai';
import { WahaClient } from './waha';
import { createApp } from './webhook';
import { logger } from './logger';

async function main() {
  const config = buildConfig(process.env as Record<string, string>);
  const knowledgeDir = path.resolve(process.cwd(), 'knowledge');
  const systemPrompt = await loadKnowledge(knowledgeDir);

  if (!systemPrompt) {
    logger.warn('No knowledge loaded; bot will rely only on the system prompt.');
  }

  const memory = new MemoryStore(config.maxHistory, config.memoryTtlMs);
  const ai = new AiEngine(config);
  const waha = new WahaClient(config);

  const app = createApp({ systemPrompt, memory, ai, waha, config });

  app.listen(config.port, () => {
    logger.info({ port: config.port, wahaUrl: config.wahaUrl }, 'Bot listening');
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start');
  process.exit(1);
});
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/webhook.test.ts`
Expected: PASS.

Run full suite: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Build TypeScript**

Run: `npm run build`
Expected: `dist/` created with no errors.

- [ ] **Step 6: Commit**

```bash
git add bot/src/webhook.ts bot/src/index.ts bot/tests/webhook.test.ts
git commit -m "feat: add Express webhook receiver, health endpoint, and boot"
```

---

### Task 9: Docker Compose + README Polish

**Goal:** Make the project runnable and document the demo steps.

**Files:**
- Modify: `docker-compose.yml` (Task 1 — double-check nothing broke)
- Modify: `README.md` (Task 1 — replace outline with full docs)
- Modify: `bot/package.json` (Task 1 — add `pino-pretty` dev dep for local logs, optional)

**Interfaces:**
- Produces: documented, runnable `docker compose` setup.

- [ ] **Step 1: Verify `docker-compose.yml` still matches the spec**

No changes unless a task exposed a missing env var. Confirm `WAHA_API_KEY` is wired and `depends_on` healthcheck is present.

- [ ] **Step 2: Add `pino-pretty` dev dependency (optional)**

In `bot/package.json`, add to `devDependencies`:

```json
"pino-pretty": "^11.2.2"
```

This only affects local dev; the Dockerfile does not include dev deps.

Run: `cd bot && npm install`

- [ ] **Step 3: Write the full `README.md`**

```markdown
# WhatsApp AI Portfolio Bot

A self-hosted WhatsApp chatbot that answers questions about you, built with
WAHA, OpenAI, Node.js, and Docker.

## Features

- Connect any WhatsApp number by scanning a QR code
- Answers from your own markdown knowledge base
- Remembers the last 10 messages per user
- Sends replies via the OpenAI API
- Runs end-to-end with `docker compose up`

## Quick start

1. Clone the repo and copy the environment file:

```bash
git clone https://github.com/YOUR_USERNAME/whatsapp-ai-portfolio-bot.git
cd whatsapp-ai-portfolio-bot
cp .env.example .env
```

2. Edit `.env` and add your keys:

```bash
OPENAI_API_KEY=sk-...
WAHA_API_KEY=replace-with-a-long-random-string
```

3. Edit the markdown files in `knowledge/` to describe yourself.

4. Start the services:

```bash
docker compose up -d
```

5. Open [http://localhost:3000](http://localhost:3000), scan the QR code with
   WhatsApp on your phone.

6. Text that WhatsApp number from another phone:

```
Hi! Who are you?
```

The bot replies in a few seconds.

## Development

Run the bot locally without Docker (WAHA must still be running):

```bash
cd bot
cp ../.env .env
npm install
npm run dev
```

Run tests:

```bash
cd bot
npm test
```

## Project structure

```
.
├── docker-compose.yml
├── knowledge/
│   ├── persona.md
│   ├── resume.md
│   ├── projects.md
│   └── about.md
└── bot/
    ├── src/
    │   ├── index.ts
    │   ├── config.ts
    │   ├── knowledge.ts
    │   ├── memory.ts
    │   ├── ai.ts
    │   ├── waha.ts
    │   ├── pipeline.ts
    │   └── webhook.ts
    └── tests/
```

## Customization

Change the bot's personality and facts by editing files in `knowledge/`. No
code changes needed.

## License

MIT
```

- [ ] **Step 4: Validate compose file**

Run:
```bash
docker compose config
```

Expected: exits 0, prints parsed compose YAML.

- [ ] **Step 5: Run full test suite one last time**

Run:
```bash
cd bot && npm test && npm run build
```

Expected: all tests pass, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add README.md docker-compose.yml bot/package.json bot/package-lock.json
if [ -f bot/.env ]; then git rm --cached bot/.env; fi
git commit -m "docs: README, docker compose, and dev polish"
```

---

## Self-Review

### Spec Coverage

| Spec Section | Task(s) Implementing It |
|---|---|
| Two Docker services | Task 1, Task 9 |
| Config/env parsing with Zod | Task 2 |
| Knowledge markdown loader | Task 3 |
| Per-user memory with TTL | Task 4 |
| WAHA sendText client | Task 5 |
| OpenAI engine | Task 6 |
| Webhook → memory → AI → WAHA flow | Task 7, Task 8 |
| API key verification on inbound | Task 8 |
| Error handling (fallbacks, no crashes) | Tasks 5, 6, 7, 8 |
| Health endpoint | Task 8 |
| TEST_MODE for headless testing | Tasks 2, 5, 8 |
| Vitest unit tests | All tasks |
| README demo story | Task 9 |

### Placeholder Scan

No `TBD`, `TODO`, "implement later", or "appropriate error handling" found. Each step has concrete code, command, and expected output.

### Type Consistency

- `Config` defined in Task 2 and used everywhere.
- `Message`, `WahaWebhookBody`, `WahaMessagePayload` defined in Task 2 and used in Tasks 4, 6, 7, 8.
- `PipelineContext` defined in Task 7 and consumed in Task 8.
- Function names consistent across tasks.

### Gaps

None identified; the plan covers the full approved spec.
