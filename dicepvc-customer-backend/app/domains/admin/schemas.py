from typing import Optional
from pydantic import BaseModel, Field


class AdminDashboardStats(BaseModel):
    total_users: int
    active_subscriptions: int
    total_revenue: float
    open_tickets: int
    total_licenses: int


class UserUpdateRoleInput(BaseModel):
    role: str = Field(pattern=r"^(customer|support|admin|super_admin)$")


class LicenseUpdateLimitInput(BaseModel):
    device_limit: int = Field(gt=0)


class SoftwareVersionCreateInput(BaseModel):
    version: str = Field(pattern=r"^[0-9]+\.[0-9]+\.[0-9]+$")
    changelog: str = Field(min_length=1)
    download_url: str = Field(min_length=5)
    min_os_version: Optional[str] = "Windows 10"


class SoftwareVersionOut(BaseModel):
    id: str
    version: str
    changelog: str
    download_url: str
    min_os_version: str
    is_active: bool
    created_at: str


class AnnouncementCreateInput(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    content: str = Field(min_length=2)
    send_email: bool = False
