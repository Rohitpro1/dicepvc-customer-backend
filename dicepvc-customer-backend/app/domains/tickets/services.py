import re
from datetime import datetime, timezone
from typing import Any, Optional

from app.core.database import col
from app.core.exceptions import BaseAppException, NotFoundException, ForbiddenException
from app.domains.tickets.schemas import TicketCreateInput, TicketMessageCreateInput
from app.models.helpers import new_id, serialize_many


async def create_ticket(user_id: str, author_name: str, payload: TicketCreateInput) -> dict:
    """Customers open a new support ticket thread, logging initial message and optional attachments."""
    now = datetime.now(timezone.utc)
    ticket_id = new_id("tkt")
    
    # 1. Save Ticket
    ticket_doc = {
        "id": ticket_id,
        "user_id": user_id,
        "assigned_to": None,
        "title": payload.title,
        "status": "open",
        "priority": payload.priority,
        "is_deleted": False,
        "deleted_at": None,
        "created_at": now,
        "updated_at": now,
        "created_by": user_id,
        "updated_by": user_id
    }
    await col("support_tickets").insert_one(ticket_doc)

    # 2. Save Initial Message
    attachments_dict = [a.model_dump() for a in payload.attachments] if payload.attachments else []
    
    msg_doc = {
        "id": new_id("tmsg"),
        "ticket_id": ticket_id,
        "author_id": user_id,
        "author_name": author_name,
        "author_role": "customer",
        "content": payload.description,
        "attachments": attachments_dict,
        "created_at": now
    }
    await col("ticket_messages").insert_one(msg_doc)

    # 3. Audit Log
    await col("audit_logs").insert_one({
        "id": new_id("aud"),
        "action": "TICKET_CREATED",
        "detail": f"Support ticket #{ticket_id} created by user {user_id}",
        "actor": user_id,
        "ip_address": "127.0.0.1",
        "created_at": now
    })

    return {
        "id": ticket_id,
        "user_id": user_id,
        "assigned_to": None,
        "title": payload.title,
        "status": "open",
        "priority": payload.priority,
        "messages": [{
            "id": msg_doc["id"],
            "ticket_id": ticket_id,
            "author_id": user_id,
            "author_name": author_name,
            "author_role": "customer",
            "content": payload.description,
            "attachments": attachments_dict,
            "created_at": now.isoformat()
        }],
        "created_at": now.isoformat()
    }


