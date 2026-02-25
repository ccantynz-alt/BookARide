from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
import uuid

# Email Template Model
class EmailTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    subject: str
    body: str
    category: str = "general"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class EmailTemplateCreate(BaseModel):
    name: str
    subject: str
    body: str
    category: Optional[str] = "general"

# Driver Model
class Driver(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: str
    license_number: str
    status: str = "active"  # active, inactive, on_leave
    vehicle_id: Optional[str] = None
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DriverCreate(BaseModel):
    name: str
    phone: str
    email: str
    license_number: str
    vehicle_id: Optional[str] = None
    notes: Optional[str] = ""

# Vehicle Model
class Vehicle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    plate_number: str
    model: str
    capacity: int
    year: int
    color: str
    status: str = "available"  # available, in_use, maintenance
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class VehicleCreate(BaseModel):
    plate_number: str
    model: str
    capacity: int
    year: int
    color: str
    notes: Optional[str] = ""

# Customer Note Model
class CustomerNote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_email: str
    note: str
    created_by: str  # admin username
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CustomerNoteCreate(BaseModel):
    customer_email: str
    note: str

# Service Type Configuration
class ServiceTypeConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    display_name: str
    base_price: float
    per_km_rate: float
    active: bool = True
    description: Optional[str] = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ServiceTypeConfigCreate(BaseModel):
    name: str
    display_name: str
    base_price: float
    per_km_rate: float
    description: Optional[str] = ""

# Bulk Email Request
class BulkEmailRequest(BaseModel):
    booking_ids: List[str]
    subject: str
    message: str

# Analytics Request
class AnalyticsRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
