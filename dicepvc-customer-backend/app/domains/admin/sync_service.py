import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from app.core.database import col
from app.domains.licenses.client import LicenseServiceClient
from app.models.helpers import new_id, serialize_many

logger = logging.getLogger("license_sync_service")


async def perform_license_synchronization() -> dict:
    """Synchronizes all cached license key details from the downstream License Service, logging results."""
    client = LicenseServiceClient()
    now = datetime.now(timezone.utc)
    
    sync_id = new_id("lsync")
    sync_log = {
        "id": sync_id,
        "status": "in_progress",
        "started_at": now,
        "ended_at": None,
        "licenses_processed": 0,
        "licenses_updated": 0,
        "errors_count": 0,
        "error_logs": [],
        "created_at": now
    }
    await col("license_sync").insert_one(sync_log)

    cursor = col("licenses").find({"is_deleted": {"$ne": True}})
    licenses = await cursor.to_list(None)
    
    processed = 0
    updated = 0
    errors = []

    for lic in licenses:
        processed += 1
        lic_id = lic["id"]
        license_key = lic["license_key"]
        
        # Implement retries with exponential backoff on a per-license basis
        attempts = 3
        backoff = 0.5
        details = None
        
        for attempt in range(attempts):
            try:
                # Retrieve live details from License Service downstream client
                details = await client.get_license(lic_id)
                break
            except Exception as err:
                logger.warning(f"[Sync] Attempt {attempt+1}/{attempts} failed for license {lic_id}: {err}")
                if attempt == attempts - 1:
                    errors.append({
                        "license_id": lic_id,
                        "license_key": license_key,
                        "error": str(err),
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
                else:
                    await asyncio.sleep(backoff * (2 ** attempt))
        
        if not details:
            continue

        # Discrepancy checks
        # Compare local vs downstream keys
        downstream_status = details.get("status", "active")
        # Handle expires_at ISO parsing safely
        downstream_expires = details.get("expires_at")
        if isinstance(downstream_expires, str):
            try:
                downstream_expires = datetime.fromisoformat(downstream_expires.replace("Z", "+00:00"))
            except ValueError:
                downstream_expires = None
        
        downstream_devices = details.get("activated_devices", [])
        downstream_device_count = len(downstream_devices)
        downstream_heartbeat = details.get("heartbeat_status", "healthy")

        # Determine if local cache matches downstream status
        has_change = False
        update_payload = {}

        if lic.get("status") != downstream_status:
            update_payload["status"] = downstream_status
            has_change = True
            
        # Safely compare expires_at dates
        local_expiry = lic.get("expires_at")
        if local_expiry:
            # strip timezone if comparing offset-naive or keep both UTC aware
            if local_expiry.tzinfo is None:
                local_expiry = local_expiry.replace(tzinfo=timezone.utc)
        if downstream_expires:
            if downstream_expires.tzinfo is None:
                downstream_expires = downstream_expires.replace(tzinfo=timezone.utc)
                
        if local_expiry != downstream_expires:
            update_payload["expires_at"] = downstream_expires
            has_change = True

        if lic.get("device_count") != downstream_device_count:
            update_payload["device_count"] = downstream_device_count
            has_change = True

        if lic.get("activated_devices") != downstream_devices:
            update_payload["activated_devices"] = downstream_devices
            has_change = True

        if lic.get("heartbeat_status") != downstream_heartbeat:
            update_payload["heartbeat_status"] = downstream_heartbeat
            has_change = True

        if has_change:
            update_payload["updated_at"] = datetime.now(timezone.utc)
            await col("licenses").update_one(
                {"id": lic_id},
                {"$set": update_payload}
            )
            updated += 1
            logger.info(f"[Sync] Updated license {lic_id} in local database cache.")

    # Mark sync run finished
    end_time = datetime.now(timezone.utc)
    duration = (end_time - now).total_seconds()
    status_str = "completed" if len(errors) == 0 else "partial_error"
    if len(errors) == processed:
        status_str = "failed"

    await col("license_sync").update_one(
        {"id": sync_id},
        {"$set": {
            "status": status_str,
            "ended_at": end_time,
            "licenses_processed": processed,
            "licenses_updated": updated,
            "errors_count": len(errors),
            "error_logs": errors
        }}
    )

    return {
        "sync_id": sync_id,
        "status": status_str,
        "processed": processed,
        "updated": updated,
        "errors_count": len(errors),
        "duration_seconds": duration
    }


async def list_sync_logs(page: int = 1, limit: int = 20) -> dict:
    """Returns paginated logs of past background sync runs."""
    total = await col("license_sync").count_documents({})
    skip = (page - 1) * limit
    cursor = col("license_sync").find({}).sort("started_at", -1).skip(skip).limit(limit)
    logs = await cursor.to_list(limit)
    return {
        "results": serialize_many(logs),
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


async def get_sync_discrepancies() -> list[dict]:
    """Compares local cache databases with downstream states and lists inconsistencies."""
    client = LicenseServiceClient()
    cursor = col("licenses").find({"is_deleted": {"$ne": True}})
    licenses = await cursor.to_list(None)
    
    discrepancies = []
    for lic in licenses:
        try:
            details = await client.get_license(lic["id"])
            
            local_status = lic.get("status")
            downstream_status = details.get("status")
            
            local_dev_count = lic.get("device_count", 0)
            downstream_dev_count = len(details.get("activated_devices", []))

            if local_status != downstream_status or local_dev_count != downstream_dev_count:
                discrepancies.append({
                    "license_id": lic["id"],
                    "license_key": lic["license_key"],
                    "local": {
                        "status": local_status,
                        "device_count": local_dev_count
                    },
                    "downstream": {
                        "status": downstream_status,
                        "device_count": downstream_dev_count
                    }
                })
        except Exception:
            # Skip unreachable keys
            pass
            
    return discrepancies
