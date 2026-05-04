import os
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.concurrency import run_in_threadpool
from groq import Groq

logger = logging.getLogger(__name__)

router = APIRouter()

_client = None

def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not set")
        _client = Groq(api_key=api_key)
    return _client


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form(""),
):
    data = await audio.read()
    if len(data) < 500:
        return {"text": ""}

    def _transcribe():
        client = _get_client()
        kwargs = dict(
            file=(audio.filename or "audio.webm", data),
            model="whisper-large-v3",
        )
        # Only pin the language when explicitly provided — otherwise let
        # Whisper auto-detect (handles Hinglish, English, Hindi etc.)
        if language and language not in ("auto", "hinglish"):
            kwargs["language"] = language
        result = client.audio.transcriptions.create(**kwargs)
        return result.text.strip()

    try:
        text = await run_in_threadpool(_transcribe)
        return {"text": text}
    except Exception as e:
        logger.error("STT transcribe error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
