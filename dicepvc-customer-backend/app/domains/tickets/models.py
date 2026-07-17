from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.core.models import MongoBaseModel


class SupportTicket(MongoBaseModel):
    id: str = Field(pattern=r"^tkt_[a-f0-9]{16}$")
    user_id: str
    subject: str
    category: str  # technical | billing | sales
    status: str = "open"  # open | in_progress | resolved | closed
    priority: str = "medium"  # low | medium | high


class Attachment(BaseModel):
    file_name: str
    s3_url: str


class TicketMessage(BaseModel):
    id: str = Field(pattern=r"^msg_[a-f0-9]{16}$")
    ticket_id: str
    sender_id: str
    sender_name: str
    message: str
    attachments: list[Attachment] = Field(default=[])
    created_at: datetime = Field(default_factory=datetime.utcnow)
