from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import ServiceTypeConfig, ServiceTypeConfigCreate
from datetime import datetime
import uuid

settings_router = APIRouter(prefix="/settings", tags=["Settings"])

@settings_router.get("/service-types")
async def get_service_types(db: AsyncIOMotorDatabase = None):
    """Get all service type configurations"""
    try:
        service_types = await db.service_types.find({}, {"_id": 0}).to_list(100)
        return {"service_types": service_types}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@settings_router.post("/service-types")
async def create_service_type(service_type: ServiceTypeConfigCreate):
    """Create a new service type configuration"""
    try:
        new_service_type = ServiceTypeConfig(
            **service_type.dict(),
            id=str(uuid.uuid4())
        )
        await db.service_types.insert_one(new_service_type.dict())
        return new_service_type
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@settings_router.put("/service-types/{service_type_id}")
async def update_service_type(service_type_id: str, service_type: ServiceTypeConfigCreate):
    """Update a service type configuration"""
    try:
        result = await db.service_types.update_one(
            {"id": service_type_id},
            {"$set": {
                **service_type.dict(),
                "updated_at": datetime.utcnow()
            }}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Service type not found")
        return {"message": "Service type updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@settings_router.delete("/service-types/{service_type_id}")
async def delete_service_type(service_type_id: str):
    """Delete a service type configuration"""
    try:
        result = await db.service_types.delete_one({"id": service_type_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Service type not found")
        return {"message": "Service type deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@settings_router.get("/pricing")
async def get_pricing_config(db: AsyncIOMotorDatabase = None):
    """Get current pricing configuration"""
    try:
        # This would return global pricing settings
        config = await db.pricing_config.find_one({"type": "global"}, {"_id": 0})
        if not config:
            # Return default config
            config = {
                "type": "global",
                "base_fee": 30.0,
                "per_km_rate": 2.5,
                "per_passenger_fee": 10.0,
                "vip_fee": 25.0,
                "luggage_fee": 25.0
            }
        return config
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@settings_router.put("/pricing")
async def update_pricing_config(config: dict):
    """Update pricing configuration"""
    try:
        config["type"] = "global"
        config["updated_at"] = datetime.utcnow()
        
        result = await db.pricing_config.update_one(
            {"type": "global"},
            {"$set": config},
            upsert=True
        )
        return {"message": "Pricing configuration updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
