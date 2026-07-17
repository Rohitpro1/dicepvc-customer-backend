from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import RedirectResponse

from app.core.dependencies import get_current_user, require_admin
from app.domains.downloads import services

router = APIRouter(prefix="/downloads", tags=["downloads"])


@router.get("")
async def get_downloadable_versions(
    release_type: Optional[str] = Query(None, pattern=r"^(stable|beta)$"),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve active software releases available to download, incorporating signed HMAC URLs and checksums."""
    versions = await services.get_active_versions_for_user(current_user["id"], release_type)
    return versions


@router.get("/{version_id}/secure-file")
async def secure_file_download(
    version_id: str,
    expires: int = Query(...),
    signature: str = Query(...),
    user_id: str = Query(...),
    request: Request = None
):
    """Validates secure URL signatures cryptographically and redirects to binary storage location."""
    ip_address = request.client.host if request and request.client else "unknown"
    binary_url = await services.process_secure_download(
        user_id=user_id,
        version_id=version_id,
        expires_timestamp=expires,
        signature=signature,
        ip_address=ip_address
    )
    # Perform HTTP redirect to the file storage target
    return RedirectResponse(url=binary_url)


@router.get("/analytics", dependencies=[Depends(require_admin)])
async def get_downloads_analytics():
    """Admin dashboard stats for tracking user binary downloads logs."""
    stats = await services.get_download_analytics()
    return stats
