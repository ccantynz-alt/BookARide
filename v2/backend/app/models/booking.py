import uuid
from datetime import datetime, timezone
from typing import List, Optional

import pytz
from pydantic import BaseModel, Field, model_validator


class BookingCreate(BaseModel):
    serviceType: str
    pickupAddress: str
    pickupAddresses: Optional[List[str]] = []
    dropoffAddress: str
    date: str
    time: str
    passengers: str
    departureFlightNumber: Optional[str] = ""
    departureTime: Optional[str] = ""
    arrivalFlightNumber: Optional[str] = ""
    arrivalTime: Optional[str] = ""
    flightNumber: Optional[str] = ""
    name: str
    email: str
    phone: str
    notes: Optional[str] = ""
    pricing: dict
    status: str = "pending"
    payment_status: Optional[str] = "unpaid"
    # Return trip
    bookReturn: Optional[bool] = False
    returnDate: Optional[str] = ""
    returnTime: Optional[str] = ""
    returnFlightNumber: Optional[str] = ""
    returnDepartureFlightNumber: Optional[str] = ""
    returnDepartureTime: Optional[str] = ""
    returnArrivalFlightNumber: Optional[str] = ""
    returnArrivalTime: Optional[str] = ""
    # Preferences
    notificationPreference: Optional[str] = "both"
    skipNotifications: Optional[bool] = False
    paymentMethod: Optional[str] = "card"
    language: Optional[str] = "en"
    vipAirportPickup: Optional[bool] = False
    oversizedLuggage: Optional[bool] = False
    selectedAddOns: Optional[List[str]] = []
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @model_validator(mode="after")
    def validate_return_flight(self):
        service = (self.serviceType or "").lower()
        is_airport = "airport" in service or "shuttle" in service
        if is_airport and self.bookReturn:
            flight = self.returnFlightNumber or self.returnDepartureFlightNumber or ""
            if not flight.strip():
                raise ValueError(
                    "Return flight number is required for airport shuttle return bookings."
                )
        return self

    @model_validator(mode="after")
    def validate_date(self):
        if hasattr(self, "_skip_date_validation") or getattr(self, "id", None):
            return self
        if self.date:
            try:
                nz_tz = pytz.timezone("Pacific/Auckland")
                today = datetime.now(nz_tz).strftime("%Y-%m-%d")
                if self.date < today:
                    raise ValueError(f"Booking date ({self.date}) cannot be in the past.")
            except ValueError:
                raise
            except Exception:
                pass
        return self


class Booking(BookingCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    referenceNumber: Optional[str] = None

    class Config:
        extra = "allow"

    @model_validator(mode="before")
    @classmethod
    def convert_reference(cls, data):
        if isinstance(data, dict) and "referenceNumber" in data:
            ref = data["referenceNumber"]
            if ref is not None:
                data["referenceNumber"] = str(ref)
        return data

    @model_validator(mode="after")
    def validate_return_flight(self):
        return self  # skip validation on existing bookings
