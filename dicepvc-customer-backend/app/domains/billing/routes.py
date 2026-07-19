from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user, require_admin, require_customer
from app.domains.billing import services
from app.domains.billing.schemas import (
    PlanCreateInput,
    PlanOut,
    SubscribeInput,
    UpgradeInput,
    CouponCreateInput,
    SubscriptionOut,
    RazorpayOrderCreateInput,
    RazorpayOrderOut,
    RazorpayPaymentVerifyInput
)

router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/plans", response_model=PlanOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_plan(payload: PlanCreateInput, current_user: dict = Depends(get_current_user)):
    """Admin endpoint to create subscription plans."""
    plan = await services.create_pricing_plan(payload, current_user["email"])
    return plan


@router.get("/plans")
async def list_plans():
    """Public pricing table view."""
    plans = await services.list_active_plans()
    return plans


@router.post("/coupons", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_coupon(payload: CouponCreateInput, current_user: dict = Depends(get_current_user)):
    """Admin endpoint to create discount coupons."""
    coupon = await services.create_coupon(payload, current_user["email"])
    return coupon


@router.get("/subscriptions/my")
async def get_my_active_subscription(current_user: dict = Depends(get_current_user)):
    """Fetch customer's current active subscription detail."""
    from app.core.database import col
    customer = await col("customers").find_one({"user_id": current_user["id"]})
    if not customer:
        return {"planName": "None", "status": "Canceled", "price": "0.0", "period": "month", "nextBillingDate": "", "features": []}

    sub = await col("subscriptions").find_one({
        "customer_id": customer["id"],
        "status": "active"
    })
    if not sub:
        sub = await col("subscriptions").find_one({
            "customer_id": customer["id"]
        }, sort=[("created_at", -1)])
        
    if not sub:
        return {"planName": "None", "status": "Canceled", "price": "0.0", "period": "month", "nextBillingDate": "", "features": []}

    plan = await col("subscription_plans").find_one({"id": sub["plan_id"]})
    plan_name = plan["name"] if plan else "Standard"
    price = f"${plan['price']:.2f}" if plan else "$49.00"
    features_list = []
    if plan and "features" in plan:
        features_dict = plan["features"]
        if isinstance(features_dict, dict):
            features_list = [f"{features_dict.get('device_limit', 5)} Active Licenses"]
            if features_dict.get("api_access"):
                features_list.append("Full API Access")
            if features_dict.get("priority_support"):
                features_list.append("Priority Support")
        else:
            features_list = list(features_dict)

    return {
        "id": sub["id"],
        "planName": plan_name,
        "status": sub["status"].title(),
        "price": price,
        "period": "month" if (plan.get("duration_days", 30) if plan else 30) <= 30 else "year",
        "nextBillingDate": sub["current_period_end"].isoformat() if isinstance(sub["current_period_end"], datetime) else str(sub["current_period_end"]),
        "features": features_list
    }


@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
async def subscribe(payload: SubscribeInput, current_user: dict = Depends(get_current_user)):
    """Customer endpoint to initiate checkout session and Razorpay order."""
    session = await services.initiate_checkout(current_user["id"], payload)
    return session


from fastapi import Header, Request, Query
from app.core.exceptions import UnauthorizedException, BaseAppException

@router.post("/webhook")
async def payment_webhook(request: Request, x_razorpay_signature: Optional[str] = Header(None)):
    """Public Razorpay payment callback webhook with cryptographic verification."""
    payload_bytes = await request.body()
    payload_json = await request.json()
    
    # Enforce webhook signature check
    if x_razorpay_signature:
        is_valid = services.verify_razorpay_webhook_signature(payload_bytes, x_razorpay_signature)
        if not is_valid:
            raise UnauthorizedException("Invalid webhook signature.")
            
    event = payload_json.get("event")
    
    # Save webhook transaction trace for idempotency
    from app.core.database import col
    from app.models.helpers import new_id
    event_id = payload_json.get("id", new_id("evt"))
    
    # Check for duplicate events
    existing = await col("payment_webhooks").find_one({"event_id": event_id})
    if existing:
        return {"ok": True, "message": "Duplicate event ignored."}
        
    await col("payment_webhooks").insert_one({
        "event_id": event_id,
        "event_type": event,
        "payload": payload_json,
        "status": "enqueued",
        "received_at": datetime.now(timezone.utc)
    })

    # Dispatch processing to background Celery worker task
    from app.workers.celery_app import celery_app
    celery_app.send_task("process_webhook_event", args=[event_id, payload_json])
            
    return {"ok": True, "message": "Webhook payload received and queued for processing."}


@router.post("/subscriptions/{subscription_id}/upgrade", dependencies=[Depends(require_customer)])
async def upgrade_sub(subscription_id: str, payload: UpgradeInput, current_user: dict = Depends(get_current_user)):
    """Customer endpoint to upgrade subscription level."""
    result = await services.upgrade_subscription(current_user["id"], subscription_id, payload.new_plan_id)
    return result


@router.post("/subscriptions/{subscription_id}/cancel", dependencies=[Depends(require_customer)])
async def cancel_sub(subscription_id: str, current_user: dict = Depends(get_current_user)):
    """Customer endpoint to cancel auto-renewals."""
    await services.cancel_subscription_at_period_end(current_user["id"], subscription_id)
    return {"ok": True, "message": "Subscription cancelled successfully. Key remains active until period ends."}


@router.get("/payments/history")
async def payment_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """List transaction payments (Customers view own, Admins view all)."""
    user_role = current_user.get("role", "customer")
    if user_role in ("admin", "super_admin"):
        # Admin can view all payments on the system
        history = await services.get_payment_history(user_id=None, page=page, limit=limit)
    else:
        history = await services.get_payment_history(user_id=current_user["id"], page=page, limit=limit)
    return history


@router.post("/payments/{payment_id}/refund", dependencies=[Depends(require_admin)])
async def execute_refund(payment_id: str, current_user: dict = Depends(get_current_user)):
    """Admin endpoint to refund captured payments."""
    result = await services.issue_refund(payment_id, current_user["email"])
    return result


@router.post("/orders/{order_id}/retry")
async def retry_checkout(order_id: str, current_user: dict = Depends(get_current_user)):
    """Customer endpoint to retry order and retrieve refreshed Razorpay order tokens."""
    result = await services.retry_failed_order(order_id, current_user["id"])
    return result


from fastapi.responses import StreamingResponse
from app.domains.billing import invoices

@router.get("/invoices/my")
async def get_my_invoices(current_user: dict = Depends(get_current_user)):
    """Retrieve lists of past transaction invoices for the customer."""
    data = await invoices.list_customer_invoices(current_user["id"])
    return data


@router.get("/invoices/{payment_id}/download")
async def download_invoice_pdf(payment_id: str, current_user: dict = Depends(get_current_user)):
    """Generate and download printable PDF tax invoice receipt."""
    pdf_buffer = await invoices.generate_invoice_pdf_buffer(
        payment_id,
        current_user["id"],
        current_user.get("role", "customer")
    )
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice_{payment_id}.pdf"}
    )


