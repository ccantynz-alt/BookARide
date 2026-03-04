from pydantic import BaseModel
from typing import Optional


class DriverCreate(BaseModel):
    name: str
    phone: str
    email: str
    license_number: str
    vehicle_id: Optional[str] = None
    notes: Optional[str] = ""


class DriverLogin(BaseModel):
    email: str
    password: str
