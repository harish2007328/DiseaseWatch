"""Notification and Dashboard API routes."""
from fastapi import APIRouter, HTTPException
from app.services.demo_data import demo_store, USER_IDS

router = APIRouter(tags=["Dashboard & Notifications"])


@router.get("/api/dashboard/summary")
async def get_dashboard_summary():
    """Get admin dashboard summary with KPIs."""
    return demo_store.get_dashboard_summary()


@router.get("/api/notifications")
async def get_notifications(camp_id: str = None, role: str = "admin"):
    """Get notifications for a user/camp."""
    if camp_id:
        return demo_store.get_camp_notifications(camp_id)
    elif role == "admin":
        return demo_store.get_admin_notifications()
    else:
        return []


@router.patch("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark a notification as read."""
    result = demo_store.mark_notification_read(notification_id)
    if not result:
        raise HTTPException(status_code=404, detail="Notification not found")
    return result
