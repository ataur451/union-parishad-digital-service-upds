import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

if __package__ == "backend":
    from .database import engine, Base, SessionLocal, DATABASE_URL
    from . import models  # সব মডেল লোড করার জন্য
    from .routers import auth, applications, groups, admin
    from .core.security import hash_password
else:
    from database import engine, Base, SessionLocal, DATABASE_URL
    import models  # সব মডেল লোড করার জন্য
    from routers import auth, applications, groups, admin
    from core.security import hash_password

load_dotenv()

# অ্যাপ চালু হওয়ার সাথে সাথে Supabase ডাটাবেজে সব টেবিল অটোমেটিক তৈরি করবে
Base.metadata.create_all(bind=engine)


def seed_demo_accounts():
    if os.getenv("DEMO_MODE", "").lower() != "true":
        return
    if not DATABASE_URL.startswith("sqlite"):
        raise RuntimeError("Demo accounts can only be seeded into a local SQLite database")

    admin_password = os.getenv("DEMO_ADMIN_PASSWORD")
    user_password = os.getenv("DEMO_USER_PASSWORD")
    if not admin_password or not user_password:
        raise RuntimeError("Set DEMO_ADMIN_PASSWORD and DEMO_USER_PASSWORD for local demo accounts")

    accounts = [
        ("admin@gmail.com", admin_password, "Demo Admin", "admin"),
        ("user@gmail.com", user_password, "Demo User", "user"),
    ]
    db = SessionLocal()
    try:
        for email, password, full_name, role in accounts:
            if not db.query(models.User).filter_by(email=email).first():
                db.add(models.User(
                    full_name=full_name,
                    email=email,
                    hashed_password=hash_password(password),
                    role=role,
                ))
        db.commit()
    finally:
        db.close()


seed_demo_accounts()

app = FastAPI(title="Union Parishad Digital Service (UPDS) API", version="2.0.0")
logger = logging.getLogger(__name__)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception):
    logger.error(
        "Unhandled error on %s %s",
        request.method,
        request.url.path,
        exc_info=(type(exc), exc, exc.__traceback__),
    )
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(auth.router)
app.include_router(applications.router)
app.include_router(groups.router)
app.include_router(admin.router)


@app.get("/")
def health_check():
    return {"status": "UPDS Secure Multi-User API is running"}