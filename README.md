# RupeezyAI - AI Voice Agent for Partner Lead Conversion

> An AI-powered browser voice agent that calls leads, pitches Rupeezy's partner program in Hindi/English/Hinglish, handles objections, qualifies leads as Hot/Warm/Cold, and provides an RM dashboard with analytics.

---

## Problem Statement

Financial product distribution companies lose significant revenue because human RMs cannot contact all inbound leads in time. Cold leads go stale, follow-ups are inconsistent, and objection handling depends heavily on RM skill. There is no scalable, consistent way to pitch and qualify hundreds of leads per day.

---

## Solution Overview

RupeezyAI deploys an AI voice agent (Ana) that runs entirely in the browser. Ana calls leads, delivers a personalized pitch in their preferred language (Hindi/English/Hinglish), detects and handles the 5 most common objections using a built-in knowledge base, and scores each lead as Hot/Warm/Cold in real-time. After the call, a post-call summary with RM handoff context and a pre-written WhatsApp message is auto-generated. All data is visible on a live RM dashboard with conversion funnel analytics.

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
                           │ HTTP REST (localhost:8000)
┌──────────────────────────▼───────────────────────────────────────┐
│                     FastAPI Backend                              │
│                                                                  │
│  /leads  /conversation  /qualification  /analytics              │
│       │          │                                              │
│   In-Memory    LLM Service  ──►  Groq API (Llama 3.3 70B)      │
│   Database     Summary Svc  ──►  Post-call summary              │
│                Qualification ──► Hot/Warm/Cold scoring           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| State Management | Zustand |
| HTTP Client | Axios |
| Charts | Recharts |
| Routing | React Router v6 |
| STT | Web Speech API (browser-native) |
| TTS | Web Speech Synthesis API (browser-native) |
| Backend Framework | FastAPI (Python 3.10+) |
| LLM | Groq API — Llama 3.3 70B Versatile |
| Database | In-memory Python dict (MongoDB optional) |
| Env Config | python-dotenv |

---

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Free API key from [console.groq.com](https://console.groq.com) |
| `MONGODB_URI` | Optional MongoDB connection string |
| `FRONTEND_URL` | Frontend URL for CORS (default: http://localhost:5173) |
| `PORT` | Backend port (default: 8000) |

### Getting a Free Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up with Google account (free)
3. Click **API Keys** → **Create Key**
4. Copy and paste into `backend/.env`

---

## Setup & Run

### Prerequisites

- Python 3.10+
- Node.js 18+
- Chrome browser (required for Web Speech API)

### Backend

```bash
cd rupeezy-ai-agent/backend

# Copy env file
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Install dependencies
pip install -r requirements.txt

# Run backend
python main.py
# Backend runs at http://localhost:8000
```

### Frontend

```bash
cd rupeezy-ai-agent/frontend

# Install dependencies
npm install

# Run frontend
npm run dev
# Frontend runs at http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in **Chrome**.

---

## How to Use

1. **Dashboard** — View all leads with Hot/Warm/Cold classification and conversion funnel
2. **Start New Call** — Fill in lead name, phone, and language preference
3. **Voice Call Screen** — Ana (AI agent) automatically speaks the opening pitch
4. **Conversation Loop**:
   - Ana speaks → auto-listens for your response → detects language & objections → responds appropriately → loops
   - Live interest score updates on screen
   - Objection alerts appear when detected
5. **End Call** — Click "End Call" or Ana closes naturally when lead qualifies
6. **Call Summary** — View post-call summary, RM handoff context, and take action (Transfer to RM / Send WhatsApp / Log for Later)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/health` | Service status |
| POST | `/leads` | Create new lead |
| GET | `/leads` | List all leads (with filter) |
| GET | `/leads/{id}` | Get single lead |
| PUT | `/leads/{id}/status` | Update lead status |
| POST | `/conversation/start/{lead_id}` | Start conversation, get opening |
| POST | `/conversation/message/{lead_id}` | Send user message, get bot response |
| POST | `/conversation/end/{lead_id}` | End call, trigger summary generation |
| GET | `/conversation/history/{lead_id}` | Full conversation transcript |
| GET | `/conversation/summary/{lead_id}` | Post-call summary |
| GET | `/analytics/funnel` | Conversion funnel data |
| GET | `/analytics/summary` | Overall stats |
| GET | `/analytics/leads/recent` | Last 10 leads |

---

## Features

- 🗣 **Multilingual Voice** — Hindi, English, Hinglish (auto-detected)
- 🧠 **Objection Handling** — 5 objections with language-matched rebuttals
- 📊 **Live Scoring** — Interest score updates in real-time during call
- 🔥 **Hot/Warm/Cold Classification** — Automatic lead qualification
- 📋 **Post-Call Summary** — AI-generated summary with RM handoff context
- 💬 **WhatsApp Integration** — Pre-written messages for Warm leads
- 📈 **Analytics Dashboard** — Conversion funnel and lead source breakdown
- 🆓 **100% Free Stack** — Groq free tier + Web Speech API + open source

---

