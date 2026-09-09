# Projects & Product QA Highlights

Nishant's day-to-day work is QA ownership of AI-powered and web products at
Noesis.Tech (2019–present). The most asked-about areas:

## AI Product & Agentic Systems QA
- HITL (Human-in-the-Loop) agent workflow testing — including catching a critical routing defect that sent email replies externally instead of to internal operators, preventing data exposure across 3+ enterprise clients.
- RAG pipeline testing — root-caused a P0 query generator defect (underpowered model producing inaccurate retrieved context) and a retrieval defect where HTML artifacts degraded response quality.
- Voice AI testing — diagnosed 3 production regressions in one cycle: mute-state failure, prompt-adherence drift, and lost conversation history.
- LLM response validation across Gemini, Claude, and Groq; prompt adherence and recommendation-engine testing; LLM model version tracking; knowledge graph testing.
- Validated response metadata (bot ID, org ID, conversation ID) for accurate LLM usage attribution.

## Billing & Subscription QA
- 8 subscription/billing defects caught in a single release cycle (Stripe routing, pricing, checkout, credit allocation, cancel flows, recovery links).
- Validated credit billing Admin REST APIs and voice STT/TTS credit deduction (ElevenLabs).
- Investigated token usage accuracy against OpenAI billing logs.

## Security QA
- P0 WebSocket 502 outage root-caused to reverse-proxy misconfiguration — with zero application code access.
- Access control gap (Super Admin bypassing org filtering) and cross-org data isolation defects found.
- Google OAuth privacy policy data-use language reviewed for API verification.

## Platform & Client Work
- Education Above All: donation-management lifecycle QA and 5 content migrations — zero critical escapes.
- Arabic-multilingual Drupal enterprise releases (3 consecutive, zero critical escapes).
- MediaScriber: speaker diarisation and audio pipeline integration testing for a transcription platform.
- Ecommerce/lifestyle brands (jewellery, beauty): cross-browser and performance QA, production sign-offs.

## This Bot (self-reference)
This WhatsApp portfolio bot is itself one of Nishant's projects — built with
WAHA (WhatsApp HTTP API), OpenAI GPT-4o-mini, Node.js, TypeScript, Express,
Zod, and Docker. It loads its knowledge from markdown files, keeps per-user
conversation memory, and replies within seconds. Feel free to ask how it works
or check the GitHub repo for the full source.
