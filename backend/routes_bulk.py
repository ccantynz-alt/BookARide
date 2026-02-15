from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
ndb = None  # Will be injected from server.py
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import BulkEmailRequest
from typing import List
import os
import logging

try:
    from email_sender import send_email as send_email_unified, get_noreply_email
except ImportError:
    send_email_unified = None
    get_noreply_email = lambda: os.environ.get("NOREPLY_EMAIL", "noreply@bookaride.co.nz")

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

def send_email_bulk(email: str, subject: str, message: str):
    """Send email using Google Workspace SMTP"""
    try:
        if not send_email_unified:
            logger.error("Email service not configured")
            return False
        
        sender_email = os.environ.get('SENDER_EMAIL', get_noreply_email())
        
        # Convert plain text message to simple HTML
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0;">BookaRide.co.nz</h1>
                </div>
                <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e8e4d9; border-top: none;">
                    <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">{message}</div>
                </div>
                <div style="background: #faf8f3; color: #666; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; border: 1px solid #e8e4d9; border-top: none;">
                    <p style="margin: 0;"><span style="color: #D4AF37; font-weight: bold;">BookaRide NZ</span> | bookaride.co.nz | +64 21 743 321</p>
                </div>
            </body>
        </html>
        """
        
        success = send_email_unified(
            to_email=email,
            subject=subject,
            html_content=html_content,
            from_email=sender_email,
            from_name="BookaRide"
        )
        
        if success:
            logger.info(f"Email sent to {email}")
            return True
        else:
            logger.error(f"Failed to send email to {email}")
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
                background_tasks.add_task(send_email_bulk, email, request.subject, personalized_message)
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
