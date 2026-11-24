from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import update
from sqlalchemy.orm import Session

if __package__ == "backend.routers":
    from ..database import get_db
    from ..models import User, UserSession, AuditLog
    from ..schemas import (
        UserRegister, UserLogin, TokenResponse, RefreshTokenRequest, UserOut,
        ProfileUpdate, PasswordChangeRequest, UserSessionOut,
    )
    from ..core.security import (
        hash_password, verify_password, hash_token,
        create_access_token, create_refresh_token, decode_jwt_token, get_current_user,
    )
else:
    from database import get_db
    from models import User, UserSession, AuditLog
    from schemas import (
        UserRegister, UserLogin, TokenResponse, RefreshTokenRequest, UserOut,
        ProfileUpdate, PasswordChangeRequest, UserSessionOut,
    )
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
        browser=req.headers.get("user-agent", "unknown")[:500],
    ))
    db.commit()


def create_auth_session(user: User, req: Request, db: Session) -> TokenResponse:
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

    access_token = create_access_token(user.id, user.email, user.role, session.id)
    refresh_token, exp = create_refresh_token(user.id, session.id)
    session.refresh_token_hash = hash_token(refresh_token)
    session.expires_at = exp
    db.commit()

    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=user)


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: UserRegister, req: Request, db: Session = Depends(get_db)):
    if payload.role != "user":
        save_log(db, req, "admin_registration_denied", email=payload.email.lower())
        raise HTTPException(status_code=403, detail="Admin accounts cannot register here")

    if db.query(User).filter(User.email == payload.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        full_name=(payload.full_name or "User").strip(),
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    auth = create_auth_session(user, req, db)
    save_log(db, req, "register", user=user, info=f"Role: {user.role}")
    return auth


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, req: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        if user:
            user.failed_login_attempts += 1
        save_log(db, req, "login_failed", user=user, email=payload.email.lower(), info="Wrong credentials")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if payload.role and payload.role != user.role:
        user.failed_login_attempts += 1
        save_log(db, req, "login_failed", user=user, info="Selected account type does not match")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.is_banned:
        save_log(db, req, "banned_login_attempt", user=user, info=user.ban_reason or "Banned")
        raise HTTPException(status_code=403, detail=f"Account banned: {user.ban_reason}")

    auth = create_auth_session(user, req, db)
    save_log(db, req, "login_success", user=user)
    return auth


@router.post("/refresh")
def refresh(payload: RefreshTokenRequest, req: Request, db: Session = Depends(get_db)):
    try:
        data = decode_jwt_token(payload.refresh_token)
    except HTTPException:
        save_log(db, req, "invalid_refresh_token", info="Expired or invalid refresh token")
        raise

    token_hash = hash_token(payload.refresh_token)
    session = db.query(UserSession).filter(
        UserSession.id == data.get("sid"),
        UserSession.user_id == data.get("sub"),
        UserSession.is_active.is_(True),
        UserSession.refresh_token_hash == token_hash,
        UserSession.expires_at > datetime.now(timezone.utc),
    ).first() if data.get("type") == "refresh" else None
    if not session:
        target = db.query(User).filter_by(id=data.get("sub")).first()
        save_log(
            db, req, "invalid_refresh_token", user=target,
            email=target.email if target else None, info="Expired, tampered, or revoked token",
        )
        raise HTTPException(status_code=401, detail="Session expired or invalid")

    user = db.query(User).filter_by(id=session.user_id).first()
    if not user or user.is_banned:
        save_log(db, req, "banned_refresh_attempt", user=user, info="Account unavailable")
        raise HTTPException(status_code=403, detail="Account unavailable")

    refresh_token, expires_at = create_refresh_token(user.id, session.id)
    result = db.execute(
        update(UserSession)
        .where(
            UserSession.id == session.id,
            UserSession.is_active.is_(True),
            UserSession.refresh_token_hash == token_hash,
        )
        .values(refresh_token_hash=hash_token(refresh_token), expires_at=expires_at)
    )
    if result.rowcount != 1:
        db.rollback()
        save_log(db, req, "invalid_refresh_token", user=user, info="Refresh token was already rotated")
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    db.commit()
    save_log(db, req, "token_refreshed", user=user, info=f"Session {session.id}")
    return {
        "access_token": create_access_token(user.id, user.email, user.role, session.id),
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/logout")
def logout(payload: RefreshTokenRequest, req: Request, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(UserSession).filter_by(
        user_id=user.id,
        refresh_token_hash=hash_token(payload.refresh_token),
        is_active=True,
    ).first()
    if not session:
        save_log(db, req, "logout_failed", user=user, info="Active session not found")
        raise HTTPException(status_code=401, detail="Session expired or invalid")

    session.is_active = False
    save_log(db, req, "logout", user=user)
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserOut)
def update_profile(
    payload: ProfileUpdate,
    req: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    changes = payload.model_dump(exclude_unset=True)
    if "email" in changes:
        email = str(changes["email"]).lower()
        existing = db.query(User).filter(User.email == email, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
        changes["email"] = email
    if "full_name" in changes:
        changes["full_name"] = changes["full_name"].strip()
    for field, value in changes.items():
        setattr(user, field, value)
    save_log(db, req, "profile_updated", user=user, info=", ".join(changes.keys()))
    db.refresh(user)
    return user


@router.post("/me/password")
def change_password(
    payload: PasswordChangeRequest,
    req: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, user.hashed_password):
        save_log(db, req, "password_change_failed", user=user, info="Incorrect current password")
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if verify_password(payload.new_password, user.hashed_password):
        save_log(db, req, "password_change_failed", user=user, info="New password matches current password")
        raise HTTPException(status_code=400, detail="New password must be different")

    user.hashed_password = hash_password(payload.new_password)
    db.query(UserSession).filter_by(user_id=user.id, is_active=True).update({"is_active": False})
    save_log(db, req, "password_changed", user=user, info="All sessions revoked")
    return {"message": "Password changed; please log in again"}


@router.get("/sessions", response_model=list[UserSessionOut])
def list_sessions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.is_active.is_(True),
        UserSession.expires_at > datetime.now(timezone.utc),
    ).order_by(UserSession.created_at.desc()).all()


@router.delete("/sessions/{session_id}")
def revoke_session(
    session_id: str,
    req: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(UserSession).filter_by(
        id=session_id, user_id=user.id, is_active=True
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")
    session.is_active = False
    save_log(db, req, "session_revoked", user=user, info=f"Session {session_id}")
    return {"message": "Session revoked"}


@router.delete("/sessions")
def revoke_all_sessions(
    req: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(UserSession).filter_by(user_id=user.id, is_active=True).update({"is_active": False})
    save_log(db, req, "all_sessions_revoked", user=user)
    return {"message": "All sessions revoked"}