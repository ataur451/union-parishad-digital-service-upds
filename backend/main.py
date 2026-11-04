import logging
import os
import re
from typing import Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from supabase import Client, create_client

load_dotenv()

logger = logging.getLogger("upds")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
# Comma separated list, e.g. "https://your-app.vercel.app,http://localhost:5173"
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

supabase: Client | None = None

try:
    if SUPABASE_URL and SUPABASE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception:  # noqa: BLE001
    # Log the real reason (bad key, bad URL...) instead of hiding it
    logger.exception("Failed to create Supabase client")
    supabase = None


def ensure_supabase_available() -> None:
    if supabase is None:
        raise HTTPException(
            status_code=503,
            detail="Supabase is not configured or is unreachable. "
            "Add SUPABASE_URL and SUPABASE_KEY in the Render environment variables.",
        )


app = FastAPI(title="Union Parishad Digital Service (UPDS) API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip().rstrip("/") for o in FRONTEND_URL.split(",") if o.strip()],
    allow_credentials=False,  # no cookies are used, so no need for credentials
    allow_methods=["*"],
    allow_headers=["*"],
)

ServiceType = Literal[
    "Trade License",
    "Citizen Certificate",
    "Character Certificate",
    "Family Certificate",
]
ApplicationStatus = Literal["Pending", "Approved", "Rejected"]


def _check_nid(value: str) -> str:
    value = value.strip()
    # Bangladesh NID: 10 (smart card), 13 or 17 digits
    if not re.fullmatch(r"\d{10}|\d{13}|\d{17}", value):
        raise ValueError("NID must be 10, 13 or 17 digits")
    return value


class ApplicationCreate(BaseModel):
    applicant_name: str
    nid_number: str
    service_type: ServiceType

    @field_validator("applicant_name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Applicant name is required")
        return v

    @field_validator("nid_number")
    @classmethod
    def nid_valid(cls, v: str) -> str:
        return _check_nid(v)


class ApplicationUpdate(BaseModel):
    applicant_name: Optional[str] = None
    nid_number: Optional[str] = None
    service_type: Optional[ServiceType] = None
    status: Optional[ApplicationStatus] = None

    @field_validator("nid_number")
    @classmethod
    def nid_valid(cls, v: Optional[str]) -> Optional[str]:
        return _check_nid(v) if v is not None else v


@app.get("/")
@app.get("/api/")
def root():
    return {"message": "Welcome to UPDS Backend API"}


@app.post("/api/applications")
@app.post("/api/applications/")
def create_application(app_data: ApplicationCreate):
    ensure_supabase_available()
    response = supabase.table("service_applications").insert(app_data.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create application")
    return {"message": "Application created successfully", "data": response.data[0]}


@app.get("/api/applications")
@app.get("/api/applications/")
def get_applications():
    ensure_supabase_available()
    response = (
        supabase.table("service_applications")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return {"data": response.data}


@app.get("/api/applications/{app_id}")
def get_application(app_id: str):
    ensure_supabase_available()
    response = supabase.table("service_applications").select("*").eq("id", app_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"data": response.data[0]}


@app.put("/api/applications/{app_id}")
def update_application(app_id: str, app_data: ApplicationUpdate):
    ensure_supabase_available()
    update_data = {k: v for k, v in app_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nothing to update")
    response = supabase.table("service_applications").update(update_data).eq("id", app_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Application not found or update failed")
    return {"message": "Application updated successfully", "data": response.data[0]}


@app.delete("/api/applications/{app_id}")
def delete_application(app_id: str):
    ensure_supabase_available()
    supabase.table("service_applications").delete().eq("id", app_id).execute()
    return {"message": "Application deleted successfully", "id": app_id}
