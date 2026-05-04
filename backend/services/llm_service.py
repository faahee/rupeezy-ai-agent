import os
import json
import re
import random
import traceback
from groq import Groq
from knowledge.rupeezy_script import PROGRAM_BENEFITS, OPENING_SCRIPT, OPENING_SCRIPTS, OBJECTIONS, CLOSING_SCRIPT

MODEL = "llama-3.1-8b-instant"
_client = None


def get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client

DEVANAGARI_PATTERN = re.compile(r'[\u0900-\u097F]')
TAMIL_PATTERN      = re.compile(r'[\u0B80-\u0BFF]')
KANNADA_PATTERN    = re.compile(r'[\u0C80-\u0CFF]')
TELUGU_PATTERN     = re.compile(r'[\u0C00-\u0C7F]')
MALAYALAM_PATTERN  = re.compile(r'[\u0D00-\u0D7F]')
BENGALI_PATTERN    = re.compile(r'[\u0980-\u09FF]')
GUJARATI_PATTERN   = re.compile(r'[\u0A80-\u0AFF]')
GURMUKHI_PATTERN   = re.compile(r'[\u0A00-\u0A7F]')

# Common English words used to estimate English ratio
ENGLISH_WORDS = {
    "hello", "hi", "yes", "no", "ok", "okay", "good", "thanks", "thank", "you",
    "i", "my", "me", "we", "not", "want", "need", "join", "tell", "more",
    "interested", "already", "think", "later", "broker", "clients", "contacts",
    "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "will", "would", "could", "should", "may", "might", "can",
    "a", "an", "the", "and", "or", "but", "so", "if", "then", "that", "this", "it",
    "in", "on", "at", "to", "for", "of", "with", "from", "by", "about", "as",
    "what", "when", "where", "who", "how", "why", "which",
    "very", "also", "just", "now", "here", "there", "up", "out", "like", "get",
    "know", "go", "see", "say", "said", "call", "work", "time", "day", "money",
    "program", "partner", "share", "free", "daily", "payout", "business", "income",
    "tell", "learn", "send", "details", "right", "sure", "please", "well",
}

# Hindi/Hinglish words written in Roman script — presence signals Hinglish
HINDI_ROMAN_WORDS = {
    "haan", "nahi", "nahin", "kya", "hai", "hain", "tha", "the", "thi",
    "aur", "lekin", "magar", "par", "toh", "yaar", "bhai", "didi",
    "acha", "achha", "theek", "thik", "bilkul", "zyada", "thoda", "bahut", "abhi",
    "kal", "aaj", "kab", "kaise", "kaun", "kyun", "kahan",
    "mujhe", "tumhe", "aapko", "humko", "main", "hum", "tum", "aap", "woh", "yeh",
    "karo", "karna", "karein", "bolo", "batao", "samjho", "dekho", "suno",
    "paisa", "paise", "roz", "din", "mahina",
    "namaste", "namaskar", "dhanyawad", "shukriya",
    "lagta", "lagti", "milta", "milti", "bhi", "jo", "jab", "tab", "agar",
    "matlab", "apna", "apni", "mera", "tera", "hamara", "tumhara",
    "sab", "sabse", "sahi", "galat", "kam", "raha", "rahi", "gaya", "gayi",
}

# ── Server-side scoring keywords ──────────────────────────────────────────────
# These patterns are matched against the user's message to compute a reliable
# score delta independently of (and to sanity-check) the LLM's own estimate.

