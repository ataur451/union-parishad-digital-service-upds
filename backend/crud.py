from uuid import uuid4
from database import get_db, create_table
from schemas import ApplicationCreate, ApplicationUpdate


def create_application_db(application: ApplicationCreate):
    create_table()
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


def get_all_applications_db():
    create_table()
    conn = get_db()
    applications = conn.execute(
        "SELECT * FROM applications ORDER BY rowid DESC"
    ).fetchall()
    conn.close()
    return [dict(app) for app in applications]


def get_application_by_id_db(application_id: str):
    create_table()
    conn = get_db()
    application = conn.execute(
        "SELECT * FROM applications WHERE id = ?",
        (application_id,)
    ).fetchone()
    conn.close()
    return dict(application) if application else None


def update_application_db(application_id: str, application: ApplicationUpdate):
    create_table()
    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM applications WHERE id = ?",
        (application_id,)
    ).fetchone()

    if existing is None:
        conn.close()
        return None

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


def delete_application_db(application_id: str):
    create_table()
    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM applications WHERE id = ?",
        (application_id,)
    ).fetchone()

    if existing is None:
        conn.close()
        return False

    conn.execute(
        "DELETE FROM applications WHERE id = ?",
        (application_id,)
    )
    conn.commit()
    conn.close()
    return True