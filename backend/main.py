import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client | None = None

try:
    if SUPABASE_URL and SUPABASE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception:
    supabase = None


def ensure_supabase_available() -> None:
    if supabase is None:
        raise HTTPException(
            status_code=503,
            detail="Supabase is not configured or is unreachable. Add SUPABASE_URL and SUPABASE_KEY in the Vercel environment variables.",
        )

app = FastAPI(title="Union Parishad Digital Service (UPDS) API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ApplicationCreate(BaseModel):
    applicant_name: str
    nid_number: str
    service_type: str


class ApplicationUpdate(BaseModel):
    applicant_name: Optional[str] = None
    nid_number: Optional[str] = None
    service_type: Optional[str] = None
    status: Optional[str] = None


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
    response = supabase.table("service_applications").select("*").order("created_at", desc=True).execute()
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
    response = supabase.table("service_applications").update(update_data).eq("id", app_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Application not found or update failed")
    return {"message": "Application updated successfully", "data": response.data[0]}


@app.delete("/api/applications/{app_id}")
def delete_application(app_id: str):
    ensure_supabase_available()
    supabase.table("service_applications").delete().eq("id", app_id).execute()
    return {"message": "Application deleted successfully", "id": app_id}