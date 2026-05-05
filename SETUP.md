# RupeezyAI — Complete Setup & Run Guide

> This guide covers everything: getting your API key, installing dependencies, running the app locally, and using the API.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Get Your Free Groq API Key](#get-your-free-groq-api-key)
3. [Clone & Project Structure](#clone--project-structure)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Running the App](#running-the-app)
7. [Environment Variables Reference](#environment-variables-reference)
8. [Using the App Step by Step](#using-the-app-step-by-step)
9. [API Usage Examples](#api-usage-examples)
10. [Optional: MongoDB Setup](#optional-mongodb-setup)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you start, make sure you have the following installed:

| Tool | Minimum Version | Check Command |
|---|---|---|
| Python | 3.10+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 8+ | `npm --version` |
| Chrome / Edge | Any recent | — |

> **Browser requirement:** The Web Speech API (STT + TTS) only works in **Chrome** or **Edge**. Firefox and Safari are not supported.

---

## Get Your Free Groq API Key

RupeezyAI uses **Groq** to run Llama 3.3 70B for conversations and Llama 3.1 8B for post-call summaries. The free tier is enough for development and demos.

### Step-by-step

1. Open [https://console.groq.com](https://console.groq.com) in your browser
2. Click **Sign Up** — you can sign in with Google (no credit card needed)
3. After logging in, click **API Keys** in the left sidebar
4. Click **Create API Key**
5. Give it a name (e.g. `rupeezy-dev`)
6. Copy the key — it starts with `gsk_...`

You will paste this key into `backend/.env` in the next step.

> **Free tier limits:** Groq free tier gives ~14,400 tokens/minute on Llama 3.3 70B. This is more than enough for demos and development.

---

## Clone & Project Structure

```bash
git clone https://github.com/faahee/rupeezy-ai-agent.git
cd rupeezy-ai-agent
```

```
rupeezy-ai-agent/
├── backend/                  # FastAPI Python backend
│   ├── .env.example          # Environment variable template
│   ├── main.py               # App entry point
│   ├── database.py           # In-memory data store + seed data
│   ├── requirements.txt      # Python dependencies
│   ├── knowledge/            # Pitch scripts + objection rebuttals
│   ├── models/               # Pydantic data models
│   ├── routes/               # API route handlers
│   └── services/             # LLM, qualification, summary logic
└── frontend/                 # React + Vite frontend
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── pages/            # Dashboard, VoiceCall, CallSummary
        ├── components/       # LeadCard, ScoreBadge, Waveform, etc.
        ├── services/api.js   # Axios API client
        └── store/useStore.js # Zustand global state
```

---

## Backend Setup

### 1. Navigate to the backend folder

```bash
cd rupeezy-ai-agent/backend
```

### 2. Create your environment file

```bash
# On Mac/Linux:
cp .env.example .env

# On Windows (PowerShell):
Copy-Item .env.example .env
```

### 3. Add your Groq API key

Open `backend/.env` in any text editor and fill in your key:

```env
GROQ_API_KEY=gsk_your_actual_key_here
MONGODB_URI=mongodb://localhost:27017/rupeezy_ai
FRONTEND_URL=http://localhost:5173
PORT=8000
```

Only `GROQ_API_KEY` is required. The rest have working defaults.

### 4. Create a virtual environment (recommended)

```bash
# Create venv
python -m venv venv

# Activate on Mac/Linux:
source venv/bin/activate

# Activate on Windows (PowerShell):
.\venv\Scripts\Activate.ps1
```

### 5. Install Python dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `fastapi` + `uvicorn` — web framework and ASGI server
- `groq` — Groq Python SDK for LLM calls
- `pydantic` — data validation
- `python-dotenv` — loads `.env` file
- `pymongo` — optional MongoDB driver
- `edge-tts` — server-side TTS fallback
- `httpx`, `aiofiles`, `python-multipart` — async utilities

### 6. Start the backend

```bash
python main.py
```

You should see:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

The backend is now running at **http://localhost:8000**

Interactive API docs are available at **http://localhost:8000/docs**

---

## Frontend Setup

Open a **new terminal window** and navigate to the frontend folder:

```bash
cd rupeezy-ai-agent/frontend
```

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the API URL (if needed)

By default, the frontend points to `http://localhost:8000`. If your backend runs on a different port, edit `frontend/src/services/api.js`:

```js
const API_BASE = 'http://localhost:8000'   // change this if needed
```

### 3. Start the frontend

```bash
npm run dev
```

You should see:

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

## Running the App

With both servers running:

| Service | URL |
|---|---|
| Frontend (React) | http://localhost:5173 |
| Backend (FastAPI) | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |

Open **http://localhost:5173** in **Chrome** (required for Web Speech API).

---

## Environment Variables Reference

All variables go in `backend/.env`:

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | **Yes** | — | Your Groq API key (`gsk_...`). Get it at [console.groq.com](https://console.groq.com) |
| `FRONTEND_URL` | No | `http://localhost:5173` | Frontend URL for CORS. Change if deploying to a custom domain |
| `PORT` | No | `8000` | Port the FastAPI server listens on |
| `MONGODB_URI` | No | — | MongoDB connection string. If omitted, app uses in-memory storage |

### Full `.env` example

```env
# Required
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional — change only if needed
FRONTEND_URL=http://localhost:5173
PORT=8000

# Optional — only needed if using MongoDB persistence
MONGODB_URI=mongodb://localhost:27017/rupeezy_ai
```

---

## Using the App Step by Step

### 1. Dashboard

Open the app. You will see the **Dashboard** with:
- Existing seed leads (Amit, Sunita, Vikram, etc.) with Hot/Warm/Cold badges
- A conversion funnel chart showing lead distribution
- Analytics summary: total leads, average score, conversion rate

### 2. Create a New Lead

Click **"New Call"** or the **+** button and fill in:
- **Name** — lead's full name
- **Phone** — 10-digit mobile number
- **Language** — Hindi / English / Hinglish (Ana will auto-adjust)
- **Source** — where the lead came from (Website, Facebook Ad, etc.)

### 3. Start a Voice Call

Click **"Call"** on any lead card. The Voice Call screen opens and:
- Ana automatically speaks the opening pitch in the lead's language
- The microphone activates and listens for the lead's response

### 4. During the Call

- **Speak your response** — the browser STT captures your speech
- Ana processes it through the LLM and speaks back
- The **interest score bar** updates in real-time after each message
- If an objection is detected, an **objection alert** appears with the rebuttal used
- Watch the call stage progress: Opening → Pitching → Objection Handling → Closing

### 5. End the Call

Click **"End Call"** at any time. This:
- Stops the conversation loop
- Triggers post-call summary generation via Groq
- Updates the lead's classification and score in the database
- Redirects to the Call Summary page

### 6. Call Summary

The summary page shows:
- Interest score (circular gauge)
- Hot / Warm / Cold badge
- Key discussion points from the conversation
- RM handoff context paragraph
- Recommended action with one-click button:
  - 🔥 **Hot** → "Transfer to RM"
  - ☀️ **Warm** → "Send WhatsApp" (opens pre-written message)
  - ❄️ **Cold** → "Log for Later"

---

## API Usage Examples

You can use the API directly via curl, Postman, or the Swagger UI at `/docs`.

### Create a lead

```bash
curl -X POST http://localhost:8000/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rahul Sharma",
    "phone": "9876543210",
    "language_hint": "hinglish",
    "source": "Website Form"
  }'
```

Response:
```json
{
  "id": "abc123-...",
  "name": "Rahul Sharma",
  "phone": "9876543210",
  "language_hint": "hinglish",
  "source": "Website Form",
  "classification": "Unqualified",
  "score": 0,
  "status": "new"
}
```

### Start a conversation

```bash
curl -X POST http://localhost:8000/conversation/start/abc123
```

Response:
```json
{
  "response_text": "Namaste Rahul ji! Main Ana hoon, Rupeezy ki taraf se...",
  "detected_language": "hinglish",
  "call_stage": "opening",
  "current_score": 0
}
```

### Send a message

```bash
curl -X POST http://localhost:8000/conversation/message/abc123 \
  -H "Content-Type: application/json" \
  -d '{"message": "Haan, mujhe interest hai. Kitna commission milega?"}'
```

Response:
```json
{
  "response_text": "Bahut achha sawaal hai! Aapko 1.5% se 3% tak commission milega...",
  "detected_language": "hinglish",
  "objection_detected": null,
  "call_stage": "pitching",
  "current_score": 65,
  "qualification_update": {
    "score_delta": 10,
    "reason": "lead asked for commission details — strong buying signal"
  }
}
```

### End the call and get summary

```bash
curl -X POST http://localhost:8000/conversation/end/abc123
```

```bash
curl http://localhost:8000/conversation/summary/abc123
```

Response:
```json
{
  "lead_name": "Rahul Sharma",
  "lead_phone": "9876543210",
  "call_duration_minutes": 4.2,
  "language_used": "hinglish",
  "interest_score": 72,
  "classification": "Hot",
  "key_discussion_points": ["Asked about commission structure", "Mentioned existing client base"],
  "recommended_action": "Transfer to RM immediately",
  "rm_handoff_context": "Lead Rahul Sharma completed a 4.2-minute call. Score: 72/100. Hot. ...",
  "whatsapp_message": "Hi Rahul ji! Ana here from Rupeezy..."
}
```

### Get analytics

```bash
curl http://localhost:8000/analytics/summary
```

```json
{
  "total_leads": 8,
  "hot_leads": 2,
  "warm_leads": 3,
  "cold_leads": 3,
  "average_score": 51.4,
  "conversion_rate": 25.0
}
```

---

## Optional: MongoDB Setup

By default, RupeezyAI uses an **in-memory dictionary** — data resets on every server restart. To persist data, connect MongoDB.

### Local MongoDB

1. Install MongoDB Community: [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Start MongoDB: `mongod --dbpath /data/db`
3. Set in `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/rupeezy_ai
```

### MongoDB Atlas (free cloud)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create a free cluster
2. Click **Connect** → **Connect your application**
3. Copy the connection string and paste into `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/rupeezy_ai
```

---

## Deployment

### Backend — Railway / Render / Fly.io

The backend includes a `railway.toml` for Railway deployment.

```bash
# Set environment variable in Railway dashboard:
GROQ_API_KEY=gsk_your_key
FRONTEND_URL=https://your-frontend.vercel.app
```

The `Dockerfile` at the project root builds the backend:

```bash
docker build -t rupeezy-backend .
docker run -p 8000:8000 -e GROQ_API_KEY=gsk_your_key rupeezy-backend
```

### Frontend — Vercel

The frontend includes `vercel.json` for Vercel deployment.

1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Set build settings:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Set environment variable:
   - `VITE_API_URL=https://your-backend.railway.app`

Then update `frontend/src/services/api.js` to use:
```js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
```

---

## Troubleshooting

### "Microphone not working / no speech detected"

- You must use **Chrome** or **Edge** — Web Speech API is not supported in Firefox or Safari
- Make sure the browser has microphone permission (click the lock icon in the address bar)
- Speak clearly and wait for the pulsing indicator before speaking

### "GROQ_API_KEY not set" error

- Make sure `backend/.env` exists (not just `.env.example`)
- Verify the key starts with `gsk_`
- Restart the backend after editing `.env`

### "CORS error" in browser console

- Make sure `FRONTEND_URL` in `.env` exactly matches where the frontend is running
- Default: `http://localhost:5173` — do not add a trailing slash

### Backend starts but frontend can't connect

- Verify the backend is running at `http://localhost:8000`
- Check `frontend/src/services/api.js` — `API_BASE` should match the backend URL
- Make sure no firewall is blocking port 8000

### "Module not found" on backend start

- Make sure you activated the virtual environment before running `pip install`
- Try: `pip install -r requirements.txt --upgrade`

### Score not updating during call

- The score updates on every `/conversation/message` call
- Check the browser console for API errors
- Verify the backend is running and reachable

---

*For project overview, architecture, and feature details see [README.md](README.md).*
