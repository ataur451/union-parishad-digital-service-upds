import re
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator


# --- Auth & User Schemas ---
class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserOut"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserOut(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    is_banned: bool
    ban_reason: Optional[str] = None
    last_login_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Application (Service Request) Schemas ---
class ApplicationCreate(BaseModel):
    applicant_name: str = Field(..., min_length=2, max_length=100)
    nid_number: str = Field(..., min_length=10, max_length=17)
    service_type: str
    group_id: Optional[str] = None
    assigned_to: Optional[str] = None


class ApplicationUpdate(BaseModel):
    applicant_name: Optional[str] = None
    nid_number: Optional[str] = None
    service_type: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None


class ApplicationOut(BaseModel):
    id: str
    applicant_name: str
    nid_number: str
    service_type: str
    status: str
    owner_id: Optional[str] = None
    group_id: Optional[str] = None
    assigned_to: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Group & RBAC Schemas ---
class GroupCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)


class GroupMemberAdd(BaseModel):
    email: EmailStr
    can_create: bool = True
    can_edit: bool = False
    can_assign: bool = False


class GroupMemberUpdate(BaseModel):
    can_create: Optional[bool] = None
    can_edit: Optional[bool] = None
    can_assign: Optional[bool] = None


class GroupMemberOut(BaseModel):
    id: str
    user_id: str
    group_role: str
    can_create: bool
    can_edit: bool
    can_assign: bool
    joined_at: datetime

    class Config:
        from_attributes = True


class GroupOut(BaseModel):
    id: str
    name: str
    owner_id: str
    created_at: datetime
    members: List[GroupMemberOut] = []

    class Config:
        from_attributes = True


# --- Admin & Audit Log Schemas ---
class BanUserRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=255)


class AuditLogOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    browser: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True