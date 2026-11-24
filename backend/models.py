import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
if __package__ == "backend":
    from .database import Base
else:
    from database import Base


def generate_uuid():
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False)  # "user" or "admin"
    is_banned = Column(Boolean, default=False, nullable=False)
    ban_reason = Column(String, nullable=True)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", foreign_keys="Application.owner_id", back_populates="owner")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    refresh_token_hash = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    user = relationship("User", back_populates="sessions")


class Group(Base):
    __tablename__ = "groups"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    owner_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="group")


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(String, primary_key=True, default=generate_uuid)
    group_id = Column(String, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    group_role = Column(String, default="member", nullable=False)  # "owner" or "member"
    can_create = Column(Boolean, default=True, nullable=False)
    can_edit = Column(Boolean, default=False, nullable=False)
    can_assign = Column(Boolean, default=False, nullable=False)
    joined_at = Column(DateTime(timezone=True), default=utc_now)

    group = relationship("Group", back_populates="members")


class Application(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, default=generate_uuid)
    applicant_name = Column(String, nullable=False)
    nid_number = Column(String, nullable=False)
    service_type = Column(String, nullable=False)  # Category: Trade License, Birth Certificate, etc.
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    father_name = Column(String, nullable=True)
    mother_name = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    ward_number = Column(String, nullable=True)
    additional_info = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    status = Column(String, default="pending", nullable=False)  # Pending, Approved, Rejected
    owner_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    group_id = Column(String, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)
    assigned_to = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    owner = relationship("User", foreign_keys=[owner_id], back_populates="applications")
    group = relationship("Group", back_populates="applications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=True)
    user_email = Column(String, nullable=True)
    action = Column(String, nullable=False)  # login, login_failed, tampered_token, logout, ban, etc.
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)