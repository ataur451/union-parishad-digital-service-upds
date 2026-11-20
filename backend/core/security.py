import os
import hmac
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import get_db
from models import User

load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback-dev-secret-key-change-me")
PASSWORD_PEPPER = os.getenv("PASSWORD_PEPPER", "fallback-dev-pepper-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def _apply_pepper(plain_password: str) -> str:
    """পাসওয়ার্ডের সাথে সার্ভারের গোপন Pepper যুক্ত করে HMAC-SHA256 হেক্স তৈরি করে"""
    return hmac.new(
        PASSWORD_PEPPER.encode("utf-8"),
        plain_password.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def hash_password(plain_password: str) -> str:
    """Pepper + Bcrypt Salting ব্যবহার করে নিরাপদ পাসওয়ার্ড হ্যাশ তৈরি করে"""
    peppered = _apply_pepper(plain_password)
    return pwd_context.hash(peppered)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """ইনপুট পাসওয়ার্ড যাচাই করে"""
    peppered = _apply_pepper(plain_password)
    return pwd_context.verify(peppered, hashed_password)


def hash_token(token: str) -> str:
    """Refresh token ডাটাবেসে সেভ করার আগে SHA-256 দিয়ে হ্যাশ করে"""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(user_id: str, email: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "type": "access",
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: str, session_id: str) -> tuple[str, datetime]:
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "sid": session_id,
        "type": "refresh",
        "exp": expire,
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return token, expire


def decode_jwt_token(token: str) -> dict:
    """JWT টোকেন ডিকোড করে; মেয়াদ শেষ বা টেম্পারড হলে এরর দেয়"""
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or tampered token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """বর্তমান লগইন করা ইউজারকে রিটার্ন করে এবং ব্যান স্ট্যাটাস চেক করে"""
    payload = decode_jwt_token(token)
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    user_id: Optional[str] = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account suspended. Reason: {user.ban_reason or 'Policy violation'}",
        )

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """শুধুমাত্র Admin রোলধারী ইউজারদের অ্যাক্সেস দেয়"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user