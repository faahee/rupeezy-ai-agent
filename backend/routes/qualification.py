from fastapi import APIRouter, HTTPException
from database import leads_db, conversations_db
from services.qualification_service import QualificationScorer

router = APIRouter()


@router.get("/score/{lead_id}")
def get_score(lead_id: str):
    lead = leads_db.get(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    score = lead.get("score", 0)
    classification = QualificationScorer.classify(score)
    return {
        "lead_id": lead_id,
        "score": score,
        "classification": classification,
        "recommended_action": QualificationScorer.get_recommended_action(classification),
    }


@router.post("/score/{lead_id}")
def compute_score(lead_id: str, signals: dict):
    result = QualificationScorer.score_from_conversation(signals)
    return result
