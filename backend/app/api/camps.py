"""Camp API routes."""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.services.db_sync import get_camps_sync
from app.services.demo_data import demo_store

router = APIRouter(prefix="/api/camps", tags=["Camps"])


@router.get("")
async def get_camps():
    """Get all camps with enriched data from Supabase."""
    return get_camps_sync()


@router.get("/{camp_id}")
async def get_camp(camp_id: str):
    """Get detailed camp information."""
    # First search Supabase camps
    camps = get_camps_sync()
    found = next((c for c in camps if c["id"] == camp_id), None)
    if found:
        return found
    detail = demo_store.get_camp_detail(camp_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Camp not found")
    return detail
