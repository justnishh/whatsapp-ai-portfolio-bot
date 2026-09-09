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
git clone https://github.com/justnishh/whatsapp-ai-portfolio-bot.git
cd whatsapp-ai-portfolio-bot
cp .env.example .env
```

2. Edit `.env` and add your keys:

```bash
OPENAI_API_KEY=sk-...
WAHA_API_KEY=replace-with-a-long-random-string
```

Use a plain random string (e.g. the output of `openssl rand -hex 24`) — not
WAHA's `sha512:` hash format — since the bot forwards it verbatim.

3. Edit the markdown files in `knowledge/` to describe yourself.

4. Start the services:

```bash
docker compose up -d
```

5. WAHA needs a session started before it can connect. Open the WAHA
   dashboard at [http://localhost:3000](http://localhost:3000) and start the
   `default` session (or run `curl -X POST
   http://localhost:3000/api/sessions/start -H "X-Api-Key: $WAHA_API_KEY" -H
   "Content-Type: application/json" -d '{"name": "default"}'`), then scan the
   QR code with WhatsApp on your phone. The dashboard password is
   auto-generated and appears in `docker compose logs waha`.

6. Text that WhatsApp number from another phone:

```
Hi! Who are you?
```

The bot replies in a few seconds.

## Development

Run the bot locally without Docker (WAHA must still be running):

```bash
cd bot
npm install
KNOWLEDGE_DIR=../knowledge npm run dev
```

The dev script auto-loads the root `.env` (via Node's `--env-file`), so you
don't need to copy it into `bot/`. The `knowledge/` directory lives at the
repo root while local dev runs from `bot/`, so the `KNOWLEDGE_DIR=../knowledge`
prefix points the bot at it — the prefix works because real environment
variables take precedence over values from `--env-file`. Docker mounts the
directory correctly, so no override is needed there.

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
