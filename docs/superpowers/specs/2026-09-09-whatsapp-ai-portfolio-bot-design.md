# WhatsApp AI Portfolio Bot — Design

**Date:** 2026-09-09
**Status:** Approved (pending spec review)

## Purpose

A self-hosted WhatsApp chatbot that answers questions about its owner, powered
by an LLM and connected via the WAHA (WhatsApp HTTP API) project. Designed as
a portfolio piece: reviewers can run it locally in under a minute, see it work
end-to-end, and fork it to make their own version by editing markdown files.

## Scope

In scope:

- One WhatsApp session (the owner's number) connected via QR
- Text-message in / text-message out (no media, no voice, no groups)
- OpenAI (`gpt-4o-mini`) as the AI brain
- Per-user short-term conversation memory
- Knowledge sourced from markdown files in `knowledge/`
- One-command startup via `docker compose`
- Health endpoint for liveness checks
- Test mode that bypasses the WAHA sender for headless local testing

Out of scope (deliberately):

- Multi-session / multi-tenant support
- Voice notes, images, documents, location, contacts
- Group chats
- Vector database / embeddings (no RAG-lite vector store)
- Persistent conversation history across restarts
- Admin commands over WhatsApp
- Rate limiting / abuse protection (single-user demo)
- Production deployment hardening (TLS, auth beyond API key)

## Architecture

Two services run side-by-side via `docker compose`:

```
┌─────────────┐    QR scan    ┌──────────────────┐
│  Your Phone │ ◄────────────►│  WAHA container  │
│  (WhatsApp) │               │  (port 3000)     │
└─────────────┘               └────────┬─────────┘
        ▲                              │ webhook POST
        │                              ▼
┌──────────────────────────────────────────────────┐
│ Bot container (Node + Express + TS, port 3333)   │
│   ┌────────────┐  ┌──────────────┐  ┌──────────┐ │
│   │  Webhook   │→ │ Memory store │→ │ AI engine│ │
│   │  receiver  │  │ (per-user,   │  │ (OpenAI) │ │
│   └────────────┘  │  in-memory)  │  └──────────┘ │
│         │         └──────────────┘       │       │
│         ▼                                 │       │
│   Outbound sender ──── WAHA /sendText ────┘       │
└──────────────────────────────────────────────────┘
        │
        ▼
   knowledge/*.md  (resume, projects, persona, about)
```

## Components

| Component | File | Responsibility |
|---|---|---|
| Entry / boot | `bot/src/index.ts` | Load knowledge, build memory store, start Express, register routes |
| Config | `bot/src/config.ts` | Parse env vars via zod, fail fast on missing/invalid |
| Webhook | `bot/src/webhook.ts` | `POST /webhook` route, verifies WAHA API key header, normalizes payload |
| WAHA client | `bot/src/waha.ts` | Typed wrapper over WAHA REST (`sendText`) |
| Knowledge loader | `bot/src/knowledge.ts` | Reads `knowledge/*.md` on startup, joins into system prompt |
| Memory store | `bot/src/memory.ts` | `Map<phone, Message[]>`, push, fetch, TTL eviction |
| AI engine | `bot/src/ai.ts` | OpenAI chat completions call; returns assistant text |
| Pipeline | `bot/src/pipeline.ts` | Orchestrates webhook → memory → AI → outbound send |
| Types | `bot/src/types.ts` | WAHA payload, Message, Config shapes |
| Health | inline in `index.ts` | `GET /health` returns `{status, uptimeSec}` |

Each component has one job and an HTTP boundary only at webhook + outbound
sender — everything else is pure functions, easy to test.

## Data Flow

1. User texts the bot from any phone.
2. WAHA fires `POST http://bot:3333/webhook` with a `message` event payload.
3. Webhook handler:
   - Verifies `X-Api-Key` header matches `WAHA_API_KEY`.
   - Filters out `fromMe: true`, non-`chat` types, group chats.
   - Dedupes by `payload.id` (in-memory `Set`, capped at 1000).
   - Hands a normalized `Message` to the pipeline.
4. Pipeline:
   - Fetches user history from memory store.
   - Builds messages array: `[system, ...history, user]`.
   - Calls AI engine.
   - Stores the new user message and assistant reply in memory.
   - Calls WAHA `sendText` to reply.
5. Failure at any step is logged and (where user-facing) replied with a
   friendly fallback message — the bot never crashes mid-pipeline.

## API Shapes

### Inbound webhook payload (WAHA → bot)

```ts
{
  event: "message",
  session: "default",
  payload: {
    id: "true_123...@c.us",
    from: "919999999999@c.us",
    fromMe: false,
    body: "tell me about Nishant",
    type: "chat",
    timestamp: 1736400000
  }
}
```

### Outbound send (bot → WAHA)

`POST {WAHA_URL}/api/sendText`

```ts
{ session: "default", chatId: "919999999999@c.us", text: "..." }
```

Auth header: `X-Api-Key: ${WAHA_API_KEY}`.

### OpenAI call

```ts
openai.chat.completions.create({
  model: config.openaiModel,           // default "gpt-4o-mini"
  messages: [
    { role: "system", content: systemPrompt },
    ...history.map(m => ({ role: m.role, content: m.text })),
    { role: "user", content: newMessage }
  ],
  temperature: 0.7,
  max_tokens: 500
})
```

## Environment Variables

| Var | Purpose | Default | Required |
|---|---|---|---|
| `OPENAI_API_KEY` | OpenAI auth | — | yes |
| `OPENAI_MODEL` | model id | `gpt-4o-mini` | no |
| `WAHA_API_KEY` | shared secret bot↔WAHA | — | yes |
| `WAHA_URL` | WAHA base URL | `http://waha:3000` | no |
| `PORT` | bot listen port | `3333` | no |
| `MAX_HISTORY` | messages kept per user | `10` | no |
| `MEMORY_TTL_MS` | idle expiry per user | `3600000` (1h) | no |
| `LOG_LEVEL` | `info` / `debug` | `info` | no |
| `TEST_MODE` | bypass WAHA sender, log to stdout | `0` | no |

Parsed with zod. Missing `OPENAI_API_KEY` or `WAHA_API_KEY` exits at boot.

## Persona & Knowledge Configuration

The `knowledge/` directory holds markdown files joined into the system prompt
in alphabetical order:

- `knowledge/persona.md` — tone, name, behaviour rules
- `knowledge/resume.md` — work history, education, skills
- `knowledge/projects.md` — project list with descriptions
- `knowledge/about.md` — bio, interests, contact preferences

Example `persona.md`:

```md
You are "Nishant's Portfolio Bot", a friendly assistant that answers questions
about Nishant. Tone: warm, concise, confident. Keep replies short (2-4
sentences) for WhatsApp. Use emojis sparingly. If you don't know something,
say so honestly.
```

Reviewers fork the repo, edit these four files, restart, done.

## Error Handling

| Failure | Behaviour |
|---|---|
| WAHA unreachable | Log, retry once with 1s backoff, then 500 to webhook |
| OpenAI 429 | Reply to user: "Too many requests right now, try again in a moment." |
| OpenAI 5xx / network | Same fallback as 429 |
| OpenAI returns empty | Reply: "I couldn't think of a reply. Try rephrasing?" |
| Bad webhook payload | Log warning, 200 (don't retry) |
| Missing API key header | 401 |
| Anything throws inside pipeline | Caught at top level; reply fallback; log full error |

The webhook handler is wrapped in `try/catch` so a malformed message never
crashes the server.

## Testing

| Layer | Approach |
|---|---|
| Unit — memory | push, fetch, eviction by TTL, eviction by max length |
| Unit — knowledge | joins files in alphabetical order, handles missing dir, handles empty dir |
| Unit — AI engine | mocked OpenAI client; asserts message array shape |
| Unit — pipeline | mocked WAHA sender + mocked AI; asserts flow + error paths |
| Integration — local | `TEST_MODE=1 npm run dev` runs pipeline end-to-end without WAHA; sends are logged to stdout |
| Manual — real | `docker compose up` + QR scan + text the bot from a phone |

Test framework: `vitest` (fast, ESM-native, plays well with TS).

## Docker Compose

Two services on a shared network:

```yaml
services:
  waha:
    image: devlikeapro/waha:latest
    ports: ["3000:3000"]
    environment:
      WHATSAPP_API_KEY: ${WAHA_API_KEY}
    volumes: ["waha-data:/app/.sessions"]

  bot:
    build: ./bot
    ports: ["3333:3333"]
    env_file: .env
    depends_on: [waha]

volumes:
  waha-data:
```

## Non-Goals & Risks

- **ToS:** WAHA uses the unofficial WhatsApp Web protocol. Acceptable for a
  personal portfolio demo; not safe for commercial deployment.
- **Cost:** OpenAI charges per request; reviewers must supply their own key.
- **Single session:** Only one WhatsApp number per instance.
- **Data:** Memory is in-process; restarting the bot clears conversations.
- **Security:** Bot trusts any sender that reaches WAHA. Not designed for
  public/internet exposure without additional hardening.

## Open Questions

None. All clarified during brainstorming.