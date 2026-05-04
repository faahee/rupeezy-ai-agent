from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
import uuid


class Message(BaseModel):
    model_config = ConfigDict(extra="allow")

    role: str
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    detected_language: Optional[str] = None
    objection_detected: Optional[str] = None
    interest_signals: List[str] = []
    call_stage: Optional[str] = None
    qualification_score: Optional[int] = None


class Conversation(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lead_id: str
    messages: List[Message] = []
    current_score: int = 0
    detected_language: str = "hinglish"
    call_stage: str = "opening"
    start_time: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    end_time: Optional[str] = None
    is_active: bool = True
    objections_raised: List[str] = []
    objections_resolved: List[str] = []


class MessageInput(BaseModel):
    message: str
