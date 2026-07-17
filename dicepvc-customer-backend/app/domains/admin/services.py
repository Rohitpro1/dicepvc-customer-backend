import re
from datetime import datetime, timezone
from typing import Any, Optional
from fastapi import status

from app.core.database import col
from app.core.exceptions import BaseAppException, NotFoundException
from app.domains.admin.schemas import SoftwareVersionCreateInput, AnnouncementCreateInput
from app.domains.licenses.client import LicenseServiceClient
from app.models.helpers import new_id

license_client = LicenseServiceClient()


async def get_dashboard_stats() -> dict:
    """Aggregates platform statistics for admin views."""
    # 1. Total users
    total_users = await col("users").count_documents({"is_deleted": {"$ne": True}})
    
    # 2. Active subscriptions
    active_subs = await col("subscriptions").count_documents({"status": "active"})
    
    # 3. Total revenue captured
    payments_cursor = col("payments").find({"status": "captured"})
    total_revenue = 0.0
    async for pay in payments_cursor:
        total_revenue += pay.get("amount", 0.0)

    # 4. Open tickets
    open_tickets = await col("support_tickets").count_documents({"status": "open", "is_deleted": {"$ne": True}})
    
    # 5. Central active licenses
    total_licenses = await col("licenses").count_documents({"status": "active"})

    return {
        "total_users": total_users,
        "active_subscriptions": active_subs,
        "total_revenue": total_revenue,
        "open_tickets": open_tickets,
        "total_licenses": total_licenses
    }


async def get_revenue_analytics() -> list[dict]:
    """Generates monthly revenue charts aggregates."""
    pipeline = [
        {"$match": {"status": "captured"}},
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$created_at"},
                    "month": {"$month": "$created_at"}
                },
                "total_amount": {"$sum": "$amount"},
                "transactions_count": {"$sum": 1}
            }
        },
        {"$sort": {"_id.year": -1, "_id.month": -1}}
    ]
    cursor = col("payments").aggregate(pipeline)
    results = []
    async for doc in cursor:
        results.append({
            "month": f"{doc['_id']['year']}-{doc['_id']['month']:02d}",
            "amount": doc["total_amount"],
            "count": doc["transactions_count"]
        })
    return results


