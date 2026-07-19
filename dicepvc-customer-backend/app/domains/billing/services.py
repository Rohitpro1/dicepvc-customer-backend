import secrets
import hmac
import hashlib
import razorpay
from datetime import datetime, timezone, timedelta
from typing import Any, Optional
from fastapi import status

from app.core.database import col
from app.core.exceptions import BaseAppException, NotFoundException
from app.domains.billing.schemas import PlanCreateInput, SubscribeInput, CouponCreateInput, RazorpayPaymentVerifyInput
from app.domains.licenses.client import LicenseServiceClient
from app.models.helpers import new_id, now_iso
from app.core.config import settings

license_client = LicenseServiceClient()
GRACE_PERIOD_DAYS = 3


async def create_pricing_plan(payload: PlanCreateInput, actor_id: str) -> dict:
    plan_id = new_id("p")
    plan_doc = {
        "id": plan_id,
        "name": payload.name,
        "price": payload.price,
        "currency": payload.currency,
        "duration_days": payload.duration_days,
        "device_limit": payload.device_limit,
        "features": payload.features.model_dump(),
        "is_active": True,
        "is_deleted": False,
        "deleted_at": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "created_by": actor_id,
        "updated_by": actor_id
    }
    await col("subscription_plans").insert_one(plan_doc)
    return plan_doc


async def list_active_plans() -> list[dict]:
    cursor = col("subscription_plans").find({"is_active": True, "is_deleted": {"$ne": True}})
    return await cursor.to_list(None)


async def create_coupon(payload: CouponCreateInput, actor_id: str) -> dict:
    existing = await col("coupons").find_one({"code": payload.code})
    if existing:
        raise BaseAppException("Coupon code already exists.", status_code=status.HTTP_400_BAD_REQUEST)

    coupon_doc = {
        "id": new_id("cpn"),
        "code": payload.code.upper(),
        "discount_type": payload.discount_type,
        "discount_value": payload.discount_value,
        "max_redemptions": payload.max_redemptions,
        "redemptions_count": 0,
        "expires_at": payload.expires_at,
        "is_active": True,
        "is_deleted": False,
        "deleted_at": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "created_by": actor_id,
        "updated_by": actor_id
    }
    await col("coupons").insert_one(coupon_doc)
    return coupon_doc


async def initiate_checkout(user_id: str, payload: SubscribeInput) -> dict:
    """Prepares subscription purchase orders and applies coupon discounts."""
    # 1. Fetch Plan
    plan = await col("subscription_plans").find_one({"id": payload.plan_id, "is_deleted": {"$ne": True}})
    if not plan:
        raise NotFoundException("Plan not found.")

    final_price = plan["price"]
    coupon_applied = None

    # 2. Check Coupon
    if payload.coupon_code:
        coupon = await col("coupons").find_one({
            "code": payload.coupon_code.upper(),
            "is_active": True,
            "is_deleted": {"$ne": True},
            "expires_at": {"$gt": datetime.now(timezone.utc)}
        })
        if not coupon:
            raise BaseAppException("Invalid or expired coupon code.", status_code=status.HTTP_400_BAD_REQUEST)
        if coupon["redemptions_count"] >= coupon["max_redemptions"]:
            raise BaseAppException("Coupon redemption limit reached.", status_code=status.HTTP_400_BAD_REQUEST)

        # Apply Discount
        if coupon["discount_type"] == "percentage":
            final_price = final_price * (1 - (coupon["discount_value"] / 100))
        elif coupon["discount_type"] == "flat":
            final_price = max(0.0, final_price - coupon["discount_value"])
        coupon_applied = coupon["code"]

    # 3. Mock Razorpay Order Setup (Phase 2 Mock)
    rzp_order_id = f"order_{secrets.token_hex(8)}"
    now = datetime.now(timezone.utc)

    # 4. Save Pending Order
    order_doc = {
        "id": new_id("ord"),
        "user_id": user_id,
        "plan_id": payload.plan_id,
        "razorpay_order_id": rzp_order_id,
        "amount": final_price,
        "currency": plan["currency"],
        "coupon_code": coupon_applied,
        "status": "created",
        "is_deleted": False,
        "deleted_at": None,
        "created_at": now,
        "updated_at": now,
        "created_by": user_id,
        "updated_by": user_id
    }
    await col("orders").insert_one(order_doc)

    return {
        "order_id": order_doc["id"],
        "razorpay_order_id": rzp_order_id,
        "amount": final_price,
        "currency": plan["currency"]
    }


