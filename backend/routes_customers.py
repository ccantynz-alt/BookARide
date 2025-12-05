from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import CustomerNote, CustomerNoteCreate
from datetime import datetime
import uuid

customers_router = APIRouter(prefix="/customers", tags=["Customers"])

@customers_router.get("")
async def get_customers(db: AsyncIOMotorDatabase = None):
    """Get all unique customers with their booking history"""
    try:
        # Get all bookings
        bookings = await db.bookings.find({}, {"_id": 0}).to_list(10000)
        
        # Group by customer email
        customers_dict = {}
        for booking in bookings:
            email = booking.get('email', '')
            if email:
                if email not in customers_dict:
                    customers_dict[email] = {
                        'email': email,
                        'name': booking.get('name', ''),
                        'phone': booking.get('phone', ''),
                        'total_bookings': 0,
                        'total_spent': 0,
                        'last_booking_date': None,
                        'bookings': []
                    }
                
                customers_dict[email]['total_bookings'] += 1
                customers_dict[email]['total_spent'] += booking.get('pricing', {}).get('totalPrice', 0)
                
                booking_date = booking.get('createdAt')
                if booking_date:
                    if not customers_dict[email]['last_booking_date'] or booking_date > customers_dict[email]['last_booking_date']:
                        customers_dict[email]['last_booking_date'] = booking_date
                
                customers_dict[email]['bookings'].append({
                    'id': booking.get('id'),
                    'date': booking.get('date'),
                    'service': booking.get('serviceType'),
                    'price': booking.get('pricing', {}).get('totalPrice', 0),
                    'status': booking.get('status')
                })
        
        customers = list(customers_dict.values())
        return {"customers": customers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@customers_router.get("/{email}")
async def get_customer(email: str):
    """Get a specific customer with full details"""
    try:
        # Get customer bookings
        bookings = await db.bookings.find({"email": email}, {"_id": 0}).to_list(1000)
        
        # Get customer notes
        notes = await db.customer_notes.find({"customer_email": email}, {"_id": 0}).to_list(100)
        
        if not bookings:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        customer = {
            'email': email,
            'name': bookings[0].get('name', ''),
            'phone': bookings[0].get('phone', ''),
            'total_bookings': len(bookings),
            'total_spent': sum(b.get('pricing', {}).get('totalPrice', 0) for b in bookings),
            'bookings': bookings,
            'notes': notes
        }
        
        return customer
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@customers_router.post("/notes")
async def add_customer_note(note: CustomerNoteCreate, admin_username: str):
    """Add a note for a customer"""
    try:
        new_note = CustomerNote(
            **note.dict(),
            id=str(uuid.uuid4()),
            created_by=admin_username
        )
        await db.customer_notes.insert_one(new_note.dict())
        return new_note
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@customers_router.delete("/notes/{note_id}")
async def delete_customer_note(note_id: str):
    """Delete a customer note"""
    try:
        result = await db.customer_notes.delete_one({"id": note_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Note not found")
        return {"message": "Note deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
