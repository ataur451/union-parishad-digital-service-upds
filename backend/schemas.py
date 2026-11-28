from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, EmailStr, Field


# --- Auth & User Schemas ---
class UserRegister(BaseModel):
    full_name: Optional[str] = None
    email: EmailStr
    password: str = Field(..., min_length=4, max_length=128)
    nid_number: Optional[str] = None
    role: Literal["user", "admin"] = "user"


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: Optional[Literal["user", "admin"]] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserOut"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class UserSessionOut(BaseModel):
    id: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True


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
    phone: str = Field(..., min_length=1, max_length=30)
    email: Optional[EmailStr] = None
    father_name: str = Field(..., min_length=1, max_length=100)
    mother_name: str = Field(..., min_length=1, max_length=100)
    address: str = Field(..., min_length=1, max_length=500)
    ward_number: str = Field(..., min_length=1, max_length=10)
    additional_info: Optional[str] = None


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
    phone: Optional[str] = None
    email: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    address: Optional[str] = None
    ward_number: Optional[str] = None
    additional_info: Optional[str] = None
    remarks: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ApplicationStatusUpdate(BaseModel):
    status: Literal["pending", "under-review", "approved", "rejected"]
    remarks: Optional[str] = None


class ApplicationShare(BaseModel):
    group_id: Optional[str] = None


# --- Group & RBAC Schemas ---
class GroupCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None


class GroupRename(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)


class GroupMemberAdd(BaseModel):
    email: EmailStr
    group_role: Literal["leader", "member"] = "member"
    can_create: bool = True
    can_edit: bool = False
    can_assign: bool = False


class GroupMemberUpdate(BaseModel):
    can_create: Optional[bool] = None
    can_edit: Optional[bool] = None
    can_assign: Optional[bool] = None


class GroupMemberUserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr

    class Config:
        from_attributes = True


class GroupMemberOut(BaseModel):
    id: str
    user_id: str
    user: Optional[GroupMemberUserOut] = None
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
    description: Optional[str] = None
    created_at: datetime
    members: List[GroupMemberOut] = []

    class Config:
        from_attributes = True


# --- Admin & Audit Log Schemas ---
class BanUserRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=255)


class UserRoleUpdate(BaseModel):
    role: Literal["user", "admin"]


class BulkUserAction(BaseModel):
    user_ids: List[str] = Field(..., min_length=1, max_length=500)
    reason: Optional[str] = Field(None, min_length=3, max_length=255)


class BulkDeleteRequest(BaseModel):
    ids: List[str] = Field(..., min_length=1, max_length=500)


class AuditLogOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    browser: Optional[str] = None
    user_agent: Optional[str] = Field(None, validation_alias="browser")
    created_at: datetime

    class Config:
        from_attributes = True