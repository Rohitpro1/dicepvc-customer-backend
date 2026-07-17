from fastapi import APIRouter, Depends, Request

from app.core.dependencies import get_current_user
from app.domains.announcements import services

router = APIRouter(tags=["announcements"])


@router.get("/announcements")
async def list_announcements(request: Request, current_user: dict = Depends(get_current_user)):
    """Fetch global platform announcements (Cached)."""
    redis_client = request.app.state.redis
    announcements = await services.get_active_announcements(redis_client)
    return announcements


@router.get("/notifications")
async def list_notifications(current_user: dict = Depends(get_current_user)):
    """Fetch customer's in-app alerts & notifications."""
    notifications = await services.get_my_notifications(current_user["id"])
    return notifications


@router.post("/notifications/{notif_id}/read")
async def read_notification(notif_id: str, current_user: dict = Depends(get_current_user)):
    """Mark in-app notification alert as read."""
    await services.mark_notification_read(current_user["id"], notif_id)
    return {"ok": True}


@router.get("/notifications/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Fetch total count of unread in-app alerts."""
    count = await services.get_unread_notifications_count(current_user["id"])
    return {"unread_count": count}


@router.post("/notifications/mark-all-read")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    """Mark all in-app notifications as read."""
    await services.mark_all_notifications_read(current_user["id"])
    return {"ok": True}
