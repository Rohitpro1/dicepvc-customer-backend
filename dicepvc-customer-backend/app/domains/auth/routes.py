from typing import Optional
from fastapi import APIRouter, Depends, Request, Response, status

from app.domains.auth.schemas import (
    RegisterInput,
    LoginInput,
    TokenOutput,
    RefreshInput,
    ForgotPasswordInput,
    ResetPasswordInput,
    EmailVerificationInput,
    UserOut
)
from app.domains.auth import services
from app.core.dependencies import get_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterInput):
    """Public customer registration."""
    user = await services.register_user(payload)
    return user


@router.post("/login", response_model=TokenOutput)
async def login(payload: LoginInput, request: Request, response: Response):
    """Authenticate credentials and establish active session."""
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("User-Agent", "unknown")
    
    result = await services.login_user(payload, ip_address, user_agent)
    
    # Secure Cookie options
    response.set_cookie(
        key="access_token",
        value=result["access_token"],
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=1440 * 60  # 24 hours matching expiry
    )
    response.set_cookie(
        key="refresh_token",
        value=result["refresh_token"],
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=30 * 24 * 3600  # 30 days
    )
    return result


@router.post("/refresh", response_model=TokenOutput)
async def refresh(payload: Optional[RefreshInput], request: Request, response: Response):
    """Renew access token via refresh token cookie or JSON payload."""
    refresh_token = payload.refresh_token if payload else request.cookies.get("refresh_token")
    if not refresh_token:
        from app.core.exceptions import UnauthorizedException
        raise UnauthorizedException("Refresh token missing.")

    result = await services.refresh_session_token(refresh_token)
    
    response.set_cookie(
        key="access_token",
        value=result["access_token"],
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=1440 * 60
    )
    return result


@router.post("/logout")
async def logout(response: Response, token: str = Depends(get_token), request: Request = None):
    """Clear active sessions and revoke refresh tokens."""
    refresh_token = request.cookies.get("refresh_token") if request else None
    await services.logout_user(token, refresh_token)
    
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"ok": True}


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordInput):
    """Triggers password reset flow."""
    await services.request_password_reset(payload.email)
    return {"ok": True, "message": "Password reset token sent to your email."}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordInput):
    """Consumes reset token to overwrite account password."""
    await services.execute_password_reset(payload.token, payload.new_password)
    return {"ok": True, "message": "Password successfully updated."}


@router.post("/verify-email")
async def verify_email(payload: EmailVerificationInput):
    """Consumes signup verification token to activate customer profile."""
    await services.verify_email_token(payload.token)
    return {"ok": True, "message": "Email successfully verified. Account activated."}
