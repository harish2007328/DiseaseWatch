"""Camp API routes."""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.services.db_sync import (
    get_camps_sync,
    get_camp_uuid,
    get_health_reports_sync,
    get_env_reports_sync,
    get_alerts_sync,
    get_actions_sync,
    _is_uuid,
)
from app.services.demo_data import demo_store

router = APIRouter(prefix="/api/camps", tags=["Camps"])


@router.get("")
async def get_camps():
    """Get all camps with enriched data from Supabase."""
    return get_camps_sync()


@router.get("/{camp_id}")
async def get_camp(camp_id: str):
    """Get detailed camp information."""
    camps = get_camps_sync()
    resolved_id = get_camp_uuid(camp_id) if not _is_uuid(camp_id) else camp_id
    found = next((c for c in camps if c["id"] == camp_id or c["id"] == resolved_id), None)
    
    if found:
        target_id = found["id"]
        h_reports = get_health_reports_sync(target_id)
        e_reports = get_env_reports_sync(target_id)
        alerts = get_alerts_sync(target_id)
        actions = get_actions_sync(target_id)

        total_cases = sum(int(r.get("case_count", 0)) for r in h_reports)
        active_cases = sum(int(r.get("case_count", 0)) for r in h_reports[-3:]) if h_reports else 0

        symptoms_dist = {}
        for r in h_reports:
            for sym, val in (r.get("symptoms") or {}).items():
                if val and sym != "other":
                    symptoms_dist[sym] = symptoms_dist.get(sym, 0) + int(r.get("case_count", 1))

        return {
            **found,
            "total_cases": total_cases,
            "active_cases": active_cases,
            "health_reports": h_reports,
            "environmental_reports": e_reports,
            "alerts": alerts,
            "actions": actions,
            "symptoms_distribution": symptoms_dist,
        }

    detail = demo_store.get_camp_detail(camp_id)
    if not detail and camps:
        return camps[0]
    if not detail:
        raise HTTPException(status_code=404, detail="Camp not found")
    return detail
