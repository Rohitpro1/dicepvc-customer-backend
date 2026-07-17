from typing import Optional
from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_user
from app.core.database import col
from app.core.exceptions import NotFoundException, ForbiddenException
from app.domains.licenses.client import LicenseServiceClient
from app.models.helpers import serialize_many

router = APIRouter(prefix="/licenses", tags=["licenses"])
license_client = LicenseServiceClient()


@router.get("/my")
async def get_my_licenses(current_user: dict = Depends(get_current_user)):
    """Fetch customer's active and expired license key assets."""
    # Find customer first
    customer = await col("customers").find_one({"user_id": current_user["id"]})
    if not customer:
        return []
        
    cursor = col("licenses").find({"subscription_id": {"$in": [
        s["id"] for s in await col("subscriptions").find({"customer_id": customer["id"]}).to_list(None)
    ]}, "is_deleted": {"$ne": True}})
    
    lics = await cursor.to_list(None)
    return serialize_many(lics)


@router.get("/{license_id}/usage")
async def get_license_device_usage(license_id: str, current_user: dict = Depends(get_current_user)):
    """Pulls live client device telemetry usage logs from the downstream License Service."""
    lic = await col("licenses").find_one({"id": license_id, "is_deleted": {"$ne": True}})
    if not lic:
        raise NotFoundException("License asset not found.")

    # Guard: check ownership
    sub = await col("subscriptions").find_one({"id": lic["subscription_id"]})
    if not sub or sub["user_id"] != current_user["id"]:
        # Verify admin/support access fallback
        if current_user.get("role") not in ("admin", "support", "super_admin"):
            raise ForbiddenException("Access to license logs forbidden.")

    # Call downstream central analytics log system
    try:
        # Downstream client pull
        # Note: get_usage_logs returns all logs in License Service, we filter locally for the specific key
        all_logs = await license_client.get_usage_logs()
        filtered = [log for log in all_logs if log.get("license_key") == lic["license_key"]]
        return filtered
    except Exception as err:
        print(f"[LicensesRouter] Downstream logs pull failed: {err}")
        return []
