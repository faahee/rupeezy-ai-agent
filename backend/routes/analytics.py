from fastapi import APIRouter
from database import leads_db, conversations_db

router = APIRouter()


@router.get("/funnel")
def get_funnel():
    leads = list(leads_db.values())
    total = len(leads)
    contacted = sum(1 for l in leads if l.get("status") in ("in_progress", "completed"))
    qualified = sum(1 for l in leads if l.get("classification") in ("Hot", "Warm", "Cold") and l.get("status") == "completed")
    hot = sum(1 for l in leads if l.get("classification") == "Hot")
    warm = sum(1 for l in leads if l.get("classification") == "Warm")
    cold = sum(1 for l in leads if l.get("classification") == "Cold")
    conversion_rate = round((hot / total * 100) if total > 0 else 0, 1)

    return {
        "total": total,
        "contacted": contacted,
        "qualified": qualified,
        "hot": hot,
        "warm": warm,
        "cold": cold,
        "conversion_rate": conversion_rate,
    }


@router.get("/summary")
def get_summary():
    leads = list(leads_db.values())
    total = len(leads)
    hot = sum(1 for l in leads if l.get("classification") == "Hot")
    warm = sum(1 for l in leads if l.get("classification") == "Warm")
    cold = sum(1 for l in leads if l.get("classification") == "Cold")
    avg_score = round(sum(l.get("score", 0) for l in leads) / total, 1) if total > 0 else 0
    return {
        "total_leads": total,
        "hot_leads": hot,
        "warm_leads": warm,
        "cold_leads": cold,
        "average_score": avg_score,
        "conversion_rate": round((hot / total * 100) if total > 0 else 0, 1),
    }


@router.get("/leads/recent")
def get_recent_leads():
    leads = list(leads_db.values())
    leads.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    return leads[:10]
