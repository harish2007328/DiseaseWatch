"""Alert API routes."""
from fastapi import APIRouter, HTTPException
from app.models.schemas import AlertVerifyRequest
from app.services.db_sync import (
    get_alerts_sync,
    verify_alert_sync,
)

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("")
async def get_alerts(camp_id: str = None, status: str = None):
    """Get alerts from Supabase database, optionally filtered."""
    return get_alerts_sync(camp_id=camp_id, status=status)


@router.get("/{alert_id}")
async def get_alert(alert_id: str):
    """Get a specific alert."""
    alerts = get_alerts_sync()
    alert = next((a for a in alerts if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.patch("/{alert_id}/verify")
async def verify_alert(alert_id: str, request: AlertVerifyRequest):
    """Verify or reject an alert in Supabase."""
    result = verify_alert_sync(alert_id, request.action)
    if not result:
        raise HTTPException(status_code=404, detail="Alert not found")
    return result


@router.patch("/{alert_id}/reject")
async def reject_alert(alert_id: str):
    """Reject an alert in Supabase."""
    result = verify_alert_sync(alert_id, "reject")
    if not result:
        raise HTTPException(status_code=404, detail="Alert not found")
    return result
