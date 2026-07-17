from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.core.models import MongoBaseModel
from app.domains.billing.models import FeatureFlags


class License(MongoBaseModel):
    id: str = Field(pattern=r"^l_[a-f0-9]{16}$")
    subscription_id: str
    license_key: str = Field(pattern=r"^PVC-[A-Z0-9]{2}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$")
    license_type: str  # Trial | Monthly | Yearly | Lifetime | Enterprise
    status: str  # active | expired | blocked | disabled
    device_limit: int
    features: FeatureFlags
    expires_at: Optional[datetime] = None


class SyncDetails(BaseModel):
    active_devices: int = 0
    cards_generated: int = 0
    cards_printed: int = 0


class LicenseSync(BaseModel):
    id: str = Field(pattern=r"^syn_[a-f0-9]{16}$")
    license_key: str
    action: str  # PULL_STATS | PUSH_BLOCK | PUSH_UNBLOCK
    status: str  # success | failed
    details: SyncDetails
    created_at: datetime = Field(default_factory=datetime.utcnow)
