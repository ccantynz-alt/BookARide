from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import Vehicle, VehicleCreate
from datetime import datetime
import uuid

vehicles_router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@vehicles_router.get("")
async def get_vehicles(db: AsyncIOMotorDatabase = None):
    """Get all vehicles"""
    try:
        vehicles = await db.vehicles.find({}, {"_id": 0}).to_list(1000)
        return {"vehicles": vehicles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@vehicles_router.post("")
async def create_vehicle(vehicle: VehicleCreate, db: AsyncIOMotorDatabase = None):
    """Create a new vehicle"""
    try:
        new_vehicle = Vehicle(
            **vehicle.dict(),
            id=str(uuid.uuid4())
        )
        await db.vehicles.insert_one(new_vehicle.dict())
        return new_vehicle
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@vehicles_router.put("/{vehicle_id}")
async def update_vehicle(vehicle_id: str, vehicle: VehicleCreate, db: AsyncIOMotorDatabase = None):
    """Update a vehicle"""
    try:
        result = await db.vehicles.update_one(
            {"id": vehicle_id},
            {"$set": {
                **vehicle.dict(),
                "updated_at": datetime.utcnow()
            }}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        return {"message": "Vehicle updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@vehicles_router.delete("/{vehicle_id}")
async def delete_vehicle(vehicle_id: str, db: AsyncIOMotorDatabase = None):
    """Delete a vehicle"""
    try:
        result = await db.vehicles.delete_one({"id": vehicle_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        return {"message": "Vehicle deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
