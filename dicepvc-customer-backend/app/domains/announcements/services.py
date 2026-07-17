import json
from datetime import datetime, timezone
from typing import Any, Optional
from redis.asyncio import Redis

from app.core.database import col
from app.core.exceptions import NotFoundException
from app.models.helpers import serialize_many, new_id


async def get_active_announcements(redis_client: Redis) -> list[dict]:
    """Retrieve platform announcements, optimized using a 15-minute Redis cache."""
    cache_key = "announcements:active"
    
    # Check cache
    cached = await redis_client.get(cache_key)
    if cached:
        try:
            return json.loads(cached)
        except Exception:
            pass

    # Fetch from Mongo on cache miss
    cursor = col("announcements").find({"is_deleted": {"$ne": True}}).sort("created_at", -1)
    announcements = await cursor.to_list(None)

    serialized = serialize_many(announcements)
    
    # Save cache (900s TTL)
    await redis_client.set(cache_key, json.dumps(serialized), ex=900)
    return serialized


async def get_my_notifications(user_id: str) -> list[dict]:
    """Fetch user's in-app notifications."""
    cursor = col("notifications").find({"user_id": user_id, "is_deleted": {"$ne": True}}).sort("created_at", -1)
    notifications = await cursor.to_list(None)
    return serialize_many(notifications)


async def mark_notification_read(user_id: str, notif_id: str) -> bool:
    """Consumes notification ID to mark alert as read."""
    notif = await col("notifications").find_one({"id": notif_id, "user_id": user_id})
    if not notif:
        raise NotFoundException("Notification not found.")

    await col("notifications").update_one(
        {"id": notif_id},
        {"$set": {"is_read": True, "updated_at": datetime.now(timezone.utc)}}
    )
    return True


async def get_unread_notifications_count(user_id: str) -> int:
    """Count currently unread in-app alerts for user."""
    count = await col("notifications").count_documents({
        "user_id": user_id,
        "is_read": False,
        "is_deleted": {"$ne": True}
    })
    return count


async def mark_all_notifications_read(user_id: str) -> bool:
    """Marks all notifications as read for the user."""
    await col("notifications").update_many(
        {"user_id": user_id, "is_read": False, "is_deleted": {"$ne": True}},
        {"$set": {"is_read": True, "updated_at": datetime.now(timezone.utc)}}
    )
    return True
