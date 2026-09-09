# WhatsApp AI Portfolio Bot

A self-hosted WhatsApp chatbot powered by WAHA and OpenAI that answers questions about Nishant Kumar Sharma's portfolio, skills, and projects.

## Overview

- **WAHA** (WhatsApp HTTP API) runs in Docker and bridges WhatsApp to HTTP.
- **Bot** is a Node.js + TypeScript + Express service that listens for WAHA webhooks, calls OpenAI with persona + knowledge context, and replies.

## Structure

```
.
├── docker-compose.yml   # WAHA + bot services
├── .env.example        # required configuration template
├── knowledge/          # persona + knowledge markdown files
│   ├── persona.md
│   ├── resume.md
│   ├── projects.md
│   └── about.md
└── bot/                # Node.js + TypeScript bot service
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    └── vitest.config.ts
```

## Setup

1. Copy `.env.example` to `.env` and fill in `OPENAI_API_KEY` and `WAHA_API_KEY`.
2. `docker compose up -d`
3. Scan the QR code printed by WAHA to connect WhatsApp.