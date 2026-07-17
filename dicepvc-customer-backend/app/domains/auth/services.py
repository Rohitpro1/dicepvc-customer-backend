import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import status

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import UnauthorizedException, BaseAppException, NotFoundException
from app.core.database import col
from app.domains.auth.schemas import RegisterInput, LoginInput, TokenOutput, UserOut
from app.models.helpers import new_id, now_iso


async def register_user(payload: RegisterInput) -> dict:
    # 1. Check if user already exists
    existing = await col("users").find_one({"email": payload.email})
    if existing:
        raise BaseAppException("Email already registered.", status_code=status.HTTP_400_BAD_REQUEST)

    # 2. Create User record
    user_id = new_id("usr")
    now = datetime.now(timezone.utc)
    
    user_doc = {
        "id": user_id,
        "name": payload.name,
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "role": "customer",
        "status": "pending_verification",  # Require email verification
        "is_deleted": False,
        "deleted_at": None,
        "created_at": now,
        "updated_at": now,
        "created_by": "public",
        "updated_by": "public"
    }
    await col("users").insert_one(user_doc)

    # 3. Create Customer profile record (Normalized)
    customer_doc = {
        "id": new_id("c"),
        "user_id": user_id,
        "company_name": payload.company_name,
        "phone": payload.phone,
        "billing_address": {},
        "is_deleted": False,
        "deleted_at": None,
        "created_at": now,
        "updated_at": now,
        "created_by": "public",
        "updated_by": "public"
    }
    await col("customers").insert_one(customer_doc)

    # 4. Generate verification token
    verification_token = secrets.token_hex(32)
    verification_doc = {
        "id": new_id("vrf"),
        "user_id": user_id,
        "token": verification_token,
        "expires_at": now + timedelta(hours=24),
        "created_at": now
    }
    await col("email_verifications").insert_one(verification_doc)

    # Enqueue email verification Celery task
    from app.workers.celery_app import celery_app
    celery_app.send_task(
        "send_transactional_email",
        args=[
            payload.email,
            "Verify your email address",
            "email_verification.html",
            {"verification_url": f"{settings.DASHBOARD_URL}/verify-email?token={verification_token}"}
        ]
    )

    # Build response model
    return {
        "id": user_id,
        "name": payload.name,
        "email": payload.email,
        "role": "customer",
        "status": "pending_verification",
        "company_name": payload.company_name,
        "phone": payload.phone
    }


async def login_user(payload: LoginInput, ip_address: str, user_agent: str) -> dict:
    # 1. Fetch active user
    user = await col("users").find_one({"email": payload.email, "is_deleted": {"$ne": True}})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise UnauthorizedException("Invalid email or password.")
        
    if user["status"] == "suspended":
        raise BaseAppException("Your account is suspended.", status_code=status.HTTP_403_FORBIDDEN)

    # 2. Generate Tokens
    user_id = user["id"]
    user_role = user.get("role", "customer")
    
    access_token = create_access_token(subject=user_id, role=user_role)
    refresh_token_str = secrets.token_hex(64)
    
    now = datetime.now(timezone.utc)
    
    # Save Refresh Token
    refresh_doc = {
        "id": new_id("rft"),
        "user_id": user_id,
        "token": refresh_token_str,
        "is_revoked": False,
        "expires_at": now + timedelta(days=30),
        "created_at": now
    }
    await col("refresh_tokens").insert_one(refresh_doc)

    # 3. Create Session tracking record
    session_doc = {
        "id": new_id("ses"),
        "user_id": user_id,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "expires_at": now + timedelta(days=7),
        "created_at": now
    }
    await col("sessions").insert_one(session_doc)

    # 4. Log telemetry activity
    activity_doc = {
        "id": new_id("act"),
        "user_id": user_id,
        "event": "USER_LOGIN",
        "ip_address": ip_address,
        "user_agent": user_agent,
        "created_at": now
    }
    await col("activity_logs").insert_one(activity_doc)

    # Fetch company profile from customers collection
    customer = await col("customers").find_one({"user_id": user_id})

    user_out = {
        "id": user_id,
        "name": user["name"],
        "email": user["email"],
        "role": user_role,
        "status": user["status"],
        "company_name": customer["company_name"] if customer else None,
        "phone": customer["phone"] if customer else None
    }

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token_str,
        "user": user_out
    }


