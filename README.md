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

Note: the `knowledge/` directory lives at the repo root, while local dev runs
from `bot/`. Set `KNOWLEDGE_DIR=../knowledge` in `bot/.env` (or run from the
repo root) so the bot can find it. Docker mounts the directory correctly, so
no change is needed there.

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
