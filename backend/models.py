from database import get_db


def create_application_table():
    conn = get_db()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS applications (
            id TEXT PRIMARY KEY,
            applicant_name TEXT NOT NULL,
            nid_number TEXT NOT NULL,
            service_type TEXT NOT NULL,
            status TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()