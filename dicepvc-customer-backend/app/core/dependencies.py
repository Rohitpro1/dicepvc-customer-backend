from fastapi import Depends, Request
from jose import JWTError
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.core.security import decode_token
from app.core.database import col


async def get_token(request: Request) -> str:
    """Extracts JWT token from HttpOnly cookies or Authorization header."""
    # Try cookie extraction first
    token = request.cookies.get("access_token")
    
    # Fallback to Authorization Header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    if not token:
        raise UnauthorizedException("Credentials token missing.")
    return token


async def get_current_user(token: str = Depends(get_token)) -> dict:
    """Validates JWT and yields corresponding user document from primary DB."""
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedException("Invalid token payload.")
    except JWTError:
        raise UnauthorizedException("Could not validate credentials.")

    user = await col("users").find_one({"id": user_id, "is_deleted": {"$ne": True}})
    if not user:
        raise UnauthorizedException("User account not found or deactivated.")
    return user


class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")
        if user_role not in self.allowed_roles:
            raise ForbiddenException("You do not have permission to execute this action.")
        return current_user


# RBAC Dependency shortcuts
require_super_admin = RoleChecker(["super_admin"])
require_admin = RoleChecker(["super_admin", "admin"])
require_support = RoleChecker(["super_admin", "admin", "support"])
require_customer = RoleChecker(["super_admin", "admin", "support", "customer"])
