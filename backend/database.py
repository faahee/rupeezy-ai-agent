"""
In-memory database fallback. Populated with seed data on startup.
"""
from datetime import datetime
import uuid

# In-memory stores
leads_db: dict = {}
conversations_db: dict = {}
summaries_db: dict = {}

SEED_LEADS = [
    {
        "id": str(uuid.uuid4()),
        "name": "Rajesh Kumar",
        "phone": "9876543210",
        "language_hint": "hindi",
        "source": "Instagram Campaign",
        "classification": "Hot",
        "score": 78,
        "status": "completed",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Ana Sharma",
        "phone": "9845678901",
        "language_hint": "hinglish",
        "source": "Referral",
        "classification": "Warm",
        "score": 52,
        "status": "completed",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Amit Patel",
        "phone": "9823456789",
        "language_hint": "english",
        "source": "Website Form",
        "classification": "Cold",
        "score": 22,
        "status": "completed",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Sunita Devi",
        "phone": "9812345678",
        "language_hint": "hindi",
        "source": "Facebook Ad",
        "classification": "Warm",
        "score": 61,
        "status": "completed",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Vikram Singh",
        "phone": "9801234567",
        "language_hint": "hinglish",
        "source": "WhatsApp Campaign",
        "classification": "Hot",
        "score": 82,
        "status": "completed",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    },
]

def seed():
    for lead in SEED_LEADS:
        leads_db[lead["id"]] = lead

seed()
