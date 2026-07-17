from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    status: str
    company_name: Optional[str] = None
    phone: Optional[str] = None


class RegisterInput(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    company_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=8, max_length=20)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class TokenOutput(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str
    user: UserOut


class RefreshInput(BaseModel):
    refresh_token: str


class ForgotPasswordInput(BaseModel):
    email: EmailStr


class ResetPasswordInput(BaseModel):
    token: str
    new_password: str = Field(min_length=6, max_length=128)


class EmailVerificationInput(BaseModel):
    token: str
