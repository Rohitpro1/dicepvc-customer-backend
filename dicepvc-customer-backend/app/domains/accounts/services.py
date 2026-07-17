import re
from datetime import datetime, timezone
from typing import Any, Optional
from fastapi import status

from app.core.database import col
from app.core.exceptions import BaseAppException, NotFoundException
from app.domains.accounts.schemas import CustomerCreateInput, CustomerUpdateInput
from app.domains.auth.services import hash_password
from app.models.helpers import new_id, now_iso


async def get_customer_details(user_id: str) -> dict:
    """Fetch profile info aggregating both users and customers documents."""
    user = await col("users").find_one({"id": user_id, "is_deleted": {"$ne": True}})
    if not user:
        raise NotFoundException("User account not found.")

    customer = await col("customers").find_one({"user_id": user_id, "is_deleted": {"$ne": True}})
    if not customer:
        if user.get("role") in ("admin", "support", "super_admin"):
            now = datetime.now(timezone.utc)
            customer = {
                "id": new_id("c"),
                "user_id": user_id,
                "company_name": "Internal Staff",
                "phone": "0000000000",
                "billing_address": {},
                "is_deleted": False,
                "deleted_at": None,
                "created_at": now,
                "updated_at": now,
                "created_by": "system",
                "updated_by": "system"
            }
            await col("customers").insert_one(customer)
        else:
            raise NotFoundException("Customer profile not found.")

    return {
        "id": customer["id"],
        "user_id": user_id,
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "customer"),
        "status": user["status"],
        "company_name": customer["company_name"],
        "phone": customer["phone"],
        "gst_number": customer.get("gst_number"),
        "avatar_url": customer.get("avatar_url"),
        "billing_address": customer.get("billing_address", {}),
        "created_at": customer["created_at"].isoformat() if isinstance(customer["created_at"], datetime) else str(customer["created_at"])
    }


async def create_customer_profile(payload: CustomerCreateInput, actor_id: str) -> dict:
    """Admin endpoint to manually provision customer accounts."""
    existing = await col("users").find_one({"email": payload.email})
    if existing:
        raise BaseAppException("Email already exists.", status_code=status.HTTP_400_BAD_REQUEST)

    user_id = new_id("usr")
    now = datetime.now(timezone.utc)

    # 1. Create User
    user_doc = {
        "id": user_id,
        "name": payload.name,
        "email": payload.email,
        "password_hash": hash_password("TemporaryPassword@123"), # Safe temporary seed password
        "role": payload.role,
        "status": "active",
        "is_deleted": False,
        "deleted_at": None,
        "created_at": now,
        "updated_at": now,
        "created_by": actor_id,
        "updated_by": actor_id
    }
    await col("users").insert_one(user_doc)

    # 2. Create Customer Profile
    customer_id = new_id("c")
    billing_addr = payload.billing_address.model_dump() if payload.billing_address else {}
    customer_doc = {
        "id": customer_id,
        "user_id": user_id,
        "company_name": payload.company_name,
        "phone": payload.phone,
        "gst_number": payload.gst_number,
        "avatar_url": payload.avatar_url,
        "billing_address": billing_addr,
        "is_deleted": False,
        "deleted_at": None,
        "created_at": now,
        "updated_at": now,
        "created_by": actor_id,
        "updated_by": actor_id
    }
    await col("customers").insert_one(customer_doc)

    # 3. Log Audit
    audit_doc = {
        "id": new_id("aud"),
        "action": "CUSTOMER_PROVISIONED",
        "detail": f"Customer profile created for {payload.company_name} by {actor_id}",
        "actor": actor_id,
        "ip_address": "system",
        "created_at": now
    }
    await col("audit_logs").insert_one(audit_doc)

    return await get_customer_details(user_id)


async def update_customer_profile(user_id: str, payload: CustomerUpdateInput, actor_id: str) -> dict:
    """Updates fields on the customer profile."""
    customer = await col("customers").find_one({"user_id": user_id, "is_deleted": {"$ne": True}})
    if not customer:
        raise NotFoundException("Customer profile not found.")

    patch = payload.model_dump(exclude_none=True)
    if "billing_address" in patch and patch["billing_address"]:
        # Handle nested billing address update
        current_billing = customer.get("billing_address", {})
        for k, v in patch["billing_address"].items():
            current_billing[k] = v
        patch["billing_address"] = current_billing

    now = datetime.now(timezone.utc)
    patch["updated_at"] = now
    patch["updated_by"] = actor_id

    # Update customer record
    await col("customers").update_one({"user_id": user_id}, {"$set": patch})

    # Log Audit
    audit_doc = {
        "id": new_id("aud"),
        "action": "CUSTOMER_PROFILE_UPDATED",
        "detail": f"Profile fields updated for user {user_id} by {actor_id}",
        "actor": actor_id,
        "ip_address": "system",
        "created_at": now
    }
    await col("audit_logs").insert_one(audit_doc)

    return await get_customer_details(user_id)