async def refresh_session_token(refresh_token_str: str) -> dict:
    now = datetime.now(timezone.utc)
    # Find active refresh token
    token_doc = await col("refresh_tokens").find_one({
        "token": refresh_token_str,
        "is_revoked": False,
        "expires_at": {"$gt": now}
    })
    if not token_doc:
        raise UnauthorizedException("Invalid or expired refresh token.")

    # Fetch User
    user = await col("users").find_one({"id": token_doc["user_id"], "is_deleted": {"$ne": True}})
    if not user or user["status"] == "suspended":
        raise UnauthorizedException("User account suspended or not found.")

    # Generate new access token
    new_access_token = create_access_token(subject=user["id"], role=user.get("role", "customer"))
    
    customer = await col("customers").find_one({"user_id": user["id"]})
    user_out = {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "customer"),
        "status": user["status"],
        "company_name": customer["company_name"] if customer else None,
        "phone": customer["phone"] if customer else None
    }

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token_str,  # Re-use refresh token or rotate (standard: reuse)
        "user": user_out
    }


async def logout_user(token: str, refresh_token_str: Optional[str]) -> bool:
    # Decode token payload
    from jose import jwt
    from app.core.config import settings
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
    except Exception:
        raise UnauthorizedException("Invalid access token.")

    now = datetime.now(timezone.utc)
    
    # Revoke session refresh tokens
    if refresh_token_str:
        await col("refresh_tokens").update_one(
            {"token": refresh_token_str},
            {"$set": {"is_revoked": True}}
        )
    else:
        # Revoke all refresh tokens for the user
        await col("refresh_tokens").update_many(
            {"user_id": user_id, "is_revoked": False},
            {"$set": {"is_revoked": True}}
        )

    # Delete session records
    await col("sessions").delete_many({"user_id": user_id})
    return True


async def request_password_reset(email: str) -> bool:
    user = await col("users").find_one({"email": email, "is_deleted": {"$ne": True}})
    if not user:
        # Avoid user enumeration attacks: return true anyway
        return True

    reset_token = secrets.token_hex(32)
    now = datetime.now(timezone.utc)
    
    reset_doc = {
        "id": new_id("rst"),
        "user_id": user["id"],
        "token": reset_token,
        "expires_at": now + timedelta(hours=1),
        "created_at": now
    }
    await col("password_resets").insert_one(reset_doc)

    # Placeholder: Enqueue SMTP password reset Celery task
    print(f"[PasswordReset] Enqueued reset email for {email} with token {reset_token}")
    return True


async def execute_password_reset(token: str, new_password_raw: str) -> bool:
    now = datetime.now(timezone.utc)
    # Validate reset token
    reset_doc = await col("password_resets").find_one({
        "token": token,
        "expires_at": {"$gt": now}
    })
    if not reset_doc:
        raise BaseAppException("Invalid or expired password reset token.", status_code=status.HTTP_400_BAD_REQUEST)

    # Update User password
    await col("users").update_one(
        {"id": reset_doc["user_id"]},
        {"$set": {
            "password_hash": hash_password(new_password_raw),
            "updated_at": now,
            "updated_by": "public"
        }}
    )

    # Delete token so it cannot be reused
    await col("password_resets").delete_one({"token": token})
    return True


async def verify_email_token(token: str) -> bool:
    now = datetime.now(timezone.utc)
    # Validate token
    vrf_doc = await col("email_verifications").find_one({
        "token": token,
        "expires_at": {"$gt": now}
    })
    if not vrf_doc:
        raise BaseAppException("Invalid or expired verification token.", status_code=status.HTTP_400_BAD_REQUEST)

    # Update user status to active
    await col("users").update_one(
        {"id": vrf_doc["user_id"]},
        {"$set": {
            "status": "active",
            "updated_at": now,
            "updated_by": "system"
        }}
    )

    # Delete verification record
    await col("email_verifications").delete_one({"token": token})
    return True