_EXPLICIT_INTEREST_PHRASES = re.compile(
    r"\b(interested|interest|yes|haan|bilkul|zaroor|definitely|absolutely|sure|"
    r"sounds good|great|excellent|perfect|i.?m in|let.?s do|want to join|"
    r"how (do|can) i (join|register|sign up|start)|sign me up|"
    r"join karna|join karunga|join karenge|sign up karna|"
    r"tell me more|bata(o|iye)|samjha(o|iye)|explain|"
    r"next step|aage kya|how to proceed|proceed|"
    r"i.?ll join|mai(n)? join|hum join|let.?s go|ok let.?s|alright|"
    # RM connect signals — strong buying intent
    r"relationship manager|connect (me|us)? ?(with|to)?|rm connect|connect karo|connect kar|"
    r"connect pannunga|connect pannuvu|connect cheyyandi|connect cheyyi|"
    r"let.?s (discuss|talk|proceed)|discuss kar|let us (discuss|talk)|"
    # Tamil yes/ok words in Roman
    r"sari|aama|paarkalam|paarkalaam|discuss panalam|discuss panlaam)",
    re.I
)

# Tamil Unicode signals — match key Tamil words directly
_TAMIL_INTEREST = re.compile(
    r"[\u0B9A\u0BB0\u0BBF]{3}|"   # சரி  (sari = ok/alright)
    r"[\u0B86\u0BAE\u0bbe]{3}|"   # ஆமா  (aama = yes)
    r"[\u0BB5\u0BBF\u0BB0\u0BC1\u0BAE\u0BCD\u0BAA\u0BC1]",  # விரும்பு (want/interested)
    re.I
)

_NETWORK_PHRASES = re.compile(
    r"\b(clients?|contacts?|network|investors?|customers?|distributor|"
    r"mere clients?|apne clients?|mera network|meri list|"
    r"\d+\s*(clients?|contacts?|people|log|investors?)|"
    r"already (have|working with)|existing (clients?|base))\b",
    re.I
)

_DETAIL_QUESTION_PHRASES = re.compile(
    r"\b(how (do|can|will|does)|what (is|are|about)|when (will|do|can)|"
    r"where (do|can|should)|kaise|kya hai|kab|kitna|kitne|"
    r"process kya|kya process|registration|documents?|kyc|fees?|charge|"
    r"payout kaise|kitna milega|brokerage kaise|"
    r"tell me (about|how|more)|explain (the|this|how)|details (of|about)|"
    r"how (does|do) (it|this|the) work|how (much|many)|"
    r"get access|access kaise|platform kaise|portal kaise)\b",
    re.I
)

_POSITIVE_ENGAGEMENT_PHRASES = re.compile(
    r"^(ok(ay)?|good|nice|fine|alright|right|i see|i understand|"
    r"understood|got it|achha|theek|theek hai|samajh gaya|samajh gayi|"
    r"yes yes|haan haan|please continue|go on|continue|"
    r"that.?s (good|great|nice|interesting|helpful)|sounds (good|great|interesting))\b",
    re.I
)

_WANTS_TO_THINK_PHRASES = re.compile(
    r"\b(think about it|let me think|think kar(ta|ti)|sochna hai|soch(ta|ti)|"
    r"call (me )?later|call back|baad mein|abhi nahi|not now|"
    r"give me (some )?time|time chahiye|kuch time|"
    r"discuss with|wife|husband|family|partner se|"
    r"maybe later|perhaps later|will get back)\b",
    re.I
)

_NEGATIVE_PHRASES = re.compile(
    r"\b(not interested|no thanks|don.?t (want|need|call)|"
    r"nahi chahiye|nahi chahta|nahi chahti|mujhe nahi|"
    r"already (have|working) (a |with )?(broker|someone|company)|"
    r"wrong number|busy (right now)?|don.?t have time|"
    r"remove (my|this) number|block|stop calling|"
    r"not looking|not right now)\b",
    re.I
)

_OBJECTION_PHRASES = re.compile(
    r"\b(already (have|with) (a )?broker|not enough (clients?|contacts?)|"
    r"support|trust|reliable|safe|regulated|sebi|"
    r"pahle se broker|dusra broker|another broker|"
    r"kam clients?|clients? nahi|network nahi)\b",
    re.I
)


