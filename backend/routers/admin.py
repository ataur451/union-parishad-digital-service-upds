import csv
import io
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

if __package__ == "backend.routers":
    from ..database import get_db
    from ..models import User, UserSession, Application, Group, GroupMember, AuditLog
    from ..schemas import (
        UserOut, BanUserRequest, AuditLogOut, UserRoleUpdate,
        BulkUserAction, BulkDeleteRequest,
    )
    from ..core.security import require_admin
else:
    from database import get_db
    from models import User, UserSession, Application, Group, GroupMember, AuditLog
    from schemas import (
        UserOut, BanUserRequest, AuditLogOut, UserRoleUpdate,
        BulkUserAction, BulkDeleteRequest,
    )
    from core.security import require_admin

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin Dashboard"],
    dependencies=[Depends(require_admin)],
)


def save_admin_log(
    db: Session,
    req: Request,
    admin: User,
    action: str,
    details: str,
):
    db.add(AuditLog(
        user_id=admin.id,
        user_email=admin.email,
        action=action,
        details=details,
        ip_address=req.client.host if req.client else "unknown",
        browser=req.headers.get("user-agent", "unknown")[:500],
    ))


def _filtered_users(
    db: Session,
    search: Optional[str],
    role: Optional[str],
    is_banned: Optional[bool],
    created_after: Optional[datetime],
    created_before: Optional[datetime],
):
    query = db.query(User)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(or_(User.full_name.ilike(term), User.email.ilike(term)))
    if role:
        query = query.filter(User.role == role)
    if is_banned is not None:
        query = query.filter(User.is_banned.is_(is_banned))
    if created_after:
        query = query.filter(User.created_at >= created_after)
    if created_before:
        query = query.filter(User.created_at <= created_before)
    return query


def _filtered_applications(
    db: Session,
    search: Optional[str],
    status: Optional[str],
    service_type: Optional[str],
    owner_id: Optional[str],
    group_id: Optional[str],
    created_after: Optional[datetime],
    created_before: Optional[datetime],
):
    query = db.query(Application)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(or_(
            Application.applicant_name.ilike(term),
            Application.nid_number.ilike(term),
        ))
    if status:
        query = query.filter(Application.status == status)
    if service_type:
        query = query.filter(Application.service_type == service_type)
    if owner_id:
        query = query.filter(Application.owner_id == owner_id)
    if group_id:
        query = query.filter(Application.group_id == group_id)
    if created_after:
        query = query.filter(Application.created_at >= created_after)
    if created_before:
        query = query.filter(Application.created_at <= created_before)
    return query


