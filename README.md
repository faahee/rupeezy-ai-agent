# RupeezyAI

---

> ## "AI Voice Agent That Qualifies Your Leads — While You Sleep"
>
> *Every lead gets called. Every conversation is scored. Only the best reach your team.*

---

> **Stop losing leads to slow follow-ups.**
> Ana, your AI voice agent, picks up where your team can't — calling every inbound lead, speaking their language, handling every objection, and handing you only the ones worth your time.
>
> *Built for scale. Designed for closers.*

---

> "Your best RM works 9 to 6. Ana works 24/7 — and never misses a lead."

---

## What Is RupeezyAI?

RupeezyAI is an AI-powered voice agent platform built for financial product distribution. It deploys a browser-native AI agent named **Ana** that autonomously calls leads, delivers personalized pitches in **Hindi, English, or Hinglish**, detects and resolves objections using a built-in knowledge base, and scores every conversation in real-time as **Hot / Warm / Cold**.

Post-call, a structured summary with RM handoff context and a pre-written WhatsApp message is auto-generated — so your human team only touches the leads that are ready to convert.

**No telephony setup. No call center. Just a browser and an API key.**

---

## The Problem It Solves

Financial product distribution companies lose significant revenue because human RMs cannot contact all inbound leads in time. Cold leads go stale, follow-ups are inconsistent, and objection handling depends entirely on individual RM skill. There is no scalable, consistent way to pitch and qualify hundreds of leads per day.

| Pain Point | What RupeezyAI Does |
|---|---|
| Leads go stale before RM calls | Ana calls instantly, 24/7 |
| Inconsistent pitching quality | Same perfect pitch every time |
| Objections handled poorly | 5 built-in objections with rebuttals |
| No visibility on lead quality | Live 0–100 interest score per call |
| RM spends time on cold leads | Only Hot leads reach the RM |
| No follow-up context | Auto-generated RM handoff summary |

---

## How Ana Works

Ana is the AI voice agent. Here is the full lifecycle of a call:

```
Lead enters system
       │
       ▼
Ana speaks opening pitch (language auto-detected: Hindi / English / Hinglish)
       │
       ▼
Lead responds (browser STT captures speech)
       │
       ▼
LLM (Llama 3.3 70B via Groq) processes response:
  - Detects language
  - Identifies objection (if any)
  - Selects knowledge-base rebuttal
  - Updates interest score (delta ±10 per turn, server signals authoritative)
  - Decides next call stage: opening → pitching → objection → closing
       │
       ▼
Ana speaks reply (browser TTS)
       │
       ▼
Loop until: lead qualifies OR call ends
       │
       ▼
Post-call summary generated:
  - Interest score (0–100)
  - Classification: Hot / Warm / Cold
  - Key discussion points
  - RM handoff context paragraph
  - Pre-written WhatsApp message
```

---

## Lead Intelligence — Scoring System

Every conversation produces a real-time interest score (0–100) based on weighted signals:

| Signal | Weight | Meaning |
|---|---|---|
| `explicit_interest` | +25 | Lead directly expressed interest |
| `asked_for_details` | +20 | Lead asked about onboarding, earnings, or process |
| `network_mentioned` | +20 | Lead mentioned having a client/partner network |
| `engagement_long` | +15 | Conversation had more than 6 turns |
| `objection_resolved` | +10 | Lead accepted a rebuttal |
| `language_match` | +5 | Ana spoke in lead's preferred language |
| `multiple_objections` | -15 | Lead raised 3+ objections |
| `wants_to_think` | -10 | Lead said "I'll think about it" |
| `negative_response` | -20 | Lead gave explicit rejection |

### Classification Thresholds

| Score | Classification | Action |
|---|---|---|
| ≥ 70 | 🔥 **Hot** | Transfer to RM immediately |
| 40 – 69 | ☀️ **Warm** | Send WhatsApp follow-up link |
| < 40 | ❄️ **Cold** | Log for re-engagement in 30 days |

The LLM contributes a `score_delta` (clamped to ±10 per turn) on top of deterministic server-side signals. Server signals are always authoritative.

---

## Objection Handling

Ana handles the 5 most common objections in the Rupeezy partner program context, with language-matched rebuttals in Hindi, English, and Hinglish:

