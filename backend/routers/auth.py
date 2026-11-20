from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserSession, AuditLog
from schemas import UserRegister, UserLogin, TokenResponse, RefreshTokenRequest, UserOut
from core.security import (
    hash_password, verify_password, hash_token,
    create_access_token, create_refresh_token, decode_jwt_token, get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def save_log(db: Session, req: Request, action: str, user: User = None, email: str = None, info: str = ""):
    db.add(AuditLog(
        user_id=user.id if user else None,
        user_email=user.email if user else email,
        action=action,
        details=info,
        ip_address=req.client.host if req.client else "unknown",
        browser=req.headers.get("user-agent", "unknown")[:200],
    ))
    db.commit()


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: UserRegister, req: Request, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    role = "admin" if db.query(User).count() == 0 else "user"
    user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    save_log(db, req, "register", user=user, info=f"Role: {role}")
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, req: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        if user:
            user.failed_login_attempts += 1
        save_log(db, req, "login_failed", user=user, email=payload.email, info="Wrong credentials")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.is_banned:
        save_log(db, req, "banned_login_attempt", user=user, info=user.ban_reason or "Banned")
        raise HTTPException(status_code=403, detail=f"Account banned: {user.ban_reason}")

    user.failed_login_attempts = 0
    user.last_login_at = datetime.now(timezone.utc)

    session = UserSession(
        user_id=user.id,
        refresh_token_hash="",
        ip_address=req.client.host if req.client else "unknown",
        user_agent=req.headers.get("user-agent", "unknown")[:200],
        expires_at=datetime.now(timezone.utc),
    )
    db.add(session)
    db.flush()

    access_token = create_access_token(user.id, user.email, user.role)
    refresh_token, exp = create_refresh_token(user.id, session.id)
    session.refresh_token_hash = hash_token(refresh_token)
    session.expires_at = exp
    db.commit()

    save_log(db, req, "login_success", user=user)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=user)


@router.post("/refresh")
def refresh(payload: RefreshTokenRequest, req: Request, db: Session = Depends(get_db)):
    data = decode_jwt_token(payload.refresh_token)
    session = db.query(UserSession).filter_by(id=data.get("sid"), user_id=data.get("sub"), is_active=True).first()

    if data.get("type") != "refresh" or not session or session.refresh_token_hash != hash_token(payload.refresh_token):
        save_log(db, req, "invalid_refresh_token", email=data.get("sub"), info="Tampered or revoked token")
        raise HTTPException(status_code=401, detail="Session expired or invalid")

    user = db.query(User).filter_by(id=session.user_id).first()
    if not user or user.is_banned:
        raise HTTPException(status_code=403, detail="Account unavailable")

    return {"access_token": create_access_token(user.id, user.email, user.role), "token_type": "bearer"}


@router.post("/logout")
def logout(payload: RefreshTokenRequest, req: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(UserSession).filter_by(user_id=user.id, refresh_token_hash=hash_token(payload.refresh_token)).first()
    if session:
        session.is_active = False
    save_log(db, req, "logout", user=user)
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user