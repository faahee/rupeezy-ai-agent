import io
import edge_tts
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

router = APIRouter()

# Microsoft Edge neural voices — free, no API key needed
VOICE_MAP = {
    "hindi":    "hi-IN-SwaraNeural",              # Hindi female
    "hinglish": "en-IN-NeerjaNeural",             # Indian English female (default)
    "english":  "en-IN-NeerjaNeural",             # Indian English female
    "tamil":    "ta-IN-PallaviNeural",            # Tamil female
    "kannada":  "kn-IN-SapnaNeural",              # Kannada female
    "telugu":   "te-IN-ShrutiNeural",             # Telugu female
    "malayalam":"ml-IN-SobhanaNeural",            # Malayalam female
    "bengali":  "bn-IN-TanishaaNeural",           # Bengali female
    "marathi":  "mr-IN-AarohiNeural",             # Marathi female
    "gujarati": "gu-IN-DhwaniNeural",             # Gujarati female
    "urdu":     "ur-IN-GulNeural",                # Urdu female
    # punjabi → falls back to default Indian English voice
}


class TTSRequest(BaseModel):
    text: str
    language: str = "hinglish"


@router.post("/speak")
async def text_to_speech(req: TTSRequest):
    voice = VOICE_MAP.get(req.language, "en-IN-NeerjaNeural")

    try:
        communicate = edge_tts.Communicate(req.text, voice, rate="-5%", pitch="+0Hz")
        audio_buf = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buf.write(chunk["data"])

        audio_bytes = audio_buf.getvalue()
        if not audio_bytes:
            raise ValueError("No audio data received")

        return Response(content=audio_bytes, media_type="audio/mpeg")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")
