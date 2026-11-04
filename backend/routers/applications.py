from fastapi import APIRouter, HTTPException
from uuid import uuid4

from database import get_db
from schemas import ApplicationCreate, ApplicationUpdate


router = APIRouter(
    prefix="/applications",
    tags=["Applications"]
)


# CREATE APPLICATION
@router.post("/")
def create_application(application: ApplicationCreate):

    conn = get_db()

    application_id = str(uuid4())

    conn.execute(
        """
        INSERT INTO applications
        (id, applicant_name, nid_number, service_type, status)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            application_id,
            application.applicant_name,
            application.nid_number,
            application.service_type,
            application.status
        )
    )

    conn.commit()

    result = conn.execute(
        "SELECT * FROM applications WHERE id = ?",
        (application_id,)
    ).fetchone()

    conn.close()

    return dict(result)


# READ ALL APPLICATIONS
@router.get("/")
def get_applications():

    conn = get_db()

    applications = conn.execute(
        "SELECT * FROM applications ORDER BY rowid DESC"
    ).fetchall()

    conn.close()

    return [dict(app) for app in applications]


# READ SINGLE APPLICATION
@router.get("/{application_id}")
def get_application(application_id: str):

    conn = get_db()

    application = conn.execute(
        "SELECT * FROM applications WHERE id = ?",
        (application_id,)
    ).fetchone()

    conn.close()

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    return dict(application)


# UPDATE APPLICATION
@router.put("/{application_id}")
def update_application(
    application_id: str,
    application: ApplicationUpdate
):

    conn = get_db()

    existing = conn.execute(
        "SELECT * FROM applications WHERE id = ?",
        (application_id,)
    ).fetchone()

    if existing is None:
        conn.close()
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    conn.execute(
        """
        UPDATE applications
        SET applicant_name = ?,
            nid_number = ?,
            service_type = ?,
            status = ?
        WHERE id = ?
        """,
        (
            application.applicant_name,
            application.nid_number,
            application.service_type,
            application.status,
            application_id
        )
    )

    conn.commit()

    updated = conn.execute(
        "SELECT * FROM applications WHERE id = ?",
        (application_id,)
    ).fetchone()

    conn.close()

    return dict(updated)


# DELETE APPLICATION
@router.delete("/{application_id}")
def delete_application(application_id: str):

    conn = get_db()

    existing = conn.execute(
        "SELECT * FROM applications WHERE id = ?",
        (application_id,)
    ).fetchone()

    if existing is None:
        conn.close()
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    conn.execute(
        "DELETE FROM applications WHERE id = ?",
        (application_id,)
    )

    conn.commit()
    conn.close()

    return {
        "message": "Application deleted successfully"
    }