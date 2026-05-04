from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
import uuid


class Lead(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    language_hint: str = "hinglish"
    source: str = "Manual"
    classification: str = "Unqualified"
    score: int = 0
    status: str = "new"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class LeadCreate(BaseModel):
    name: str
    phone: str
    language_hint: str = "hinglish"
    source: str = "Manual"


class LeadStatusUpdate(BaseModel):
    status: Optional[str] = None
    classification: Optional[str] = None
    score: Optional[int] = None
