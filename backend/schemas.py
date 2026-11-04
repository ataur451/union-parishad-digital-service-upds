from pydantic import BaseModel
from typing import Literal


class ApplicationCreate(BaseModel):
    applicant_name: str
    nid_number: str
    service_type: str
    status: Literal["Pending", "Approved", "Rejected"] = "Pending"


class ApplicationUpdate(BaseModel):
    applicant_name: str
    nid_number: str
    service_type: str
    status: Literal["Pending", "Approved", "Rejected"]