from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_current_user, require_admin, require_support, require_customer
from app.domains.accounts import services
from app.domains.accounts.schemas import CustomerCreateInput, CustomerUpdateInput, CustomerDetailsOut

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("/me", response_model=CustomerDetailsOut)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Fetch personal profile details."""
    details = await services.get_customer_details(current_user["id"])
    return details


@router.put("/me", response_model=CustomerDetailsOut)
async def update_my_profile(payload: CustomerUpdateInput, current_user: dict = Depends(get_current_user)):
    """Update personal profile fields."""
    details = await services.update_customer_profile(current_user["id"], payload, current_user["email"])
    return details


@router.get("", dependencies=[Depends(require_support)])
async def list_and_search_customers(
    q: Optional[str] = Query(None, description="Search regex query"),
    status: Optional[str] = Query(None, description="Filter by user status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Support / Admin view to search and paginate all platform customers."""
    results = await services.search_customers(q, status, page, limit)
    return results


@router.post("", response_model=CustomerDetailsOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def provision_customer(payload: CustomerCreateInput, current_user: dict = Depends(get_current_user)):
    """Admin endpoint to manually create customer and user profiles."""
    profile = await services.create_customer_profile(payload, current_user["email"])
    return profile


@router.put("/{customer_id}", response_model=CustomerDetailsOut, dependencies=[Depends(require_admin)])
async def update_customer(customer_id: str, payload: CustomerUpdateInput, current_user: dict = Depends(get_current_user)):
    """Admin endpoint to update fields of another customer profile."""
    # First lookup user_id of the customer
    from app.core.database import col
    from app.core.exceptions import NotFoundException
    c = await col("customers").find_one({"id": customer_id, "is_deleted": {"$ne": True}})
    if not c:
        raise NotFoundException("Customer profile not found.")
    profile = await services.update_customer_profile(c["user_id"], payload, current_user["email"])
    return profile


@router.post("/{customer_id}/deactivate", dependencies=[Depends(require_admin)])
async def suspend_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    """Admin endpoint to deactivate/suspend a customer's login privileges."""
    await services.deactivate_customer(customer_id, current_user["email"])
    return {"ok": True, "message": "Customer login privileges suspended successfully."}


@router.delete("/{customer_id}", dependencies=[Depends(require_admin)])
async def delete_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    """Admin endpoint to soft delete a customer profile and credentials."""
    await services.delete_customer_profile(customer_id, current_user["email"])
    return {"ok": True, "message": "Customer profile soft deleted successfully."}


@router.get("/dashboard/stats")
async def get_my_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Fetch personal dashboard summary aggregates."""
    stats = await services.get_customer_dashboard_stats(current_user["id"])
    return stats
