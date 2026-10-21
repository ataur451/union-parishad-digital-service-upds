from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from supabase import create_client, Client

# Set up Supabase connection using project URL and key
SUPABASE_URL = "https://utiuuutfabbcoxzoecda.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0aXV1dXRmYWJiY294em9lY2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MDA4ODIsImV4cCI6MjEwODE3Njg4Mn0.D1URXLFWepdYx-sxDCDuYbbTaK3n1J9-OK8HfCUip2w"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="Union Parishad Digital Service (UPDS) API")

# Enable CORS to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models to validate incoming data
class ApplicationCreate(BaseModel):
    applicant_name: str
    nid_number: str
    service_type: str

class ApplicationUpdate(BaseModel):
    applicant_name: Optional[str] = None
    nid_number: Optional[str] = None
    service_type: Optional[str] = None
    status: Optional[str] = None


# 1. CREATE: Add a new application
@app.post("/api/applications/")
def create_application(app_data: ApplicationCreate):
    response = supabase.table("service_applications").insert(app_data.dict()).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create application")
    return {"message": "Application created successfully", "data": response.data[0]}


# 2. READ LIST: Get all applications list
@app.get("/api/applications/")
def get_applications():
    response = supabase.table("service_applications").select("*").order("created_at", desc=True).execute()
    return {"data": response.data}


# 3. READ SINGLE: Get a specific application by ID
@app.get("/api/applications/{app_id}")
def get_application(app_id: str):
    response = supabase.table("service_applications").select("*").eq("id", app_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"data": response.data[0]}


# 4. UPDATE: Update application details or status
@app.put("/api/applications/{app_id}")
def update_application(app_id: str, app_data: ApplicationUpdate):
    # Filter out fields that are None
    update_data = {k: v for k, v in app_data.dict().items() if v is not None}
    
    response = supabase.table("service_applications").update(update_data).eq("id", app_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Application not found or update failed")
    return {"message": "Application updated successfully", "data": response.data[0]}


# 5. DELETE: Remove an application
@app.delete("/api/applications/{app_id}")
def delete_application(app_id: str):
    response = supabase.table("service_applications").delete().eq("id", app_id).execute()
    return {"message": "Application deleted successfully", "id": app_id}