def _detect_score_signals(text: str) -> dict:
    t = text.strip()
    explicit = bool(_EXPLICIT_INTEREST_PHRASES.search(t)) or bool(_TAMIL_INTEREST.search(t))
    return {
        "explicit_interest":   explicit,
        "network_mentioned":   bool(_NETWORK_PHRASES.search(t)),
        "asked_for_details":   bool(_DETAIL_QUESTION_PHRASES.search(t)),
        "positive_engagement": bool(_POSITIVE_ENGAGEMENT_PHRASES.match(t)),
        "wants_to_think":      bool(_WANTS_TO_THINK_PHRASES.search(t)),
        "negative_response":   bool(_NEGATIVE_PHRASES.search(t)),
        "objection_raised":    bool(_OBJECTION_PHRASES.search(t)),
        "rm_connect_requested": bool(re.search(
            r"\b(relationship manager|rm|connect (me|us)?|connect (karo|kar|pannunga|pannuvu|cheyyandi))",
            t, re.I
        )),
    }


# Score weights for each server-detected signal (applied once per new signal)
_SIGNAL_SCORES = {
    "explicit_interest":   +20,
    "network_mentioned":   +15,
    "asked_for_details":   +10,
    "positive_engagement": +5,
    "wants_to_think":      -8,
    "negative_response":   -20,
    "objection_raised":    -5,
}


