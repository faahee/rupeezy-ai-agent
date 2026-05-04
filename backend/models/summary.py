from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class CallSummary(BaseModel):
    lead_name: str
    lead_phone: str
    call_duration_minutes: float
    language_used: str
    objections_raised: List[str] = []
    objections_resolved: List[str] = []
    interest_score: int
    classification: str
    key_discussion_points: List[str] = []
    recommended_action: str
    rm_handoff_context: str
    whatsapp_message: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