1. **"I don't have time"** — Rebuttal around low time commitment and passive income
2. **"I don't trust online platforms"** — SEBI registration, track record, partner count
3. **"Commission is too low"** — Tiered commission structure, volume bonuses
4. **"My clients won't be interested"** — Target audience framing, high-yield products
5. **"I need to think about it"** — Urgency framing, limited onboarding slots

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser (React + Vite)                    │
│                                                                  │
│   Dashboard  ──►  VoiceCall Page  ──►  CallSummary Page         │
│       │               │                       │                 │
│   Zustand          Web Speech API          Axios API            │
│   Store            STT + TTS               Calls                │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTP REST
┌──────────────────────────▼───────────────────────────────────────┐
│                     FastAPI Backend (Python)                     │
│                                                                  │
│  /leads  /conversation  /qualification  /analytics  /stt  /tts  │
│       │          │                                               │
│   In-Memory    LLM Service  ──►  Groq API (Llama 3.3 70B)       │
│   Database     Summary Svc  ──►  Post-call summary generation    │
│                Qualification ──► Hot/Warm/Cold scoring engine    │
│                Knowledge Base ──► Objection rebuttals            │
└──────────────────────────────────────────────────────────────────┘
```

### Key Files

| Path | Role |
|---|---|
| `backend/services/llm_service.py` | ConversationManager, system prompt, score delta logic |
| `backend/services/qualification_service.py` | Signal weights, classify(), compute_score() |
| `backend/services/summary_service.py` | Post-call summary generation via Groq |
| `backend/knowledge/rupeezy_script.py` | Pitch scripts + objection rebuttals knowledge base |
| `backend/routes/conversation.py` | /start, /message, /end endpoints |
| `backend/routes/leads.py` | CRUD for leads |
| `backend/routes/analytics.py` | Funnel + summary stats |
| `backend/database.py` | In-memory leads/conversations/summaries store |
| `frontend/src/pages/VoiceCall.jsx` | Main call UI, Web Speech loop |
| `frontend/src/pages/Dashboard.jsx` | Lead cards + funnel chart |
| `frontend/src/pages/CallSummary.jsx` | Post-call results + actions |
| `frontend/src/components/LeadCard.jsx` | Score bar + Hot/Warm/Cold badge |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend Framework | React 18 + Vite | Fast HMR, component model |
| Styling | Tailwind CSS | Utility-first, dark UI |
| State Management | Zustand | Lightweight global store |
| HTTP Client | Axios | REST calls to FastAPI |
| Charts | Recharts | Funnel + bar charts |
| Routing | React Router v6 | SPA page routing |
| Speech-to-Text | Web Speech API | 100% free, browser-native |
| Text-to-Speech | Web Speech Synthesis | 100% free, browser-native |
| Backend Framework | FastAPI (Python 3.10+) | Async, auto-docs at /docs |
| LLM | Groq — Llama 3.3 70B Versatile | Free tier, extremely fast inference |
| Summary LLM | Groq — Llama 3.1 8B Instant | Lightweight, fast post-call generation |
| Database | In-memory Python dict | Zero infra for demo; MongoDB-ready |
| Config | python-dotenv | .env file management |

---

## Full API Reference

### Leads

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/leads` | `{name, phone, language_hint, source}` | Create new lead |
| `GET` | `/leads` | `?classification=Hot&status=new` | List leads (filterable) |
| `GET` | `/leads/{id}` | — | Get single lead |
| `PUT` | `/leads/{id}/status` | `{status, classification, score}` | Update lead |

### Conversation

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/conversation/start/{lead_id}` | — | Start call, returns Ana's opening pitch |
| `POST` | `/conversation/message/{lead_id}` | `{message}` | Send user speech, get Ana's response + updated score |
| `POST` | `/conversation/end/{lead_id}` | — | End call, trigger summary generation |
| `GET` | `/conversation/history/{lead_id}` | — | Full transcript with timestamps |
| `GET` | `/conversation/summary/{lead_id}` | — | Post-call summary object |

### Qualification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/qualification/score/{lead_id}` | Current score + classification for a lead |
| `POST` | `/qualification/score/{lead_id}` | Compute score from raw signal dict |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics/funnel` | Hot/Warm/Cold counts for funnel chart |
| `GET` | `/analytics/summary` | Total leads, avg score, conversion rate |
| `GET` | `/analytics/leads/recent` | Last 10 leads by updated_at |

---

## Features

- 🗣 **Multilingual Voice** — Hindi, English, Hinglish auto-detected per lead
- 🧠 **Objection Handling** — 5 objections with language-matched rebuttals from knowledge base
- 📊 **Live Scoring** — Interest score updates after every message, visible on screen
- 🔥 **Hot/Warm/Cold Classification** — Automatic, threshold-based lead qualification
- 📋 **Post-Call Summary** — AI-generated with key points, RM context, and WhatsApp draft
- 💬 **WhatsApp Integration** — One-click pre-written message for Warm leads
- 📈 **Analytics Dashboard** — Conversion funnel and lead source breakdown
- 🔄 **Full Conversation Transcript** — Every message stored with timestamps and metadata
- 🆓 **100% Free Stack** — Groq free tier + Web Speech API + open source

---

## For Developers

See [SETUP.md](SETUP.md) for the complete step-by-step setup guide, API key configuration, and troubleshooting.

---

*RupeezyAI — Because every lead deserves a call.*

