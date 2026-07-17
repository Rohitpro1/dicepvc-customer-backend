from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.core.models import MongoBaseModel


class User(MongoBaseModel):
    id: str = Field(pattern=r"^usr_[a-f0-9]{16}$")
    name: str = Field(min_length=1)
    email: EmailStr
    password_hash: str
    role: str = Field(default="customer")  # admin | support | customer
    status: str = Field(default="active")  # active | suspended


class Session(BaseModel):
    id: str = Field(pattern=r"^ses_[a-f0-9]{16}$")
    user_id: str
    ip_address: str
    user_agent: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RefreshToken(BaseModel):
    id: str = Field(pattern=r"^rft_[a-f0-9]{16}$")
    user_id: str
    token: str
    is_revoked: bool = False
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ActivityLog(BaseModel):
    id: str = Field(pattern=r"^act_[a-f0-9]{16}$")
    user_id: str
    event: str
    ip_address: str
    user_agent: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AuditLog(BaseModel):
    id: str = Field(pattern=r"^aud_[a-f0-9]{16}$")
    action: str
    detail: str
    actor: EmailStr
    ip_address: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