async def list_tickets(
    user_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    assigned_to: Optional[str] = None,
    search_query: Optional[str] = None,
    page: int = 1,
    limit: int = 20
) -> dict:
    """Lists support tickets with paginated searching, filtering, and role-based scoping."""
    query = {"is_deleted": {"$ne": True}}
    
    if user_id:
        query["user_id"] = user_id
    if status_filter:
        query["status"] = status_filter
    if priority_filter:
        query["priority"] = priority_filter
    if assigned_to:
        query["assigned_to"] = assigned_to

    if search_query:
        regex = re.compile(f".*{re.escape(search_query.strip())}.*", re.IGNORECASE)
        query["title"] = {"$regex": regex}

    total = await col("support_tickets").count_documents(query)
    skip = (page - 1) * limit
    cursor = col("support_tickets").find(query).sort("created_at", -1).skip(skip).limit(limit)
    tickets_docs = await cursor.to_list(limit)

    results = []
    for t in tickets_docs:
        t["created_at"] = t["created_at"].isoformat() if isinstance(t["created_at"], datetime) else str(t["created_at"])
        results.append(t)

    return {
        "results": serialize_many(results),
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


async def get_ticket_thread(ticket_id: str, user_id: str, role: str) -> dict:
    """Fetches full message thread history for a ticket, with RBAC validations."""
    ticket = await col("support_tickets").find_one({"id": ticket_id, "is_deleted": {"$ne": True}})
    if not ticket:
        raise NotFoundException("Support ticket not found.")

    # Guard: customer cannot access other customer's tickets
    if role not in ("admin", "support", "super_admin") and ticket["user_id"] != user_id:
        raise ForbiddenException("Access to support ticket forbidden.")

    # Load messages
    msg_cursor = col("ticket_messages").find({"ticket_id": ticket_id}).sort("created_at", 1)
    messages = []
    async for m in msg_cursor:
        m["created_at"] = m["created_at"].isoformat() if isinstance(m["created_at"], datetime) else str(m["created_at"])
        messages.append(m)

    return {
        "id": ticket_id,
        "user_id": ticket["user_id"],
        "assigned_to": ticket.get("assigned_to"),
        "title": ticket["title"],
        "status": ticket["status"],
        "priority": ticket["priority"],
        "messages": messages,
        "created_at": ticket["created_at"].isoformat() if isinstance(ticket["created_at"], datetime) else str(ticket["created_at"])
    }


async def post_ticket_message(
    ticket_id: str,
    user_id: str,
    author_name: str,
    role: str,
    payload: TicketMessageCreateInput
) -> dict:
    """Appends replies to support threads and triggers email notifications."""
    ticket = await col("support_tickets").find_one({"id": ticket_id, "is_deleted": {"$ne": True}})
    if not ticket:
        raise NotFoundException("Support ticket not found.")

    if role not in ("admin", "support", "super_admin") and ticket["user_id"] != user_id:
        raise ForbiddenException("Access to support ticket forbidden.")

    now = datetime.now(timezone.utc)
    attachments_dict = [a.model_dump() for a in payload.attachments] if payload.attachments else []

    # 1. Update ticket timestamp and set status to open if closed
    await col("support_tickets").update_one(
        {"id": ticket_id},
        {"$set": {"updated_at": now, "status": "open" if ticket["status"] == "closed" else ticket["status"]}}
    )

    # 2. Insert Message
    msg_id = new_id("tmsg")
    msg_doc = {
        "id": msg_id,
        "ticket_id": ticket_id,
        "author_id": user_id,
        "author_name": author_name,
        "author_role": role,
        "content": payload.content,
        "attachments": attachments_dict,
        "created_at": now
    }
    await col("ticket_messages").insert_one(msg_doc)

    # 3. Notify other party
    if role in ("admin", "support", "super_admin"):
        # Alert Customer
        customer_user = await col("users").find_one({"id": ticket["user_id"]})
        if customer_user:
            from app.workers.celery_app import celery_app
            from app.core.config import settings
            celery_app.send_task(
                "send_transactional_email",
                args=[
                    customer_user["email"],
                    f"Update on Support Ticket #{ticket_id}",
                    "support_update.html",
                    {
                        "ticket_id": ticket_id,
                        "message_preview": payload.content[:100] + ("..." if len(payload.content) > 100 else ""),
                        "author_name": author_name,
                        "ticket_url": f"{settings.DASHBOARD_URL}/support/{ticket_id}"
                    }
                ]
            )

    # 4. Audit Log
    await col("audit_logs").insert_one({
        "id": new_id("aud"),
        "action": "TICKET_REPLIED",
        "detail": f"Reply added to ticket #{ticket_id} by {author_name} ({role})",
        "actor": user_id,
        "ip_address": "127.0.0.1",
        "created_at": now
    })

    msg_doc["created_at"] = now.isoformat()
    return msg_doc


async def assign_ticket(ticket_id: str, assignee_id: str, actor_id: str) -> bool:
    """Assigns support ticket to a designated support agent."""
    ticket = await col("support_tickets").find_one({"id": ticket_id, "is_deleted": {"$ne": True}})
    if not ticket:
        raise NotFoundException("Support ticket not found.")

    now = datetime.now(timezone.utc)
    await col("support_tickets").update_one(
        {"id": ticket_id},
        {"$set": {"assigned_to": assignee_id, "updated_at": now}}
    )

    # In-App notify support agent
    await col("notifications").insert_one({
        "id": new_id("ntf"),
        "user_id": assignee_id,
        "title": "Support Ticket Assigned",
        "message": f"Support ticket #{ticket_id} has been assigned to you.",
        "is_read": False,
        "is_deleted": False,
        "deleted_at": None,
        "created_at": now,
        "updated_at": now
    })

    # Audit log
    await col("audit_logs").insert_one({
        "id": new_id("aud"),
        "action": "TICKET_ASSIGNED",
        "detail": f"Ticket #{ticket_id} assigned to agent {assignee_id} by actor {actor_id}",
        "actor": actor_id,
        "ip_address": "127.0.0.1",
        "created_at": now
    })
    return True


async def escalate_ticket(ticket_id: str, priority: str, actor_id: str) -> bool:
    """Escalates support ticket priority level."""
    ticket = await col("support_tickets").find_one({"id": ticket_id, "is_deleted": {"$ne": True}})
    if not ticket:
        raise NotFoundException("Support ticket not found.")

    now = datetime.now(timezone.utc)
    await col("support_tickets").update_one(
        {"id": ticket_id},
        {"$set": {"priority": priority, "updated_at": now}}
    )

    # Audit log
    await col("audit_logs").insert_one({
        "id": new_id("aud"),
        "action": "TICKET_ESCALATED",
        "detail": f"Ticket #{ticket_id} escalated to priority {priority} by actor {actor_id}",
        "actor": actor_id,
        "ip_address": "127.0.0.1",
        "created_at": now
    })
    return True


async def close_ticket(ticket_id: str, user_id: str, role: str, actor_email: str) -> bool:
    """Closes support ticket and logs the closing action."""
    ticket = await col("support_tickets").find_one({"id": ticket_id, "is_deleted": {"$ne": True}})
    if not ticket:
        raise NotFoundException("Support ticket not found.")

    if role not in ("admin", "support", "super_admin") and ticket["user_id"] != user_id:
        raise ForbiddenException("Access to support ticket forbidden.")

    now = datetime.now(timezone.utc)
    await col("support_tickets").update_one(
        {"id": ticket_id},
        {"$set": {"status": "closed", "updated_at": now}}
    )

    # Audit log
    await col("audit_logs").insert_one({
        "id": new_id("aud"),
        "action": "TICKET_CLOSED",
        "detail": f"Ticket #{ticket_id} marked as closed by {actor_email}",
        "actor": user_id,
        "ip_address": "127.0.0.1",
        "created_at": now
    })
    return True
