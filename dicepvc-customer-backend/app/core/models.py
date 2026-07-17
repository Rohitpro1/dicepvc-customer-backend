from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class MongoBaseModel(BaseModel):
    is_deleted: bool = Field(default=False)
    deleted_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str = Field(default="system")
    updated_by: str = Field(default="system")

    def to_mongo(self) -> dict:
        """Converts model to a format suitable for MongoDB insertion."""
        data = self.model_dump(exclude_none=True)
        return data
