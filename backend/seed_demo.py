"""Add demo data without overwriting existing records."""
from database import Base, SessionLocal, engine
from core.security import hash_password
from models import Application, Group, GroupMember, User
Base.metadata.create_all(bind=engine)
def main():
    db = SessionLocal()
    try:
        for email, name, role in [("admin@example.com", "Demo Admin", "admin"), ("citizen@example.com", "Demo Citizen", "user")]:
            if not db.query(User).filter_by(email=email).first():
                db.add(User(email=email, full_name=name, role=role, hashed_password=hash_password("Demo@12345")))
        db.flush()
        citizen = db.query(User).filter_by(email="citizen@example.com").one()
        group = db.query(Group).filter_by(name="Demo Ward Group", owner_id=citizen.id).first()
        if not group:
            group = Group(name="Demo Ward Group", description="Example group", owner_id=citizen.id)
            db.add(group)
            db.flush()
            db.add(GroupMember(group_id=group.id, user_id=citizen.id, group_role="owner", can_create=True, can_edit=True, can_assign=True))
        if not db.query(Application).filter_by(owner_id=citizen.id, applicant_name="Demo Citizen").first():
            db.add(Application(owner_id=citizen.id, group_id=group.id, applicant_name="Demo Citizen", nid_number="1234567890", service_type="citizen-certificate", status="pending", phone="01700000000", email=citizen.email, father_name="Demo Father", mother_name="Demo Mother", address="Example Village", ward_number="1"))
        db.commit()
        print("Demo data ready. Existing accounts were not modified.")
    finally:
        db.close()
if __name__ == "__main__":
    main()
