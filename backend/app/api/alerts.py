"""Alert API routes."""
from fastapi import APIRouter, HTTPException
from app.models.schemas import AlertVerifyRequest
from app.services.demo_data import demo_store

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("")
async def get_alerts(camp_id: str = None, status: str = None):
    """Get alerts, optionally filtered by camp or status."""
    if camp_id:
        alerts = demo_store.get_camp_alerts(camp_id)
    else:
        alerts = demo_store.alerts

    if status:
        alerts = [a for a in alerts if a["status"] == status]

    # Enrich with camp names
    result = []
    for a in sorted(alerts, key=lambda x: x["created_at"], reverse=True):
        camp = demo_store.get_camp(a["camp_id"])
        result.append({**a, "camp_name": camp["name"] if camp else "Unknown"})
    return result


@router.get("/{alert_id}")
async def get_alert(alert_id: str):
    """Get a specific alert."""
    alert = next((a for a in demo_store.alerts if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    camp = demo_store.get_camp(alert["camp_id"])
    return {**alert, "camp_name": camp["name"] if camp else "Unknown"}


@router.patch("/{alert_id}/verify")
async def verify_alert(alert_id: str, request: AlertVerifyRequest):
    """Verify or reject an alert."""
    result = demo_store.verify_alert(alert_id, request.action)
    if not result:
        raise HTTPException(status_code=404, detail="Alert not found")
    return result


@router.patch("/{alert_id}/reject")
async def reject_alert(alert_id: str):
    """Reject an alert."""
    result = demo_store.verify_alert(alert_id, "reject")
    if not result:
        raise HTTPException(status_code=404, detail="Alert not found")
    return result