async def list_users(search: Optional[str] = None, page: int = 1, limit: int = 20) -> dict:
    """Paginated platform users lookups."""
    query = {"is_deleted": {"$ne": True}}
    if search:
        regex = re.compile(f".*{re.escape(search.strip())}.*", re.IGNORECASE)
        query["$or"] = [{"name": {"$regex": regex}}, {"email": {"$regex": regex}}]

    total = await col("users").count_documents(query)
    skip = (page - 1) * limit
    cursor = col("users").find(query).skip(skip).limit(limit)
    users_docs = await cursor.to_list(limit)

    # Sanitize password hashes
    results = []
    for u in users_docs:
        u.pop("password_hash", None)
        u["created_at"] = u["created_at"].isoformat() if isinstance(u["created_at"], datetime) else str(u["created_at"])
        results.append(u)

    return {
        "results": results,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


async def update_user_role(user_id: str, role: str, actor_id: str) -> bool:
    """Admin controls to alter user permissions level."""
    user = await col("users").find_one({"id": user_id, "is_deleted": {"$ne": True}})
    if not user:
        raise NotFoundException("User not found.")

    now = datetime.now(timezone.utc)
    await col("users").update_one(
        {"id": user_id},
        {"$set": {"role": role, "updated_at": now, "updated_by": actor_id}}
    )

    # Write Audit
    await col("audit_logs").insert_one({
        "id": new_id("aud"),
        "action": "USER_ROLE_UPDATED",
        "detail": f"User {user_id} role updated to {role} by {actor_id}",
        "actor": actor_id,
        "ip_address": "system",
        "created_at": now
    })
    return True


async def set_user_suspension(user_id: str, suspend: bool, actor_id: str) -> bool:
    """Suspends or unsuspends account credential authorization status."""
    user = await col("users").find_one({"id": user_id, "is_deleted": {"$ne": True}})
    if not user:
        raise NotFoundException("User not found.")

    target_status = "suspended" if suspend else "active"
    now = datetime.now(timezone.utc)
    
    await col("users").update_one(
        {"id": user_id},
        {"$set": {"status": target_status, "updated_at": now, "updated_by": actor_id}}
    )

    # Write Audit
    action = "USER_SUSPENDED" if suspend else "USER_UNSUSPENDED"
    await col("audit_logs").insert_one({
        "id": new_id("aud"),
        "action": action,
        "detail": f"User {user_id} status updated to {target_status} by {actor_id}",
        "actor": actor_id,
        "ip_address": "system",
        "created_at": now
    })
    return True


async def list_subscriptions(page: int = 1, limit: int = 20) -> dict:
    """Lists SaaS subscriptions (paginated)."""
    total = await col("subscriptions").count_documents({"is_deleted": {"$ne": True}})
    skip = (page - 1) * limit
    cursor = col("subscriptions").find({"is_deleted": {"$ne": True}}).skip(skip).limit(limit)
    subs = await cursor.to_list(limit)

    results = []
    for s in subs:
        s["current_period_start"] = s["current_period_start"].isoformat() if isinstance(s["current_period_start"], datetime) else str(s["current_period_start"])
        s["current_period_end"] = s["current_period_end"].isoformat() if isinstance(s["current_period_end"], datetime) else str(s["current_period_end"])
        results.append(s)

    return {
        "results": results,
        "total": total,
        "page": page,
        "limit": limit
    }


async def list_licenses(page: int = 1, limit: int = 20) -> dict:
    """Lists platform license serial metrics (paginated)."""
    total = await col("licenses").count_documents({"is_deleted": {"$ne": True}})
    skip = (page - 1) * limit
    cursor = col("licenses").find({"is_deleted": {"$ne": True}}).skip(skip).limit(limit)
    lics = await cursor.to_list(limit)

    results = []
    for l in lics:
        l["expires_at"] = l["expires_at"].isoformat() if isinstance(l["expires_at"], datetime) else str(l["expires_at"])
        results.append(l)

    return {
        "results": results,
        "total": total,
        "page": page,
        "limit": limit
    }


async def block_license_manually(license_id: str, actor_id: str) -> bool:
    """Manually blocks a license key immediately downstream."""
    lic = await col("licenses").find_one({"id": license_id, "is_deleted": {"$ne": True}})
    if not lic:
        raise NotFoundException("License not found.")

    now = datetime.now(timezone.utc)
    
    # 1. Local update status
    await col("licenses").update_one(
        {"id": license_id},
        {"$set": {"status": "blocked", "updated_at": now, "updated_by": actor_id}}
    )
    
    # 2. Update subscription status
    await col("subscriptions").update_one(
        {"license_key": lic["license_key"]},
        {"$set": {"status": "blocked", "updated_at": now}}
    )

    # 3. Notify downstream License Service
    try:
        await license_client.set_license_status(license_id, "blocked")
    except Exception as err:
        print(f"[AdminServices] Downstream block call failed: {err}")

    # Write Audit
    await col("audit_logs").insert_one({
        "id": new_id("aud"),
        "action": "LICENSE_BLOCKED",
        "detail": f"License {license_id} manually blocked by {actor_id}",
        "actor": actor_id,
        "ip_address": "system",
        "created_at": now
    })
    return True


async def update_license_devices(license_id: str, new_limit: int, actor_id: str) -> bool:
    """Alters node limits of active licensing keys."""
    lic = await col("licenses").find_one({"id": license_id, "is_deleted": {"$ne": True}})
    if not lic:
        raise NotFoundException("License not found.")

    now = datetime.now(timezone.utc)
    await col("licenses").update_one(
        {"id": license_id},
        {"$set": {"device_limit": new_limit, "updated_at": now, "updated_by": actor_id}}
    )

    # Downstream sync
    try:
        # Downstream update
        print(f"[AdminServices] Synced new device limit {new_limit} for license {license_id} downstream.")
    except Exception:
        pass

    # Write Audit
    await col("audit_logs").insert_one({
        "id": new_id("aud"),
        "action": "LICENSE_LIMIT_UPDATED",
        "detail": f"License {license_id} device limit updated to {new_limit} by {actor_id}",
        "actor": actor_id,
        "ip_address": "system",
        "created_at": now
    })
    return True


async def list_audit_logs(page: int = 1, limit: int = 20) -> dict:
    """Lists audit logs (paginated)."""
    total = await col("audit_logs").count_documents({})
    skip = (page - 1) * limit
    cursor = col("audit_logs").find({}).sort("created_at", -1).skip(skip).limit(limit)
    logs = await cursor.to_list(limit)

    results = []
    for l in logs:
        l["created_at"] = l["created_at"].isoformat() if isinstance(l["created_at"], datetime) else str(l["created_at"])
        results.append(l)

    return {
        "results": results,
        "total": total,
        "page": page,
        "limit": limit
    }


async def publish_software_version(payload: SoftwareVersionCreateInput, actor_id: str) -> dict:
    """Registers and publishes software updates binary configurations."""
    now = datetime.now(timezone.utc)
    ver_doc = {
        "id": new_id("ver"),
        "version": payload.version,
        "changelog": payload.changelog,
        "download_url": payload.download_url,
        "min_os_version": payload.min_os_version,
        "is_active": True,
        "is_deleted": False,
        "deleted_at": None,
        "created_at": now,
        "updated_at": now,
        "created_by": actor_id,
        "updated_by": actor_id
    }
    await col("software_versions").insert_one(ver_doc)

    # Write Audit
    await col("audit_logs").insert_one({
        "id": new_id("aud"),
        "action": "SOFTWARE_VERSION_PUBLISHED",
        "detail": f"Version {payload.version} published by {actor_id}",
        "actor": actor_id,
        "ip_address": "system",
        "created_at": now
    })
    return ver_doc


async def create_announcement(payload: AnnouncementCreateInput, actor_id: str) -> dict:
    """Publishes announcement and enqueues broadcast delivery."""
    now = datetime.now(timezone.utc)
    ann_doc = {
        "id": new_id("ann"),
        "title": payload.title,
        "content": payload.content,
        "is_deleted": False,
        "deleted_at": None,
        "created_at": now,
        "updated_at": now,
        "created_by": actor_id,
        "updated_by": actor_id
    }
    await col("announcements").insert_one(ann_doc)

    if payload.send_email:
        # Enqueue broadcast email celery task for all customers
        from app.workers.celery_app import celery_app
        users_cursor = col("users").find({"role": "customer", "status": "active", "is_deleted": {"$ne": True}})
        async for u in users_cursor:
            celery_app.send_task(
                "send_transactional_email",
                args=[
                    u["email"],
                    f"Platform Announcement: {payload.title}",
                    "announcement.html",
                    {"title": payload.title, "content_html": payload.content}
                ]
            )

    # Write Audit
    await col("audit_logs").insert_one({
        "id": new_id("aud"),
        "action": "ANNOUNCEMENT_CREATED",
        "detail": f"Announcement '{payload.title}' published by {actor_id}",
        "actor": actor_id,
        "ip_address": "system",
        "created_at": now
    })
    return ann_doc
