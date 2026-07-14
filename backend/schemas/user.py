from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    name: str
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    gender: Optional[str] = None
    activity_level: Optional[str] = None
    dietary_restrictions: Optional[List[str]] = []
    allergies: Optional[List[str]] = []
    avatar: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=128)


class AdminCreate(UserBase):
    password: str = Field(min_length=6, max_length=128)
    is_admin: bool = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    gender: Optional[str] = None
    activity_level: Optional[str] = None
    dietary_restrictions: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None


class User(UserBase):
    id: int
    is_active: bool
    is_verified: bool = True
    is_admin: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    items: List[User]
    total: int
    limit: int = Field(ge=1)
    offset: int = Field(ge=0)


class RegisterResponse(User):
    verification_required: bool = False
    verification_token: Optional[str] = None
    verification_url: Optional[str] = None
    delivery: Optional[str] = None
    message: Optional[str] = None


class EmailVerificationConfirm(BaseModel):
    token: str


class EmailVerificationResend(BaseModel):
    email: EmailStr


class UserAdminUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class AccountDeleteRequest(BaseModel):
    """Password confirmation required for irreversible account erasure."""

    password: str = Field(min_length=1, max_length=128)


class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None


class RefreshRequest(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=6, max_length=128)


class TokenData(BaseModel):
    email: Optional[str] = None


class SpoofRequest(BaseModel):
    user_email: EmailStr
