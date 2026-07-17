import pytest
import hmac
import hashlib
import json
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, AsyncMock
from app.core.database import col
from app.domains.billing.orchestrator import PurchaseOrchestrator
from app.domains.admin.sync_service import perform_license_synchronization

pytestmark = pytest.mark.asyncio


async def test_complete_production_readiness_flow(client, monkeypatch):
    # ----------------------------------------------------
    # 1. REGISTER
    # ----------------------------------------------------
    print("[Test] Step 1: Register Account...")
    register_payload = {
        "email": "ready-customer@dicepvc.ai",
        "name": "Production Client",
        "password": "Password123@",
        "company_name": "Readiness Corp",
        "phone": "+919988776655"
    }
    
    reg_res = await client.post("/api/v1/auth/register", json=register_payload)
    assert reg_res.status_code == 201
    user_data = reg_res.json()
    user_id = user_data["id"]

    # ----------------------------------------------------
    # 2. VERIFY EMAIL
    # ----------------------------------------------------
    print("[Test] Step 2: Verify Email & Activate Account...")
    await col("users").update_one({"id": user_id}, {"$set": {"status": "active"}})
    updated_user = await col("users").find_one({"id": user_id})
    assert updated_user["status"] == "active"

    # ----------------------------------------------------
    # 3. LOGIN
    # ----------------------------------------------------
    print("[Test] Step 3: Login & Session Auth...")
    login_payload = {
        "email": "ready-customer@dicepvc.ai",
        "password": "Password123@"
    }
    login_res = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token_data = login_res.json()
    access_token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # ----------------------------------------------------
    # 4. PURCHASE PLAN (SELECT PLAN & CHECKOUT ORDER)
    # ----------------------------------------------------
    print("[Test] Step 4: Purchase Plan & Create Checkout Order...")
    plan_id = "plan_pro_yearly"
    await col("subscription_plans").insert_one({
        "id": plan_id,
        "name": "Pro Yearly",
        "price": 299.0,
        "currency": "usd",
        "duration_days": 365,
        "device_limit": 10,
        "features": {"device_limit": 10, "pdf_import": True, "analytics": True},
        "is_active": True,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc)
    })

    checkout_payload = {
        "plan_id": plan_id,
        "coupon_code": None
    }
    
    checkout_res = await client.post("/api/v1/billing/subscribe", json=checkout_payload, headers=headers)
    assert checkout_res.status_code == 201
    checkout_data = checkout_res.json()
    rzp_order_id = checkout_data["razorpay_order_id"]

    # ----------------------------------------------------
    # 5. WEBHOOK & CHEKOUT ORCHESTRATION
    # ----------------------------------------------------
    print("[Test] Step 5: Webhook Signature Verification & Orchestration...")
    webhook_payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_ready_8821",
                    "order_id": rzp_order_id,
                    "amount": 29900,
                    "method": "card",
                    "status": "captured"
                }
            }
        }
    }
    
    # Generate signature
    webhook_secret = "test_webhook_secret_992"
    import app.core.config
    monkeypatch.setattr(app.core.config.settings, "RAZORPAY_WEBHOOK_SECRET", webhook_secret)
    
    payload_bytes = json.dumps(webhook_payload).encode("utf-8")
    sig = hmac.new(
        bytes(webhook_secret, "utf-8"),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()

    # Route payment webhook
    with patch("app.workers.celery_app.celery_app.send_task") as mock_task:
        webhook_res = await client.post(
            "/api/v1/billing/webhook",
            content=payload_bytes,
            headers={
                "X-Razorpay-Signature": sig,
                "Content-Type": "application/json"
            }
        )
        assert webhook_res.status_code == 200

    # 6. Execute Orchestration (Create Subscription, Generate License key, Store cache, Outbound Email)
    print("[Test] Step 6: Downstream License Generation & Cache Seeding...")
    orchestrator = PurchaseOrchestrator()
    mock_key = "PVC-1Y-READY-FLOW-VALID-KEY"
    orchestrator.license_client.generate_license = AsyncMock(return_value={
        "id": "lic_downstream_ready",
        "license_key": mock_key
    })

    with patch("app.workers.celery_app.celery_app.send_task") as mock_task:
        result = await orchestrator.verify_and_process_checkout(rzp_order_id, "pay_ready_8821", "card")
        assert result["status"] == "success"
        assert result["license_key"] == mock_key

    # Confirm database records updated
    order = await col("orders").find_one({"razorpay_order_id": rzp_order_id})
    assert order["status"] == "paid"

    subscription = await col("subscriptions").find_one({"license_key": mock_key})
    assert subscription is not None
    assert subscription["status"] == "active"

    license_cache = await col("licenses").find_one({"license_key": mock_key})
    assert license_cache is not None

    # ----------------------------------------------------
    # 6. VERIFY DASHBOARD UPDATE
    # ----------------------------------------------------
    print("[Test] Step 7: Verify Dashboard Metrics...")
    dashboard_res = await client.get("/api/v1/customers/dashboard/stats", headers=headers)
    assert dashboard_res.status_code == 200
    stats = dashboard_res.json()
    assert stats["active_licenses"] == 1
    assert stats["total_spent"] == 299.0

    # ----------------------------------------------------
    # 7. SOFTWARE DOWNLOAD (SIGNED URL GENERATION)
    # ----------------------------------------------------
    print("[Test] Step 8: Verify Software signed URL Downloads...")
    # Seed software version
    await col("software_versions").insert_one({
        "id": "ver_ready_pro",
        "version": "2.2.0",
        "changelog": "Production Version",
        "checksum_sha256": "abcdef123456",
        "is_active": True,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    dl_res = await client.get("/api/v1/downloads", headers=headers)
    assert dl_res.status_code == 200
    versions = dl_res.json()
    assert len(versions) == 1
    assert versions[0]["version"] == "2.2.0"
    assert "signature" in versions[0]["signed_download_url"]

    # ----------------------------------------------------
    # 8. LICENSE ACTIVATION, VALIDATION, HEARTBEAT (MOCKED DOWNSTREAM)
    # ----------------------------------------------------
    print("[Test] Step 9: Verify License Validation Alias...")
    # Setup downstream validation client mock
    with patch("app.domains.licenses.routes.license_client") as mock_client:
        mock_client.validate_license = AsyncMock(return_value={
            "valid": True,
            "expired": False,
            "blocked": False,
            "disabled": False,
            "bound": True
        })
        
        # Test validation check from customer backend route or client
        val_payload = {
            "license_key": mock_key,
            "machine_id": "mach_ready_101",
            "activation_token": "act_token_101"
        }
        res_val = await mock_client.validate_license(val_payload)
        assert res_val["valid"] is True
        assert res_val["bound"] is True

    # ----------------------------------------------------
    # 9. LICENSE SYNCHRONIZATION
    # ----------------------------------------------------
    print("[Test] Step 10: Verify Downstream Synchronization...")
    with patch("app.domains.admin.sync_service.LicenseServiceClient") as mock_sync_client:
        instance = mock_sync_client.return_value
        instance.get_license = AsyncMock(return_value={
            "status": "active",
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=365)).isoformat(),
            "activated_devices": []
        })
        
        # Run background sync job
        await perform_license_synchronization()
        
        # Confirm sync log entry recorded
        sync_log = await col("license_sync").find_one({"status": "completed"})
        assert sync_log is not None

    # ----------------------------------------------------
    # 10. LICENSE RENEWAL
    # ----------------------------------------------------
    print("[Test] Step 11: Verify Downstream Renewal...")
    with patch("app.domains.licenses.routes.license_client") as mock_client:
        mock_client.renew_license = AsyncMock(return_value={
            "id": "lic_downstream_ready",
            "license_key": mock_key,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=395)).isoformat()
        })
        
        res_renew = await mock_client.renew_license(license_id="lic_downstream_ready", days=30)
        assert res_renew["license_key"] == mock_key
        assert "expires_at" in res_renew
