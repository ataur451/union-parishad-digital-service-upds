
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserSession, Application, AuditLog
from schemas import UserOut, BanUserRequest, AuditLogOut
from core.security import require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])


@router.get("/stats")
def get_dashboard_stats(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return {
        "total_users": db.query(User).count(),
        "banned_users": db.query(User).filter_by(is_banned=True).count(),
        "total_applications": db.query(Application).count(),
        "active_sessions": db.query(UserSession).filter_by(is_active=True).count(),
    }


@router.get("/users", response_model=List[UserOut])
def list_all_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post("/users/{user_id}/ban", response_model=UserOut)
def ban_user(
    user_id: str,
    payload: BanUserRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter_by(id=user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot ban yourself")

    target.is_banned = True
    target.ban_reason = payload.reason

    # ব্যান করার সাথে সাথে ওই ইউজারের সব সেশন বাতিল করা হচ্ছে
    db.query(UserSession).filter_by(user_id=target.id).update({"is_active": False})
    db.add(AuditLog(user_id=admin.id, user_email=admin.email, action="ban_user", details=f"Banned {target.email}: {payload.reason}"))
    db.commit()
    db.refresh(target)
    return target


@router.post("/users/{user_id}/unban", response_model=UserOut)
def unban_user(user_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    target = db.query(User).filter_by(id=user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.is_banned = False
    target.ban_reason = None
    db.add(AuditLog(user_id=admin.id, user_email=admin.email, action="unban_user", details=f"Unbanned {target.email}"))
    db.commit()
    db.refresh(target)
    return target


@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()