from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_current_user, require_admin, require_support
from app.domains.admin import services
from app.domains.admin.schemas import (
    AdminDashboardStats,
    UserUpdateRoleInput,
    LicenseUpdateLimitInput,
    SoftwareVersionCreateInput,
    SoftwareVersionOut,
    AnnouncementCreateInput
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminDashboardStats, dependencies=[Depends(require_support)])
async def get_stats():
    """Fetch administrative dashboard metrics."""
    stats = await services.get_dashboard_stats()
    return stats


@router.get("/revenue/analytics", dependencies=[Depends(require_admin)])
async def get_revenue_analytics():
    """Retrieve monthly revenue aggregate analytics."""
    analytics = await services.get_revenue_analytics()
    return analytics


@router.get("/users", dependencies=[Depends(require_support)])
async def get_users(
    q: Optional[str] = Query(None, description="Search query"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Search and paginate platform users."""
    users = await services.list_users(q, page, limit)
    return users


@router.put("/users/{user_id}/role", dependencies=[Depends(require_admin)])
async def change_role(user_id: str, payload: UserUpdateRoleInput, current_user: dict = Depends(get_current_user)):
    """Alter platform authorization privileges for a user."""
    await services.update_user_role(user_id, payload.role, current_user["email"])
    return {"ok": True, "message": "User role updated successfully."}


@router.post("/users/{user_id}/suspend", dependencies=[Depends(require_admin)])
async def suspend_user_account(user_id: str, current_user: dict = Depends(get_current_user)):
    """Deactivate user login credentials access."""
    await services.set_user_suspension(user_id, True, current_user["email"])
    return {"ok": True, "message": "User account suspended successfully."}


@router.post("/users/{user_id}/unsuspend", dependencies=[Depends(require_admin)])
async def unsuspend_user_account(user_id: str, current_user: dict = Depends(get_current_user)):
    """Restore user login credentials access."""
    await services.set_user_suspension(user_id, False, current_user["email"])
    return {"ok": True, "message": "User account unsuspended successfully."}


@router.get("/subscriptions", dependencies=[Depends(require_support)])
async def get_subscriptions(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100)):
    """List and paginate SaaS customer subscriptions."""
    subs = await services.list_subscriptions(page, limit)
    return subs


@router.get("/licenses", dependencies=[Depends(require_support)])
async def get_licenses(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100)):
    """List and paginate platform licensing serial keys."""
    lics = await services.list_licenses(page, limit)
    return lics


@router.post("/licenses/{license_id}/block", dependencies=[Depends(require_admin)])
async def block_license(license_id: str, current_user: dict = Depends(get_current_user)):
    """Manually revoke a license downstream immediately."""
    await services.block_license_manually(license_id, current_user["email"])
    return {"ok": True, "message": "License blocked successfully."}


@router.put("/licenses/{license_id}/device-limit", dependencies=[Depends(require_admin)])
async def update_device_limit(
    license_id: str,
    payload: LicenseUpdateLimitInput,
    current_user: dict = Depends(get_current_user)
):
    """Manually alter license node limit configurations."""
    await services.update_license_devices(license_id, payload.device_limit, current_user["email"])
    return {"ok": True, "message": "License device limit updated successfully."}


@router.get("/audit-logs", dependencies=[Depends(require_admin)])
async def get_audit_logs(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100)):
    """Paginate and search operational audit logs."""
    logs = await services.list_audit_logs(page, limit)
    return logs


@router.post("/software-versions", response_model=SoftwareVersionOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_software_version(payload: SoftwareVersionCreateInput, current_user: dict = Depends(get_current_user)):
    """Publish a new software update release metadata."""
    ver = await services.publish_software_version(payload, current_user["email"])
    
    # Serialize datetime
    ver["created_at"] = ver["created_at"].isoformat() if isinstance(ver["created_at"], datetime) else str(ver["created_at"])
    return ver


@router.post("/announcements", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def make_announcement(payload: AnnouncementCreateInput, current_user: dict = Depends(get_current_user)):
    """Publish system announcement and optionally broadcast via Central Email queue."""
    ann = await services.create_announcement(payload, current_user["email"])
    return ann


from fastapi import BackgroundTasks
from app.domains.admin import sync_service

@router.post("/licenses/sync", dependencies=[Depends(require_admin)])
async def trigger_license_sync(background_tasks: BackgroundTasks):
    """Triggers downstream license synchronization asynchronously."""
    background_tasks.add_task(sync_service.perform_license_synchronization)
    return {"ok": True, "message": "License synchronization job dispatched in background."}


@router.get("/licenses/sync/logs", dependencies=[Depends(require_admin)])
async def get_sync_logs(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100)):
    """Retrieve history of background synchronization runs."""
    logs = await sync_service.list_sync_logs(page, limit)
    return logs


@router.get("/licenses/sync/discrepancies", dependencies=[Depends(require_admin)])
async def get_sync_discrepancies():
    """Lists current discrepancies between local cache and downstream licensing service."""
    discrepancies = await sync_service.get_sync_discrepancies()
    return {"discrepancies": discrepancies, "total": len(discrepancies)}