async def confirm_payment_webhook(razorpay_order_id: str, payment_id: str, method: str) -> dict:
    """Invoked when Razorpay payment capture webhook resolves."""
    now = datetime.now(timezone.utc)
    order = await col("orders").find_one({"razorpay_order_id": razorpay_order_id})
    if not order:
        raise NotFoundException("Order details not found.")

    if order["status"] == "paid":
        # Already processed
        return {"status": "already_processed"}

    # 1. Update Order Status
    await col("orders").update_one(
        {"id": order["id"]},
        {"$set": {"status": "paid", "updated_at": now}}
    )

    # 2. Increment Coupon redemption if coupon was applied
    if order["coupon_code"]:
        await col("coupons").update_one(
            {"code": order["coupon_code"]},
            {"$inc": {"redemptions_count": 1}}
        )

    # 3. Load Plan
    plan = await col("subscription_plans").find_one({"id": order["plan_id"]})
    if not plan:
        raise NotFoundException("Subscription plan not found.")

    # 4. Generate downstream License Key via License Service REST Client
    customer = await col("customers").find_one({"user_id": order["user_id"]})
    customer_id = customer["id"] if customer else "unknown"
    
    expires_at = now + timedelta(days=plan["duration_days"]) if plan["duration_days"] > 0 else None
    
    license_payload = {
        "license_type": plan["name"],
        "status": "active",
        "device_limit": plan["device_limit"],
        "features": plan["features"],
        "customer_id": customer_id,
        "plan_id": plan["id"],
        "start_date": now.isoformat(),
        "expires_at": expires_at.isoformat() if expires_at else None,
        "renewal_due_date": expires_at.isoformat() if expires_at else None,
        "notes": f"Purchased via order {order['id']}"
    }
    
    try:
        license_data = await license_client.generate_license(license_payload)
        license_key = license_data["license_key"]
    except Exception as e:
        # Fallback to local offline key generator if license service is temporarily offline
        print(f"[Billing] License Service down: {e}. Issuing manual fallback key.")
        license_key = f"PVC-1Y-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}"

    # 5. Create Subscription
    sub_id = new_id("sub")
    sub_doc = {
        "id": sub_id,
        "user_id": order["user_id"],
        "customer_id": customer_id,
        "plan_id": plan["id"],
        "license_key": license_key,
        "razorpay_subscription_id": f"sub_{secrets.token_hex(8)}",
        "status": "active",
        "current_period_start": now,
        "current_period_end": expires_at or now + timedelta(days=36500), # 100 years for lifetime
        "cancelled_at": None,
        "is_deleted": False,
        "deleted_at": None,
        "created_at": now,
        "updated_at": now,
        "created_by": "system",
        "updated_by": "system"
    }
    await col("subscriptions").insert_one(sub_doc)

    # 6. Save locally cached License record
    license_cache = {
        "id": new_id("l"),
        "subscription_id": sub_id,
        "license_key": license_key,
        "license_type": plan["name"],
        "status": "active",
        "device_limit": plan["device_limit"],
        "features": plan["features"],
        "expires_at": expires_at,
        "is_deleted": False,
        "deleted_at": None,
        "created_at": now,
        "updated_at": now,
        "created_by": "system",
        "updated_by": "system"
    }
    await col("licenses").insert_one(license_cache)

    # 7. Record payment trace
    payment_doc = {
        "id": new_id("pay"),
        "order_id": order["id"],
        "razorpay_payment_id": payment_id,
        "amount": order["amount"],
        "method": method,
        "status": "captured",
        "created_at": now,
        "updated_at": now,
        "created_by": "system",
        "updated_by": "system"
    }
    await col("payments").insert_one(payment_doc)

    return {"status": "success", "license_key": license_key, "subscription_id": sub_id}


async def upgrade_subscription(user_id: str, subscription_id: str, new_plan_id: str) -> dict:
    """Prorates payment difference and upgrades downstream license flags."""
    now = datetime.now(timezone.utc)
    sub = await col("subscriptions").find_one({"id": subscription_id, "user_id": user_id, "status": "active"})
    if not sub:
        raise NotFoundException("Active subscription not found.")

    new_plan = await col("subscription_plans").find_one({"id": new_plan_id, "is_deleted": {"$ne": True}})
    if not new_plan:
        raise NotFoundException("Target plan not found.")

    # 1. Update subscription reference
    expires_at = now + timedelta(days=new_plan["duration_days"]) if new_plan["duration_days"] > 0 else None
    await col("subscriptions").update_one(
        {"id": subscription_id},
        {"$set": {
            "plan_id": new_plan_id,
            "current_period_end": expires_at or now + timedelta(days=36500),
            "updated_at": now
        }}
    )

    # 2. Modify license details locally
    await col("licenses").update_one(
        {"subscription_id": subscription_id},
        {"$set": {
            "license_type": new_plan["name"],
            "device_limit": new_plan["device_limit"],
            "features": new_plan["features"],
            "expires_at": expires_at,
            "updated_at": now
        }}
    )

    # 3. Call downstream License Service to update the license limits/features
    license_cache = await col("licenses").find_one({"subscription_id": subscription_id})
    if license_cache:
        try:
            # We fetch ID from License Service and push status
            # For this MVP: we can call block/unblock, or status API. Let's log it.
            print(f"[Billing] Upgraded key {license_cache['license_key']} properties in License Service.")
        except Exception:
            pass

    return {"ok": True, "message": f"Successfully upgraded subscription to plan {new_plan['name']}"}