async def deactivate_customer(customer_id: str, actor_id: str) -> bool:
    """Deactivate customer user account status (suspends dashboard login)."""
    customer = await col("customers").find_one({"id": customer_id, "is_deleted": {"$ne": True}})
    if not customer:
        raise NotFoundException("Customer profile not found.")

    now = datetime.now(timezone.utc)
    # Suspend user login status
    await col("users").update_one(
        {"id": customer["user_id"]},
        {"$set": {
            "status": "suspended",
            "updated_at": now,
            "updated_by": actor_id
        }}
    )

    # Log Audit
    audit_doc = {
        "id": new_id("aud"),
        "action": "CUSTOMER_ACCOUNT_SUSPENDED",
        "detail": f"Account user suspended for customer {customer_id} by {actor_id}",
        "actor": actor_id,
        "ip_address": "system",
        "created_at": now
    }
    await col("audit_logs").insert_one(audit_doc)
    return True


async def delete_customer_profile(customer_id: str, actor_id: str) -> bool:
    """Perform a soft delete on a customer profile and associated user document."""
    customer = await col("customers").find_one({"id": customer_id, "is_deleted": {"$ne": True}})
    if not customer:
        raise NotFoundException("Customer profile not found.")

    now = datetime.now(timezone.utc)

    # 1. Soft delete customer record
    await col("customers").update_one(
        {"id": customer_id},
        {"$set": {
            "is_deleted": True,
            "deleted_at": now,
            "updated_at": now,
            "updated_by": actor_id
        }}
    )

    # 2. Soft delete user record
    await col("users").update_one(
        {"id": customer["user_id"]},
        {"$set": {
            "is_deleted": True,
            "deleted_at": now,
            "updated_at": now,
            "updated_by": actor_id
        }}
    )

    # 3. Log Audit
    audit_doc = {
        "id": new_id("aud"),
        "action": "CUSTOMER_PROFILE_DELETED",
        "detail": f"Customer profile {customer_id} soft deleted by {actor_id}",
        "actor": actor_id,
        "ip_address": "system",
        "created_at": now
    }
    await col("audit_logs").insert_one(audit_doc)
    return True


async def search_customers(
    search_query: Optional[str] = None,
    status_filter: Optional[str] = None,
    page: int = 1,
    limit: int = 20
) -> dict:
    """Paginated search with text query regex matching and role filtering."""
    query: dict[str, Any] = {"is_deleted": {"$ne": True}}

    if status_filter:
        # Match user status
        query["status"] = status_filter

    # If search string is provided, construct regex matching across user name, user email, or company name
    if search_query:
        regex = re.compile(f".*{re.escape(search_query.strip())}.*", re.IGNORECASE)
        # Gather matching user IDs first
        users_cursor = col("users").find({
            "$or": [
                {"name": {"$regex": regex}},
                {"email": {"$regex": regex}}
            ],
            "is_deleted": {"$ne": True}
        })
        matched_user_ids = [u["id"] for u in await users_cursor.to_list(None)]
        
        # Query matches customer collections
        query["$or"] = [
            {"user_id": {"$in": matched_user_ids}},
            {"company_name": {"$regex": regex}},
            {"phone": {"$regex": regex}}
        ]

    # Calculate count
    total_count = await col("customers").count_documents(query)

    # Paginate and load customers
    skip = (page - 1) * limit
    cursor = col("customers").find(query).skip(skip).limit(limit)
    customers_docs = await cursor.to_list(limit)

    results = []
    for c in customers_docs:
        try:
            details = await get_customer_details(c["user_id"])
            results.append(details)
        except Exception:
            # Skip invalid/broken pairs
            continue

    return {
        "results": results,
        "total": total_count,
        "page": page,
        "limit": limit,
        "pages": (total_count + limit - 1) // limit
    }


async def get_customer_dashboard_stats(user_id: str) -> dict:
    """Fetch aggregated dashboard counts for the logged-in customer."""
    # Find customer profile
    customer = await col("customers").find_one({"user_id": user_id, "is_deleted": {"$ne": True}})
    if not customer:
        return {
            "active_licenses": 0,
            "open_tickets": 0,
            "active_subscriptions": 0,
            "total_spent": 0.0
        }

    customer_id = customer["id"]
    
    # 1. Active licenses
    active_licenses = await col("licenses").count_documents({
        "subscription_id": {"$in": [
            s["id"] for s in await col("subscriptions").find({"customer_id": customer_id}).to_list(None)
        ]},
        "status": "active"
    })

    # 2. Open tickets
    open_tickets = await col("support_tickets").count_documents({
        "user_id": user_id,
        "status": "open",
        "is_deleted": {"$ne": True}
    })

    # 3. Active subscriptions
    active_subs = await col("subscriptions").count_documents({
        "customer_id": customer_id,
        "status": "active"
    })

    # 4. Total spent
    orders_cursor = col("orders").find({"user_id": user_id, "status": "paid"})
    total_spent = 0.0
    async for ord in orders_cursor:
        total_spent += ord.get("amount", 0.0)

    return {
        "active_licenses": active_licenses,
        "open_tickets": open_tickets,
        "active_subscriptions": active_subs,
        "total_spent": total_spent
    }
