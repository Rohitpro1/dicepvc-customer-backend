from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class BillingAddressSchema(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = Field(default=None, min_length=2, max_length=2)


class CustomerUpdateInput(BaseModel):
    company_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    phone: Optional[str] = Field(default=None, min_length=8, max_length=20)
    billing_address: Optional[BillingAddressSchema] = None
    gst_number: Optional[str] = Field(default=None, pattern=r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
    avatar_url: Optional[str] = None


class CustomerCreateInput(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    role: str = "customer"  # customer | support | admin | super_admin
    company_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=8, max_length=20)
    billing_address: Optional[BillingAddressSchema] = None
    gst_number: Optional[str] = None
    avatar_url: Optional[str] = None


class CustomerDetailsOut(BaseModel):
    id: str
    user_id: str
    name: str
    email: EmailStr
    role: str
    status: str
    company_name: str
    phone: str
    gst_number: Optional[str] = None
    avatar_url: Optional[str] = None
    billing_address: BillingAddressSchema
    created_at: str
