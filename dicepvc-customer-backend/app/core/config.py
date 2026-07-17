from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Self


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PORT: int = 8000
    DEBUG: bool = True
    CORS_ORIGINS: str = "*"

    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB: str = "dicepvc_customer_db"

    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET: str = "dev-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "DicePVC Support"
    SMTP_FROM_EMAIL: str = "support@dicepvc.com"
    DASHBOARD_URL: str = "https://dashboard.dicepvc.com"

    LICENSE_SERVICE_URL: str = "http://localhost:8001"
    LICENSE_SERVICE_API_KEY: str = ""

    @model_validator(mode="after")
    def validate_prod_settings(self) -> Self:
        if not self.DEBUG:
            if self.JWT_SECRET == "dev-secret-change-me" or not self.JWT_SECRET:
                raise ValueError("JWT_SECRET must be configured with a secure value in production.")
            if "localhost" in self.MONGO_URI or "127.0.0.1" in self.MONGO_URI:
                raise ValueError("MONGO_URI cannot point to localhost in production.")
            if "localhost" in self.REDIS_URL or "127.0.0.1" in self.REDIS_URL:
                raise ValueError("REDIS_URL cannot point to localhost in production.")
            if "localhost" in self.LICENSE_SERVICE_URL or "127.0.0.1" in self.LICENSE_SERVICE_URL:
                raise ValueError("LICENSE_SERVICE_URL cannot point to localhost in production.")
            if not self.RAZORPAY_KEY_ID or not self.RAZORPAY_KEY_SECRET or not self.RAZORPAY_WEBHOOK_SECRET:
                raise ValueError("Razorpay key settings must be fully configured in production.")
            if not self.LICENSE_SERVICE_API_KEY:
                raise ValueError("LICENSE_SERVICE_API_KEY must be configured in production.")
            if not self.SMTP_HOST:
                raise ValueError("SMTP_HOST must be configured in production.")
        return self


settings = Settings()

