from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.core.models import MongoBaseModel


class SoftwareVersion(MongoBaseModel):
    id: str = Field(pattern=r"^up_[a-f0-9]{16}$")
    version: str = Field(pattern=r"^\d+\.\d+\.\d+$")  # Semantic Version check
    release_notes: str = ""
    download_url: str
    sha256: str = ""
    mandatory: bool = False
    minimum_supported_version: str = ""
    status: str = "draft"  # draft | published | archived
    published_at: Optional[datetime] = None


class Download(BaseModel):
    id: str = Field(pattern=r"^dl_[a-f0-9]{16}$")
    user_id: str
    version_id: str
    ip_address: str
    user_agent: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
