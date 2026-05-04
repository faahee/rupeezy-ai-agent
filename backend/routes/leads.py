from fastapi import APIRouter, HTTPException
from datetime import datetime
import uuid

from database import leads_db
from models.lead import LeadCreate, LeadStatusUpdate

router = APIRouter()


@router.post("")
def create_lead(lead: LeadCreate):
    lead_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    doc = {
        "id": lead_id,
        "name": lead.name,
        "phone": lead.phone,
        "language_hint": lead.language_hint,
        "source": lead.source,
        "classification": "Unqualified",
        "score": 0,
        "status": "new",
        "created_at": now,
        "updated_at": now,
    }
    leads_db[lead_id] = doc
    return doc


@router.get("")
def get_leads(classification: str = None, status: str = None):
    leads = list(leads_db.values())
    if classification:
        leads = [l for l in leads if l.get("classification") == classification]
    if status:
        leads = [l for l in leads if l.get("status") == status]
    leads.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    return leads


@router.get("/{lead_id}")
def get_lead(lead_id: str):
    lead = leads_db.get(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.put("/{lead_id}/status")
def update_lead_status(lead_id: str, update: LeadStatusUpdate):
    lead = leads_db.get(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if update.status is not None:
        lead["status"] = update.status
    if update.classification is not None:
        lead["classification"] = update.classification
    if update.score is not None:
        lead["score"] = update.score
    lead["updated_at"] = datetime.utcnow().isoformat()
    leads_db[lead_id] = lead
    return lead
