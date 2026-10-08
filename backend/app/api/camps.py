"""Camp API routes."""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.services.demo_data import demo_store

router = APIRouter(prefix="/api/camps", tags=["Camps"])


@router.get("")
async def get_camps():
    """Get all camps with enriched data."""
    return demo_store.get_all_camps_enriched()


@router.get("/{camp_id}")
async def get_camp(camp_id: str):
    """Get detailed camp information."""
    detail = demo_store.get_camp_detail(camp_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Camp not found")
    return detail
