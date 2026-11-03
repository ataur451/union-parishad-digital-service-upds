from fastapi import APIRouter
from app.applications.schemas import ApplicationCreate, ApplicationUpdate
from app.applications.service import ApplicationService

router = APIRouter(prefix="/api/applications", tags=["Applications"])

@router.post("/")
def create_application(app_data: ApplicationCreate):
    data = ApplicationService.create_application(app_data)
    return {"message": "Application created successfully", "data": data}

@router.get("/")
def get_applications():
    data = ApplicationService.get_applications()
    return {"data": data}

@router.get("/{app_id}")
def get_application(app_id: str):
    data = ApplicationService.get_application_by_id(app_id)
    return {"data": data}

@router.put("/{app_id}")
def update_application(app_id: str, app_data: ApplicationUpdate):
    data = ApplicationService.update_application(app_id, app_data)
    return {"message": "Application updated successfully", "data": data}

@router.delete("/{app_id}")
def delete_application(app_id: str):
    return ApplicationService.delete_application(app_id)