import sqlite3
from pathlib import Path

DATABASE_URL = Path(__file__).parent / "applications.db"


def get_db():
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    return conn


def create_table():
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