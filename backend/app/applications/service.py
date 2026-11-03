from fastapi import HTTPException
from app.applications.repository import ApplicationRepository
from app.applications.schemas import ApplicationCreate, ApplicationUpdate

class ApplicationService:
    @staticmethod
    def create_application(app_data: ApplicationCreate):
        response = ApplicationRepository.insert(app_data.dict())
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create application")
        return response.data[0]

    @staticmethod
    def get_applications():
        response = ApplicationRepository.get_all()
        return response.data

    @staticmethod
    def get_application_by_id(app_id: str):
        response = ApplicationRepository.get_by_id(app_id)
        if not response.data:
            raise HTTPException(status_code=404, detail="Application not found")
        return response.data[0]

    @staticmethod
    def update_application(app_id: str, app_data: ApplicationUpdate):
        update_data = {k: v for k, v in app_data.dict().items() if v is not None}
        response = ApplicationRepository.update(app_id, update_data)
        if not response.data:
            raise HTTPException(status_code=404, detail="Application not found or update failed")
        return response.data[0]

    @staticmethod
    def delete_application(app_id: str):
        ApplicationRepository.delete(app_id)
        return {"message": "Application deleted successfully", "id": app_id}