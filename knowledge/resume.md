# Resume — Nishant Nakum

## Headline

Senior Manual QA Engineer | AI Product QA

Mumbai, Maharashtra | +91 8976595954 | nishantnakum44@gmail.com | linkedin.com/in/nishantnakum07

## Professional Summary

Senior Manual QA Engineer with 7+ years of quality ownership across 30+ web,
mobile, and AI-powered products in 10+ industries, including SaaS and Contact
Center Software. Specialises in AI Product QA — testing LLM responses, RAG
pipelines, HITL agent flows, and voice AI — alongside strong API, billing, and
security testing. Track record: 98% defect detection rate, 35% fewer production
defect escapes, and QA sign-off across 50+ production releases spanning 10+
concurrent projects. Uses AI-assisted tooling (Claude, OpenCode) to accelerate
manual testing and defect investigation.

## Key Achievements

- 98% defect detection rate across 500+ test cases, reducing production defect escapes by 35% over 7 years.
- Owned QA sign-off authority for 50+ production releases across 10+ concurrent projects.
- Caught a critical HITL routing defect before enterprise rollout, preventing a data exposure across 3+ enterprise clients.
- Root-caused a P0 RAG query generator defect and a P0 WebSocket production outage, isolating each to its true infrastructure or model-level cause.
- Identified 8 subscription and billing defects in a single release cycle, plus multiple P0/security issues (access control gaps, cross-org data isolation).

## Skills

### Testing
Functional | System | Integration | Regression | Smoke and Sanity | Exploratory | UAT | Cross-Browser | Mobile | Web | Android APK | SPA/React

### AI and Product QA
LLM Response Validation (Gemini, Claude, Groq) | AI Agent Workflow Testing | RAG Pipeline Testing | HITL Workflow Testing | Voice AI Testing | Prompt Adherence Testing | AI Recommendation Engine Testing | Knowledge Graph Testing | LLM Model Version Tracking

### API and Data
Postman | REST API Testing | HTTP Status/Response Contract Validation | curl-based Reproduction | Billing and Subscription API Testing | Stripe Integration Testing | Firebase Data Integrity | MongoDB | SQL Basics

### Security
Authentication Bypass Testing | Authorization Testing | Information Disclosure Detection | Cross-Organisation Data Isolation | JWT and HMAC Token Security | WebSocket and Proxy Configuration Testing | OWASP Principles

### Tools
JIRA | TestRail | Asana | Postman | BrowserStack | Sentry | GlitchTip | Git | Bitbucket | Jenkins CI | Docker | Agile Scrum | Kanban | SDLC/STLC

### CMS and Platforms
WordPress | Shopify | Drupal | Strapi | Wix

### Automation and AI-Assisted Scripting
Playwright — executing and maintaining existing automation scripts, including data updates for the PDF export flow. AI-assisted script review and modification (Claude, OpenCode). No independent framework development.

## Experience

### Senior Manual QA Engineer — Noesis.Tech, Mumbai (January 2019 to Present)

**QA Ownership and Release Management**
- Own QA sign-off authority for 50+ production releases across 10+ concurrent projects.
- Sustained a 98% defect detection rate across 500+ test cases; cut production defect escapes by 35% over 7 years.
- Redesigned test strategy across functional, system, and integration layers — cut regression cycles from 5 days to 3.5 days.
- Led Agile/Scrum sprint planning and shift-left QA practices; coordinated release readiness with Jenkins CI build status.
- Mentored 4 junior QA engineers; standardised QA docs across 4 teams, cutting onboarding time by 40%.
- Established the Review-to-Push-to-Live release gate now used company-wide across 10+ concurrent projects.

**AI-Augmented Manual Testing**
- Embedded with development teams building AI-powered features; uses Claude and OpenCode to read and interpret AI-generated code — identifying defect-prone areas (edge cases, unhandled states, incomplete error handling) before designing manual test scenarios.
- Reproduces and isolates reported defects by tracing failure paths through code; reviews code changes and pull requests to flag risk areas pre-release.
- Uses AI-assisted tooling to generate realistic user flows and sample test data, and to draft structured bug reports and QA documentation.

**AI Product and Agentic Systems QA**
- Caught a critical HITL routing defect sending email replies externally instead of to internal operators — prevented data exposure across 3+ enterprise clients.
- Root-caused a P0 RAG query generator defect: retrieved context was inaccurate to chat conversation, traced to an underpowered query-generation model.
- Diagnosed 3 distinct production voice-AI regressions in one cycle: mute-state failure, prompt-adherence drift, and lost conversation history.
- Found a RAG retrieval defect where HTML artifacts degraded response quality, plus an Instagram carousel defect and a Reels defect (video processed as image).
- Identified context-blindness and information-disclosure defects in AI chatbot recommendation logic; validated LLM response behaviour across Gemini, Claude, and Groq.
- Diagnosed a prompt configuration API regression; tracked deprecated LLM model versions for timely removal.
- Validated response metadata fields (bot ID, org ID, conversation ID) for accurate LLM usage attribution.

**Subscription, Billing and API QA**
- Found 8 subscription and plan-flow defects in a single release cycle (incorrect Stripe routing, wrong free-plan pricing, broken checkout, inconsistent credit allocation, state loss, wrong redirects, 0-credit cancel bug, missing credit top-up recovery link).
- Validated the credit exhaustion and early-warning system — hard-block logic, in-app banner triggers, deduction prioritisation.
- Validated new credit billing Admin REST APIs (ledger, account, add-on adjustments, event queues) against spec; confirmed voice STT/TTS credit deduction accuracy (ElevenLabs) across three socket event handlers.
- Investigated a token usage accuracy gap between internal records and actual OpenAI billing logs.

**Security, Compliance and Infrastructure QA**
- Diagnosed a P0 WebSocket 502 outage hitting all HITL operator users — isolated root cause to a reverse-proxy misconfiguration with zero application code access.
- Found an access control gap letting Super Admin requests bypass org filtering, plus a cross-org data isolation defect exposing other tenants' knowledge bases.
- Reviewed and revised privacy policy data-use language for Google OAuth API verification.

**Platform, CMS and Ecommerce QA**
- Caught 5 UI defects on a public marketing landing page and 4 layout defects in PDF export rendering; maintained and executed Playwright automation for the export flow's data updates.
- Found a chat widget flagging defect; validated email verification CTA state logic.
- Delivered Drupal enterprise QA across 3 consecutive Arabic-multilingual releases — zero critical escapes; extended coverage to WordPress lifecycle QA, Shopify checkout, Android APK regression, and SPA/React testing.
- Led donation-management lifecycle QA and 5 content migrations for Education Above All — zero critical escapes.
- Delivered cross-browser and performance QA for 4+ lifestyle and ecommerce brands (jewellery, beauty).
- Tested speaker diarisation and audio pipeline integration for MediaScriber's transcription platform.

## Certifications

Completed: Certified Software Tester — Squad Infotech, 2022
Anthropic Academy: Introduction to Agent Skills | Claude Code in Action | Intro to Model Context Protocol | Claude with the Anthropic API
Planned: ISTQB Foundation Level (International Software Testing Qualifications Board)

## Education

- Bachelor of Commerce (B.Com) — Balbharti College, Mumbai, 2020
- Higher Secondary Certificate (HSC) — Prakash Degree College, 2016
- Secondary School Certificate (SSC) — St Rock's High School, 2014