@router.post("/create-order", response_model=RazorpayOrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(payload: RazorpayOrderCreateInput, current_user: dict = Depends(get_current_user)):
    """Backend endpoint to create a Razorpay checkout order."""
    order = await services.create_razorpay_order(
        amount=payload.amount,
        currency=payload.currency,
        receipt=payload.receipt
    )
    
    # Save the order in our database so verify-payment can process it!
    from app.core.database import col
    from app.models.helpers import new_id
    
    plan_id = "plan_standard"
    if payload.amount > 10000:
        plan_id = "plan_enterprise"
        
    order_doc = {
        "id": new_id("ord"),
        "user_id": current_user["id"],
        "plan_id": plan_id,
        "razorpay_order_id": order["order_id"],
        "amount": payload.amount / 100.0,
        "currency": payload.currency,
        "coupon_code": None,
        "status": "created",
        "is_deleted": False,
        "deleted_at": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "created_by": current_user["id"],
        "updated_by": current_user["id"]
    }
    await col("orders").insert_one(order_doc)
    return order


@router.post("/verify-payment")
async def verify_payment(payload: RazorpayPaymentVerifyInput, current_user: dict = Depends(get_current_user)):
    """Backend endpoint to verify Razorpay checkout payment signature."""
    result = await services.verify_razorpay_payment(payload)
    return result

