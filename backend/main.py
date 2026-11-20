import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import engine, Base
import models  # সব মডেল লোড করার জন্য
from routers import auth, applications, groups, admin

load_dotenv()

# অ্যাপ চালু হওয়ার সাথে সাথে Supabase ডাটাবেজে সব টেবিল অটোমেটিক তৈরি করবে
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Union Parishad Digital Service (UPDS) API", version="2.0.0")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "https://union-parishad-digital-service-upds.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(applications.router)
app.include_router(groups.router)
app.include_router(admin.router)


@app.get("/")
def health_check():
    return {"status": "UPDS Secure Multi-User API is running"}