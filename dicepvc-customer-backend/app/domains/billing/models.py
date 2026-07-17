from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.core.models import MongoBaseModel


class FeatureFlags(BaseModel):
    batch_processing: bool = False
    card_history: bool = False
    analytics: bool = False
    multi_operator: bool = False
    pdf_import: bool = False
    cloud_backup: bool = False


class Plan(MongoBaseModel):
    id: str = Field(pattern=r"^p_[a-f0-9]{16}$")
    name: str
    price: float
    currency: str = "INR"
    duration_days: int = 365  # 0 = lifetime
    device_limit: int = 1
    features: FeatureFlags
    is_active: bool = True


class Subscription(MongoBaseModel):
    id: str = Field(pattern=r"^sub_[a-f0-9]{16}$")
    user_id: str
    customer_id: str
    plan_id: str
    license_key: str
    razorpay_subscription_id: str
    status: str  # active | paused | cancelled | expired
    current_period_start: datetime
    current_period_end: datetime
    cancelled_at: Optional[datetime] = None


class Order(MongoBaseModel):
    id: str = Field(pattern=r"^ord_[a-f0-9]{16}$")
    user_id: str
    plan_id: str
    razorpay_order_id: str
    amount: float
    currency: str = "INR"
    coupon_code: Optional[str] = None
    status: str = "created"  # created | paid | failed


class Payment(MongoBaseModel):
    id: str = Field(pattern=r"^pay_[a-f0-9]{16}$")
    order_id: str
    razorpay_payment_id: str
    amount: float
    method: str  # card | upi | netbanking | wallet
    status: str  # captured | failed | refunded
    error_description: Optional[str] = None


class Coupon(MongoBaseModel):
    id: str = Field(pattern=r"^cpn_[a-f0-9]{16}$")
    code: str = Field(pattern=r"^[A-Z0-9]{3,15}$")
    discount_type: str  # percentage | flat
    discount_value: float
    max_redemptions: int
    redemptions_count: int = 0
    expires_at: datetime
    is_active: bool = True


class FailedPayment(BaseModel):
    id: str = Field(pattern=r"^fpm_[a-f0-9]{16}$")
    user_id: str
    razorpay_subscription_id: Optional[str] = None
    amount: float
    error_code: str
    error_reason: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PaymentWebhook(BaseModel):
    event_id: str  # Unique event signature from Razorpay
    event_type: str
    payload: dict
    status: str = "processed"  # processed | duplicated | failed
    received_at: datetime = Field(default_factory=datetime.utcnow)
