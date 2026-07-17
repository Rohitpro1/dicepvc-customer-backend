from typing import Optional
from pydantic import BaseModel, Field
from app.core.models import MongoBaseModel


class BillingAddress(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = Field(default=None, min_length=2, max_length=2)  # ISO 3166-1 alpha-2


class Customer(MongoBaseModel):
    id: str = Field(pattern=r"^c_[a-f0-9]{16}$")
    user_id: str
    company_name: str
    phone: str
    gst_number: Optional[str] = None
    avatar_url: Optional[str] = None
    billing_address: BillingAddress = Field(default_factory=BillingAddress)
