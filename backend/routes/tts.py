import io
import re
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

# Script-based voice override — detects Unicode script in the text
# so the correct voice is used even if language tag is wrong.
_SCRIPT_OVERRIDES = [
    (re.compile(r'[\u0B80-\u0BFF]'), 'ta-IN-PallaviNeural'),   # Tamil
    (re.compile(r'[\u0C80-\u0CFF]'), 'kn-IN-SapnaNeural'),     # Kannada
    (re.compile(r'[\u0C00-\u0C7F]'), 'te-IN-ShrutiNeural'),    # Telugu
    (re.compile(r'[\u0D00-\u0D7F]'), 'ml-IN-SobhanaNeural'),   # Malayalam
    (re.compile(r'[\u0980-\u09FF]'), 'bn-IN-TanishaaNeural'),  # Bengali
    (re.compile(r'[\u0A80-\u0AFF]'), 'gu-IN-DhwaniNeural'),    # Gujarati
    (re.compile(r'[\u0900-\u097F]'), 'hi-IN-SwaraNeural'),     # Devanagari (Hindi/Marathi)
]


class TTSRequest(BaseModel):
    text: str
    language: str = "hinglish"


@router.post("/speak")
async def text_to_speech(req: TTSRequest):
    voice = VOICE_MAP.get(req.language, "en-IN-NeerjaNeural")
    # Override based on actual script in the text — catches mismatch when
    # language tag didn't update but LLM already switched scripts.
    for pattern, override_voice in _SCRIPT_OVERRIDES:
        if len(pattern.findall(req.text)) > 2:
            voice = override_voice
            break
    print(f"[TTS] language={req.language} voice={voice} text_len={len(req.text)}")

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
