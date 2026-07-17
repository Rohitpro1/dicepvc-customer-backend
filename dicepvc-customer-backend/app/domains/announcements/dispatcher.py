import logging
from datetime import datetime, timezone
from typing import Any, Optional

from app.core.database import col
from app.workers.celery_app import celery_app
from app.models.helpers import new_id

logger = logging.getLogger("notification_dispatcher")


class NotificationDispatcher:
    @staticmethod
    async def dispatch(
        user_id: str,
        event_type: str,
        title: str,
        message: str,
        email_template: Optional[str] = None,
        context: Optional[dict[str, Any]] = None
    ) -> str:
        """Dispatches an in-app notification, triggers a Celery background email task, and logs the audit trail."""
        now = datetime.now(timezone.utc)
        notif_id = new_id("ntf")

        # 1. Create In-App Notification Record
        notif_doc = {
            "id": notif_id,
            "user_id": user_id,
            "event_type": event_type,
            "title": title,
            "message": message,
            "is_read": False,
            "is_deleted": False,
            "deleted_at": None,
            "created_at": now,
            "updated_at": now
        }
        await col("notifications").insert_one(notif_doc)
        logger.info(f"[Dispatcher] Created in-app notification {notif_id} for user {user_id}.")

        # 2. Resolve user email and trigger background transactional email
        user_doc = await col("users").find_one({"id": user_id})
        if user_doc and email_template:
            to_email = user_doc["email"]
            email_context = context or {}
            email_context["user_name"] = user_doc.get("name", "Customer")
            email_context["message"] = message

            # Enqueue to Celery background worker queue
            celery_app.send_task(
                "send_transactional_email",
                args=[to_email, title, email_template, email_context]
            )
            logger.info(f"[Dispatcher] Enqueued email delivery task for user {user_id} using template {email_template}.")

        # 3. Log notification action inside central audit logs
        await col("audit_logs").insert_one({
            "id": new_id("aud"),
            "action": "NOTIFICATION_DISPATCHED",
            "detail": f"Notification of type {event_type} dispatched to user {user_id}.",
            "actor": "system",
            "ip_address": "127.0.0.1",
            "created_at": now
        })

        return notif_id
