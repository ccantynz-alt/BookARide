from fastapi import APIRouter, HTTPException, Depends
ndb = None  # Will be injected from server.py
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import Driver, DriverCreate
from datetime import datetime
import uuid

drivers_router = APIRouter(prefix="/drivers", tags=["Drivers"])

@drivers_router.get("")
async def get_drivers(db: AsyncIOMotorDatabase = None):
    """Get all drivers"""
    try:
        drivers = await db.drivers.find({}, {"_id": 0}).to_list(1000)
        return {"drivers": drivers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@drivers_router.post("")
async def create_driver(driver: DriverCreate):
    """Create a new driver"""
    try:
        new_driver = Driver(
            **driver.dict(),
            id=str(uuid.uuid4())
        )
        await db.drivers.insert_one(new_driver.dict())
        return new_driver
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@drivers_router.put("/{driver_id}")
async def update_driver(driver_id: str, driver: DriverCreate):
    """Update a driver"""
    try:
        result = await db.drivers.update_one(
            {"id": driver_id},
            {"$set": {
                **driver.dict(),
                "updated_at": datetime.utcnow()
            }}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Driver not found")
        return {"message": "Driver updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@drivers_router.delete("/{driver_id}")
async def delete_driver(driver_id: str):
    """Delete a driver"""
    try:
        result = await db.drivers.delete_one({"id": driver_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Driver not found")
        return {"message": "Driver deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@drivers_router.patch("/{driver_id}/assign")
async def assign_driver(driver_id: str, booking_id: str):
    """Assign driver to a booking"""
    try:
        # Update booking with driver assignment
        result = await db.bookings.update_one(
            {"id": booking_id},
            {"$set": {"driver_id": driver_id}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
        return {"message": "Driver assigned successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