def _filtered_audit_logs(
    db: Session,
    action: Optional[str],
    user_id: Optional[str],
    email: Optional[str],
    ip_address: Optional[str],
    search: Optional[str],
    since: Optional[datetime],
    until: Optional[datetime],
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if email:
        query = query.filter(AuditLog.user_email.ilike(f"%{email.strip()}%"))
    if ip_address:
        query = query.filter(AuditLog.ip_address == ip_address)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(or_(
            AuditLog.action.ilike(term),
            AuditLog.user_email.ilike(term),
            AuditLog.details.ilike(term),
            AuditLog.ip_address.ilike(term),
        ))
    if since:
        query = query.filter(AuditLog.created_at >= since)
    if until:
        query = query.filter(AuditLog.created_at <= until)
    return query


def _ban_target(db: Session, req: Request, admin: User, target: User, reason: str):
    if target.id == admin.id:
        save_admin_log(db, req, admin, "ban_user_denied", "Administrator attempted to ban themselves")
        db.commit()
        raise HTTPException(status_code=400, detail="You cannot ban yourself")
    if target.role == "admin":
        save_admin_log(
            db, req, admin, "ban_user_denied",
            f"Administrator attempted to ban another administrator: {target.email}",
        )
        db.commit()
        raise HTTPException(status_code=400, detail="Administrators cannot ban another administrator")
    target.is_banned = True
    target.ban_reason = reason
    db.query(UserSession).filter_by(user_id=target.id).update({"is_active": False})
    save_admin_log(db, req, admin, "ban_user", f"Banned {target.email}: {reason}")


@router.get("/stats")
def get_dashboard_stats(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    since = datetime.now(timezone.utc) - timedelta(days=7)
    return {
        "total_users": db.query(User).count(),
        "banned_users": db.query(User).filter_by(is_banned=True).count(),
        "total_applications": db.query(Application).count(),
        "pending_applications": db.query(Application).filter(
            func.lower(Application.status) == "pending"
        ).count(),
        "total_groups": db.query(Group).count(),
        "active_sessions": db.query(UserSession).filter(
            UserSession.is_active.is_(True),
            UserSession.expires_at > datetime.now(timezone.utc),
        ).count(),
        "last_7_days": {
            "new_users": db.query(User).filter(User.created_at >= since).count(),
            "new_applications": db.query(Application).filter(Application.created_at >= since).count(),
            "audit_events": db.query(AuditLog).filter(AuditLog.created_at >= since).count(),
        },
    }


@router.get("/users", response_model=list[UserOut])
def list_all_users(
    response: Response,
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_banned: Optional[bool] = None,
    created_after: Optional[datetime] = None,
    created_before: Optional[datetime] = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = _filtered_users(db, search, role, is_banned, created_after, created_before)
    response.headers["X-Total-Count"] = str(query.count())
    return query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/users/{user_id}")
def get_user_detail(
    user_id: str,
    req: Request,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter_by(id=user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    sessions = db.query(UserSession).filter_by(user_id=target.id).order_by(
        UserSession.created_at.desc()
    ).all()
    groups = db.query(Group).outerjoin(
        GroupMember, Group.id == GroupMember.group_id
    ).filter(or_(
        Group.owner_id == target.id,
        GroupMember.user_id == target.id,
    )).distinct().all()
    group_ids = [group.id for group in groups]
    applications = db.query(Application).filter(or_(
        Application.owner_id == target.id,
        Application.group_id.in_(group_ids),
    )).order_by(Application.created_at.desc()).all()
    logs = db.query(AuditLog).filter(
        AuditLog.user_id == target.id
    ).order_by(AuditLog.created_at.desc()).limit(50).all()
    save_admin_log(db, req, admin, "view_user_detail", f"Viewed user {target.email}")
    db.commit()
    return {
        "user": UserOut.model_validate(target),
        "applications": applications,
        "groups": groups,
        "sessions": [
            {
                "id": session.id,
                "ip_address": session.ip_address,
                "user_agent": session.user_agent,
                "is_active": session.is_active,
                "created_at": session.created_at,
                "expires_at": session.expires_at,
            }
            for session in sessions
        ],
        "audit_logs": [AuditLogOut.model_validate(log) for log in logs],
    }


@router.post("/users/{user_id}/ban", response_model=UserOut)
def ban_user(
    user_id: str,
    payload: BanUserRequest,
    req: Request,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter_by(id=user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    _ban_target(db, req, admin, target, payload.reason)
    db.commit()
    db.refresh(target)
    return target


@router.post("/users/{user_id}/unban", response_model=UserOut)
def unban_user(
    user_id: str,
    req: Request,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter_by(id=user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.is_banned = False
    target.ban_reason = None
    save_admin_log(db, req, admin, "unban_user", f"Unbanned {target.email}")
    db.commit()
    db.refresh(target)
    return target


@router.patch("/users/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: str,
    payload: UserRoleUpdate,
    req: Request,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter_by(id=user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == admin.id:
        save_admin_log(db, req, admin, "change_user_role_denied", "Administrator attempted to change their own role")
        db.commit()
        raise HTTPException(status_code=400, detail="You cannot change your own role")
    old_role = target.role
    target.role = payload.role
    save_admin_log(
        db, req, admin, "change_user_role",
        f"Changed {target.email} role from {old_role} to {payload.role}",
    )
    db.commit()
    db.refresh(target)
    return target


@router.patch("/users/{user_id}/status", response_model=UserOut)
def toggle_user_status(
    user_id: str,
    req: Request,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter_by(id=user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.is_banned:
        target.is_banned = False
        target.ban_reason = None
        save_admin_log(db, req, admin, "unban_user", f"Unbanned {target.email}")
    else:
        _ban_target(db, req, admin, target, "Suspended by administrator")
    db.commit()
    db.refresh(target)
    return target


@router.delete("/users/{user_id}/sessions")
def revoke_user_sessions(
    user_id: str,
    req: Request,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter_by(id=user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    count = db.query(UserSession).filter_by(user_id=target.id, is_active=True).update(
        {"is_active": False}
    )
    save_admin_log(db, req, admin, "revoke_user_sessions", f"Revoked {count} sessions for {target.email}")
    db.commit()
    return {"revoked_sessions": count}


@router.post("/users/bulk-ban")
def bulk_ban_users(
    payload: BulkUserAction,
    req: Request,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if not payload.reason:
        raise HTTPException(status_code=422, detail="A reason is required for bulk ban")
    targets = db.query(User).filter(User.id.in_(payload.user_ids)).all()
    if len(targets) != len(set(payload.user_ids)):
        raise HTTPException(status_code=404, detail="One or more users were not found")
    if any(target.id == admin.id for target in targets):
        save_admin_log(db, req, admin, "bulk_ban_denied", "Bulk ban included the acting administrator")
        db.commit()
        raise HTTPException(status_code=400, detail="You cannot ban yourself")
    if any(target.role == "admin" for target in targets):
        save_admin_log(db, req, admin, "bulk_ban_denied", "Bulk ban included another administrator")
        db.commit()
        raise HTTPException(status_code=400, detail="Administrators cannot ban another administrator")
    for target in targets:
        _ban_target(db, req, admin, target, payload.reason)
    save_admin_log(db, req, admin, "bulk_ban_users", f"Banned {len(targets)} users")
    db.commit()
    return {"updated_users": len(targets)}


@router.post("/users/bulk-unban")
def bulk_unban_users(
    payload: BulkUserAction,
    req: Request,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    targets = db.query(User).filter(User.id.in_(payload.user_ids)).all()
    if len(targets) != len(set(payload.user_ids)):
        raise HTTPException(status_code=404, detail="One or more users were not found")
    for target in targets:
        target.is_banned = False
        target.ban_reason = None
    save_admin_log(db, req, admin, "bulk_unban_users", f"Unbanned {len(targets)} users")
    db.commit()
    return {"updated_users": len(targets)}


@router.get("/applications")
def list_applications_for_moderation(
    response: Response,
    search: Optional[str] = None,
    status: Optional[str] = None,
    service_type: Optional[str] = None,
    owner_id: Optional[str] = None,
    group_id: Optional[str] = None,
    created_after: Optional[datetime] = None,
    created_before: Optional[datetime] = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = _filtered_applications(
        db, search, status, service_type, owner_id, group_id, created_after, created_before
    )
    response.headers["X-Total-Count"] = str(query.count())
    return query.order_by(Application.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/groups")
def list_groups_for_moderation(
    response: Response,
    search: Optional[str] = None,
    owner_id: Optional[str] = None,
    created_after: Optional[datetime] = None,
    created_before: Optional[datetime] = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Group)
    if search:
        query = query.filter(Group.name.ilike(f"%{search.strip()}%"))
    if owner_id:
        query = query.filter(Group.owner_id == owner_id)
    if created_after:
        query = query.filter(Group.created_at >= created_after)
    if created_before:
        query = query.filter(Group.created_at <= created_before)
    response.headers["X-Total-Count"] = str(query.count())
    return query.order_by(Group.created_at.desc()).offset(offset).limit(limit).all()


@router.delete("/applications/bulk-delete")
def bulk_delete_applications(
    payload: BulkDeleteRequest,
    req: Request,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    targets = db.query(Application).filter(Application.id.in_(payload.ids)).all()
    if len(targets) != len(set(payload.ids)):
        raise HTTPException(status_code=404, detail="One or more applications were not found")
    db.query(Application).filter(Application.id.in_(payload.ids)).delete(synchronize_session=False)
    save_admin_log(db, req, admin, "bulk_delete_applications", f"Deleted {len(targets)} applications")
    db.commit()
    return {"deleted": len(targets)}


@router.delete("/applications/{application_id}")
def delete_application(
    application_id: str,
    req: Request,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(Application).filter_by(id=application_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(target)
    save_admin_log(db, req, admin, "delete_application", f"Deleted application {application_id}")
    db.commit()
    return {"message": "Application deleted"}


@router.delete("/groups/bulk-delete")
def bulk_delete_groups(
    payload: BulkDeleteRequest,
    req: Request,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    targets = db.query(Group).filter(Group.id.in_(payload.ids)).all()
    if len(targets) != len(set(payload.ids)):
        raise HTTPException(status_code=404, detail="One or more groups were not found")
    for target in targets:
        db.delete(target)
    save_admin_log(db, req, admin, "bulk_delete_groups", f"Deleted {len(targets)} groups")
    db.commit()
    return {"deleted": len(targets)}


@router.delete("/groups/{group_id}")
def delete_group(
    group_id: str,
    req: Request,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(Group).filter_by(id=group_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Group not found")
    db.delete(target)
    save_admin_log(db, req, admin, "delete_group", f"Deleted group {group_id}")
    db.commit()
    return {"message": "Group deleted"}


@router.get("/audit-logs", response_model=list[AuditLogOut])
def get_audit_logs(
    response: Response,
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    email: Optional[str] = None,
    ip_address: Optional[str] = None,
    search: Optional[str] = None,
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = _filtered_audit_logs(
        db, action, user_id, email, ip_address, search, since, until
    )
    response.headers["X-Total-Count"] = str(query.count())
    return query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/audit-logs/failed-logins")
def failed_login_summary(
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(
        AuditLog.ip_address.label("ip_address"),
        AuditLog.user_email.label("account"),
        func.count(AuditLog.id).label("failed_attempts"),
        func.max(AuditLog.created_at).label("last_attempt_at"),
    ).filter(AuditLog.action.in_(["login_failed", "banned_login_attempt"]))
    if since:
        query = query.filter(AuditLog.created_at >= since)
    if until:
        query = query.filter(AuditLog.created_at <= until)
    rows = query.group_by(AuditLog.ip_address, AuditLog.user_email).order_by(
        func.count(AuditLog.id).desc()
    ).all()
    return [
        {
            "ip_address": row.ip_address,
            "account": row.account,
            "failed_attempts": row.failed_attempts,
            "last_attempt_at": row.last_attempt_at,
        }
        for row in rows
    ]


def _csv_value(value):
    if value is None:
        return ""
    text = value.isoformat() if isinstance(value, datetime) else str(value)
    if text.startswith(("=", "+", "-", "@", "\t", "\r")):
        return "'" + text
    return text


@router.get("/export/{kind}")
@router.get("/exports/{kind}", include_in_schema=False)
def export_csv(
    kind: str,
    req: Request,
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_banned: Optional[bool] = None,
    status: Optional[str] = None,
    service_type: Optional[str] = None,
    owner_id: Optional[str] = None,
    group_id: Optional[str] = None,
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    email: Optional[str] = None,
    ip_address: Optional[str] = None,
    created_after: Optional[datetime] = None,
    created_before: Optional[datetime] = None,
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    output = io.StringIO(newline="")
    writer = csv.writer(output)
    if kind == "users":
        writer.writerow(["id", "full_name", "email", "role", "is_banned", "ban_reason", "created_at", "last_login_at"])
        rows = _filtered_users(db, search, role, is_banned, created_after, created_before).order_by(
            User.created_at.desc()
        ).all()
        for row in rows:
            writer.writerow([_csv_value(getattr(row, field)) for field in (
                "id", "full_name", "email", "role", "is_banned", "ban_reason", "created_at", "last_login_at"
            )])
    elif kind == "applications":
        writer.writerow(["id", "applicant_name", "nid_number", "service_type", "status", "owner_id", "group_id", "assigned_to", "created_at"])
        rows = _filtered_applications(
            db, search, status, service_type, owner_id, group_id, created_after, created_before
        ).order_by(Application.created_at.desc()).all()
        for row in rows:
            writer.writerow([_csv_value(getattr(row, field)) for field in (
                "id", "applicant_name", "nid_number", "service_type", "status", "owner_id", "group_id", "assigned_to", "created_at"
            )])
    elif kind == "audit-logs":
        writer.writerow(["id", "user_id", "user_email", "action", "details", "ip_address", "user_agent", "created_at"])
        rows = _filtered_audit_logs(
            db, action, user_id, email, ip_address, search, since, until
        ).order_by(AuditLog.created_at.desc()).all()
        for row in rows:
            writer.writerow([_csv_value(value) for value in (
                row.id, row.user_id, row.user_email, row.action, row.details,
                row.ip_address, row.browser, row.created_at,
            )])
    else:
        raise HTTPException(status_code=404, detail="Export type must be users, applications, or audit-logs")

    save_admin_log(db, req, admin, "export_data", f"Exported {kind}; query={req.url.query}; rows={len(rows)}")
    db.commit()
    return Response(
        content=output.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{kind}.csv"'},
    )
