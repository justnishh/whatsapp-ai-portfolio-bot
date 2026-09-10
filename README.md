# WhatsApp AI Portfolio Bot

A self-hosted WhatsApp chatbot that represents **you** — answering questions about your skills,
experience, and projects on autopilot. Built with WAHA, Node.js, TypeScript, and any
OpenAI-compatible AI API. Runs end-to-end with a single `docker compose up`.

> 👋 This bot is live — text **+91 8976595954** on WhatsApp to see it in action (Nishant's portfolio bot).

---

## ✨ What it does

- Connects any WhatsApp number via QR code scan
- Answers questions **as you** — in first person, using your own knowledge base
- Keeps per-user conversation memory (configurable history length)
- Works with **any OpenAI-compatible API** — OpenAI, OpenRouter, TokenRouter, Groq, and more
- Loads personality and facts from simple Markdown files — no code needed to customise
- Runs fully self-hosted with Docker

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| WhatsApp gateway | [WAHA](https://waha.devlike.pro/) (WhatsApp HTTP API) |
| Bot server | Node.js + TypeScript + Express |
| AI | Any OpenAI-compatible API (OpenAI, OpenRouter, TokenRouter…) |
| Config validation | Zod |
| Container | Docker + Docker Compose |

---

## 📁 Project Structure

```
.
├── docker-compose.yml        # Runs WAHA + bot together
├── .env.example              # Copy this to .env and fill in your keys
├── knowledge/                # ✏️ Edit these to make the bot represent YOU
│   ├── persona.md            # Tone, style, and behaviour rules
│   ├── about.md              # Who you are, contact info, what you're looking for
│   ├── resume.md             # Work experience, skills, certifications
│   └── projects.md           # Key projects and highlights
└── bot/
    └── src/
        ├── index.ts          # Entry point
        ├── config.ts         # Env variable parsing (Zod)
        ├── ai.ts             # OpenAI-compatible API client
        ├── knowledge.ts      # Loads and concatenates markdown files
        ├── memory.ts         # Per-user conversation history
        ├── pipeline.ts       # Message handling logic
        ├── waha.ts           # WAHA API client
        └── webhook.ts        # Express webhook endpoint
```

---

## 🚀 Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- A WhatsApp number to connect to the bot (you'll scan a QR code)
- A second phone or device to send test messages from
- An AI API key — see [Choosing an AI API](#-choosing-an-ai-api) below

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/justnishh/whatsapp-ai-portfolio-bot.git
cd whatsapp-ai-portfolio-bot
```

### Step 2 — Set up your environment

```bash
cp .env.example .env
```

Open `.env` and fill in the required values:

```env
# Required
OPENAI_API_KEY=your-api-key-here
WAHA_API_KEY=generate-any-long-random-string

# Optional — point to any OpenAI-compatible API
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

Generate a secure random WAHA key with:
```bash
openssl rand -hex 24
```

### Step 3 — Customise your knowledge base

Edit the files in `knowledge/` to describe **yourself**.
See [Building Your Own Persona](#-building-your-own-persona) for a step-by-step guide.

### Step 4 — Start everything

```bash
docker compose up -d
```

### Step 5 — Connect your WhatsApp

1. Open **http://localhost:3000** in your browser
2. Log in — the dashboard password is printed in the logs:
   ```bash
   docker compose logs waha | grep -i password
   ```
3. Start the `default` session and scan the QR code with your phone
   *(WhatsApp → Settings → Linked Devices → Link a Device)*

### Step 6 — Test it!

From a **different phone**, send a message to the number you just connected:

```
Hi! Who are you?
```

The bot replies in a few seconds. 🎉

---

## 🤖 Choosing an AI API

The bot works with **any OpenAI-compatible API**. Set `OPENAI_BASE_URL` and `OPENAI_MODEL` in `.env`.

### Option A — OpenAI (paid, most reliable)

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
# No OPENAI_BASE_URL needed — defaults to OpenAI
```

Get a key at [platform.openai.com](https://platform.openai.com). ~$5 of credit lasts months for a personal portfolio bot.

---

### Option B — OpenRouter (free models available) ⭐ Recommended

```env
OPENAI_API_KEY=sk-or-v1-...
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

Sign up at [openrouter.ai](https://openrouter.ai). Many free models — no credit card needed for free tier.

Other good free models on OpenRouter:
- `google/gemma-2-9b-it:free`
- `mistralai/mistral-7b-instruct:free`
- `nex-agi/nex-n2.5-pro:free`

---

### Option C — TokenRouter (free models available)

```env
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.tokenrouter.com/v1
OPENAI_MODEL=z-ai/glm-5.3-free
```

Sign up at [tokenrouter.com](https://tokenrouter.com).

---

### Option D — Groq (blazing fast, generous free tier)

```env
OPENAI_API_KEY=gsk_...
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.1-8b-instant
```

Sign up at [console.groq.com](https://console.groq.com).

---

> ⚠️ **Avoid reasoning/thinking models** — models with "reasoning", "thinking", or "r1" in
> the name generate long internal monologues before answering. This makes replies slow and
> verbose on WhatsApp. Stick to standard `instruct` or `chat` models.

---

## ✏️ Building Your Own Persona

No code changes needed. Just edit the four Markdown files in `knowledge/`:

---

### `knowledge/persona.md` — Who the bot IS and how it speaks

This is the most important file. It controls identity, tone, and reply style.

```markdown
# Bot Persona

You are [Your Name] — [Your Title].
Speak in first person, as if you ARE [Your Name] replying on WhatsApp personally.

Tone: warm, confident, and casual — like texting someone personally.
Keep replies SHORT: 1-2 sentences for greetings, 3-4 max for detailed questions.
Never use bullet points, headers, or long lists. Write like a real person on WhatsApp.
If someone says "hi" or "hello", just greet them naturally and ask how you can help.

Rules:
- Always speak as "I" — never refer to yourself by name
- Only answer from your knowledge — don't make things up
- For serious inquiries (hiring, interviews), share your contact details
- Never break character unless directly asked if you're an AI
```

---

### `knowledge/about.md` — Your summary, goals, and contact info

```markdown
# About [Your Name]

[Your Name] is a [Role] based in [City] with X years of experience in [domain].

## What you're looking for
Open to [role types] in [industry/domain].

## Contact
- Email: you@example.com
- LinkedIn: linkedin.com/in/yourprofile
- Phone: +XX XXXXXXXXXX
```

---

### `knowledge/resume.md` — Experience, skills, certifications

Write this like a detailed resume in Markdown. Include:
- Work history (company, role, dates, achievements)
- Skill categories
- Certifications and courses
- Education

The more detail you add here, the better the bot answers questions like *"What tools do you use?"* or *"Have you worked with [technology]?"*

---

### `knowledge/projects.md` — Notable projects and highlights

Summarise your best work. Used when someone asks *"What have you built?"* or *"Tell me about your projects"*.

---

### Applying knowledge changes

Knowledge files are mounted as a Docker volume — no rebuild needed:

```bash
docker compose restart bot
```

---

## ⚙️ Configuration Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | ✅ | — | Your AI provider API key |
| `WAHA_API_KEY` | ✅ | — | Random secret to secure WAHA |
| `OPENAI_BASE_URL` | ❌ | OpenAI default | Base URL for any OpenAI-compatible API |
| `OPENAI_MODEL` | ❌ | `gpt-4o-mini` | Model to use for replies |
| `WAHA_URL` | ❌ | `http://waha:3000` | WAHA service URL |
| `KNOWLEDGE_DIR` | ❌ | `./knowledge` | Path to knowledge markdown files |
| `PORT` | ❌ | `3333` | Bot webhook server port |
| `MAX_HISTORY` | ❌ | `10` | Messages to remember per user session |
| `MEMORY_TTL_MS` | ❌ | `3600000` | How long to keep user memory (ms) |
| `LOG_LEVEL` | ❌ | `info` | `trace` / `debug` / `info` / `warn` / `error` |
| `TEST_MODE` | ❌ | `0` | Set `1` to skip sending real WhatsApp replies |
| `OWNER_NUMBERS` | ❌ | — | Comma-separated numbers for admin features |

---

## 🛠️ Local Development (without Docker)

Run the bot locally while WAHA runs in Docker:

```bash
# Terminal 1 — start only WAHA
docker compose up -d waha

# Terminal 2 — run the bot locally with auto-reload
cd bot
npm install
KNOWLEDGE_DIR=../knowledge npm run dev
```

Run tests:

```bash
cd bot
npm test
```

---

## 🩺 Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Bot replies "I'm a bit busy right now" | AI API error | Check `docker compose logs bot` |
| No reply at all | WAHA session not connected | Re-scan QR at http://localhost:3000 |
| Long thinking text in reply | Reasoning model selected | Switch to a standard instruct model |
| 429 / quota errors | API credits exhausted | Top up or switch to a free API provider |
| QR code expired | Session timeout | Refresh WAHA dashboard, re-scan |

**View live logs:**
```bash
docker compose logs -f bot    # Bot activity
docker compose logs -f waha   # WhatsApp connection
```

---

## 🔐 Security Notes

- Never commit `.env` — it's already in `.gitignore`
- `WAHA_API_KEY` secures your WAHA instance — use a long random string
- The bot only responds to incoming messages; it never initiates contact
- Group chat messages are ignored by default

---

## 📄 License

MIT — fork it, customise it, make it yours.

---

*Built by [Nishant Nakum](https://linkedin.com/in/nishantnakum07) · [GitHub](https://github.com/justnishh/whatsapp-ai-portfolio-bot)*
