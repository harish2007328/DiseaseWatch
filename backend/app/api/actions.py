"""Action API routes."""
from fastapi import APIRouter, HTTPException
from app.models.schemas import ActionCreate, ActionUpdate
from app.services.db_sync import (
    get_actions_sync,
    create_action_sync,
    update_action_sync,
)

router = APIRouter(prefix="/api/actions", tags=["Actions"])


@router.get("")
async def get_actions(camp_id: str = None, status: str = None):
    """Get actions from Supabase PostgreSQL, optionally filtered."""
    return get_actions_sync(camp_id=camp_id, status=status)


@router.post("")
async def create_action(action: ActionCreate):
    """Create and assign a new action directly to Supabase and cache."""
    action_data = {
        "camp_id": action.camp_id,
        "alert_id": action.alert_id,
        "title": action.title,
        "description": action.description,
        "priority": action.priority.value,
        "instructions": action.instructions,
        "deadline": action.deadline,
    }

    created = create_action_sync(action_data)
    return created


@router.patch("/{action_id}")
async def update_action(action_id: str, update: ActionUpdate):
    """Update action status in Supabase database."""
    result = update_action_sync(action_id, update.status.value)
    if not result:
        raise HTTPException(status_code=404, detail="Action not found")
    return result
