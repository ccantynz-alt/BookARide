import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_admin
from app.models.driver import DriverCreate

router = APIRouter(prefix="/drivers", tags=["Drivers"])


@router.get("")
async def list_drivers(current_admin: dict = Depends(get_current_admin)):
    from app.main import db

    drivers = await db.drivers.find({}, {"_id": 0}).to_list(1000)
    return {"drivers": drivers}


@router.post("")
async def create_driver(
    driver: DriverCreate,
    current_admin: dict = Depends(get_current_admin),
):
    from app.main import db

    new_driver = {
        "id": str(uuid.uuid4()),
        **driver.dict(),
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.drivers.insert_one(new_driver)
    return new_driver


@router.put("/{driver_id}")
async def update_driver(
    driver_id: str,
    updates: dict,
    current_admin: dict = Depends(get_current_admin),
):
    from app.main import db

    result = await db.drivers.update_one({"id": driver_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")
    return {"message": "Driver updated"}


@router.delete("/{driver_id}")
async def delete_driver(
    driver_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    from app.main import db

    result = await db.drivers.delete_one({"id": driver_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")
    return {"message": "Driver deleted"}
