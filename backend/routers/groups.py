from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

if __package__ == "backend.routers":
    from ..database import get_db
    from ..models import User, Group, GroupMember
    from ..schemas import GroupCreate, GroupMemberAdd, GroupMemberUpdate, GroupOut, GroupRename
    from ..core.security import get_current_user
else:
    from database import get_db
    from models import User, Group, GroupMember
    from schemas import GroupCreate, GroupMemberAdd, GroupMemberUpdate, GroupOut, GroupRename
    from core.security import get_current_user

router = APIRouter(prefix="/api/groups", tags=["Groups & RBAC"])


def get_owned_group(group_id: str, user: User, db: Session) -> Group:
    group = db.query(Group).filter_by(id=group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the group owner can manage this group")
    return group


@router.get("", response_model=List[GroupOut])
def get_my_groups(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role == "admin":
        return db.query(Group).all()
    group_ids = [m.group_id for m in db.query(GroupMember).filter_by(user_id=user.id).all()]
    return db.query(Group).filter(Group.id.in_(group_ids)).all()


@router.post("", response_model=GroupOut, status_code=201)
def create_group(payload: GroupCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    group = Group(
        name=payload.name.strip(),
        owner_id=user.id,
        description=payload.description,
    )
    db.add(group)
    db.flush()

    # গ্রুপ ক্রিয়েটর নিজেই owner হিসেবে সব পারমিশনসহ যুক্ত হবে
    db.add(GroupMember(
        group_id=group.id, user_id=user.id, group_role="owner",
        can_create=True, can_edit=True, can_assign=True,
    ))
    db.commit()
    db.refresh(group)
    return group


@router.post("/{group_id}/members", response_model=GroupOut)
def add_member(
    group_id: str,
    payload: GroupMemberAdd,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(Group).filter_by(id=group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the group owner can add members")

    target = db.query(User).filter_by(email=payload.email.lower()).first()
    if not target:
        raise HTTPException(status_code=404, detail="User with this email not found")
    if target.is_banned:
        raise HTTPException(status_code=403, detail="Banned users cannot be added to groups")

    if db.query(GroupMember).filter_by(group_id=group_id, user_id=target.id).first():
        raise HTTPException(status_code=400, detail="User is already a member")

    db.add(GroupMember(
        group_id=group_id, user_id=target.id, group_role=payload.group_role,
        can_create=payload.can_create, can_edit=payload.can_edit, can_assign=payload.can_assign,
    ))
    db.commit()
    db.refresh(group)
    return group


@router.patch("/{group_id}/members/{member_user_id}", response_model=GroupOut)
def update_member_permissions(
    group_id: str,
    member_user_id: str,
    payload: GroupMemberUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = db.query(Group).filter_by(id=group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the group owner can update permissions")

    member = db.query(GroupMember).filter_by(group_id=group_id, user_id=member_user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(member, field, value)

    db.commit()
    db.refresh(group)
    return group


@router.patch("/{group_id}", response_model=GroupOut)
def rename_group(
    group_id: str,
    payload: GroupRename,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = get_owned_group(group_id, user, db)
    group.name = payload.name.strip()
    db.commit()
    db.refresh(group)
    return group


@router.delete("/{group_id}")
def delete_group(
    group_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    group = get_owned_group(group_id, user, db)
    db.delete(group)
    db.commit()
    return {"message": "Group deleted"}


@router.delete("/{group_id}/members/{member_user_id}")
def remove_member(
    group_id: str,
    member_user_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_owned_group(group_id, user, db)
    member = db.query(GroupMember).filter_by(
        group_id=group_id, user_id=member_user_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if member.user_id == user.id:
        raise HTTPException(status_code=400, detail="The group owner cannot remove themselves")
    db.delete(member)
    db.commit()
    return {"message": "Member removed"}