class ConversationManager:
    def __init__(self, lead_id: str):
        self.lead_id = lead_id
        self.conversation_history = []
        self.detected_language = "hinglish"
        self.preferred_language = "hinglish"  # set from lead's language_hint
        self.objection_tracking = []
        self.engagement_metrics = {
            "objections_raised": 0,
            "objections_resolved": 0,
            "interest_signals": [],
            "explicit_interest": False,
            "network_mentioned": False,
            "asked_for_details": False,
            "wants_to_think": False,
            "negative_response": False,
            "language_match": False,
        }
        self.score = 0
        self.call_stage = "opening"
        self.message_count = 0

    # Explicit language switch requests — highest priority
    _LANG_SWITCH = re.compile(
        r"speak\s+(?:in\s+|only\s+)?(tamil|hindi|kannada|telugu|malayalam|bengali|marathi|gujarati|punjabi|urdu|english|hinglish)"
        r"|(?:tamil|hindi|kannada|telugu|malayalam|bengali|marathi|gujarati|punjabi|urdu|english)\s+(?:lo|mein|le|il|lil|medium)\s*(?:matla|maat|pesu|speak|baat)?"
        r"|(?:en|um)\s+(?:tamil|hindi|kannada|telugu|malayalam)\s+(?:pesungal|pesidunga|pesuvom|matram)",
        re.I
    )

    _LANG_NAMES = {
        "tamil": "tamil", "hindi": "hindi", "kannada": "kannada",
        "telugu": "telugu", "malayalam": "malayalam", "bengali": "bengali",
        "marathi": "marathi", "gujarati": "gujarati", "punjabi": "punjabi",
        "urdu": "urdu", "english": "english", "hinglish": "hinglish",
    }

    def detect_language(self, text: str) -> str:
        """Detect script from user text. Falls back to preferred_language if no script detected."""
        # ── Explicit language switch request takes highest priority ──────────
        sw = self._LANG_SWITCH.search(text)
        if sw:
            lang_word = sw.group(1).lower() if sw.group(1) else None
            if not lang_word:
                # match group 1 not captured — try to find a language name in the full text
                for name in self._LANG_NAMES:
                    if name in text.lower():
                        lang_word = name
                        break
            if lang_word and lang_word in self._LANG_NAMES:
                detected = self._LANG_NAMES[lang_word]
                self.preferred_language = detected  # remember switch for future turns
                return detected
        devanagari_count = len(DEVANAGARI_PATTERN.findall(text))
        tamil_count      = len(TAMIL_PATTERN.findall(text))
        kannada_count    = len(KANNADA_PATTERN.findall(text))
        telugu_count     = len(TELUGU_PATTERN.findall(text))
        malayalam_count  = len(MALAYALAM_PATTERN.findall(text))
        bengali_count    = len(BENGALI_PATTERN.findall(text))
        gujarati_count   = len(GUJARATI_PATTERN.findall(text))
        gurmukhi_count   = len(GURMUKHI_PATTERN.findall(text))
        words = text.lower().split()
        english_count = sum(1 for w in words if w in ENGLISH_WORDS)
        total_words = max(len(words), 1)

        # If user types/speaks in a specific script, honour it
        if tamil_count > 3:
            return "tamil"
        elif kannada_count > 3:
            return "kannada"
        elif telugu_count > 3:
            return "telugu"
        elif malayalam_count > 3:
            return "malayalam"
        elif bengali_count > 3:
            return "bengali"
        elif gujarati_count > 3:
            return "gujarati"
        elif gurmukhi_count > 3:
            return "punjabi"
        elif devanagari_count > 3:
            # Could be Hindi, Marathi, or Urdu (Nastaliq uses Devanagari sometimes)
            if self.preferred_language in ("marathi", "hindi", "urdu"):
                return self.preferred_language
            return "hindi"

        # ── No non-Latin script detected ─────────────────────────────────────
        # Strip punctuation for better word matching
        clean_words = [re.sub(r"[^a-z]", "", w) for w in words]
        clean_words = [w for w in clean_words if w]
        english_count = sum(1 for w in clean_words if w in ENGLISH_WORDS)
        hindi_rom_count = sum(1 for w in clean_words if w in HINDI_ROMAN_WORDS)
        total_clean = max(len(clean_words), 1)

        if hindi_rom_count >= 2:
            # Two or more clear Hindi/Hinglish Roman words → Hinglish
            if self.preferred_language in ("hindi", "hinglish"):
                return self.preferred_language
            return "hinglish"

        if hindi_rom_count == 0 and english_count >= 1 and total_clean >= 2:
            # No Hindi transliterations at all + at least one known English word → English
            return "english"

        if english_count / total_clean > 0.4:
            return "english"

        # Ambiguous — stick to the lead's preferred language
        return self.preferred_language

    def _build_knowledge_context(self, language: str = "hinglish") -> str:
        # Pick the rebuttal language: use english for non-Indian-script languages,
        # hinglish for hinglish, and hindi for all other Indian languages.
        if language == "english":
            rb = "rebuttal_english"
        elif language == "hinglish":
            rb = "rebuttal_hinglish"
        else:
            rb = "rebuttal_hindi"

        objection_lines = []
        for key, val in OBJECTIONS.items():
            objection_lines.append(
                f"- {key}: {val[rb]}"
            )
        return f"""RUPEEZY PROGRAM: Zero joining fee. 100% brokerage share (industry gives 60-70%). Daily payouts via RISE Portal. Work under Rupeezy's broker license as AP.

OBJECTION REBUTTALS:
{chr(10).join(objection_lines)}

CLOSING: Hot lead → connect with RM. Warm lead → send WhatsApp details. Cold lead → polite goodbye."""

    def get_system_prompt(self, language: str, lead_name: str) -> str:
        lang_instruction = {
            "hindi":     "Respond ONLY in Hindi (Devanagari script). Be warm and conversational.",
            "english":   "Respond ONLY in English. Be professional yet friendly.",
            "hinglish":  "Respond in Hinglish (natural mix of Hindi and English, Roman script). Be conversational.",
            "tamil":     "Respond ONLY in Tamil (Tamil script). Be warm and conversational.",
            "kannada":   "Respond ONLY in Kannada (Kannada script). Be warm and conversational.",
            "telugu":    "Respond ONLY in Telugu (Telugu script). Be warm and conversational.",
            "malayalam": "Respond ONLY in Malayalam (Malayalam script). Be warm and conversational.",
            "bengali":   "Respond ONLY in Bengali (Bengali script). Be warm and conversational.",
            "marathi":   "Respond ONLY in Marathi (Devanagari script). Be warm and conversational.",
            "gujarati":  "Respond ONLY in Gujarati (Gujarati script). Be warm and conversational.",
            "urdu":      "Respond ONLY in Urdu (Nastaliq/Roman script). Be warm and conversational.",
            "punjabi":   "Respond ONLY in Punjabi (Gurmukhi script). Be warm and conversational.",
        }.get(language, "Respond in Hinglish.")

        # Example response in the correct language so the model doesn't copy a Hinglish example
        example_responses = {
            "english":   "Great! How many clients do you manage right now?",
            "hindi":     "अच्छा! आपके पास अभी कितने clients हैं?",
            "hinglish":  "Accha! Toh aapke paas kitne clients hain abhi?",
            "tamil":     "சரி! இப்போது உங்களுக்கு எத்தனை clients இருக்கிறார்கள்?",
            "kannada":   "ಒಳ್ಳೆಯದು! ನಿಮ್ಮಲ್ಲಿ ಈಗ ಎಷ್ಟು clients ಇದ್ದಾರೆ?",
            "telugu":    "బాగుంది! మీకు ఇప్పుడు ఎంత మంది clients ఉన్నారు?",
            "malayalam": "നല്ലത്! ഇപ്പോൾ നിങ്ങൾക്ക് എത്ര clients ഉണ്ട്?",
            "bengali":   "ভালো! এখন আপনার কতজন clients আছেন?",
            "marathi":   "छान! तुमच्याकडे आत्ता किती clients आहेत?",
            "gujarati":  "સારું! તમારી પાસે અત્યારે કેટલા clients છે?",
            "punjabi":   "ਵਧੀਆ! ਤੁਹਾਡੇ ਕੋਲ ਹੁਣ ਕਿੰਨੇ clients ਹਨ?",
        }
        example_reply = example_responses.get(language, example_responses["hinglish"])

        knowledge = self._build_knowledge_context(language)

        # Sanitize lead name — if it looks like a phone/ID number, use generic address
        display_name = lead_name if lead_name and not re.match(r'^[\d\s\-\+]+$', lead_name.strip()) else ""
        return f"""You are Priya, a sharp and friendly Rupeezy partner program sales agent on a PHONE CALL{' with ' + display_name if display_name else ''}.

LANGUAGE: {lang_instruction}

{knowledge}

CRITICAL RESPONSE RULES — read carefully:
1. PHONE CALL = short replies. Max 1-2 sentences per turn. Never give a speech.
2. Listen first. If the lead asked something, answer it directly and briefly, then ask ONE follow-up.
3. Never dump all benefits at once. Reveal them one at a time, only when relevant.
4. Mirror the lead's energy — if they're curious, elaborate a little. If they're brief, be brief.
5. Mirror language mixing — if the lead uses Tamil + English, respond in Tamil but keep English technical terms (RM, brokerage, payout, join, portal).
6. NEVER start two consecutive responses with the same word or phrase. Vary your openers.
7. Handle objections in ONE sentence, then pivot with a question.
8. NEVER repeat what you just said. If the lead didn’t respond, rephrase briefly.
9. Call stage flow: opening → pitching → objection_handling → closing. Move stages naturally.
10. If lead asks for relationship manager / RM / connect — IMMEDIATELY say you’re arranging it and set end_call: false, call_stage: closing.
11. Hot lead (score ≥70 or asks for RM) → offer RM connect and close. Warm → offer WhatsApp details. Cold → close politely.
12. If lead says bye, end call.

SCORING — set score_delta accurately:
+15 to +20 : lead says yes/interested/join karna hai/tell me more
+10 to +15 : lead mentions their client network or asks how to join
+5  to +10 : lead asks any clarifying question (how, what, when, kaise)
+3  to +5  : lead gives a short positive reply (ok, good, sounds nice)
-5  to -8  : lead says think about it / call later / baad mein
-15 to -20 : lead says not interested / wrong number / already have broker
0          : neutral filler (hmm, ok, hello)

CRITICAL: End EVERY reply with this exact JSON block (fill in real values, do not copy the example text):
```json
{{
  "response_text": "{example_reply}",
  "detected_language": "{language}",
  "objection_detected": "none",
  "interest_signals": [],
  "qualification_update": {{"score_delta": 5, "reason": "lead is a financial advisor"}},
  "call_stage": "pitching",
  "end_call": false
}}
```
IMPORTANT: response_text must be your actual spoken reply (max 30 words). Replace ALL example values with real ones.
"""

    def process_message(self, user_message: str, lead_data: dict) -> dict:
        detected_lang = self.detect_language(user_message)
        self.detected_language = detected_lang
        self.message_count += 1
        # response_lang = the language the BOT should speak in.
        # If the user said "speak in Tamil", detect_language() already updated
        # self.preferred_language to "tamil", so use that for the bot's reply.
        response_lang = self.preferred_language

        # ── Server-side signal detection ─────────────────────────────────────
        signals = _detect_score_signals(user_message)

        # Compute server-side score delta — only award each one-time signal once
        server_delta = 0
        if signals["explicit_interest"] and not self.engagement_metrics.get("explicit_interest"):
            self.engagement_metrics["explicit_interest"] = True
            server_delta += _SIGNAL_SCORES["explicit_interest"]
        # RM connect = extremely strong buying signal — worth +25 once
        if signals.get("rm_connect_requested") and not self.engagement_metrics.get("rm_connect_requested"):
            self.engagement_metrics["rm_connect_requested"] = True
            server_delta += 25
        if signals["network_mentioned"] and not self.engagement_metrics.get("network_mentioned"):
            self.engagement_metrics["network_mentioned"] = True
            server_delta += _SIGNAL_SCORES["network_mentioned"]
        if signals["asked_for_details"] and not self.engagement_metrics.get("asked_for_details"):
            self.engagement_metrics["asked_for_details"] = True
            server_delta += _SIGNAL_SCORES["asked_for_details"]
        if signals["positive_engagement"]:
            # Small bonus per positive response, capped at 3 times
            if self.engagement_metrics.get("positive_count", 0) < 3:
                self.engagement_metrics["positive_count"] = self.engagement_metrics.get("positive_count", 0) + 1
                server_delta += _SIGNAL_SCORES["positive_engagement"]
        if signals["wants_to_think"] and not self.engagement_metrics.get("wants_to_think"):
            self.engagement_metrics["wants_to_think"] = True
            server_delta += _SIGNAL_SCORES["wants_to_think"]
        if signals["negative_response"] and not self.engagement_metrics.get("negative_response"):
            self.engagement_metrics["negative_response"] = True
            server_delta += _SIGNAL_SCORES["negative_response"]
        if signals["objection_raised"]:
            self.engagement_metrics["objections_raised"] = self.engagement_metrics.get("objections_raised", 0) + 1
            # Only penalise up to 3 objections
            if self.engagement_metrics["objections_raised"] <= 3:
                server_delta += _SIGNAL_SCORES["objection_raised"]

        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })

        messages = [
            {"role": "system", "content": self.get_system_prompt(response_lang, lead_data.get("name", "there"))}
        ] + self.conversation_history

        try:
            completion = get_client().chat.completions.create(
                model=MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=350,
            )
            raw_response = completion.choices[0].message.content
        except Exception as e:
            error_msg = f"GROQ API ERROR: {type(e).__name__}: {e}"
            print(error_msg)
            traceback.print_exc()
            raw_response = json.dumps({
                "response_text": "I apologize, I'm having a technical issue. Let me try again. Could you please repeat?",
                "detected_language": detected_lang,
                "objection_detected": "none",
                "interest_signals": [],
                "qualification_update": {"score_delta": 0, "reason": "technical error"},
                "call_stage": self.call_stage,
                "end_call": False
            })

        parsed = self._parse_response(raw_response)

        # detected_language = BOT's output language (for TTS voice selection).
        # user_language = what the USER actually spoke (for STT on next turn).
        parsed["detected_language"] = response_lang
        parsed["user_language"] = detected_lang

        self.conversation_history.append({
            "role": "assistant",
            "content": parsed.get("response_text", raw_response)
        })

        # Update objection tracking from LLM
        if parsed.get("objection_detected") and parsed["objection_detected"] != "none":
            objection = parsed["objection_detected"]
            if objection not in self.objection_tracking:
                self.objection_tracking.append(objection)

        # ── Blend server-side delta with LLM delta ────────────────────────────
        # LLM delta is capped at ±10 per turn to prevent the model from
        # self-awarding big jumps. Server-side signals are authoritative.
        llm_delta = parsed.get("qualification_update", {}).get("score_delta", 0)
        llm_delta = max(-10, min(10, int(llm_delta)))  # clamp LLM contribution

        total_delta = server_delta + llm_delta
        self.score = max(0, min(100, self.score + total_delta))
        self.call_stage = parsed.get("call_stage", self.call_stage)

        parsed["current_score"] = self.score
        parsed["objections_raised"] = self.objection_tracking
        parsed["score_signals"] = signals   # expose for debugging
        return parsed

    def _parse_response(self, raw: str) -> dict:
        # Find start of JSON block (even if truncated — no closing brace)
        # This ensures pre_json_text is always the spoken prose, not the raw dump.
        json_start_match = re.search(r'```json|\{\s*"response_text"', raw)
        pre_json_text = raw[:json_start_match.start()].strip() if json_start_match else ""

        # Known placeholder phrases the small model copies from the template
        _PLACEHOLDERS = {
            "spoken words only",
            "no markdown",
            "no bullet points",
            "your spoken response",
            "<your response",
        }

        try:
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```', raw)
            if json_match:
                data = json.loads(json_match.group(1))
            else:
                bare_match2 = re.search(r'\{[\s\S]*"response_text"[\s\S]*\}', raw)
                data = json.loads(bare_match2.group(0)) if bare_match2 else None

            if data:
                rt = data.get("response_text", "").strip()
                # If the model put a placeholder or left it empty, use the pre-JSON prose
                if not rt or any(ph in rt.lower() for ph in _PLACEHOLDERS):
                    data["response_text"] = pre_json_text or raw.strip()
                return data
        except Exception:
            pass

        # Fallback: treat the whole response (or pre-json text) as spoken
        spoken = pre_json_text or raw.strip()
        return {
            "response_text": spoken,
            "detected_language": self.detected_language,
            "objection_detected": "none",
            "interest_signals": [],
            "qualification_update": {"score_delta": 0, "reason": ""},
            "call_stage": self.call_stage,
            "end_call": False
        }

    def get_opening_message(self, lead_name: str, predicted_language: str) -> dict:
        lang = predicted_language if predicted_language in OPENING_SCRIPTS else "hinglish"
        self.preferred_language = lang
        self.detected_language  = lang
        variants = OPENING_SCRIPTS[lang]
        text = random.choice(variants).format(name=lead_name)
        return {
            "response_text": text,
            "detected_language": lang,
            "objection_detected": "none",
            "interest_signals": [],
            "qualification_update": {"score_delta": 0, "reason": "call opened"},
            "call_stage": "opening",
            "end_call": False,
            "current_score": 0,
            "objections_raised": []
        }

    def calculate_final_score(self) -> dict:
        classification = "Cold"
        if self.score >= 70:
            classification = "Hot"
        elif self.score >= 40:
            classification = "Warm"
        return {
            "score": self.score,
            "classification": classification,
            "objections_raised": self.objection_tracking,
            "language_used": self.detected_language,
        }
