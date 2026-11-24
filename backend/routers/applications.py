from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

if __package__ == "backend.routers":
    from ..database import get_db
    from ..models import User, Application, Group, GroupMember
    from ..schemas import ApplicationCreate, ApplicationUpdate, ApplicationOut
    from ..core.security import get_current_user
else:
    from database import get_db
    from models import User, Application, Group, GroupMember
    from schemas import ApplicationCreate, ApplicationUpdate, ApplicationOut
    from core.security import get_current_user

router = APIRouter(prefix="/api/applications", tags=["Applications"])


@router.get("", response_model=List[ApplicationOut])
def list_applications(
    search: Optional[str] = None,
    service_type: Optional[str] = None,
    status: Optional[str] = None,
    group_id: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Application)

    # Admin সব ডাটা দেখবে; সাধারণ User শুধু নিজের বা তার গ্রুপের ডাটা দেখবে
    if user.role != "admin":
        my_groups = [m.group_id for m in db.query(GroupMember).filter_by(user_id=user.id).all()]
        query = query.filter(or_(Application.owner_id == user.id, Application.group_id.in_(my_groups)))

    if search:
        query = query.filter(
            or_(Application.applicant_name.ilike(f"%{search}%"), Application.nid_number.ilike(f"%{search}%"))
        )
    if service_type:
        query = query.filter(Application.service_type == service_type)
    if status:
        query = query.filter(Application.status == status)
    if group_id:
        query = query.filter(Application.group_id == group_id)

    return query.order_by(Application.created_at.desc()).all()


@router.post("", response_model=ApplicationOut, status_code=201)
def create_application(
    payload: ApplicationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # যদি কোনো গ্রুপের অধীনে আবেদন তৈরি করা হয়, তবে can_create পারমিশন চেক করা হচ্ছে
    if payload.group_id and user.role != "admin":
        member = db.query(GroupMember).filter_by(group_id=payload.group_id, user_id=user.id).first()
        if not member or not member.can_create:
            raise HTTPException(status_code=403, detail="You do not have permission to create in this group")
        if payload.assigned_to and not member.can_assign:
            raise HTTPException(status_code=403, detail="You do not have permission to assign applications")
    if payload.group_id and not db.query(Group).filter_by(id=payload.group_id).first():
        raise HTTPException(status_code=404, detail="Group not found")
    if payload.assigned_to:
        target = db.query(User).filter_by(id=payload.assigned_to).first()
        if not target:
            raise HTTPException(status_code=404, detail="Assigned user not found")
        if payload.group_id and user.role != "admin" and not db.query(GroupMember).filter_by(
            group_id=payload.group_id, user_id=payload.assigned_to
        ).first():
            raise HTTPException(status_code=400, detail="Assigned user must be a group member")

    app = Application(
        applicant_name=payload.applicant_name.strip(),
        nid_number=payload.nid_number.strip(),
        service_type=payload.service_type,
        owner_id=user.id,
        group_id=payload.group_id,
        assigned_to=payload.assigned_to,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.patch("/{app_id}", response_model=ApplicationOut)
def update_application(
    app_id: str,
    payload: ApplicationUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app = db.query(Application).filter_by(id=app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="No application fields provided")
    is_owner_or_admin = user.role == "admin" or app.owner_id == user.id
    member = None
    if not is_owner_or_admin and app.group_id:
        member = db.query(GroupMember).filter_by(group_id=app.group_id, user_id=user.id).first()

    non_assignment_changes = set(changes) - {"assigned_to"}
    if non_assignment_changes and not (
        is_owner_or_admin or (member and member.can_edit)
    ):
        raise HTTPException(status_code=403, detail="Not authorized to edit this application")
    if "assigned_to" in changes and not (
        is_owner_or_admin or (member and member.can_assign)
    ):
        raise HTTPException(status_code=403, detail="Not authorized to assign this application")

    assigned_to = changes.get("assigned_to")
    if "assigned_to" in changes and assigned_to:
        target = db.query(User).filter_by(id=assigned_to).first()
        if not target:
            raise HTTPException(status_code=404, detail="Assigned user not found")
        if app.group_id and user.role != "admin" and not db.query(GroupMember).filter_by(
            group_id=app.group_id, user_id=assigned_to
        ).first():
            raise HTTPException(status_code=400, detail="Assigned user must be a group member")

    for field, value in changes.items():
        setattr(app, field, value)

    db.commit()
    db.refresh(app)
    return app


@router.delete("/{app_id}")
def delete_application(
    app_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app = db.query(Application).filter_by(id=app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if user.role != "admin" and app.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the owner or admin can delete this application")

    db.delete(app)
    db.commit()
    return {"message": "Application deleted"}