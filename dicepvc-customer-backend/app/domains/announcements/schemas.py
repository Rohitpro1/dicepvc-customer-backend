from typing import Optional
from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    is_read: bool
    created_at: str


class AnnouncementOut(BaseModel):
    id: str
    title: str
    content: str
    created_at: str
