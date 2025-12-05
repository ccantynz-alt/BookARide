from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import EmailTemplate, EmailTemplateCreate
from datetime import datetime
import uuid

templates_router = APIRouter(prefix="/email-templates", tags=["Email Templates"])

@templates_router.get("")
async def get_templates(db: AsyncIOMotorDatabase = None):
    """Get all email templates"""
    try:
        templates = await db.email_templates.find({}, {"_id": 0}).to_list(100)
        return {"templates": templates}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@templates_router.post("")
async def create_template(template: EmailTemplateCreate, db: AsyncIOMotorDatabase = None):
    """Create a new email template"""
    try:
        new_template = EmailTemplate(
            **template.dict(),
            id=str(uuid.uuid4())
        )
        await db.email_templates.insert_one(new_template.dict())
        return new_template
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@templates_router.put("/{template_id}")
async def update_template(template_id: str, template: EmailTemplateCreate, db: AsyncIOMotorDatabase = None):
    """Update an email template"""
    try:
        result = await db.email_templates.update_one(
            {"id": template_id},
            {"$set": {
                **template.dict(),
                "updated_at": datetime.utcnow()
            }}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Template not found")
        return {"message": "Template updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@templates_router.delete("/{template_id}")
async def delete_template(template_id: str, db: AsyncIOMotorDatabase = None):
    """Delete an email template"""
    try:
        result = await db.email_templates.delete_one({"id": template_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Template not found")
        return {"message": "Template deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
