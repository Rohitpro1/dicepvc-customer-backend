from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr
from app.core.models import MongoBaseModel


class Announcement(MongoBaseModel):
    id: str = Field(pattern=r"^ann_[a-f0-9]{16}$")
    title: str
    body: str
    target_audience: str = "all"  # all | active_subscribers
    is_active: bool = True
    expires_at: datetime


class Notification(BaseModel):
    id: str = Field(pattern=r"^ntf_[a-f0-9]{16}$")
    user_id: str
    title: str
    message: str
    type: str  # billing | ticket | update
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EmailLog(BaseModel):
    id: str = Field(pattern=r"^eml_[a-f0-9]{16}$")
    recipient_email: EmailStr
    subject: str
    template_name: str
    status: str = "queued"  # queued | sent | failed
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
