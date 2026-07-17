from typing import Optional
from pydantic import BaseModel, Field


class AttachmentSchema(BaseModel):
    filename: str = Field(min_length=1)
    file_url: str = Field(min_length=10)
    content_type: str = Field(default="application/octet-stream")


class TicketCreateInput(BaseModel):
    title: str = Field(min_length=5, max_length=150)
    description: str = Field(min_length=10)
    priority: str = Field(default="low", pattern=r"^(low|medium|high|critical)$")
    attachments: Optional[list[AttachmentSchema]] = Field(default=None)


class TicketMessageCreateInput(BaseModel):
    content: str = Field(min_length=1)
    attachments: Optional[list[AttachmentSchema]] = Field(default=None)


class TicketMessageOut(BaseModel):
    id: str
    ticket_id: str
    author_id: str
    author_name: str
    author_role: str
    content: str
    attachments: Optional[list[AttachmentSchema]] = None
    created_at: str


class TicketDetailsOut(BaseModel):
    id: str
    user_id: str
    assigned_to: Optional[str] = None
    title: str
    status: str  # open | closed | in_progress
    priority: str
    messages: list[TicketMessageOut]
    created_at: str


class TicketAssignInput(BaseModel):
    assignee_id: str = Field(min_length=5)


class TicketEscalateInput(BaseModel):
    priority: str = Field(pattern=r"^(low|medium|high|critical)$")
