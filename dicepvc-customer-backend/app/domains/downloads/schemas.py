from typing import Optional
from pydantic import BaseModel


class DownloadLogOut(BaseModel):
    id: str
    user_id: str
    version_id: str
    ip_address: str
    created_at: str
