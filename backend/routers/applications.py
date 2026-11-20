from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import get_db
from models import User, Application, GroupMember
from schemas import ApplicationCreate, ApplicationUpdate, ApplicationOut
from core.security import get_current_user

router = APIRouter(prefix="/api/applications", tags=["Applications"])


@router.get("", response_model=List[ApplicationOut])
def list_applications(
    search: Optional[str] = None,
    service_type: Optional[str] = None,
    status: Optional[str] = None,
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

    # পারমিশন চেক: Admin, নিজের আবেদন, অথবা গ্রুপে can_edit পারমিশন থাকতে হবে
    can_edit = (user.role == "admin") or (app.owner_id == user.id)
    if not can_edit and app.group_id:
        member = db.query(GroupMember).filter_by(group_id=app.group_id, user_id=user.id).first()
        can_edit = bool(member and member.can_edit)

    if not can_edit:
        raise HTTPException(status_code=403, detail="Not authorized to edit this application")

    for field, value in payload.model_dump(exclude_unset=True).items():
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