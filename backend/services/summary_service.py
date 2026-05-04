import os
import json
from datetime import datetime
from groq import Groq

MODEL = "llama-3.1-8b-instant"
_client = None


def get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client


def generate_summary(
    conversation_history: list,
    lead_data: dict,
    final_score: int,
    classification: str,
    start_time: str,
    end_time: str,
) -> dict:
    transcript_text = "\n".join(
        f"{'Lead' if m.get('role') == 'user' else 'Agent'}: {m.get('content', '')}"
        for m in conversation_history
    )

    try:
        start_dt = datetime.fromisoformat(start_time)
        end_dt = datetime.fromisoformat(end_time)
        duration_minutes = round((end_dt - start_dt).total_seconds() / 60, 1)
    except Exception:
        duration_minutes = 0.0

    prompt = f"""You are a CRM assistant. Analyze this sales call and return ONLY a JSON object.

Lead: {lead_data.get('name', 'Unknown')} | Phone: {lead_data.get('phone', 'Unknown')} | Source: {lead_data.get('source', 'Unknown')}
Score: {final_score}/100 | Classification: {classification} | Duration: {duration_minutes} min

Transcript:
{transcript_text}

Return this JSON (fill every field with real values from the transcript — no placeholders):
{{
  "lead_name": "{lead_data.get('name', 'Unknown')}",
  "lead_phone": "{lead_data.get('phone', 'Unknown')}",
  "call_duration_minutes": {duration_minutes},
  "language_used": "actual language detected e.g. english/hinglish/tamil",
  "objections_raised": ["objection 1", "objection 2"],
  "objections_resolved": ["resolved objection 1"],
  "interest_score": {final_score},
  "classification": "{classification}",
  "key_discussion_points": ["point 1 from call", "point 2 from call", "point 3 from call"],
  "recommended_action": "Transfer to RM immediately",
  "rm_handoff_context": "2-3 sentences: who the lead is, what interested them, what concerns they raised, next step.",
  "whatsapp_message": "Hi {lead_data.get('name', 'there')}, thanks for chatting with Rupeezy! Here are your partner program details: [LINK]"
}}

ONLY return the JSON. No explanation."""

    try:
        completion = get_client().chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1000,
        )
        raw = completion.choices[0].message.content.strip()
        # Strip code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        summary = json.loads(raw.strip())
        summary["timestamp"] = datetime.utcnow().isoformat()
        return summary
    except Exception as e:
        # Build a meaningful fallback by mining the conversation history directly
        lead_msgs = [
            m.get("content", "").strip()
            for m in conversation_history
            if m.get("role") == "user" and m.get("content", "").strip()
        ]
        agent_msgs = [
            m.get("content", "").strip()
            for m in conversation_history
            if m.get("role") == "assistant" and m.get("content", "").strip()
        ]

        # Extract a few key discussion points from what the lead actually said
        key_points = []
        for msg in lead_msgs:
            # Keep non-trivial lead utterances as discussion points (skip very short ones)
            if len(msg) > 15:
                key_points.append(msg[:120])
        if not key_points:
            key_points = ["Lead engaged with agent during call"]
        key_points = key_points[:5]  # cap at 5

        name = lead_data.get('name', 'Unknown')
        rm_context = (
            f"Lead {name} ({lead_data.get('phone', '')}) completed a {duration_minutes}-minute call. "
            f"Interest score: {final_score}/100. Classification: {classification}. "
            f"Language used: {lead_data.get('language_hint', 'hinglish')}. "
        )
        if lead_msgs:
            rm_context += f"Lead's last message: '{lead_msgs[-1][:200]}'. "
        rm_context += (
            "Follow up promptly — lead showed strong interest in the Rupeezy partner program."
            if final_score >= 70 else
            "Lead showed some interest; a follow-up call or WhatsApp message is recommended."
            if final_score >= 40 else
            "Lead was not ready at this time; schedule re-engagement in 30 days."
        )

        return {
            "lead_name": name,
            "lead_phone": lead_data.get("phone", "Unknown"),
            "call_duration_minutes": duration_minutes,
            "language_used": lead_data.get("language_hint", "hinglish"),
            "objections_raised": [],
            "objections_resolved": [],
            "interest_score": final_score,
            "classification": classification,
            "key_discussion_points": key_points,
            "recommended_action": (
                "Transfer to RM immediately" if classification == "Hot"
                else "Send WhatsApp follow-up link" if classification == "Warm"
                else "Log for re-engagement in 30 days"
            ),
            "rm_handoff_context": rm_context,
            "whatsapp_message": (
                f"Hi {name}, thank you for speaking with us at Rupeezy! "
                f"Here are the details about our partner program: [LINK]. "
                f"Feel free to reach out for any questions."
            ),
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e),
        }
