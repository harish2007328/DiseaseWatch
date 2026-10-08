"""Action API routes."""
from fastapi import APIRouter, HTTPException
from app.models.schemas import ActionCreate, ActionUpdate
from app.services.demo_data import demo_store

router = APIRouter(prefix="/api/actions", tags=["Actions"])


@router.get("")
async def get_actions(camp_id: str = None, status: str = None):
    """Get actions, optionally filtered."""
    if camp_id:
        actions = demo_store.get_camp_actions(camp_id)
    else:
        actions = demo_store.actions

    if status:
        actions = [a for a in actions if a["status"] == status]

    result = []
    for a in sorted(actions, key=lambda x: x["assigned_at"], reverse=True):
        camp = demo_store.get_camp(a["camp_id"])
        result.append({**a, "camp_name": camp["name"] if camp else "Unknown"})
    return result


@router.post("")
async def create_action(action: ActionCreate):
    """Create and assign a new action to a camp."""
    camp = demo_store.get_camp(action.camp_id)
    if not camp:
        raise HTTPException(status_code=404, detail="Camp not found")

    action_data = {
        "camp_id": action.camp_id,
        "alert_id": action.alert_id,
        "title": action.title,
        "description": action.description,
        "priority": action.priority.value,
        "instructions": action.instructions,
        "deadline": action.deadline,
    }

    created = demo_store.add_action(action_data)
    return {**created, "camp_name": camp["name"]}


@router.patch("/{action_id}")
async def update_action(action_id: str, update: ActionUpdate):
    """Update action status."""
    result = demo_store.update_action(action_id, update.status.value)
    if not result:
        raise HTTPException(status_code=404, detail="Action not found")
    camp = demo_store.get_camp(result["camp_id"])
    return {**result, "camp_name": camp["name"] if camp else "Unknown"}