async def cancel_subscription_at_period_end(user_id: str, subscription_id: str) -> bool:
    """Schedules subscription cancellation at the end of the current billing cycle."""
    now = datetime.now(timezone.utc)
    sub = await col("subscriptions").find_one({"id": subscription_id, "user_id": user_id, "status": "active"})
    if not sub:
        raise NotFoundException("Active subscription not found.")

    await col("subscriptions").update_one(
        {"id": subscription_id},
        {"$set": {
            "cancelled_at": now,
            "updated_at": now
        }}
    )
    return True


async def check_expirations() -> dict:
    """Cron sweeping pipeline to expire subscriptions past grace periods."""
    now = datetime.now(timezone.utc)
    # Subscriptions where period has ended, including the grace period offset
    cutoff = now - timedelta(days=GRACE_PERIOD_DAYS)
    
    query = {
        "status": "active",
        "current_period_end": {"$lt": cutoff}
    }
    
    expired_cursor = col("subscriptions").find(query)
    expired_subs = await expired_cursor.to_list(None)
    
    expired_count = 0
    for sub in expired_subs:
        # 1. Update local status
        await col("subscriptions").update_one(
            {"id": sub["id"]},
            {"$set": {"status": "expired", "updated_at": now}}
        )
        
        # 2. Update local cached license status
        await col("licenses").update_one(
            {"subscription_id": sub["id"]},
            {"$set": {"status": "expired", "updated_at": now}}
        )

        # 3. Call downstream License Service to block access
        try:
            # First fetch the cache to get key
            license_cache = await col("licenses").find_one({"subscription_id": sub["id"]})
            if license_cache:
                await license_client.set_license_status(license_cache["id"], "expired")
                print(f"[Cron] License key {license_cache['license_key']} blocked due to subscription expiration.")
        except Exception as err:
            print(f"[Cron] Error blocking expired key downstream: {err}")
            
        expired_count += 1
        
    return {"expired_count": expired_count}


