from pydantic import BaseModel
from typing import Optional

class ApplicationCreate(BaseModel):
    applicant_name: str
    nid_number: str
    service_type: str

class ApplicationUpdate(BaseModel):
    applicant_name: Optional[str] = None
    nid_number: Optional[str] = None
    service_type: Optional[str] = None
    status: Optional[str] = None