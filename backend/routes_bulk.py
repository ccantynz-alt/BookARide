from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
ndb = None  # Will be injected from server.py
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import BulkEmailRequest
from typing import List
import os
import logging

bulk_router = APIRouter(prefix="/bulk", tags=["Bulk Operations"])
logger = logging.getLogger(__name__)

@bulk_router.post("/status-update")
async def bulk_status_update(booking_ids: List[str], new_status: str):
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
async def bulk_delete(booking_ids: List[str]):
    """Delete multiple bookings"""
    try:
        result = await db.bookings.delete_many({"id": {"$in": booking_ids}})
        return {
            "message": "Bookings deleted successfully",
            "deleted_count": result.deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def send_bulk_email(email: str, subject: str, message: str):
    """Send email using Mailgun or Google Workspace SMTP"""
    try:
        import html
        from email_sender import send_email
        escaped = html.escape(message)
        html_content = f"""
        <html><body style="font-family: Arial, sans-serif;">
            <div style="white-space: pre-wrap; line-height: 1.6;">{escaped}</div>
            <p style="margin-top: 20px; color: #666; font-size: 12px;">BookaRide NZ | bookaride.co.nz</p>
        </body></html>
        """
        return send_email(email, subject, html_content, from_name="BookaRide")
    except ImportError:
        logger.error("email_sender module not available")
        return False
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        return False

@bulk_router.post("/email")
async def bulk_email(request: BulkEmailRequest, background_tasks: BackgroundTasks):
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
                background_tasks.add_task(send_bulk_email, email, request.subject, personalized_message)
                sent_count += 1
        
        return {
            "message": "Emails queued successfully",
            "sent_count": sent_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@bulk_router.post("/manual-booking")
async def create_manual_booking(booking_data: dict):
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