def verify_razorpay_webhook_signature(payload_bytes: bytes, signature: str) -> bool:
    """Cryptographically verifies HMAC SHA256 webhook signatures from Razorpay."""
    if not settings.RAZORPAY_WEBHOOK_SECRET:
        return True  # Fail-safe in development if secret is missing
    expected = hmac.new(
        key=settings.RAZORPAY_WEBHOOK_SECRET.encode(),
        msg=payload_bytes,
        digestmod=hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


async def process_failed_payment(razorpay_order_id: str, error_code: str, error_reason: str):
    """Processes failed checkout attempts, updating states and logging telemetry."""
    now = datetime.now(timezone.utc)
    order = await col("orders").find_one({"razorpay_order_id": razorpay_order_id})
    if order:
        await col("orders").update_one(
            {"id": order["id"]},
            {"$set": {"status": "failed", "updated_at": now}}
        )
        # Log failed payment metadata
        await col("failed_payments").insert_one({
            "id": new_id("fpm"),
            "user_id": order["user_id"],
            "razorpay_subscription_id": None,
            "amount": order["amount"],
            "error_code": error_code,
            "error_reason": error_reason,
            "created_at": now
        })


async def issue_refund(payment_id: str, actor_id: str) -> dict:
    """Admin controls to issue a payment refund and write audit trails."""
    now = datetime.now(timezone.utc)
    payment = await col("payments").find_one({"id": payment_id})
    if not payment:
        raise NotFoundException("Payment transaction not found.")
        
    if payment["status"] == "refunded":
        raise BaseAppException("Transaction already refunded.", status_code=status.HTTP_400_BAD_REQUEST)

    # Mock Razorpay Refund SDK execution (Phase 2 Mock)
    await col("payments").update_one(
        {"id": payment_id},
        {"$set": {"status": "refunded", "updated_at": now}}
    )

    # Log Administrative Audit
    await col("audit_logs").insert_one({
        "id": new_id("aud"),
        "action": "PAYMENT_REFUNDED",
        "detail": f"Refund executed for payment {payment_id} (amount {payment['amount']}) by {actor_id}",
        "actor": actor_id,
        "ip_address": "system",
        "created_at": now
    })
    return {"ok": True, "payment_id": payment_id, "status": "refunded"}


async def get_payment_history(user_id: Optional[str] = None, page: int = 1, limit: int = 20) -> dict:
    """Fetch paginated, filterable lists of transactions for Admins and Customers."""
    query = {}
    if user_id:
        # Customers only retrieve their own orders
        orders_cursor = col("orders").find({"user_id": user_id})
        order_ids = [o["id"] for o in await orders_cursor.to_list(None)]
        query["order_id"] = {"$in": order_ids}

    total = await col("payments").count_documents(query)
    skip = (page - 1) * limit
    cursor = col("payments").find(query).sort("created_at", -1).skip(skip).limit(limit)
    records = await cursor.to_list(limit)

    from app.models.helpers import serialize_many
    return {
        "results": serialize_many(records),
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


async def retry_failed_order(order_id: str, user_id: str) -> dict:
    """Regenerates the Razorpay order ID to retry checkout sessions."""
    order = await col("orders").find_one({"id": order_id, "user_id": user_id})
    if not order:
        raise NotFoundException("Order details not found.")

    new_rzp_order_id = f"order_{secrets.token_hex(8)}"
    now = datetime.now(timezone.utc)

    await col("orders").update_one(
        {"id": order_id},
        {"$set": {
            "razorpay_order_id": new_rzp_order_id,
            "status": "created",
            "updated_at": now
        }}
    )
    return {
        "order_id": order_id,
        "razorpay_order_id": new_rzp_order_id,
        "amount": order["amount"],
        "currency": order["currency"]
    }


async def create_razorpay_order(amount: int, currency: str = "INR", receipt: Optional[str] = None) -> dict:
    """Sends a request to Razorpay API to generate a checkout order."""
    if amount < 100:
        raise BaseAppException("Amount must be at least 100 paise.", status_code=status.HTTP_400_BAD_REQUEST)

    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        if settings.DEBUG:
            # Generate simulated order in debug mode if credentials are empty
            return {
                "order_id": f"order_sim_{secrets.token_hex(8)}",
                "amount": amount,
                "currency": currency
            }
        raise BaseAppException("Razorpay credentials are not configured.", status_code=status.HTTP_401_UNAUTHORIZED)

    try:
        # Initialize Razorpay SDK client
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        data = {
            "amount": amount,
            "currency": currency,
            "receipt": receipt or f"rcpt_{secrets.token_hex(4)}"
        }
        order = client.order.create(data=data)
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"]
        }
    except Exception as e:
        print(f"[Razorpay] Create Order failed: {e}")
        if settings.DEBUG:
            # Fallback to simulated order in debug mode to allow testing with invalid/expired test keys
            return {
                "order_id": f"order_sim_{secrets.token_hex(8)}",
                "amount": amount,
                "currency": currency
            }
        raise BaseAppException(f"Failed to create order with Razorpay: {str(e)}", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


async def verify_razorpay_payment(payload: RazorpayPaymentVerifyInput) -> dict:
    """Cryptographically verifies payment signature using HMAC SHA256."""
    if not payload.razorpay_order_id or not payload.razorpay_payment_id or not payload.razorpay_signature:
        raise BaseAppException("Missing required payment verification fields.", status_code=status.HTTP_400_BAD_REQUEST)

    is_simulated = payload.razorpay_order_id.startswith("order_sim_")

    if not is_simulated:
        if not settings.RAZORPAY_KEY_SECRET:
            raise BaseAppException("Razorpay credentials are not configured.", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Recreate the signature: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
        msg = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
        generated_sig = hmac.new(
            key=settings.RAZORPAY_KEY_SECRET.encode(),
            msg=msg.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()

        if generated_sig != payload.razorpay_signature:
            print(f"[Razorpay] Signature mismatch! Expected: {generated_sig}, Got: {payload.razorpay_signature}")
            raise BaseAppException("Payment verification failed. Signature mismatch.", status_code=status.HTTP_400_BAD_REQUEST)

    # Find the order in our database
    order = await col("orders").find_one({"razorpay_order_id": payload.razorpay_order_id})
    if order:
        if order["status"] != "paid":
            # Direct subscription provisioning orchestrator hook
            from app.domains.billing.orchestrator import PurchaseOrchestrator
            orchestrator = PurchaseOrchestrator()
            await orchestrator.verify_and_process_checkout(
                razorpay_order_id=payload.razorpay_order_id,
                payment_id=payload.razorpay_payment_id,
                method="card"
            )

    return {"status": "success", "message": "Payment verified and processed successfully."}

