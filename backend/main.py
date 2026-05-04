from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import os
from pathlib import Path

# Load .env relative to this file so it works regardless of cwd
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

from routes.leads import router as leads_router
from routes.conversation import router as conversation_router
from routes.qualification import router as qualification_router
from routes.analytics import router as analytics_router
from routes.tts import router as tts_router
from routes.stt import router as stt_router

app = FastAPI(title="RupeezyAI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "https://rupeezy-ai-agent.vercel.app",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads_router, prefix="/leads", tags=["leads"])
app.include_router(conversation_router, prefix="/conversation", tags=["conversation"])
app.include_router(qualification_router, prefix="/qualification", tags=["qualification"])
app.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
app.include_router(tts_router, prefix="/tts", tags=["tts"])
app.include_router(stt_router, prefix="/stt", tags=["stt"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "RupeezyAI Voice Agent"}


FRONTEND_DIST = Path(__file__).parent / "frontend_dist"

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/")
    def root():
        return FileResponse(str(FRONTEND_DIST / "index.html"))

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        return FileResponse(str(FRONTEND_DIST / "index.html"))
else:
    @app.get("/")
    def root():
        return {"status": "RupeezyAI Backend Running"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
