import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import Any

from app.core.database import col
from app.core.exceptions import BaseAppException, NotFoundException, ExternalServiceException
from app.domains.licenses.client import LicenseServiceClient
from app.workers.celery_app import celery_app
from app.core.config import settings
from app.models.helpers import new_id

logger = logging.getLogger("purchase_orchestrator")


class PurchaseOrchestrator:
    def __init__(self):
        self.license_client = LicenseServiceClient()

    async def verify_and_process_checkout(self, razorpay_order_id: str, payment_id: str, method: str) -> dict:
        """Orchestrates checkout payments, license issuance, and notifications with full rollback capability."""
        now = datetime.now(timezone.utc)
        
        # 1. Fetch Order
        order = await col("orders").find_one({"razorpay_order_id": razorpay_order_id})
        if not order:
            logger.error(f"[Orchestrator] Order not found for Razorpay Order ID: {razorpay_order_id}")
            raise NotFoundException("Order details not found.")
            
        if order["status"] == "paid":
            logger.info(f"[Orchestrator] Order {order['id']} already processed as paid.")
            return {"status": "already_processed", "order_id": order["id"]}

        # 2. Update order to paid (Step 1 of transaction)
        await col("orders").update_one(
            {"id": order["id"]},
            {"$set": {"status": "paid", "updated_at": now}}
        )
        logger.info(f"[Orchestrator] Step 1: Order {order['id']} updated to paid.")

        # 3. Load Plan
        plan = await col("subscription_plans").find_one({"id": order["plan_id"]})
        if not plan:
            # Rollback order status
            await col("orders").update_one({"id": order["id"]}, {"$set": {"status": "created", "updated_at": now}})
            logger.error(f"[Orchestrator] Rollback 1: Plan {order['plan_id']} not found.")
            raise NotFoundException("Subscription plan not found.")

        # 4. Generate Downstream License Key (Step 2 of transaction)
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
            "notes": f"Orchestrated via order {order['id']}"
        }

        license_id = None
        license_key = None
        try:
            license_data = await self.license_client.generate_license(license_payload)
            license_id = license_data.get("id", new_id("lic"))
            license_key = license_data["license_key"]
            logger.info(f"[Orchestrator] Step 2: Generated downstream license key: {license_key}")
        except Exception as e:
            # Rollback Step 1: Order Paid
            await col("orders").update_one({"id": order["id"]}, {"$set": {"status": "created", "updated_at": now}})
            logger.error(f"[Orchestrator] Rollback 1: License generation failed: {e}")
            raise ExternalServiceException(f"License generation failed. Transaction rolled back: {e}")

        # 5. Insert Subscription record (Step 3 of transaction)
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
            "current_period_end": expires_at or now + timedelta(days=36500),
            "cancelled_at": None,
            "is_deleted": False,
            "deleted_at": None,
            "created_at": now,
            "updated_at": now,
            "created_by": "system",
            "updated_by": "system"
        }

        try:
            await col("subscriptions").insert_one(sub_doc)
            logger.info(f"[Orchestrator] Step 3: Saved subscription record {sub_id}.")
        except Exception as sub_err:
            # Rollback Step 2: Revoke downstream license
            try:
                await self.license_client.set_license_status(license_id, "blocked")
                logger.info(f"[Orchestrator] Rollback 2: Revoked downstream license key {license_key}.")
            except Exception as rev_err:
                logger.critical(f"[Orchestrator] Critical: Failed to revoke downstream license key during rollback: {rev_err}")

            # Rollback Step 1: Restore order
            await col("orders").update_one({"id": order["id"]}, {"$set": {"status": "created", "updated_at": now}})
            logger.error(f"[Orchestrator] Rollback 1: Subscription save failed: {sub_err}")
            raise BaseAppException(f"Subscription save failed: {sub_err}")

        # 6. Insert Local License Cache record (Step 4 of transaction)
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

        try:
            await col("licenses").insert_one(license_cache)
            logger.info(f"[Orchestrator] Step 4: Saved local license cache.")
        except Exception as lic_err:
            # Rollback Step 3: Delete subscription record
            await col("subscriptions").delete_one({"id": sub_id})
            logger.info(f"[Orchestrator] Rollback 3: Removed local subscription {sub_id}.")

            # Rollback Step 2: Revoke downstream license
            try:
                await self.license_client.set_license_status(license_id, "blocked")
            except Exception as rev_err:
                logger.critical(f"[Orchestrator] Critical: Failed to revoke downstream license during rollback: {rev_err}")

            # Rollback Step 1: Restore order
            await col("orders").update_one({"id": order["id"]}, {"$set": {"status": "created", "updated_at": now}})
            logger.error(f"[Orchestrator] Rollback 1: Local license cache save failed: {lic_err}")
            raise BaseAppException(f"Local license cache save failed: {lic_err}")

        # 7. Insert Payment record (Step 5 of transaction)
        payment_id_doc = new_id("pay")
        payment_doc = {
            "id": payment_id_doc,
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
        logger.info(f"[Orchestrator] Step 5: Created payment record {payment_id_doc}.")

        # 8. Write Audit Logs (Step 6 of transaction)
        await col("audit_logs").insert_one({
            "id": new_id("aud"),
            "action": "SUBSCRIPTION_PURCHASED",
            "detail": f"Subscription {sub_id} purchased successfully (amount: {order['amount']})",
            "actor": order["user_id"],
            "ip_address": "system",
            "created_at": now
        })
        logger.info("[Orchestrator] Step 6: Logged audit transaction trail.")

        # 9. Trigger In-App Notification (Step 7 of transaction)
        await col("notifications").insert_one({
            "id": new_id("ntf"),
            "user_id": order["user_id"],
            "title": "Subscription Active",
            "message": f"Your plan {plan['name']} is active. Your key is {license_key}",
            "is_read": False,
            "is_deleted": False,
            "deleted_at": None,
            "created_at": now,
            "updated_at": now
        })
        logger.info("[Orchestrator] Step 7: Enqueued in-app notification alert.")

        # 10. Enqueue Transactional Emails (Step 8 of transaction)
        user_doc = await col("users").find_one({"id": order["user_id"]})
        if user_doc:
            # Dispatch License details email
            celery_app.send_task(
                "send_transactional_email",
                args=[
                    user_doc["email"],
                    "Your DicePVC License Details",
                    "license_details.html",
                    {
                        "license_key": license_key,
                        "plan_name": plan["name"],
                        "device_limit": plan["device_limit"],
                        "expires_at": expires_at.strftime("%Y-%m-%d") if expires_at else "Lifetime"
                    }
                ]
            )
            # Dispatch Invoice Payment receipt email
            celery_app.send_task(
                "send_transactional_email",
                args=[
                    user_doc["email"],
                    "Payment Receipt - Invoice",
                    "payment_receipt.html",
                    {
                        "invoice_id": payment_id_doc,
                        "order_id": order["id"],
                        "amount": order["amount"],
                        "currency": order["currency"],
                        "method": method,
                        "date": now.strftime("%Y-%m-%d")
                    }
                ]
            )
            logger.info("[Orchestrator] Step 8: Triggered background SMTP invoice and license email tasks.")

        return {
            "status": "success",
            "order_id": order["id"],
            "subscription_id": sub_id,
            "license_key": license_key
        }
