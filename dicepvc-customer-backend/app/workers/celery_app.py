from celery import Celery
from app.core.config import settings

# Initialize Celery app
celery_app = Celery(
    "dicepvc_workers",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# Auto-discover tasks from worker modules
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

if settings.REDIS_URL.startswith("rediss://"):
    import ssl
    celery_app.conf.update(
        broker_use_ssl={"ssl_cert_reqs": ssl.CERT_NONE},
        redis_backend_use_ssl={"ssl_cert_reqs": ssl.CERT_NONE}
    )

# Production Celery tasks
@celery_app.task(bind=True, name="send_transactional_email", max_retries=5)
def send_transactional_email(self, to_email: str, subject: str, template_name: str, context: dict):
    """Asynchronous worker to render templates, dispatch SMTP, and track logs with retries."""
    import asyncio
    from datetime import datetime, timezone
    from app.core.email import render_template, send_smtp_email
    from app.core.database import connect_to_mongo, close_mongo_connection, col
    from app.models.helpers import new_id

    # Render HTML content synchronously
    try:
        html_content = render_template(template_name, context)
    except Exception as render_err:
        print(f"[Worker] Rendering failed for {template_name}: {render_err}")
        return {"status": "failed", "error": f"RenderError: {render_err}"}

    async def log_delivery(status: str, error: str = None):
        await connect_to_mongo()
        # Save or update delivery tracker record in email_logs collection
        await col("email_logs").insert_one({
            "id": new_id("mlg"),
            "to_email": to_email,
            "subject": subject,
            "template_name": template_name,
            "status": status,
            "attempt": self.request.retries + 1,
            "error_message": error,
            "created_at": datetime.now(timezone.utc)
        })
        await close_mongo_connection()

    try:
        # Dispatch SMTP message
        send_smtp_email(to_email, subject, html_content)
        # Log successful delivery
        asyncio.run(log_delivery("delivered"))
        return {"status": "sent", "attempt": self.request.retries + 1}
    except Exception as send_err:
        print(f"[Worker] SMTP send failed: {send_err}")
        # Log failed attempt
        asyncio.run(log_delivery("failed", str(send_err)))
        
        # Exponential backoff retry loop
        countdown = 60 * (2 ** self.request.retries)
        raise self.retry(exc=send_err, countdown=countdown)


@celery_app.task(name="sync_license_metrics")
def sync_license_metrics():
    """Recurring cron job to fetch device usage stats from License Service."""
    import asyncio
    from app.domains.admin.sync_service import perform_license_synchronization
    from app.core.database import connect_to_mongo, close_mongo_connection
    
    async def run():
        await connect_to_mongo()
        result = await perform_license_synchronization()
        await close_mongo_connection()
        return result

    try:
        result = asyncio.run(run())
    except Exception as e:
        print(f"[Worker] License sync failed: {e}")
        result = {"error": str(e)}
    return result


@celery_app.task(name="sweep_expired_subscriptions")
def sweep_expired_subscriptions():
    """Sweeps for expired subscriptions past grace periods and disables licenses."""
    import asyncio
    from app.domains.billing.services import check_expirations
    from app.core.database import connect_to_mongo, close_mongo_connection
    
    async def run():
        await connect_to_mongo()
        result = await check_expirations()
        await close_mongo_connection()
        return result

    try:
        # Standard async runtime initialization
        result = asyncio.run(run())
    except Exception as e:
        print(f"[Worker] Expiration sweep failed: {e}")
        result = {"error": str(e)}
    return result


@celery_app.task(bind=True, name="process_webhook_event", max_retries=3)
def process_webhook_event(self, event_id: str, payload: dict):
    """Processes verified Razorpay webhook payload asynchronously in the background, with retries on failure."""
    import asyncio
    from datetime import datetime, timezone
    from app.core.database import connect_to_mongo, close_mongo_connection, col
    from app.domains.billing.orchestrator import PurchaseOrchestrator

    async def run():
        await connect_to_mongo()
        
        event = payload.get("event")
        entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = entity.get("order_id")
        payment_id = entity.get("id")
        method = entity.get("method", "card")

        try:
            if event in ("payment.captured", "subscription.charged"):
                if order_id and payment_id:
                    orchestrator = PurchaseOrchestrator()
                    await orchestrator.verify_and_process_checkout(order_id, payment_id, method)
            elif event == "payment.failed":
                error_code = entity.get("error_code", "unknown")
                error_desc = entity.get("error_description", "No details provided")
                await col("failed_payments").insert_one({
                    "event_id": event_id,
                    "order_id": order_id,
                    "payment_id": payment_id,
                    "error_code": error_code,
                    "error_description": error_desc,
                    "created_at": datetime.now(timezone.utc)
                })
            elif event == "refund.processed":
                refund_entity = payload.get("payload", {}).get("refund", {}).get("entity", {})
                original_payment_id = refund_entity.get("payment_id")
                if original_payment_id:
                    await col("payments").update_one(
                        {"razorpay_payment_id": original_payment_id},
                        {"$set": {"status": "refunded", "updated_at": datetime.now(timezone.utc)}}
                    )

            # Update webhook trace to processed
            await col("payment_webhooks").update_one(
                {"event_id": event_id},
                {"$set": {"status": "processed", "processed_at": datetime.now(timezone.utc)}}
            )
            await close_mongo_connection()
            return {"status": "success"}
        except Exception as err:
            print(f"[Worker] Webhook processing failed: {err}")
            # Mark webhook trace as failed
            await col("payment_webhooks").update_one(
                {"event_id": event_id},
                {"$set": {"status": "failed", "error": str(err), "processed_at": datetime.now(timezone.utc)}}
            )
            await close_mongo_connection()
            raise err

    try:
        asyncio.run(run())
    except Exception as e:
        # Exponential backoff retry
        countdown = 30 * (2 ** self.request.retries)
        raise self.retry(exc=e, countdown=countdown)
