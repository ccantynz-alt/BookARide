from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
from typing import Dict, List
import pandas as pd
from io import BytesIO
from fastapi.responses import StreamingResponse

analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])

async def get_analytics_data(db: AsyncIOMotorDatabase, start_date: str = None, end_date: str = None):
    """Get analytics data for bookings"""
    query = {}
    
    if start_date or end_date:
        query["createdAt"] = {}
        if start_date:
            query["createdAt"]["$gte"] = datetime.fromisoformat(start_date)
        if end_date:
            query["createdAt"]["$lte"] = datetime.fromisoformat(end_date)
    
    bookings = await db.bookings.find(query, {"_id": 0}).to_list(10000)
    return bookings

@analytics_router.get("/revenue-trends")
async def get_revenue_trends(start_date: str = None, end_date: str = None, db: AsyncIOMotorDatabase = None):
    """Get revenue trends grouped by date"""
    try:
        bookings = await get_analytics_data(db, start_date, end_date)
        
        # Group by date
        daily_revenue = {}
        for booking in bookings:
            if booking.get('payment_status') == 'paid':
                date = booking.get('date', '')
                if date:
                    revenue = booking.get('pricing', {}).get('totalPrice', 0)
                    daily_revenue[date] = daily_revenue.get(date, 0) + revenue
        
        # Convert to list format
        trends = [{"date": date, "revenue": revenue} for date, revenue in sorted(daily_revenue.items())]
        
        return {"trends": trends}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@analytics_router.get("/booking-trends")
async def get_booking_trends(start_date: str = None, end_date: str = None, db: AsyncIOMotorDatabase = None):
    """Get booking count trends grouped by date"""
    try:
        bookings = await get_analytics_data(db, start_date, end_date)
        
        # Group by date
        daily_bookings = {}
        for booking in bookings:
            date = booking.get('date', '')
            if date:
                daily_bookings[date] = daily_bookings.get(date, 0) + 1
        
        trends = [{"date": date, "count": count} for date, count in sorted(daily_bookings.items())]
        
        return {"trends": trends}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@analytics_router.get("/popular-routes")
async def get_popular_routes(limit: int = 10, db: AsyncIOMotorDatabase = None):
    """Get most popular routes"""
    try:
        bookings = await db.bookings.find({}, {"_id": 0}).to_list(10000)
        
        # Count routes
        route_counts = {}
        for booking in bookings:
            pickup = booking.get('pickupAddress', '')
            dropoff = booking.get('dropoffAddress', '')
            route = f"{pickup} → {dropoff}"
            route_counts[route] = route_counts.get(route, 0) + 1
        
        # Sort and limit
        popular = sorted(route_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
        routes = [{"route": route, "count": count} for route, count in popular]
        
        return {"routes": routes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@analytics_router.get("/export-csv")
async def export_bookings_csv(start_date: str = None, end_date: str = None, db: AsyncIOMotorDatabase = None):
    """Export bookings to CSV"""
    try:
        bookings = await get_analytics_data(db, start_date, end_date)
        
        # Convert to DataFrame
        df_data = []
        for b in bookings:
            df_data.append({
                'Date': b.get('date', ''),
                'Time': b.get('time', ''),
                'Customer': b.get('name', ''),
                'Email': b.get('email', ''),
                'Phone': b.get('phone', ''),
                'Service': b.get('serviceType', ''),
                'Pickup': b.get('pickupAddress', ''),
                'Dropoff': b.get('dropoffAddress', ''),
                'Passengers': b.get('passengers', ''),
                'Price': b.get('pricing', {}).get('totalPrice', 0),
                'Status': b.get('status', ''),
                'Payment Status': b.get('payment_status', '')
            })
        
        df = pd.DataFrame(df_data)
        
        # Convert to CSV
        stream = BytesIO()
        df.to_csv(stream, index=False)
        stream.seek(0)
        
        return StreamingResponse(
            stream,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=bookings_{datetime.now().strftime('%Y%m%d')}.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
