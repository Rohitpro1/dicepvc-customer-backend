from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import get_current_user, require_admin, require_support
from app.domains.tickets import services
from app.domains.tickets.schemas import (
    TicketCreateInput,
    TicketMessageCreateInput,
    TicketDetailsOut,
    TicketMessageOut,
    TicketAssignInput,
    TicketEscalateInput
)

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def open_ticket(payload: TicketCreateInput, current_user: dict = Depends(get_current_user)):
    """Customer endpoint to open a new support ticket."""
    result = await services.create_ticket(current_user["id"], current_user["name"], payload)
    return result


@router.get("")
async def get_tickets(
    status_filter: Optional[str] = Query(None, pattern=r"^(open|closed|in_progress)$"),
    priority_filter: Optional[str] = Query(None, pattern=r"^(low|medium|high|critical)$"),
    assigned_to: Optional[str] = Query(None),
    search_query: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve support tickets list (Customers view own, Staff view all with filters & search)."""
    role = current_user.get("role", "customer")
    if role in ("admin", "support", "super_admin"):
        results = await services.list_tickets(
            user_id=None,
            status_filter=status_filter,
            priority_filter=priority_filter,
            assigned_to=assigned_to,
            search_query=search_query,
            page=page,
            limit=limit
        )
    else:
        results = await services.list_tickets(
            user_id=current_user["id"],
            status_filter=status_filter,
            priority_filter=priority_filter,
            assigned_to=None,
            search_query=search_query,
            page=page,
            limit=limit
        )
    return results


@router.get("/{ticket_id}", response_model=TicketDetailsOut)
async def get_ticket(ticket_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieve full support thread message history."""
    result = await services.get_ticket_thread(ticket_id, current_user["id"], current_user.get("role", "customer"))
    return result


@router.post("/{ticket_id}/messages", response_model=TicketMessageOut, status_code=status.HTTP_201_CREATED)
async def post_message(
    ticket_id: str,
    payload: TicketMessageCreateInput,
    current_user: dict = Depends(get_current_user)
):
    """Post a reply message in support ticket threads."""
    result = await services.post_ticket_message(
        ticket_id=ticket_id,
        user_id=current_user["id"],
        author_name=current_user["name"],
        role=current_user.get("role", "customer"),
        payload=payload
    )
    return result


@router.post("/{ticket_id}/assign", dependencies=[Depends(require_support)])
async def assign_ticket_handler(
    ticket_id: str,
    payload: TicketAssignInput,
    current_user: dict = Depends(get_current_user)
):
    """Staff endpoint to assign tickets to specific support agents."""
    await services.assign_ticket(ticket_id, payload.assignee_id, current_user["email"])
    return {"ok": True, "message": f"Ticket #{ticket_id} successfully assigned to agent {payload.assignee_id}."}


@router.post("/{ticket_id}/escalate", dependencies=[Depends(require_support)])
async def escalate_ticket_handler(
    ticket_id: str,
    payload: TicketEscalateInput,
    current_user: dict = Depends(get_current_user)
):
    """Staff endpoint to escalate ticket priorities."""
    await services.escalate_ticket(ticket_id, payload.priority, current_user["email"])
    return {"ok": True, "message": f"Ticket #{ticket_id} successfully escalated to priority {payload.priority}."}


@router.post("/{ticket_id}/close")
async def close_ticket_handler(ticket_id: str, current_user: dict = Depends(get_current_user)):
    """Mark support ticket status as closed."""
    await services.close_ticket(
        ticket_id=ticket_id,
        user_id=current_user["id"],
        role=current_user.get("role", "customer"),
        actor_email=current_user["email"]
    )
    return {"ok": True, "message": f"Ticket #{ticket_id} marked as closed."}
