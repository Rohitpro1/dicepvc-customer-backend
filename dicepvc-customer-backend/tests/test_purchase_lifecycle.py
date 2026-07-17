import pytest
import hmac
import hashlib
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, AsyncMock
from app.core.database import col
from app.domains.billing.orchestrator import PurchaseOrchestrator

pytestmark = pytest.mark.asyncio


async def test_complete_purchase_and_support_lifecycle(client, monkeypatch):
    # ----------------------------------------------------
    # 1. REGISTER
    # ----------------------------------------------------
    register_payload = {
        "email": "test-buyer@dicepvc.ai",
        "name": "Test Buyer",
        "password": "Password123@",
        "company_name": "Test Labs Inc",
        "phone": "+919988776655"
    }
    
    # Mock sending verification email during registration
    with patch("app.domains.auth.services.col") as mock_auth_col:
        # Avoid real DB write failures in mock checks
        pass

    reg_res = await client.post("/api/v1/auth/register", json=register_payload)
    assert reg_res.status_code == 201
    user_data = reg_res.json()
    assert user_data["email"] == "test-buyer@dicepvc.ai"
    user_id = user_data["id"]

    # Verify customer profile provisioned in DB
    customer = await col("customers").find_one({"user_id": user_id})
    assert customer is not None
    assert customer["company_name"] == "Test Labs Inc"

    # Manually mark user status as verified/active to allow login
    await col("users").update_one({"id": user_id}, {"$set": {"status": "active"}})

    # ----------------------------------------------------
    # 2. LOGIN
    # ----------------------------------------------------
    login_payload = {
        "email": "test-buyer@dicepvc.ai",
        "password": "Password123@"
    }
    login_res = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token_data = login_res.json()
    access_token = token_data["access_token"]
    assert access_token is not None

    headers = {"Authorization": f"Bearer {access_token}"}

    # ----------------------------------------------------
    # 3. SELECT SUBSCRIPTION PLAN & INITIATE CHECKOUT
    # ----------------------------------------------------
    # Provision a standard pricing plan first
    plan_id = "plan_standard_99"
    await col("subscription_plans").insert_one({
        "id": plan_id,
        "name": "Standard Pro",
        "price": 99.0,
        "currency": "usd",
        "duration_days": 30,
        "device_limit": 5,
        "features": {"device_limit": 5, "api_access": True, "priority_support": True},
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
    assert rzp_order_id is not None

    # Verify order is created in DB
    order = await col("orders").find_one({"razorpay_order_id": rzp_order_id})
    assert order is not None
    assert order["status"] == "created"
    assert order["amount"] == 99.0

    # ----------------------------------------------------
    # 4. PAYMENT COMPLETION & WEBHOOK VERIFICATION
    # ----------------------------------------------------
    webhook_payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_mock_9918",
                    "order_id": rzp_order_id,
                    "amount": 9900,
                    "method": "card",
                    "status": "captured"
                }
            }
        }
    }

    # Generate valid signature
    webhook_secret = "test_webhook_secret_123"
    import app.core.config
    monkeypatch.setattr(app.core.config.settings, "RAZORPAY_WEBHOOK_SECRET", webhook_secret)
    
    import json
    payload_bytes = json.dumps(webhook_payload).encode("utf-8")
    sig = hmac.new(
        bytes(webhook_secret, "utf-8"),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()

    # Call webhook endpoint
    # Mock Celery send task to avoid hitting broker
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

    # ----------------------------------------------------
    # 5. EXECUTE TRANSACTION ORCHESTRATOR
    # ----------------------------------------------------
    # Simulates background processing of the captured webhook
    orchestrator = PurchaseOrchestrator()
    
    # Mock Downstream License Service call
    mock_license_key = "LIC-PRO-TEST-9921-KEY"
    orchestrator.license_client.generate_license = AsyncMock(return_value={
        "id": "lic_downstream_123",
        "license_key": mock_license_key
    })

    # Run orchestrator verification
    result = await orchestrator.verify_and_process_checkout(rzp_order_id, "pay_mock_9918", "card")
    assert result["status"] == "success"
    assert result["license_key"] == mock_license_key

    # Check updated database states
    updated_order = await col("orders").find_one({"razorpay_order_id": rzp_order_id})
    assert updated_order["status"] == "paid"

    subscription = await col("subscriptions").find_one({"customer_id": customer["id"]})
    assert subscription is not None
    assert subscription["status"] == "active"
    assert subscription["license_key"] == mock_license_key

    license_cache = await col("licenses").find_one({"subscription_id": subscription["id"]})
    assert license_cache is not None
    assert license_cache["license_key"] == mock_license_key

    # ----------------------------------------------------
    # 6. VERIFY CUSTOMER DASHBOARD
    # ----------------------------------------------------
    dashboard_res = await client.get("/api/v1/customers/dashboard/stats", headers=headers)
    assert dashboard_res.status_code == 200
    stats = dashboard_res.json()
    assert stats["active_licenses"] == 1
    assert stats["total_spent"] == 99.0

    # ----------------------------------------------------
    # 7. OPEN SUPPORT TICKET & MESSAGE THREAD
    # ----------------------------------------------------
    ticket_payload = {
        "title": "Biometric terminal calibration fail",
        "description": "Printer returns alignment errors on cards.",
        "priority": "high"
    }
    ticket_res = await client.post("/api/v1/tickets", json=ticket_payload, headers=headers)
    assert ticket_res.status_code == 201
    ticket_data = ticket_res.json()
    ticket_id = ticket_data["id"]

    # Reply to the ticket thread
    reply_payload = {
        "content": "Uploading logs for review.",
        "attachments": [
            {"filename": "logs.txt", "file_url": "https://storage.dicepvc.ai/logs.txt"}
        ]
    }
    reply_res = await client.post(f"/api/v1/tickets/{ticket_id}/messages", json=reply_payload, headers=headers)
    assert reply_res.status_code == 201
    reply_data = reply_res.json()
    assert reply_data["content"] == "Uploading logs for review."
    assert reply_data["attachments"][0]["filename"] == "logs.txt"

    # Close Ticket
    close_res = await client.post(f"/api/v1/tickets/{ticket_id}/close", headers=headers)
    assert close_res.status_code == 200
    closed_ticket = await col("support_tickets").find_one({"id": ticket_id})
    assert closed_ticket["status"] == "closed"


@pytest.mark.asyncio
async def test_razorpay_endpoints(client, monkeypatch):
    # 1. Register and login test user
    register_payload = {
        "email": "rzp-tester@dicepvc.ai",
        "name": "Rzp Tester",
        "password": "Password123@",
        "company_name": "Rzp Labs",
        "phone": "+919988776655"
    }
    reg_res = await client.post("/api/v1/auth/register", json=register_payload)
    assert reg_res.status_code == 201
    user_id = reg_res.json()["id"]
    await col("users").update_one({"id": user_id}, {"$set": {"status": "active"}})

    login_res = await client.post("/api/v1/auth/login", json={"email": "rzp-tester@dicepvc.ai", "password": "Password123@"})
    assert login_res.status_code == 200
    access_token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # 2. Test create-order (with Mocked Razorpay SDK Client)
    mock_order = {"id": "order_mock123", "amount": 5000, "currency": "INR"}
    with patch("razorpay.Client") as mock_client_class:
        mock_instance = mock_client_class.return_value
        mock_instance.order.create.return_value = mock_order

        # Call prefixed endpoint
        res = await client.post("/api/v1/billing/create-order", json={"amount": 5000}, headers=headers)
        assert res.status_code == 201
        data = res.json()
        assert data["order_id"] == "order_mock123"
        assert data["amount"] == 5000

        # Call root endpoint
        res_root = await client.post("/api/create-order", json={"amount": 5000}, headers=headers)
        assert res_root.status_code == 201
        assert res_root.json()["order_id"] == "order_mock123"

    # 3. Test verify-payment success (with valid cryptographic HMAC)
    import hmac
    import hashlib
    import app.core.config
    monkeypatch.setattr(app.core.config.settings, "RAZORPAY_KEY_SECRET", "zQdMtQR8FYDllVmiSmSdr9Lz")
    
    order_id = "order_mock123"
    payment_id = "pay_mock123"
    msg = f"{order_id}|{payment_id}"
    valid_sig = hmac.new(
        key=b"zQdMtQR8FYDllVmiSmSdr9Lz",
        msg=msg.encode(),
        digestmod=hashlib.sha256
    ).hexdigest()

    # Pre-insert a subscription plan and pending order to check transition
    plan_id = "plan_standard_99"
    await col("subscription_plans").insert_one({
        "id": plan_id,
        "name": "Standard Pro",
        "price": 99.0,
        "currency": "usd",
        "duration_days": 30,
        "device_limit": 5,
        "features": {"device_limit": 5, "api_access": True, "priority_support": True},
        "is_active": True,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc)
    })

    await col("orders").insert_one({
        "id": "ord_1",
        "user_id": user_id,
        "plan_id": plan_id,
        "razorpay_order_id": order_id,
        "amount": 99.0,
        "currency": "usd",
        "status": "created",
        "created_at": datetime.now(timezone.utc)
    })

    # Mock LicenseServiceClient so subscription flow completes
    with patch("app.domains.billing.orchestrator.LicenseServiceClient") as mock_license_class:
        mock_lic_instance = mock_license_class.return_value
        mock_lic_instance.generate_license = AsyncMock(return_value={"id": "lic_1", "license_key": "MOCK-KEY"})

        verify_payload = {
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": valid_sig
        }
        res_verify = await client.post("/api/v1/billing/verify-payment", json=verify_payload, headers=headers)
        assert res_verify.status_code == 200
        assert res_verify.json()["status"] == "success"

        # Test root endpoint verify
        res_verify_root = await client.post("/api/verify-payment", json=verify_payload, headers=headers)
        assert res_verify_root.status_code == 200

    # 4. Test verify-payment signature failure
    invalid_payload = {
        "razorpay_order_id": order_id,
        "razorpay_payment_id": payment_id,
        "razorpay_signature": "wrong_signature_123"
    }
    res_verify_fail = await client.post("/api/v1/billing/verify-payment", json=invalid_payload, headers=headers)
    assert res_verify_fail.status_code == 400

