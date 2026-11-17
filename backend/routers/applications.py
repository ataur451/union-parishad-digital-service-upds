from fastapi import APIRouter, HTTPException
from schemas import ApplicationCreate, ApplicationUpdate
import crud

router = APIRouter(
    prefix="/applications",
    tags=["Applications"]
)


# CREATE APPLICATION
@router.post("/")
def create_application(application: ApplicationCreate):
    return crud.create_application_db(application)


# READ ALL APPLICATIONS
@router.get("/")
def get_applications():
    return crud.get_all_applications_db()


# READ SINGLE APPLICATION
@router.get("/{application_id}")
def get_application(application_id: str):
    application = crud.get_application_by_id_db(application_id)
    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )
    return application


# UPDATE APPLICATION
@router.put("/{application_id}")
def update_application(application_id: str, application: ApplicationUpdate):
    updated = crud.update_application_db(application_id, application)
    if updated is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )
    return updated


# DELETE APPLICATION
@router.delete("/{application_id}")
def delete_application(application_id: str):
    deleted = crud.delete_application_db(application_id)
    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )
    return {
        "message": "Application deleted successfully"
    }