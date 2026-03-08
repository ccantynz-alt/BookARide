from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
ndb = None  # Will be injected from server.py
# Database type removed - using NeonDatabase via global db
from models import BulkEmailRequest
from typing import List
import os
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

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
    """Soft-delete multiple bookings (moves to deleted_bookings for recovery)"""
    try:
        from datetime import datetime
        # Fetch all bookings first so we can preserve them
        bookings = await db.bookings.find(
            {"id": {"$in": booking_ids}},
            {"_id": 0}
        ).to_list(None)

        if not bookings:
            return {"message": "No bookings found to delete", "deleted_count": 0}

        # Soft-delete: move each booking to deleted_bookings collection
        for booking in bookings:
            booking['deletedAt'] = datetime.utcnow().isoformat()
            booking['deletedBy'] = 'bulk_delete'
            await db.deleted_bookings.insert_one(booking)

        # Now remove from active bookings
        found_ids = [b['id'] for b in bookings]
        result = await db.bookings.delete_many({"id": {"$in": found_ids}})
        logger.info(f"Bulk soft-deleted {result.deleted_count} bookings (recoverable from deleted_bookings)")
        return {
            "message": "Bookings deleted successfully (recoverable from Deleted tab)",
            "deleted_count": result.deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def send_email_via_smtp(email: str, subject: str, message: str):
    """Send email using Google SMTP"""
    try:
        smtp_user = os.environ.get('SMTP_USER')
        smtp_pass = os.environ.get('SMTP_PASS')
        sender_email = os.environ.get('NOREPLY_EMAIL') or os.environ.get('SENDER_EMAIL', 'noreply@bookaride.co.nz')

        if not smtp_user or not smtp_pass:
            logger.error("Google SMTP not configured. Set SMTP_USER and SMTP_PASS.")
            return False

        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"BookaRide <{sender_email}>"
        msg['To'] = email
        msg.attach(MIMEText(message, 'html'))

        smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)

        logger.info(f"Email sent to {email} via Google SMTP")
        return True

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
                background_tasks.add_task(send_email_via_smtp, email, request.subject, personalized_message)
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
