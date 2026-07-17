from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class FeatureFlagsSchema(BaseModel):
    batch_processing: bool = False
    card_history: bool = False
    analytics: bool = False
    multi_operator: bool = False
    pdf_import: bool = False
    cloud_backup: bool = False


class PlanCreateInput(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    price: float = Field(ge=0.0)
    currency: str = "INR"
    duration_days: int = Field(default=365, ge=0)  # 0 = lifetime
    device_limit: int = Field(default=1, ge=1)
    features: FeatureFlagsSchema


class PlanOut(BaseModel):
    id: str
    name: str
    price: float
    currency: str
    duration_days: int
    device_limit: int
    features: FeatureFlagsSchema
    is_active: bool


class SubscriptionOut(BaseModel):
    id: str
    user_id: str
    customer_id: str
    plan_id: str
    license_key: str
    razorpay_subscription_id: str
    status: str
    current_period_start: datetime
    current_period_end: datetime
    cancelled_at: Optional[datetime] = None


class OrderOut(BaseModel):
    id: str
    user_id: str
    plan_id: str
    amount: float
    currency: str
    status: str
    created_at: datetime


class SubscribeInput(BaseModel):
    plan_id: str
    coupon_code: Optional[str] = None


class UpgradeInput(BaseModel):
    new_plan_id: str


class CouponCreateInput(BaseModel):
    code: str = Field(pattern=r"^[A-Z0-9]{3,15}$")
    discount_type: str = "percentage"  # percentage | flat
    discount_value: float = Field(gt=0.0)
    max_redemptions: int = Field(gt=0)
    expires_at: datetime


class RazorpayOrderCreateInput(BaseModel):
    amount: int = Field(..., ge=100, description="Amount in paise (minimum 100)")
    currency: str = "INR"
    receipt: Optional[str] = None


class RazorpayOrderOut(BaseModel):
    order_id: str
    amount: int
    currency: str


class RazorpayPaymentVerifyInput(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

