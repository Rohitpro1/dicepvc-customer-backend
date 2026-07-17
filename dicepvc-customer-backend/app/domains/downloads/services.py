import hashlib
import hmac
import json
import time
from datetime import datetime, timezone
from typing import Any, Optional
from redis.asyncio import Redis

from app.core.database import col
from app.core.exceptions import ForbiddenException, NotFoundException, UnauthorizedException
from app.core.config import settings
from app.models.helpers import new_id, serialize_many


async def check_download_eligibility(user_id: str) -> None:
    """Verifies that the user has a currently active subscription plan, raising ForbiddenException if ineligible."""
    # Lookup customer profile first
    customer = await col("customers").find_one({"user_id": user_id, "is_deleted": {"$ne": True}})
    if not customer:
        raise ForbiddenException("Subscription required to access software downloads.")

    # Query active subscriptions
    active_sub = await col("subscriptions").find_one({
        "customer_id": customer["id"],
        "status": "active"
    })
    if not active_sub:
        raise ForbiddenException("Active SaaS subscription required to access software downloads.")


async def generate_signed_url(user_id: str, version_id: str) -> str:
    """Generates a secure, temporary HMAC-SHA256 signature url valid for 1 hour."""
    expires_at = int(time.time()) + 3600  # 1 hour validity
    message = f"{user_id}:{version_id}:{expires_at}"
    
    signature = hmac.new(
        settings.JWT_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    return f"/api/v1/downloads/{version_id}/secure-file?expires={expires_at}&signature={signature}&user_id={user_id}"


async def get_active_versions_for_user(user_id: str, release_type: Optional[str] = None) -> list[dict]:
    """Lists eligible versions (stable and beta) including checksum validation metadata and signed URLs."""
    # 1. Enforce automatic download eligibility checks
    await check_download_eligibility(user_id)

    # 2. Build releases query
    query = {"is_active": True, "is_deleted": {"$ne": True}}
    if release_type in ("stable", "beta"):
        query["release_type"] = release_type

    cursor = col("software_versions").find(query).sort("created_at", -1)
    versions = await cursor.to_list(None)

    results = []
    for ver in versions:
        version_id = ver["id"]
        # Inject signed download URL path
        signed_url = await generate_signed_url(user_id, version_id)
        
        results.append({
            "id": version_id,
            "version": ver["version"],
            "release_type": ver.get("release_type", "stable"),
            "changelog": ver["changelog"],
            "checksum_sha256": ver.get("checksum_sha256", "Unavailable"),
            "signed_download_url": signed_url,
            "created_at": ver["created_at"].isoformat() if isinstance(ver["created_at"], datetime) else str(ver["created_at"])
        })
        
    return results


async def process_secure_download(
    user_id: str,
    version_id: str,
    expires_timestamp: int,
    signature: str,
    ip_address: str
) -> str:
    """Verifies temporary signature credentials and returns real binary file redirect URL."""
    # 1. Check expiration
    if int(time.time()) > expires_timestamp:
        raise UnauthorizedException("Secure download link has expired.")

    # 2. Cryptographic signature match validation
    message = f"{user_id}:{version_id}:{expires_timestamp}"
    expected_signature = hmac.new(
        settings.JWT_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, signature):
        raise UnauthorizedException("Access denied: Invalid download signature credentials.")

    # 3. Retrieve release version metadata
    version = await col("software_versions").find_one({"id": version_id, "is_deleted": {"$ne": True}})
    if not version:
        raise NotFoundException("Software version not found.")

    # 4. Log download analytics telemetry
    download_doc = {
        "id": new_id("dld"),
        "user_id": user_id,
        "version_id": version_id,
        "ip_address": ip_address,
        "created_at": datetime.now(timezone.utc)
    }
    await col("downloads").insert_one(download_doc)

    return version["download_url"]


async def get_download_analytics() -> dict:
    """Calculates aggregates across downloads telemetry database records."""
    total_downloads = await col("downloads").count_documents({})
    
    # Aggregate downloads grouped by software version IDs
    pipeline = [
        {"$group": {"_id": "$version_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    cursor = col("downloads").aggregate(pipeline)
    by_version = await cursor.to_list(None)

    stats = []
    for item in by_version:
        ver = await col("software_versions").find_one({"id": item["_id"]})
        version_str = ver["version"] if ver else "Unknown"
        stats.append({
            "version_id": item["_id"],
            "version": version_str,
            "downloads_count": item["count"]
        })

    return {
        "total_downloads": total_downloads,
        "downloads_by_version": stats
    }
