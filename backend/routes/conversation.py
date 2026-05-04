from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import Dict
import uuid

from database import leads_db, conversations_db, summaries_db
from models.conversation import MessageInput
from services.llm_service import ConversationManager
from services.summary_service import generate_summary
from services.qualification_service import QualificationScorer

router = APIRouter()

# Active conversation managers keyed by lead_id
active_managers: Dict[str, ConversationManager] = {}


@router.post("/start/{lead_id}")
def start_conversation(lead_id: str):
    lead = leads_db.get(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    manager = ConversationManager(lead_id)
    active_managers[lead_id] = manager

    conv_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    opening = manager.get_opening_message(lead["name"], lead.get("language_hint", "hinglish"))

    conversation = {
        "id": conv_id,
        "lead_id": lead_id,
        "messages": [
            {
                "role": "assistant",
                "content": opening["response_text"],
                "timestamp": now,
                "detected_language": opening["detected_language"],
                "call_stage": "opening",
            }
        ],
        "current_score": 0,
        "detected_language": opening["detected_language"],
        "call_stage": "opening",
        "start_time": now,
        "end_time": None,
        "is_active": True,
        "objections_raised": [],
    }
    conversations_db[lead_id] = conversation

    lead["status"] = "in_progress"
    lead["updated_at"] = now
    leads_db[lead_id] = lead

    return {
        "conversation_id": conv_id,
        "opening_message": opening,
    }


@router.post("/message/{lead_id}")
def send_message(lead_id: str, body: MessageInput):
    lead = leads_db.get(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    conversation = conversations_db.get(lead_id)
    if not conversation or not conversation.get("is_active"):
        raise HTTPException(status_code=400, detail="No active conversation for this lead")

    manager = active_managers.get(lead_id)
    if not manager:
        # Re-create manager and replay history
        manager = ConversationManager(lead_id)
        for msg in conversation.get("messages", []):
            manager.conversation_history.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        active_managers[lead_id] = manager

    now = datetime.utcnow().isoformat()

    # Add user message to conversation
    conversation["messages"].append({
        "role": "user",
        "content": body.message,
        "timestamp": now,
        "detected_language": manager.detected_language,
        "call_stage": manager.call_stage,
    })

    response = manager.process_message(body.message, lead)

    # Add assistant message to conversation
    conversation["messages"].append({
        "role": "assistant",
        "content": response["response_text"],
        "timestamp": datetime.utcnow().isoformat(),
        "detected_language": response.get("detected_language", manager.detected_language),
        "objection_detected": response.get("objection_detected", "none"),
        "interest_signals": response.get("interest_signals", []),
        "call_stage": response.get("call_stage", manager.call_stage),
        "qualification_score": response.get("current_score", 0),
    })

    conversation["current_score"] = response.get("current_score", 0)
    conversation["detected_language"] = response.get("detected_language", manager.detected_language)
    conversation["call_stage"] = response.get("call_stage", manager.call_stage)
    conversation["objections_raised"] = response.get("objections_raised", [])
    conversations_db[lead_id] = conversation

    # Update lead score live
    lead["score"] = response.get("current_score", 0)
    classification = QualificationScorer.classify(lead["score"])
    lead["classification"] = classification
    lead["updated_at"] = datetime.utcnow().isoformat()
    leads_db[lead_id] = lead

    return response


@router.post("/end/{lead_id}")
def end_conversation(lead_id: str):
    lead = leads_db.get(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    conversation = conversations_db.get(lead_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    now = datetime.utcnow().isoformat()
    conversation["end_time"] = now
    conversation["is_active"] = False

    manager = active_managers.get(lead_id)
    final_score = conversation.get("current_score", 0)
    classification = QualificationScorer.classify(final_score)

    summary = generate_summary(
        conversation_history=conversation.get("messages", []),
        lead_data=lead,
        final_score=final_score,
        classification=classification,
        start_time=conversation.get("start_time", now),
        end_time=now,
    )

    summaries_db[lead_id] = summary
    conversations_db[lead_id] = conversation

    lead["status"] = "completed"
    lead["classification"] = classification
    lead["score"] = final_score
    lead["updated_at"] = now
    leads_db[lead_id] = lead

    if lead_id in active_managers:
        del active_managers[lead_id]

    return {
        "message": "Conversation ended",
        "final_score": final_score,
        "classification": classification,
        "summary": summary,
    }


@router.get("/history/{lead_id}")
def get_history(lead_id: str):
    conversation = conversations_db.get(lead_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="No conversation found for this lead")
    return conversation


@router.get("/summary/{lead_id}")
def get_summary(lead_id: str):
    summary = summaries_db.get(lead_id)
    if not summary:
        raise HTTPException(status_code=404, detail="No summary found")
    return summary
