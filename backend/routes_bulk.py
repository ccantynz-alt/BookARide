from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import BulkEmailRequest
from typing import List
import os
import requests
import logging

bulk_router = APIRouter(prefix="/bulk", tags=["Bulk Operations"])
logger = logging.getLogger(__name__)

@bulk_router.post("/status-update")
async def bulk_status_update(booking_ids: List[str], new_status: str, db: AsyncIOMotorDatabase = None):
    """Update status for multiple bookings"""
    try:
        result = await db.bookings.update_many(
            {"id": {"$in": booking_ids}},
            {"$set": {"status": new_status}}
        )
        return {
            "message": "Status updated successfully",
            "updated_count": result.modified_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@bulk_router.delete("/delete")
async def bulk_delete(booking_ids: List[str], db: AsyncIOMotorDatabase = None):
    """Delete multiple bookings"""
    try:
        result = await db.bookings.delete_many({"id": {"$in": booking_ids}})
        return {
            "message": "Bookings deleted successfully",
            "deleted_count": result.deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def send_email_via_mailgun(email: str, subject: str, message: str):
    """Send email using Mailgun"""
    try:
        mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
        mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
        sender_email = os.environ.get('SENDER_EMAIL', 'noreply@bookaride.co.nz')
        
        if not mailgun_api_key or not mailgun_domain:
            logger.error("Mailgun not configured")
            return False
        
        response = requests.post(
            f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
            auth=("api", mailgun_api_key),
            data={
                "from": f"BookaRide <{sender_email}>",
                "to": email,
                "subject": subject,
                "text": message
            }
        )
        
        if response.status_code == 200:
            logger.info(f"Email sent to {email}")
            return True
        else:
            logger.error(f"Mailgun error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        return False

@bulk_router.post("/email")
async def bulk_email(request: BulkEmailRequest, background_tasks: BackgroundTasks, db: AsyncIOMotorDatabase = None):
    """Send email to multiple customers"""
    try:
        # Get bookings
        bookings = await db.bookings.find(
            {"id": {"$in": request.booking_ids}},
            {"_id": 0}
        ).to_list(1000)
        
        # Send emails in background
        sent_count = 0
        for booking in bookings:
            email = booking.get('email')
            if email:
                # Personalize message
                personalized_message = request.message.replace('{{name}}', booking.get('name', 'Customer'))
                personalized_message = personalized_message.replace('{{booking_id}}', booking.get('id', ''))
                
                # Add to background tasks
                background_tasks.add_task(send_email_via_mailgun, email, request.subject, personalized_message)
                sent_count += 1
        
        return {
            "message": "Emails queued successfully",
            "sent_count": sent_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@bulk_router.post("/manual-booking")
async def create_manual_booking(booking_data: dict, db: AsyncIOMotorDatabase = None):
    """Create a booking manually from admin panel"""
    try:
        import uuid
        from datetime import datetime
        
        # Generate booking ID
        booking_data['id'] = str(uuid.uuid4())
        booking_data['createdAt'] = datetime.utcnow()
        booking_data['status'] = booking_data.get('status', 'confirmed')
        booking_data['payment_status'] = booking_data.get('payment_status', 'manual')
        
        # Insert booking
        await db.bookings.insert_one(booking_data)
        
        return {
            "message": "Booking created successfully",
            "booking_id": booking_data['id']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
