# -*- coding: utf-8 -*-
from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, Body, UploadFile, File, Form, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response, RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import requests
import httpx
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
try:
    from twilio.rest import Client
except Exception:
    Client = None
import requests
from passlib.context import CryptContext
from jose import JWTError, jwt
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request as GoogleRequest
import sys
import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
import vobject
import asyncio

# Global lock to prevent concurrent reminder sending
reminder_lock = asyncio.Lock()

# === Background Task Helpers ===
def run_async_task(coro_func, arg, task_description="background task"):
    """Run an async function in a new event loop for background tasks"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(coro_func(arg))
            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Background task completed: {task_description}")
        finally:
            loop.close()
    except Exception as e:
        logger.error(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Background task failed ({task_description}): {str(e)}")

def run_sync_task(sync_func, arg, task_description="background task"):
    """Run a synchronous function for background tasks"""
    try:
        sync_func(arg)
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Background task completed: {task_description}")
    except Exception as e:
        logger.error(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Background task failed ({task_description}): {str(e)}")

def run_sync_task_with_args(sync_func, arg1, arg2, task_description="background task"):
    """Run a synchronous function with two arguments for background tasks"""
    try:
        sync_func(arg1, arg2)
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Background task completed: {task_description}")
    except Exception as e:
        logger.error(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Background task failed ({task_description}): {str(e)}")

ROOT_DIR = Path(__file__).parent
sys.path.insert(0, str(ROOT_DIR))
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'bookaride')
if 'MONGO_URL' not in os.environ or 'DB_NAME' not in os.environ:
    logging.warning("MONGO_URL or DB_NAME missing; using fallback values for startup.")
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=2000, connectTimeoutMS=2000)
db = client[db_name]

# Authentication configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production-' + str(uuid.uuid4()))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Support both bcrypt (legacy from create_admin.py) and pbkdf2_sha256 for backward compatibility
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Root and health - Render/Kubernetes may check / or /health or /healthz
@app.get("/")
async def root():
    return {"status": "ok", "service": "bookaride-api", "docs": "/docs"}

@app.get("/health")
@app.get("/healthz")
async def root_health_check():
    """Root health check endpoint for Kubernetes/Render liveness/readiness probes"""
    return {"status": "healthy", "service": "bookaride-api"}

# Google auth start - app-level routes (try multiple paths for compatibility)
@app.get("/api/admin/google-auth/start")
@app.get("/api/google-auth-start")  # Simpler path fallback
async def admin_google_auth_start_app():
    """Start Google OAuth - app-level route for reliability"""
    client_id = os.environ.get('GOOGLE_CLIENT_ID')
    client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.")
    public_domain = os.environ.get('PUBLIC_DOMAIN', 'https://bookaride.co.nz')
    backend_url = os.environ.get('BACKEND_URL') or os.environ.get('RENDER_EXTERNAL_URL') or public_domain
    redirect_uri = f"{backend_url.rstrip('/')}/api/admin/google-auth/callback"
    state = f"bookaride_admin_oauth_{uuid.uuid4().hex}"
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={requests.utils.quote(redirect_uri)}&"
        "response_type=code&"
        "scope=openid%20email%20profile&"
        f"state={state}&"
        "access_type=offline&"
        "prompt=select_account"
    )
    response = RedirectResponse(url=auth_url)
    response.set_cookie(key="admin_oauth_state", value=state, httponly=True, max_age=600, samesite="lax")
    return response

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Authentication Models
class AdminUser(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminCreate(BaseModel):
    username: str
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Authentication utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def format_nz_phone(phone: str) -> str:
    """Format phone number to E.164 format for Twilio (NZ numbers)"""
    if not phone:
        return ""
    
    # Remove spaces, dashes, and parentheses
    phone = phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
    
    # Handle NZ numbers: convert 02X to +642X, 0X to +64X
    if phone.startswith('02'):
        phone = '+64' + phone[1:]  # 021... -> +6421...
    elif phone.startswith('0'):
        phone = '+64' + phone[1:]  # Other NZ numbers
    elif not phone.startswith('+'):
        phone = '+64' + phone  # Add +64 if no prefix
    
    return phone


async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    admin = await db.admin_users.find_one({"username": token_data.username}, {"_id": 0})
    if admin is None:
        raise credentials_exception
    return admin


async def get_current_driver(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Authenticate driver from JWT token"""
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        driver_id: str = payload.get("driver_id")
        if driver_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    driver = await db.drivers.find_one({"id": driver_id}, {"_id": 0})
    if driver is None:
        raise credentials_exception
    return driver

# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Booking Models
class PriceCalculationRequest(BaseModel):
    serviceType: str
    pickupAddress: str
    pickupAddresses: Optional[List[str]] = []  # Multiple pickups support
    dropoffAddress: str
    passengers: int
    vipAirportPickup: bool = False
    oversizedLuggage: bool = False

class PricingBreakdown(BaseModel):
    distance: float
    basePrice: float
    airportFee: float
    oversizedLuggageFee: float
    passengerFee: float
    stripeFee: float = 0.0  # Stripe processing fee (2.9% + $0.30) added to customer total
    subtotal: float = 0.0  # Price before Stripe fee
    totalPrice: float
    ratePerKm: Optional[float] = None  # Rate per km for transparency
    promoCode: Optional[str] = None  # Applied promo code
    promoDiscount: float = 0.0  # Discount amount from promo code

# Valid promo codes configuration
PROMO_CODES = {
    "WELCOME10": {"discount_percent": 10, "description": "10% off your first ride"},
}

class PromoCodeValidation(BaseModel):
    code: str
    subtotal: float  # Price before discount to calculate discount amount

class BookingCreate(BaseModel):
    serviceType: str
    pickupAddress: str
    pickupAddresses: Optional[List[str]] = []  # Multiple pickups support
    dropoffAddress: str
    date: str
    time: str
    passengers: str
    departureFlightNumber: Optional[str] = ""
    departureTime: Optional[str] = ""
    arrivalFlightNumber: Optional[str] = ""
    arrivalTime: Optional[str] = ""
    flightNumber: Optional[str] = ""  # General flight number field
    name: str
    email: str
    phone: str
    notes: Optional[str] = ""
    pricing: dict
    status: str = "pending"
    payment_status: Optional[str] = "unpaid"
    # Return trip fields
    bookReturn: Optional[bool] = False
    returnDate: Optional[str] = ""
    returnTime: Optional[str] = ""
    returnFlightNumber: Optional[str] = ""  # REQUIRED when bookReturn=True for airport shuttle
    returnDepartureFlightNumber: Optional[str] = ""  # Alternative field name used by frontend
    returnDepartureTime: Optional[str] = ""
    returnArrivalFlightNumber: Optional[str] = ""
    returnArrivalTime: Optional[str] = ""
    # Notification preference: 'email', 'sms', or 'both'
    notificationPreference: Optional[str] = "both"
    skipNotifications: Optional[bool] = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    
    @model_validator(mode='after')
    def validate_return_flight_for_airport_shuttle(self):
        """Validate that return flight number is provided for airport shuttle returns"""
        service_type = self.serviceType.lower() if self.serviceType else ''
        is_airport_shuttle = 'airport' in service_type or 'shuttle' in service_type
        
        if is_airport_shuttle and self.bookReturn:
            # Check both returnFlightNumber and returnDepartureFlightNumber (frontend sends latter)
            return_flight = self.returnFlightNumber or getattr(self, 'returnDepartureFlightNumber', '') or ''
            if not return_flight or not return_flight.strip():
                raise ValueError('Return flight number is required for airport shuttle return bookings. Without a flight number, your booking may face cancellation.')
        return self
    
    # @model_validator(mode='after')
    # def validate_booking_date(self):
    #     """Validate that booking date is not in the past"""
    #     if self.date:
    #         try:
    #             nz_tz = pytz.timezone('Pacific/Auckland')
    #             today = datetime.now(nz_tz).strftime('%Y-%m-%d')
    #             # Allow bookings for today and future only
    #             if self.date < today:
    #                 raise ValueError(f'Booking date ({self.date}) cannot be in the past. Today is {today}.')
    #         except Exception as e:
    #             if 'cannot be in the past' in str(e):
    #                 raise
    #             # If date parsing fails, let it through (will fail elsewhere)
    #             pass
    #     return self

@model_validator(mode='after')
def validate_booking_date(self):       
    # Skip validation for data retrieval operations    
    if hasattr(self, '_skip_date_validation') or getattr(self, 'id', None):    
        return self
    
    if self.date:  # ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ NOW PROPERLY INSIDE THE FUNCTION
        try:
            nz_tz = pytz.timezone('Pacific/Auckland')
            today = datetime.now(nz_tz).strftime('%Y-%m-%d')
            if self.date < today:
                raise ValueError(f'Booking date ({self.date}) cannot be in the past. Today is {today}.')
        except Exception as e:
            if 'cannot be in the past' in str(e):
                raise
            pass
    return self

class Booking(BookingCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    referenceNumber: Optional[str] = None  # Sequential reference number (can be int stored as string or custom string like TEST-999)
    
    class Config:
        extra = 'allow'  # Allow extra fields from database (importedFrom, notificationsSent, etc.)
    
    @model_validator(mode='before')
    @classmethod
    def convert_reference_number(cls, data):
        """Convert referenceNumber to string if it's an int"""
        if isinstance(data, dict) and 'referenceNumber' in data:
            ref = data['referenceNumber']
            if ref is not None:
                data['referenceNumber'] = str(ref)
        return data
    
    @model_validator(mode='after')
    def validate_return_flight_for_airport_shuttle(self):
        """Skip validation for existing bookings - only enforce on creation via BookingCreate"""
        # This overrides the parent validator to allow reading old bookings without returnFlightNumber
        return self

def is_booking_within_24_hours(date_str: str, time_str: str) -> bool:
    """Check if the booking pickup datetime is within 24 hours from now"""
    try:
        nz_tz = pytz.timezone('Pacific/Auckland')
        now_nz = datetime.now(nz_tz)
        
        # Parse the booking date and time
        # Try multiple date formats
        booking_date = None
        for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y']:
            try:
                booking_date = datetime.strptime(date_str, fmt).date()
                break
            except ValueError:
                continue
        
        if not booking_date:
            logger.warning(f"Could not parse booking date: {date_str}")
            return False
        
        # Parse time (e.g., "14:30" or "2:30 PM")
        booking_time = None
        for fmt in ['%H:%M', '%I:%M %p', '%I:%M%p']:
            try:
                booking_time = datetime.strptime(time_str.strip(), fmt).time()
                break
            except ValueError:
                continue
        
        if not booking_time:
            logger.warning(f"Could not parse booking time: {time_str}")
            return False
        
        # Combine date and time and localize to NZ timezone
        booking_datetime = datetime.combine(booking_date, booking_time)
        booking_datetime_nz = nz_tz.localize(booking_datetime)
        
        # Check if within 24 hours
        time_until_pickup = booking_datetime_nz - now_nz
        is_within_24h = time_until_pickup.total_seconds() < 24 * 60 * 60
        
        if is_within_24h:
            logger.info(f"Booking is within 24 hours: pickup at {booking_datetime_nz}, now is {now_nz}")
        
        return is_within_24h
    except Exception as e:
        logger.error(f"Error checking 24-hour window: {str(e)}")
        return False


async def get_next_reference_number():
    """Get the next sequential reference number for bookings, starting from 10"""
    # Use a counter collection to maintain sequential numbers
    counter = await db.counters.find_one_and_update(
        {"_id": "booking_reference"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    # Start from 10 if this is a new counter
    if counter is None or counter.get('seq', 0) < 10:
        await db.counters.update_one(
            {"_id": "booking_reference"},
            {"$set": {"seq": 10}},
            upsert=True
        )
        return 10
    return counter.get('seq', 10)

# Authentication Endpoints

@api_router.post("/admin/register", response_model=Token)
async def register_admin(admin: AdminCreate):
    """Register a new admin user"""
    try:
        # Check if username already exists
        existing_admin = await db.admin_users.find_one({"username": admin.username}, {"_id": 0})
        if existing_admin:
            raise HTTPException(status_code=400, detail="Username already registered")
        
        # Check if email already exists
        existing_email = await db.admin_users.find_one({"email": admin.email}, {"_id": 0})
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new admin user
        hashed_password = get_password_hash(admin.password)
        admin_user = AdminUser(
            username=admin.username,
            email=admin.email,
            hashed_password=hashed_password
        )
        
        await db.admin_users.insert_one(admin_user.dict())
        logger.info(f"Admin user created: {admin.username}")
        
        # Create access token
        access_token = create_access_token(data={"sub": admin.username})
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering admin: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error registering admin: {str(e)}")


@api_router.post("/admin/login", response_model=Token)
async def login_admin(login_data: AdminLogin):
    """Login admin user"""
    try:
        # Find admin user
        admin = await db.admin_users.find_one({"username": login_data.username}, {"_id": 0})
        if not admin:
            raise HTTPException(status_code=401, detail="Incorrect username or password")
        
        # Verify password
        if not verify_password(login_data.password, admin["hashed_password"]):
            raise HTTPException(status_code=401, detail="Incorrect username or password")
        
        # Check if admin is active
        if not admin.get("is_active", True):
            raise HTTPException(status_code=401, detail="Admin account is disabled")
        
        # Create access token
        access_token = create_access_token(data={"sub": admin["username"]})
        logger.info(f"Admin logged in: {admin['username']}")
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error logging in admin: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error logging in: {str(e)}")


@api_router.get("/admin/me")
async def get_current_admin_info(current_admin: dict = Depends(get_current_admin)):
    """Get current admin user info"""
    return {
        "username": current_admin["username"],
        "email": current_admin["email"],
        "created_at": current_admin["created_at"]
    }


@api_router.post("/auth/change-password")
async def change_password(
    current_password: str = Body(...),
    new_password: str = Body(...),
    current_admin: dict = Depends(get_current_admin)
):
    """Change admin password (requires current password)"""
    try:
        # Get admin from database
        admin = await db.admin_users.find_one({"username": current_admin["username"]}, {"_id": 0})
        if not admin:
            raise HTTPException(status_code=404, detail="Admin user not found")
        
        # Verify current password
        if not verify_password(current_password, admin["hashed_password"]):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        # Validate new password
        if len(new_password) < 8:
            raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
        
        # Hash new password
        hashed_new_password = get_password_hash(new_password)
        
        # Update password in database
        await db.admin_users.update_one(
            {"username": current_admin["username"]},
            {"$set": {
                "hashed_password": hashed_new_password,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        
        logger.info(f"Password changed for admin: {current_admin['username']}")
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error changing password: {str(e)}")


@api_router.post("/admin/set-password")
async def set_password(
    new_password: str = Body(..., embed=True),
    current_admin: dict = Depends(get_current_admin)
):
    """Set password for logged-in admin (no current password required).
    Use when logged in via Google or when you forgot your current password."""
    try:
        if len(new_password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        
        hashed = get_password_hash(new_password)
        await db.admin_users.update_one(
            {"username": current_admin["username"]},
            {"$set": {
                "hashed_password": hashed,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        logger.info(f"Password set for admin: {current_admin['username']}")
        return {"message": "Password set successfully. You can now log in with username and password."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting password: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to set password")


# ============================================
# GOOGLE OAUTH FOR ADMIN
# ============================================

# Standalone Google OAuth (no Emergent) - redirect flow
ADMIN_GOOGLE_OAUTH_STATE = "bookaride_admin_oauth"

@api_router.get("/admin/google-auth/start")
async def admin_google_auth_start():
    """Start Google OAuth flow for admin login - redirects to Google"""
    client_id = os.environ.get('GOOGLE_CLIENT_ID')
    client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.")
    public_domain = os.environ.get('PUBLIC_DOMAIN', 'https://bookaride.co.nz')
    backend_url = os.environ.get('BACKEND_URL') or os.environ.get('RENDER_EXTERNAL_URL') or public_domain
    redirect_uri = f"{backend_url.rstrip('/')}/api/admin/google-auth/callback"
    state = f"{ADMIN_GOOGLE_OAUTH_STATE}_{uuid.uuid4().hex}"
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={requests.utils.quote(redirect_uri)}&"
        "response_type=code&"
        "scope=openid%20email%20profile&"
        f"state={state}&"
        "access_type=offline&"
        "prompt=select_account"
    )
    response = RedirectResponse(url=auth_url)
    response.set_cookie(key="admin_oauth_state", value=state, httponly=True, max_age=600, samesite="lax")
    return response

@api_router.get("/admin/google-auth/callback")
async def admin_google_auth_callback(code: str, state: str, request: Request):
    """Handle Google OAuth callback - exchange code for tokens, check admin, redirect to frontend with JWT"""
    client_id = os.environ.get('GOOGLE_CLIENT_ID')
    client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    saved_state = request.cookies.get("admin_oauth_state")
    if not saved_state or saved_state != state or not state.startswith(ADMIN_GOOGLE_OAUTH_STATE):
        raise HTTPException(status_code=400, detail="Invalid state - possible CSRF")
    public_domain = os.environ.get('PUBLIC_DOMAIN', 'https://bookaride.co.nz')
    backend_url = os.environ.get('BACKEND_URL') or os.environ.get('RENDER_EXTERNAL_URL') or public_domain
    redirect_uri = f"{backend_url.rstrip('/')}/api/admin/google-auth/callback"
    token_resp = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    if token_resp.status_code != 200:
        logger.error(f"Google token error: {token_resp.text}")
        raise HTTPException(status_code=400, detail="Failed to exchange code for token")
    tokens = token_resp.json()
    user_resp = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    if user_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get user info")
    user_info = user_resp.json()
    email = (user_info.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")
    admin = await db.admin_users.find_one({"email": email}, {"_id": 0})
    if not admin:
        logger.warning(f"Google OAuth attempt for non-admin: {email}")
        frontend_url = public_domain.rstrip('/')
        return RedirectResponse(
            url=f"{frontend_url}/admin/auth/callback?error=unauthorized&message=This%20Google%20account%20is%20not%20authorized"
        )
    access_token = create_access_token(data={"sub": admin["username"]})
    frontend_url = public_domain.rstrip('/')
    redirect_url = f"{frontend_url}/admin/auth/callback#token={access_token}"
    response = RedirectResponse(url=redirect_url)
    response.delete_cookie("admin_oauth_state")
    logger.info(f"Admin logged in via Google: {admin['username']} ({email})")
    return response

class GoogleAuthSession(BaseModel):
    session_id: str

@api_router.post("/admin/google-auth/session")
async def process_google_auth_session(auth_data: GoogleAuthSession, response: Response):
    """Process Google OAuth session_id from Emergent Auth and create admin session"""
    try:
        # Verify session with Emergent Auth
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": auth_data.session_id}
            )
        
        if auth_response.status_code != 200:
            logger.error(f"Emergent Auth error: {auth_response.text}")
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_data = auth_response.json()
        email = user_data.get("email")
        name = user_data.get("name")
        picture = user_data.get("picture")
        emergent_session_token = user_data.get("session_token")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")
        
        # Check if admin exists with this email
        admin = await db.admin_users.find_one({"email": email}, {"_id": 0})
        
        if not admin:
            # Admin doesn't exist - reject login
            logger.warning(f"Google OAuth attempt for non-admin email: {email}")
            raise HTTPException(
                status_code=403, 
                detail="This Google account is not authorized as an admin. Please contact the system administrator."
            )
        
        # Admin exists - create session
        session_token = f"admin_session_{uuid.uuid4().hex}"
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        # Store session in database
        await db.admin_sessions.insert_one({
            "admin_id": admin["id"],
            "username": admin["username"],
            "email": email,
            "session_token": session_token,
            "google_name": name,
            "google_picture": picture,
            "emergent_session_token": emergent_session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Set httpOnly cookie
        response.set_cookie(
            key="admin_session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        
        # Also return JWT token for localStorage (backward compatibility)
        access_token = create_access_token(data={"sub": admin["username"]})
        
        logger.info(f"Admin logged in via Google: {admin['username']} ({email})")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "admin": {
                "username": admin["username"],
                "email": email,
                "name": name,
                "picture": picture
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google OAuth error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")


@api_router.get("/admin/auth/me")
async def get_admin_from_session(request: Request):
    """Get current admin from session cookie or Authorization header"""
    try:
        # First check cookie
        session_token = request.cookies.get("admin_session_token")
        
        if session_token:
            session = await db.admin_sessions.find_one(
                {"session_token": session_token}, 
                {"_id": 0}
            )
            
            if session:
                # Check expiry
                expires_at = session.get("expires_at")
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at)
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                
                if expires_at > datetime.now(timezone.utc):
                    admin = await db.admin_users.find_one(
                        {"username": session["username"]}, 
                        {"_id": 0}
                    )
                    if admin:
                        return {
                            "username": admin["username"],
                            "email": admin["email"],
                            "name": session.get("google_name"),
                            "picture": session.get("google_picture"),
                            "auth_method": "google"
                        }
        
        # Fallback to Authorization header (JWT)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                username = payload.get("sub")
                if username:
                    admin = await db.admin_users.find_one(
                        {"username": username}, 
                        {"_id": 0}
                    )
                    if admin:
                        return {
                            "username": admin["username"],
                            "email": admin["email"],
                            "auth_method": "jwt"
                        }
            except JWTError:
                pass
        
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth check error: {str(e)}")
        raise HTTPException(status_code=500, detail="Authentication check failed")


@api_router.post("/admin/logout")
async def admin_logout(request: Request, response: Response):
    """Logout admin and clear session"""
    try:
        session_token = request.cookies.get("admin_session_token")
        
        if session_token:
            # Delete session from database
            await db.admin_sessions.delete_one({"session_token": session_token})
        
        # Clear cookie
        response.delete_cookie(
            key="admin_session_token",
            path="/",
            secure=True,
            samesite="none"
        )
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(status_code=500, detail="Logout failed")


# ============================================
# PASSWORD RESET FOR ADMIN
# ============================================

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

@api_router.post("/admin/password-reset/request")
async def request_password_reset(reset_request: PasswordResetRequest):
    """Request a password reset email for admin"""
    try:
        email = reset_request.email.lower().strip()
        
        # Check if admin exists with this email
        admin = await db.admin_users.find_one({"email": email}, {"_id": 0})
        
        # Always return success (security - don't reveal if email exists)
        if not admin:
            logger.info(f"Password reset requested for non-existent email: {email}")
            return {"message": "If this email is registered, you will receive a password reset link."}
        
        # Generate reset token
        reset_token = uuid.uuid4().hex
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)  # 1 hour expiry
        
        # Store reset token
        await db.password_reset_tokens.insert_one({
            "admin_id": admin["id"],
            "username": admin["username"],
            "email": email,
            "token": reset_token,
            "expires_at": expires_at.isoformat(),
            "used": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Send reset email via Mailgun
        public_domain = os.environ.get('PUBLIC_DOMAIN', 'https://www.bookaride.co.nz').rstrip('/')
        reset_link = f"{public_domain}/admin/reset-password?token={reset_token}"
        
        mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
        mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
        sender_email = os.environ.get('SENDER_EMAIL', 'noreply@bookaride.co.nz')
        
        if not mailgun_api_key or not mailgun_domain:
            logger.warning(
                "Password reset email NOT sent: MAILGUN_API_KEY or MAILGUN_DOMAIN missing. "
                "Add these to backend/.env - see ADMIN_AUTH_TROUBLESHOOTING.md"
            )
        if mailgun_api_key and mailgun_domain:
            email_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .header h1 {{ color: white; margin: 0; font-size: 28px; }}
                    .content {{ background: #fff; padding: 30px; border: 1px solid #e5e5e5; }}
                    .button {{ display: inline-block; background: #d4af37; color: #000 !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }}
                    .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; background: #faf8f3; }}
                    .warning {{ background: #fff8e6; border: 1px solid #D4AF37; padding: 10px; border-radius: 5px; margin: 15px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Hello <strong>{admin['username']}</strong>,</p>
                        <p>We received a request to reset your admin password for Book A Ride NZ.</p>
                        <p>Click the button below to reset your password:</p>
                        <p style="text-align: center;">
                            <a href="{reset_link}" class="button">Reset Password</a>
                        </p>
                        <div class="warning">
                            ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â° <strong>This link will expire in 1 hour.</strong><br>
                            If you didn't request this reset, please ignore this email.
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; background: #faf8f3; padding: 10px; border-radius: 5px; font-size: 12px; border: 1px solid #e8e4d9;">{reset_link}</p>
                    </div>
                    <div class="footer">
                        <p>Book A Ride NZ | Premium Airport Transfers</p>
                        <p>This is an automated message. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            try:
                mailgun_response = requests.post(
                    f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
                    auth=("api", mailgun_api_key),
                    data={
                        "from": f"Book A Ride NZ <{sender_email}>",
                        "to": email,
                        "subject": "Password Reset Request - Book A Ride NZ Admin",
                        "html": email_html
                    }
                )
                
                if mailgun_response.status_code == 200:
                    logger.info(f"Password reset email sent to: {email}")
                else:
                    logger.error(f"Mailgun error: {mailgun_response.text}")
                    
            except Exception as mail_error:
                logger.error(f"Failed to send reset email: {str(mail_error)}")
        
        return {"message": "If this email is registered, you will receive a password reset link."}
        
    except Exception as e:
        logger.error(f"Password reset request error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process password reset request")


@api_router.post("/admin/password-reset/confirm")
async def confirm_password_reset(reset_data: PasswordResetConfirm):
    """Confirm password reset with token and new password"""
    try:
        # Find the reset token
        token_doc = await db.password_reset_tokens.find_one(
            {"token": reset_data.token, "used": False}, 
            {"_id": 0}
        )
        
        if not token_doc:
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
        # Check expiry
        expires_at = token_doc.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")
        
        # Validate new password
        if len(reset_data.new_password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        
        # Hash new password
        hashed_password = get_password_hash(reset_data.new_password)
        
        # Update admin password
        result = await db.admin_users.update_one(
            {"username": token_doc["username"]},
            {"$set": {
                "hashed_password": hashed_password,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Admin user not found")
        
        # Mark token as used
        await db.password_reset_tokens.update_one(
            {"token": reset_data.token},
            {"$set": {"used": True, "used_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        logger.info(f"Password reset completed for: {token_doc['username']}")
        
        return {"message": "Password has been reset successfully. You can now login with your new password."}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset confirm error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reset password")


@api_router.get("/admin/password-reset/validate/{token}")
async def validate_reset_token(token: str):
    """Validate if a reset token is still valid"""
    try:
        token_doc = await db.password_reset_tokens.find_one(
            {"token": token, "used": False}, 
            {"_id": 0}
        )
        
        if not token_doc:
            return {"valid": False, "message": "Invalid or expired token"}
        
        # Check expiry
        expires_at = token_doc.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if expires_at < datetime.now(timezone.utc):
            return {"valid": False, "message": "Token has expired"}
        
        return {"valid": True, "email": token_doc.get("email")}
        
    except Exception as e:
        logger.error(f"Token validation error: {str(e)}")
        return {"valid": False, "message": "Validation failed"}


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Welcome to Book A Ride NZ API"}


@api_router.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes"""
    return {"status": "healthy", "service": "bookaride-api"}


# Google Reviews Endpoint - Fetches reviews from Google Places API
@api_router.get("/google-reviews")
async def get_google_reviews():
    """
    Fetch Google Reviews for Book A Ride NZ.
    Uses Google Places API to get real reviews.
    Caches results to minimize API calls.
    """
    try:
        # Check if we have cached reviews (less than 24 hours old)
        cached = await db.cache.find_one({"key": "google_reviews"})
        if cached:
            cache_time = cached.get("updated_at")
            if cache_time and (datetime.now(timezone.utc) - cache_time).total_seconds() < 86400:  # 24 hours
                logger.info("Returning cached Google reviews")
                return cached.get("data", {})
        
        google_api_key = os.environ.get('GOOGLE_MAPS_API_KEY', '')
        
        if not google_api_key:
            logger.warning("Google Maps API key not configured for reviews")
            return get_fallback_reviews()
        
        # Book A Ride NZ Place ID (you may need to find this from Google)
        # For now, search by business name
        search_url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
        search_params = {
            'input': 'Book A Ride NZ Auckland',
            'inputtype': 'textquery',
            'fields': 'place_id,name,rating,user_ratings_total',
            'key': google_api_key
        }
        
        search_response = requests.get(search_url, params=search_params)
        search_data = search_response.json()
        
        if search_data.get('status') != 'OK' or not search_data.get('candidates'):
            logger.warning(f"Could not find business in Google Places: {search_data.get('status')}")
            return get_fallback_reviews()
        
        place_id = search_data['candidates'][0]['place_id']
        
        # Fetch place details with reviews
        details_url = "https://maps.googleapis.com/maps/api/place/details/json"
        details_params = {
            'place_id': place_id,
            'fields': 'name,rating,user_ratings_total,reviews',
            'key': google_api_key
        }
        
        details_response = requests.get(details_url, params=details_params)
        details_data = details_response.json()
        
        if details_data.get('status') != 'OK':
            logger.warning(f"Could not fetch place details: {details_data.get('status')}")
            return get_fallback_reviews()
        
        result = details_data.get('result', {})
        reviews_data = {
            'name': result.get('name', 'Book A Ride NZ'),
            'rating': result.get('rating', 4.9),
            'totalReviews': result.get('user_ratings_total', 127),
            'reviews': []
        }
        
        # Format reviews
        for review in result.get('reviews', [])[:5]:  # Get top 5 reviews
            reviews_data['reviews'].append({
                'name': review.get('author_name', 'Customer'),
                'rating': review.get('rating', 5),
                'date': review.get('relative_time_description', 'Recently'),
                'text': review.get('text', ''),
                'avatar': review.get('author_name', 'C')[0].upper(),
                'profilePhoto': review.get('profile_photo_url', '')
            })
        
        # Cache the results
        await db.cache.update_one(
            {"key": "google_reviews"},
            {"$set": {"key": "google_reviews", "data": reviews_data, "updated_at": datetime.now(timezone.utc)}},
            upsert=True
        )
        
        logger.info(f"Fetched and cached {len(reviews_data['reviews'])} Google reviews")
        return reviews_data
        
    except Exception as e:
        logger.error(f"Error fetching Google reviews: {str(e)}")
        return get_fallback_reviews()


def get_fallback_reviews():
    """Return fallback reviews when Google API is unavailable"""
    return {
        'name': 'Book A Ride NZ',
        'rating': 4.9,
        'totalReviews': 127,
        'reviews': [
            {
                'name': 'Sarah M.',
                'rating': 5,
                'date': '2 weeks ago',
                'text': 'Fantastic service! Driver was on time, car was spotless, and the price was exactly as quoted. Will definitely use again for my next airport trip.',
                'avatar': 'S'
            },
            {
                'name': 'David T.',
                'rating': 5,
                'date': '1 month ago',
                'text': 'Used BookaRide for our family trip to the airport. The driver helped with all our luggage and the kids loved the ride. Much better than Uber!',
                'avatar': 'D'
            },
            {
                'name': 'Michelle K.',
                'rating': 5,
                'date': '3 weeks ago',
                'text': 'Best airport transfer in Auckland! Fixed pricing means no surprises. Driver tracked my flight and was waiting when I landed. Highly recommend!',
                'avatar': 'M'
            },
            {
                'name': 'James W.',
                'rating': 5,
                'date': '1 week ago',
                'text': 'Professional, punctual, and great value. The online booking was easy and I got my price instantly. No more guessing with taxi meters!',
                'avatar': 'J'
            },
            {
                'name': 'Emma L.',
                'rating': 5,
                'date': '2 months ago',
                'text': 'Absolutely brilliant service from Hibiscus Coast to the airport. Driver was friendly and the car was immaculate. Will be using again!',
                'avatar': 'E'
            }
        ],
        'isFallback': True
    }

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Price Calculation Endpoint
@api_router.post("/calculate-price", response_model=PricingBreakdown)
async def calculate_price(request: PriceCalculationRequest):
    try:
        # Use Google Maps API to calculate distance for multiple stops
        google_api_key = os.environ.get('GOOGLE_MAPS_API_KEY', '')
        
        if google_api_key:
            # Build list of all stops: first pickup + additional pickups + dropoff
            all_pickups = [request.pickupAddress]
            if request.pickupAddresses:
                all_pickups.extend([addr for addr in request.pickupAddresses if addr])
            
            # If multiple pickups, use Directions API for route optimization
            if len(all_pickups) > 1:
                # Use Directions API with waypoints for multi-stop route
                url = "https://maps.googleapis.com/maps/api/directions/json"
                waypoints = "|".join(all_pickups[1:])  # All pickups except first
                params = {
                    'origin': all_pickups[0],  # First pickup
                    'destination': request.dropoffAddress,  # Final dropoff
                    'waypoints': waypoints,  # Intermediate pickups
                    'key': google_api_key
                }
                response = requests.get(url, params=params)
                data = response.json()
                
                logger.info(f"Google Maps Directions API (multi-stop) response status: {data.get('status')}")
                
                if data['status'] == 'OK' and len(data['routes']) > 0:
                    route = data['routes'][0]
                    # Sum all leg distances
                    total_distance_meters = sum(leg['distance']['value'] for leg in route['legs'])
                    distance_km = round(total_distance_meters / 1000, 2)
                    logger.info(f"Multi-stop route: {len(all_pickups)} pickups ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ dropoff, total: {distance_km}km")
                else:
                    logger.warning(f"Google Maps Directions API error: {data.get('error_message', data.get('status'))}")
                    distance_km = 25.0 * len(all_pickups)  # Fallback: estimate per stop
            else:
                # Single pickup - use Distance Matrix API
                url = "https://maps.googleapis.com/maps/api/distancematrix/json"
                params = {
                    'origins': request.pickupAddress,
                    'destinations': request.dropoffAddress,
                    'key': google_api_key
                }
                response = requests.get(url, params=params)
                data = response.json()
                
                logger.info(f"Google Maps Distance Matrix API response: {data}")
                
                if data['status'] == 'OK' and len(data['rows']) > 0 and len(data['rows'][0]['elements']) > 0:
                    element = data['rows'][0]['elements'][0]
                    if element['status'] == 'OK':
                        distance_meters = element['distance']['value']
                        distance_km = round(distance_meters / 1000, 2)
                    else:
                        logger.warning(f"Google Maps element status: {element.get('status')}")
                        distance_km = 25.0  # Fallback
                else:
                    logger.warning(f"Google Maps API error: {data.get('error_message', data.get('status'))}")
                    distance_km = 25.0  # Fallback
        else:
            # Fallback: estimate based on number of stops
            pickup_count = 1 + len([addr for addr in (request.pickupAddresses or []) if addr])
            distance_km = 25.0 * pickup_count  # Default estimate per stop
            logger.warning(f"Google Maps API key not found. Using default distance estimate: {distance_km}km for {pickup_count} stops")
        
        # Calculate pricing with tiered rates - FLAT RATE per bracket
        # The rate is determined by which distance bracket the trip falls into
        # Then that rate is applied to the ENTIRE distance
        
        # ===========================================
        # SPECIAL EVENT PRICING - MATAKANA COUNTRY PARK CONCERT
        # Only applies to the specific concert venue, NOT all of Matakana
        # ===========================================
        # Specific keywords for the concert venue ONLY (must be precise)
        matakana_concert_keywords = ['matakana country park', 'matakana country club', 'rd5/1151', '1151 leigh road']
        hibiscus_coast_keywords = ['orewa', 'whangaparaoa', 'silverdale', 'red beach', 'stanmore bay', 'army bay', 'gulf harbour', 'manly', 'hibiscus coast', 'millwater', 'milldale', 'hatfields beach', 'waiwera']
        
        # Check if this is specifically the concert venue (not general Matakana)
        pickup_lower = request.pickupAddress.lower()
        dropoff_lower = request.dropoffAddress.lower()
        
        is_concert_venue_destination = any(keyword in dropoff_lower for keyword in matakana_concert_keywords)
        is_concert_venue_pickup = any(keyword in pickup_lower for keyword in matakana_concert_keywords)
        is_from_hibiscus_coast = any(keyword in pickup_lower for keyword in hibiscus_coast_keywords)
        is_to_hibiscus_coast = any(keyword in dropoff_lower for keyword in hibiscus_coast_keywords)
        
        # Concert pricing structure (ONLY for Matakana Country Park):
        # - From Hibiscus Coast to concert venue: Flat $550 (return)
        # - From elsewhere in Auckland to concert venue: km rate to Hibiscus Coast + $550
        matakana_concert_base = 550.0
        is_concert_trip = is_concert_venue_destination or is_concert_venue_pickup
        
        # Approximate distance from Auckland CBD to Orewa (Hibiscus Coast boundary)
        hibiscus_coast_distance_km = 40.0  # ~40km from Auckland CBD to Orewa
        
        if is_concert_trip:
            if is_from_hibiscus_coast or is_to_hibiscus_coast:
                # From/to Hibiscus Coast - flat $550
                logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âµ CONCERT PRICING: Hibiscus Coast to Matakana Country Park - flat ${matakana_concert_base}")
            else:
                # From elsewhere - calculate distance to Hibiscus Coast and add $550
                logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âµ CONCERT PRICING: {distance_km}km total, charging to Hibiscus Coast + ${matakana_concert_base} concert transfer")
        
        # Standard tiered pricing (original rates)
        if distance_km <= 15.0:
            rate_per_km = 12.00  # $12.00 per km for 0-15km
        elif distance_km <= 15.8:
            rate_per_km = 8.00   # $8.00 per km for 15-15.8km
        elif distance_km <= 16.0:
            rate_per_km = 6.00   # $6.00 per km for 15.8-16km
        elif distance_km <= 25.5:
            rate_per_km = 5.50   # $5.50 per km for 16-25.5km
        elif distance_km <= 35.0:
            rate_per_km = 5.00   # $5.00 per km for 25.5-35km
        elif distance_km <= 50.0:
            rate_per_km = 4.00   # $4.00 per km for 35-50km
        elif distance_km <= 60.0:
            rate_per_km = 2.60   # $2.60 per km for 50-60km
        elif distance_km <= 75.0:
            rate_per_km = 2.47   # $2.47 per km for 60-75km
        elif distance_km <= 100.0:
            rate_per_km = 2.70   # $2.70 per km for 75-100km
        else:
            rate_per_km = 3.50   # $3.50 per km for 100km+
        
        # Calculate base price: distance ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â rate for that bracket
        base_price = distance_km * rate_per_km
        
        # VIP Airport Pickup fee: Optional $15 extra service
        airport_fee = 15.0 if request.vipAirportPickup else 0.0
        
        # Oversized Luggage fee: Optional $25 for skis, bikes, surfboards, etc.
        oversized_luggage_fee = 25.0 if request.oversizedLuggage else 0.0
        
        # Passenger fee: 1st passenger included, $5 per additional
        extra_passengers = max(0, request.passengers - 1)
        passenger_fee = extra_passengers * 5.0
        
        # Total price calculation
        total_price = base_price + airport_fee + oversized_luggage_fee + passenger_fee
        
        # Apply minimum fee / special pricing
        # Special event: Matakana Country Park concert
        if is_concert_trip:
            if is_from_hibiscus_coast or is_to_hibiscus_coast:
                # From/to Hibiscus Coast - flat $550 minimum (return)
                if total_price < matakana_concert_base:
                    logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âµ Hibiscus Coast ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ Matakana Country Park: applying flat ${matakana_concert_base}")
                    total_price = matakana_concert_base
            else:
                # From elsewhere in Auckland:
                # Calculate km rate to Hibiscus Coast boundary, then ADD $550
                # Use the distance TO Hibiscus Coast (approx 40km from CBD)
                distance_to_hibiscus = min(distance_km, hibiscus_coast_distance_km)
                
                # Calculate price for the distance to Hibiscus Coast using tiered rates
                if distance_to_hibiscus <= 15.0:
                    rate_to_hibiscus = 12.00
                elif distance_to_hibiscus <= 15.8:
                    rate_to_hibiscus = 8.00
                elif distance_to_hibiscus <= 16.0:
                    rate_to_hibiscus = 6.00
                elif distance_to_hibiscus <= 25.5:
                    rate_to_hibiscus = 5.50
                elif distance_to_hibiscus <= 35.0:
                    rate_to_hibiscus = 5.00
                elif distance_to_hibiscus <= 50.0:
                    rate_to_hibiscus = 4.00
                else:
                    rate_to_hibiscus = 3.50
                
                price_to_hibiscus = distance_to_hibiscus * rate_to_hibiscus
                
                # Total = km rate to Hibiscus Coast + $550 concert base + extras
                total_price = price_to_hibiscus + matakana_concert_base + airport_fee + oversized_luggage_fee + passenger_fee
                
                logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âµ Auckland ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ Matakana Country Park: {distance_to_hibiscus}km @ ${rate_to_hibiscus}/km = ${price_to_hibiscus:.2f} + ${matakana_concert_base} = ${total_price:.2f}")
        elif total_price < 100.0:
            # Standard minimum of $100 for regular trips
            total_price = 100.0
        
        # Calculate Stripe processing fee (2.9% + $0.30 NZD) and add to customer total
        # This ensures drivers get the full base amount
        subtotal = round(total_price, 2)
        stripe_fee = round((subtotal * 0.029) + 0.30, 2)
        total_with_stripe = round(subtotal + stripe_fee, 2)
        
        return PricingBreakdown(
            distance=distance_km,
            basePrice=round(base_price, 2),
            airportFee=round(airport_fee, 2),
            oversizedLuggageFee=round(oversized_luggage_fee, 2),
            passengerFee=round(passenger_fee, 2),
            stripeFee=stripe_fee,
            subtotal=subtotal,
            totalPrice=total_with_stripe,
            ratePerKm=round(rate_per_km, 2)
        )
    except Exception as e:
        logger.error(f"Error calculating price: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error calculating price: {str(e)}")

# Validate and apply promo code
@api_router.post("/validate-promo")
async def validate_promo_code(data: PromoCodeValidation):
    """Validate a promo code and return discount details"""
    try:
        code = data.code.upper().strip()
        subtotal = data.subtotal
        
        if code not in PROMO_CODES:
            raise HTTPException(status_code=400, detail="Invalid promo code")
        
        promo = PROMO_CODES[code]
        discount_percent = promo["discount_percent"]
        discount_amount = round(subtotal * (discount_percent / 100), 2)
        new_subtotal = round(subtotal - discount_amount, 2)
        
        # Recalculate Stripe fee on discounted amount
        stripe_fee = round((new_subtotal * 0.029) + 0.30, 2)
        new_total = round(new_subtotal + stripe_fee, 2)
        
        return {
            "valid": True,
            "code": code,
            "description": promo["description"],
            "discountPercent": discount_percent,
            "discountAmount": discount_amount,
            "originalSubtotal": subtotal,
            "newSubtotal": new_subtotal,
            "stripeFee": stripe_fee,
            "newTotal": new_total
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating promo code: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Create Booking Endpoint
@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking: BookingCreate, background_tasks: BackgroundTasks):
    try:
        # Log return flight number for debugging
        logger.info(f"Creating booking - returnDepartureFlightNumber: '{booking.returnDepartureFlightNumber}', returnFlightNumber: '{booking.returnFlightNumber}', bookReturn: {booking.bookReturn}")
        
        booking_obj = Booking(**booking.dict())
        booking_dict = booking_obj.dict()
        
        # Ensure return flight number is preserved (check both field names)
        if booking.returnDepartureFlightNumber:
            booking_dict['returnDepartureFlightNumber'] = booking.returnDepartureFlightNumber
            booking_dict['returnFlightNumber'] = booking.returnDepartureFlightNumber  # Also set the alias
            logger.info(f"Set returnDepartureFlightNumber: {booking.returnDepartureFlightNumber}")
        
        # Get sequential reference number
        ref_number = await get_next_reference_number()
        booking_dict['referenceNumber'] = ref_number
        booking_obj.referenceNumber = ref_number
        
        # Check if booking is within 24 hours - requires manual approval
        requires_approval = is_booking_within_24_hours(booking.date, booking.time)
        if requires_approval:
            booking_dict['status'] = 'pending_approval'
            booking_obj.status = 'pending_approval'
            logger.info(f"Booking #{ref_number} requires manual approval (within 24 hours)")
        
        # Extract totalPrice from pricing for payment processing
        booking_dict['totalPrice'] = booking.pricing.get('totalPrice', 0)
        booking_dict['payment_status'] = 'unpaid'
        
        # Critical: Verify the database write succeeded
        result = await db.bookings.insert_one(booking_dict)
        
        # Verify insert was acknowledged and we have an inserted_id
        if not result.acknowledged or not result.inserted_id:
            logger.error(f"Database insert not acknowledged for booking #{ref_number}")
            raise HTTPException(status_code=500, detail="Failed to save booking to database")
        
        # Double-check the booking exists in the database before proceeding
        saved_booking = await db.bookings.find_one({"_id": result.inserted_id})
        if not saved_booking:
            logger.error(f"Booking #{ref_number} not found after insert - potential data loss!")
            raise HTTPException(status_code=500, detail="Booking verification failed")
        
        logger.info(f"Booking created and verified: {booking_obj.id} with reference #{ref_number}, DB id: {result.inserted_id}")
        
        # === BACKGROUND TASKS: Non-critical operations run after response ===
        # This significantly speeds up booking creation for customers
        
        # Send admin notification email in background
        if requires_approval:
            background_tasks.add_task(
                run_async_task, 
                send_urgent_approval_notification, 
                booking_dict,
                f"urgent approval notification for booking #{ref_number}"
            )
        else:
            background_tasks.add_task(
                run_async_task,
                send_booking_notification_to_admin,
                booking_dict,
                f"admin notification for booking #{ref_number}"
            )
        
        # Sync to Google Calendar in background
        background_tasks.add_task(
            run_async_task,
            create_calendar_event,
            booking_dict,
            f"calendar event for booking #{ref_number}"
        )
        
        # Sync contact to iCloud in background (sync function, not async)
        background_tasks.add_task(
            run_sync_task,
            add_contact_to_icloud,
            booking_dict,
            f"iCloud contact sync for booking #{ref_number}"
        )
        
        # If payment method is 'xero', create and send Xero invoice in background
        if booking_dict.get('paymentMethod') == 'xero':
            background_tasks.add_task(
                run_async_task,
                create_and_send_xero_invoice,
                booking_dict,
                f"Xero invoice for booking #{ref_number}"
            )
        
        # Send customer confirmation email and SMS in background
        # Note: For Stripe/PayPal payments, additional confirmations will be sent via webhook after payment
        # This ensures customers always get an immediate acknowledgment of their booking
        background_tasks.add_task(
            run_sync_task,
            send_customer_confirmation,
            booking_dict,
            f"customer confirmation for booking #{ref_number}"
        )
        logger.info(f"Queued customer confirmation for booking #{ref_number}")
        
        return booking_obj
    except Exception as e:
        logger.error(f"Error creating booking: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating booking: {str(e)}")


# Quick Approve/Reject Endpoint (for email links - no auth required, uses secure token)
@api_router.get("/booking/quick-approve/{booking_id}")
async def quick_approve_booking(booking_id: str, action: str = "approve"):
    """
    Quick approve or reject a booking directly from email link.
    No authentication required - accessed via unique booking ID from email.
    """
    from fastapi.responses import HTMLResponse
    
    try:
        # Find the booking
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        
        if not booking:
            return HTMLResponse(content="""
                <html><body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1 style="color: #DC2626;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Booking Not Found</h1>
                    <p>This booking may have been deleted or the link is invalid.</p>
                    <a href="https://bookaride.co.nz/admin/dashboard" style="display: inline-block; margin-top: 20px; padding: 15px 30px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 8px;">Go to Admin Dashboard</a>
                </body></html>
            """, status_code=404)
        
        booking_ref = get_booking_reference(booking)
        customer_name = booking.get('name', 'Customer')
        
        if action == "approve":
            # Update booking status to confirmed
            await db.bookings.update_one(
                {"id": booking_id},
                {"$set": {
                    "status": "confirmed",
                    "approvedAt": datetime.now(timezone.utc).isoformat(),
                    "approvedVia": "email_quick_approve"
                }}
            )
            
            # Send confirmation to customer
            try:
                send_booking_confirmation_email(booking)
                logger.info(f"Confirmation sent to customer for booking {booking_ref}")
            except Exception as e:
                logger.error(f"Failed to send confirmation: {e}")
            
            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Booking {booking_ref} APPROVED via email quick-approve")
            
            return HTMLResponse(content=f"""
                <html><body style="font-family: Arial; text-align: center; padding: 50px; background-color: #f0fdf4;">
                    <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <h1 style="color: #16a34a; font-size: 48px; margin: 0;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦</h1>
                        <h2 style="color: #16a34a;">Booking Approved!</h2>
                        <p style="color: #374151;"><strong>Ref:</strong> {booking_ref}</p>
                        <p style="color: #374151;"><strong>Customer:</strong> {customer_name}</p>
                        <p style="color: #6b7280; margin-top: 20px;">The customer has been notified with their confirmation.</p>
                        <a href="https://bookaride.co.nz/admin/dashboard" style="display: inline-block; margin-top: 20px; padding: 15px 30px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Admin Dashboard</a>
                    </div>
                </body></html>
            """)
            
        elif action == "reject":
            # Update booking status to cancelled
            await db.bookings.update_one(
                {"id": booking_id},
                {"$set": {
                    "status": "cancelled",
                    "cancelledAt": datetime.now(timezone.utc).isoformat(),
                    "cancelledVia": "email_quick_reject",
                    "cancellationReason": "Rejected by admin - unable to accommodate last-minute booking"
                }}
            )
            
            # TODO: Optionally send rejection email to customer
            
            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Booking {booking_ref} REJECTED via email quick-approve")
            
            return HTMLResponse(content=f"""
                <html><body style="font-family: Arial; text-align: center; padding: 50px; background-color: #fef2f2;">
                    <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <h1 style="color: #DC2626; font-size: 48px; margin: 0;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢</h1>
                        <h2 style="color: #DC2626;">Booking Rejected</h2>
                        <p style="color: #374151;"><strong>Ref:</strong> {booking_ref}</p>
                        <p style="color: #374151;"><strong>Customer:</strong> {customer_name}</p>
                        <p style="color: #6b7280; margin-top: 20px;">The booking has been cancelled.</p>
                        <a href="https://bookaride.co.nz/admin/dashboard" style="display: inline-block; margin-top: 20px; padding: 15px 30px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Admin Dashboard</a>
                    </div>
                </body></html>
            """)
        else:
            return HTMLResponse(content="""
                <html><body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1 style="color: #f59e0b;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Invalid Action</h1>
                    <p>Please use the approve or reject buttons from the email.</p>
                </body></html>
            """, status_code=400)
            
    except Exception as e:
        logger.error(f"Error in quick approve: {str(e)}")
        return HTMLResponse(content=f"""
            <html><body style="font-family: Arial; text-align: center; padding: 50px;">
                <h1 style="color: #DC2626;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Error</h1>
                <p>Something went wrong. Please try again or use the admin dashboard.</p>
                <a href="https://bookaride.co.nz/admin/dashboard" style="display: inline-block; margin-top: 20px; padding: 15px 30px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 8px;">Go to Admin Dashboard</a>
            </body></html>
        """, status_code=500)


# Get All Bookings Endpoint (for admin)
@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings(
    current_admin: dict = Depends(get_current_admin),
    page: int = 1,
    limit: int = 50,
    status: str = None,
    search: str = None,
    date_from: str = None,
    date_to: str = None
):
    """Get bookings with pagination and filtering for faster loading"""
    try:
        # Build query
        query = {}
        
        # Status filter
        if status and status != 'all':
            query['status'] = status
        
        # Search filter (name, email, phone, reference)
        if search:
            query['$or'] = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'email': {'$regex': search, '$options': 'i'}},
                {'phone': {'$regex': search, '$options': 'i'}},
                {'referenceNumber': {'$regex': search, '$options': 'i'}},
                {'original_booking_id': {'$regex': search, '$options': 'i'}}
            ]
        
        # Date range filter
        if date_from:
            query['date'] = query.get('date', {})
            query['date']['$gte'] = date_from
        if date_to:
            query.setdefault('date', {})['$lte'] = date_to
        
        # Calculate skip for pagination
        skip = (page - 1) * limit
        
        # Get total count for pagination info
        total = await db.bookings.count_documents(query)
        
        # Get current date in NZ timezone for sorting priority
        nz_tz = pytz.timezone('Pacific/Auckland')
        now_nz = datetime.now(nz_tz)
        today_str = now_nz.strftime('%Y-%m-%d')
        
        # Fetch ALL matching bookings to sort properly (needed for smart date ordering)
        all_bookings = await db.bookings.find(query, {"_id": 0}).to_list(None)
        
        # Custom sort: prioritize today, then tomorrow, then upcoming dates, then past dates
        def sort_key(b):
            date = b.get('date', '9999-99-99')
            time = b.get('time', '00:00')
            if date == today_str:
                return (0, time)  # Today first
            elif date > today_str:
                return (1, date, time)  # Future dates in ascending order
            else:
                return (2, date, time)  # Past dates last
        
        all_bookings.sort(key=sort_key)
        logger.info(f"Today: {today_str}, First 3 bookings after sort: {[b.get('date') for b in all_bookings[:3]]}")
        
        # Apply pagination
        bookings = all_bookings[skip:skip + limit]
        
        # Add pagination headers via response
        logger.info(f"Fetched {len(bookings)} bookings (page {page}, total {total})")
        
        return [Booking(**booking) for booking in bookings]
    except Exception as e:
        logger.error(f"Error fetching bookings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching bookings: {str(e)}")


@api_router.get("/bookings/count")
async def get_bookings_count(current_admin: dict = Depends(get_current_admin)):
    """Get total booking counts for dashboard stats"""
    try:
        total = await db.bookings.count_documents({})
        pending = await db.bookings.count_documents({"status": "pending"})
        confirmed = await db.bookings.count_documents({"status": "confirmed"})
        completed = await db.bookings.count_documents({"status": "completed"})
        cancelled = await db.bookings.count_documents({"status": "cancelled"})
        pending_approval = await db.bookings.count_documents({"status": "pending_approval"})
        
        return {
            "total": total,
            "pending": pending,
            "confirmed": confirmed,
            "completed": completed,
            "cancelled": cancelled,
            "pending_approval": pending_approval
        }
    except Exception as e:
        logger.error(f"Error fetching booking counts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



# Update Booking Endpoint (for admin)
@api_router.patch("/bookings/{booking_id}")
async def update_booking(booking_id: str, update_data: dict, current_admin: dict = Depends(get_current_admin)):
    try:
        # Auto-sync bookReturn flag when returnDate is set/cleared
        if 'returnDate' in update_data:
            if update_data['returnDate'] and update_data['returnDate'].strip():
                update_data['bookReturn'] = True
            else:
                update_data['bookReturn'] = False
        
        # Sync totalPrice when pricing is updated
        if 'pricing' in update_data and update_data['pricing']:
            if 'totalPrice' in update_data['pricing']:
                update_data['totalPrice'] = update_data['pricing']['totalPrice']
                logger.info(f"Synced totalPrice to {update_data['totalPrice']} for booking {booking_id}")
        
        # Also sync if totalPrice is updated directly
        if 'totalPrice' in update_data and update_data['totalPrice']:
            # Update pricing.totalPrice as well if pricing exists
            existing = await db.bookings.find_one({"id": booking_id}, {"_id": 0, "pricing": 1})
            if existing and existing.get('pricing'):
                if 'pricing' not in update_data:
                    update_data['pricing'] = existing['pricing']
                update_data['pricing']['totalPrice'] = update_data['totalPrice']
        
        result = await db.bookings.update_one(
            {"id": booking_id},
            {"$set": update_data}
        )
        # Use matched_count, not modified_count - a booking with identical data is still valid
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
        logger.info(f"Booking updated: {booking_id}")
        
        # Auto-sync to Google Calendar if date/time changed
        if any(key in update_data for key in ['date', 'time', 'returnDate', 'returnTime', 'pickupAddress', 'dropoffAddress']):
            try:
                # Get the updated booking
                updated_booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
                if updated_booking and updated_booking.get('calendar_event_id'):
                    # Update existing calendar event
                    await update_calendar_event(updated_booking)
                    logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Calendar event updated for booking {booking_id}")
            except Exception as cal_error:
                logger.warning(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Failed to update calendar event: {str(cal_error)}")
                # Don't fail the whole update if calendar sync fails
        
        return {"message": "Booking updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating booking: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating booking: {str(e)}")

# Send Email Endpoint (for admin)
@api_router.post("/send-booking-email")
async def send_booking_email(email_data: dict, current_admin: dict = Depends(get_current_admin)):
    try:
        recipient_email = email_data.get('email')
        cc_emails = email_data.get('cc', '')  # CC email addresses (comma separated)
        subject = email_data.get('subject')
        message = email_data.get('message')
        
        if not recipient_email or not subject or not message:
            raise HTTPException(status_code=400, detail="Missing required email fields")
        
        # Send via Mailgun
        mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
        mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
        sender_email = os.environ.get('SENDER_EMAIL', 'noreply@mg.bookaride.co.nz')
        
        if not mailgun_api_key or not mailgun_domain:
            raise HTTPException(status_code=500, detail="Mailgun not configured")
        
        # Create HTML email content
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0;">BookaRide.co.nz</h1>
                </div>
                <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e8e4d9; border-top: none;">
                    <h2 style="color: #333;">{subject}</h2>
                    <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">{message}</div>
                </div>
                <div style="background: #faf8f3; color: #666; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; border: 1px solid #e8e4d9; border-top: none;">
                    <p style="margin: 0;"><span style="color: #D4AF37; font-weight: bold;">BookaRide NZ</span> | bookaride.co.nz | +64 21 743 321</p>
                </div>
            </body>
        </html>
        """
        
        # Build email data
        email_payload = {
            "from": f"BookaRide Admin <{sender_email}>",
            "to": recipient_email,
            "subject": subject,
            "html": html_content,
            "text": message
        }
        
        # Add CC if provided
        if cc_emails and cc_emails.strip():
            email_payload["cc"] = cc_emails.strip()
        
        # Send email via Mailgun API
        response = requests.post(
            f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
            auth=("api", mailgun_api_key),
            data=email_payload
        )
        
        if response.status_code == 200:
            cc_info = f" (CC: {cc_emails})" if cc_emails else ""
            logger.info(f"Admin email sent to {recipient_email}{cc_info} - Subject: {subject}")
            return {"message": "Email sent successfully"}
        else:
            logger.error(f"Mailgun error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail=f"Failed to send email: {response.text}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending email: {str(e)}")


@api_router.post("/bookings/{booking_id}/send-to-admin")
async def send_booking_to_admin(booking_id: str, current_admin: dict = Depends(get_current_admin)):
    """Send booking details to admin mailbox"""
    try:
        # Get booking details
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Get admin email from environment or use default
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@bookaride.co.nz')
        
        # Send via Mailgun
        mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
        mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
        sender_email = os.environ.get('SENDER_EMAIL', 'noreply@mg.bookaride.co.nz')
        
        if not mailgun_api_key or not mailgun_domain:
            raise HTTPException(status_code=500, detail="Mailgun not configured")
        
        # Format booking details
        total_price = booking.get('totalPrice', 0)
        pricing = booking.get('pricing', {})
        is_overridden = pricing.get('isOverridden', False)
        
        # Create HTML email content with all booking details
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0;">BookaRide.co.nz</h1>
                    <p style="margin: 5px 0; font-size: 14px; color: rgba(255,255,255,0.9);">Admin Booking Notification</p>
                </div>
                
                <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e8e4d9; border-top: none;">
                    <h2 style="color: #333; margin-top: 0;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ Booking Details</h2>
                    
                    <div style="background-color: #faf8f3; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4AF37;">
                        <p style="margin: 5px 0;"><strong>Booking Reference:</strong> {booking.get('id', '')[:8].upper()}</p>
                        <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: {'#16a34a' if booking.get('status') == 'confirmed' else '#ea580c'}; font-weight: bold;">{booking.get('status', 'N/A').upper()}</span></p>
                        <p style="margin: 5px 0;"><strong>Payment Status:</strong> {booking.get('payment_status', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Created:</strong> {booking.get('createdAt', 'N/A')}</p>
                    </div>
                    
                    <h3 style="color: #333; margin-top: 30px;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¹Ã…â€œÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ Customer Information</h3>
                    <div style="background-color: #faf8f3; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p style="margin: 5px 0;"><strong>Name:</strong> {booking.get('name', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:{booking.get('email', 'N/A')}" style="color: #D4AF37;">{booking.get('email', 'N/A')}</a></p>
                        <p style="margin: 5px 0;"><strong>Phone:</strong> <a href="tel:{booking.get('phone', 'N/A')}" style="color: #D4AF37;">{booking.get('phone', 'N/A')}</a></p>
                    </div>
                    
                    <h3 style="color: #333; margin-top: 30px;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Trip Details</h3>
                    <div style="background-color: #faf8f3; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p style="margin: 5px 0;"><strong>Service Type:</strong> {booking.get('serviceType', 'N/A').replace('-', ' ').title()}</p>
                        <p style="margin: 5px 0;"><strong>Pickup:</strong> {booking.get('pickupAddress', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Drop-off:</strong> {booking.get('dropoffAddress', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Date:</strong> {booking.get('date', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Time:</strong> {booking.get('time', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Passengers:</strong> {booking.get('passengers', 'N/A')}</p>
                    </div>
                    
                    <h3 style="color: #333; margin-top: 30px;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â° Pricing Details</h3>
                    <div style="background-color: #faf8f3; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p style="margin: 5px 0;"><strong>Distance:</strong> {pricing.get('distance', 0)} km</p>
                        <p style="margin: 5px 0;"><strong>Base Price:</strong> ${pricing.get('basePrice', 0):.2f} NZD</p>
                        {'<p style="margin: 5px 0;"><strong>Airport Fee:</strong> $' + f"{pricing.get('airportFee', 0):.2f}" + ' NZD</p>' if pricing.get('airportFee', 0) > 0 else ''}
                        {'<p style="margin: 5px 0;"><strong>Passenger Fee:</strong> $' + f"{pricing.get('passengerFee', 0):.2f}" + ' NZD</p>' if pricing.get('passengerFee', 0) > 0 else ''}
                        <hr style="border: 0; border-top: 2px solid #D4AF37; margin: 15px 0;">
                        <p style="margin: 5px 0; font-size: 18px;"><strong>Total Price:</strong> <span style="color: #D4AF37; font-size: 20px;">${total_price:.2f} NZD</span></p>
                        {f'<p style="margin: 5px 0; color: #ea580c; font-size: 12px;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Price was manually overridden</p>' if is_overridden else ''}
                    </div>
                    
                    {'<h3 style="color: #333; margin-top: 30px;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Flight Information</h3><div style="background-color: #faf8f3; padding: 15px; border-radius: 8px; margin: 15px 0;"><p style="margin: 5px 0;"><strong>Departure Flight:</strong> ' + booking.get('departureFlightNumber', 'N/A') + ' at ' + booking.get('departureTime', 'N/A') + '</p><p style="margin: 5px 0;"><strong>Arrival Flight:</strong> ' + booking.get('arrivalFlightNumber', 'N/A') + ' at ' + booking.get('arrivalTime', 'N/A') + '</p></div>' if booking.get('departureFlightNumber') or booking.get('arrivalFlightNumber') else ''}
                    
                    {f'<h3 style="color: #333; margin-top: 30px;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Special Notes</h3><div style="background-color: #fff8e6; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #D4AF37;"><p style="margin: 0;">{booking.get("notes", "")}</p></div>' if booking.get('notes') else ''}
                    
                    <div style="margin-top: 30px; padding: 15px; background-color: #fff8e6; border-radius: 8px; border-left: 4px solid #D4AF37;">
                        <p style="margin: 0; color: #333;"><strong>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ Quick Actions:</strong></p>
                        <p style="margin: 5px 0; font-size: 14px;">Log in to your <a href="https://bookaride.co.nz/admin/login" style="color: #D4AF37; text-decoration: none; font-weight: bold;">Admin Dashboard</a> to manage this booking.</p>
                    </div>
                </div>
                
                <div style="background: #faf8f3; color: #666; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; border: 1px solid #e8e4d9; border-top: none;">
                    <p style="margin: 0;"><span style="color: #D4AF37; font-weight: bold;">BookaRide NZ</span> Admin System</p>
                    <p style="margin: 5px 0;">bookaride.co.nz | +64 21 743 321</p>
                </div>
            </body>
        </html>
        """
        
        # Send email via Mailgun API
        response = requests.post(
            f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
            auth=("api", mailgun_api_key),
            data={
                "from": f"BookaRide System <{sender_email}>",
                "to": admin_email,
                "subject": f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ Booking Details - {booking.get('name', 'Customer')} - {booking.get('id', '')[:8].upper()}",
                "html": html_content
            }
        )
        
        if response.status_code == 200:
            logger.info(f"Booking details sent to admin: {admin_email} - Booking: {booking_id}")
            return {"message": f"Booking details sent to {admin_email}"}
        else:
            logger.error(f"Mailgun error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail=f"Failed to send email: {response.text}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending booking to admin: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending booking to admin: {str(e)}")


# ============================================
# DATE AND REFERENCE FORMATTING HELPERS
# ============================================

def format_date_ddmmyyyy(date_str: str) -> str:
    """Convert date from YYYY-MM-DD to DD/MM/YYYY format"""
    if not date_str or date_str == 'N/A':
        return 'N/A'
    try:
        # Handle various input formats
        if '/' in date_str:
            # Already in DD/MM/YYYY or similar format
            parts = date_str.split('/')
            if len(parts) == 3 and len(parts[0]) == 4:
                # YYYY/MM/DD format
                return f"{parts[2]}/{parts[1]}/{parts[0]}"
            return date_str  # Already DD/MM/YYYY
        elif '-' in date_str:
            # YYYY-MM-DD format
            parts = date_str.split('-')
            if len(parts) == 3:
                return f"{parts[2]}/{parts[1]}/{parts[0]}"
        return date_str
    except Exception:
        return date_str


def format_time_ampm(time_str: str) -> str:
    """Convert 24-hour time to 12-hour AM/PM format"""
    if not time_str or time_str == 'N/A':
        return 'N/A'
    try:
        # Handle HH:MM format
        if ':' in time_str:
            parts = time_str.split(':')
            hour = int(parts[0])
            minute = parts[1]
            
            if hour == 0:
                return f"12:{minute} AM"
            elif hour < 12:
                return f"{hour}:{minute} AM"
            elif hour == 12:
                return f"12:{minute} PM"
            else:
                return f"{hour - 12}:{minute} PM"
        return time_str
    except Exception:
        return time_str


def get_booking_reference(booking: dict) -> str:
    """Get the booking reference number for display"""
    # Use the sequential reference number if available
    ref_num = booking.get('referenceNumber')
    if ref_num:
        return f"#{ref_num}"
    # Fallback to first 8 chars of UUID for old bookings
    booking_id = booking.get('id', '')
    if booking_id:
        return booking_id[:8].upper()
    return 'N/A'

def get_full_booking_reference(booking: dict) -> str:
    """Get the full booking ID for admin reference"""
    return booking.get('id', 'N/A')


# Email and SMS Notification Services

# Email translations
EMAIL_TRANSLATIONS = {
    'en': {
        'subject': 'Booking Confirmation',
        'confirmed': 'Booking Confirmed!',
        'greeting': 'Dear',
        'intro': 'Your ride has been confirmed. Here are your booking details:',
        'reference': 'Booking Reference',
        'service': 'Service Type',
        'pickup': 'Pickup',
        'dropoff': 'Drop-off',
        'date': 'Date',
        'time': 'Time',
        'passengers': 'Passengers',
        'total': 'Total Paid',
        'contact_intro': 'We\'ll be in touch closer to your pickup time to confirm all details.',
        'contact': 'If you have any questions, please contact us at',
        'or_call': 'or call',
        'thanks': 'Thank you for choosing BookaRide!'
    },
    'zh': {
        'subject': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤',
        'confirmed': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â²ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â',
        'greeting': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾',
        'intro': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â²ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡',
        'reference': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·',
        'service': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹',
        'pickup': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹',
        'dropoff': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹',
        'date': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸',
        'time': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¶ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´',
        'passengers': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°',
        'total': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨',
        'contact_intro': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¹Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¶ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡',
        'contact': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¹Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬',
        'or_call': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âµ',
        'thanks': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©BookaRideÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â'
    },
    'ja': {
        'subject': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â',
        'confirmed': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â',
        'greeting': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“',
        'intro': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡',
        'reference': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·',
        'service': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂµÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â',
        'pickup': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬',
        'dropoff': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬',
        'date': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“',
        'time': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“',
        'passengers': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°',
        'total': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¹Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â',
        'contact_intro': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¹Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂµÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡',
        'contact': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾',
        'or_call': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂºÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾',
        'thanks': 'BookaRideÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â'
    },
    'ko': {
        'subject': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸',
        'confirmed': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂµÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤!',
        'greeting': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚ÂªÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚ÂªÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚ÂªÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“',
        'intro': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂµÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤. ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚ÂªÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚ÂªÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂµÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤:',
        'reference': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â²ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸',
        'service': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢',
        'pickup': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¹Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“',
        'dropoff': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“',
        'date': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ',
        'time': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚ÂªÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾',
        'passengers': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚ÂªÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“',
        'total': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚ÂªÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â²ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚ÂªÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡',
        'contact_intro': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¹Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚ÂªÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚ÂªÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚ÂªÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂºÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¶ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚ÂªÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â° ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚ÂªÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â²ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂµÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤.',
        'contact': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â',
        'or_call': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â',
        'thanks': 'BookaRideÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¼ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚ÂªÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â«ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤!'
    },
    'fr': {
        'subject': 'Confirmation de RÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©servation',
        'confirmed': 'RÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©servation ConfirmÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©e!',
        'greeting': 'Cher',
        'intro': 'Votre trajet a ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© confirmÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©. Voici les dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©tails de votre rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©servation:',
        'reference': 'RÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©fÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rence de RÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©servation',
        'service': 'Type de Service',
        'pickup': 'Lieu de Prise en Charge',
        'dropoff': 'Lieu de DÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©pose',
        'date': 'Date',
        'time': 'Heure',
        'passengers': 'Passagers',
        'total': 'Total PayÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©',
        'contact_intro': 'Nous vous contacterons avant votre heure de prise en charge pour confirmer tous les dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©tails.',
        'contact': 'Pour toute question, veuillez nous contacter ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ',
        'or_call': 'ou appelez',
        'thanks': 'Merci d\'avoir choisi BookaRide!'
    },
    'hi': {
        'subject': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿',
        'confirmed': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â !',
        'greeting': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯',
        'intro': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â  ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂµÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂµÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡:',
        'reference': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­',
        'service': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂµÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°',
        'pickup': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âª',
        'dropoff': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âª-ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¹Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â«',
        'date': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ',
        'time': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯',
        'passengers': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬',
        'total': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â² ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨',
        'contact_intro': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â® ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¡ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âª ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¡ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â²ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¡ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂµÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂµÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¡ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â²ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤',
        'contact': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¡ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â  ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¶ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡, ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â®ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¡ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂªÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡',
        'or_call': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â² ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡',
        'thanks': 'BookaRide ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¡ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¡ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â²ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂµÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦!'
    }
}

def send_booking_confirmation_email(booking: dict, include_payment_link: bool = True):
    """Send booking confirmation email via Mailgun or SMTP fallback"""
    # Try Mailgun first
    mailgun_success = send_via_mailgun(booking)
    if mailgun_success:
        return True
    
    # Fallback to SMTP if Mailgun fails
    logger.warning("Mailgun failed, trying SMTP fallback...")
    return send_via_smtp(booking)


def send_via_mailgun(booking: dict):
    """Try sending via Mailgun with beautiful email template"""
    try:
        mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
        mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
        sender_email = os.environ.get('SENDER_EMAIL', 'noreply@bookaride.co.nz')
        
        if not mailgun_api_key or not mailgun_domain:
            logger.warning("Mailgun credentials not configured")
            return False
        
        # Get booking reference for subject line
        booking_ref = get_booking_reference(booking)
        
        # Get language preference for subject (default to English)
        lang = booking.get('language', 'en')
        if lang not in EMAIL_TRANSLATIONS:
            lang = 'en'
        t = EMAIL_TRANSLATIONS[lang]
        
        subject = f"{t['subject']} - Ref: {booking_ref}"
        recipient_email = booking.get('email')
        
        # Use the beautiful email template
        html_content = generate_confirmation_email_html(booking)
        
        # Build email data with CC support
        email_data = {
            "from": f"BookaRide <{sender_email}>",
            "to": recipient_email,
            "subject": subject,
            "html": html_content
        }
        
        # Add CC if provided
        cc_email = booking.get('ccEmail', '')
        if cc_email and cc_email.strip():
            email_data["cc"] = cc_email.strip()
        
        # Send email via Mailgun API
        response = requests.post(
            f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
            auth=("api", mailgun_api_key),
            data=email_data
        )
        
        if response.status_code == 200:
            cc_info = f" (CC: {cc_email})" if cc_email else ""
            logger.info(f"Confirmation email sent to {recipient_email}{cc_info} via Mailgun")
            return True
        else:
            logger.error(f"Mailgun error: {response.status_code} - {response.text}")
            return False
        
    except Exception as e:
        logger.error(f"Mailgun error: {str(e)}")
        return False


def send_via_smtp(booking: dict):
    """Fallback: Send via Gmail SMTP"""
    try:
        smtp_user = os.environ.get('SMTP_USER')
        smtp_pass = os.environ.get('SMTP_PASS')
        sender_email = os.environ.get('SENDER_EMAIL', 'noreply@bookaride.co.nz')
        
        if not smtp_user or not smtp_pass:
            logger.warning("SMTP credentials not configured")
            return False
        
        # Create email content using the beautiful template
        booking_ref = get_booking_reference(booking)
        subject = f"Booking Confirmation - Ref: {booking_ref}"
        recipient_email = booking.get('email')
        
        # Use the beautiful email template
        html_content = generate_confirmation_email_html(booking)
        
        # Create message
        message = MIMEMultipart('alternative')
        message['Subject'] = subject
        message['From'] = sender_email
        message['To'] = recipient_email
        
        # Attach HTML
        html_part = MIMEText(html_content, 'html')
        message.attach(html_part)
        
        # Send via SMTP
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(message)
        
        logger.info(f"Confirmation email sent to {recipient_email} via SMTP")
        return True
        
    except Exception as e:
        logger.error(f"SMTP error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False


def send_booking_confirmation_sms(booking: dict):
    """Send booking confirmation SMS via Twilio"""
    try:
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')
        
        if not account_sid or not auth_token or not twilio_phone:
            logger.warning("Twilio credentials not configured")
            return False
        
        client = Client(account_sid, auth_token)
        
        # Format date as DD/MM/YYYY and time with AM/PM
        formatted_date = format_date_ddmmyyyy(booking.get('date', 'N/A'))
        formatted_time = format_time_ampm(booking.get('time', 'N/A'))
        booking_ref = get_booking_reference(booking)
        
        # Get flight number
        flight_num = booking.get('flightNumber') or booking.get('departureFlightNumber') or booking.get('arrivalFlightNumber') or ''
        flight_text = f"\nFlight: {flight_num}" if flight_num else ""
        
        # Get return trip info
        return_text = ""
        if booking.get('bookReturn') or booking.get('returnDate'):
            return_date = format_date_ddmmyyyy(booking.get('returnDate', ''))
            return_time = format_time_ampm(booking.get('returnTime', ''))
            return_flight = booking.get('returnFlightNumber') or booking.get('returnDepartureFlightNumber') or ''
            return_text = f"\n\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ Return: {return_date} at {return_time}"
            if return_flight:
                return_text += f"\nReturn Flight: {return_flight}"
        
        # Get pricing
        pricing = booking.get('pricing', {})
        total_price = pricing.get('totalPrice') or booking.get('totalPrice', 0)
        
        # Create SMS message
        message_body = f"""Book A Ride NZ - Booking Confirmed!

Ref: {booking_ref}
Pickup: {booking.get('pickupAddress', 'N/A')}
Date: {formatted_date} at {formatted_time}{flight_text}
Total: ${total_price:.2f} NZD{return_text}

Thank you for booking with us!"""
        
        formatted_phone = format_nz_phone(booking.get('phone', ''))
        if not formatted_phone:
            logger.warning("No phone number provided for confirmation SMS")
            return False
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± Sending confirmation SMS to: {formatted_phone}")
        
        message = client.messages.create(
            body=message_body,
            from_=twilio_phone,
            to=formatted_phone
        )
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Confirmation SMS sent to {formatted_phone} - SID: {message.sid}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending confirmation SMS: {str(e)}")
        return False


def send_customer_confirmation(booking: dict):
    """Send confirmation based on customer's notification preference"""
    preference = booking.get('notificationPreference', 'both')
    results = {'email': False, 'sms': False}
    booking_id = booking.get('id')
    
    if preference in ['email', 'both']:
        results['email'] = send_booking_confirmation_email(booking)
        logger.info(f"Email confirmation {'sent' if results['email'] else 'failed'} for booking {get_booking_reference(booking)}")
    
    if preference in ['sms', 'both']:
        results['sms'] = send_booking_confirmation_sms(booking)
        logger.info(f"SMS confirmation {'sent' if results['sms'] else 'failed'} for booking {get_booking_reference(booking)}")
    
    if preference == 'email':
        logger.info(f"Customer prefers EMAIL only - skipping SMS for booking {get_booking_reference(booking)}")
    elif preference == 'sms':
        logger.info(f"Customer prefers SMS only - skipping email for booking {get_booking_reference(booking)}")
    
    # Update database with confirmation status (sync version)
    if booking_id:
        try:
            from pymongo import MongoClient
            sync_client = MongoClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
            sync_db = sync_client[os.environ.get('DB_NAME', 'test_database')]
            
            nz_tz = pytz.timezone('Pacific/Auckland')
            now = datetime.now(nz_tz).isoformat()
            
            sync_db.bookings.update_one(
                {"id": booking_id},
                {"$set": {
                    'confirmation_sent': results['email'] or results['sms'],
                    'confirmation_sent_at': now,
                    'email_confirmation_sent': results['email'],
                    'sms_confirmation_sent': results['sms'],
                    'notifications_sent': True
                }}
            )
            sync_client.close()
            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Confirmation status updated for booking {booking_id}")
        except Exception as e:
            logger.error(f"Error updating confirmation status: {e}")
    
    return results

async def update_confirmation_status(booking_id: str, results: dict):
    """Update booking with confirmation status - ASYNC VERSION (deprecated, use sync in send_customer_confirmation)"""
    try:
        nz_tz = pytz.timezone('Pacific/Auckland')
        now = datetime.now(nz_tz).isoformat()
        
        update_data = {
            'confirmation_sent': results['email'] or results['sms'],
            'confirmation_sent_at': now,
            'email_confirmation_sent': results['email'],
            'sms_confirmation_sent': results['sms'],
            'notifications_sent': True
        }
        
        await db.bookings.update_one(
            {"id": booking_id},
            {"$set": update_data}
        )
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Confirmation status updated for booking {booking_id}")
    except Exception as e:
        logger.error(f"Error updating confirmation status: {e}")


def send_reminder_email(booking: dict):
    """Send day-before reminder email to customer with professional pickup instructions"""
    try:
        # SAFETY CHECK: Don't send reminders for cancelled bookings
        booking_status = booking.get('status', '').lower()
        if booking_status in ['cancelled', 'canceled', 'deleted']:
            logger.warning(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Skipping reminder email for CANCELLED booking: {booking.get('name')} (Ref: {booking.get('referenceNumber')})")
            return False
        
        mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
        mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
        sender_email = os.environ.get('SENDER_EMAIL', 'noreply@bookaride.co.nz')
        
        if not mailgun_api_key or not mailgun_domain:
            logger.warning("Mailgun credentials not configured for reminder")
            return False
        
        booking_ref = get_booking_reference(booking)
        formatted_date = format_date_ddmmyyyy(booking.get('date', 'N/A'))
        formatted_time = format_time_ampm(booking.get('time', 'N/A'))
        recipient_email = booking.get('email')
        customer_name = booking.get('name', 'Customer')
        driver_name = booking.get('driver_name', '')
        
        # Check if this is an airport pickup (international arrival)
        pickup_address = booking.get('pickupAddress', '').lower()
        dropoff_address = booking.get('dropoffAddress', '').lower()
        is_airport_pickup = 'airport' in pickup_address or 'akl' in pickup_address or 'international' in pickup_address
        
        # Build pickup addresses
        primary_pickup = booking.get('pickupAddress', 'N/A')
        pickup_addresses = booking.get('pickupAddresses', [])
        
        pickup_html = f"<p><strong>Pickup:</strong> {primary_pickup}</p>"
        if pickup_addresses:
            for i, addr in enumerate(pickup_addresses):
                if addr and addr.strip():
                    pickup_html += f"<p><strong>Additional Stop {i+1}:</strong> {addr}</p>"
        
        # Professional Airport Pickup Instructions
        airport_instructions = ""
        if is_airport_pickup:
            airport_instructions = f'''
                    <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); border-radius: 12px; padding: 25px; margin: 25px 0; color: white;">
                        <h3 style="margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
                            ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â INTERNATIONAL ARRIVALS - MEETING POINT
                        </h3>
                        
                        <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                            <p style="margin: 0 0 10px 0; font-size: 15px;">
                                <strong>Your driver will be waiting for you in the Arrivals Hall.</strong>
                            </p>
                            <p style="margin: 0; font-size: 14px; line-height: 1.6;">
                                Look for your driver holding either a <strong>BOOK A RIDE</strong> sign or an iPad displaying your name: <strong>{customer_name}</strong>
                            </p>
                        </div>
                        
                        <div style="background: rgba(212,175,55,0.2); border-radius: 8px; padding: 15px; border-left: 4px solid #D4AF37;">
                            <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: bold;">
                                DIRECTIONS TO MEETING POINT:
                            </p>
                            <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                                <li>After collecting your luggage, exit through the Customs doors</li>
                                <li><strong>TURN LEFT</strong> immediately upon entering the Arrivals Hall</li>
                                <li>Walk towards the <strong>Allpress Espresso Cafe</strong></li>
                                <li>All drivers wait directly in front of the cafe</li>
                            </ol>
                        </div>
                        
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
                            <p style="margin: 0; font-size: 13px; opacity: 0.9;">
                                <strong>Tip:</strong> If you turn RIGHT, you will be heading towards the domestic terminal. 
                                Turn LEFT to find your driver at the Allpress Cafe meeting point.
                            </p>
                        </div>
                    </div>
            '''
        
        # Pre-compute the ready reminder (only for non-airport pickups)
        ready_reminder_html = ""
        if not is_airport_pickup:
            ready_reminder_html = '''
                    <div style="background: #fff8e6; padding: 15px; border-radius: 8px; border-left: 4px solid #D4AF37; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px; color: #666;">
                            <strong>&#128205; Please be ready</strong> at your pickup location 5 minutes before your scheduled time.
                        </p>
                    </div>
            '''
        
        # Logo as inline SVG
        logo_svg = '''
            <svg width="50" height="50" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="64" height="64" rx="12" fill="#D4AF37"/>
                <circle cx="32" cy="32" r="20" stroke="white" stroke-width="3" fill="none"/>
                <text x="32" y="42" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">B</text>
            </svg>
        '''
        
        html_content = f'''
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #ffffff 0%, #faf8f3 100%); padding: 25px; text-align: center; border-bottom: 3px solid #D4AF37;">
                    {logo_svg}
                    <h1 style="margin: 10px 0 0 0; color: #1a1a1a; font-size: 20px;">BOOK<span style="color: #D4AF37;">A</span>RIDE</h1>
                </div>
                
                <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); padding: 20px; text-align: center;">
                    <h2 style="margin: 0; color: white; font-size: 20px;">Your Ride is Tomorrow!</h2>
                    <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">{formatted_date} at {formatted_time}</p>
                </div>
                
                <div style="padding: 25px;">
                    <p style="color: #333; font-size: 15px;">Dear <strong>{customer_name}</strong>,</p>
                    <p style="color: #333; font-size: 15px;">This is a friendly reminder that your transfer is scheduled for <strong>tomorrow</strong>. Please find your booking details and pickup instructions below.</p>
                    
                    <div style="background: #faf8f3; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #e8e4d9;">
                        <h3 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 16px;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¹ BOOKING DETAILS</h3>
                        <table style="width: 100%; font-size: 14px; color: #333;">
                            <tr><td style="padding: 5px 0; width: 120px;"><strong>Reference:</strong></td><td>{booking_ref}</td></tr>
                            <tr><td style="padding: 5px 0;"><strong>Date:</strong></td><td>{formatted_date}</td></tr>
                            <tr><td style="padding: 5px 0;"><strong>Time:</strong></td><td>{formatted_time}</td></tr>
                            <tr><td style="padding: 5px 0;"><strong>Passengers:</strong></td><td>{booking.get('passengers', 'N/A')}</td></tr>
                            {f'<tr><td style="padding: 5px 0;"><strong>Driver:</strong></td><td>{driver_name}</td></tr>' if driver_name else ''}
                        </table>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
                        {pickup_html}
                        <p style="margin: 5px 0;"><strong>Drop-off:</strong> {booking.get('dropoffAddress', 'N/A')}</p>
                    </div>
                    
                    {airport_instructions}
                    
                    {ready_reminder_html}
                    
                    <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #333;"><strong>&#128222; Contact Us</strong></p>
                        <p style="margin: 0; font-size: 14px; color: #666;">
                            Need to make changes or have questions?<br>
                            Phone: <a href="tel:+6421743321" style="color: #D4AF37; font-weight: bold;">+64 21 743 321</a><br>
                            Email: <a href="mailto:info@bookaride.co.nz" style="color: #D4AF37;">info@bookaride.co.nz</a>
                        </p>
                    </div>
                    
                    <p style="color: #333; margin-top: 25px;">We look forward to seeing you tomorrow!<br><strong>The BookaRide Team</strong></p>
                </div>
                
                <div style="background: #1a1a1a; padding: 20px; text-align: center;">
                    <p style="margin: 0; color: #888; font-size: 12px;">BookaRide NZ | Auckland Airport Transfers</p>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 11px;">bookaride.co.nz | +64 21 743 321</p>
                </div>
            </div>
        </body>
        </html>
        '''
        
        response = requests.post(
            f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
            auth=("api", mailgun_api_key),
            data={
                "from": f"BookaRide <{sender_email}>",
                "to": recipient_email,
                "subject": f"Your Ride Tomorrow - {formatted_date} at {formatted_time} - Ref: {booking_ref}",
                "html": html_content
            }
        )
        
        if response.status_code == 200:
            logger.info(f"Reminder email sent to {recipient_email}")
            return True
        else:
            logger.error(f"Reminder email failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending reminder email: {str(e)}")
        return False


def send_reminder_sms(booking: dict):
    """Send day-before reminder SMS to customer"""
    try:
        # SAFETY CHECK: Don't send reminders for cancelled bookings
        booking_status = booking.get('status', '').lower()
        if booking_status in ['cancelled', 'canceled', 'deleted']:
            logger.warning(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Skipping reminder SMS for CANCELLED booking: {booking.get('name')} (Ref: {booking.get('referenceNumber')})")
            return False
        
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')
        
        if not account_sid or not auth_token or not twilio_phone:
            logger.warning("Twilio credentials not configured for reminder")
            return False
        
        client = Client(account_sid, auth_token)
        
        booking_ref = get_booking_reference(booking)
        formatted_date = format_date_ddmmyyyy(booking.get('date', 'N/A'))
        formatted_time = format_time_ampm(booking.get('time', 'N/A'))
        customer_name = booking.get('name', 'Customer')
        driver_name = booking.get('driver_name', '')
        
        # Check if this is an airport pickup (international arrival)
        pickup_address = booking.get('pickupAddress', '').lower()
        is_airport_pickup = 'airport' in pickup_address or 'akl' in pickup_address or 'international' in pickup_address
        
        if is_airport_pickup:
            # Professional airport pickup SMS with meeting point instructions
            message_body = f"""BookaRide - Tomorrow

{customer_name}, your transfer is confirmed for TOMORROW at {formatted_time}.

MEETING POINT:
Your driver will hold either a BOOK A RIDE sign or an iPad with your name.

DIRECTIONS:
1. Exit Customs into Arrivals Hall
2. TURN LEFT immediately  
3. Walk to Allpress Espresso CafÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©
4. All drivers wait in front of the cafÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©

Ref: {booking_ref}
Questions? +64 21 743 321"""
        else:
            # Standard reminder SMS
            message_body = f"""BookaRide - Tomorrow

{customer_name}, your ride is confirmed for TOMORROW.

Date: {formatted_date}
Time: {formatted_time}
Pickup: {booking.get('pickupAddress', 'N/A')[:60]}
{f'Driver: {driver_name}' if driver_name else ''}

Please be ready 5 mins early.
Ref: {booking_ref}
Questions? +64 21 743 321"""
        
        formatted_phone = format_nz_phone(booking.get('phone', ''))
        if not formatted_phone:
            logger.warning("No phone number for reminder SMS")
            return False
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± Sending reminder SMS to: {formatted_phone}")
        
        message = client.messages.create(
            body=message_body,
            from_=twilio_phone,
            to=formatted_phone
        )
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Reminder SMS sent to {formatted_phone} - SID: {message.sid}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending reminder SMS: {str(e)}")
        return False


@api_router.post("/admin/send-reminders")
async def send_tomorrow_reminders(current_admin: dict = Depends(get_current_admin)):
    """Manually trigger sending reminders for tomorrow's bookings"""
    try:
        result = await send_daily_reminders_core(source="admin_manual")
        return {
            "success": True,
            "message": f"Sent reminders for {result.get('reminders_sent', 0)} bookings, skipped {result.get('skipped', 0)} (already sent today)",
            "details": result
        }
    except Exception as e:
        logger.error(f"Error sending reminders: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending reminders: {str(e)}")


@api_router.get("/admin/reminder-status")
async def get_reminder_status(current_admin: dict = Depends(get_current_admin)):
    """Get the status of today's reminders and scheduler health"""
    try:
        nz_tz = pytz.timezone('Pacific/Auckland')
        nz_now = datetime.now(nz_tz)
        nz_today = nz_now.strftime('%Y-%m-%d')
        nz_tomorrow = (nz_now + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Get tomorrow's bookings with all reminder fields
        tomorrow_bookings = await db.bookings.find({
            "status": "confirmed",
            "date": nz_tomorrow
        }, {"_id": 0, "id": 1, "name": 1, "email": 1, "phone": 1, "time": 1,
            "reminderSentAt": 1, "reminderSentForDate": 1, "reminderSource": 1,
            "reminderEmailSent": 1, "reminderSmsSent": 1, "reminderCompleted": 1}).to_list(100)
        
        sent = []
        pending = []
        
        for booking in tomorrow_bookings:
            reminder_sent_for = booking.get('reminderSentForDate', '')
            if reminder_sent_for == nz_tomorrow:
                sent.append({
                    "name": booking.get('name'),
                    "email": booking.get('email'),
                    "phone": booking.get('phone'),
                    "time": booking.get('time'),
                    "reminderSentAt": booking.get('reminderSentAt'),
                    "reminderSource": booking.get('reminderSource'),
                    "emailSent": booking.get('reminderEmailSent', False),
                    "smsSent": booking.get('reminderSmsSent', False)
                })
            else:
                pending.append({
                    "name": booking.get('name'),
                    "email": booking.get('email'),
                    "phone": booking.get('phone'),
                    "time": booking.get('time')
                })
        
        # Get scheduler status
        scheduler_jobs = []
        for job in scheduler.get_jobs():
            scheduler_jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": str(job.next_run_time) if job.next_run_time else "Not scheduled"
            })
        
        # Check lock status
        lock_status = "locked" if reminder_lock.locked() else "available"
        
        return {
            "current_nz_time": nz_now.strftime('%Y-%m-%d %H:%M:%S %Z'),
            "checking_for_date": nz_tomorrow,
            "total_bookings_tomorrow": len(tomorrow_bookings),
            "reminders_sent": len(sent),
            "reminders_pending": len(pending),
            "sent_details": sent,
            "pending_details": pending,
            "scheduler_status": "running" if scheduler.running else "stopped",
            "reminder_lock_status": lock_status,
            "scheduled_jobs": scheduler_jobs
        }
        
    except Exception as e:
        logger.error(f"Error getting reminder status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# FLIGHT TRACKER ENDPOINT
# ============================================

@api_router.get("/flight/track")
async def track_flight(flight_number: str):
    """Track a flight using AviationStack API"""
    try:
        # Clean up flight number
        fn = flight_number.strip().upper().replace(" ", "")
        
        if len(fn) < 3:
            raise HTTPException(status_code=400, detail="Invalid flight number")
        
        # Get API key
        api_key = os.environ.get('AVIATIONSTACK_API_KEY')
        
        if not api_key:
            logger.warning("AviationStack API key not configured - using mock data")
            # Fallback to mock data if no API key
            return await _get_mock_flight_data(fn)
        
        # Call AviationStack API
        import httpx
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "http://api.aviationstack.com/v1/flights",
                params={
                    "access_key": api_key,
                    "flight_iata": fn,
                    "limit": 1
                },
                timeout=10.0
            )
        
        data = response.json()
        
        # Check for API errors
        if "error" in data:
            logger.error(f"AviationStack API error: {data['error']}")
            return await _get_mock_flight_data(fn)
        
        flights = data.get("data", [])
        
        if not flights:
            logger.info(f"No flight data found for {fn}")
            return {
                "flightNumber": fn,
                "status": "Not Found",
                "message": f"No active flight found for {fn}. Please check the flight number.",
                "tracked": False
            }
        
        flight = flights[0]
        
        # Parse flight status
        flight_status = flight.get("flight_status", "unknown")
        status_map = {
            "scheduled": "Scheduled",
            "active": "In Flight",
            "landed": "Landed",
            "cancelled": "Cancelled",
            "incident": "Incident",
            "diverted": "Diverted"
        }
        status = status_map.get(flight_status, flight_status.title())
        
        # Get departure info
        departure = flight.get("departure", {})
        dep_code = departure.get("iata", "???")
        dep_airport = departure.get("airport", dep_code)
        dep_scheduled = departure.get("scheduled", "")
        dep_actual = departure.get("actual", dep_scheduled)
        dep_delay = departure.get("delay")
        
        # Get arrival info
        arrival = flight.get("arrival", {})
        arr_code = arrival.get("iata", "???")
        arr_airport = arrival.get("airport", arr_code)
        arr_scheduled = arrival.get("scheduled", "")
        arr_estimated = arrival.get("estimated", arr_scheduled)
        arr_actual = arrival.get("actual", arr_estimated)
        arr_delay = arrival.get("delay")
        
        # Format times
        def format_time(iso_string):
            if not iso_string:
                return "TBA"
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(iso_string.replace("Z", "+00:00"))
                return dt.strftime("%H:%M")
            except:
                return iso_string[:5] if len(iso_string) >= 5 else "TBA"
        
        def format_date(iso_string):
            if not iso_string:
                return ""
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(iso_string.replace("Z", "+00:00"))
                return dt.strftime("%d %b")
            except:
                return ""
        
        # Build message based on status
        if status == "Landed":
            message = "Flight has landed! Your driver is ready and waiting."
        elif status == "In Flight":
            if arr_delay and int(arr_delay) > 0:
                message = f"Flight is in the air. Delayed by {arr_delay} minutes. Your driver has been notified."
            else:
                message = "Flight is in the air and on schedule. Your driver will be ready."
        elif status == "Cancelled":
            message = "This flight has been cancelled. Please contact us to reschedule."
        elif status == "Diverted":
            message = "This flight has been diverted. Please contact us for assistance."
        else:
            if arr_delay and int(arr_delay) > 0:
                message = f"Flight delayed by {arr_delay} minutes. We're monitoring and will adjust pickup time."
            else:
                message = "We're monitoring this flight. Your driver will be notified of any changes."
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Flight {fn}: {status} - Arriving {arr_code} at {format_time(arr_actual)}")
        
        return {
            "flightNumber": fn,
            "airline": flight.get("airline", {}).get("name", ""),
            "status": status,
            "departure": {
                "code": dep_code,
                "airport": dep_airport,
                "time": format_time(dep_actual or dep_scheduled),
                "scheduledTime": format_time(dep_scheduled),
                "date": format_date(dep_scheduled),
                "delay": f"+{dep_delay} min" if dep_delay and int(dep_delay) > 0 else None
            },
            "arrival": {
                "code": arr_code,
                "airport": arr_airport,
                "time": format_time(arr_actual or arr_estimated),
                "scheduledTime": format_time(arr_scheduled),
                "date": format_date(arr_scheduled),
                "delay": f"+{arr_delay} min" if arr_delay and int(arr_delay) > 0 else None
            },
            "tracked": True,
            "message": message,
            "live": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Flight tracking error: {str(e)}")
        # Fallback to mock on error
        return await _get_mock_flight_data(fn)


async def _get_mock_flight_data(fn: str):
    """Fallback mock data when API is unavailable"""
    import random
    from datetime import datetime, timedelta
    import pytz
    
    nz_tz = pytz.timezone('Pacific/Auckland')
    now = datetime.now(nz_tz)
    
    statuses = ['On Time', 'On Time', 'On Time', 'Delayed', 'Landed']
    status = random.choice(statuses)
    
    delay_minutes = 0
    if status == 'Delayed':
        delay_minutes = random.choice([15, 30, 45, 60])
    
    airports = {
        'AKL': 'Auckland Airport', 'SYD': 'Sydney Airport',
        'MEL': 'Melbourne Airport', 'LAX': 'Los Angeles Airport'
    }
    
    dep_code = random.choice(['SYD', 'MEL', 'LAX'])
    arr_code = 'AKL'
    
    scheduled_arrival = now + timedelta(hours=random.randint(1, 6))
    actual_arrival = scheduled_arrival + timedelta(minutes=delay_minutes)
    departure_time = scheduled_arrival - timedelta(hours=random.randint(2, 14))
    
    return {
        "flightNumber": fn,
        "status": status,
        "departure": {
            "code": dep_code,
            "airport": airports.get(dep_code, dep_code),
            "time": departure_time.strftime("%H:%M"),
            "date": departure_time.strftime("%d %b")
        },
        "arrival": {
            "code": arr_code,
            "airport": airports.get(arr_code, arr_code),
            "time": actual_arrival.strftime("%H:%M"),
            "scheduledTime": scheduled_arrival.strftime("%H:%M"),
            "date": actual_arrival.strftime("%d %b"),
            "delay": f"+{delay_minutes} min" if delay_minutes > 0 else None
        },
        "tracked": True,
        "message": "We're monitoring this flight." if status != 'Landed' else "Flight has landed!",
        "live": False
    }


# ============================================
# AI EMAIL AUTO-RESPONDER
# ============================================

@api_router.get("/email/incoming")
async def verify_email_webhook():
    """GET endpoint for Mailgun webhook verification"""
    return {"status": "ok", "message": "BookaRide email webhook is active"}

@api_router.post("/email/incoming")
async def handle_incoming_email(request: Request):
    """
    Webhook endpoint for Mailgun incoming emails.
    Automatically generates AI response and sends it back.
    """
    try:
        # Parse the incoming email from Mailgun webhook
        form_data = await request.form()
        
        sender = form_data.get('sender', '')
        from_email = form_data.get('from', sender)
        subject = form_data.get('subject', 'No Subject')
        body_plain = form_data.get('body-plain', '')
        body_html = form_data.get('body-html', '')
        recipient = form_data.get('recipient', '')
        
        # Extract email address from "Name <email>" format
        import re
        email_match = re.search(r'[\w\.-]+@[\w\.-]+', from_email)
        reply_to_email = email_match.group(0) if email_match else from_email
        
        # Extract sender name
        name_match = re.match(r'^([^<]+)', from_email)
        sender_name = name_match.group(1).strip() if name_match else "there"
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ Incoming email from: {reply_to_email}, Subject: {subject}")
        
        # Don't reply to our own emails or no-reply addresses
        if 'bookaride' in reply_to_email.lower() or 'noreply' in reply_to_email.lower() or 'no-reply' in reply_to_email.lower():
            logger.info("Skipping auto-reply to system/no-reply email")
            return {"status": "skipped", "reason": "system email"}
        
        # Use the plain text body, or extract from HTML if not available
        email_content = body_plain or body_html
        if not email_content:
            logger.warning("Empty email body received")
            return {"status": "skipped", "reason": "empty body"}
        
        # Generate AI response
        from emergentintegrations.llm.openai import LlmChat, UserMessage
        
        email_system_prompt = """You are an AI email assistant for BookaRide NZ, a premium airport transfer service in Auckland, New Zealand.

You are responding to customer emails automatically. Be warm, professional, and helpful.

KEY INFORMATION ABOUT BOOKARIDE:
- Airport shuttles to/from Auckland Airport, Hamilton Airport, and Whangarei
- Services: Airport transfers, Hobbiton tours, Cruise terminal transfers, Wine tours
- Payment: Credit/Debit cards, Afterpay (pay in 4 instalments)
- Meet & Greet service available (driver with name sign at arrivals)
- Child seats available on request
- 24/7 service

HOW OUR PRICING WORKS (IMPORTANT - explain this to customers):
- We use Google Maps to calculate the EXACT distance from pickup to dropoff
- Pricing is based on a per-kilometer rate
- Every address in Auckland has a DIFFERENT price because it's calculated point-to-point
- This means pricing is very precise and accurate - no estimates or guesswork
- To get your exact price, you MUST enter your pickup address and dropoff address on our website
- The price calculator is LIVE - you see the exact price instantly when you enter both addresses
- No surge pricing like Uber - our rates are fixed and transparent

EXAMPLE PRICE RANGES (but always direct them to get exact quote):
- Auckland CBD to Airport: ~$65-85
- North Shore to Airport: ~$75-95
- Hibiscus Coast (Orewa, Whangaparaoa) to Airport: ~$90-120
- Hamilton to Airport: ~$180-220

YOUR RESPONSE GUIDELINES:
1. Keep responses concise but helpful (3-5 paragraphs max)
2. ALWAYS explain that we need their exact pickup and dropoff addresses to give an accurate price
3. Explain that our pricing uses Google Maps and is calculated per kilometer - very precise
4. Direct them to bookaride.co.nz/book-now where they can enter addresses and get instant pricing
5. If they're asking about a booking, tell them to include their booking reference
6. Be friendly and professional
7. Sign off as "BookaRide Team"
8. DO NOT give specific prices - explain WHY you can't (every address is different) and direct to website
9. If they have a complaint or complex issue, assure them a team member will follow up

FORMAT:
- Start with "Hi [Name]," or "Hi there," if name unknown
- Keep paragraphs short
- End with a call to action (enter your addresses at bookaride.co.nz/book-now for instant pricing)
- Sign: "Best regards,\nBookaRide Team"
"""
        
        llm = LlmChat(
            api_key="sk-emergent-1221fFe2cB790B632B",
            session_id=str(uuid.uuid4()),
            system_message=email_system_prompt
        )
        
        user_prompt = f"""Please write a helpful email response to this customer inquiry.

FROM: {sender_name}
SUBJECT: {subject}
MESSAGE:
{email_content[:2000]}

Write a professional, helpful response:"""
        
        user_msg = UserMessage(text=user_prompt)
        ai_response = await llm.send_message(user_msg)
        
        # Send the AI-generated response via Mailgun
        mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
        mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
        
        if not mailgun_api_key or not mailgun_domain:
            logger.error("Mailgun not configured for auto-reply")
            return {"status": "error", "reason": "email service not configured"}
        
        # Prepare the reply
        reply_subject = f"Re: {subject}" if not subject.startswith('Re:') else subject
        
        # Create HTML version
        html_response = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1a1a1a, #2d2d2d); padding: 20px; text-align: center;">
                <h1 style="color: #D4AF37; margin: 0;">BookaRide NZ</h1>
                <p style="color: #888; margin: 5px 0 0 0;">Airport Transfers & Tours</p>
            </div>
            <div style="padding: 30px; background: #fff;">
                {ai_response.replace(chr(10), '<br>')}
            </div>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                <p><strong>Book Online:</strong> <a href="https://bookaride.co.nz/book-now" style="color: #D4AF37;">bookaride.co.nz/book-now</a></p>
                <p>Get instant pricing - just enter your pickup and dropoff!</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
                <p style="font-size: 10px; color: #999;">
                    This is an automated response. For complex inquiries, our team will follow up within 24 hours.
                </p>
            </div>
        </div>
        """
        
        # Send via Mailgun
        response = requests.post(
            f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
            auth=("api", mailgun_api_key),
            data={
                "from": f"BookaRide NZ <bookings@{mailgun_domain}>",
                "to": reply_to_email,
                "subject": reply_subject,
                "text": ai_response,
                "html": html_response,
                "h:Reply-To": "info@bookaride.co.nz"
            }
        )
        
        if response.status_code == 200:
            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ AI auto-reply sent to {reply_to_email}")
            
            # Store the email interaction for admin review
            await db.email_logs.insert_one({
                "id": str(uuid.uuid4()),
                "from": reply_to_email,
                "sender_name": sender_name,
                "subject": subject,
                "original_message": email_content[:5000],
                "ai_response": ai_response,
                "status": "sent",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            return {"status": "success", "message": "AI response sent"}
        else:
            logger.error(f"Failed to send auto-reply: {response.text}")
            return {"status": "error", "reason": response.text}
        
    except Exception as e:
        logger.error(f"Email auto-responder error: {str(e)}")
        return {"status": "error", "reason": str(e)}


@api_router.get("/admin/email-logs")
async def get_email_logs(current_admin: dict = Depends(get_current_admin), limit: int = 50):
    """Get recent AI email auto-responses for admin review"""
    try:
        logs = await db.email_logs.find(
            {}, 
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return {"logs": logs, "count": len(logs)}
    except Exception as e:
        logger.error(f"Error fetching email logs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ABANDONED BOOKING RECOVERY
# ============================================

class AbandonedBookingRequest(BaseModel):
    email: str
    name: Optional[str] = None
    pickup: Optional[str] = None
    dropoff: Optional[str] = None
    date: Optional[str] = None
    price: Optional[float] = None

@api_router.post("/booking/abandoned")
async def save_abandoned_booking(request: AbandonedBookingRequest):
    """Save partial booking data for recovery email"""
    try:
        # Check if we already have a recent abandoned booking for this email
        existing = await db.abandoned_bookings.find_one({
            "email": request.email,
            "recovered": False
        })
        
        abandoned_data = {
            "email": request.email,
            "name": request.name,
            "pickup": request.pickup,
            "dropoff": request.dropoff,
            "date": request.date,
            "price": request.price,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "recovered": False,
            "email_sent": False
        }
        
        if existing:
            # Update existing record
            await db.abandoned_bookings.update_one(
                {"email": request.email, "recovered": False},
                {"$set": abandoned_data}
            )
        else:
            # Create new record
            abandoned_data["id"] = str(uuid.uuid4())
            await db.abandoned_bookings.insert_one(abandoned_data)
        
        logger.info(f"Saved abandoned booking for {request.email}")
        return {"status": "saved"}
        
    except Exception as e:
        logger.error(f"Error saving abandoned booking: {str(e)}")
        return {"status": "error", "message": str(e)}


async def send_abandoned_booking_emails():
    """Background task to send recovery emails for abandoned bookings"""
    try:
        # Find abandoned bookings from 30 mins - 24 hours ago that haven't been emailed
        from datetime import timedelta
        
        now = datetime.now(timezone.utc)
        min_age = now - timedelta(hours=24)
        max_age = now - timedelta(minutes=30)
        
        abandoned = await db.abandoned_bookings.find({
            "recovered": False,
            "email_sent": False,
            "created_at": {
                "$gte": min_age.isoformat(),
                "$lte": max_age.isoformat()
            }
        }, {"_id": 0}).to_list(50)
        
        mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
        mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
        
        if not mailgun_api_key or not mailgun_domain:
            return
        
        for booking in abandoned:
            try:
                email = booking.get('email')
                name = booking.get('name', 'there')
                pickup = booking.get('pickup', 'your location')
                dropoff = booking.get('dropoff', 'your destination')
                price = booking.get('price')
                
                subject = "Complete Your BookaRide Booking ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"
                
                price_text = f"Your quote was ${price:.2f}" if price else "Get your instant quote"
                
                html_content = f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #1a1a1a, #2d2d2d); padding: 30px; text-align: center;">
                        <h1 style="color: #D4AF37; margin: 0;">BookaRide NZ</h1>
                    </div>
                    <div style="padding: 30px; background: #fff;">
                        <h2 style="color: #333;">Hi {name},</h2>
                        <p style="color: #666; font-size: 16px;">
                            We noticed you started booking an airport transfer but didn't complete it. 
                            No worries - your details are still saved!
                        </p>
                        <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <p style="margin: 5px 0; color: #333;"><strong>From:</strong> {pickup}</p>
                            <p style="margin: 5px 0; color: #333;"><strong>To:</strong> {dropoff}</p>
                            <p style="margin: 10px 0; color: #D4AF37; font-size: 18px;"><strong>{price_text}</strong></p>
                        </div>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://bookaride.co.nz/book-now" 
                               style="background: #D4AF37; color: #000; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                Complete Your Booking ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢
                            </a>
                        </div>
                        <p style="color: #999; font-size: 14px; text-align: center;">
                            Questions? Just reply to this email or use our 24/7 AI chat on the website.
                        </p>
                    </div>
                    <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                        <p>ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© BookaRide NZ | Auckland Airport Transfers</p>
                    </div>
                </div>
                """
                
                response = requests.post(
                    f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
                    auth=("api", mailgun_api_key),
                    data={
                        "from": f"BookaRide NZ <bookings@{mailgun_domain}>",
                        "to": email,
                        "subject": subject,
                        "html": html_content
                    }
                )
                
                if response.status_code == 200:
                    await db.abandoned_bookings.update_one(
                        {"email": email, "recovered": False},
                        {"$set": {"email_sent": True, "email_sent_at": datetime.now(timezone.utc).isoformat()}}
                    )
                    logger.info(f"Sent abandoned booking recovery email to {email}")
                    
            except Exception as e:
                logger.error(f"Error sending recovery email: {str(e)}")
                
    except Exception as e:
        logger.error(f"Error in abandoned booking task: {str(e)}")


# ============================================
# AI CHATBOT ENDPOINT
# ============================================

class ChatbotMessageRequest(BaseModel):
    message: str
    conversationHistory: Optional[List[dict]] = []

@api_router.post("/chatbot/message")
async def chatbot_message(request: ChatbotMessageRequest):
    """AI-powered chatbot for booking assistance"""
    try:
        from emergentintegrations.llm.openai import LlmChat, UserMessage
        
        # Build context from conversation history
        history_context = ""
        if request.conversationHistory:
            for msg in request.conversationHistory[-6:]:  # Last 6 messages for context
                role = "Customer" if msg.get('role') == 'user' else "Assistant"
                history_context += f"{role}: {msg.get('content', '')}\n"
        
        # System prompt for the booking assistant
        system_prompt = """You are a friendly and helpful booking assistant for BookaRide NZ, a premium airport transfer service in Auckland, New Zealand.

KEY INFORMATION:
- We offer airport shuttles to/from Auckland Airport, Hamilton Airport, and Whangarei
- Popular services: Airport transfers, Hobbiton tours, Cruise terminal transfers, Wine tours
- Payment options: Credit/Debit cards, Afterpay (pay in 4 instalments)
- We offer Meet & Greet service where drivers hold a name sign at arrivals
- Child seats available on request
- 24/7 service available
- IMPORTANT: All bookings are made online at bookaride.co.nz/book-now with LIVE PRICING

HOW OUR PRICING WORKS (explain this when asked about prices):
- We use Google Maps to calculate the EXACT distance from pickup to dropoff
- Pricing is based on a per-kilometer rate
- Every address in Auckland has a DIFFERENT price - it's calculated point-to-point
- This means our pricing is very precise and accurate - no guesswork!
- To get an exact price, they need to enter their pickup and dropoff addresses on our website
- The price calculator is LIVE - they see the exact price instantly
- No surge pricing like Uber - our rates are fixed and fair

EXAMPLE PRICE RANGES (but always direct them to enter addresses for exact price):
- Auckland CBD to Airport: ~$65-85
- North Shore to Airport: ~$75-95
- Hibiscus Coast (Orewa, Whangaparaoa) to Airport: ~$90-120
- Hamilton to Airport: ~$180-220

YOUR STYLE:
- Be warm, friendly and professional
- Keep responses concise (2-3 sentences when possible)
- Use emojis sparingly but naturally ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â
- ALWAYS explain we need their exact addresses to give a precise price (because we use Google Maps per-kilometer pricing)
- Direct them to bookaride.co.nz/book-now - they just enter pickup & dropoff to see the exact price instantly
- For questions you can't answer, suggest they email info@bookaride.co.nz

IMPORTANT: 
- Never give phone numbers - we don't take phone bookings
- Always direct to the online booking form for quotes and bookings
- Explain WHY we can't give exact prices without addresses (every house is different distance!)
- The booking form has a LIVE PRICE CALCULATOR - they see the price instantly when they enter addresses"""

        llm = LlmChat(
            api_key="sk-emergent-1221fFe2cB790B632B",
            session_id=str(uuid.uuid4()),
            system_message=system_prompt
        )
        
        # Build the user message with context
        full_message = f"""Previous conversation:
{history_context}

Customer's new message: {request.message}

Respond helpfully and naturally as the BookaRide assistant:"""
        
        user_msg = UserMessage(text=full_message)
        response = await llm.send_message(user_msg)
        
        return {"response": response.strip()}
        
    except Exception as e:
        logger.error(f"Chatbot error: {str(e)}")
        # Fallback response
        return {
            "response": "I apologize, I'm having a brief technical issue. For immediate assistance, please call us at 0800 BOOK A RIDE or visit bookaride.co.nz/book-now to make a booking. We're here to help! ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"
        }


# Core reminder sending logic - used by all reminder triggers
async def send_daily_reminders_core(source: str = "unknown"):
    """
    Core logic for sending day-before reminders.
    Called by: startup check, APScheduler, cron endpoint, and interval check.
    
    IMPORTANT: Uses global lock to prevent race conditions and duplicate notifications.
    """
    global reminder_lock
    
    # Use lock to prevent multiple concurrent reminder runs
    if reminder_lock.locked():
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ [{source}] Reminder job already running, skipping to prevent duplicates")
        return {"success": True, "reminders_sent": 0, "skipped": 0, "source": source, "status": "skipped_locked"}
    
    async with reminder_lock:
        try:
            # Get NZ timezone for accurate date calculation
            nz_tz = pytz.timezone('Pacific/Auckland')
            nz_now = datetime.now(nz_tz)
            nz_today = nz_now.strftime('%Y-%m-%d')
            nz_tomorrow = (nz_now + timedelta(days=1)).strftime('%Y-%m-%d')
            
            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â [{source}] Checking reminders - NZ time: {nz_now.strftime('%Y-%m-%d %H:%M:%S')}, Tomorrow: {nz_tomorrow}")
            
            # Find all confirmed bookings for tomorrow that HAVEN'T been marked yet
            # Use atomic query to only get bookings that need reminders
            bookings = await db.bookings.find({
                "status": "confirmed",
                "date": nz_tomorrow,
                "reminderSentForDate": {"$ne": nz_tomorrow}  # Not already sent for tomorrow
            }, {"_id": 0}).to_list(100)
            
            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â [{source}] Found {len(bookings)} bookings needing reminders for {nz_tomorrow}")
            
            sent_count = 0
            skipped_count = 0
            
            for booking in bookings:
                booking_id = booking.get('id')
                booking_name = booking.get('name', 'Unknown')
                
                # ATOMIC: Mark as "in progress" BEFORE sending to prevent race conditions
                # Use findOneAndUpdate with condition to ensure we only process once
                update_result = await db.bookings.update_one(
                    {
                        "id": booking_id,
                        "reminderSentForDate": {"$ne": nz_tomorrow}  # Double-check it wasn't just marked
                    },
                    {"$set": {
                        "reminderSentForDate": nz_tomorrow,
                        "reminderInProgress": True,
                        "reminderStartedAt": datetime.now(nz_tz).isoformat()
                    }}
                )
                
                # If no document was updated, another process got there first
                if update_result.modified_count == 0:
                    skipped_count += 1
                    logger.debug(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Skipping {booking_name} - already being processed by another job")
                    continue
                
                # Now send the notifications
                email_sent = False
                sms_sent = False
                
                try:
                    # Send email reminder
                    if booking.get('email'):
                        email_sent = send_reminder_email(booking)
                        if email_sent:
                            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Reminder email sent to {booking.get('email')}")
                    
                    # Send SMS reminder
                    if booking.get('phone'):
                        sms_sent = send_reminder_sms(booking)
                        if sms_sent:
                            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± Reminder SMS sent to {booking.get('phone')}")
                    
                    # Update with completion status
                    await db.bookings.update_one(
                        {"id": booking_id},
                        {"$set": {
                            "reminderSentAt": datetime.now(nz_tz).isoformat(),
                            "reminderInProgress": False,
                            "reminderCompleted": True,
                            "reminderSource": source,
                            "reminderEmailSent": email_sent,
                            "reminderSmsSent": sms_sent
                        }}
                    )
                    
                    if email_sent or sms_sent:
                        sent_count += 1
                    else:
                        skipped_count += 1
                        
                except Exception as send_error:
                    logger.error(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Error sending reminder to {booking_name}: {str(send_error)}")
                    # Mark as failed but keep the date so we don't retry indefinitely
                    await db.bookings.update_one(
                        {"id": booking_id},
                        {"$set": {
                            "reminderInProgress": False,
                            "reminderFailed": True,
                            "reminderError": str(send_error)
                        }}
                    )
                    skipped_count += 1
            
            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ [{source}] Reminders complete: {sent_count} sent, {skipped_count} skipped")
            return {"success": True, "reminders_sent": sent_count, "skipped": skipped_count, "source": source}
            
        except Exception as e:
            logger.error(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ [{source}] Reminder error: {str(e)}")
            raise


# Auto-run reminders endpoint (can be called by external cron service)
@api_router.get("/cron/send-reminders")
async def cron_send_reminders(api_key: str = None):
    """Endpoint for external cron service to trigger reminders (requires API key)"""
    try:
        expected_key = os.environ.get('CRON_API_KEY', 'bookaride-cron-secret-2024')
        
        if api_key != expected_key:
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        result = await send_daily_reminders_core(source="cron_endpoint")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cron reminder error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def send_booking_notification_to_admin(booking: dict):
    """Automatically send booking notification to admin email"""
    try:
        admin_email = os.environ.get('ADMIN_EMAIL', 'bookings@bookaride.co.nz')
        mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
        mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
        sender_email = os.environ.get('SENDER_EMAIL', 'noreply@mg.bookaride.co.nz')
        
        if not mailgun_api_key or not mailgun_domain:
            logger.warning("Mailgun not configured - cannot send admin notification")
            return False
        
        # Format booking details
        total_price = booking.get('totalPrice', 0)
        formatted_date = format_date_ddmmyyyy(booking.get('date', 'N/A'))
        booking_ref = get_booking_reference(booking)
        full_booking_id = get_full_booking_reference(booking)
        
        # Create simplified email for quick notification
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0;">BookaRide.co.nz</h1>
                    <p style="margin: 5px 0; font-size: 14px; color: rgba(255,255,255,0.9);">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â New Booking Received</p>
                </div>
                
                <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e8e4d9; border-top: none;">
                    <div style="background-color: #fff8e6; padding: 15px; border-radius: 8px; border-left: 4px solid #D4AF37; margin-bottom: 20px;">
                        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #333;">New booking from {booking.get('name', 'Customer')}</p>
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Booking Reference: {booking_ref}</p>
                        <p style="margin: 5px 0 0 0; font-size: 11px; color: #999;">Full ID: {full_booking_id}</p>
                    </div>
                    
                    <div style="background-color: #faf8f3; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4AF37;">
                        <h3 style="margin-top: 0; color: #333;">Quick Details</h3>
                        <p style="margin: 5px 0;"><strong>Customer:</strong> {booking.get('name', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Phone:</strong> {booking.get('phone', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> {booking.get('email', 'N/A')}</p>
                        <hr style="border: 0; border-top: 1px solid #e8e4d9; margin: 15px 0;">
                        <p style="margin: 5px 0;"><strong>Service:</strong> {booking.get('serviceType', 'N/A').replace('-', ' ').title()}</p>
                        <p style="margin: 5px 0;"><strong>Date:</strong> {formatted_date} at {format_time_ampm(booking.get('time', 'N/A'))}</p>
                        <p style="margin: 5px 0;"><strong>Passengers:</strong> {booking.get('passengers', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Pickup:</strong> {booking.get('pickupAddress', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Drop-off:</strong> {booking.get('dropoffAddress', 'N/A')}</p>
                        {'<hr style="border: 0; border-top: 1px solid #e8e4d9; margin: 15px 0;"><div style="background-color: #e3f2fd; padding: 10px; border-radius: 5px; border-left: 4px solid #2196F3;"><p style="margin: 0; font-weight: bold; color: #1565C0;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â FLIGHT INFORMATION</p><p style="margin: 5px 0 0 0;"><strong>Flight Number:</strong> ' + (booking.get('flightNumber') or booking.get('departureFlightNumber') or booking.get('arrivalFlightNumber') or 'N/A') + '</p></div>' if (booking.get('flightNumber') or booking.get('departureFlightNumber') or booking.get('arrivalFlightNumber')) else ''}
                        {'<hr style="border: 0; border-top: 1px solid #e8e4d9; margin: 15px 0;"><div style="background-color: #f3e5f5; padding: 10px; border-radius: 5px; border-left: 4px solid #9C27B0;"><p style="margin: 0; font-weight: bold; color: #7B1FA2;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ RETURN TRIP BOOKED</p><p style="margin: 5px 0 0 0;"><strong>Return Date:</strong> ' + format_date_ddmmyyyy(booking.get('returnDate', '')) + ' at ' + format_time_ampm(booking.get('returnTime', '')) + '</p><p style="margin: 5px 0 0 0;"><strong>Return Flight:</strong> ' + (booking.get('returnFlightNumber') or booking.get('returnDepartureFlightNumber') or 'NOT PROVIDED - FOLLOW UP REQUIRED') + '</p></div>' if booking.get('bookReturn') or booking.get('returnDate') else ''}
                        <hr style="border: 0; border-top: 2px solid #D4AF37; margin: 15px 0;">
                        <p style="margin: 5px 0; font-size: 18px;"><strong>Total:</strong> <span style="color: #D4AF37;">${total_price:.2f} NZD</span></p>
                        <p style="margin: 5px 0;"><strong>Payment Status:</strong> {booking.get('payment_status', 'N/A')}</p>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background-color: #fff8e6; border-radius: 8px; border-left: 4px solid #D4AF37;">
                        <p style="margin: 0; font-weight: bold; color: #333;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ Action Required:</p>
                        <p style="margin: 5px 0 0 0; font-size: 14px;">Review and assign a driver in your <a href="https://bookaride.co.nz/admin/login" style="color: #D4AF37; text-decoration: none; font-weight: bold;">Admin Dashboard</a></p>
                    </div>
                </div>
                
                <div style="background: #faf8f3; color: #666; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; border: 1px solid #e8e4d9; border-top: none;">
                    <p style="margin: 0;"><span style="color: #D4AF37; font-weight: bold;">BookaRide NZ</span> Admin System</p>
                    <p style="margin: 5px 0;">Automatic Booking Notification</p>
                </div>
            </body>
        </html>
        """
        
        # Send email via Mailgun API
        response = requests.post(
            f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
            auth=("api", mailgun_api_key),
            data={
                "from": f"BookaRide System <{sender_email}>",
                "to": admin_email,
                "subject": f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â New Booking - {booking.get('name', 'Customer')} - {formatted_date} - Ref: {booking_ref}",
                "html": html_content
            }
        )
        
        if response.status_code == 200:
            logger.info(f"Auto-notification sent to admin: {admin_email} for booking: {booking_ref}")
            email_sent = True
        else:
            logger.error(f"Failed to send admin notification: {response.status_code} - {response.text}")
            email_sent = False
            
    except Exception as e:
        logger.error(f"Error sending admin notification: {str(e)}")
        email_sent = False
    
    # ALSO send SMS to admin for ALL new bookings
    sms_sent = False
    try:
        admin_phone = os.environ.get('ADMIN_PHONE', '+64212345678')
        twilio_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        twilio_token = os.environ.get('TWILIO_AUTH_TOKEN')
        twilio_from = os.environ.get('TWILIO_PHONE_NUMBER')
        
        if twilio_sid and twilio_token and twilio_from:
            client = Client(twilio_sid, twilio_token)
            booking_ref = get_booking_reference(booking)
            formatted_date = format_date_ddmmyyyy(booking.get('date', 'N/A'))
            formatted_time = format_time_ampm(booking.get('time', 'N/A'))
            
            sms_body = f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â NEW BookaRide: {booking.get('name')} booked for {formatted_date} {formatted_time}. Ref: #{booking_ref}. Check admin dashboard."
            
            client.messages.create(
                body=sms_body,
                from_=twilio_from,
                to=admin_phone
            )
            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Admin SMS sent for new booking: #{booking_ref}")
            sms_sent = True
        else:
            logger.warning("Twilio not configured - cannot send admin SMS")
    except Exception as sms_error:
        logger.error(f"Failed to send admin SMS: {str(sms_error)}")
    
    return email_sent or sms_sent


async def send_urgent_approval_notification(booking: dict):
    """Send urgent notification for bookings requiring manual approval (within 24 hours)"""
    try:
        admin_email = os.environ.get('ADMIN_EMAIL', 'bookings@bookaride.co.nz')
        mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
        mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
        sender_email = os.environ.get('SENDER_EMAIL', 'noreply@mg.bookaride.co.nz')
        
        if not mailgun_api_key or not mailgun_domain:
            logger.warning("Mailgun not configured - cannot send urgent approval notification")
            return False
        
        # Format booking details
        total_price = booking.get('totalPrice', 0)
        formatted_date = format_date_ddmmyyyy(booking.get('date', 'N/A'))
        booking_ref = get_booking_reference(booking)
        full_booking_id = get_full_booking_reference(booking)
        
        # Create URGENT email for bookings within 24 hours
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ URGENT APPROVAL REQUIRED</h1>
                    <p style="margin: 5px 0; font-size: 16px; color: rgba(255,255,255,0.9);">Last-Minute Booking - Pickup Within 24 Hours!</p>
                </div>
                
                <div style="padding: 20px; background-color: #ffffff; border: 1px solid #fca5a5; border-top: none;">
                    <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #DC2626; margin-bottom: 20px;">
                        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #991B1B;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â This booking requires your manual approval</p>
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #7F1D1D;">Customer: {booking.get('name', 'Customer')} | Ref: {booking_ref}</p>
                        <p style="margin: 5px 0 0 0; font-size: 11px; color: #999;">Full ID: {full_booking_id}</p>
                    </div>
                    
                    <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
                        <h3 style="margin-top: 0; color: #c2410c;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Pickup Details</h3>
                        <p style="margin: 5px 0; font-size: 16px;"><strong>Date:</strong> <span style="color: #DC2626; font-weight: bold;">{formatted_date}</span></p>
                        <p style="margin: 5px 0; font-size: 16px;"><strong>Time:</strong> <span style="color: #DC2626; font-weight: bold;">{booking.get('time', 'N/A')}</span></p>
                        <hr style="border: 0; border-top: 1px solid #fed7aa; margin: 15px 0;">
                        <p style="margin: 5px 0;"><strong>Customer:</strong> {booking.get('name', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Phone:</strong> <a href="tel:{booking.get('phone', '')}" style="color: #c2410c;">{booking.get('phone', 'N/A')}</a></p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> {booking.get('email', 'N/A')}</p>
                        <hr style="border: 0; border-top: 1px solid #fed7aa; margin: 15px 0;">
                        <p style="margin: 5px 0;"><strong>Service:</strong> {booking.get('serviceType', 'N/A').replace('-', ' ').title()}</p>
                        <p style="margin: 5px 0;"><strong>Passengers:</strong> {booking.get('passengers', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Pickup:</strong> {booking.get('pickupAddress', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Drop-off:</strong> {booking.get('dropoffAddress', 'N/A')}</p>
                        <hr style="border: 0; border-top: 2px solid #f97316; margin: 15px 0;">
                        <p style="margin: 5px 0; font-size: 18px;"><strong>Total:</strong> <span style="color: #c2410c;">${total_price:.2f} NZD</span></p>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 20px; background-color: #fef2f2; border-radius: 8px; border: 2px solid #DC2626; text-align: center;">
                        <p style="margin: 0; font-weight: bold; font-size: 16px; color: #991B1B;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ACTION REQUIRED</p>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #7F1D1D;">Approve or reject this booking:</p>
                        
                        <div style="margin-top: 20px;">
                            <a href="https://bookaride.co.nz/api/booking/quick-approve/{booking.get('id')}?action=approve" style="display: inline-block; margin: 5px; padding: 15px 40px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ APPROVE</a>
                            <a href="https://bookaride.co.nz/api/booking/quick-approve/{booking.get('id')}?action=reject" style="display: inline-block; margin: 5px; padding: 15px 40px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ REJECT</a>
                        </div>
                        
                        <p style="margin: 15px 0 0 0; font-size: 12px; color: #7F1D1D;">Or open the admin dashboard for more options:</p>
                        <a href="https://bookaride.co.nz/admin/dashboard" style="display: inline-block; margin-top: 10px; padding: 10px 25px; background-color: #6b7280; color: white; text-decoration: none; border-radius: 8px; font-size: 14px;">Open Admin Dashboard</a>
                    </div>
                </div>
                
                <div style="background: #fef2f2; color: #7F1D1D; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; border: 1px solid #fca5a5; border-top: none;">
                    <p style="margin: 0;"><span style="color: #DC2626; font-weight: bold;">BookaRide NZ</span> Urgent Approval System</p>
                    <p style="margin: 5px 0;">This booking is pending until you approve it</p>
                </div>
            </body>
        </html>
        """
        
        # Send email via Mailgun API
        response = requests.post(
            f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
            auth=("api", mailgun_api_key),
            data={
                "from": f"BookaRide URGENT <{sender_email}>",
                "to": admin_email,
                "subject": f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ URGENT APPROVAL - {booking.get('name', 'Customer')} - {formatted_date} {booking.get('time', '')} - Ref: {booking_ref}",
                "html": html_content
            }
        )
        
        if response.status_code == 200:
            logger.info(f"Urgent approval notification sent to admin: {admin_email} for booking: {booking_ref}")
            email_sent = True
        else:
            logger.error(f"Failed to send urgent approval notification: {response.status_code} - {response.text}")
            email_sent = False
            
    except Exception as e:
        logger.error(f"Error sending urgent approval notification: {str(e)}")
        email_sent = False

    # Also send SMS to admin for URGENT bookings (within 24 hours)
    # Admin can reply YES to approve or NO to decline
    sms_sent = False
    try:
        admin_phone = os.environ.get('ADMIN_PHONE', '+6421743321')
        twilio_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        twilio_token = os.environ.get('TWILIO_AUTH_TOKEN')
        twilio_from = os.environ.get('TWILIO_PHONE_NUMBER')
        
        if twilio_sid and twilio_token and twilio_from:
            client = Client(twilio_sid, twilio_token)
            booking_ref = get_booking_reference(booking)
            formatted_date = format_date_ddmmyyyy(booking.get('date', 'N/A'))
            formatted_time = format_time_ampm(booking.get('time', 'N/A'))
            
            # Truncate addresses for SMS
            pickup = booking.get('pickupAddress', 'N/A')
            dropoff = booking.get('dropoffAddress', 'N/A')
            pickup_short = pickup[:50] + '...' if len(pickup) > 50 else pickup
            dropoff_short = dropoff[:50] + '...' if len(dropoff) > 50 else dropoff
            
            sms_body = f"""ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ URGENT BOOKING #{booking_ref}

Customer: {booking.get('name')}
Phone: {booking.get('phone')}
Date: {formatted_date}
Time: {formatted_time}
Pickup: {pickup_short}
Dropoff: {dropoff_short}
Price: ${booking.get('totalPrice', 0):.2f}

ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Reply YES to APPROVE or NO to DECLINE"""
            
            message = client.messages.create(
                body=sms_body,
                from_=twilio_from,
                to=admin_phone
            )
            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Urgent SMS sent to admin {admin_phone} for booking: #{booking_ref} - SID: {message.sid}")
            
            # Store booking ID in database for SMS reply matching (using sync client)
            try:
                from pymongo import MongoClient
                sync_client = MongoClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
                sync_db = sync_client[os.environ.get('DB_NAME', 'test_database')]
                sync_db.pending_approvals.update_one(
                    {"admin_phone": admin_phone},
                    {"$set": {
                        "booking_id": booking.get('id'),
                        "booking_ref": booking_ref,
                        "customer_name": booking.get('name'),
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }},
                    upsert=True
                )
                sync_client.close()
                logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Stored pending approval for booking #{booking_ref}")
            except Exception as db_error:
                logger.error(f"Failed to store pending approval: {db_error}")
            
            sms_sent = True
        else:
            logger.warning("Twilio not configured - cannot send urgent SMS")
    except Exception as sms_error:
        logger.error(f"Failed to send urgent SMS: {str(sms_error)}")
    
    return email_sent or sms_sent


async def send_driver_notification(booking: dict, driver: dict, trip_type: str = "OUTBOUND"):
    """Send email and SMS notification to driver about new booking assignment
    
    Args:
        booking: Booking details dict
        driver: Driver details dict
        trip_type: "OUTBOUND" or "RETURN" - which leg of the trip
    """
    try:
        # Log incoming data for debugging
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ send_driver_notification called for {trip_type} trip")
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ Booking data: name={booking.get('name')}, phone={booking.get('phone')}, pickup={booking.get('pickupAddress')}, date={booking.get('date')}, time={booking.get('time')}")
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ Driver data: name={driver.get('name')}, email={driver.get('email')}")
        
        # Format date and get references
        formatted_date = format_date_ddmmyyyy(booking.get('date', 'N/A'))
        formatted_time = format_time_ampm(booking.get('time', 'N/A'))
        booking_ref = get_booking_reference(booking)
        full_booking_id = get_full_booking_reference(booking)
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ Formatted: date={formatted_date}, time={formatted_time}, ref={booking_ref}")
        
        # Calculate DRIVER PAYOUT
        # Since Stripe fees are now added to the customer's total, drivers get the full subtotal
        # - For return bookings: outbound driver gets half, return driver gets half
        # - For all payments: Driver gets the subtotal (price before Stripe fee was added to customer)
        
        # Check for manual override first
        if booking.get('driver_payout_override') is not None:
            driver_payout = float(booking.get('driver_payout_override'))
            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ Using manual driver payout override: ${driver_payout:.2f}")
        else:
            pricing = booking.get('pricing', {}) if isinstance(booking.get('pricing'), dict) else {}
            # Use subtotal if available (price before Stripe fee), otherwise use totalPrice
            # For older bookings without subtotal, calculate it by removing Stripe fee from total
            subtotal = pricing.get('subtotal')
            if subtotal is None:
                total_price = pricing.get('totalPrice', 0)
                # For legacy bookings, assume totalPrice includes Stripe fee, so calculate subtotal
                # Stripe fee formula: fee = subtotal * 0.029 + 0.30
                # So: total = subtotal + subtotal * 0.029 + 0.30 = subtotal * 1.029 + 0.30
                # Therefore: subtotal = (total - 0.30) / 1.029
                subtotal = (total_price - 0.30) / 1.029 if total_price > 0 else 0
            
            has_return = booking.get('bookReturn') or bool(booking.get('returnDate'))
            
            # Determine the price for THIS trip (outbound or return)
            if has_return:
                # For return bookings, split the subtotal between outbound and return
                # Use oneWayPrice if explicitly set, otherwise split evenly
                one_way_price = pricing.get('oneWayPrice')
                if one_way_price:
                    trip_price = one_way_price if trip_type == 'outbound' else (subtotal - one_way_price)
                else:
                    # Split evenly for return bookings without explicit oneWayPrice
                    trip_price = subtotal / 2
                logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ Return booking: {trip_type} trip price = ${trip_price:.2f} (subtotal ${subtotal:.2f})")
            else:
                # One-way booking - use full subtotal
                trip_price = subtotal
            
            # Driver gets the full trip price (Stripe fee is paid by customer on top)
            driver_payout = round(trip_price, 2)
            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ Driver gets full subtotal (customer pays Stripe fee separately)")
            
            # Round to 2 decimal places
            driver_payout = round(driver_payout, 2)
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ Driver Payout: ${driver_payout:.2f} for {trip_type} trip")
        
        # Send Email to Driver
        mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
        mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
        sender_email = os.environ.get('SENDER_EMAIL', 'noreply@bookaride.co.nz')
        
        if mailgun_api_key and mailgun_domain:
            # Build pickup addresses list
            pickup_addresses = [booking.get('pickupAddress', 'N/A')]
            additional_pickups = booking.get('pickupAddresses', [])
            if additional_pickups:
                pickup_addresses.extend([addr for addr in additional_pickups if addr and addr.strip()])
            
            pickup_html = ""
            if len(pickup_addresses) > 1:
                pickup_html = "<p><strong>Pickup Addresses:</strong></p><ol style='margin: 5px 0; padding-left: 20px;'>"
                for addr in pickup_addresses:
                    pickup_html += f"<li style='margin: 3px 0;'>{addr}</li>"
                pickup_html += "</ol>"
            else:
                pickup_html = f"<p><strong>Pickup:</strong> {pickup_addresses[0]}</p>"
            
            # Check for return trip
            return_html = ""
            if booking.get('bookReturn'):
                return_date = booking.get('returnDate', '')
                return_time = booking.get('returnTime', '')
                return_flight = booking.get('returnFlightNumber') or booking.get('returnDepartureFlightNumber') or ''
                if return_date:
                    formatted_return = format_date_ddmmyyyy(return_date)
                    formatted_return_time = format_time_ampm(return_time) if return_time else 'TBC'
                    return_html = f"""
                    <div style="background-color: #f3e5f5; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #9C27B0;">
                        <p style="margin: 0; font-weight: bold; color: #7B1FA2;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ RETURN TRIP DETAILS</p>
                        <p style="margin: 5px 0;"><strong>Return Date:</strong> {formatted_return}</p>
                        <p style="margin: 5px 0;"><strong>Return Time:</strong> {formatted_return_time}</p>
                        {'<p style="margin: 5px 0;"><strong>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Return Flight:</strong> ' + return_flight + '</p>' if return_flight else '<p style="margin: 5px 0; color: #d32f2f;"><strong>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Return Flight:</strong> NOT PROVIDED</p>'}
                        <p style="margin: 5px 0; font-size: 12px; color: #666;">Reverse route back to original pickup location(s)</p>
                    </div>
                    """
            
            html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Booking Assignment</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
            <td style="background-color: #D4AF37; color: #1a1a1a; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">BookaRide.co.nz</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 20px; background-color: #f5f5f5;">
                <h2 style="color: #1a1a1a; margin-top: 0;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ New Booking Assignment - {trip_type} TRIP</h2>
                <p style="margin: 10px 0;">Hi {driver.get('name', 'Driver')},</p>
                <p style="margin: 10px 0;">You have been assigned {'a new' if trip_type == 'OUTBOUND' else 'the RETURN leg of a'} booking. Please review the details below:</p>
                
                <table width="100%" cellpadding="15" cellspacing="0" style="background-color: white; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4AF37;">
                    <tr>
                        <td>
                            <p style="margin: 5px 0;"><strong>Booking Reference:</strong> {booking_ref}</p>
                            <p style="margin: 5px 0; font-size: 11px; color: #999;">Full ID: {full_booking_id}</p>
                            <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 15px 0;">
                            <p style="margin: 5px 0;"><strong>Customer Name:</strong> {booking.get('name', 'N/A')}</p>
                            <p style="margin: 5px 0;"><strong>Customer Phone:</strong> {booking.get('phone', 'N/A')}</p>
                            <p style="margin: 5px 0;"><strong>Customer Email:</strong> {booking.get('email', 'N/A')}</p>
                            <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 15px 0;">
                            <p style="margin: 5px 0;"><strong>Service Type:</strong> {booking.get('serviceType', 'N/A').replace('-', ' ').title()}</p>
                            {pickup_html}
                            <p style="margin: 5px 0;"><strong>Drop-off:</strong> {booking.get('dropoffAddress', 'N/A')}</p>
                            <p style="margin: 5px 0;"><strong>Date:</strong> {formatted_date}</p>
                            <p style="margin: 5px 0;"><strong>Time:</strong> {formatted_time}</p>
                            <p style="margin: 5px 0;"><strong>Passengers:</strong> {booking.get('passengers', 'N/A')}</p>
                            {'<div style="background-color: #e3f2fd; padding: 10px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #2196F3;"><p style="margin: 0; font-weight: bold; color: #1565C0;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â FLIGHT: ' + (booking.get('flightNumber') or booking.get('departureFlightNumber') or booking.get('arrivalFlightNumber') or 'N/A') + '</p></div>' if (booking.get('flightNumber') or booking.get('departureFlightNumber') or booking.get('arrivalFlightNumber')) else ''}
                            <hr style="border: 0; border-top: 2px solid #D4AF37; margin: 15px 0;">
                            <p style="margin: 5px 0; font-size: 18px;"><strong>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â° Your Payout: ${driver_payout:.2f} NZD</strong></p>
                        </td>
                    </tr>
                </table>
                {return_html}
                
                <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #fff3cd; border-radius: 8px; margin: 20px 0;">
                    <tr>
                        <td>
                            <p style="margin: 0;"><strong>Special Notes:</strong></p>
                            <p style="margin: 5px 0 0 0;">{booking.get('notes', 'None') or 'None'}</p>
                        </td>
                    </tr>
                </table>
                
                <p style="margin-top: 30px;">Please confirm receipt and contact the customer if you have any questions.</p>
                <p>Login to your <a href="https://bookaride.co.nz/driver/login" style="color: #D4AF37; text-decoration: underline; font-weight: bold;">Driver Portal</a> for more details.</p>
            </td>
        </tr>
        <tr>
            <td style="background-color: #f8f9fa; color: #6c757d; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #dee2e6;">
                <p style="margin: 0;">BookaRide NZ</p>
                <p style="margin: 5px 0;">bookaride.co.nz | +64 21 743 321</p>
            </td>
        </tr>
    </table>
</body>
</html>"""
            
            # Get flight number for text version
            flight_number = booking.get('flightNumber') or booking.get('departureFlightNumber') or booking.get('arrivalFlightNumber') or 'N/A'
            
            # Create plain text version for email clients that don't render HTML
            text_content = f"""BookaRide.co.nz - New Booking Assignment ({trip_type} TRIP)

Hi {driver.get('name', 'Driver')},

You have been assigned {'a new' if trip_type == 'OUTBOUND' else 'the RETURN leg of a'} booking. Please review the details below:

BOOKING DETAILS
===============
Booking Reference: {booking_ref}
Full ID: {full_booking_id}

Customer Name: {booking.get('name', 'N/A')}
Customer Phone: {booking.get('phone', 'N/A')}
Customer Email: {booking.get('email', 'N/A')}

Service Type: {booking.get('serviceType', 'N/A').replace('-', ' ').title()}
Pickup: {booking.get('pickupAddress', 'N/A')}
Drop-off: {booking.get('dropoffAddress', 'N/A')}
Date: {formatted_date}
Time: {formatted_time}
Passengers: {booking.get('passengers', 'N/A')}
FLIGHT: {flight_number}

Your Payout: ${driver_payout:.2f} NZD

Special Notes: {booking.get('notes', 'None') or 'None'}

Please confirm receipt and contact the customer if you have any questions.
Login to your Driver Portal: https://bookaride.co.nz/driver/login

---
BookaRide NZ
bookaride.co.nz | +64 21 743 321
"""
            
            response = requests.post(
                f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
                auth=("api", mailgun_api_key),
                data={
                    "from": f"BookaRide <{sender_email}>",
                    "to": driver.get('email'),
                    "subject": f"New Booking Assignment - Ref: {booking_ref} - {formatted_date}",
                    "text": text_content,
                    "html": html_content
                }
            )
            
            if response.status_code == 200:
                logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Driver notification email sent to {driver.get('email')}")
                logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ Mailgun response: {response.text}")
            else:
                logger.error(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Failed to send driver email: {response.status_code} - {response.text}")
        
        # Send SMS to Driver (separate try block so email failures don't block SMS)
        try:
            account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
            auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
            twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')
            
            if account_sid and auth_token and twilio_phone:
                driver_phone = format_nz_phone(driver.get('phone', ''))
                
                if driver_phone:
                    logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± Sending driver SMS to: {driver_phone} (original: {driver.get('phone')})")
                    
                    client = Client(account_sid, auth_token)
                    
                    # Get payment status
                    payment_status = booking.get('payment_status', 'unpaid')
                    payment_display = {
                        'paid': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ PAID',
                        'cash': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âµ CASH',
                        'pay-on-pickup': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â PAY ON PICKUP',
                        'xero-invoiced': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ INVOICED',
                        'unpaid': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â UNPAID'
                    }.get(payment_status, payment_status.upper())
                    
                    # Get distance in km
                    distance_km = booking.get('distance', booking.get('estimatedDistance', ''))
                    distance_text = f"\nDistance: {distance_km} km" if distance_km else ""
                    
                    # Get flight number based on trip type
                    if trip_type == "RETURN":
                        # For return trips, use return flight number
                        flight_num = booking.get('returnFlightNumber') or booking.get('returnDepartureFlightNumber') or ''
                        trip_label = "Return Trip"
                        # For return, pickup/dropoff are reversed
                        pickup_addr = booking.get('dropoffAddress', 'N/A')
                        trip_date = booking.get('returnDate', booking.get('date', 'N/A'))
                        trip_time = booking.get('returnTime', booking.get('time', 'N/A'))
                    else:
                        # For outbound trips, use original flight number
                        flight_num = booking.get('flightNumber') or booking.get('departureFlightNumber') or booking.get('arrivalFlightNumber') or ''
                        trip_label = "Departure"
                        pickup_addr = booking.get('pickupAddress', 'N/A')
                        trip_date = booking.get('date', 'N/A')
                        trip_time = booking.get('time', 'N/A')
                    
                    flight_text = f"\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Flight: {flight_num}" if flight_num else ""
                    formatted_trip_date = format_date_ddmmyyyy(trip_date)
                    formatted_trip_time = format_time_ampm(trip_time)
                    
                    sms_body = f"""BookaRide - {trip_label}

Ref: {booking_ref}
Customer: {booking.get('name', 'N/A')}
Phone: {booking.get('phone', 'N/A')}
Pickup: {pickup_addr}
Date: {formatted_trip_date} at {formatted_trip_time}{flight_text}{distance_text}
Your Payout: ${driver_payout:.2f}
Payment: {payment_display}

ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â REPLY YES to confirm you received this job.

Check your email for full details."""
                    
                    message = client.messages.create(
                        body=sms_body,
                        from_=twilio_phone,
                        to=driver_phone
                    )
                    
                    logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Driver notification SMS sent to {driver_phone} - SID: {message.sid}")
                else:
                    logger.warning(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Driver {driver.get('name')} has no phone number - SMS not sent")
            else:
                logger.warning("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Twilio credentials not configured for driver SMS")
        except Exception as sms_error:
            logger.error(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Error sending driver SMS: {str(sms_error)}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error sending driver notification: {str(e)}")
        return False


# Google Calendar Integration

async def get_calendar_credentials():
    """Get Google Calendar credentials using service account"""
    try:
        from google.oauth2 import service_account
        import json
        
        # Try to read from environment variable first (for production)
        service_account_json = os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON')
        
        if service_account_json:
            # Load from environment variable (production/Kubernetes)
            try:
                service_account_info = json.loads(service_account_json)
                creds = service_account.Credentials.from_service_account_info(
                    service_account_info,
                    scopes=['https://www.googleapis.com/auth/calendar']
                )
                logger.info("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Service account credentials loaded from environment variable")
                return creds
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON: {str(e)}")
        
        # Fallback to file (for local development only)
        service_account_file = os.environ.get('GOOGLE_SERVICE_ACCOUNT_FILE')
        if service_account_file and os.path.exists(service_account_file):
            creds = service_account.Credentials.from_service_account_file(
                service_account_file,
                scopes=['https://www.googleapis.com/auth/calendar']
            )
            logger.info("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Service account credentials loaded from file")
            return creds
        
        logger.warning("Google service account credentials not configured (neither env var nor file)")
        return None
        
    except Exception as e:
        logger.error(f"Error loading service account credentials: {str(e)}")
        return None


def contains_non_english(text: str) -> bool:
    """Check if text contains non-ASCII characters (likely non-English)"""
    if not text:
        return False
    return any(ord(c) > 127 for c in str(text))

async def translate_to_english_async(text: str) -> str:
    """Translate non-English text to English using Emergent LLM"""
    if not text or not contains_non_english(text):
        return text
    
    try:
        from emergentintegrations.llm.openai import LlmChat, UserMessage
        import uuid
        
        llm = LlmChat(
            api_key="sk-emergent-1221fFe2cB790B632B",
            session_id=str(uuid.uuid4()),
            system_message="You are a translator. Translate text to English. Only return the translation, nothing else. Keep any English text as-is."
        )
        
        user_msg = UserMessage(text=text)
        translated = await llm.send_message(user_msg)
        
        if translated and translated.strip():
            return f"{translated.strip()} ({text})"  # Show translation with original
        return text
    except Exception as e:
        logger.warning(f"Translation failed: {str(e)}")
        return text

async def get_english_calendar_text(booking: dict) -> dict:
    """Get English versions of booking fields for calendar, with translations if needed"""
    name = booking.get('name', '')
    pickup = booking.get('pickupAddress', '')
    dropoff = booking.get('dropoffAddress', '')
    notes = booking.get('notes', '')
    
    # Translate if non-English detected
    translated_name = await translate_to_english_async(name) if contains_non_english(name) else name
    translated_pickup = await translate_to_english_async(pickup) if contains_non_english(pickup) else pickup
    translated_dropoff = await translate_to_english_async(dropoff) if contains_non_english(dropoff) else dropoff
    translated_notes = await translate_to_english_async(notes) if contains_non_english(notes) else notes
    
    return {
        'name': translated_name,
        'pickup': translated_pickup,
        'dropoff': translated_dropoff,
        'notes': translated_notes or 'None'
    }

async def create_calendar_event(booking: dict):
    """Create Google Calendar event(s) for the booking - creates TWO events if there's a return trip"""
    try:
        creds = await get_calendar_credentials()
        if not creds:
            logger.warning("Cannot create calendar event: No credentials")
            return False
        
        service = build('calendar', 'v3', credentials=creds)
        calendar_id = os.environ.get('GOOGLE_CALENDAR_ID', 'primary')
        
        # Parse booking date and time in New Zealand timezone
        from datetime import datetime
        import pytz
        
        nz_tz = pytz.timezone('Pacific/Auckland')
        
        # Get English translations for calendar (translates non-English text)
        eng = await get_english_calendar_text(booking)
        
        # Build pickup addresses list
        main_pickup = eng['pickup']
        pickup_list = [f"1. {main_pickup}"]
        additional_pickups = booking.get('pickupAddresses', [])
        if additional_pickups:
            for i, addr in enumerate(additional_pickups, start=2):
                if addr and addr.strip():
                    pickup_list.append(f"{i}. {addr}")
        
        # Common booking info
        ref_num = booking.get('referenceNumber', booking.get('id', '')[:8].upper())
        customer_name = eng['name']
        customer_phone = booking.get('phone')
        customer_email = booking.get('email')
        passengers = booking.get('passengers')
        total_price = booking.get('totalPrice', booking.get('pricing', {}).get('totalPrice', 0))
        payment_status = booking.get('payment_status', 'pending').upper()
        notes = eng['notes'] or 'No special notes'
        service_type = booking.get('serviceType', '').replace('-', ' ').title()
        
        created_event_ids = []
        
        # ========== EVENT 1: OUTBOUND TRIP ==========
        booking_date = booking.get('date')
        booking_time = booking.get('time')
        naive_dt = datetime.strptime(f"{booking_date} {booking_time}", '%Y-%m-%d %H:%M')
        nz_dt = nz_tz.localize(naive_dt)
        formatted_date = datetime.strptime(booking_date, '%Y-%m-%d').strftime('%d %B %Y')
        
        has_return = booking.get('bookReturn', False)
        
        outbound_event = {
            'summary': f"{customer_name} ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ {eng['dropoff'].split(',')[0]}" + (" + Return" if has_return else ""),
            'location': main_pickup,
            'description': f"""BOOKING #{ref_num}
ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â

CUSTOMER
{customer_name}
{customer_phone}
{customer_email}
{passengers} passenger(s)

PICKUP: {formatted_date} at {booking_time}
{chr(10).join(pickup_list)}

DROP-OFF
{eng['dropoff']}

PAYMENT
${total_price:.2f} NZD - {payment_status}

{f'NOTES: {notes}' if notes and notes.strip() else ''}
{"" if not has_return else f'''
ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â
RETURN TRIP BOOKED
Date: {booking.get('returnDate', 'N/A')} at {booking.get('returnTime', 'N/A')}
(See separate calendar event)
ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â'''}
            """.strip(),
            'start': {'dateTime': nz_dt.isoformat()},
            'end': {'dateTime': (nz_dt + timedelta(hours=2)).isoformat()},
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},
                    {'method': 'popup', 'minutes': 60},
                ],
            },
        }
        
        outbound_created = service.events().insert(calendarId=calendar_id, body=outbound_event).execute()
        created_event_ids.append(outbound_created.get('id'))
        logger.info(f"Outbound calendar event created: {outbound_created.get('htmlLink')}")
        
        # ========== EVENT 2: RETURN TRIP (if applicable) ==========
        if has_return and booking.get('returnDate') and booking.get('returnTime'):
            return_date = booking.get('returnDate')
            return_time = booking.get('returnTime')
            
            try:
                return_naive_dt = datetime.strptime(f"{return_date} {return_time}", '%Y-%m-%d %H:%M')
                return_nz_dt = nz_tz.localize(return_naive_dt)
                formatted_return_date = datetime.strptime(return_date, '%Y-%m-%d').strftime('%d %B %Y')
            except Exception as parse_error:
                logger.warning(f"Could not parse return date/time: {parse_error}")
                return_nz_dt = None
                formatted_return_date = return_date
            
            if return_nz_dt:
                # Build reverse route for return
                reverse_stops = []
                if additional_pickups:
                    for i, addr in enumerate(reversed(additional_pickups), start=1):
                        if addr and addr.strip():
                            reverse_stops.append(f"{i}. {addr}")
                reverse_stops.append(f"{len(reverse_stops) + 1}. {main_pickup} (FINAL DROP-OFF)")
                
                return_event = {
                    'summary': f"{customer_name} ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Return from {eng['dropoff'].split(',')[0]}",
                    'location': eng['dropoff'],  # Return starts from original drop-off
                    'description': f"""BOOKING #{ref_num} - RETURN
ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â

CUSTOMER
{customer_name}
{customer_phone}
{customer_email}
{passengers} passenger(s)

PICKUP: {formatted_return_date} at {return_time}
{eng['dropoff']}

DROP-OFF STOPS
{chr(10).join(reverse_stops)}

PAYMENT
${total_price:.2f} NZD (total both ways) - {payment_status}

{f'NOTES: {notes}' if notes and notes.strip() else ''}

ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â
Return leg of booking #{ref_num}
Outbound was: {formatted_date} at {booking_time}
ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â
                    """.strip(),
                    'start': {'dateTime': return_nz_dt.isoformat()},
                    'end': {'dateTime': (return_nz_dt + timedelta(hours=2)).isoformat()},
                    'reminders': {
                        'useDefault': False,
                        'overrides': [
                            {'method': 'email', 'minutes': 24 * 60},
                            {'method': 'popup', 'minutes': 60},
                        ],
                    },
                }
                
                return_created = service.events().insert(calendarId=calendar_id, body=return_event).execute()
                created_event_ids.append(return_created.get('id'))
                logger.info(f"Return calendar event created: {return_created.get('htmlLink')}")
        
        # Store event IDs in booking (comma-separated if multiple)
        await db.bookings.update_one(
            {"id": booking.get('id')},
            {"$set": {"calendar_event_id": ",".join(created_event_ids)}}
        )
        
        logger.info(f"Calendar event(s) created for booking {booking.get('id')}: {len(created_event_ids)} event(s)")
        return True
        
    except Exception as e:
        logger.error(f"Error creating calendar event: {str(e)}")
        return False


async def update_calendar_event(booking: dict):
    """Update Google Calendar event(s) for a booking - deletes existing and recreates"""
    try:
        existing_event_ids = booking.get('calendar_event_id', '')
        
        if not existing_event_ids:
            logger.info(f"No existing calendar event for booking {booking.get('id')}, creating new")
            return await create_calendar_event(booking)
        
        # Delete existing events
        creds = await get_calendar_credentials()
        if not creds:
            logger.warning("Cannot update calendar event: No credentials")
            return False
        
        service = build('calendar', 'v3', credentials=creds)
        calendar_id = os.environ.get('GOOGLE_CALENDAR_ID', 'primary')
        
        # Delete existing events (comma-separated for return trips)
        for event_id in existing_event_ids.split(','):
            event_id = event_id.strip()
            if event_id:
                try:
                    service.events().delete(calendarId=calendar_id, eventId=event_id).execute()
                    logger.info(f"Deleted calendar event {event_id} for update")
                except Exception as del_error:
                    logger.warning(f"Could not delete calendar event {event_id}: {str(del_error)}")
        
        # Clear the old event ID before creating new
        await db.bookings.update_one(
            {"id": booking.get('id')},
            {"$unset": {"calendar_event_id": ""}}
        )
        
        # Create new events with updated data
        success = await create_calendar_event(booking)
        logger.info(f"Calendar event updated for booking {booking.get('id')}: {success}")
        return success
        
    except Exception as e:
        logger.error(f"Error updating calendar event: {str(e)}")
        return False


# Manual Calendar Sync Endpoint
@api_router.post("/bookings/{booking_id}/sync-calendar")
async def sync_booking_to_calendar(booking_id: str, current_admin: dict = Depends(get_current_admin)):
    """Manually sync a booking to Google Calendar - updates existing or creates new"""
    try:
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Check if calendar event already exists
        existing_event_ids = booking.get('calendar_event_id', '')
        
        if existing_event_ids:
            # Delete existing events first (could be multiple for return trips)
            try:
                creds = await get_calendar_credentials()
                if creds:
                    service = build('calendar', 'v3', credentials=creds)
                    calendar_id = os.environ.get('GOOGLE_CALENDAR_ID', 'primary')
                    # Handle comma-separated event IDs
                    for event_id in existing_event_ids.split(','):
                        event_id = event_id.strip()
                        if event_id:
                            try:
                                service.events().delete(calendarId=calendar_id, eventId=event_id).execute()
                                logger.info(f"Deleted existing calendar event {event_id} for booking {booking_id}")
                            except Exception as del_single_error:
                                logger.warning(f"Could not delete calendar event {event_id}: {str(del_single_error)}")
            except Exception as del_error:
                logger.warning(f"Could not delete existing calendar events: {str(del_error)}")
        
        success = await create_calendar_event(booking)
        if success:
            action = "updated" if existing_event_ids else "created"
            has_return = booking.get('bookReturn', False)
            event_count = "2 events (outbound + return)" if has_return else "1 event"
            return {"success": True, "message": f"Booking {action} in Google Calendar successfully! ({event_count})"}
        else:
            raise HTTPException(status_code=500, detail="Failed to sync to calendar. Please check Google Calendar authorization.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing booking to calendar: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error syncing to calendar: {str(e)}")


# Resend Confirmation Endpoint
@api_router.post("/bookings/{booking_id}/resend-confirmation")
async def resend_booking_confirmation(booking_id: str, current_admin: dict = Depends(get_current_admin)):
    """Resend confirmation email and SMS to customer - with rate limiting"""
    try:
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # RATE LIMIT: Check if confirmation was sent in the last 5 minutes
        last_resend = booking.get('lastConfirmationResent')
        if last_resend:
            try:
                last_resend_time = datetime.fromisoformat(last_resend.replace('Z', '+00:00'))
                time_since_last = datetime.now(timezone.utc) - last_resend_time
                if time_since_last.total_seconds() < 300:  # 5 minutes
                    minutes_left = int((300 - time_since_last.total_seconds()) / 60) + 1
                    raise HTTPException(
                        status_code=429, 
                        detail=f"Confirmation was just sent. Please wait {minutes_left} more minute(s) before resending."
                    )
            except ValueError:
                pass  # Invalid date format, allow resend
        
        email_sent = False
        sms_sent = False
        
        # Send confirmation email
        try:
            send_booking_confirmation_email(booking)
            email_sent = True
            logger.info(f"Confirmation email resent for booking {booking_id}")
        except Exception as e:
            logger.error(f"Failed to resend email for booking {booking_id}: {str(e)}")
        
        # Send confirmation SMS
        try:
            send_booking_confirmation_sms(booking)
            sms_sent = True
            logger.info(f"Confirmation SMS resent for booking {booking_id}")
        except Exception as e:
            logger.error(f"Failed to resend SMS for booking {booking_id}: {str(e)}")
        
        # Track resend time
        await db.bookings.update_one(
            {"id": booking_id},
            {"$set": {"lastConfirmationResent": datetime.now(timezone.utc).isoformat()}}
        )
        
        if email_sent and sms_sent:
            return {"success": True, "message": "Confirmation email and SMS resent successfully!"}
        elif email_sent:
            return {"success": True, "message": "Confirmation email resent (SMS failed)"}
        elif sms_sent:
            return {"success": True, "message": "Confirmation SMS resent (Email failed)"}
        else:
            raise HTTPException(status_code=500, detail="Failed to resend both email and SMS")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resending confirmation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error resending confirmation: {str(e)}")


@api_router.post("/bookings/{booking_id}/resend-payment-link")
async def resend_payment_link(booking_id: str, payment_method: str = "stripe", current_admin: dict = Depends(get_current_admin)):
    """Resend payment link to customer via email
    
    Args:
        booking_id: The booking ID
        payment_method: 'stripe' or 'paypal'
    """
    try:
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Check if already paid
        if booking.get('payment_status') == 'paid':
            raise HTTPException(status_code=400, detail="This booking has already been paid")
        
        booking_ref = get_booking_reference(booking)
        
        if payment_method == 'stripe':
            payment_link = await generate_stripe_payment_link(booking)
            if payment_link:
                await send_payment_link_email(booking, payment_link, 'stripe')
                logger.info(f"Stripe payment link resent for booking #{booking_ref}")
                return {"success": True, "message": f"Stripe payment link sent to {booking.get('email')}"}
            else:
                raise HTTPException(status_code=500, detail="Failed to generate Stripe payment link")
        
        elif payment_method == 'paypal':
            payment_link = generate_paypal_payment_link(booking)
            if payment_link:
                await send_payment_link_email(booking, payment_link, 'paypal')
                logger.info(f"PayPal payment link resent for booking #{booking_ref}")
                return {"success": True, "message": f"PayPal payment link sent to {booking.get('email')}"}
            else:
                raise HTTPException(status_code=500, detail="Failed to generate PayPal payment link")
        
        else:
            raise HTTPException(status_code=400, detail="Invalid payment method. Use 'stripe' or 'paypal'")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resending payment link: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error resending payment link: {str(e)}")


# Preview Confirmation Email Endpoint
@api_router.get("/bookings/{booking_id}/preview-confirmation")
async def preview_booking_confirmation(booking_id: str, current_admin: dict = Depends(get_current_admin)):
    """Preview confirmation email HTML without sending it"""
    try:
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Generate the email HTML preview
        html_content = generate_confirmation_email_html(booking)
        
        return {
            "success": True, 
            "html": html_content,
            "booking": {
                "name": booking.get('name'),
                "email": booking.get('email'),
                "ccEmail": booking.get('ccEmail', ''),
                "phone": booking.get('phone')
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error previewing confirmation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error previewing confirmation: {str(e)}")


def generate_confirmation_email_html(booking: dict) -> str:
    """Generate the confirmation email HTML for preview or sending - Clean professional design"""
    sender_email = os.environ.get('SENDER_EMAIL', 'bookings@bookaride.co.nz')
    
    # Get pricing
    total_price = booking.get('totalPrice', 0) or booking.get('pricing', {}).get('totalPrice', 0)
    distance = booking.get('pricing', {}).get('distance', booking.get('distance', 0))
    
    # Format date and time with AM/PM
    formatted_date = format_date_ddmmyyyy(booking.get('date', 'N/A'))
    formatted_time = format_time_ampm(booking.get('time', 'N/A'))
    booking_ref = get_booking_reference(booking)
    
    # Get all addresses
    primary_pickup = booking.get('pickupAddress', 'N/A')
    pickup_addresses = booking.get('pickupAddresses', [])
    dropoff_address = booking.get('dropoffAddress', 'N/A')
    
    # Get flight numbers
    departure_flight = booking.get('departureFlightNumber') or ''
    arrival_flight = booking.get('arrivalFlightNumber') or booking.get('flightNumber') or ''
    departure_time = booking.get('departureTime') or ''
    arrival_time_flight = booking.get('arrivalTime') or ''
    
    # Service type display
    service_type = booking.get('serviceType', 'airport-shuttle')
    service_display = service_type.replace('-', ' ').title()
    
    # Transfer type
    has_return = booking.get('bookReturn', False) or booking.get('returnDate', '')
    transfer_type = "Return Trip" if has_return else "One Way"
    
    # Payment status
    payment_status = booking.get('payment_status', 'unpaid').upper()
    
    # Notes/Special requests
    notes = booking.get('notes') or booking.get('specialRequests') or ''
    
    # Passengers
    passengers = booking.get('passengers', '1')
    payment_color = '#22c55e' if payment_status == 'PAID' else '#f59e0b'
    
    # Build return trip section
    return_section_html = ""
    if has_return:
        return_date = booking.get('returnDate', '')
        return_time = booking.get('returnTime', '')
        return_flight = booking.get('returnFlightNumber') or booking.get('returnDepartureFlightNumber') or ''
        return_arrival_flight = booking.get('returnArrivalFlightNumber') or ''
        
        formatted_return_date = format_date_ddmmyyyy(return_date) if return_date else 'TBC'
        formatted_return_time = format_time_ampm(return_time) if return_time else 'TBC'
        
        return_section_html = f'''
                        <!-- Return Trip -->
                        <tr>
                            <td colspan="2" style="padding: 20px 0 10px 0;">
                                <div style="background: #1a1a2e; color: #D4AF37; padding: 8px 15px; font-weight: 600; font-size: 14px; letter-spacing: 1px;">
                                    RETURN JOURNEY
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 20px; color: #666; font-size: 13px; width: 140px; border-bottom: 1px solid #f0f0f0;">Return Date</td>
                            <td style="padding: 12px 20px; color: #1a1a1a; font-size: 14px; font-weight: 500; border-bottom: 1px solid #f0f0f0;">{formatted_return_date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 20px; color: #666; font-size: 13px; border-bottom: 1px solid #f0f0f0;">Pickup Time</td>
                            <td style="padding: 12px 20px; color: #1a1a1a; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f0f0f0;">{formatted_return_time}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 20px; color: #666; font-size: 13px; border-bottom: 1px solid #f0f0f0;">Pickup</td>
                            <td style="padding: 12px 20px; color: #1a1a1a; font-size: 14px; border-bottom: 1px solid #f0f0f0;">{dropoff_address}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 20px; color: #666; font-size: 13px; border-bottom: 1px solid #f0f0f0;">Drop-off</td>
                            <td style="padding: 12px 20px; color: #1a1a1a; font-size: 14px; border-bottom: 1px solid #f0f0f0;">{primary_pickup}</td>
                        </tr>
                        {'<tr><td style="padding: 12px 20px; color: #666; font-size: 13px; border-bottom: 1px solid #f0f0f0;">Flight Number</td><td style="padding: 12px 20px; color: #1a1a1a; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f0f0f0;">' + return_flight + '</td></tr>' if return_flight else ''}
        '''
    
    # Build additional stops for outbound
    additional_stops_html = ""
    if pickup_addresses:
        for i, addr in enumerate(pickup_addresses):
            if addr and addr.strip():
                additional_stops_html += f'''
                        <tr>
                            <td style="padding: 12px 20px; color: #666; font-size: 13px; border-bottom: 1px solid #f0f0f0;">Stop {i+2}</td>
                            <td style="padding: 12px 20px; color: #1a1a1a; font-size: 14px; border-bottom: 1px solid #f0f0f0;">{addr}</td>
                        </tr>
                '''
    
    # Notes section
    notes_html = ""
    if notes:
        notes_html = f'''
                        <tr>
                            <td colspan="2" style="padding: 20px 0 10px 0;">
                                <div style="background: #fef9e7; border-left: 4px solid #D4AF37; padding: 15px 20px;">
                                    <p style="margin: 0 0 5px 0; color: #92400e; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Special Instructions / Notes</p>
                                    <p style="margin: 0; color: #1a1a1a; font-size: 14px; line-height: 1.5;">{notes}</p>
                                </div>
                            </td>
                        </tr>
        '''
    
    # Flight info section
    flight_info_html = ""
    if departure_flight or arrival_flight:
        flight_info_html = '''
                        <tr>
                            <td colspan="2" style="padding: 20px 0 10px 0;">
                                <div style="background: #1a1a2e; color: #D4AF37; padding: 8px 15px; font-weight: 600; font-size: 14px; letter-spacing: 1px;">
                                    FLIGHT DETAILS
                                </div>
                            </td>
                        </tr>
        '''
        if departure_flight:
            flight_info_html += f'''
                        <tr>
                            <td style="padding: 12px 20px; color: #666; font-size: 13px; border-bottom: 1px solid #f0f0f0;">Departure Flight</td>
                            <td style="padding: 12px 20px; color: #1a1a1a; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f0f0f0;">{departure_flight}{' at ' + format_time_ampm(departure_time) if departure_time else ''}</td>
                        </tr>
            '''
        if arrival_flight:
            flight_info_html += f'''
                        <tr>
                            <td style="padding: 12px 20px; color: #666; font-size: 13px; border-bottom: 1px solid #f0f0f0;">Arrival Flight</td>
                            <td style="padding: 12px 20px; color: #1a1a1a; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f0f0f0;">{arrival_flight}{' at ' + format_time_ampm(arrival_time_flight) if arrival_time_flight else ''}</td>
                        </tr>
            '''
    
    html_content = f'''
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="background: #1a1a2e; padding: 30px 20px; text-align: center;">
                    <h1 style="margin: 0; color: #D4AF37; font-size: 24px; font-weight: 600; letter-spacing: 2px;">BOOK A RIDE</h1>
                    <p style="margin: 5px 0 0 0; color: #888; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">Premium Airport Transfers</p>
                </div>
                
                <!-- Confirmation Banner -->
                <div style="background: #D4AF37; padding: 20px; text-align: center;">
                    <p style="margin: 0; color: #1a1a2e; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Booking Confirmed</p>
                    <p style="margin: 5px 0 0 0; color: #1a1a2e; font-size: 28px; font-weight: 700;">#{booking_ref}</p>
                </div>
                
                <!-- Main Content -->
                <div style="padding: 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        
                        <!-- Outbound Journey Header -->
                        <tr>
                            <td colspan="2" style="padding: 20px 0 10px 0;">
                                <div style="background: #1a1a2e; color: #D4AF37; padding: 8px 15px; font-weight: 600; font-size: 14px; letter-spacing: 1px;">
                                    {'OUTBOUND JOURNEY' if has_return else 'JOURNEY DETAILS'}
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Customer Name -->
                        <tr>
                            <td style="padding: 12px 20px; color: #666; font-size: 13px; width: 140px; border-bottom: 1px solid #f0f0f0;">Passenger</td>
                            <td style="padding: 12px 20px; color: #1a1a1a; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f0f0f0;">{booking.get('name', 'N/A')}</td>
                        </tr>
                        
                        <!-- Service Type -->
                        <tr>
                            <td style="padding: 12px 20px; color: #666; font-size: 13px; border-bottom: 1px solid #f0f0f0;">Service</td>
                            <td style="padding: 12px 20px; color: #1a1a1a; font-size: 14px; border-bottom: 1px solid #f0f0f0;">{service_display}</td>
                        </tr>
                        
                        <!-- Date -->
                        <tr>
                            <td style="padding: 12px 20px; color: #666; font-size: 13px; border-bottom: 1px solid #f0f0f0;">Date</td>
                            <td style="padding: 12px 20px; color: #1a1a1a; font-size: 14px; font-weight: 500; border-bottom: 1px solid #f0f0f0;">{formatted_date}</td>
                        </tr>
                        
                        <!-- Time -->
                        <tr>
                            <td style="padding: 12px 20px; color: #666; font-size: 13px; border-bottom: 1px solid #f0f0f0;">Pickup Time</td>
                            <td style="padding: 12px 20px; color: #1a1a1a; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f0f0f0;">{formatted_time}</td>
                        </tr>
                        
                        <!-- Passengers -->
                        <tr>
                            <td style="padding: 12px 20px; color: #666; font-size: 13px; border-bottom: 1px solid #f0f0f0;">Passengers</td>
                            <td style="padding: 12px 20px; color: #1a1a1a; font-size: 14px; border-bottom: 1px solid #f0f0f0;">{passengers}</td>
                        </tr>
                        
                        <!-- Pickup Address -->
                        <tr>
                            <td style="padding: 12px 20px; color: #666; font-size: 13px; border-bottom: 1px solid #f0f0f0;">Pickup</td>
                            <td style="padding: 12px 20px; color: #1a1a1a; font-size: 14px; border-bottom: 1px solid #f0f0f0;">{primary_pickup}</td>
                        </tr>
                        
                        {additional_stops_html}
                        
                        <!-- Drop-off Address -->
                        <tr>
                            <td style="padding: 12px 20px; color: #666; font-size: 13px; border-bottom: 1px solid #f0f0f0;">Drop-off</td>
                            <td style="padding: 12px 20px; color: #1a1a1a; font-size: 14px; border-bottom: 1px solid #f0f0f0;">{dropoff_address}</td>
                        </tr>
                        
                        {flight_info_html}
                        
                        {return_section_html}
                        
                        {notes_html}
                        
                        <!-- Price Section -->
                        <tr>
                            <td colspan="2" style="padding: 25px 20px; background: #faf9f6;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="color: #666; font-size: 14px;">Total Fare</td>
                                        <td style="text-align: right; color: #1a1a1a; font-size: 24px; font-weight: 700;">${total_price:.2f} <span style="font-size: 12px; color: #666;">NZD</span></td>
                                    </tr>
                                    <tr>
                                        <td style="color: #666; font-size: 13px; padding-top: 8px;">Payment Status</td>
                                        <td style="text-align: right; padding-top: 8px;">
                                            <span style="background: {'#22c55e' if payment_status == 'PAID' else '#f59e0b'}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600;">{payment_status}</span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Contact Details -->
                        <tr>
                            <td colspan="2" style="padding: 20px;">
                                <div style="background: #f8f8f8; border-radius: 6px; padding: 15px;">
                                    <p style="margin: 0 0 10px 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Contact Details on File</p>
                                    <p style="margin: 0 0 3px 0; color: #1a1a1a; font-size: 14px;">{booking.get('email', 'N/A')}</p>
                                    <p style="margin: 0; color: #1a1a1a; font-size: 14px;">{booking.get('phone', 'N/A')}</p>
                                </div>
                            </td>
                        </tr>
                        
                    </table>
                </div>
                
                <!-- Footer -->
                <div style="background: #1a1a2e; padding: 25px 20px; text-align: center;">
                    <p style="margin: 0 0 15px 0; color: #D4AF37; font-size: 14px;">Questions? Contact us anytime</p>
                    <p style="margin: 0 0 5px 0;">
                        <a href="tel:+6421743321" style="color: #fff; text-decoration: none; font-size: 16px; font-weight: 600;">021 743 321</a>
                    </p>
                    <p style="margin: 0 0 15px 0;">
                        <a href="mailto:{sender_email}" style="color: #888; text-decoration: none; font-size: 13px;">{sender_email}</a>
                    </p>
                    <div style="border-top: 1px solid #333; padding-top: 15px; margin-top: 15px;">
                        <p style="margin: 0; color: #666; font-size: 11px;">Thank you for choosing Book A Ride</p>
                        <p style="margin: 5px 0 0 0;">
                            <a href="https://bookaride.co.nz" style="color: #D4AF37; text-decoration: none; font-size: 12px;">bookaride.co.nz</a>
                        </p>
                    </div>
                </div>
                
            </div>
        </body>
    </html>
    '''
    return html_content


# Import Bookings from WordPress/CSV
class ImportBooking(BaseModel):
    booking_id: Optional[str] = ""
    first_name: str
    last_name: str
    email: str
    phone: str
    pickup_address: str
    dropoff_address: str
    pickup_date: str  # DD-MM-YYYY format
    pickup_time: str  # HH:MM format
    return_date: Optional[str] = ""
    return_time: Optional[str] = ""
    passengers: int = 1
    total_price: float
    flight_number: Optional[str] = ""
    flight_time: Optional[str] = ""
    notes: Optional[str] = ""
    service_type: str = "private-transfer"
    status: str = "confirmed"

class ImportBookingsRequest(BaseModel):
    bookings: List[ImportBooking]

@api_router.post("/bookings/import")
async def import_bookings(request: ImportBookingsRequest, current_admin: dict = Depends(get_current_admin)):
    """Import multiple bookings from WordPress or CSV data"""
    try:
        imported = []
        errors = []
        
        for idx, booking_data in enumerate(request.bookings):
            try:
                # Parse date from DD-MM-YYYY to YYYY-MM-DD
                date_parts = booking_data.pickup_date.split('-')
                if len(date_parts) == 3:
                    formatted_date = f"{date_parts[2]}-{date_parts[1]}-{date_parts[0]}"
                else:
                    formatted_date = booking_data.pickup_date
                
                # Parse return date if present
                formatted_return_date = ""
                if booking_data.return_date:
                    return_parts = booking_data.return_date.split('-')
                    if len(return_parts) == 3:
                        formatted_return_date = f"{return_parts[2]}-{return_parts[1]}-{return_parts[0]}"
                    else:
                        formatted_return_date = booking_data.return_date
                
                # Generate new booking ID and reference
                new_id = str(uuid.uuid4())
                ref_number = await get_next_reference_number()
                
                # Build the booking document
                new_booking = {
                    "id": new_id,
                    "referenceNumber": ref_number,
                    "importedFrom": "wordpress",
                    "originalBookingId": booking_data.booking_id or "",
                    "name": f"{booking_data.first_name} {booking_data.last_name}".strip(),
                    "email": booking_data.email,
                    "phone": booking_data.phone,
                    "pickupAddress": booking_data.pickup_address,
                    "dropoffAddress": booking_data.dropoff_address,
                    "pickupAddresses": [],
                    "date": formatted_date,
                    "time": booking_data.pickup_time,
                    "passengers": str(booking_data.passengers),
                    "serviceType": booking_data.service_type,
                    "flightNumber": booking_data.flight_number or "",
                    "flightTime": booking_data.flight_time or "",
                    "notes": booking_data.notes or f"Imported from WordPress booking #{booking_data.booking_id}",
                    "status": booking_data.status,
                    "paymentStatus": "paid",
                    "paymentMethod": "imported",
                    "totalPrice": booking_data.total_price,
                    "pricing": {"totalPrice": booking_data.total_price},
                    "bookReturn": bool(formatted_return_date),
                    "returnDate": formatted_return_date,
                    "returnTime": booking_data.return_time or "",
                    "createdAt": datetime.now(timezone.utc).isoformat(),
                    "importedAt": datetime.now(timezone.utc).isoformat()
                }
                
                # Insert into database
                await db.bookings.insert_one(new_booking)
                imported.append({
                    "originalId": booking_data.booking_id,
                    "newId": new_id,
                    "referenceNumber": ref_number,
                    "name": new_booking["name"]
                })
                
            except Exception as e:
                errors.append({
                    "index": idx,
                    "booking_id": booking_data.booking_id,
                    "error": str(e)
                })
        
        return {
            "success": True,
            "imported_count": len(imported),
            "error_count": len(errors),
            "imported": imported,
            "errors": errors
        }
        
    except Exception as e:
        logger.error(f"Error importing bookings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error importing bookings: {str(e)}")



class RestoreBookingData(BaseModel):
    """Model for restoring bookings from backup"""
    bookings: List[dict]

@api_router.post("/bookings/restore-backup")
async def restore_bookings_from_backup(request: RestoreBookingData, current_admin: dict = Depends(get_current_admin)):
    """Restore bookings from a JSON backup file - preserves original IDs and data"""
    try:
        imported = []
        errors = []
        skipped = []
        
        for booking in request.bookings:
            try:
                # Check if booking already exists by ID
                existing = await db.bookings.find_one({"id": booking.get("id")})
                if existing:
                    skipped.append({
                        "id": booking.get("id"),
                        "name": booking.get("name"),
                        "reason": "Already exists"
                    })
                    continue
                
                # Also check by reference number if present
                if booking.get("referenceNumber"):
                    existing_ref = await db.bookings.find_one({"referenceNumber": booking.get("referenceNumber")})
                    if existing_ref:
                        skipped.append({
                            "id": booking.get("id"),
                            "name": booking.get("name"),
                            "referenceNumber": booking.get("referenceNumber"),
                            "reason": "Reference number already exists"
                        })
                        continue
                
                # Insert booking as-is (preserving all original data)
                await db.bookings.insert_one(booking)
                imported.append({
                    "id": booking.get("id"),
                    "name": booking.get("name"),
                    "referenceNumber": booking.get("referenceNumber")
                })
                
            except Exception as e:
                errors.append({
                    "id": booking.get("id"),
                    "name": booking.get("name"),
                    "error": str(e)
                })
        
        return {
            "success": True,
            "imported_count": len(imported),
            "skipped_count": len(skipped),
            "error_count": len(errors),
            "imported": imported,
            "skipped": skipped,
            "errors": errors
        }
        
    except Exception as e:
        logger.error(f"Error restoring bookings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error restoring bookings: {str(e)}")



# Google Calendar OAuth Endpoints

@api_router.get("/auth/google/login")
async def google_calendar_login(http_request: Request):
    """Initiate Google Calendar OAuth flow"""
    try:
        client_id = os.environ.get('GOOGLE_CLIENT_ID')
        client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
        
        if not client_id or not client_secret:
            raise HTTPException(status_code=500, detail="Google OAuth credentials not configured")
        
        # Use public domain for OAuth callback (not internal Emergent domain)
        public_domain = os.environ.get('PUBLIC_DOMAIN', 'https://bookaride.co.nz')
        redirect_uri = f"{public_domain}/api/auth/google/callback"
        
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [redirect_uri]
                }
            },
            scopes=['https://www.googleapis.com/auth/calendar'],
            redirect_uri=redirect_uri
        )
        
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            prompt='consent',
            include_granted_scopes='true'
        )
        
        logger.info(f"Google Calendar OAuth initiated. Redirect URI: {redirect_uri}")
        logger.info(f"Using Client ID: {client_id[:20]}...")
        
        # Auto-redirect to Google OAuth instead of returning JSON
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=authorization_url)
        
    except Exception as e:
        logger.error(f"Error initiating Google OAuth: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error initiating Google OAuth: {str(e)}")


@api_router.get("/auth/google/callback")
async def google_calendar_callback(code: str, http_request: Request):
    """Handle Google Calendar OAuth callback"""
    try:
        client_id = os.environ.get('GOOGLE_CLIENT_ID')
        client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
        
        # Use public domain for OAuth callback (not internal Emergent domain)
        public_domain = os.environ.get('PUBLIC_DOMAIN', 'https://bookaride.co.nz')
        redirect_uri = f"{public_domain}/api/auth/google/callback"
        
        # Exchange code for tokens
        token_response = requests.post('https://oauth2.googleapis.com/token', data={
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        }).json()
        
        if 'error' in token_response:
            raise HTTPException(status_code=400, detail=f"OAuth error: {token_response.get('error_description')}")
        
        # Get user info
        user_info = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {token_response["access_token"]}'}
        ).json()
        
        # Store tokens for info@airportshuttleservice.co.nz
        await db.calendar_auth.update_one(
            {"email": "info@airportshuttleservice.co.nz"},
            {"$set": {
                "email": "info@airportshuttleservice.co.nz",
                "google_email": user_info.get('email'),
                "google_tokens": token_response,
                "authenticated_at": datetime.now(timezone.utc)
            }},
            upsert=True
        )
        
        logger.info(f"Google Calendar authenticated for info@airportshuttleservice.co.nz (Google account: {user_info.get('email')})")
        
        return {
            "success": True,
            "message": "Google Calendar successfully connected!",
            "google_account": user_info.get('email')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in Google OAuth callback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error completing OAuth: {str(e)}")


# Stripe Payment Integration

# Payment Models
class PaymentCheckoutRequest(BaseModel):
    booking_id: str
    origin_url: str

@api_router.post("/payment/create-checkout", response_model=CheckoutSessionResponse)
async def create_payment_checkout(request: PaymentCheckoutRequest, http_request: Request):
    try:
        # Get booking from database
        booking = await db.bookings.find_one({"id": request.booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Get Stripe API key
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        if not stripe_api_key:
            raise HTTPException(status_code=500, detail="Stripe API key not configured")
        
        # Initialize Stripe Checkout
        host_url = str(http_request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        # Build success and cancel URLs from frontend origin
        success_url = f"{request.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{request.origin_url}/book-now"
        
        # Get amount from booking (server-side only, never from frontend)
        amount = float(booking.get('totalPrice', 0))
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid booking amount")
        
        # Create checkout session with Apple Pay, Google Pay, Afterpay enabled
        # Note: Apple Pay and Google Pay work through 'card' payment method with Payment Request Button
        # Adding 'link' enables Stripe Link for faster checkout
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency="nzd",
            success_url=success_url,
            cancel_url=cancel_url,
            payment_methods=["card", "afterpay_clearpay", "link"],  # card includes Apple Pay/Google Pay via Payment Request
            metadata={
                "booking_id": request.booking_id,
                "customer_email": booking.get('email', ''),
                "customer_name": booking.get('name', '')
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        payment_transaction = {
            "id": str(uuid.uuid4()),
            "booking_id": request.booking_id,
            "session_id": session.session_id,
            "amount": amount,
            "currency": "nzd",
            "payment_status": "pending",
            "status": "initiated",
            "customer_email": booking.get('email', ''),
            "customer_name": booking.get('name', ''),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.payment_transactions.insert_one(payment_transaction)
        logger.info(f"Payment transaction created: {payment_transaction['id']} for booking: {request.booking_id}")
        
        # Update booking with payment session info
        await db.bookings.update_one(
            {"id": request.booking_id},
            {"$set": {"payment_session_id": session.session_id, "payment_status": "pending"}}
        )
        
        return session
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating payment checkout: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating checkout session: {str(e)}")


@api_router.get("/payment/status/{session_id}")
async def get_payment_status(session_id: str):
    try:
        # Get Stripe API key
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        if not stripe_api_key:
            raise HTTPException(status_code=500, detail="Stripe API key not configured")
        
        # Check if we've already processed this payment
        existing_transaction = await db.payment_transactions.find_one(
            {"session_id": session_id, "payment_status": "paid"}, 
            {"_id": 0}
        )
        
        if existing_transaction:
            logger.info(f"Payment already processed for session: {session_id}")
            # Get the booking to retrieve reference number
            booking = await db.bookings.find_one(
                {"id": existing_transaction['booking_id']}, 
                {"_id": 0, "referenceNumber": 1}
            )
            return {
                "status": existing_transaction['status'],
                "payment_status": existing_transaction['payment_status'],
                "amount_total": int(existing_transaction['amount'] * 100),
                "currency": existing_transaction['currency'],
                "metadata": {"booking_id": existing_transaction['booking_id']},
                "referenceNumber": booking.get('referenceNumber') if booking else None
            }
        
        # Initialize Stripe Checkout (webhook_url not needed for status check)
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
        
        # Get checkout status from Stripe
        checkout_status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update payment transaction in database
        update_data = {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "updated_at": datetime.now(timezone.utc)
        }
        
        result = await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        reference_number = None
        
        # If payment is successful, update booking status and send confirmations
        if checkout_status.payment_status == "paid" and result.modified_count > 0:
            booking_id = checkout_status.metadata.get('booking_id')
            if booking_id:
                await db.bookings.update_one(
                    {"id": booking_id},
                    {"$set": {"payment_status": "paid", "status": "confirmed"}}
                )
                logger.info(f"Booking {booking_id} confirmed after successful payment")
                
                # Get booking details for notifications
                booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
                if booking:
                    reference_number = booking.get('referenceNumber')
                    
                    # Send confirmations based on customer's notification preference
                    send_customer_confirmation(booking)
                    
                    # Send admin notification
                    await send_booking_notification_to_admin(booking)
                    
                    # Create Google Calendar event
                    await create_calendar_event(booking)
        
        # Return response with reference number
        return {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "amount_total": checkout_status.amount_total,
            "currency": checkout_status.currency,
            "metadata": checkout_status.metadata,
            "referenceNumber": reference_number
        }
    
    except Exception as e:
        logger.error(f"Error getting payment status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking payment status: {str(e)}")


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        # Get Stripe API key
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        if not stripe_api_key:
            raise HTTPException(status_code=500, detail="Stripe API key not configured")
        
        # Get request body and signature
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        if not signature:
            raise HTTPException(status_code=400, detail="Missing Stripe signature")
        
        # Initialize Stripe Checkout
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        # Handle webhook
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        logger.info(f"Webhook received: {webhook_response.event_type} for session: {webhook_response.session_id}")
        
        # Update payment transaction based on webhook
        if webhook_response.payment_status:
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {
                    "$set": {
                        "payment_status": webhook_response.payment_status,
                        "updated_at": datetime.now(timezone.utc)
                    }
                }
            )
            
            # If payment successful, update booking and send confirmations
            if webhook_response.payment_status == "paid":
                booking_id = webhook_response.metadata.get('booking_id')
                booking_type = webhook_response.metadata.get('booking_type', 'regular')
                
                if booking_id:
                    # Handle shuttle bookings differently
                    if booking_type == 'shuttle':
                        # For shuttle: update to authorized (not charged yet)
                        # Also save the payment_intent_id for later capture
                        import stripe
                        stripe.api_key = stripe_api_key
                        
                        # Get the session to retrieve payment_intent
                        session = stripe.checkout.Session.retrieve(webhook_response.session_id)
                        payment_intent_id = session.payment_intent
                        
                        await db.shuttle_bookings.update_one(
                            {"id": booking_id},
                            {"$set": {
                                "paymentStatus": "authorized",
                                "status": "authorized",
                                "stripePaymentIntentId": payment_intent_id,
                                "stripeCheckoutSessionId": webhook_response.session_id
                            }}
                        )
                        logger.info(f"Shuttle booking {booking_id} authorized - PaymentIntent: {payment_intent_id}")
                        
                        # Send confirmation to customer
                        shuttle_booking = await db.shuttle_bookings.find_one({"id": booking_id}, {"_id": 0})
                        if shuttle_booking:
                            # Send email confirmation for shuttle
                            try:
                                mailgun_key = os.environ.get('MAILGUN_API_KEY')
                                mailgun_domain = os.environ.get('MAILGUN_DOMAIN', 'mg.bookaride.co.nz')
                                if mailgun_key:
                                    requests.post(
                                        f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
                                        auth=("api", mailgun_key),
                                        data={
                                            "from": f"Book A Ride NZ <bookings@{mailgun_domain}>",
                                            "to": shuttle_booking['email'],
                                            "subject": f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Shuttle Booking Confirmed - {shuttle_booking['date']} {shuttle_booking['departureTime']}",
                                            "html": f"""
                                            <h2>Your Shuttle Seat is Reserved!</h2>
                                            <p>Hi {shuttle_booking['name']},</p>
                                            <p>Great news! Your seat on the shared shuttle is confirmed.</p>
                                            <h3>Booking Details:</h3>
                                            <ul>
                                                <li><strong>Date:</strong> {shuttle_booking['date']}</li>
                                                <li><strong>Departure Time:</strong> {shuttle_booking['departureTime']}</li>
                                                <li><strong>Pickup:</strong> {shuttle_booking['pickupAddress']}</li>
                                                <li><strong>Destination:</strong> Auckland International Airport</li>
                                                <li><strong>Passengers:</strong> {shuttle_booking['passengers']}</li>
                                            </ul>
                                            <h3>Payment Info:</h3>
                                            <p>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ A hold of <strong>${shuttle_booking.get('totalEstimated', 100)}</strong> has been placed on your card.</p>
                                            <p>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ You will only be charged the <strong>final price</strong> when the shuttle arrives at the airport.</p>
                                            <p>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â° The more passengers on your shuttle, the cheaper everyone pays!</p>
                                            <p>We'll be in touch closer to your departure date with pickup details.</p>
                                            <p>Thank you for choosing Book A Ride!</p>
                                            """
                                        }
                                    )
                                    logger.info(f"Shuttle confirmation email sent to {shuttle_booking['email']}")
                            except Exception as email_error:
                                logger.error(f"Failed to send shuttle confirmation email: {email_error}")
                    else:
                        # Regular booking - charge immediately
                        await db.bookings.update_one(
                            {"id": booking_id},
                            {"$set": {"payment_status": "paid", "status": "confirmed"}}
                        )
                        logger.info(f"Booking {booking_id} confirmed via webhook")
                        
                        # Get booking details for notifications
                        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
                        if booking:
                            # Send confirmations based on customer's notification preference
                            send_customer_confirmation(booking)
                            
                            # Send admin notification
                            await send_booking_notification_to_admin(booking)
                            
                            # Create Google Calendar event
                            await create_calendar_event(booking)
        
        return {"status": "success", "event_type": webhook_response.event_type}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing webhook: {str(e)}")


# Twilio SMS Webhook - Driver Acknowledgment AND Admin Approval
@api_router.post("/webhook/twilio/sms")
async def twilio_sms_webhook(request: Request):
    """Handle incoming SMS replies from drivers for job acknowledgment AND admin for urgent approval"""
    try:
        # Parse the form data from Twilio
        form_data = await request.form()
        from_number = form_data.get('From', '')
        message_body = form_data.get('Body', '').strip().upper()
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± Incoming SMS from {from_number}: {message_body}")
        
        # Get admin phone number
        admin_phone = os.environ.get('ADMIN_PHONE', '+6421743321')
        normalized_admin = admin_phone.replace('+64', '0').replace(' ', '').replace('-', '')
        normalized_from = from_number.replace('+64', '0').replace(' ', '').replace('-', '')
        if normalized_from.startswith('64'):
            normalized_from = '0' + normalized_from[2:]
        if normalized_admin.startswith('64'):
            normalized_admin = '0' + normalized_admin[2:]
        
        # Check if this is from admin for urgent booking approval
        is_admin = (normalized_from == normalized_admin or from_number == admin_phone)
        
        if is_admin and message_body in ['YES', 'Y', 'YEP', 'CONFIRM', 'APPROVE', 'OK', 'OKAY', 'ACCEPTED']:
            # Admin is approving an urgent booking
            pending = await db.pending_approvals.find_one({"admin_phone": admin_phone}, {"_id": 0})
            
            if pending:
                booking_id = pending.get('booking_id')
                booking_ref = pending.get('booking_ref')
                customer_name = pending.get('customer_name')
                
                # Approve the booking
                await db.bookings.update_one(
                    {"id": booking_id},
                    {"$set": {
                        "status": "confirmed",
                        "approved_by": "admin_sms",
                        "approved_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                # Get booking and send confirmation to customer
                booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
                if booking:
                    # Send customer confirmation
                    send_customer_confirmation(booking)
                    # Create calendar event
                    await create_calendar_event(booking)
                
                # Clear the pending approval
                await db.pending_approvals.delete_one({"admin_phone": admin_phone})
                
                logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Admin approved booking #{booking_ref} ({customer_name}) via SMS")
                
                # Send confirmation SMS back to admin
                try:
                    twilio_sid = os.environ.get('TWILIO_ACCOUNT_SID')
                    twilio_token = os.environ.get('TWILIO_AUTH_TOKEN')
                    twilio_from = os.environ.get('TWILIO_PHONE_NUMBER')
                    if twilio_sid and twilio_token:
                        client = Client(twilio_sid, twilio_token)
                        client.messages.create(
                            body=f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Booking #{booking_ref} for {customer_name} APPROVED! Customer confirmation sent.",
                            from_=twilio_from,
                            to=admin_phone
                        )
                except Exception as e:
                    logger.error(f"Failed to send admin confirmation SMS: {e}")
                
                return Response(content='<?xml version="1.0" encoding="UTF-8"?><Response></Response>', media_type="application/xml")
            else:
                logger.warning(f"Admin SMS approval received but no pending booking found")
                return Response(content='<?xml version="1.0" encoding="UTF-8"?><Response></Response>', media_type="application/xml")
        
        elif is_admin and message_body in ['NO', 'N', 'NOPE', 'DECLINE', 'REJECT', 'CANCEL', 'REJECTED']:
            # Admin is declining an urgent booking
            pending = await db.pending_approvals.find_one({"admin_phone": admin_phone}, {"_id": 0})
            
            if pending:
                booking_id = pending.get('booking_id')
                booking_ref = pending.get('booking_ref')
                customer_name = pending.get('customer_name')
                
                # Get booking details before rejecting
                booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
                
                # Reject/cancel the booking
                await db.bookings.update_one(
                    {"id": booking_id},
                    {"$set": {
                        "status": "cancelled",
                        "cancellationReason": "Declined by admin - unable to accommodate last-minute request",
                        "cancelled_by": "admin_sms",
                        "cancelled_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                # Send cancellation email to customer if booking exists
                if booking:
                    await send_cancellation_notifications(booking)
                
                # Clear the pending approval
                await db.pending_approvals.delete_one({"admin_phone": admin_phone})
                
                logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Admin declined booking #{booking_ref} ({customer_name}) via SMS")
                
                # Send confirmation SMS back to admin
                try:
                    twilio_sid = os.environ.get('TWILIO_ACCOUNT_SID')
                    twilio_token = os.environ.get('TWILIO_AUTH_TOKEN')
                    twilio_from = os.environ.get('TWILIO_PHONE_NUMBER')
                    if twilio_sid and twilio_token:
                        client = Client(twilio_sid, twilio_token)
                        client.messages.create(
                            body=f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Booking #{booking_ref} for {customer_name} DECLINED. Customer notified.",
                            from_=twilio_from,
                            to=admin_phone
                        )
                except Exception as e:
                    logger.error(f"Failed to send admin decline confirmation SMS: {e}")
                
                return Response(content='<?xml version="1.0" encoding="UTF-8"?><Response></Response>', media_type="application/xml")
        
        # Otherwise, check if this is a driver acknowledgment
        if message_body in ['YES', 'Y', 'YEP', 'CONFIRM', 'CONFIRMED', 'OK', 'OKAY', 'ACCEPTED']:
            # Normalize the phone number for matching
            normalized_phone = from_number.replace('+64', '0').replace(' ', '')
            if normalized_phone.startswith('64'):
                normalized_phone = '0' + normalized_phone[2:]
            
            # Find the driver by phone number
            driver = await db.drivers.find_one({
                "$or": [
                    {"phone": from_number},
                    {"phone": normalized_phone},
                    {"phone": from_number.replace('+64', '0')},
                    {"phone": {"$regex": normalized_phone[-9:] + "$"}}  # Match last 9 digits
                ]
            }, {"_id": 0})
            
            if driver:
                driver_id = driver.get('id')
                driver_name = driver.get('name', 'Unknown')
                
                # Find the most recent booking assigned to this driver that hasn't been acknowledged
                # Match by driver ID OR driver name (some bookings use different field names)
                booking = await db.bookings.find_one({
                    "$or": [
                        {"driver_id": driver_id, "driverAcknowledged": {"$ne": True}},
                        {"assignedDriver": driver_id, "driverAcknowledged": {"$ne": True}},
                        {"assignedDriverId": driver_id, "driverAcknowledged": {"$ne": True}},
                        {"return_driver_id": driver_id, "returnDriverAcknowledged": {"$ne": True}},
                        {"returnDriver": driver_id, "returnDriverAcknowledged": {"$ne": True}},
                        {"driver_name": driver_name, "driverAcknowledged": {"$ne": True}},
                        {"return_driver_name": driver_name, "returnDriverAcknowledged": {"$ne": True}}
                    ]
                }, {"_id": 0}, sort=[("createdAt", -1)])
                
                if booking:
                    booking_ref = get_booking_reference(booking)
                    update_fields = {"driverAcknowledgedAt": datetime.now(timezone.utc).isoformat()}
                    
                    # Determine which trip (outbound or return) was acknowledged
                    # Check all possible field name variations
                    is_outbound_driver = (
                        booking.get('driver_id') == driver_id or 
                        booking.get('assignedDriver') == driver_id or 
                        booking.get('assignedDriverId') == driver_id or
                        booking.get('driver_name') == driver_name
                    )
                    is_return_driver = (
                        booking.get('return_driver_id') == driver_id or 
                        booking.get('returnDriver') == driver_id or 
                        booking.get('return_driver_name') == driver_name
                    )
                    
                    if is_outbound_driver and not booking.get('driverAcknowledged'):
                        update_fields["driverAcknowledged"] = True
                        update_fields["driverConfirmed"] = True
                        update_fields["driverResponse"] = "Yes"
                        trip_type = "OUTBOUND"
                    elif is_return_driver and not booking.get('returnDriverAcknowledged'):
                        update_fields["returnDriverAcknowledged"] = True
                        trip_type = "RETURN"
                    else:
                        trip_type = "OUTBOUND"
                        update_fields["driverAcknowledged"] = True
                        update_fields["driverConfirmed"] = True
                        update_fields["driverResponse"] = "Yes"
                    
                    # Update THIS booking
                    await db.bookings.update_one(
                        {"id": booking.get('id')},
                        {"$set": update_fields}
                    )
                    
                    # ALSO update ALL other pending bookings for this driver (batch confirm)
                    # This makes it easier - one YES confirms all their pending jobs
                    batch_result = await db.bookings.update_many(
                        {
                            "$or": [
                                {"driver_id": driver_id, "driverAcknowledged": {"$ne": True}},
                                {"driver_name": driver_name, "driverAcknowledged": {"$ne": True}}
                            ]
                        },
                        {"$set": {
                            "driverAcknowledged": True,
                            "driverConfirmed": True,
                            "driverResponse": "Yes (batch)",
                            "driverAcknowledgedAt": datetime.now(timezone.utc).isoformat()
                        }}
                    )
                    
                    total_confirmed = 1 + batch_result.modified_count
                    logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Driver {driver_name} acknowledged {trip_type} trip for booking #{booking_ref} (+ {batch_result.modified_count} other bookings)")
                    
                    # Send confirmation SMS back to driver
                    try:
                        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
                        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
                        twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')
                        
                        if account_sid and auth_token and twilio_phone:
                            client = Client(account_sid, auth_token)
                            client.messages.create(
                                body=f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Thanks {driver_name}! Job #{booking_ref} confirmed. Customer: {booking.get('name')} on {format_date_ddmmyyyy(booking.get('date'))} at {booking.get('time')}",
                                from_=twilio_phone,
                                to=from_number
                            )
                    except Exception as sms_error:
                        logger.error(f"Failed to send acknowledgment confirmation: {str(sms_error)}")
                    
                    # Notify admin of driver acknowledgment
                    try:
                        admin_email = os.environ.get('ADMIN_EMAIL', 'bookings@bookaride.co.nz')
                        mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
                        mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
                        sender_email = os.environ.get('SENDER_EMAIL', 'noreply@mg.bookaride.co.nz')
                        
                        if mailgun_api_key and mailgun_domain:
                            html_content = f"""
                            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                                <div style="background: #22c55e; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
                                    <h2 style="margin: 0;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Driver Acknowledged Job</h2>
                                </div>
                                <div style="background: #f0fdf4; padding: 20px; border: 1px solid #86efac; border-top: none; border-radius: 0 0 8px 8px;">
                                    <p><strong>Driver:</strong> {driver_name}</p>
                                    <p><strong>Booking:</strong> #{booking_ref}</p>
                                    <p><strong>Trip Type:</strong> {trip_type}</p>
                                    <p><strong>Customer:</strong> {booking.get('name')}</p>
                                    <p><strong>Date:</strong> {format_date_ddmmyyyy(booking.get('date'))} at {booking.get('time')}</p>
                                    <p style="color: #16a34a; font-weight: bold;">Driver has confirmed receipt of this job assignment.</p>
                                </div>
                            </div>
                            """
                            
                            requests.post(
                                f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
                                auth=("api", mailgun_api_key),
                                data={
                                    "from": f"BookaRide System <{sender_email}>",
                                    "to": admin_email,
                                    "subject": f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Driver {driver_name} Acknowledged Job #{booking_ref}",
                                    "html": html_content
                                }
                            )
                    except Exception as email_error:
                        logger.error(f"Failed to notify admin of acknowledgment: {str(email_error)}")
                    
                    # Return TwiML response
                    return Response(
                        content='<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
                        media_type="application/xml"
                    )
                else:
                    logger.warning(f"No pending booking found for driver {driver_name}")
            else:
                logger.warning(f"No driver found with phone number: {from_number}")
        else:
            logger.info(f"SMS not an acknowledgment: {message_body}")
        
        # Return empty TwiML response
        return Response(
            content='<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
            media_type="application/xml"
        )
        
    except Exception as e:
        logger.error(f"Error processing Twilio SMS webhook: {str(e)}")
        return Response(
            content='<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
            media_type="application/xml"
        )


# ==================== LIVE GPS TRACKING ====================

import random
import string

def generate_tracking_ref(length=6):
    """Generate a short tracking reference for customer links"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


class LocationUpdate(BaseModel):
    lat: float
    lng: float
    heading: Optional[float] = None
    speed: Optional[float] = None
    accuracy: Optional[float] = None


class TrackingSessionCreate(BaseModel):
    bookingId: str
    bookingType: str = "regular"  # "regular" or "shuttle"


@api_router.post("/tracking/create")
async def create_tracking_session(data: TrackingSessionCreate, current_admin: dict = Depends(get_current_admin)):
    """
    Create a tracking session for a booking.
    Called by admin when assigning driver - sends SMS to driver with tracking start link.
    """
    try:
        # Get booking details
        if data.bookingType == "shuttle":
            booking = await db.shuttle_bookings.find_one({"id": data.bookingId}, {"_id": 0})
        else:
            booking = await db.bookings.find_one({"id": data.bookingId}, {"_id": 0})
        
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Get driver info
        driver_id = booking.get('assignedDriver') or booking.get('assignedDriverId')
        driver_name = booking.get('driver_name') or booking.get('assignedDriverName')
        
        if not driver_id and not driver_name:
            raise HTTPException(status_code=400, detail="No driver assigned to this booking")
        
        # Get driver phone
        driver = await db.drivers.find_one(
            {"$or": [{"id": driver_id}, {"name": driver_name}]},
            {"_id": 0}
        )
        driver_phone = driver.get('phone') if driver else None
        
        # Generate session ID and tracking ref
        session_id = str(uuid.uuid4())
        tracking_ref = generate_tracking_ref()
        
        # Create tracking session
        public_domain = os.environ.get('PUBLIC_DOMAIN', 'https://bookaride.co.nz')
        driver_link = f"{public_domain}/track/driver/{session_id}"
        customer_link = f"{public_domain}/track/{tracking_ref}"
        
        session = {
            "id": session_id,
            "trackingRef": tracking_ref,
            "bookingId": data.bookingId,
            "bookingType": data.bookingType,
            "driverId": driver_id,
            "driverName": driver_name or (driver.get('name') if driver else 'Driver'),
            "driverPhone": driver_phone,
            "customerName": booking.get('name'),
            "customerPhone": booking.get('phone'),
            "pickupAddress": booking.get('pickupAddress'),
            "dropoffAddress": booking.get('dropoffAddress', 'Auckland Airport'),
            "status": "pending",  # pending -> active -> completed
            "currentLocation": None,
            "driverLink": driver_link,
            "customerLink": customer_link,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "startedAt": None,
            "endedAt": None,
            "customerNotified": False
        }
        
        await db.tracking_sessions.insert_one(session)
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Tracking session created for booking {data.bookingId} - Ref: {tracking_ref}")
        
        return {
            "success": True,
            "sessionId": session_id,
            "trackingRef": tracking_ref,
            "driverLink": driver_link,
            "customerLink": customer_link
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating tracking session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating tracking session: {str(e)}")


@api_router.get("/tracking/driver/{session_id}")
async def get_driver_tracking_session(session_id: str):
    """
    Get tracking session details for driver page.
    No auth required - driver accesses via unique link from SMS.
    """
    try:
        session = await db.tracking_sessions.find_one({"id": session_id}, {"_id": 0})
        
        if not session:
            raise HTTPException(status_code=404, detail="Tracking session not found")
        
        if session.get('status') == 'completed':
            raise HTTPException(status_code=410, detail="Tracking session has ended")
        
        return {
            "sessionId": session['id'],
            "status": session['status'],
            "customerName": session.get('customerName'),
            "pickupAddress": session.get('pickupAddress'),
            "dropoffAddress": session.get('dropoffAddress'),
            "driverName": session.get('driverName')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting driver tracking session: {str(e)}")
        raise HTTPException(status_code=500, detail="Error loading tracking session")


@api_router.post("/tracking/driver/{session_id}/start")
async def start_driver_tracking(session_id: str):
    """
    Driver starts sharing their location.
    Automatically sends tracking link to customer via SMS.
    """
    try:
        session = await db.tracking_sessions.find_one({"id": session_id}, {"_id": 0})
        
        if not session:
            raise HTTPException(status_code=404, detail="Tracking session not found")
        
        if session.get('status') == 'completed':
            raise HTTPException(status_code=410, detail="Tracking session has ended")
        
        if session.get('status') == 'active':
            return {"success": True, "message": "Tracking already active"}
        
        # Update session to active
        await db.tracking_sessions.update_one(
            {"id": session_id},
            {"$set": {
                "status": "active",
                "startedAt": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Send tracking link to customer via SMS
        if not session.get('customerNotified'):
            customer_phone = session.get('customerPhone')
            if customer_phone:
                try:
                    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
                    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
                    twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')
                    
                    if account_sid and auth_token and twilio_phone:
                        twilio_client = Client(account_sid, auth_token)
                        formatted_phone = format_nz_phone(customer_phone)
                        
                        driver_name = session.get('driverName', 'Your driver')
                        customer_link = session.get('customerLink')
                        
                        sms_body = f"""ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â {driver_name} is on the way!

Track your driver live:
{customer_link}

See exactly when they'll arrive.

- BookaRide NZ"""
                        
                        twilio_client.messages.create(
                            body=sms_body,
                            from_=twilio_phone,
                            to=formatted_phone
                        )
                        
                        await db.tracking_sessions.update_one(
                            {"id": session_id},
                            {"$set": {"customerNotified": True}}
                        )
                        
                        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± Tracking link sent to customer: {formatted_phone}")
                        
                except Exception as sms_error:
                    logger.error(f"Error sending tracking SMS to customer: {sms_error}")
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Driver started tracking - Session: {session_id}")
        
        return {"success": True, "message": "Tracking started, customer notified"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting driver tracking: {str(e)}")
        raise HTTPException(status_code=500, detail="Error starting tracking")


@api_router.post("/tracking/driver/{session_id}/location")
async def update_driver_location(session_id: str, location: LocationUpdate):
    """
    Driver sends location update.
    Called every few seconds from driver's browser.
    """
    try:
        session = await db.tracking_sessions.find_one({"id": session_id}, {"_id": 0})
        
        if not session:
            raise HTTPException(status_code=404, detail="Tracking session not found")
        
        if session.get('status') == 'completed':
            raise HTTPException(status_code=410, detail="Tracking session has ended")
        
        # Update location
        location_data = {
            "lat": location.lat,
            "lng": location.lng,
            "heading": location.heading,
            "speed": location.speed,
            "accuracy": location.accuracy,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await db.tracking_sessions.update_one(
            {"id": session_id},
            {"$set": {
                "currentLocation": location_data,
                "status": "active"  # Ensure status is active
            }}
        )
        
        return {"success": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating driver location: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating location")


@api_router.post("/tracking/driver/{session_id}/stop")
async def stop_driver_tracking(session_id: str):
    """Driver stops sharing location."""
    try:
        result = await db.tracking_sessions.update_one(
            {"id": session_id},
            {"$set": {
                "status": "completed",
                "endedAt": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Tracking session not found")
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Driver stopped tracking - Session: {session_id}")
        
        return {"success": True, "message": "Tracking stopped"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error stopping driver tracking: {str(e)}")
        raise HTTPException(status_code=500, detail="Error stopping tracking")


@api_router.get("/tracking/{tracking_ref}")
async def get_customer_tracking(tracking_ref: str):
    """
    Customer views driver location.
    No auth required - accessed via unique tracking ref from SMS.
    """
    try:
        session = await db.tracking_sessions.find_one({"trackingRef": tracking_ref}, {"_id": 0})
        
        if not session:
            raise HTTPException(status_code=404, detail="Tracking not found")
        
        # Calculate ETA if we have location
        eta_minutes = None
        if session.get('currentLocation') and session.get('pickupAddress'):
            google_api_key = os.environ.get('GOOGLE_MAPS_API_KEY', '')
            if google_api_key and session['currentLocation'].get('lat'):
                try:
                    origin = f"{session['currentLocation']['lat']},{session['currentLocation']['lng']}"
                    destination = session['pickupAddress']
                    
                    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
                    params = {
                        'origins': origin,
                        'destinations': destination,
                        'key': google_api_key
                    }
                    response = requests.get(url, params=params)
                    data = response.json()
                    
                    if data['status'] == 'OK' and data['rows']:
                        element = data['rows'][0]['elements'][0]
                        if element['status'] == 'OK':
                            eta_minutes = element['duration']['value'] // 60
                except Exception as eta_error:
                    logger.error(f"Error calculating ETA: {eta_error}")
        
        return {
            "trackingRef": tracking_ref,
            "status": session.get('status', 'pending'),
            "driverName": session.get('driverName'),
            "pickupAddress": session.get('pickupAddress'),
            "dropoffAddress": session.get('dropoffAddress'),
            "currentLocation": session.get('currentLocation'),
            "etaMinutes": eta_minutes,
            "customerName": session.get('customerName')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting customer tracking: {str(e)}")
        raise HTTPException(status_code=500, detail="Error loading tracking")


@api_router.post("/tracking/send-driver-link/{booking_id}")
async def send_tracking_link_to_driver(booking_id: str, current_admin: dict = Depends(get_current_admin)):
    """
    Create tracking session and send link to driver.
    One-click action from admin panel.
    Only allows sending for bookings happening today or tomorrow (NZ time).
    """
    try:
        # Get booking
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        booking_type = "regular"
        
        if not booking:
            booking = await db.shuttle_bookings.find_one({"id": booking_id}, {"_id": 0})
            booking_type = "shuttle"
        
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # SAFEGUARD: Only allow tracking links for bookings happening today or tomorrow
        booking_date = booking.get('date', '')
        if booking_date:
            nz_tz = pytz.timezone('Pacific/Auckland')
            nz_now = datetime.now(nz_tz)
            today = nz_now.strftime('%Y-%m-%d')
            tomorrow = (nz_now + timedelta(days=1)).strftime('%Y-%m-%d')
            
            if booking_date not in [today, tomorrow]:
                customer_name = booking.get('name', 'Customer')
                raise HTTPException(
                    status_code=400, 
                    detail=f"Cannot send tracking link for {customer_name}'s booking on {booking_date}. Tracking links can only be sent for today ({today}) or tomorrow ({tomorrow})."
                )
        
        # Get driver info
        driver_id = booking.get('assignedDriver') or booking.get('assignedDriverId')
        driver_name = booking.get('driver_name') or booking.get('assignedDriverName')
        
        if not driver_id and not driver_name:
            raise HTTPException(status_code=400, detail="No driver assigned to this booking")
        
        # Get driver details
        driver = await db.drivers.find_one(
            {"$or": [{"id": driver_id}, {"name": driver_name}]},
            {"_id": 0}
        )
        
        if not driver or not driver.get('phone'):
            raise HTTPException(status_code=400, detail="Driver phone not found")
        
        # Check for existing active session
        existing_session = await db.tracking_sessions.find_one({
            "bookingId": booking_id,
            "status": {"$ne": "completed"}
        }, {"_id": 0})
        
        if existing_session:
            # Resend the existing link
            session_id = existing_session['id']
            tracking_ref = existing_session['trackingRef']
            driver_link = existing_session['driverLink']
        else:
            # Create new session
            session_id = str(uuid.uuid4())
            tracking_ref = generate_tracking_ref()
            public_domain = os.environ.get('PUBLIC_DOMAIN', 'https://bookaride.co.nz')
            driver_link = f"{public_domain}/track/driver/{session_id}"
            customer_link = f"{public_domain}/track/{tracking_ref}"
            
            session = {
                "id": session_id,
                "trackingRef": tracking_ref,
                "bookingId": booking_id,
                "bookingType": booking_type,
                "driverId": driver_id or driver.get('id'),
                "driverName": driver_name or driver.get('name'),
                "driverPhone": driver.get('phone'),
                "customerName": booking.get('name'),
                "customerPhone": booking.get('phone'),
                "pickupAddress": booking.get('pickupAddress'),
                "dropoffAddress": booking.get('dropoffAddress', 'Auckland Airport'),
                "status": "pending",
                "currentLocation": None,
                "driverLink": driver_link,
                "customerLink": customer_link,
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "startedAt": None,
                "endedAt": None,
                "customerNotified": False
            }
            
            await db.tracking_sessions.insert_one(session)
        
        # Send SMS to driver with tracking link
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')
        
        if account_sid and auth_token and twilio_phone:
            twilio_client = Client(account_sid, auth_token)
            formatted_phone = format_nz_phone(driver.get('phone'))
            
            booking_ref = get_booking_reference(booking)
            customer_name = booking.get('name', 'Customer')
            pickup = booking.get('pickupAddress', 'N/A')
            
            sms_body = f"""ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â SHARE YOUR LOCATION
            
Job: {booking_ref}
Customer: {customer_name}
Pickup: {pickup}

When ready to drive, tap here to share your live location with the customer:

{driver_link}

Customer will be auto-notified when you start.

- BookaRide"""
            
            twilio_client.messages.create(
                body=sms_body,
                from_=twilio_phone,
                to=formatted_phone
            )
            
            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± Tracking link sent to driver {driver.get('name')} at {formatted_phone}")
            
            # Update booking with tracking info
            collection = db.shuttle_bookings if booking_type == "shuttle" else db.bookings
            await collection.update_one(
                {"id": booking_id},
                {"$set": {
                    "trackingSessionId": session_id,
                    "trackingRef": tracking_ref,
                    "trackingLinkSent": True,
                    "trackingLinkSentAt": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            return {
                "success": True,
                "message": f"Tracking link sent to {driver.get('name')}",
                "sessionId": session_id,
                "trackingRef": tracking_ref
            }
        else:
            raise HTTPException(status_code=500, detail="Twilio not configured")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending tracking link to driver: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# ==================== SHARED SHUTTLE SERVICE ====================

# Shuttle pricing tiers - $200 minimum per run
SHUTTLE_PRICING = {
    1: 100, 2: 100,  # $100 each = $100-200 total
    3: 70,           # $70 each = $210 total
    4: 55,           # $55 each = $220 total
    5: 45,           # $45 each = $225 total
    6: 40,           # $40 each = $240 total
    7: 35,           # $35 each = $245 total
    8: 32,           # $32 each = $256 total
    9: 30,           # $30 each = $270 total
    10: 28,          # $28 each = $280 total
    11: 25,          # $25 each = $275+ total
}

# Departure times (6am - 10pm, every 2 hours)
SHUTTLE_TIMES = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']

def get_shuttle_price(total_passengers: int) -> int:
    """Get price per person based on total passengers"""
    if total_passengers >= 11:
        return 25
    return SHUTTLE_PRICING.get(total_passengers, 100)


class ShuttleBookingCreate(BaseModel):
    date: str
    departureTime: str
    pickupAddress: str
    passengers: int
    name: str
    email: str
    phone: str
    notes: Optional[str] = ""
    flightNumber: Optional[str] = ""
    estimatedPrice: Optional[int] = 100
    needsApproval: Optional[bool] = False


@api_router.get("/shuttle/availability")
async def get_shuttle_availability(date: str, time: str = None):
    """Get shuttle availability and current bookings for a date"""
    try:
        # Get all shuttle bookings for this date
        query = {"date": date, "bookingType": "shuttle", "status": {"$nin": ["cancelled", "deleted"]}}
        bookings = await db.shuttle_bookings.find(query, {"_id": 0}).to_list(100)
        
        # Build availability by departure time
        departures = {}
        for dep_time in SHUTTLE_TIMES:
            time_bookings = [b for b in bookings if b.get("departureTime") == dep_time]
            total_passengers = sum(b.get("passengers", 0) for b in time_bookings)
            departures[dep_time] = {
                "passengers": total_passengers,
                "bookings": len(time_bookings),
                "available": total_passengers < 11,
                "pricePerPerson": get_shuttle_price(total_passengers + 1) if total_passengers < 11 else None
            }
        
        # If specific time requested, return details for that
        current_passengers = 0
        if time and time in departures:
            current_passengers = departures[time]["passengers"]
        
        return {
            "date": date,
            "departures": departures,
            "currentPassengers": current_passengers
        }
    except Exception as e:
        logger.error(f"Error getting shuttle availability: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/shuttle/book")
async def create_shuttle_booking(booking: ShuttleBookingCreate):
    """Create a new shuttle booking with card authorization (not charge)"""
    try:
        # Validate departure time
        if booking.departureTime not in SHUTTLE_TIMES:
            raise HTTPException(status_code=400, detail="Invalid departure time")
        
        # Check availability
        existing = await db.shuttle_bookings.find({
            "date": booking.date,
            "departureTime": booking.departureTime,
            "status": {"$nin": ["cancelled", "deleted"]}
        }, {"_id": 0}).to_list(100)
        
        current_passengers = sum(b.get("passengers", 0) for b in existing)
        if current_passengers + booking.passengers > 11:
            raise HTTPException(status_code=400, detail="Not enough seats available for this departure")
        
        # Calculate price based on total passengers after this booking
        total_after = current_passengers + booking.passengers
        price_per_person = get_shuttle_price(total_after)
        total_price = price_per_person * booking.passengers
        
        # Create booking record
        booking_id = str(uuid.uuid4())
        shuttle_booking = {
            "id": booking_id,
            "bookingType": "shuttle",
            "date": booking.date,
            "departureTime": booking.departureTime,
            "pickupAddress": booking.pickupAddress,
            "dropoffAddress": "Auckland International Airport",
            "passengers": booking.passengers,
            "name": booking.name,
            "email": booking.email,
            "phone": booking.phone,
            "notes": booking.notes,
            "flightNumber": booking.flightNumber,
            "estimatedPrice": price_per_person,
            "finalPrice": None,  # Set when charged at airport
            "totalEstimated": total_price,
            "status": "pending_approval" if booking.needsApproval else "authorized",
            "paymentStatus": "pending_authorization",
            "stripePaymentIntentId": None,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "chargedAt": None,
            "needsApproval": booking.needsApproval
        }
        
        # Create Stripe Payment Intent with manual capture (authorize but don't charge)
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        if stripe_api_key:
            import stripe
            stripe.api_key = stripe_api_key
            
            # Create a Checkout Session for card authorization
            # Apple Pay and Google Pay work through 'card' + Payment Request API
            public_domain = os.environ.get('PUBLIC_DOMAIN', 'https://bookaride.co.nz')
            
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card', 'link'],  # card enables Apple Pay/Google Pay
                mode='payment',
                payment_intent_data={
                    'capture_method': 'manual',  # Authorize but don't charge
                    'metadata': {
                        'booking_id': booking_id,
                        'booking_type': 'shuttle',
                        'passengers': str(booking.passengers),
                        'date': booking.date,
                        'time': booking.departureTime
                    }
                },
                line_items=[{
                    'price_data': {
                        'currency': 'nzd',
                        'product_data': {
                            'name': f'Shared Shuttle - {booking.date} {booking.departureTime}',
                            'description': f'{booking.passengers} passenger(s) - CBD to Auckland Airport. Card authorized, charged on arrival.',
                        },
                        'unit_amount': int(total_price * 100),  # Amount in cents
                    },
                    'quantity': 1,
                }],
                customer_email=booking.email,
                success_url=f"{public_domain}/payment-success?type=shuttle&booking_id={booking_id}",
                cancel_url=f"{public_domain}/shared-shuttle?cancelled=true",
                metadata={
                    'booking_id': booking_id,
                    'booking_type': 'shuttle'
                }
            )
            
            shuttle_booking["stripeCheckoutSessionId"] = checkout_session.id
            
            # Save booking
            await db.shuttle_bookings.insert_one(shuttle_booking)
            
            logger.info(f"Shuttle booking created: {booking_id} for {booking.date} {booking.departureTime}")
            
            return {
                "success": True,
                "bookingId": booking_id,
                "checkoutUrl": checkout_session.url,
                "estimatedPrice": price_per_person,
                "totalEstimated": total_price
            }
        else:
            # No Stripe - just save the booking
            await db.shuttle_bookings.insert_one(shuttle_booking)
            return {
                "success": True,
                "bookingId": booking_id,
                "message": "Booking created - payment will be collected on arrival"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating shuttle booking: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/shuttle/capture/{booking_id}")
async def capture_shuttle_payment(booking_id: str, current_admin: dict = Depends(get_current_admin)):
    """Capture (charge) the authorized payment when shuttle reaches airport"""
    try:
        booking = await db.shuttle_bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        if booking.get("paymentStatus") == "captured":
            raise HTTPException(status_code=400, detail="Payment already captured")
        
        # Get current total passengers for this departure to calculate final price
        all_bookings = await db.shuttle_bookings.find({
            "date": booking["date"],
            "departureTime": booking["departureTime"],
            "status": {"$nin": ["cancelled", "deleted"]}
        }, {"_id": 0}).to_list(100)
        
        total_passengers = sum(b.get("passengers", 0) for b in all_bookings)
        final_price_per_person = get_shuttle_price(total_passengers)
        final_total = final_price_per_person * booking["passengers"]
        
        # Capture the Stripe payment
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        if stripe_api_key and booking.get("stripePaymentIntentId"):
            import stripe
            stripe.api_key = stripe_api_key
            
            # Get the payment intent
            payment_intent = stripe.PaymentIntent.retrieve(booking["stripePaymentIntentId"])
            
            # Capture with the final amount (may be different from authorized amount)
            captured = stripe.PaymentIntent.capture(
                booking["stripePaymentIntentId"],
                amount_to_capture=int(final_total * 100)  # In cents
            )
            
            # Update booking
            await db.shuttle_bookings.update_one(
                {"id": booking_id},
                {"$set": {
                    "paymentStatus": "captured",
                    "finalPrice": final_price_per_person,
                    "totalCharged": final_total,
                    "chargedAt": datetime.now(timezone.utc).isoformat(),
                    "status": "completed"
                }}
            )
            
            logger.info(f"Shuttle payment captured: {booking_id} - ${final_total}")
            
            return {
                "success": True,
                "finalPricePerPerson": final_price_per_person,
                "totalCharged": final_total,
                "totalPassengers": total_passengers
            }
        else:
            # Manual capture (no Stripe)
            await db.shuttle_bookings.update_one(
                {"id": booking_id},
                {"$set": {
                    "paymentStatus": "manual",
                    "finalPrice": final_price_per_person,
                    "totalCharged": final_total,
                    "chargedAt": datetime.now(timezone.utc).isoformat(),
                    "status": "completed"
                }}
            )
            return {
                "success": True,
                "finalPricePerPerson": final_price_per_person,
                "totalCharged": final_total,
                "message": "Marked as manually captured"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error capturing shuttle payment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/shuttle/departures")
async def get_shuttle_departures(date: str, current_admin: dict = Depends(get_current_admin)):
    """Get all shuttle departures for a date (admin view)"""
    try:
        bookings = await db.shuttle_bookings.find({
            "date": date,
            "status": {"$nin": ["deleted"]}
        }, {"_id": 0}).to_list(100)
        
        # Group by departure time
        departures = {}
        for dep_time in SHUTTLE_TIMES:
            time_bookings = [b for b in bookings if b.get("departureTime") == dep_time]
            total_passengers = sum(b.get("passengers", 0) for b in time_bookings)
            
            departures[dep_time] = {
                "time": dep_time,
                "bookings": time_bookings,
                "totalPassengers": total_passengers,
                "pricePerPerson": get_shuttle_price(total_passengers) if total_passengers > 0 else 100,
                "totalRevenue": sum(b.get("totalEstimated", 0) for b in time_bookings),
                "canRun": total_passengers >= 1
            }
        
        # Get assigned driver info from shuttle_runs collection
        shuttle_runs = await db.shuttle_runs.find({"date": date}, {"_id": 0}).to_list(100)
        for run in shuttle_runs:
            dep_time = run.get("departureTime")
            if dep_time in departures:
                departures[dep_time]["assignedDriverId"] = run.get("driverId")
                departures[dep_time]["assignedDriverName"] = run.get("driverName")
                departures[dep_time]["shuttleStatus"] = run.get("status")
        
        return {
            "date": date,
            "departures": departures
        }
    except Exception as e:
        logger.error(f"Error getting shuttle departures: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/shuttle/capture-all/{date}/{time}")
async def capture_all_shuttle_payments(date: str, time: str, current_admin: dict = Depends(get_current_admin)):
    """Capture all payments for a shuttle departure (when arriving at airport)"""
    try:
        bookings = await db.shuttle_bookings.find({
            "date": date,
            "departureTime": time,
            "status": {"$nin": ["cancelled", "deleted"]},
            "paymentStatus": {"$ne": "captured"}
        }, {"_id": 0}).to_list(100)
        
        total_passengers = sum(b.get("passengers", 0) for b in bookings)
        final_price = get_shuttle_price(total_passengers)
        
        results = []
        for booking in bookings:
            try:
                # Capture each booking
                result = await capture_shuttle_payment(booking["id"], current_admin)
                results.append({"id": booking["id"], "success": True, **result})
            except Exception as e:
                results.append({"id": booking["id"], "success": False, "error": str(e)})
        
        return {
            "date": date,
            "time": time,
            "totalPassengers": total_passengers,
            "finalPricePerPerson": final_price,
            "results": results
        }
    except Exception as e:
        logger.error(f"Error capturing all shuttle payments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/shuttle/route/{date}/{time}")
async def get_optimized_shuttle_route(date: str, time: str, current_admin: dict = Depends(get_current_admin)):
    """Get optimized pickup route for a shuttle departure with Google Maps link"""
    try:
        bookings = await db.shuttle_bookings.find({
            "date": date,
            "departureTime": time,
            "status": {"$nin": ["cancelled", "deleted"]}
        }, {"_id": 0}).to_list(100)
        
        if not bookings:
            raise HTTPException(status_code=404, detail="No bookings for this departure")
        
        # Get all pickup addresses
        pickup_addresses = [b["pickupAddress"] for b in bookings if b.get("pickupAddress")]
        
        if not pickup_addresses:
            raise HTTPException(status_code=400, detail="No pickup addresses found")
        
        # Use Google Maps Directions API to optimize route
        google_api_key = os.environ.get('GOOGLE_MAPS_API_KEY', '')
        
        # Destination is Auckland Airport
        destination = "Auckland International Airport, New Zealand"
        
        if google_api_key and len(pickup_addresses) > 1:
            # Use Directions API with waypoint optimization
            url = "https://maps.googleapis.com/maps/api/directions/json"
            
            # First pickup as origin, rest as waypoints, optimize order
            origin = pickup_addresses[0]
            waypoints = "|".join(pickup_addresses[1:]) if len(pickup_addresses) > 1 else ""
            
            params = {
                'origin': origin,
                'destination': destination,
                'waypoints': f"optimize:true|{waypoints}" if waypoints else "",
                'key': google_api_key
            }
            
            response = requests.get(url, params=params)
            data = response.json()
            
            if data['status'] == 'OK' and data['routes']:
                route = data['routes'][0]
                optimized_order = route.get('waypoint_order', [])
                
                # Reorder pickups based on optimization
                if optimized_order:
                    reordered = [pickup_addresses[0]]  # Keep first as origin
                    for idx in optimized_order:
                        reordered.append(pickup_addresses[idx + 1])
                    pickup_addresses = reordered
                
                # Calculate total distance and duration
                total_distance = sum(leg['distance']['value'] for leg in route['legs'])
                total_duration = sum(leg['duration']['value'] for leg in route['legs'])
                
                route_info = {
                    "totalDistanceKm": round(total_distance / 1000, 1),
                    "totalDurationMins": round(total_duration / 60),
                    "legs": [{
                        "from": leg['start_address'],
                        "to": leg['end_address'],
                        "distance": leg['distance']['text'],
                        "duration": leg['duration']['text']
                    } for leg in route['legs']]
                }
            else:
                route_info = {"error": "Could not optimize route"}
        else:
            route_info = {"note": "Single pickup - no optimization needed"}
        
        # Build Google Maps URL for driver's phone
        waypoints_encoded = "|".join(pickup_addresses[1:]) if len(pickup_addresses) > 1 else ""
        if waypoints_encoded:
            maps_url = f"https://www.google.com/maps/dir/?api=1&origin={requests.utils.quote(pickup_addresses[0])}&destination={requests.utils.quote(destination)}&waypoints={requests.utils.quote(waypoints_encoded)}&travelmode=driving"
        else:
            maps_url = f"https://www.google.com/maps/dir/?api=1&origin={requests.utils.quote(pickup_addresses[0])}&destination={requests.utils.quote(destination)}&travelmode=driving"
        
        # Build pickup list with passenger details
        pickup_list = []
        for booking in bookings:
            pickup_list.append({
                "address": booking["pickupAddress"],
                "name": booking["name"],
                "phone": booking["phone"],
                "passengers": booking["passengers"],
                "notes": booking.get("notes", ""),
                "flightNumber": booking.get("flightNumber", "")
            })
        
        return {
            "date": date,
            "departureTime": time,
            "totalPassengers": sum(b["passengers"] for b in bookings),
            "totalBookings": len(bookings),
            "optimizedPickups": pickup_addresses,
            "pickupDetails": pickup_list,
            "routeInfo": route_info,
            "googleMapsUrl": maps_url,
            "destination": destination
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting shuttle route: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/shuttle/send-route/{date}/{time}")
async def send_shuttle_route_to_driver(
    date: str, 
    time: str, 
    driver_phone: str = None,
    current_admin: dict = Depends(get_current_admin)
):
    """Send the optimized route to driver's phone via SMS"""
    try:
        # Get the route
        route_data = await get_optimized_shuttle_route(date, time, current_admin)
        
        # Build SMS message
        pickup_summary = "\n".join([
            f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ {p['name']} ({p['passengers']}pax) - {p['address'][:30]}..."
            for p in route_data["pickupDetails"][:5]
        ])
        
        message = f"""ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â SHUTTLE {date} {time}
{route_data['totalPassengers']} passengers, {route_data['totalBookings']} pickups

{pickup_summary}

ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ROUTE: {route_data['googleMapsUrl']}"""
        
        # Send SMS if phone provided
        if driver_phone:
            twilio_sid = os.environ.get('TWILIO_ACCOUNT_SID')
            twilio_token = os.environ.get('TWILIO_AUTH_TOKEN')
            twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')
            
            if twilio_sid and twilio_token and twilio_phone:
                twilio_client = Client(twilio_sid, twilio_token)
                formatted_phone = format_nz_phone(driver_phone)
                
                twilio_client.messages.create(
                    body=message,
                    from_=twilio_phone,
                    to=formatted_phone
                )
                
                logger.info(f"Shuttle route sent to driver: {formatted_phone}")
                return {"success": True, "message": "Route sent to driver", "googleMapsUrl": route_data['googleMapsUrl']}
        
        return {
            "success": True,
            "message": message,
            "googleMapsUrl": route_data['googleMapsUrl']
        }
        
    except Exception as e:
        logger.error(f"Error sending shuttle route: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== DRIVER GPS TRACKING FOR SHUTTLE ====================

# Craig Canty's driver ID (testing phase only)
ALLOWED_SHUTTLE_DRIVER_ID = "5a78ccb4-a2cb-4bcb-80a7-eb6a4364cee8"

class DriverLocationUpdate(BaseModel):
    driverId: str
    latitude: float
    longitude: float
    date: str
    departureTime: str
    notifiedPickups: Optional[List[str]] = []


@api_router.get("/shuttle/driver/departures")
async def get_driver_shuttle_departures(date: str, current_driver: dict = Depends(get_current_driver)):
    """Get shuttle departures for a driver (same as admin but accessible to driver)"""
    try:
        # Only allow Craig Canty during testing
        if current_driver.get("id") != ALLOWED_SHUTTLE_DRIVER_ID:
            raise HTTPException(status_code=403, detail="Shuttle tracking not enabled for this driver")
        
        bookings = await db.shuttle_bookings.find({
            "date": date,
            "status": {"$nin": ["deleted", "cancelled"]}
        }, {"_id": 0}).to_list(100)
        
        # Group by departure time
        departures = {}
        for dep_time in SHUTTLE_TIMES:
            time_bookings = [b for b in bookings if b.get("departureTime") == dep_time]
            total_passengers = sum(b.get("passengers", 0) for b in time_bookings)
            
            departures[dep_time] = {
                "time": dep_time,
                "bookings": time_bookings,
                "totalPassengers": total_passengers
            }
        
        return {"date": date, "departures": departures}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting driver shuttles: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/shuttle/driver/location")
async def update_driver_location(location: DriverLocationUpdate, current_driver: dict = Depends(get_current_driver)):
    """
    Update driver's GPS location and calculate ETAs to pickups.
    Auto-sends SMS to customers when driver is ~5 minutes away.
    """
    try:
        # Only allow Craig Canty during testing
        if current_driver.get("id") != ALLOWED_SHUTTLE_DRIVER_ID:
            raise HTTPException(status_code=403, detail="Shuttle tracking not enabled for this driver")
        
        # Get bookings for this departure
        bookings = await db.shuttle_bookings.find({
            "date": location.date,
            "departureTime": location.departureTime,
            "status": {"$nin": ["deleted", "cancelled"]}
        }, {"_id": 0}).to_list(100)
        
        if not bookings:
            return {"etas": {}, "newlyNotified": []}
        
        # Use Google Maps Distance Matrix API to calculate ETAs
        google_api_key = os.environ.get('GOOGLE_MAPS_API_KEY', '')
        etas = {}
        newly_notified = []
        
        driver_location = f"{location.latitude},{location.longitude}"
        
        # Get all pickup addresses
        destinations = [b["pickupAddress"] for b in bookings]
        
        if google_api_key and destinations:
            try:
                # Call Distance Matrix API
                url = "https://maps.googleapis.com/maps/api/distancematrix/json"
                params = {
                    'origins': driver_location,
                    'destinations': '|'.join(destinations),
                    'mode': 'driving',
                    'key': google_api_key
                }
                
                response = requests.get(url, params=params)
                data = response.json()
                
                if data['status'] == 'OK' and data['rows']:
                    elements = data['rows'][0]['elements']
                    
                    for idx, (booking, element) in enumerate(zip(bookings, elements)):
                        if element['status'] == 'OK':
                            duration_seconds = element['duration']['value']
                            duration_minutes = round(duration_seconds / 60)
                            
                            etas[booking['id']] = {
                                'minutes': duration_minutes,
                                'text': element['duration']['text'],
                                'distance': element['distance']['text']
                            }
                            
                            # Check if we should send "arriving soon" SMS (5 mins or less)
                            if duration_minutes <= 5 and booking['id'] not in location.notifiedPickups:
                                # Send SMS to customer
                                send_arriving_soon_sms(booking, duration_minutes, current_driver.get("name", "Your driver"))
                                newly_notified.append(booking['id'])
                                
                                # Mark as notified in database
                                await db.shuttle_bookings.update_one(
                                    {"id": booking['id']},
                                    {"$set": {"arrivingSoonSent": True, "arrivingSoonSentAt": datetime.now(timezone.utc).isoformat()}}
                                )
                                logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± Arriving soon SMS sent to {booking['name']} at {booking['phone']}")
                        else:
                            etas[booking['id']] = {'minutes': None, 'error': element['status']}
                            
            except Exception as api_error:
                logger.error(f"Google Maps API error: {str(api_error)}")
        
        # Store driver's last known location
        await db.driver_locations.update_one(
            {"driverId": location.driverId, "date": location.date, "departureTime": location.departureTime},
            {"$set": {
                "latitude": location.latitude,
                "longitude": location.longitude,
                "updatedAt": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        
        return {
            "etas": etas,
            "newlyNotified": newly_notified,
            "trackingActive": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating driver location: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def send_arriving_soon_sms(booking: dict, eta_minutes: int, driver_name: str):
    """Send 'arriving soon' SMS to customer"""
    try:
        twilio_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        twilio_token = os.environ.get('TWILIO_AUTH_TOKEN')
        twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')
        
        if not all([twilio_sid, twilio_token, twilio_phone]):
            logger.warning("Twilio not configured - skipping arriving soon SMS")
            return False
        
        customer_phone = booking.get('phone', '')
        if not customer_phone:
            return False
        
        # Format phone number
        formatted_phone = format_nz_phone(customer_phone)
        
        # Build message
        message = f"""ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Your Book A Ride shuttle is arriving in ~{eta_minutes} minutes!

Please be ready at:
ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â {booking.get('pickupAddress', 'your pickup location')}

Driver: {driver_name}
Passengers: {booking.get('passengers', 1)}

See you soon! ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡"""
        
        # Send SMS
        twilio_client = Client(twilio_sid, twilio_token)
        twilio_client.messages.create(
            body=message,
            from_=twilio_phone,
            to=formatted_phone
        )
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Arriving soon SMS sent to {booking.get('name')} at {formatted_phone}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending arriving soon SMS: {str(e)}")
        return False


@api_router.post("/shuttle/start/{date}/{time}")
async def start_shuttle_run(date: str, time: str, current_admin: dict = Depends(get_current_admin)):
    """
    Start a shuttle run - calculates optimized route and schedules 
    'arriving soon' SMS for each customer 5 minutes before their pickup.
    
    No driver GPS needed - uses estimated journey times from Google Maps.
    """
    try:
        # Get all bookings for this departure
        bookings = await db.shuttle_bookings.find({
            "date": date,
            "departureTime": time,
            "status": {"$nin": ["deleted", "cancelled"]}
        }, {"_id": 0}).to_list(100)
        
        if not bookings:
            raise HTTPException(status_code=404, detail="No bookings for this departure")
        
        # Get pickup addresses in order
        pickup_addresses = [b["pickupAddress"] for b in bookings]
        destination = "Auckland International Airport, New Zealand"
        
        google_api_key = os.environ.get('GOOGLE_MAPS_API_KEY', '')
        
        schedule = []
        cumulative_time = 0  # Minutes from start
        
        # Parse departure time
        dep_hour, dep_min = map(int, time.split(':'))
        from datetime import datetime, timedelta, timezone
        
        # Get NZ timezone
        import pytz
        nz_tz = pytz.timezone('Pacific/Auckland')
        
        # Build the departure datetime
        year, month, day = map(int, date.split('-'))
        departure_dt = nz_tz.localize(datetime(year, month, day, dep_hour, dep_min, 0))
        
        # Calculate ETAs using Google Maps Directions API with optimized route
        if google_api_key and len(pickup_addresses) > 0:
            # Get optimized route
            url = "https://maps.googleapis.com/maps/api/directions/json"
            
            origin = pickup_addresses[0]
            waypoints = "|".join(pickup_addresses[1:]) if len(pickup_addresses) > 1 else ""
            
            params = {
                'origin': origin,
                'destination': destination,
                'waypoints': f"optimize:true|{waypoints}" if waypoints else "",
                'key': google_api_key,
                'departure_time': 'now'
            }
            
            response = requests.get(url, params=params)
            data = response.json()
            
            if data['status'] == 'OK' and data['routes']:
                route = data['routes'][0]
                legs = route['legs']
                optimized_order = route.get('waypoint_order', list(range(len(pickup_addresses) - 1)))
                
                # Reorder bookings based on optimized route
                if len(pickup_addresses) > 1:
                    first_booking = bookings[0]
                    reordered_bookings = [first_booking]
                    for idx in optimized_order:
                        reordered_bookings.append(bookings[idx + 1])
                    bookings = reordered_bookings
                
                # Calculate notification times for each pickup
                cumulative_minutes = 0
                
                for idx, booking in enumerate(bookings):
                    # Time to reach this pickup from previous point
                    if idx < len(legs):
                        leg_duration = legs[idx]['duration']['value'] // 60  # Convert to minutes
                    else:
                        leg_duration = 0
                    
                    cumulative_minutes += leg_duration
                    
                    # Notify 5 minutes before arrival
                    notify_minutes_before = max(0, cumulative_minutes - 5)
                    notify_dt = departure_dt + timedelta(minutes=notify_minutes_before)
                    
                    # Schedule the notification
                    schedule.append({
                        'bookingId': booking['id'],
                        'name': booking['name'],
                        'phone': booking['phone'],
                        'address': booking['pickupAddress'],
                        'etaMinutes': cumulative_minutes,
                        'notifyAt': notify_dt.strftime('%H:%M'),
                        'notifyTimestamp': notify_dt.isoformat()
                    })
                    
                    # Store schedule in database
                    await db.shuttle_bookings.update_one(
                        {"id": booking['id']},
                        {"$set": {
                            "scheduledNotifyAt": notify_dt.isoformat(),
                            "etaFromStart": cumulative_minutes,
                            "shuttleStarted": True,
                            "shuttleStartedAt": datetime.now(timezone.utc).isoformat()
                        }}
                    )
        else:
            # Fallback: estimate 5 minutes between each pickup
            for idx, booking in enumerate(bookings):
                cumulative_minutes = idx * 5
                notify_minutes = max(0, cumulative_minutes - 5) if idx > 0 else 0
                notify_dt = departure_dt + timedelta(minutes=notify_minutes)
                
                schedule.append({
                    'bookingId': booking['id'],
                    'name': booking['name'],
                    'etaMinutes': cumulative_minutes,
                    'notifyAt': notify_dt.strftime('%H:%M')
                })
        
        # Schedule the SMS notifications using APScheduler
        from apscheduler.triggers.date import DateTrigger
        
        scheduled_count = 0
        for item in schedule:
            try:
                notify_dt = datetime.fromisoformat(item.get('notifyTimestamp', ''))
                
                # Only schedule if notification time is in the future
                now = datetime.now(nz_tz)
                if notify_dt > now:
                    # Get booking for SMS
                    booking = await db.shuttle_bookings.find_one({"id": item['bookingId']}, {"_id": 0})
                    if booking and not booking.get('arrivingSoonSent'):
                        # Add job to scheduler
                        scheduler.add_job(
                            send_scheduled_arriving_sms,
                            trigger=DateTrigger(run_date=notify_dt),
                            args=[item['bookingId']],
                            id=f"shuttle_sms_{item['bookingId']}",
                            replace_existing=True
                        )
                        scheduled_count += 1
                        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Scheduled SMS for {item['name']} at {notify_dt.strftime('%H:%M')}")
                else:
                    # If notification time has passed, send immediately (they're first pickup)
                    booking = await db.shuttle_bookings.find_one({"id": item['bookingId']}, {"_id": 0})
                    if booking and not booking.get('arrivingSoonSent'):
                        send_arriving_soon_sms(booking, 5, "Your driver")
                        await db.shuttle_bookings.update_one(
                            {"id": item['bookingId']},
                            {"$set": {"arrivingSoonSent": True, "arrivingSoonSentAt": datetime.now(timezone.utc).isoformat()}}
                        )
                        scheduled_count += 1
                        
            except Exception as sched_error:
                logger.error(f"Error scheduling SMS for {item.get('name')}: {sched_error}")
        
        # Mark shuttle as started in database
        await db.shuttle_runs.update_one(
            {"date": date, "departureTime": time},
            {"$set": {
                "date": date,
                "departureTime": time,
                "startedAt": datetime.now(timezone.utc).isoformat(),
                "schedule": schedule,
                "status": "in_progress"
            }},
            upsert=True
        )
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Shuttle started: {date} {time} - {scheduled_count} notifications scheduled")
        
        return {
            "success": True,
            "message": f"Shuttle started! {scheduled_count} 'Arriving Soon' SMS scheduled.",
            "scheduledNotifications": scheduled_count,
            "schedule": schedule
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting shuttle: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def send_scheduled_arriving_sms(booking_id: str):
    """Called by scheduler to send arriving soon SMS"""
    try:
        booking = await db.shuttle_bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            return
        
        if booking.get('arrivingSoonSent'):
            logger.info(f"SMS already sent for {booking.get('name')} - skipping")
            return
        
        # Get the driver name from the shuttle run
        shuttle_run = await db.shuttle_runs.find_one({
            "date": booking.get("date"),
            "departureTime": booking.get("departureTime")
        }, {"_id": 0})
        driver_name = shuttle_run.get("driverName", "Your driver") if shuttle_run else "Your driver"
        
        # Send the SMS
        success = send_arriving_soon_sms(booking, 5, driver_name)
        
        if success:
            # Mark as sent
            await db.shuttle_bookings.update_one(
                {"id": booking_id},
                {"$set": {"arrivingSoonSent": True, "arrivingSoonSentAt": datetime.now(timezone.utc).isoformat()}}
            )
            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± Scheduled SMS sent to {booking.get('name')}")
    except Exception as e:
        logger.error(f"Error sending scheduled SMS: {str(e)}")


class AssignDriverRequest(BaseModel):
    driverId: str
    driverName: str
    driverPhone: Optional[str] = None


@api_router.post("/shuttle/assign-driver/{date}/{time}")
async def assign_shuttle_driver(
    date: str, 
    time: str, 
    request: AssignDriverRequest,
    current_admin: dict = Depends(get_current_admin)
):
    """
    Assign a driver to a shuttle departure.
    This automatically:
    1. Sends the optimized route to the driver's phone
    2. Schedules 'arriving soon' SMS for all customers 5 mins before pickup
    
    One action - everything automated!
    """
    try:
        # Get all bookings for this departure
        bookings = await db.shuttle_bookings.find({
            "date": date,
            "departureTime": time,
            "status": {"$nin": ["deleted", "cancelled"]}
        }, {"_id": 0}).to_list(100)
        
        if not bookings:
            raise HTTPException(status_code=404, detail="No bookings for this departure")
        
        # Get driver info
        driver = await db.drivers.find_one({"id": request.driverId}, {"_id": 0})
        driver_phone = request.driverPhone or (driver.get("phone") if driver else None)
        driver_name = request.driverName
        
        # ===== STEP 1: Calculate optimized route and send to driver =====
        pickup_addresses = [b["pickupAddress"] for b in bookings]
        destination = "Auckland International Airport, New Zealand"
        google_api_key = os.environ.get('GOOGLE_MAPS_API_KEY', '')
        
        # Build Google Maps URL with optimized waypoints
        if len(pickup_addresses) > 1:
            waypoints_encoded = "|".join(pickup_addresses[1:])
            maps_url = f"https://www.google.com/maps/dir/?api=1&origin={requests.utils.quote(pickup_addresses[0])}&destination={requests.utils.quote(destination)}&waypoints={requests.utils.quote(waypoints_encoded)}&travelmode=driving"
        else:
            maps_url = f"https://www.google.com/maps/dir/?api=1&origin={requests.utils.quote(pickup_addresses[0])}&destination={requests.utils.quote(destination)}&travelmode=driving"
        
        # Send route to driver via SMS
        if driver_phone:
            twilio_sid = os.environ.get('TWILIO_ACCOUNT_SID')
            twilio_token = os.environ.get('TWILIO_AUTH_TOKEN')
            twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')
            
            if twilio_sid and twilio_token and twilio_phone:
                pickup_summary = "\n".join([
                    f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ {b['name']} ({b['passengers']}pax)"
                    for b in bookings[:5]
                ])
                
                route_message = f"""ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â SHUTTLE ASSIGNED - {date} {time}

{len(bookings)} pickups, {sum(b['passengers'] for b in bookings)} passengers

{pickup_summary}

ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â OPEN ROUTE IN MAPS:
{maps_url}

Customers will be auto-notified 5 mins before their pickup. Drive safe! ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡"""
                
                try:
                    twilio_client = Client(twilio_sid, twilio_token)
                    formatted_driver_phone = format_nz_phone(driver_phone)
                    twilio_client.messages.create(
                        body=route_message,
                        from_=twilio_phone,
                        to=formatted_driver_phone
                    )
                    logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± Route sent to driver {driver_name} at {formatted_driver_phone}")
                except Exception as sms_error:
                    logger.error(f"Error sending route to driver: {sms_error}")
        
        # ===== STEP 2: Schedule customer notifications =====
        schedule = []
        scheduled_count = 0
        
        # Parse departure time
        dep_hour, dep_min = map(int, time.split(':'))
        import pytz
        nz_tz = pytz.timezone('Pacific/Auckland')
        year, month, day = map(int, date.split('-'))
        departure_dt = nz_tz.localize(datetime(year, month, day, dep_hour, dep_min, 0))
        
        # Calculate ETAs using Google Maps
        if google_api_key and len(pickup_addresses) > 0:
            url = "https://maps.googleapis.com/maps/api/directions/json"
            origin = pickup_addresses[0]
            waypoints = "|".join(pickup_addresses[1:]) if len(pickup_addresses) > 1 else ""
            
            params = {
                'origin': origin,
                'destination': destination,
                'waypoints': f"optimize:true|{waypoints}" if waypoints else "",
                'key': google_api_key,
                'departure_time': 'now'
            }
            
            response = requests.get(url, params=params)
            data = response.json()
            
            if data['status'] == 'OK' and data['routes']:
                route = data['routes'][0]
                legs = route['legs']
                optimized_order = route.get('waypoint_order', list(range(len(pickup_addresses) - 1)))
                
                # Reorder bookings based on optimized route
                if len(pickup_addresses) > 1:
                    first_booking = bookings[0]
                    reordered_bookings = [first_booking]
                    for idx in optimized_order:
                        reordered_bookings.append(bookings[idx + 1])
                    bookings = reordered_bookings
                
                # Calculate and schedule notifications
                cumulative_minutes = 0
                from apscheduler.triggers.date import DateTrigger
                
                for idx, booking in enumerate(bookings):
                    if idx < len(legs):
                        leg_duration = legs[idx]['duration']['value'] // 60
                    else:
                        leg_duration = 0
                    
                    cumulative_minutes += leg_duration
                    notify_minutes_before = max(0, cumulative_minutes - 5)
                    notify_dt = departure_dt + timedelta(minutes=notify_minutes_before)
                    
                    schedule.append({
                        'bookingId': booking['id'],
                        'name': booking['name'],
                        'etaMinutes': cumulative_minutes,
                        'notifyAt': notify_dt.strftime('%H:%M')
                    })
                    
                    # Update booking with schedule info
                    await db.shuttle_bookings.update_one(
                        {"id": booking['id']},
                        {"$set": {
                            "scheduledNotifyAt": notify_dt.isoformat(),
                            "etaFromStart": cumulative_minutes,
                            "assignedDriver": driver_name,
                            "assignedDriverId": request.driverId
                        }}
                    )
                    
                    # Schedule the SMS
                    now = datetime.now(nz_tz)
                    if notify_dt > now:
                        if not booking.get('arrivingSoonSent'):
                            scheduler.add_job(
                                send_scheduled_arriving_sms,
                                trigger=DateTrigger(run_date=notify_dt),
                                args=[booking['id']],
                                id=f"shuttle_sms_{booking['id']}",
                                replace_existing=True
                            )
                            scheduled_count += 1
                            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Scheduled SMS for {booking['name']} at {notify_dt.strftime('%H:%M')}")
                    else:
                        # First pickup - send immediately
                        if not booking.get('arrivingSoonSent'):
                            send_arriving_soon_sms(booking, 5, driver_name)
                            await db.shuttle_bookings.update_one(
                                {"id": booking['id']},
                                {"$set": {"arrivingSoonSent": True}}
                            )
                            scheduled_count += 1
        
        # ===== STEP 3: Save shuttle run info =====
        await db.shuttle_runs.update_one(
            {"date": date, "departureTime": time},
            {"$set": {
                "date": date,
                "departureTime": time,
                "driverId": request.driverId,
                "driverName": driver_name,
                "driverPhone": driver_phone,
                "assignedAt": datetime.now(timezone.utc).isoformat(),
                "schedule": schedule,
                "status": "assigned",
                "mapsUrl": maps_url
            }},
            upsert=True
        )
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Driver {driver_name} assigned to shuttle {date} {time} - {scheduled_count} SMS scheduled")
        
        return {
            "success": True,
            "message": f"Driver assigned! Route sent to {driver_name}, {scheduled_count} customer notifications scheduled.",
            "scheduledNotifications": scheduled_count,
            "driverName": driver_name,
            "mapsUrl": maps_url,
            "schedule": schedule
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning driver: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ENHANCED ADMIN FEATURES ====================

# Production Database Sync Endpoint
PRODUCTION_API_URL = "https://bookaride.co.nz/api"
SYNC_SECRET_KEY = os.environ.get("SYNC_SECRET_KEY", "bookaride-sync-2024-secret")

# Background auto-sync function
async def auto_sync_from_production():
    """Automatically sync data from production every 5 minutes"""
    try:
        logger.info("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ Auto-sync: Starting sync from production...")
        
        response = requests.get(
            f"{PRODUCTION_API_URL}/sync/export",
            params={"secret": SYNC_SECRET_KEY},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            bookings = data.get("bookings", [])
            drivers = data.get("drivers", [])
            
            bookings_synced = 0
            drivers_synced = 0
            
            for booking in bookings:
                try:
                    await db.bookings.update_one(
                        {"id": booking.get("id")},
                        {"$set": booking},
                        upsert=True
                    )
                    bookings_synced += 1
                except Exception:
                    pass
            
            for driver in drivers:
                try:
                    await db.drivers.update_one(
                        {"id": driver.get("id")},
                        {"$set": driver},
                        upsert=True
                    )
                    drivers_synced += 1
                except Exception:
                    pass
            
            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ Auto-sync complete: {bookings_synced} bookings, {drivers_synced} drivers")
        elif response.status_code == 404:
            logger.debug("Auto-sync: Export endpoint not deployed yet")
        else:
            logger.warning(f"Auto-sync failed: {response.status_code}")
            
    except requests.exceptions.Timeout:
        logger.warning("Auto-sync: Connection timeout")
    except Exception as e:
        logger.error(f"Auto-sync error: {str(e)}")


# ==================== SMART RETURN BOOKING ALERT SYSTEM ====================
# Base address for calculating drive times
BASE_ADDRESS = "492 Hillsborough Road, Mount Roskill, Auckland, New Zealand"
DEPARTURE_BUFFER_MINUTES = 60  # Alert 1 hour before you need to leave

async def calculate_drive_time_from_base(destination_address: str) -> int:
    """Calculate drive time in minutes from base to destination using Google Maps.
    Returns estimated drive time in minutes, or 60 as fallback."""
    try:
        google_api_key = os.environ.get('GOOGLE_MAPS_API_KEY', '')
        if not google_api_key:
            logger.warning("Google Maps API key not configured for drive time calculation")
            return 60  # Default 1 hour if no API key
        
        url = "https://maps.googleapis.com/maps/api/distancematrix/json"
        params = {
            'origins': BASE_ADDRESS,
            'destinations': destination_address,
            'departure_time': 'now',  # Use current traffic conditions
            'key': google_api_key
        }
        
        response = requests.get(url, params=params, timeout=15)
        data = response.json()
        
        if data['status'] == 'OK' and len(data['rows']) > 0:
            element = data['rows'][0]['elements'][0]
            if element['status'] == 'OK':
                # Use duration_in_traffic if available, otherwise duration
                duration = element.get('duration_in_traffic', element.get('duration', {}))
                drive_minutes = duration.get('value', 3600) // 60  # Convert seconds to minutes
                logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Drive time from base to {destination_address[:50]}...: {drive_minutes} mins")
                return drive_minutes
        
        logger.warning(f"Could not calculate drive time to {destination_address[:50]}...")
        return 60  # Default fallback
        
    except Exception as e:
        logger.error(f"Error calculating drive time: {str(e)}")
        return 60  # Default fallback


async def check_return_booking_alerts():
    """Check for upcoming return bookings and send alerts if needed.
    Called every 15 minutes by scheduler.
    Alerts admin 1 hour before they need to LEAVE (not before pickup time)."""
    try:
        nz_tz = pytz.timezone('Pacific/Auckland')
        now_nz = datetime.now(nz_tz)
        today_str = now_nz.strftime('%Y-%m-%d')
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â [return_alerts] Checking return bookings - NZ time: {now_nz.strftime('%Y-%m-%d %H:%M')}")
        
        # Find bookings with return trips today or tomorrow
        tomorrow_str = (now_nz + timedelta(days=1)).strftime('%Y-%m-%d')
        
        return_bookings = await db.bookings.find({
            'returnDate': {'$in': [today_str, tomorrow_str]},
            'returnTime': {'$exists': True, '$ne': ''},
            'status': {'$nin': ['cancelled', 'completed']}
        }, {'_id': 0}).to_list(100)
        
        alerts_sent = 0
        
        for booking in return_bookings:
            try:
                return_date = booking.get('returnDate', '')
                return_time = booking.get('returnTime', '')
                
                if not return_date or not return_time:
                    continue
                
                # Parse return pickup datetime
                try:
                    return_datetime = datetime.strptime(f"{return_date} {return_time}", '%Y-%m-%d %H:%M')
                    return_datetime = nz_tz.localize(return_datetime)
                except:
                    continue
                
                # Skip if return is in the past
                if return_datetime < now_nz:
                    continue
                
                # Get the return pickup address (usually dropoff becomes pickup for return)
                return_pickup = booking.get('dropoffAddress', booking.get('pickupAddress', ''))
                
                # Calculate drive time from base
                drive_minutes = await calculate_drive_time_from_base(return_pickup)
                
                # Calculate when admin needs to LEAVE
                leave_time = return_datetime - timedelta(minutes=drive_minutes)
                
                # Calculate alert time (1 hour before leaving)
                alert_time = leave_time - timedelta(minutes=DEPARTURE_BUFFER_MINUTES)
                
                # Check if we're within alert window (alert_time <= now < leave_time + 15 mins)
                # The 15 min buffer ensures we don't miss alerts if check runs slightly late
                alert_window_end = leave_time + timedelta(minutes=15)
                
                booking_id = booking.get('id', '')
                alert_key = f"return_alert_{booking_id}_{return_date}"
                
                # Check if we already sent this alert
                existing_alert = await db.return_alerts_sent.find_one({"alert_key": alert_key})
                if existing_alert:
                    continue
                
                if alert_time <= now_nz < alert_window_end:
                    # Time to send alert!
                    booking_ref = get_booking_reference(booking)
                    customer_name = booking.get('name', 'Customer')
                    formatted_time = format_time_ampm(return_time)
                    
                    # Calculate time remaining
                    minutes_until_leave = int((leave_time - now_nz).total_seconds() / 60)
                    
                    # Send SMS to admin
                    admin_phone = os.environ.get('ADMIN_PHONE', '+6421743321')
                    twilio_sid = os.environ.get('TWILIO_ACCOUNT_SID')
                    twilio_token = os.environ.get('TWILIO_AUTH_TOKEN')
                    twilio_from = os.environ.get('TWILIO_PHONE_NUMBER')
                    
                    if twilio_sid and twilio_token and twilio_from:
                        try:
                            client = Client(twilio_sid, twilio_token)
                            
                            sms_body = f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â RETURN TRIP ALERT!\n"
                            sms_body += f"Leave in {minutes_until_leave} mins for:\n"
                            sms_body += f"{customer_name} - Ref #{booking_ref}\n"
                            sms_body += f"Pickup: {formatted_time}\n"
                            sms_body += f"From: {return_pickup[:60]}\n"
                            sms_body += f"Drive time: {drive_minutes} mins"
                            
                            client.messages.create(
                                body=sms_body,
                                from_=twilio_from,
                                to=admin_phone
                            )
                            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Return alert SMS sent for booking #{booking_ref}")
                            alerts_sent += 1
                        except Exception as sms_err:
                            logger.error(f"Failed to send return alert SMS: {str(sms_err)}")
                    
                    # Send reminder to assigned driver (if assigned)
                    driver_id = booking.get('return_driver_id', booking.get('driver_id'))
                    if driver_id:
                        driver = await db.drivers.find_one({"id": driver_id}, {"_id": 0})
                        if driver and driver.get('phone'):
                            try:
                                driver_sms = f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â RETURN PICKUP REMINDER\n"
                                driver_sms += f"Customer: {customer_name}\n"
                                driver_sms += f"Time: {formatted_time}\n"
                                driver_sms += f"From: {return_pickup[:60]}\n"
                                driver_sms += f"Phone: {booking.get('phone', 'N/A')}"
                                
                                client = Client(twilio_sid, twilio_token)
                                client.messages.create(
                                    body=driver_sms,
                                    from_=twilio_from,
                                    to=driver.get('phone')
                                )
                                logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Driver return reminder sent for booking #{booking_ref}")
                            except Exception as drv_err:
                                logger.error(f"Failed to send driver reminder: {str(drv_err)}")
                    
                    # Mark alert as sent
                    await db.return_alerts_sent.insert_one({
                        "alert_key": alert_key,
                        "booking_id": booking_id,
                        "sent_at": datetime.now(timezone.utc).isoformat(),
                        "drive_minutes": drive_minutes
                    })
            
            except Exception as booking_err:
                logger.warning(f"Error processing return booking alert: {str(booking_err)}")
                continue
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â [return_alerts] Check complete: {alerts_sent} alerts sent")
        return {"alerts_sent": alerts_sent}
        
    except Exception as e:
        logger.error(f"Error in return booking alerts: {str(e)}")
        return {"error": str(e)}


@api_router.get("/admin/urgent-returns")
async def get_urgent_return_bookings(current_admin: dict = Depends(get_current_admin)):
    """Get upcoming return bookings with drive time calculations for dashboard display.
    Returns bookings sorted by urgency (how soon admin needs to leave)."""
    try:
        nz_tz = pytz.timezone('Pacific/Auckland')
        now_nz = datetime.now(nz_tz)
        today_str = now_nz.strftime('%Y-%m-%d')
        tomorrow_str = (now_nz + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Find return bookings for today and tomorrow
        return_bookings = await db.bookings.find({
            'returnDate': {'$in': [today_str, tomorrow_str]},
            'returnTime': {'$exists': True, '$ne': ''},
            'status': {'$nin': ['cancelled', 'completed']}
        }, {'_id': 0}).to_list(50)
        
        urgent_returns = []
        
        for booking in return_bookings:
            try:
                return_date = booking.get('returnDate', '')
                return_time = booking.get('returnTime', '')
                
                if not return_date or not return_time:
                    continue
                
                # Parse return datetime
                try:
                    return_datetime = datetime.strptime(f"{return_date} {return_time}", '%Y-%m-%d %H:%M')
                    return_datetime = nz_tz.localize(return_datetime)
                except:
                    continue
                
                # Skip past returns
                if return_datetime < now_nz:
                    continue
                
                return_pickup = booking.get('dropoffAddress', booking.get('pickupAddress', ''))
                
                # Calculate drive time
                drive_minutes = await calculate_drive_time_from_base(return_pickup)
                
                # Calculate times
                leave_time = return_datetime - timedelta(minutes=drive_minutes)
                alert_time = leave_time - timedelta(minutes=DEPARTURE_BUFFER_MINUTES)
                
                minutes_until_leave = int((leave_time - now_nz).total_seconds() / 60)
                minutes_until_pickup = int((return_datetime - now_nz).total_seconds() / 60)
                
                # Determine urgency level
                if minutes_until_leave <= 0:
                    urgency = "OVERDUE"
                    urgency_color = "red"
                elif minutes_until_leave <= 60:
                    urgency = "LEAVE NOW"
                    urgency_color = "red"
                elif minutes_until_leave <= 120:
                    urgency = "LEAVE SOON"
                    urgency_color = "orange"
                elif minutes_until_leave <= 240:
                    urgency = "UPCOMING"
                    urgency_color = "yellow"
                else:
                    urgency = "SCHEDULED"
                    urgency_color = "green"
                
                # Check driver assignment
                driver_id = booking.get('return_driver_id', booking.get('driver_id'))
                driver_assigned = bool(driver_id)
                driver_name = None
                if driver_id:
                    driver = await db.drivers.find_one({"id": driver_id}, {"_id": 0, "name": 1})
                    driver_name = driver.get('name') if driver else None
                
                urgent_returns.append({
                    "booking_id": booking.get('id'),
                    "booking_ref": get_booking_reference(booking),
                    "customer_name": booking.get('name', 'Unknown'),
                    "customer_phone": booking.get('phone', ''),
                    "return_date": return_date,
                    "return_time": return_time,
                    "return_time_formatted": format_time_ampm(return_time),
                    "pickup_address": return_pickup,
                    "drive_minutes": drive_minutes,
                    "minutes_until_leave": minutes_until_leave,
                    "minutes_until_pickup": minutes_until_pickup,
                    "leave_by": leave_time.strftime('%H:%M'),
                    "urgency": urgency,
                    "urgency_color": urgency_color,
                    "driver_assigned": driver_assigned,
                    "driver_name": driver_name
                })
                
            except Exception as item_err:
                logger.warning(f"Error processing return booking: {str(item_err)}")
                continue
        
        # Sort by minutes_until_leave (most urgent first)
        urgent_returns.sort(key=lambda x: x['minutes_until_leave'])
        
        return {
            "urgent_returns": urgent_returns,
            "total_count": len(urgent_returns),
            "base_address": BASE_ADDRESS,
            "checked_at": now_nz.strftime('%Y-%m-%d %H:%M:%S')
        }
        
    except Exception as e:
        logger.error(f"Error getting urgent returns: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Endpoint to EXPORT data (called by other environments to fetch data)
@api_router.get("/sync/export")
async def export_data_for_sync(secret: str = ""):
    """Export bookings and drivers for sync - requires secret key"""
    if secret != SYNC_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid sync key")
    
    try:
        bookings = await db.bookings.find({}, {"_id": 0}).to_list(10000)
        drivers = await db.drivers.find({}, {"_id": 0}).to_list(1000)
        
        return {
            "bookings": bookings,
            "drivers": drivers,
            "exported_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Export failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/admin/sync")
async def sync_from_production():
    """Sync bookings and drivers from production database via deployed API"""
    try:
        sync_results = {
            "bookings_synced": 0,
            "bookings_updated": 0,
            "drivers_synced": 0,
            "drivers_updated": 0,
            "errors": []
        }
        
        # Call the production sync export endpoint with secret key
        try:
            logger.info("Starting sync from production...")
            response = requests.get(
                f"{PRODUCTION_API_URL}/sync/export",
                params={"secret": SYNC_SECRET_KEY},
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                production_bookings = data.get("bookings", [])
                production_drivers = data.get("drivers", [])
                
                logger.info(f"Fetched {len(production_bookings)} bookings and {len(production_drivers)} drivers from production")
                
                # Sync Bookings
                for booking in production_bookings:
                    try:
                        existing = await db.bookings.find_one({"id": booking.get("id")}, {"_id": 0})
                        
                        if existing:
                            await db.bookings.update_one(
                                {"id": booking.get("id")},
                                {"$set": booking}
                            )
                            sync_results["bookings_updated"] += 1
                        else:
                            await db.bookings.insert_one(booking)
                            sync_results["bookings_synced"] += 1
                    except Exception as e:
                        sync_results["errors"].append(f"Booking {booking.get('id', 'unknown')}: {str(e)}")
                
                # Sync Drivers
                for driver in production_drivers:
                    try:
                        existing = await db.drivers.find_one({"id": driver.get("id")}, {"_id": 0})
                        
                        if existing:
                            await db.drivers.update_one(
                                {"id": driver.get("id")},
                                {"$set": driver}
                            )
                            sync_results["drivers_updated"] += 1
                        else:
                            await db.drivers.insert_one(driver)
                            sync_results["drivers_synced"] += 1
                    except Exception as e:
                        sync_results["errors"].append(f"Driver {driver.get('id', 'unknown')}: {str(e)}")
            
            elif response.status_code == 403:
                sync_results["errors"].append("Sync not yet deployed to production. Please deploy first, then sync will work.")
            else:
                sync_results["errors"].append(f"Failed to fetch from production: {response.status_code}")
                
        except requests.exceptions.Timeout:
            sync_results["errors"].append("Connection to production timed out")
        except Exception as e:
            sync_results["errors"].append(f"Sync error: {str(e)}")
        
        logger.info(f"Sync completed: {sync_results}")
        
        success = len(sync_results["errors"]) == 0 or sync_results["bookings_synced"] > 0 or sync_results["bookings_updated"] > 0
        
        return {
            "success": success,
            "message": f"Synced {sync_results['bookings_synced']} new bookings, updated {sync_results['bookings_updated']}. Synced {sync_results['drivers_synced']} new drivers, updated {sync_results['drivers_updated']}.",
            "details": sync_results
        }
        
    except Exception as e:
        logger.error(f"Sync failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


# Analytics Endpoints
@api_router.get("/analytics/stats")
async def get_analytics_stats(start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Get comprehensive analytics statistics"""
    try:
        query = {}
        if start_date or end_date:
            query["createdAt"] = {}
            if start_date:
                query["createdAt"]["$gte"] = datetime.fromisoformat(start_date)
            if end_date:
                query["createdAt"]["$lte"] = datetime.fromisoformat(end_date)
        
        bookings = await db.bookings.find(query, {"_id": 0}).to_list(10000)
        
        # Calculate stats
        total = len(bookings)
        confirmed = len([b for b in bookings if b.get('payment_status') == 'paid'])
        pending = total - confirmed
        total_revenue = sum(b.get('pricing', {}).get('totalPrice', 0) for b in bookings if b.get('payment_status') == 'paid')
        
        # Group by date for trends
        daily_revenue = {}
        daily_bookings = {}
        for booking in bookings:
            date = booking.get('date', '')
            if date:
                daily_bookings[date] = daily_bookings.get(date, 0) + 1
                if booking.get('payment_status') == 'paid':
                    revenue = booking.get('pricing', {}).get('totalPrice', 0)
                    daily_revenue[date] = daily_revenue.get(date, 0) + revenue
        
        revenue_trends = [{"date": date, "revenue": revenue} for date, revenue in sorted(daily_revenue.items())]
        booking_trends = [{"date": date, "count": count} for date, count in sorted(daily_bookings.items())]
        
        # Popular routes
        route_counts = {}
        for booking in bookings:
            pickup = booking.get('pickupAddress', '').split(',')[0]
            dropoff = booking.get('dropoffAddress', '').split(',')[0]
            if pickup and dropoff:
                route = f"{pickup} ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ {dropoff}"
                route_counts[route] = route_counts.get(route, 0) + 1
        
        popular_routes = sorted(route_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            "summary": {
                "total": total,
                "confirmed": confirmed,
                "pending": pending,
                "revenue": total_revenue
            },
            "revenue_trends": revenue_trends[-30:],  # Last 30 days
            "booking_trends": booking_trends[-30:],
            "popular_routes": [{"route": r[0], "count": r[1]} for r in popular_routes]
        }
    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Customer Management
@api_router.get("/customers")
async def get_customers():
    """Get all customers with their booking history"""
    try:
        bookings = await db.bookings.find({}, {"_id": 0}).to_list(10000)
        
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
                        'first_booking': booking.get('createdAt'),
                        'last_booking': booking.get('createdAt'),
                        'bookings': []
                    }
                
                customers_dict[email]['total_bookings'] += 1
                if booking.get('payment_status') == 'paid':
                    customers_dict[email]['total_spent'] += booking.get('pricing', {}).get('totalPrice', 0)
                
                if booking.get('createdAt'):
                    if booking.get('createdAt') > customers_dict[email]['last_booking']:
                        customers_dict[email]['last_booking'] = booking.get('createdAt')
                
                customers_dict[email]['bookings'].append({
                    'id': booking.get('id'),
                    'date': booking.get('date'),
                    'service': booking.get('serviceType'),
                    'price': booking.get('pricing', {}).get('totalPrice', 0),
                    'status': booking.get('status')
                })
        
        customers = sorted(customers_dict.values(), key=lambda x: x['total_bookings'], reverse=True)
        return {"customers": customers}
    except Exception as e:
        logger.error(f"Error getting customers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/customers/search")
async def search_customers(q: str = ""):
    """Fast customer search for autocomplete - searches name, email, phone"""
    try:
        if not q or len(q) < 2:
            return {"customers": []}
        
        search_term = q.lower().strip()
        
        # Get unique customers from bookings
        pipeline = [
            {"$match": {
                "$or": [
                    {"name": {"$regex": search_term, "$options": "i"}},
                    {"email": {"$regex": search_term, "$options": "i"}},
                    {"phone": {"$regex": search_term, "$options": "i"}}
                ]
            }},
            {"$sort": {"createdAt": -1}},  # Most recent first
            {"$group": {
                "_id": "$email",
                "name": {"$first": "$name"},
                "email": {"$first": "$email"},
                "phone": {"$first": "$phone"},
                "pickupAddress": {"$first": "$pickupAddress"},
                "dropoffAddress": {"$first": "$dropoffAddress"},
                "lastBookingDate": {"$first": "$date"},
                "totalBookings": {"$sum": 1}
            }},
            {"$sort": {"totalBookings": -1}},
            {"$limit": 10},
            {"$project": {"_id": 0}}
        ]
        
        customers = await db.bookings.aggregate(pipeline).to_list(10)
        
        logger.info(f"Customer search for '{q}': found {len(customers)} results")
        return {"customers": customers}
    except Exception as e:
        logger.error(f"Error searching customers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Export to CSV
@api_router.get("/export/csv")
async def export_csv():
    """Export bookings to CSV"""
    try:
        import pandas as pd
        from io import BytesIO
        from fastapi.responses import StreamingResponse
        
        bookings = await db.bookings.find({}, {"_id": 0}).to_list(10000)
        
        df_data = []
        for b in bookings:
            df_data.append({
                'Booking ID': b.get('id', '')[:8],
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
                'Payment': b.get('payment_status', '')
            })
        
        df = pd.DataFrame(df_data)
        stream = BytesIO()
        df.to_csv(stream, index=False)
        stream.seek(0)
        
        return StreamingResponse(
            stream,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=bookings_{datetime.now().strftime('%Y%m%d')}.csv"}
        )
    except Exception as e:
        logger.error(f"Error exporting CSV: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Payment Link Helper Functions
async def generate_stripe_payment_link(booking: dict) -> str:
    """Generate a Stripe payment link for a booking"""
    try:
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        if not stripe_api_key:
            logger.error("Stripe API key not configured")
            return None
        
        public_url = os.environ.get('PUBLIC_URL', 'https://bookaride.co.nz')
        webhook_url = f"{public_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        success_url = f"{public_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{public_url}/book-now"
        
        # Get price from multiple possible locations (admin may update pricing.totalPrice)
        amount = 0
        if booking.get('pricing') and booking.get('pricing', {}).get('totalPrice'):
            amount = float(booking.get('pricing', {}).get('totalPrice', 0))
        elif booking.get('totalPrice'):
            amount = float(booking.get('totalPrice', 0))
        
        if amount <= 0:
            logger.error(f"Invalid amount for payment link: {amount}")
            return None
        
        logger.info(f"Generating Stripe payment link for ${amount:.2f} (booking #{booking.get('referenceNumber')})")
        
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency="nzd",
            success_url=success_url,
            cancel_url=cancel_url,
            payment_methods=["card", "afterpay_clearpay"],  # Enable Afterpay/Clearpay
            metadata={
                "booking_id": booking.get('id', ''),
                "customer_email": booking.get('email', ''),
                "customer_name": booking.get('name', '')
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        return session.url  # Fixed: attribute is 'url' not 'checkout_url'
    except Exception as e:
        logger.error(f"Error generating Stripe payment link: {str(e)}")
        return None

def generate_paypal_payment_link(booking: dict) -> str:
    """Generate a PayPal.me payment link for a booking"""
    try:
        paypal_username = os.environ.get('PAYPAL_ME_USERNAME', 'bookaridenz')
        
        # Get price from multiple possible locations (admin may update pricing.totalPrice)
        amount = 0
        if booking.get('pricing') and booking.get('pricing', {}).get('totalPrice'):
            amount = float(booking.get('pricing', {}).get('totalPrice', 0))
        elif booking.get('totalPrice'):
            amount = float(booking.get('totalPrice', 0))
        
        if amount <= 0:
            return None
        
        # PayPal.me link format: https://paypal.me/username/amount
        return f"https://paypal.me/{paypal_username}/{amount:.2f}NZD"
    except Exception as e:
        logger.error(f"Error generating PayPal payment link: {str(e)}")
        return None


# Background task helpers for payment link sending
async def send_stripe_payment_link_background(booking: dict):
    """Send Stripe payment link in background"""
    try:
        payment_link = await generate_stripe_payment_link(booking)
        if payment_link:
            await send_payment_link_email(booking, payment_link, 'stripe')
            # Also send confirmation email
            send_booking_confirmation_email(booking, include_payment_link=False)
            logger.info(f"Stripe payment link sent for booking #{booking.get('referenceNumber')}")
    except Exception as e:
        logger.error(f"Error sending Stripe payment link: {str(e)}")

async def send_paypal_payment_link_background(booking: dict):
    """Send PayPal payment link in background"""
    try:
        payment_link = generate_paypal_payment_link(booking)
        if payment_link:
            await send_payment_link_email(booking, payment_link, 'paypal')
            # Also send confirmation email
            send_booking_confirmation_email(booking, include_payment_link=False)
            logger.info(f"PayPal payment link sent for booking #{booking.get('referenceNumber')}")
    except Exception as e:
        logger.error(f"Error sending PayPal payment link: {str(e)}")


# ============================================
# AFTERPAY DIRECT API INTEGRATION
# ============================================

class AfterpayCheckoutRequest(BaseModel):
    booking_id: str
    redirect_confirm_url: str
    redirect_cancel_url: str

class AfterpayCheckoutResponse(BaseModel):
    token: str
    redirect_url: str
    expires: str

@api_router.post("/afterpay/create-checkout")
async def create_afterpay_checkout(request: AfterpayCheckoutRequest):
    """Create an Afterpay checkout session"""
    try:
        # Get Afterpay credentials
        merchant_id = os.environ.get('AFTERPAY_MERCHANT_ID')
        secret_key = os.environ.get('AFTERPAY_SECRET_KEY')
        afterpay_env = os.environ.get('AFTERPAY_ENV', 'sandbox')
        
        if not merchant_id or not secret_key:
            raise HTTPException(status_code=500, detail="Afterpay credentials not configured")
        
        # Get booking from database
        booking = await db.bookings.find_one({"id": request.booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        amount = float(booking.get('totalPrice', 0))
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid booking amount")
        
        # Afterpay API endpoint
        api_url = "https://api-sandbox.afterpay.com" if afterpay_env == "sandbox" else "https://api.afterpay.com"
        
        # Create Afterpay checkout payload
        checkout_payload = {
            "amount": {
                "amount": f"{amount:.2f}",
                "currency": "NZD"
            },
            "consumer": {
                "givenNames": booking.get('name', 'Customer').split()[0] if booking.get('name') else "Customer",
                "surname": " ".join(booking.get('name', 'Guest').split()[1:]) if len(booking.get('name', '').split()) > 1 else "Guest",
                "email": booking.get('email', ''),
                "phoneNumber": booking.get('phone', '')
            },
            "billing": {
                "name": booking.get('name', ''),
                "line1": booking.get('pickupAddress', ''),
                "postcode": "0000",
                "countryCode": "NZ"
            },
            "shipping": {
                "name": booking.get('name', ''),
                "line1": booking.get('dropoffAddress', ''),
                "postcode": "0000",
                "countryCode": "NZ"
            },
            "merchant": {
                "redirectConfirmUrl": request.redirect_confirm_url,
                "redirectCancelUrl": request.redirect_cancel_url
            },
            "merchantReference": booking.get('id', '')[:20],
            "taxAmount": {
                "amount": "0.00",
                "currency": "NZD"
            },
            "shippingAmount": {
                "amount": "0.00",
                "currency": "NZD"
            },
            "items": [
                {
                    "name": f"Airport Transfer - {booking.get('serviceType', 'Shuttle')}",
                    "sku": booking.get('id', '')[:10],
                    "quantity": 1,
                    "price": {
                        "amount": f"{amount:.2f}",
                        "currency": "NZD"
                    }
                }
            ]
        }
        
        # Make request to Afterpay API
        import base64
        auth_string = f"{merchant_id}:{secret_key}"
        auth_bytes = base64.b64encode(auth_string.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {auth_bytes}",
            "Content-Type": "application/json",
            "User-Agent": "BookaRide/1.0 (NZ; https://bookaride.co.nz)"
        }
        
        response = requests.post(
            f"{api_url}/v2/checkouts",
            json=checkout_payload,
            headers=headers
        )
        
        if response.status_code != 201 and response.status_code != 200:
            logger.error(f"Afterpay checkout error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail=f"Afterpay checkout failed: {response.text}")
        
        checkout_data = response.json()
        token = checkout_data.get('token')
        
        # Redirect URL for Afterpay
        redirect_url = f"https://portal.sandbox.afterpay.com/nz/checkout/?token={token}" if afterpay_env == "sandbox" else f"https://portal.afterpay.com/nz/checkout/?token={token}"
        
        # Store Afterpay transaction
        await db.afterpay_transactions.insert_one({
            "token": token,
            "booking_id": request.booking_id,
            "amount": amount,
            "currency": "NZD",
            "status": "pending",
            "created_at": datetime.now(timezone.utc)
        })
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Afterpay checkout created: token={token}, booking={request.booking_id}")
        
        return {
            "token": token,
            "redirect_url": redirect_url,
            "expires": checkout_data.get('expires', '')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating Afterpay checkout: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating Afterpay checkout: {str(e)}")


@api_router.post("/afterpay/capture")
async def capture_afterpay_payment(token: str, order_id: str = None):
    """Capture an Afterpay payment after customer approval"""
    try:
        merchant_id = os.environ.get('AFTERPAY_MERCHANT_ID')
        secret_key = os.environ.get('AFTERPAY_SECRET_KEY')
        afterpay_env = os.environ.get('AFTERPAY_ENV', 'sandbox')
        
        if not merchant_id or not secret_key:
            raise HTTPException(status_code=500, detail="Afterpay credentials not configured")
        
        api_url = "https://api-sandbox.afterpay.com" if afterpay_env == "sandbox" else "https://api.afterpay.com"
        
        import base64
        auth_string = f"{merchant_id}:{secret_key}"
        auth_bytes = base64.b64encode(auth_string.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {auth_bytes}",
            "Content-Type": "application/json",
            "User-Agent": "BookaRide/1.0 (NZ; https://bookaride.co.nz)"
        }
        
        # Capture the payment
        capture_payload = {
            "token": token
        }
        
        if order_id:
            capture_payload["merchantReference"] = order_id
        
        response = requests.post(
            f"{api_url}/v2/payments/capture",
            json=capture_payload,
            headers=headers
        )
        
        if response.status_code != 201 and response.status_code != 200:
            logger.error(f"Afterpay capture error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail=f"Afterpay capture failed: {response.text}")
        
        payment_data = response.json()
        afterpay_order_id = payment_data.get('id')
        status = payment_data.get('status')
        
        # Update transaction in database
        transaction = await db.afterpay_transactions.find_one({"token": token})
        if transaction:
            await db.afterpay_transactions.update_one(
                {"token": token},
                {"$set": {
                    "afterpay_order_id": afterpay_order_id,
                    "status": status,
                    "captured_at": datetime.now(timezone.utc),
                    "payment_response": payment_data
                }}
            )
            
            # Update booking status
            if status == "APPROVED":
                await db.bookings.update_one(
                    {"id": transaction['booking_id']},
                    {"$set": {
                        "paymentStatus": "paid",
                        "paymentMethod": "afterpay",
                        "afterpayOrderId": afterpay_order_id,
                        "paidAt": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Afterpay payment captured: order_id={afterpay_order_id}, booking={transaction['booking_id']}")
        
        return {
            "order_id": afterpay_order_id,
            "status": status,
            "payment_data": payment_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error capturing Afterpay payment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error capturing Afterpay payment: {str(e)}")


@api_router.get("/afterpay/configuration")
async def get_afterpay_configuration():
    """Get Afterpay merchant configuration (limits, etc.)"""
    try:
        merchant_id = os.environ.get('AFTERPAY_MERCHANT_ID')
        secret_key = os.environ.get('AFTERPAY_SECRET_KEY')
        afterpay_env = os.environ.get('AFTERPAY_ENV', 'sandbox')
        
        if not merchant_id or not secret_key:
            return {"enabled": False, "message": "Afterpay not configured"}
        
        api_url = "https://api-sandbox.afterpay.com" if afterpay_env == "sandbox" else "https://api.afterpay.com"
        
        import base64
        auth_string = f"{merchant_id}:{secret_key}"
        auth_bytes = base64.b64encode(auth_string.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {auth_bytes}",
            "User-Agent": "BookaRide/1.0 (NZ; https://bookaride.co.nz)"
        }
        
        response = requests.get(
            f"{api_url}/v2/configuration",
            headers=headers
        )
        
        if response.status_code != 200:
            logger.error(f"Afterpay config error: {response.status_code} - {response.text}")
            return {"enabled": False, "message": "Could not fetch Afterpay configuration"}
        
        config_data = response.json()
        
        return {
            "enabled": True,
            "minimumAmount": config_data.get('minimumAmount', {}).get('amount', '1.00'),
            "maximumAmount": config_data.get('maximumAmount', {}).get('amount', '2000.00'),
            "currency": "NZD",
            "environment": afterpay_env
        }
        
    except Exception as e:
        logger.error(f"Error getting Afterpay configuration: {str(e)}")
        return {"enabled": False, "message": str(e)}


async def send_payment_link_email(booking: dict, payment_link: str, payment_type: str):
    """Send payment link email to customer"""
    try:
        customer_email = booking.get('email', '')
        customer_name = booking.get('name', '')
        booking_ref = booking.get('booking_ref', booking.get('id', '')[:6])
        total_price = booking.get('totalPrice', 0)
        
        payment_type_display = "Stripe" if payment_type == "stripe" else "PayPal"
        
        html_content = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #D4AF37; margin: 0; font-size: 28px;">Payment Required</h1>
                    <p style="color: #ffffff; margin: 10px 0 0 0;">Booking Reference: {booking_ref}</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 30px;">
                    <p style="font-size: 16px; color: #333;">Dear {customer_name},</p>
                    
                    <p style="font-size: 16px; color: #333;">
                        Thank you for your booking with Book A Ride NZ. Please complete your payment using the link below.
                    </p>
                    
                    <!-- Payment Amount Box -->
                    <div style="background: #f9f9f9; border: 2px solid #D4AF37; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0;">
                        <p style="margin: 0; color: #666; font-size: 14px;">Amount Due</p>
                        <p style="margin: 10px 0; color: #1a1a2e; font-size: 36px; font-weight: bold;">${total_price:.2f} NZD</p>
                        <p style="margin: 0; color: #666; font-size: 12px;">via {payment_type_display}</p>
                    </div>
                    
                    <!-- Payment Button -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{payment_link}" 
                           style="display: inline-block; background: #D4AF37; color: #1a1a2e; padding: 15px 40px; 
                                  border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px;">
                            Pay Now with {payment_type_display}
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #666; text-align: center;">
                        Or copy this link: <br>
                        <a href="{payment_link}" style="color: #D4AF37; word-break: break-all;">{payment_link}</a>
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <p style="font-size: 14px; color: #666;">
                        If you have any questions, please contact us at bookings@bookaride.co.nz
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="background: #1a1a2e; padding: 20px; text-align: center;">
                    <p style="color: #888; font-size: 12px; margin: 0;">
                        Book A Ride NZ | Premium Airport Transfers
                    </p>
                </div>
            </div>
        </body>
        </html>
        '''
        
        # Send via Mailgun
        mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
        mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
        sender_email = os.environ.get('SENDER_EMAIL', 'noreply@bookaride.co.nz')
        
        if mailgun_api_key and mailgun_domain:
            response = requests.post(
                f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
                auth=("api", mailgun_api_key),
                data={
                    "from": f"Book A Ride NZ <{sender_email}>",
                    "to": customer_email,
                    "subject": f"Payment Link - Booking {booking_ref} - ${total_price:.2f} NZD",
                    "html": html_content
                }
            )
            logger.info(f"Payment link email sent to {customer_email} - Status: {response.status_code}")
        else:
            logger.warning("Mailgun not configured - payment link email not sent")
            
    except Exception as e:
        logger.error(f"Error sending payment link email: {str(e)}")

# Apple iCloud Contacts Integration
def generate_contact_uid(phone: str, email: str) -> str:
    """Generate a deterministic UID based on phone/email to prevent duplicates.
    Same customer will always get the same UID, so re-uploads update instead of duplicate."""
    import hashlib
    # Normalize phone and email
    normalized_phone = ''.join(filter(str.isdigit, phone or ''))
    normalized_email = (email or '').lower().strip()
    # Create a unique key from phone/email
    unique_key = f"bookaride_{normalized_phone}_{normalized_email}"
    # Generate a deterministic UUID-like string from the hash
    hash_obj = hashlib.md5(unique_key.encode())
    return f"{hash_obj.hexdigest()[:8]}-{hash_obj.hexdigest()[8:12]}-{hash_obj.hexdigest()[12:16]}-{hash_obj.hexdigest()[16:20]}-{hash_obj.hexdigest()[20:32]}"


def add_contact_to_icloud(booking: dict):
    """Add a booking customer as a contact to iCloud Contacts.
    Uses deterministic UID based on phone/email to prevent duplicates - 
    same customer will be updated instead of creating duplicate."""
    try:
        icloud_email = os.environ.get('ICLOUD_EMAIL')
        icloud_password = os.environ.get('ICLOUD_APP_PASSWORD')
        
        if not icloud_email or not icloud_password:
            logger.warning("iCloud credentials not configured - contact not synced")
            return False
        
        # Create vCard
        vcard = vobject.vCard()
        
        # Add name
        customer_name = booking.get('name', 'Unknown')
        name_parts = customer_name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        vcard.add('fn').value = customer_name
        vcard.add('n').value = vobject.vcard.Name(family=last_name, given=first_name)
        
        # Add phone
        phone = booking.get('phone', '')
        if phone:
            tel = vcard.add('tel')
            tel.value = phone
            tel.type_param = 'CELL'
        
        # Add email
        email = booking.get('email', '')
        if email:
            email_field = vcard.add('email')
            email_field.value = email
            email_field.type_param = 'INTERNET'
        
        # Add note with booking details
        booking_ref = booking.get('booking_ref', booking.get('id', '')[:6])
        pickup = booking.get('pickupAddress', '')
        dropoff = booking.get('dropoffAddress', '')
        date = booking.get('date', '')
        note = f"BookaRide Customer - Ref: {booking_ref} - Date: {date} - {pickup} to {dropoff}"
        vcard.add('note').value = note
        
        # Add organization
        vcard.add('org').value = ['BookaRide Customer']
        
        # Generate DETERMINISTIC UID based on phone/email to prevent duplicates
        # Same customer will always get the same UID, so CardDAV will UPDATE instead of CREATE
        contact_uid = generate_contact_uid(phone, email)
        vcard.add('uid').value = contact_uid
        
        vcard_data = vcard.serialize()
        
        # iCloud CardDAV endpoint - using discovered path
        # Principal ID: 11909617397, Server: p115-contacts.icloud.com
        carddav_url = f"https://p115-contacts.icloud.com:443/11909617397/carddavhome/card/{contact_uid}.vcf"
        
        # Upload to iCloud (PUT with same UID will UPDATE existing contact)
        response = requests.put(
            carddav_url,
            auth=(icloud_email, icloud_password),
            data=vcard_data.encode('utf-8'),
            headers={
                'Content-Type': 'text/vcard; charset=utf-8',
            },
            timeout=30
        )
        
        if response.status_code in [200, 201, 204]:
            logger.info(f"Contact synced to iCloud: {customer_name} ({phone}) - UID: {contact_uid[:8]}...")
            return True
        else:
            logger.error(f"Failed to add contact to iCloud: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Error adding contact to iCloud: {str(e)}")
        return False


@api_router.post("/admin/sync-contacts-to-icloud")
async def sync_all_contacts_to_icloud(current_admin: dict = Depends(get_current_admin)):
    """Bulk sync all existing booking contacts to iCloud"""
    try:
        icloud_email = os.environ.get('ICLOUD_EMAIL')
        icloud_password = os.environ.get('ICLOUD_APP_PASSWORD')
        
        if not icloud_email or not icloud_password:
            raise HTTPException(status_code=400, detail="iCloud credentials not configured")
        
        # Get all bookings
        bookings = await db.bookings.find({}, {"_id": 0}).to_list(None)
        
        if not bookings:
            return {"message": "No bookings found", "synced": 0, "failed": 0}
        
        synced = 0
        failed = 0
        skipped = 0
        synced_contacts = []
        
        # Track unique customers by phone/email to avoid duplicates
        seen_customers = set()
        
        for booking in bookings:
            # Skip if no contact info
            phone = booking.get('phone', '').strip()
            email = booking.get('email', '').strip()
            name = booking.get('name', '').strip()
            
            if not phone and not email:
                skipped += 1
                continue
            
            # Create unique identifier for this customer
            customer_key = f"{phone}_{email}".lower()
            
            if customer_key in seen_customers:
                skipped += 1
                continue
            
            seen_customers.add(customer_key)
            
            # Try to sync this contact
            try:
                success = add_contact_to_icloud(booking)
                if success:
                    synced += 1
                    synced_contacts.append({"name": name, "phone": phone})
                else:
                    failed += 1
            except Exception as e:
                logger.error(f"Failed to sync contact {name}: {str(e)}")
                failed += 1
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± iCloud bulk sync complete: {synced} synced, {failed} failed, {skipped} skipped")
        
        return {
            "message": f"Bulk sync complete",
            "total_bookings": len(bookings),
            "synced": synced,
            "failed": failed,
            "skipped": skipped,
            "synced_contacts": synced_contacts[:20]  # Return first 20 for reference
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in bulk contact sync: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Manual Booking Creation
class ManualBooking(BaseModel):
    name: str
    email: str
    ccEmail: Optional[str] = ""  # CC email for confirmation
    phone: str
    serviceType: str
    pickupAddress: str
    pickupAddresses: Optional[List[str]] = []  # Multiple pickups support
    dropoffAddress: str
    date: str
    time: str
    passengers: str
    pricing: dict
    paymentMethod: str = "cash"
    notes: Optional[str] = ""
    priceOverride: Optional[float] = None
    flightArrivalNumber: Optional[str] = ""
    flightArrivalTime: Optional[str] = ""
    flightDepartureNumber: Optional[str] = ""
    flightDepartureTime: Optional[str] = ""
    bookReturn: Optional[bool] = False
    returnDate: Optional[str] = ""
    returnTime: Optional[str] = ""
    skipNotifications: Optional[bool] = False  # Skip sending email/SMS notifications
    referenceNumber: Optional[str] = None  # Allow setting custom reference number
    driver_name: Optional[str] = ""  # Pre-assign driver
    payment_status: Optional[str] = None  # Override payment status (paid, unpaid, etc.)
    status: Optional[str] = "confirmed"  # Booking status

@api_router.post("/bookings/manual")
async def create_manual_booking(booking: ManualBooking, background_tasks: BackgroundTasks):
    """Create a booking manually"""
    try:
        # Get sequential reference number OR use provided one
        if booking.referenceNumber:
            ref_number = booking.referenceNumber
        else:
            ref_number = await get_next_reference_number()
        
        # Extract total price from pricing or use override
        if booking.priceOverride is not None and booking.priceOverride > 0:
            total_price = booking.priceOverride
            # Update pricing dict with override
            pricing_data = booking.pricing.copy() if isinstance(booking.pricing, dict) else {}
            pricing_data['totalPrice'] = total_price
            pricing_data['isOverridden'] = True
            logger.info(f"Using price override: ${total_price:.2f}")
        else:
            total_price = booking.pricing.get('totalPrice', 0) if isinstance(booking.pricing, dict) else 0
            pricing_data = booking.pricing
        
        # Determine payment status
        payment_status = booking.payment_status if booking.payment_status else booking.paymentMethod
        
        new_booking = {
            "id": str(uuid.uuid4()),
            "referenceNumber": ref_number,  # Sequential reference number
            "name": booking.name,
            "email": booking.email,
            "ccEmail": booking.ccEmail or "",  # CC email for confirmations
            "phone": booking.phone,
            "serviceType": booking.serviceType,
            "pickupAddress": booking.pickupAddress,
            "pickupAddresses": booking.pickupAddresses or [],  # Store multiple pickups
            "dropoffAddress": booking.dropoffAddress,
            "date": booking.date,
            "time": booking.time,
            "passengers": booking.passengers,
            "pricing": pricing_data,
            "totalPrice": total_price,
            "notes": booking.notes,
            "status": booking.status or "confirmed",
            "payment_status": payment_status,
            "payment_method": booking.paymentMethod,
            "driver_name": booking.driver_name or "",
            "flightArrivalNumber": booking.flightArrivalNumber or "",
            "flightArrivalTime": booking.flightArrivalTime or "",
            "flightDepartureNumber": booking.flightDepartureNumber or "",
            "flightDepartureTime": booking.flightDepartureTime or "",
            "bookReturn": booking.bookReturn or False,
            "returnDate": booking.returnDate or "",
            "returnTime": booking.returnTime or "",
            "notifications_sent": booking.skipNotifications,  # Mark as sent if skipping
            "createdAt": datetime.now(timezone.utc)
        }
        
        await db.bookings.insert_one(new_booking)
        logger.info(f"Manual booking created: #{ref_number} - Payment: {payment_status} - Skip notifications: {booking.skipNotifications}")
        
        # === BACKGROUND TASKS: Only run if NOT skipping notifications ===
        if not booking.skipNotifications:
            # Handle payment link sending based on payment method (in background)
            if booking.paymentMethod == 'stripe':
                background_tasks.add_task(
                    run_async_task,
                    send_stripe_payment_link_background,
                    new_booking,
                    f"Stripe payment link for booking #{ref_number}"
                )
            elif booking.paymentMethod == 'paypal':
                background_tasks.add_task(
                    run_async_task,
                    send_paypal_payment_link_background,
                    new_booking,
                    f"PayPal payment link for booking #{ref_number}"
                )
            else:
                # Send confirmation email (with CC if provided) in background
                background_tasks.add_task(
                    run_sync_task_with_args,
                    send_booking_confirmation_email,
                    new_booking,
                    True,  # include_payment_link
                    f"confirmation email for booking #{ref_number}"
                )
            
            # Send confirmation SMS in background
            background_tasks.add_task(
                run_sync_task,
                send_booking_confirmation_sms,
                new_booking,
                f"confirmation SMS for booking #{ref_number}"
            )
            
            # Send admin notification in background
            background_tasks.add_task(
                run_async_task,
                send_booking_notification_to_admin,
                new_booking,
                f"admin notification for booking #{ref_number}"
            )
            
            # Create calendar event in background
            background_tasks.add_task(
                run_async_task,
                create_calendar_event,
                new_booking,
                f"calendar event for booking #{ref_number}"
            )
            
            # Sync contact to iCloud in background
            background_tasks.add_task(
                run_sync_task,
                add_contact_to_icloud,
                new_booking,
                f"iCloud contact sync for booking #{ref_number}"
            )
        else:
            logger.info(f"Skipping all notifications for booking #{ref_number} as requested")
        
        return {"message": "Booking created successfully", "id": new_booking['id'], "referenceNumber": ref_number, "paymentLinkSent": booking.paymentMethod in ['stripe', 'paypal'] and not booking.skipNotifications}
    except Exception as e:
        logger.error(f"Error creating manual booking: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Update Payment Status
@api_router.put("/bookings/{booking_id}/payment-status")
async def update_payment_status(booking_id: str, paymentStatus: str = Body(..., embed=True)):
    """Update payment status for a booking"""
    try:
        # Validate payment status
        valid_statuses = ['paid', 'unpaid', 'cash', 'pay-on-pickup', 'pending']
        if paymentStatus not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid payment status. Must be one of: {valid_statuses}")
        
        result = await db.bookings.update_one(
            {"id": booking_id},
            {"$set": {"payment_status": paymentStatus}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        logger.info(f"Payment status updated for booking {booking_id} to {paymentStatus}")
        return {"success": True, "message": "Payment status updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating payment status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Bulk Operations
@api_router.post("/bookings/bulk-status")
async def bulk_status_update(booking_ids: List[str], new_status: str):
    """Update status for multiple bookings"""
    try:
        result = await db.bookings.update_many(
            {"id": {"$in": booking_ids}},
            {"$set": {"status": new_status}}
        )
        return {"message": "Status updated", "count": result.modified_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== DRIVER MANAGEMENT ====================

# Driver Application Model
class DriverApplication(BaseModel):
    name: str
    email: str
    phone: str
    suburb: str
    vehicleType: str
    vehicleYear: str
    experience: Optional[str] = ""
    availability: Optional[str] = ""
    message: Optional[str] = ""

@api_router.post("/driver-applications")
async def submit_driver_application(application: DriverApplication):
    """Submit a new driver application"""
    try:
        app_data = {
            "id": str(uuid4()),
            "name": application.name,
            "email": application.email,
            "phone": application.phone,
            "suburb": application.suburb,
            "vehicle_type": application.vehicleType,
            "vehicle_year": application.vehicleYear,
            "experience": application.experience,
            "availability": application.availability,
            "message": application.message,
            "status": "pending",
            "created_at": datetime.now(timezone.utc),
            "reviewed_at": None,
            "notes": ""
        }
        
        await db.driver_applications.insert_one(app_data)
        
        # Send notification email to admin
        mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
        mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
        admin_email = os.environ.get('ADMIN_EMAIL', 'bookings@bookaride.co.nz')
        
        if mailgun_api_key and mailgun_domain:
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #D4AF37; color: #1a1a1a; padding: 20px; text-align: center;">
                        <h1 style="margin: 0;">New Driver Application</h1>
                    </div>
                    <div style="padding: 20px; background-color: #f5f5f5;">
                        <h2>ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Driver Application Received</h2>
                        <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #D4AF37;">
                            <p><strong>Name:</strong> {application.name}</p>
                            <p><strong>Phone:</strong> {application.phone}</p>
                            <p><strong>Email:</strong> {application.email}</p>
                            <p><strong>Suburb:</strong> {application.suburb}</p>
                            <hr style="border: 0; border-top: 1px solid #e0e0e0;">
                            <p><strong>Vehicle:</strong> {application.vehicleType} ({application.vehicleYear})</p>
                            <p><strong>Experience:</strong> {application.experience or 'Not specified'}</p>
                            <p><strong>Availability:</strong> {application.availability or 'Not specified'}</p>
                            <p><strong>Message:</strong> {application.message or 'None'}</p>
                        </div>
                        <p style="margin-top: 20px;">Review this application in your <a href="https://bookaride.co.nz/admin/dashboard" style="color: #D4AF37;">Admin Dashboard</a>.</p>
                    </div>
                </body>
            </html>
            """
            
            requests.post(
                f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
                auth=("api", mailgun_api_key),
                data={
                    "from": f"BookaRide <noreply@{mailgun_domain}>",
                    "to": admin_email,
                    "subject": f"New Driver Application - {application.name}",
                    "html": html_content
                }
            )
        
        logger.info(f"Driver application received from {application.name} ({application.email})")
        return {"success": True, "message": "Application submitted successfully"}
    except Exception as e:
        logger.error(f"Error submitting driver application: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/driver-applications")
async def get_driver_applications(current_admin: dict = Depends(get_current_admin)):
    """Get all driver applications (admin only)"""
    try:
        applications = await db.driver_applications.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
        return {"applications": applications}
    except Exception as e:
        logger.error(f"Error getting driver applications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.patch("/driver-applications/{application_id}")
async def update_driver_application(application_id: str, status: str, notes: Optional[str] = ""):
    """Update driver application status"""
    try:
        result = await db.driver_applications.update_one(
            {"id": application_id},
            {"$set": {"status": status, "notes": notes, "reviewed_at": datetime.now(timezone.utc)}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Application not found")
        return {"message": "Application updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating driver application: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Driver Models
class DriverCreate(BaseModel):
    name: str
    phone: str
    email: str
    license_number: str
    status: str = "active"
    notes: Optional[str] = ""

@api_router.get("/drivers")
async def get_drivers():
    """Get all drivers"""
    try:
        drivers = await db.drivers.find({}, {"_id": 0}).to_list(1000)
        return {"drivers": drivers}
    except Exception as e:
        logger.error(f"Error getting drivers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/drivers")
async def create_driver(driver: DriverCreate):
    """Create a new driver"""
    try:
        driver_id = str(uuid.uuid4())
        new_driver = {
            "id": driver_id,
            "name": driver.name,
            "phone": driver.phone,
            "email": driver.email,
            "license_number": driver.license_number,
            "status": driver.status,
            "notes": driver.notes,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await db.drivers.insert_one(new_driver)
        logger.info(f"Driver created: {driver_id}")
        
        # Return without MongoDB's _id
        return {
            "id": driver_id,
            "name": driver.name,
            "phone": driver.phone,
            "email": driver.email,
            "license_number": driver.license_number,
            "status": driver.status,
            "notes": driver.notes,
            "message": "Driver created successfully"
        }
    except Exception as e:
        logger.error(f"Error creating driver: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/drivers/{driver_id}")
async def update_driver(driver_id: str, driver: DriverCreate):
    """Update a driver"""
    try:
        result = await db.drivers.update_one(
            {"id": driver_id},
            {"$set": {
                "name": driver.name,
                "phone": driver.phone,
                "email": driver.email,
                "license_number": driver.license_number,
                "status": driver.status,
                "notes": driver.notes,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Driver not found")
        return {"message": "Driver updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating driver: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/drivers/{driver_id}")
async def delete_driver(driver_id: str):
    """Delete a driver"""
    try:
        result = await db.drivers.delete_one({"id": driver_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Driver not found")
        return {"message": "Driver deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting driver: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.patch("/drivers/{driver_id}/assign")
async def assign_driver_to_booking(driver_id: str, booking_id: str, trip_type: str = "outbound", driver_payout: Optional[float] = None):
    """Assign a driver to a booking - supports separate outbound and return trip assignments
    
    Args:
        driver_id: The driver's ID
        booking_id: The booking ID
        trip_type: "outbound" (default) or "return" - which leg of the trip
        driver_payout: Optional custom payout amount for the driver (overrides auto-calculation)
    """
    try:
        # Get driver details first
        driver = await db.drivers.find_one({"id": driver_id}, {"_id": 0})
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")
        
        # Get booking to check if it has a return trip
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Determine which fields to update based on trip type
        if trip_type == "return":
            # Return trip driver assignment
            if not booking.get('bookReturn'):
                raise HTTPException(status_code=400, detail="This booking doesn't have a return trip")
            
            update_fields = {
                "return_driver_id": driver_id,
                "return_driver_name": driver.get('name', ''),
                "return_driver_phone": driver.get('phone', ''),
                "return_driver_email": driver.get('email', ''),
                "return_driver_assigned_at": datetime.now(timezone.utc)
            }
            # Store driver payout override for return trip
            if driver_payout is not None:
                update_fields["return_driver_payout"] = driver_payout
            
            trip_label = "RETURN"
            trip_date = booking.get('returnDate', booking.get('date'))
            trip_time = booking.get('returnTime', '')
            # For return trip, pickup and dropoff are swapped
            pickup = booking.get('dropoffAddress', booking.get('dropoff', ''))
            dropoff = booking.get('pickupAddress', booking.get('pickup', ''))
        else:
            # Outbound trip driver assignment (default)
            update_fields = {
                "driver_id": driver_id,
                "driver_name": driver.get('name', ''),
                "driver_phone": driver.get('phone', ''),
                "driver_email": driver.get('email', ''),
                "driver_assigned_at": datetime.now(timezone.utc)
            }
            # Store driver payout override for outbound trip
            if driver_payout is not None:
                update_fields["driver_payout"] = driver_payout
            
            trip_label = "OUTBOUND"
            trip_date = booking.get('date', '')
            trip_time = booking.get('time', '')
            pickup = booking.get('pickupAddress', booking.get('pickup', ''))
            dropoff = booking.get('dropoffAddress', booking.get('dropoff', ''))
        
        # Update booking with driver assignment
        result = await db.bookings.update_one(
            {"id": booking_id},
            {"$set": update_fields}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Send notification to driver with trip-specific details
        if driver:
            # Create a modified booking object for the notification
            notification_booking = {
                **booking,
                'trip_type': trip_label,
                'date': trip_date,
                'time': trip_time,
                'pickupAddress': pickup,
                'dropoffAddress': dropoff,
                'pickup': pickup,
                'dropoff': dropoff
            }
            # Add driver payout override if set
            if driver_payout is not None:
                notification_booking['driver_payout_override'] = driver_payout
            
            await send_driver_notification(notification_booking, driver, trip_type=trip_label)
            logger.info(f"Driver {driver.get('name')} ({driver_id}) assigned to {trip_label} trip for booking {booking_id}" + (f" with payout ${driver_payout:.2f}" if driver_payout else ""))
        
        return {"message": f"Driver {driver.get('name')} assigned to {trip_label} trip successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning driver: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



@api_router.patch("/bookings/{booking_id}/confirm-driver")
async def confirm_driver_acknowledgment(booking_id: str, trip_type: str = "outbound", current_admin: dict = Depends(get_current_admin)):
    """Manually confirm driver acknowledgment from admin panel
    
    Args:
        booking_id: The booking ID
        trip_type: "outbound" (default) or "return" - which trip to confirm
    """
    try:
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        if trip_type == "return":
            if not booking.get('return_driver_id') and not booking.get('return_driver_name'):
                raise HTTPException(status_code=400, detail="No return driver assigned")
            
            update_fields = {
                "returnDriverAcknowledged": True,
                "returnDriverConfirmedBy": "admin",
                "returnDriverAcknowledgedAt": datetime.now(timezone.utc).isoformat()
            }
            driver_name = booking.get('return_driver_name', 'Unknown')
        else:
            if not booking.get('driver_id') and not booking.get('driver_name'):
                raise HTTPException(status_code=400, detail="No outbound driver assigned")
            
            update_fields = {
                "driverAcknowledged": True,
                "driverConfirmed": True,
                "driverResponse": "Confirmed by admin",
                "driverAcknowledgedAt": datetime.now(timezone.utc).isoformat()
            }
            driver_name = booking.get('driver_name', 'Unknown')
        
        await db.bookings.update_one(
            {"id": booking_id},
            {"$set": update_fields}
        )
        
        booking_ref = get_booking_reference(booking)
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Admin manually confirmed {trip_type} driver {driver_name} for booking #{booking_ref}")
        
        return {"success": True, "message": f"Driver {driver_name} confirmed for {trip_type} trip"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error confirming driver: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.patch("/bookings/{booking_id}/unassign-driver")
async def unassign_driver_from_booking(booking_id: str, trip_type: str = "outbound", current_admin: dict = Depends(get_current_admin)):
    """Unassign a driver from a booking
    
    Args:
        booking_id: The booking ID
        trip_type: "outbound" (default) or "return" - which leg of the trip to unassign
    """
    try:
        # Get booking to check current driver
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Determine which fields to clear based on trip type
        if trip_type == "return":
            current_driver = booking.get('return_driver_name', '')
            clear_fields = {
                "return_driver_id": None,
                "return_driver_name": None,
                "return_driver_phone": None,
                "return_driver_email": None,
                "return_driver_assigned_at": None
            }
            trip_label = "RETURN"
        else:
            current_driver = booking.get('driver_name', '')
            clear_fields = {
                "driver_id": None,
                "driver_name": None,
                "driver_phone": None,
                "driver_email": None,
                "driver_assigned_at": None,
                "assignedDriver": None,
                "assignedDriverId": None,
                "driverConfirmed": False,
                "driverAcknowledged": False,
                "driverResponse": None,
                "driverRespondedAt": None
            }
            trip_label = "OUTBOUND"
        
        if not current_driver:
            raise HTTPException(status_code=400, detail=f"No driver assigned to {trip_label} trip")
        
        # Update booking to clear driver assignment using $unset to fully remove fields
        # and $set to reset boolean flags
        unset_fields = {}
        set_fields = {}
        
        for key, value in clear_fields.items():
            if value is None:
                unset_fields[key] = ""
            else:
                set_fields[key] = value
        
        update_query = {}
        if unset_fields:
            update_query["$unset"] = unset_fields
        if set_fields:
            update_query["$set"] = set_fields
        
        result = await db.bookings.update_one(
            {"id": booking_id},
            update_query
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        logger.info(f"Driver {current_driver} unassigned from {trip_label} trip for booking {booking_id}")
        
        return {"message": f"Driver {current_driver} unassigned from {trip_label} trip successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unassigning driver: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== DRIVER PORTAL ====================

# Driver Login
class DriverLogin(BaseModel):
    email: str
    password: str

@api_router.post("/driver/login")
async def driver_login(credentials: DriverLogin):
    """Driver login endpoint"""
    try:
        # Find driver by email
        driver = await db.drivers.find_one({"email": credentials.email}, {"_id": 0})
        
        if not driver:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if driver has a password set
        if "password" not in driver or not driver["password"]:
            raise HTTPException(status_code=401, detail="Password not set. Please contact admin.")
        
        # Verify password
        if not verify_password(credentials.password, driver["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if driver is active
        if driver.get("status") != "active":
            raise HTTPException(status_code=403, detail="Your account is not active. Please contact admin.")
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": driver["email"], "type": "driver"},
            expires_delta=access_token_expires
        )
        
        logger.info(f"Driver logged in: {driver['email']}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "driver": {
                "id": driver["id"],
                "name": driver["name"],
                "email": driver["email"],
                "phone": driver["phone"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in driver login: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/drivers/{driver_id}/bookings")
async def get_driver_bookings(driver_id: str, date: Optional[str] = None):
    """Get bookings assigned to a driver - shows ONLY the driver payout set by admin"""
    try:
        # Query for both outbound and return driver assignments
        query = {
            "$or": [
                {"driver_id": driver_id},
                {"return_driver_id": driver_id}
            ]
        }
        
        # Get all bookings for the driver
        all_bookings = await db.bookings.find(query, {"_id": 0}).to_list(1000)
        
        for booking in all_bookings:
            # Determine if this driver is for outbound or return
            is_return_driver = booking.get('return_driver_id') == driver_id and booking.get('driver_id') != driver_id
            
            if is_return_driver:
                # Use return driver payout
                override = booking.get('return_driver_payout') or booking.get('return_driver_payout_override')
                booking['trip_type'] = 'return'
            else:
                # Use outbound driver payout
                override = booking.get('driver_payout_override') or booking.get('driver_payout')
                booking['trip_type'] = 'outbound'
            
            booking['driver_price'] = float(override) if override else 0
            
            # REMOVE ALL PRICING - drivers see ONLY their payout
            booking.pop('pricing', None)
            booking.pop('totalPrice', None)
            booking.pop('basePrice', None)
            booking.pop('subtotal', None)
            booking.pop('driver_payout', None)
            booking.pop('driver_payout_override', None)
            booking.pop('return_driver_payout', None)
            booking.pop('return_driver_payout_override', None)
        
        return {"bookings": all_bookings}
    except Exception as e:
        logger.error(f"Error getting driver bookings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Set Driver Password (Admin only)
class SetDriverPassword(BaseModel):
    driver_id: str
    password: str

@api_router.post("/drivers/set-password")
async def set_driver_password(data: SetDriverPassword, current_admin: dict = Depends(get_current_admin)):
    """Set password for a driver (admin only)"""
    try:
        hashed_password = get_password_hash(data.password)
        
        result = await db.drivers.update_one(
            {"id": data.driver_id},
            {"$set": {"password": hashed_password, "updated_at": datetime.now(timezone.utc)}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Driver not found")
        
        logger.info(f"Password set for driver: {data.driver_id}")
        return {"message": "Password set successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting driver password: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



@api_router.get("/drivers/{driver_id}/schedule")
async def get_driver_schedule(driver_id: str, date: Optional[str] = None):
    """Get driver's schedule for a specific date"""
    try:
        query = {"driver_id": driver_id}
        if date:
            query["date"] = date
        
        bookings = await db.bookings.find(query, {"_id": 0}).to_list(1000)
        return {"bookings": bookings}
    except Exception as e:
        logger.error(f"Error getting driver schedule: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str, send_notification: bool = True, current_admin: dict = Depends(get_current_admin)):
    """Soft-delete a single booking (moves to deleted_bookings collection)"""
    try:
        # First, get the booking details before deleting (for notifications)
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Send cancellation notifications if requested
        if send_notification:
            try:
                await send_cancellation_notifications(booking)
            except Exception as e:
                logger.error(f"Error sending cancellation notifications: {str(e)}")
                # Continue with deletion even if notifications fail
        
        # SOFT DELETE: Move to deleted_bookings collection instead of permanent delete
        booking['deletedAt'] = datetime.now(timezone.utc).isoformat()
        booking['deletedBy'] = current_admin.get('username', 'admin')
        booking['notificationSent'] = send_notification
        await db.deleted_bookings.insert_one(booking)
        
        # Remove from active bookings
        result = await db.bookings.delete_one({"id": booking_id})
        if result.deleted_count == 0:
            # Rollback the soft delete if original wasn't found
            await db.deleted_bookings.delete_one({"id": booking_id})
            raise HTTPException(status_code=404, detail="Booking not found")
        
        logger.info(f"Booking {booking_id} soft-deleted by {current_admin.get('username', 'admin')}, notifications sent: {send_notification}")
        return {"message": "Booking cancelled successfully", "notifications_sent": send_notification}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting booking: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def send_cancellation_notifications(booking: dict):
    """Send cancellation email and SMS to customer"""
    customer_email = booking.get('email')
    customer_phone = booking.get('phone')
    customer_name = booking.get('name', 'Valued Customer')
    booking_date = booking.get('date', 'N/A')
    booking_time = booking.get('time', 'N/A')
    pickup = booking.get('pickupAddress', 'N/A')
    dropoff = booking.get('dropoffAddress', 'N/A')
    
    # Send cancellation email
    if customer_email:
        try:
            await send_cancellation_email(booking, customer_email, customer_name)
            logger.info(f"Cancellation email sent to {customer_email}")
        except Exception as e:
            logger.error(f"Failed to send cancellation email: {str(e)}")
    
    # Send cancellation SMS
    if customer_phone:
        try:
            send_cancellation_sms(booking, customer_phone, customer_name)
            logger.info(f"Cancellation SMS sent to {customer_phone}")
        except Exception as e:
            logger.error(f"Failed to send cancellation SMS: {str(e)}")

async def send_cancellation_email(booking: dict, to_email: str, customer_name: str):
    """Send cancellation email via Mailgun"""
    mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
    mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
    sender_email = os.environ.get('SENDER_EMAIL', 'bookings@bookaride.co.nz')
    
    if not mailgun_api_key or not mailgun_domain:
        logger.warning("Mailgun credentials not configured for cancellation email")
        return
    
    # Format date and get references
    formatted_date = format_date_ddmmyyyy(booking.get('date', 'N/A'))
    booking_ref = get_booking_reference(booking)
    full_booking_id = get_full_booking_reference(booking)
    booking_time = booking.get('time', 'N/A')
    pickup = booking.get('pickupAddress', 'N/A')
    dropoff = booking.get('dropoffAddress', 'N/A')
    service_type = booking.get('serviceType', 'Transfer')
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .header h1 {{ margin: 0; color: white; }}
            .content {{ background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e8e4d9; border-top: none; }}
            .booking-details {{ background: #faf8f3; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }}
            .detail-row {{ margin: 10px 0; }}
            .label {{ font-weight: bold; color: #666; }}
            .footer {{ text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; background: #faf8f3; border-radius: 8px; }}
            .contact {{ background: #fff8e6; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center; border: 1px solid #D4AF37; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Booking Cancelled</h1>
                <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9);">Book A Ride NZ</p>
            </div>
            <div class="content">
                <p>Dear {customer_name},</p>
                
                <p>We're sorry to inform you that your booking has been cancelled. If you did not request this cancellation, please contact us immediately.</p>
                
                <div class="booking-details">
                    <h3 style="margin-top: 0; color: #dc2626;">Cancelled Booking Details</h3>
                    <div class="detail-row"><span class="label">Reference:</span> {booking_ref}</div>
                    <div class="detail-row" style="font-size: 11px; color: #999;">Full ID: {full_booking_id}</div>
                    <div class="detail-row"><span class="label">Service:</span> {service_type}</div>
                    <div class="detail-row"><span class="label">Date:</span> {formatted_date}</div>
                    <div class="detail-row"><span class="label">Time:</span> {booking_time}</div>
                    <div class="detail-row"><span class="label">Pickup:</span> {pickup}</div>
                    <div class="detail-row"><span class="label">Drop-off:</span> {dropoff}</div>
                </div>
                
                <p>If you paid for this booking, a refund will be processed within 5-7 business days.</p>
                
                <p>We hope to serve you again in the future!</p>
                
                <div class="contact">
                    <p style="margin: 0;"><strong>Need to rebook?</strong></p>
                    <p style="margin: 5px 0;">Visit <a href="https://bookaride.co.nz/book-now" style="color: #D4AF37;">bookaride.co.nz</a> or call us at <strong style="color: #D4AF37;">+64 21 743 321</strong></p>
                </div>
            </div>
            <div class="footer">
                <p>Book A Ride NZ - Your Trusted Airport Shuttle Service</p>
                <p>Auckland | Hamilton | Nationwide</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
            auth=("api", mailgun_api_key),
            data={
                "from": f"Book A Ride NZ <{sender_email}>",
                "to": to_email,
                "subject": f"Booking Cancelled - Ref: {booking_ref} - Book A Ride NZ",
                "html": html_content
            }
        )
        
        if response.status_code != 200:
            logger.error(f"Mailgun cancellation email failed: {response.text}")
            raise Exception(f"Failed to send email: {response.status_code}")

def send_cancellation_sms(booking: dict, to_phone: str, customer_name: str):
    """Send cancellation SMS via Twilio"""
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')
    
    if not account_sid or not auth_token or not twilio_phone:
        logger.warning("Twilio credentials not configured for cancellation SMS")
        return
    
    # Format date and get reference
    formatted_date = format_date_ddmmyyyy(booking.get('date', 'N/A'))
    booking_ref = get_booking_reference(booking)
    booking_time = booking.get('time', 'N/A')
    
    sms_body = f"""Book A Ride NZ - Booking Cancelled

Ref: {booking_ref}
Hi {customer_name.split()[0] if customer_name else 'there'},

Your booking for {formatted_date} at {booking_time} has been cancelled.

If you didn't request this, please call us at 021-743-321.

To rebook: bookaride.co.nz"""
    
    formatted_phone = format_nz_phone(to_phone)
    if not formatted_phone:
        logger.warning("No phone number for cancellation SMS")
        return
    
    logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â± Sending cancellation SMS to: {formatted_phone}")
    
    client = Client(account_sid, auth_token)
    message = client.messages.create(
        body=sms_body,
        from_=twilio_phone,
        to=formatted_phone
    )
    
    logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Cancellation SMS sent to {formatted_phone} - SID: {message.sid}")

@api_router.delete("/bookings/bulk-delete")
async def bulk_delete(booking_ids: List[str], send_notifications: bool = False, current_admin: dict = Depends(get_current_admin)):
    """Soft-delete multiple bookings (moves to deleted_bookings collection)"""
    try:
        # Get all bookings first
        bookings = await db.bookings.find({"id": {"$in": booking_ids}}, {"_id": 0}).to_list(1000)
        
        if send_notifications:
            for booking in bookings:
                try:
                    await send_cancellation_notifications(booking)
                except Exception as e:
                    logger.error(f"Error sending cancellation for booking {booking.get('id')}: {str(e)}")
        
        # SOFT DELETE: Move all to deleted_bookings collection
        deleted_count = 0
        for booking in bookings:
            booking['deletedAt'] = datetime.now(timezone.utc).isoformat()
            booking['deletedBy'] = current_admin.get('username', 'admin')
            booking['notificationSent'] = send_notifications
            await db.deleted_bookings.insert_one(booking)
            deleted_count += 1
        
        # Remove from active bookings
        result = await db.bookings.delete_many({"id": {"$in": booking_ids}})
        
        logger.info(f"Bulk soft-deleted {deleted_count} bookings by {current_admin.get('username', 'admin')}")
        return {"message": "Bookings deleted", "count": result.deleted_count, "notifications_sent": send_notifications}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# DELETED BOOKINGS RECOVERY ENDPOINTS
# ============================================

@api_router.get("/bookings/deleted")
async def get_deleted_bookings(current_admin: dict = Depends(get_current_admin)):
    """Get all soft-deleted bookings for recovery"""
    try:
        deleted_bookings = await db.deleted_bookings.find({}, {"_id": 0}).sort("deletedAt", -1).to_list(1000)
        return deleted_bookings
    except Exception as e:
        logger.error(f"Error fetching deleted bookings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/bookings/restore/{booking_id}")
async def restore_booking(booking_id: str, current_admin: dict = Depends(get_current_admin)):
    """Restore a soft-deleted booking back to active bookings"""
    try:
        # Find the deleted booking
        deleted_booking = await db.deleted_bookings.find_one({"id": booking_id}, {"_id": 0})
        if not deleted_booking:
            raise HTTPException(status_code=404, detail="Deleted booking not found")
        
        # Remove deletion metadata
        deleted_booking.pop('deletedAt', None)
        deleted_booking.pop('deletedBy', None)
        deleted_booking.pop('notificationSent', None)
        deleted_booking['restoredAt'] = datetime.now(timezone.utc).isoformat()
        deleted_booking['restoredBy'] = current_admin.get('username', 'admin')
        
        # Insert back into active bookings
        await db.bookings.insert_one(deleted_booking)
        
        # Remove from deleted_bookings
        await db.deleted_bookings.delete_one({"id": booking_id})
        
        # Remove _id before returning (MongoDB adds it during insert)
        deleted_booking.pop('_id', None)
        
        logger.info(f"Booking {booking_id} restored by {current_admin.get('username', 'admin')}")
        return {"message": "Booking restored successfully", "booking_id": booking_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error restoring booking: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/bookings/permanent/{booking_id}")
async def permanent_delete_booking(booking_id: str, current_admin: dict = Depends(get_current_admin)):
    """Permanently delete a booking from deleted_bookings (no recovery possible)"""
    try:
        result = await db.deleted_bookings.delete_one({"id": booking_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Deleted booking not found")
        
        logger.info(f"Booking {booking_id} permanently deleted by {current_admin.get('username', 'admin')}")
        return {"message": "Booking permanently deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error permanently deleting booking: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# BOOKING ARCHIVE ENDPOINTS (7-year retention)
# ============================================

@api_router.post("/bookings/archive/{booking_id}")
async def archive_booking(booking_id: str, current_admin: dict = Depends(get_current_admin)):
    """Archive a completed booking - moves to archive collection for long-term storage"""
    try:
        # Find the booking
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Add archive metadata
        booking['archivedAt'] = datetime.now(timezone.utc).isoformat()
        booking['archivedBy'] = current_admin.get('username', 'admin')
        booking['archiveReason'] = 'manual'
        # Set retention expiry (7 years from archive date)
        booking['retentionExpiry'] = (datetime.now(timezone.utc) + timedelta(days=365*7)).isoformat()
        
        # Insert into archive collection
        await db.bookings_archive.insert_one(booking)
        
        # Remove from active bookings
        await db.bookings.delete_one({"id": booking_id})
        
        logger.info(f"Booking {booking_id} (Ref #{booking.get('referenceNumber', 'N/A')}) archived by {current_admin.get('username', 'admin')}")
        return {"message": "Booking archived successfully", "booking_id": booking_id, "referenceNumber": booking.get('referenceNumber')}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error archiving booking: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/bookings/archive-bulk")
async def archive_bookings_bulk(
    booking_ids: List[str] = Body(..., embed=True),
    current_admin: dict = Depends(get_current_admin)
):
    """Archive multiple bookings at once"""
    try:
        archived_count = 0
        failed = []
        
        for booking_id in booking_ids:
            try:
                booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
                if booking:
                    booking['archivedAt'] = datetime.now(timezone.utc).isoformat()
                    booking['archivedBy'] = current_admin.get('username', 'admin')
                    booking['archiveReason'] = 'bulk'
                    booking['retentionExpiry'] = (datetime.now(timezone.utc) + timedelta(days=365*7)).isoformat()
                    
                    await db.bookings_archive.insert_one(booking)
                    await db.bookings.delete_one({"id": booking_id})
                    archived_count += 1
                else:
                    failed.append(booking_id)
            except Exception as e:
                failed.append(booking_id)
                logger.error(f"Failed to archive booking {booking_id}: {str(e)}")
        
        logger.info(f"Bulk archive: {archived_count} bookings archived by {current_admin.get('username', 'admin')}")
        return {"message": f"Archived {archived_count} bookings", "archived": archived_count, "failed": failed}
    except Exception as e:
        logger.error(f"Error in bulk archive: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/bookings/archived")
async def get_archived_bookings(
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin)
):
    """Get archived bookings with pagination and search"""
    try:
        query = {}
        
        # Search filter - search across multiple fields
        if search:
            search_lower = search.lower()
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"phone": {"$regex": search, "$options": "i"}},
                {"pickupAddress": {"$regex": search, "$options": "i"}},
                {"dropoffAddress": {"$regex": search, "$options": "i"}},
                {"referenceNumber": {"$regex": search, "$options": "i"}}
            ]
            # Also try to match reference number as integer
            try:
                ref_num = int(search)
                query["$or"].append({"referenceNumber": ref_num})
            except ValueError:
                pass
        
        # Date range filter
        if date_from or date_to:
            date_filter = {}
            if date_from:
                date_filter["$gte"] = date_from
            if date_to:
                date_filter["$lte"] = date_to
            query["date"] = date_filter
        
        # Get total count for pagination
        total = await db.bookings_archive.count_documents(query)
        
        # Get paginated results
        skip = (page - 1) * limit
        archived_bookings = await db.bookings_archive.find(query, {"_id": 0}).sort("archivedAt", -1).skip(skip).limit(limit).to_list(limit)
        
        return {
            "bookings": archived_bookings,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit
        }
    except Exception as e:
        logger.error(f"Error fetching archived bookings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/bookings/archived/count")
async def get_archived_count(current_admin: dict = Depends(get_current_admin)):
    """Get count of archived bookings"""
    try:
        total = await db.bookings_archive.count_documents({})
        return {"total": total}
    except Exception as e:
        logger.error(f"Error counting archived bookings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/bookings/unarchive/{booking_id}")
async def unarchive_booking(booking_id: str, current_admin: dict = Depends(get_current_admin)):
    """Restore an archived booking back to active bookings"""
    try:
        # Find the archived booking
        archived_booking = await db.bookings_archive.find_one({"id": booking_id}, {"_id": 0})
        if not archived_booking:
            raise HTTPException(status_code=404, detail="Archived booking not found")
        
        # Remove archive metadata
        archived_booking.pop('archivedAt', None)
        archived_booking.pop('archivedBy', None)
        archived_booking.pop('archiveReason', None)
        archived_booking.pop('retentionExpiry', None)
        archived_booking['unarchivedAt'] = datetime.now(timezone.utc).isoformat()
        archived_booking['unarchivedBy'] = current_admin.get('username', 'admin')
        
        # Insert back into active bookings
        await db.bookings.insert_one(archived_booking)
        
        # Remove from archive
        await db.bookings_archive.delete_one({"id": booking_id})
        
        logger.info(f"Booking {booking_id} (Ref #{archived_booking.get('referenceNumber', 'N/A')}) unarchived by {current_admin.get('username', 'admin')}")
        return {"message": "Booking restored from archive", "booking_id": booking_id, "referenceNumber": archived_booking.get('referenceNumber')}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unarchiving booking: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/bookings/search-all")
async def search_all_bookings(
    search: str,
    include_archived: bool = True,
    current_admin: dict = Depends(get_current_admin)
):
    """Search across both active and archived bookings"""
    try:
        search_query = {
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"phone": {"$regex": search, "$options": "i"}},
                {"pickupAddress": {"$regex": search, "$options": "i"}},
                {"dropoffAddress": {"$regex": search, "$options": "i"}},
                {"referenceNumber": {"$regex": search, "$options": "i"}}
            ]
        }
        
        # Try to match reference number as integer
        try:
            ref_num = int(search)
            search_query["$or"].append({"referenceNumber": ref_num})
        except ValueError:
            pass
        
        # Search active bookings
        active_bookings = await db.bookings.find(search_query, {"_id": 0}).to_list(100)
        for b in active_bookings:
            b['isArchived'] = False
        
        # Search archived bookings if requested
        archived_bookings = []
        if include_archived:
            archived_bookings = await db.bookings_archive.find(search_query, {"_id": 0}).to_list(100)
            for b in archived_bookings:
                b['isArchived'] = True
        
        # Combine results
        all_results = active_bookings + archived_bookings
        
        return {
            "results": all_results,
            "activeCount": len(active_bookings),
            "archivedCount": len(archived_bookings),
            "totalCount": len(all_results)
        }
    except Exception as e:
        logger.error(f"Error searching all bookings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# SEO MANAGEMENT ENDPOINTS
# ============================================

class SEOPage(BaseModel):
    page_path: str
    page_name: str
    title: str
    description: str
    keywords: str
    canonical: str
    updated_at: Optional[datetime] = None

@api_router.get("/seo/pages")
async def get_all_seo_pages(current_admin: dict = Depends(get_current_admin)):
    """Get all SEO page configurations"""
    try:
        pages = await db.seo_pages.find({}, {"_id": 0}).to_list(1000)
        return {"pages": pages}
    except Exception as e:
        logging.error(f"Error fetching SEO pages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/seo/pages/{page_path:path}")
async def get_seo_page(page_path: str):
    """Get SEO configuration for a specific page (public endpoint)"""
    try:
        page = await db.seo_pages.find_one({"page_path": page_path}, {"_id": 0})
        if page:
            return page
        return None
    except Exception as e:
        logging.error(f"Error fetching SEO page: {e}")
        return None

@api_router.post("/seo/pages")
async def create_or_update_seo_page(seo_page: SEOPage, current_admin: dict = Depends(get_current_admin)):
    """Create or update SEO configuration for a page"""
    try:
        seo_data = seo_page.model_dump()
        seo_data['updated_at'] = datetime.now(timezone.utc)
        
        # Upsert: update if exists, create if doesn't
        result = await db.seo_pages.update_one(
            {"page_path": seo_page.page_path},
            {"$set": seo_data},
            upsert=True
        )
        
        return {
            "success": True,
            "message": "SEO page configuration saved",
            "page_path": seo_page.page_path
        }
    except Exception as e:
        logging.error(f"Error saving SEO page: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/seo/pages/{page_path:path}")
async def delete_seo_page(page_path: str, current_admin: dict = Depends(get_current_admin)):
    """Delete SEO configuration for a page"""
    try:
        result = await db.seo_pages.delete_one({"page_path": page_path})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="SEO page not found")
        
        return {"success": True, "message": "SEO page configuration deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting SEO page: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/seo/initialize-all")
async def initialize_all_seo_pages(current_admin: dict = Depends(get_current_admin)):
    """Initialize SEO data for ALL pages including all 27 suburbs"""
    try:
        
        # Auckland Suburbs data with optimized SEO
        auckland_suburbs = [
            {"slug": "auckland-cbd", "name": "Auckland CBD", "city": "Auckland", "distance": 21, "price": 100},
            {"slug": "newmarket", "name": "Newmarket", "distance": 18, "price": 95},
            {"slug": "parnell", "name": "Parnell", "distance": 19, "price": 95},
            {"slug": "takapuna", "name": "Takapuna", "distance": 28, "price": 120},
            {"slug": "albany", "name": "Albany", "distance": 35, "price": 140},
            {"slug": "browns-bay", "name": "Browns Bay", "distance": 38, "price": 145},
            {"slug": "devonport", "name": "Devonport", "distance": 24, "price": 110},
            {"slug": "mt-eden", "name": "Mt Eden", "distance": 17, "price": 90},
            {"slug": "epsom", "name": "Epsom", "distance": 16, "price": 90},
            {"slug": "remuera", "name": "Remuera", "distance": 17, "price": 90},
            {"slug": "greenlane", "name": "Greenlane", "distance": 15, "price": 85},
            {"slug": "mission-bay", "name": "Mission Bay", "distance": 22, "price": 105},
            {"slug": "st-heliers", "name": "St Heliers", "distance": 24, "price": 110},
            {"slug": "howick", "name": "Howick", "distance": 18, "price": 95},
            {"slug": "botany", "name": "Botany", "distance": 12, "price": 80},
            {"slug": "pakuranga", "name": "Pakuranga", "distance": 14, "price": 85},
            {"slug": "manukau", "name": "Manukau", "distance": 8, "price": 70},
            {"slug": "papakura", "name": "Papakura", "distance": 22, "price": 105},
            {"slug": "pukekohe", "name": "Pukekohe", "distance": 45, "price": 160},
            {"slug": "henderson", "name": "Henderson", "distance": 28, "price": 120},
            {"slug": "new-lynn", "name": "New Lynn", "distance": 24, "price": 110},
            {"slug": "titirangi", "name": "Titirangi", "distance": 30, "price": 125},
            {"slug": "ponsonby", "name": "Ponsonby", "distance": 22, "price": 105},
            {"slug": "ellerslie", "name": "Ellerslie", "distance": 13, "price": 85},
            {"slug": "onehunga", "name": "Onehunga", "distance": 12, "price": 80},
            {"slug": "mt-wellington", "name": "Mt Wellington", "distance": 11, "price": 80},
            {"slug": "panmure", "name": "Panmure", "city": "Auckland", "distance": 13, "price": 85},
        ]
        
        # Hamilton & Waikato areas
        hamilton_areas = [
            {"slug": "hamilton-cbd", "name": "Hamilton CBD", "city": "Hamilton", "distance": 125, "price": 220},
            {"slug": "frankton-hamilton", "name": "Frankton", "city": "Hamilton", "distance": 125, "price": 220},
            {"slug": "hillcrest-hamilton", "name": "Hillcrest", "city": "Hamilton", "distance": 128, "price": 225},
            {"slug": "rototuna-hamilton", "name": "Rototuna", "city": "Hamilton", "distance": 130, "price": 225},
            {"slug": "hamilton-east", "name": "Hamilton East", "city": "Hamilton", "distance": 124, "price": 220},
            {"slug": "chartwell-hamilton", "name": "Chartwell", "city": "Hamilton", "distance": 127, "price": 220},
            {"slug": "cambridge", "name": "Cambridge", "city": "Cambridge", "distance": 110, "price": 200},
            {"slug": "te-awamutu", "name": "Te Awamutu", "city": "Te Awamutu", "distance": 135, "price": 230},
        ]
        
        # Whangarei & Northland areas
        whangarei_areas = [
            {"slug": "whangarei-cbd", "name": "Whangarei CBD", "city": "Whangarei", "distance": 165, "price": 280},
            {"slug": "onerahi-whangarei", "name": "Onerahi", "city": "Whangarei", "distance": 168, "price": 280},
            {"slug": "kensington-whangarei", "name": "Kensington", "city": "Whangarei", "distance": 164, "price": 280},
            {"slug": "tikipunga-whangarei", "name": "Tikipunga", "city": "Whangarei", "distance": 162, "price": 280},
            {"slug": "regent-whangarei", "name": "Regent", "city": "Whangarei", "distance": 165, "price": 280},
            {"slug": "whangarei-heads", "name": "Whangarei Heads", "city": "Whangarei", "distance": 180, "price": 300},
            {"slug": "ruakaka", "name": "Ruakaka", "city": "Ruakaka", "distance": 150, "price": 260},
            {"slug": "waipu", "name": "Waipu", "city": "Waipu", "distance": 140, "price": 250},
            {"slug": "mangawhai", "name": "Mangawhai", "city": "Mangawhai", "distance": 110, "price": 200},
        ]
        
        # Hibiscus Coast suburbs
        hibiscus_coast_suburbs = [
            {"slug": "orewa", "name": "Orewa", "city": "Hibiscus Coast", "distance": 42, "price": 125},
            {"slug": "whangaparaoa", "name": "WhangaparÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âoa", "city": "Hibiscus Coast", "distance": 48, "price": 135},
            {"slug": "silverdale", "name": "Silverdale", "city": "Hibiscus Coast", "distance": 38, "price": 120},
            {"slug": "red-beach", "name": "Red Beach", "city": "Hibiscus Coast", "distance": 45, "price": 130},
            {"slug": "stanmore-bay", "name": "Stanmore Bay", "city": "Hibiscus Coast", "distance": 46, "price": 130},
            {"slug": "arkles-bay", "name": "Arkles Bay", "city": "Hibiscus Coast", "distance": 47, "price": 135},
            {"slug": "army-bay", "name": "Army Bay", "city": "Hibiscus Coast", "distance": 49, "price": 135},
            {"slug": "manly", "name": "Manly", "city": "Hibiscus Coast", "distance": 47, "price": 130},
            {"slug": "gulf-harbour", "name": "Gulf Harbour", "city": "Hibiscus Coast", "distance": 50, "price": 140},
            {"slug": "millwater", "name": "Millwater", "city": "Hibiscus Coast", "distance": 40, "price": 120},
            {"slug": "stillwater", "name": "Stillwater", "city": "Hibiscus Coast", "distance": 36, "price": 115},
            {"slug": "hatfields-beach", "name": "Hatfields Beach", "city": "Hibiscus Coast", "distance": 43, "price": 125},
            {"slug": "waiwera", "name": "Waiwera", "city": "Hibiscus Coast", "distance": 45, "price": 130},
            {"slug": "wenderholm", "name": "Wenderholm", "city": "Hibiscus Coast", "distance": 44, "price": 125},
        ]
        
        # Auckland Hotels
        cbd_hotels = [
            {"slug": "skycity-grand-hotel", "name": "SkyCity Grand Hotel", "area": "Auckland CBD", "distance": 21, "price": 100},
            {"slug": "sofitel-auckland-viaduct", "name": "Sofitel Auckland Viaduct Harbour", "area": "Auckland CBD", "distance": 22, "price": 100},
            {"slug": "hilton-auckland", "name": "Hilton Auckland", "area": "Auckland CBD", "distance": 22, "price": 100},
            {"slug": "park-hyatt-auckland", "name": "Park Hyatt Auckland", "area": "Auckland CBD", "distance": 23, "price": 105},
            {"slug": "cordis-auckland", "name": "Cordis Auckland", "area": "Auckland CBD", "distance": 20, "price": 95},
            {"slug": "stamford-plaza-auckland", "name": "Stamford Plaza Auckland", "area": "Auckland CBD", "distance": 21, "price": 100},
            {"slug": "grand-millennium-auckland", "name": "Grand Millennium Auckland", "area": "Auckland CBD", "distance": 20, "price": 95},
            {"slug": "crowne-plaza-auckland", "name": "Crowne Plaza Auckland", "area": "Auckland CBD", "distance": 21, "price": 100},
            {"slug": "heritage-auckland", "name": "Heritage Auckland", "area": "Auckland CBD", "distance": 21, "price": 100},
            {"slug": "rydges-auckland", "name": "Rydges Auckland", "area": "Auckland CBD", "distance": 21, "price": 100},
            {"slug": "sudima-auckland-city", "name": "Sudima Auckland City", "area": "Auckland CBD", "distance": 21, "price": 100},
            {"slug": "citylife-auckland", "name": "CityLife Auckland", "area": "Auckland CBD", "distance": 21, "price": 100},
        ]
        
        airport_hotels = [
            {"slug": "novotel-auckland-airport", "name": "Novotel Auckland Airport", "area": "Auckland Airport", "distance": 0.5, "price": 45},
            {"slug": "jet-park-hotel-auckland", "name": "Jet Park Hotel Auckland Airport", "area": "Auckland Airport", "distance": 1, "price": 45},
            {"slug": "sudima-auckland-airport", "name": "Sudima Auckland Airport", "area": "Auckland Airport", "distance": 0.8, "price": 45},
            {"slug": "holiday-inn-auckland-airport", "name": "Holiday Inn Auckland Airport", "area": "Auckland Airport", "distance": 0.7, "price": 45},
            {"slug": "ibis-budget-auckland-airport", "name": "ibis Budget Auckland Airport", "area": "Auckland Airport", "distance": 1.2, "price": 50},
            {"slug": "distinction-auckland-airport", "name": "Distinction Hotel Auckland Airport", "area": "Auckland Airport", "distance": 0.9, "price": 45},
            {"slug": "heartland-hotel-auckland-airport", "name": "Heartland Hotel Auckland Airport", "area": "Auckland Airport", "distance": 0.8, "price": 45},
            {"slug": "auckland-airport-kiwi-motel", "name": "Auckland Airport Kiwi Motel", "area": "Auckland Airport", "distance": 1.5, "price": 50},
        ]
        
        # Combine all areas and hotels
        all_areas_data = auckland_suburbs + hamilton_areas + whangarei_areas + hibiscus_coast_suburbs
        all_hotels_data = cbd_hotels + airport_hotels
        
        # Generate SEO for all location pages
        area_pages = []
        for area in all_areas_data:
            city_name = area.get('city', 'Auckland')
            area_pages.append({
                "page_path": f"/suburbs/{area['slug']}",
                "page_name": f"{area['name']} to Auckland Airport Shuttle",
                "title": f"Airport Shuttle {area['name']} to Auckland Airport - From ${area['price']} | Book A Ride",
                "description": f"Reliable airport shuttle from {area['name']}, {city_name} to Auckland Airport. Professional drivers, fixed prices from ${area['price']}. {area['distance']}km, 24/7 service available. Book online now!",
                "keywords": f"{area['name']} airport shuttle, {area['name']} to Auckland airport, airport transfer {area['name']}, shuttle service {area['name']} Auckland, {area['name']} to airport, Auckland airport {area['name']}, {city_name} airport shuttle",
                "canonical": f"/suburbs/{area['slug']}"
            })
        
        # Generate SEO for all hotel pages
        hotel_pages = []
        for hotel in all_hotels_data:
            hotel_pages.append({
                "page_path": f"/hotels/{hotel['slug']}",
                "page_name": f"{hotel['name']} Airport Shuttle",
                "title": f"Airport Shuttle {hotel['name']} - Auckland Airport Transfer | From ${hotel['price']}",
                "description": f"Reliable airport shuttle from {hotel['name']}, {hotel['area']} to Auckland Airport. Professional door-to-door service. Fixed price ${hotel['price']}. Book online 24/7.",
                "keywords": f"{hotel['name']} airport shuttle, {hotel['name']} to airport, airport transfer {hotel['name']}, shuttle from {hotel['name']}, {hotel['name']} Auckland airport, {hotel['area']} hotel shuttle",
                "canonical": f"/hotels/{hotel['slug']}"
            })
        
        # All pages to initialize
        all_pages = area_pages + hotel_pages
        
        # Insert all pages
        count = 0
        for page in all_pages:
            page['updated_at'] = datetime.now(timezone.utc)
            await db.seo_pages.update_one(
                {"page_path": page['page_path']},
                {"$set": page},
                upsert=True
            )
            count += 1
        
        return {
            "success": True,
            "message": f"Initialized SEO for {count} pages (27 Auckland + 8 Hamilton + 9 Whangarei + 14 Hibiscus Coast + 20 Hotels = 78 locations)",
            "pages_created": count
        }
    except Exception as e:
        logging.error(f"Error initializing all SEO pages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/seo/initialize")
async def initialize_seo_pages(current_admin: dict = Depends(get_current_admin)):
    """Initialize SEO data for main pages only"""
    try:
        
        # Default SEO configurations for all pages
        default_pages = [
            {
                "page_path": "/",
                "page_name": "Home",
                "title": "Airport Shuttle Service NZ - Affordable Auckland Airport Shuttles",
                "description": "International bookings welcome! Affordable airport shuttle service in Auckland, New Zealand. Best value airport transfers for Auckland, Hamilton, and Whangarei airports. Multi-currency, 6 languages. Book online now!",
                "keywords": "airport shuttle, international booking, airport shuttle service, cheap airport shuttle, affordable shuttle, Auckland shuttles",
                "canonical": "/"
            },
            {
                "page_path": "/services",
                "page_name": "Services",
                "title": "Airport Shuttle Services - Auckland, Hamilton, Whangarei",
                "description": "Professional airport shuttle services across New Zealand. Airport transfers, private transfers, group bookings. 24/7 service available.",
                "keywords": "airport shuttle services, airport transfers, private transfers, group bookings",
                "canonical": "/services"
            },
            {
                "page_path": "/about",
                "page_name": "About Us",
                "title": "About Book A Ride NZ - Your Trusted Airport Shuttle Service",
                "description": "Learn about Book A Ride NZ, Auckland's trusted airport shuttle service. Professional drivers, reliable service since establishment.",
                "keywords": "about us, book a ride nz, airport shuttle company, Auckland transport",
                "canonical": "/about"
            },
            {
                "page_path": "/contact",
                "page_name": "Contact",
                "title": "Contact Us - Book Your Airport Shuttle Today",
                "description": "Contact Book A Ride NZ for airport shuttle bookings and inquiries. Available 24/7 for Auckland airport transfers.",
                "keywords": "contact, book airport shuttle, airport shuttle booking, contact airport shuttle",
                "canonical": "/contact"
            },
            {
                "page_path": "/book-now",
                "page_name": "Book Now",
                "title": "Book Your Airport Shuttle Now - Instant Quote & Online Booking",
                "description": "Book your airport shuttle online with instant live pricing. Auckland, Hamilton, Whangarei airport transfers. Easy online booking, secure payment.",
                "keywords": "book airport shuttle, online shuttle booking, instant quote shuttle, airport transfer booking",
                "canonical": "/book-now"
            }
        ]
        
        # Insert default pages
        for page in default_pages:
            page['updated_at'] = datetime.now(timezone.utc)
            await db.seo_pages.update_one(
                {"page_path": page['page_path']},
                {"$set": page},
                upsert=True
            )
        
        return {
            "success": True,
            "message": f"Initialized {len(default_pages)} main SEO page configurations"
        }
    except Exception as e:
        logging.error(f"Error initializing SEO pages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# SITEMAP GENERATION
# ============================================

@app.get("/sitemap.xml", include_in_schema=False)
async def generate_sitemap():
    """Generate XML sitemap with hreflang support for international SEO"""
    from xml.etree.ElementTree import Element, SubElement, tostring
    
    base_url = "https://bookaride.co.nz"
    
    # Supported languages
    languages = ['en', 'zh', 'ja', 'ko', 'es', 'fr']
    
    # Define all pages with priority and change frequency
    main_pages = [
        # Main pages (will have language versions)
        {"path": "/", "priority": "1.0", "changefreq": "daily", "multilang": True},
        {"path": "/book-now", "priority": "1.0", "changefreq": "daily", "multilang": True},
        {"path": "/services", "priority": "0.9", "changefreq": "weekly", "multilang": True},
        {"path": "/about", "priority": "0.8", "changefreq": "monthly", "multilang": True},
        {"path": "/contact", "priority": "0.9", "changefreq": "monthly", "multilang": True},
        {"path": "/hobbiton-transfers", "priority": "0.8", "changefreq": "weekly", "multilang": True},
        {"path": "/cruise-transfers", "priority": "0.8", "changefreq": "weekly", "multilang": True},
        
        # International Market Landing Pages
        {"path": "/visitors/australia", "priority": "0.9", "changefreq": "weekly", "multilang": False},
        {"path": "/visitors/china", "priority": "0.9", "changefreq": "weekly", "multilang": False},
        {"path": "/visitors/japan", "priority": "0.9", "changefreq": "weekly", "multilang": False},
        {"path": "/visitors/korea", "priority": "0.9", "changefreq": "weekly", "multilang": False},
        {"path": "/visitors/singapore", "priority": "0.9", "changefreq": "weekly", "multilang": False},
        {"path": "/visitors/usa", "priority": "0.9", "changefreq": "weekly", "multilang": False},
        {"path": "/visitors/uk", "priority": "0.9", "changefreq": "weekly", "multilang": False},
        {"path": "/visitors/germany", "priority": "0.9", "changefreq": "weekly", "multilang": False},
        {"path": "/visitors/france", "priority": "0.9", "changefreq": "weekly", "multilang": False},
        
        # International Service Pages
        {"path": "/international/auckland-airport", "priority": "0.9", "changefreq": "weekly", "multilang": True},
        {"path": "/international/hamilton-airport", "priority": "0.9", "changefreq": "weekly", "multilang": True},
        {"path": "/international/corporate-transfers", "priority": "0.8", "changefreq": "weekly", "multilang": True},
        {"path": "/international/group-bookings", "priority": "0.8", "changefreq": "weekly", "multilang": True},
    ]
    
    # Suburb and hotel pages (English only)
    local_pages = [
        {"path": "/suburbs", "priority": "0.9", "changefreq": "weekly"},
        
        # Auckland Suburbs - all 27
        {"path": "/suburbs/auckland-cbd", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/suburbs/newmarket", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/parnell", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/takapuna", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/albany", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/browns-bay", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/devonport", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/mt-eden", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/epsom", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/remuera", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/greenlane", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/mission-bay", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/st-heliers", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/howick", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/botany", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/pakuranga", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/manukau", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/suburbs/papakura", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/pukekohe", "priority": "0.7", "changefreq": "weekly"},
        {"path": "/suburbs/henderson", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/new-lynn", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/titirangi", "priority": "0.7", "changefreq": "weekly"},
        {"path": "/suburbs/ponsonby", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/ellerslie", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/onehunga", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/mt-wellington", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/panmure", "priority": "0.8", "changefreq": "weekly"},
        
        # Hamilton & Waikato - 8 areas
        {"path": "/suburbs/hamilton-cbd", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/suburbs/frankton-hamilton", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/hillcrest-hamilton", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/rototuna-hamilton", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/hamilton-east", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/chartwell-hamilton", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/cambridge", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/te-awamutu", "priority": "0.7", "changefreq": "weekly"},
        
        # Whangarei & Northland - 9 areas
        {"path": "/suburbs/whangarei-cbd", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/suburbs/onerahi-whangarei", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/kensington-whangarei", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/tikipunga-whangarei", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/regent-whangarei", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/whangarei-heads", "priority": "0.7", "changefreq": "weekly"},
        {"path": "/suburbs/ruakaka", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/waipu", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/mangawhai", "priority": "0.8", "changefreq": "weekly"},
        
        # Hotels Directory
        {"path": "/hotels", "priority": "0.9", "changefreq": "weekly"},
        
        # Auckland CBD Hotels - 12 hotels
        {"path": "/hotels/skycity-grand-hotel", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/hotels/sofitel-auckland-viaduct", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/hotels/hilton-auckland", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/hotels/park-hyatt-auckland", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/hotels/cordis-auckland", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/hotels/stamford-plaza-auckland", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/hotels/grand-millennium-auckland", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/hotels/crowne-plaza-auckland", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/hotels/heritage-auckland", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/hotels/rydges-auckland", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/hotels/sudima-auckland-city", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/hotels/citylife-auckland", "priority": "0.8", "changefreq": "weekly"},
        
        # Auckland Airport Hotels - 8 hotels
        {"path": "/hotels/novotel-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/hotels/jet-park-hotel-auckland", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/hotels/sudima-auckland-airport", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/hotels/holiday-inn-auckland-airport", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/hotels/ibis-budget-auckland-airport", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/hotels/distinction-auckland-airport", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/hotels/heartland-hotel-auckland-airport", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/hotels/auckland-airport-kiwi-motel", "priority": "0.7", "changefreq": "weekly"},
        
        # Hibiscus Coast Main Page
        {"path": "/hibiscus-coast", "priority": "0.9", "changefreq": "weekly"},
        
        # Hibiscus Coast Suburbs - 14 suburbs
        {"path": "/suburbs/orewa", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/suburbs/whangaparaoa", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/suburbs/silverdale", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/red-beach", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/stanmore-bay", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/arkles-bay", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/army-bay", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/manly", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/gulf-harbour", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/millwater", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/stillwater", "priority": "0.7", "changefreq": "weekly"},
        {"path": "/suburbs/hatfields-beach", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/waiwera", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/suburbs/wenderholm", "priority": "0.7", "changefreq": "weekly"},
        
        # Policy Pages
        {"path": "/terms-and-conditions", "priority": "0.5", "changefreq": "monthly"},
        {"path": "/website-usage-policy", "priority": "0.5", "changefreq": "monthly"},
        {"path": "/privacy-policy", "priority": "0.5", "changefreq": "monthly"},
        
        # Auckland CBD SEO Landing Pages (HIGH PRIORITY)
        {"path": "/auckland-cbd-airport", "priority": "1.0", "changefreq": "weekly"},
        {"path": "/ponsonby-to-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/parnell-to-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/newmarket-to-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/remuera-to-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/mt-eden-to-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/grey-lynn-to-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/epsom-to-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/mission-bay-to-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/viaduct-to-airport", "priority": "0.9", "changefreq": "weekly"},
        
        # Programmatic Auckland Suburb Pages (50+ suburbs)
        {"path": "/britomart-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/freemans-bay-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/herne-bay-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/st-marys-bay-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/grafton-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/eden-terrace-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/kingsland-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/morningside-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/sandringham-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/st-heliers-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/kohimarama-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/orakei-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/meadowbank-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/glen-innes-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/panmure-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/ellerslie-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/mt-wellington-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/mangere-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/otahuhu-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/papatoetoe-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/manukau-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/botany-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/howick-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/pakuranga-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/henderson-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/new-lynn-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/titirangi-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/glen-eden-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/avondale-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/mt-albert-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/pt-chevalier-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/blockhouse-bay-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/devonport-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/northcote-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/birkenhead-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/glenfield-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/milford-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/browns-bay-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/mairangi-bay-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/murrays-bay-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/torbay-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/long-bay-to-auckland-airport", "priority": "0.9", "changefreq": "weekly"},
        
        # Competitor Comparison Pages (HIGH PRIORITY SEO)
        {"path": "/bookaride-vs-supershuttle", "priority": "1.0", "changefreq": "weekly"},
        {"path": "/bookaride-vs-skybus", "priority": "1.0", "changefreq": "weekly"},
        {"path": "/bookaride-vs-uber", "priority": "1.0", "changefreq": "weekly"},
        {"path": "/bookaride-vs-taxi", "priority": "1.0", "changefreq": "weekly"},
        
        # International Market Landing Pages (HIGH PRIORITY)
        {"path": "/visitors/usa", "priority": "1.0", "changefreq": "weekly"},
        {"path": "/visitors/canada", "priority": "1.0", "changefreq": "weekly"},
        {"path": "/visitors/uk", "priority": "1.0", "changefreq": "weekly"},
        {"path": "/visitors/germany", "priority": "1.0", "changefreq": "weekly"},
        {"path": "/visitors/france", "priority": "1.0", "changefreq": "weekly"},
        {"path": "/visitors/china", "priority": "1.0", "changefreq": "weekly"},
        {"path": "/visitors/japan", "priority": "1.0", "changefreq": "weekly"},
        {"path": "/visitors/korea", "priority": "1.0", "changefreq": "weekly"},
        {"path": "/visitors/singapore", "priority": "1.0", "changefreq": "weekly"},
        {"path": "/visitors/australia", "priority": "1.0", "changefreq": "weekly"},
        {"path": "/visitors/india", "priority": "1.0", "changefreq": "weekly"},
        {"path": "/visitors/uae", "priority": "1.0", "changefreq": "weekly"},
    ]
    
    # Create XML structure with xhtml namespace for hreflang
    nsmap = {
        'xmlns': "http://www.sitemaps.org/schemas/sitemap/0.9",
        'xmlns:xhtml': "http://www.w3.org/1999/xhtml"
    }
    
    urlset = Element('urlset')
    urlset.set('xmlns', "http://www.sitemaps.org/schemas/sitemap/0.9")
    urlset.set('xmlns:xhtml', "http://www.w3.org/1999/xhtml")
    
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    # Add multilingual pages with hreflang
    for page in main_pages:
        if page.get('multilang', False):
            # Add English version (default, no prefix)
            url = SubElement(urlset, 'url')
            SubElement(url, 'loc').text = base_url + page['path']
            SubElement(url, 'lastmod').text = today
            SubElement(url, 'changefreq').text = page['changefreq']
            SubElement(url, 'priority').text = page['priority']
            
            # Add hreflang links for all languages
            for lang in languages:
                link = SubElement(url, '{http://www.w3.org/1999/xhtml}link')
                link.set('rel', 'alternate')
                link.set('hreflang', lang)
                if lang == 'en':
                    link.set('href', base_url + page['path'])
                else:
                    link.set('href', base_url + '/' + lang + page['path'])
            
            # Add x-default
            link = SubElement(url, '{http://www.w3.org/1999/xhtml}link')
            link.set('rel', 'alternate')
            link.set('hreflang', 'x-default')
            link.set('href', base_url + page['path'])
            
            # Add other language versions
            for lang in languages:
                if lang == 'en':
                    continue
                url = SubElement(urlset, 'url')
                SubElement(url, 'loc').text = base_url + '/' + lang + page['path']
                SubElement(url, 'lastmod').text = today
                SubElement(url, 'changefreq').text = page['changefreq']
                SubElement(url, 'priority').text = str(float(page['priority']) - 0.1)  # Slightly lower priority for non-English
                
                # Add hreflang links
                for hlang in languages:
                    link = SubElement(url, '{http://www.w3.org/1999/xhtml}link')
                    link.set('rel', 'alternate')
                    link.set('hreflang', hlang)
                    if hlang == 'en':
                        link.set('href', base_url + page['path'])
                    else:
                        link.set('href', base_url + '/' + hlang + page['path'])
                
                # Add x-default
                link = SubElement(url, '{http://www.w3.org/1999/xhtml}link')
                link.set('rel', 'alternate')
                link.set('hreflang', 'x-default')
                link.set('href', base_url + page['path'])
        else:
            # Non-multilingual page
            url = SubElement(urlset, 'url')
            SubElement(url, 'loc').text = base_url + page['path']
            SubElement(url, 'lastmod').text = today
            SubElement(url, 'changefreq').text = page['changefreq']
            SubElement(url, 'priority').text = page['priority']
    
    # Add local pages (English only)
    for page in local_pages:
        url = SubElement(urlset, 'url')
        SubElement(url, 'loc').text = base_url + page['path']
        SubElement(url, 'lastmod').text = today
        SubElement(url, 'changefreq').text = page['changefreq']
        SubElement(url, 'priority').text = page['priority']
    
    xml_string = tostring(urlset, encoding='unicode')
    xml_header = '<?xml version="1.0" encoding="UTF-8"?>\n'
    
    return Response(content=xml_header + xml_string, media_type="application/xml")


# ============================================
# APP CONFIGURATION
# ============================================

# NOTE: Router is included AFTER all routes are defined (see end of Xero section)

# Configure CORS with specific origins for credentials support
cors_origins_env = os.environ.get('CORS_ORIGINS', '*')
if cors_origins_env == '*':
    # When using credentials, we need specific origins
    cors_origins = [
        "https://bookaride.co.nz",
        "https://www.bookaride.co.nz",
        "https://dazzling-leakey.preview.emergentagent.com",
        "http://localhost:3000"
    ]
else:
    cors_origins = cors_origins_env.split(',')

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================
# XERO ACCOUNTING INTEGRATION
# ============================================

XERO_CLIENT_ID = os.environ.get('XERO_CLIENT_ID', '')
XERO_CLIENT_SECRET = os.environ.get('XERO_CLIENT_SECRET', '')
XERO_REDIRECT_URI = os.environ.get('XERO_REDIRECT_URI', '')

@api_router.get("/xero/login")
async def xero_login():
    """Redirect to Xero OAuth2 authorization"""
    if not XERO_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Xero not configured")
    
    from urllib.parse import urlencode
    auth_url = "https://login.xero.com/identity/connect/authorize"
    params = {
        "response_type": "code",
        "client_id": XERO_CLIENT_ID,
        "redirect_uri": XERO_REDIRECT_URI,
        "scope": "openid profile email accounting.transactions accounting.contacts offline_access",
        "state": "xero_auth_state"
    }
    return {"authorization_url": f"{auth_url}?{urlencode(params)}"}

@api_router.get("/xero/callback")
async def xero_callback(code: str, state: str = None):
    """Handle Xero OAuth2 callback and store tokens"""
    try:
        # Exchange code for tokens
        token_url = "https://identity.xero.com/connect/token"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                token_url,
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": XERO_REDIRECT_URI,
                    "client_id": XERO_CLIENT_ID,
                    "client_secret": XERO_CLIENT_SECRET,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
        
        if response.status_code != 200:
            logger.error(f"Xero token exchange failed: {response.text}")
            raise HTTPException(status_code=400, detail="Failed to get Xero access token")
        
        tokens = response.json()
        
        # Get tenant ID (organization)
        async with httpx.AsyncClient() as client:
            connections = await client.get(
                "https://api.xero.com/connections",
                headers={"Authorization": f"Bearer {tokens['access_token']}"}
            )
        
        tenant_id = None
        org_name = None
        if connections.status_code == 200:
            orgs = connections.json()
            if orgs:
                tenant_id = orgs[0].get('tenantId')
                org_name = orgs[0].get('tenantName')
        
        # Store tokens in database
        token_doc = {
            "user_id": "admin",
            "access_token": tokens["access_token"],
            "refresh_token": tokens.get("refresh_token"),
            "expires_in": tokens.get("expires_in", 1800),
            "token_type": tokens.get("token_type", "Bearer"),
            "tenant_id": tenant_id,
            "org_name": org_name,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(seconds=tokens.get("expires_in", 1800))).isoformat()
        }
        
        await db.xero_tokens.replace_one(
            {"user_id": "admin"},
            token_doc,
            upsert=True
        )
        
        logger.info(f"Xero connected successfully to organization: {org_name}")
        
        # Redirect to admin dashboard with success message
        return {"message": "Xero connected successfully!", "organization": org_name, "redirect": "/admin/dashboard"}
        
    except Exception as e:
        logger.error(f"Xero callback error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def get_xero_access_token():
    """Get valid Xero access token, refreshing if needed"""
    token_doc = await db.xero_tokens.find_one({"user_id": "admin"})
    
    if not token_doc:
        return None, None
    
    # Check if token is expired
    expires_at = datetime.fromisoformat(token_doc["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) >= expires_at:
        # Refresh the token
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://identity.xero.com/connect/token",
                    data={
                        "grant_type": "refresh_token",
                        "refresh_token": token_doc["refresh_token"],
                        "client_id": XERO_CLIENT_ID,
                        "client_secret": XERO_CLIENT_SECRET,
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
            
            if response.status_code == 200:
                new_tokens = response.json()
                await db.xero_tokens.update_one(
                    {"user_id": "admin"},
                    {"$set": {
                        "access_token": new_tokens["access_token"],
                        "refresh_token": new_tokens.get("refresh_token", token_doc["refresh_token"]),
                        "expires_at": (datetime.now(timezone.utc) + timedelta(seconds=new_tokens.get("expires_in", 1800))).isoformat()
                    }}
                )
                return new_tokens["access_token"], token_doc["tenant_id"]
            else:
                logger.error(f"Failed to refresh Xero token: {response.text}")
                return None, None
        except Exception as e:
            logger.error(f"Error refreshing Xero token: {str(e)}")
            return None, None
    
    return token_doc["access_token"], token_doc["tenant_id"]

@api_router.get("/xero/status")
async def xero_status(current_admin: dict = Depends(get_current_admin)):
    """Check Xero connection status"""
    token_doc = await db.xero_tokens.find_one({"user_id": "admin"})
    
    if not token_doc:
        return {"connected": False, "message": "Xero not connected"}
    
    return {
        "connected": True,
        "organization": token_doc.get("org_name"),
        "connected_at": token_doc.get("created_at")
    }

@api_router.post("/xero/create-invoice/{booking_id}")
async def create_xero_invoice(booking_id: str, current_admin: dict = Depends(get_current_admin)):
    """Create an invoice in Xero for a booking"""
    try:
        # Get booking
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Check if invoice already exists
        if booking.get("xero_invoice_id"):
            return {"message": "Invoice already exists", "invoice_id": booking["xero_invoice_id"]}
        
        # Get Xero token
        access_token, tenant_id = await get_xero_access_token()
        if not access_token:
            raise HTTPException(status_code=401, detail="Xero not connected. Please connect your Xero account first.")
        
        # Get or create contact in Xero
        customer_name = booking.get('customerName') or booking.get('name', 'Unknown Customer')
        customer_email = booking.get('email', '')
        
        # Create invoice payload
        total_price = booking.get('totalPrice') or booking.get('pricing', {}).get('totalPrice', 0)
        
        invoice_data = {
            "Invoices": [{
                "Type": "ACCREC",
                "Contact": {
                    "Name": customer_name,
                    "EmailAddress": customer_email
                },
                "Date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "DueDate": (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d"),
                "Reference": f"Booking #{booking.get('referenceNumber', booking_id[:8])}",
                "Status": "AUTHORISED",
                "LineItems": [{
                    "Description": f"Airport Transfer - {booking.get('pickupAddress', '')[:50]} to {booking.get('dropoffAddress', '')[:50]}",
                    "Quantity": 1,
                    "UnitAmount": float(total_price),
                    "AccountCode": "200"  # Sales account
                }]
            }]
        }
        
        # Add return trip as separate line item if applicable
        if booking.get('bookReturn'):
            invoice_data["Invoices"][0]["LineItems"].append({
                "Description": f"Return Transfer - {booking.get('dropoffAddress', '')[:50]} to {booking.get('pickupAddress', '')[:50]}",
                "Quantity": 1,
                "UnitAmount": float(total_price),
                "AccountCode": "200"
            })
        
        # Create invoice in Xero
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.xero.com/api.xro/2.0/Invoices",
                json=invoice_data,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Xero-Tenant-Id": tenant_id,
                    "Content-Type": "application/json"
                }
            )
        
        if response.status_code in [200, 201]:
            result = response.json()
            invoice_id = result.get("Invoices", [{}])[0].get("InvoiceID")
            invoice_number = result.get("Invoices", [{}])[0].get("InvoiceNumber")
            
            # Update booking with Xero invoice ID
            await db.bookings.update_one(
                {"id": booking_id},
                {"$set": {
                    "xero_invoice_id": invoice_id,
                    "xero_invoice_number": invoice_number,
                    "xero_status": "AUTHORISED"
                }}
            )
            
            logger.info(f"Created Xero invoice {invoice_number} for booking {booking_id}")
            return {
                "message": "Invoice created successfully",
                "invoice_id": invoice_id,
                "invoice_number": invoice_number
            }
        else:
            logger.error(f"Failed to create Xero invoice: {response.text}")
            raise HTTPException(status_code=500, detail=f"Failed to create invoice: {response.text}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating Xero invoice: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/xero/record-payment/{booking_id}")
async def record_xero_payment(booking_id: str, current_admin: dict = Depends(get_current_admin)):
    """Record a payment against an invoice in Xero"""
    try:
        # Get booking
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        if not booking.get("xero_invoice_id"):
            raise HTTPException(status_code=400, detail="No Xero invoice found for this booking")
        
        # Get Xero token
        access_token, tenant_id = await get_xero_access_token()
        if not access_token:
            raise HTTPException(status_code=401, detail="Xero not connected")
        
        total_price = booking.get('totalPrice') or booking.get('pricing', {}).get('totalPrice', 0)
        if booking.get('bookReturn'):
            total_price = total_price * 2
        
        # Get bank account for payment
        async with httpx.AsyncClient() as client:
            accounts_response = await client.get(
                "https://api.xero.com/api.xro/2.0/Accounts?where=Type==%22BANK%22",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Xero-Tenant-Id": tenant_id
                }
            )
        
        bank_account_id = None
        if accounts_response.status_code == 200:
            accounts = accounts_response.json().get("Accounts", [])
            if accounts:
                bank_account_id = accounts[0].get("AccountID")
        
        if not bank_account_id:
            raise HTTPException(status_code=400, detail="No bank account found in Xero")
        
        # Create payment
        payment_data = {
            "Payments": [{
                "Invoice": {"InvoiceID": booking["xero_invoice_id"]},
                "Account": {"AccountID": bank_account_id},
                "Amount": float(total_price),
                "Date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
            }]
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.xero.com/api.xro/2.0/Payments",
                json=payment_data,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Xero-Tenant-Id": tenant_id,
                    "Content-Type": "application/json"
                }
            )
        
        if response.status_code in [200, 201]:
            # Update booking
            await db.bookings.update_one(
                {"id": booking_id},
                {"$set": {
                    "xero_status": "PAID",
                    "payment_status": "paid"
                }}
            )
            
            logger.info(f"Recorded payment in Xero for booking {booking_id}")
            return {"message": "Payment recorded successfully"}
        else:
            logger.error(f"Failed to record Xero payment: {response.text}")
            raise HTTPException(status_code=500, detail=f"Failed to record payment: {response.text}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording Xero payment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def create_and_send_xero_invoice(booking: dict):
    """Create and email a Xero invoice for a booking (called automatically when payment method is 'xero')"""
    try:
        booking_id = booking.get('id')
        
        # Get Xero token
        access_token, tenant_id = await get_xero_access_token()
        if not access_token:
            logger.error("Xero not connected - cannot create invoice")
            return None
        
        # Get or create contact in Xero
        customer_name = booking.get('customerName') or booking.get('name', 'Unknown Customer')
        customer_email = booking.get('email', '')
        
        # Create invoice payload
        total_price = booking.get('totalPrice') or booking.get('pricing', {}).get('totalPrice', 0)
        
        line_items = [{
            "Description": f"Airport Transfer - {booking.get('pickupAddress', '')[:50]} to {booking.get('dropoffAddress', '')[:50]} on {booking.get('date')} at {booking.get('time')}",
            "Quantity": 1,
            "UnitAmount": float(total_price),
            "AccountCode": "200"  # Sales account
        }]
        
        # Add return trip as separate line item if applicable
        if booking.get('bookReturn'):
            line_items.append({
                "Description": f"Return Transfer - {booking.get('dropoffAddress', '')[:50]} to {booking.get('pickupAddress', '')[:50]} on {booking.get('returnDate')} at {booking.get('returnTime')}",
                "Quantity": 1,
                "UnitAmount": float(total_price),
                "AccountCode": "200"
            })
        
        invoice_data = {
            "Invoices": [{
                "Type": "ACCREC",
                "Contact": {
                    "Name": customer_name,
                    "EmailAddress": customer_email
                },
                "Date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "DueDate": (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d"),
                "Reference": f"Booking #{booking.get('referenceNumber', booking_id[:8])}",
                "Status": "AUTHORISED",
                "LineItems": line_items
            }]
        }
        
        # Create invoice in Xero
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.xero.com/api.xro/2.0/Invoices",
                json=invoice_data,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Xero-Tenant-Id": tenant_id,
                    "Content-Type": "application/json"
                }
            )
        
        if response.status_code not in [200, 201]:
            logger.error(f"Failed to create Xero invoice: {response.text}")
            return None
        
        result = response.json()
        invoice_id = result.get("Invoices", [{}])[0].get("InvoiceID")
        invoice_number = result.get("Invoices", [{}])[0].get("InvoiceNumber")
        
        # Update booking with Xero invoice ID
        await db.bookings.update_one(
            {"id": booking_id},
            {"$set": {
                "xero_invoice_id": invoice_id,
                "xero_invoice_number": invoice_number,
                "xero_status": "AUTHORISED",
                "payment_status": "xero-invoiced"
            }}
        )
        
        # Now send the invoice via email using Xero's email endpoint
        if customer_email:
            async with httpx.AsyncClient() as client:
                email_response = await client.post(
                    f"https://api.xero.com/api.xro/2.0/Invoices/{invoice_id}/Email",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Xero-Tenant-Id": tenant_id,
                        "Content-Type": "application/json"
                    }
                )
            
            if email_response.status_code in [200, 204]:
                logger.info(f"Xero invoice {invoice_number} emailed to {customer_email}")
                await db.bookings.update_one(
                    {"id": booking_id},
                    {"$set": {"xero_invoice_emailed": True}}
                )
            else:
                logger.warning(f"Failed to email Xero invoice: {email_response.text}")
        
        logger.info(f"Created Xero invoice {invoice_number} for booking {booking_id}")
        return {"invoice_id": invoice_id, "invoice_number": invoice_number}
        
    except Exception as e:
        logger.error(f"Error creating Xero invoice: {str(e)}")
        return None

@api_router.post("/xero/sync-all-bookings")
async def sync_all_bookings_to_xero(current_admin: dict = Depends(get_current_admin)):
    """Sync all confirmed bookings to Xero (create invoices for bookings without one)"""
    try:
        access_token, tenant_id = await get_xero_access_token()
        if not access_token:
            raise HTTPException(status_code=401, detail="Xero not connected")
        
        # Find bookings without Xero invoice
        bookings = await db.bookings.find({
            "status": "confirmed",
            "xero_invoice_id": {"$exists": False}
        }, {"_id": 0}).to_list(100)
        
        created_count = 0
        errors = []
        
        for booking in bookings:
            try:
                # Create invoice for each booking
                result = await create_xero_invoice(booking["id"], current_admin)
                created_count += 1
            except Exception as e:
                errors.append({"booking_id": booking["id"], "error": str(e)})
        
        return {
            "message": f"Synced {created_count} bookings to Xero",
            "created": created_count,
            "errors": errors
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing to Xero: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/admin/send-arrival-emails")
async def trigger_arrival_emails(current_admin: dict = Depends(get_current_admin)):
    """
    Manually trigger airport arrival emails for tomorrow's arrivals.
    Admin only endpoint.
    """
    try:
        result = await send_arrival_pickup_emails()
        return {
            "success": True,
            "message": f"Arrival emails sent: {result.get('sent', 0)}",
            "date": result.get('date'),
            "details": result
        }
    except Exception as e:
        logger.error(f"Error triggering arrival emails: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== WORDPRESS BOOKING IMPORT ====================

import csv
from io import StringIO

class ImportBookingsRequest(BaseModel):
    csv_data: str  # Base64 encoded CSV or raw CSV string
    skip_notifications: bool = True
    
@api_router.post("/admin/import-bookings")
async def import_bookings_from_csv(
    request: Request,
    file: UploadFile = File(...),
    skip_notifications: bool = Form(True)
):
    """
    Import bookings from WordPress Chauffeur Booking System CSV export.
    Preserves original booking IDs for cross-reference.
    """
    # Manual token extraction for multipart/form-data compatibility
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    token = auth_header.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
        admin = await db.admin_users.find_one({"username": username}, {"_id": 0})
        if not admin:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    try:
        contents = await file.read()
        
        # Decode CSV content
        try:
            csv_text = contents.decode('utf-8-sig')
        except:
            csv_text = contents.decode('latin-1')
        
        reader = csv.DictReader(StringIO(csv_text))
        
        imported = 0
        skipped = 0
        errors = []
        
        for row in reader:
            try:
                original_id = row.get('original_booking_id', '')
                
                # Check if already imported
                existing = await db.bookings.find_one({
                    "$or": [
                        {"wordpress_id": original_id},
                        {"original_booking_id": original_id}
                    ]
                })
                
                if existing:
                    skipped += 1
                    continue
                
                # Parse date - handle DD-MM-YYYY format
                booking_date = row.get('booking_date', '')
                if booking_date and '-' in booking_date:
                    parts = booking_date.split('-')
                    if len(parts) == 3 and len(parts[0]) == 2:
                        # DD-MM-YYYY -> YYYY-MM-DD
                        booking_date = f"{parts[2]}-{parts[1]}-{parts[0]}"
                
                # Parse return date
                return_date = row.get('return_date', '')
                if return_date and '-' in return_date:
                    parts = return_date.split('-')
                    if len(parts) == 3 and len(parts[0]) == 2:
                        return_date = f"{parts[2]}-{parts[1]}-{parts[0]}"
                
                # Map status
                status_map = {
                    'confirmed': 'confirmed',
                    'pending': 'pending',
                    'completed': 'completed',
                    'cancelled': 'cancelled',
                    'publish': 'confirmed'
                }
                status = status_map.get(row.get('booking_status', '').lower(), 'confirmed')
                
                # Create booking document
                booking = {
                    "id": str(uuid.uuid4()),
                    "wordpress_id": original_id,
                    "original_booking_id": original_id,
                    "booking_ref": row.get('booking_reference', original_id),
                    "referenceNumber": row.get('booking_reference', original_id),
                    "name": row.get('customer_name', '').strip(),
                    "email": row.get('customer_email', '').strip(),
                    "phone": row.get('customer_phone', '').strip(),
                    "pickupAddress": row.get('pickup_address', '').strip(),
                    "dropoffAddress": row.get('dropoff_address', '').strip(),
                    "date": booking_date,
                    "time": row.get('booking_time', ''),
                    "passengers": str(row.get('passengers', '1') or '1'),  # Must be string
                    "adults": int(row.get('adults', 0) or 0),
                    "children": int(row.get('children', 0) or 0),
                    "vehicleType": row.get('vehicle_type', ''),
                    "distance": float(row.get('distance_km', 0) or 0),
                    "serviceType": row.get('service_type', 'Transfer'),
                    "transferType": row.get('transfer_type', 'One Way'),
                    "status": status,
                    "payment_method": row.get('payment_method', ''),
                    "payment_status": 'paid' if row.get('payment_method') else 'unpaid',
                    "driver_name": row.get('driver_name', ''),
                    "flightNumber": row.get('flight_number', ''),
                    "notes": row.get('special_requests', ''),
                    "specialRequests": row.get('special_requests', ''),
                    "bookReturn": row.get('has_return', '').lower() == 'yes',
                    "returnDate": return_date if return_date else None,
                    "returnTime": row.get('return_time', '') if row.get('return_time') else None,
                    "created_at": row.get('created_date', datetime.now(timezone.utc).isoformat()),
                    "imported_from": "wordpress_chauffeur",
                    "imported_at": datetime.now(timezone.utc).isoformat(),
                    "notifications_sent": True,  # Mark as sent to prevent sending
                    # Add pricing object for validation (historical bookings don't have detailed pricing)
                    "pricing": {
                        "distance": float(row.get('distance_km', 0) or 0),
                        "basePrice": 0,
                        "airportFee": 0,
                        "oversizedLuggageFee": 0,
                        "passengerFee": 0,
                        "totalPrice": 0
                    }
                }
                
                await db.bookings.insert_one(booking)
                imported += 1
                
            except Exception as e:
                errors.append(f"Row {original_id}: {str(e)}")
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ WordPress import: {imported} imported, {skipped} skipped, {len(errors)} errors")
        
        return {
            "success": True,
            "imported": imported,
            "skipped": skipped,
            "errors": errors[:10],  # First 10 errors
            "total_errors": len(errors)
        }
        
    except Exception as e:
        logger.error(f"Import error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/import-status")
async def get_import_status(current_admin: dict = Depends(get_current_admin)):
    """Get count of imported WordPress bookings"""
    try:
        total = await db.bookings.count_documents({})
        imported = await db.bookings.count_documents({"imported_from": "wordpress_chauffeur"})
        return {
            "total_bookings": total,
            "wordpress_imports": imported
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/admin/quick-import-wordpress")
async def quick_import_wordpress(request: Request):
    """
    Import from CSV - accepts either server file or POST body with CSV content.
    No authentication required for simplicity.
    """
    try:
        csv_text = None
        
        # Try to get CSV from request body first
        try:
            body = await request.json()
            csv_text = body.get('csv_content', '')
        except:
            pass
        
        # If no body content, try server file
        if not csv_text:
            csv_path = "/app/backend/wordpress_bookings_import.csv"
            if os.path.exists(csv_path):
                with open(csv_path, 'r', encoding='utf-8-sig') as f:
                    csv_text = f.read()
            else:
                raise HTTPException(status_code=404, detail="No CSV data provided. Please use the file upload option below.")
        
        reader = csv.DictReader(StringIO(csv_text))
        
        imported = 0
        skipped = 0
        errors = []
        
        # Convert DD-MM-YYYY to YYYY-MM-DD for proper sorting
        def convert_date(date_str):
            if not date_str:
                return ''
            try:
                # Try DD-MM-YYYY format
                if '-' in date_str:
                    parts = date_str.split('-')
                    if len(parts) == 3 and len(parts[0]) <= 2:
                        return f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
                # Try DD/MM/YYYY format
                if '/' in date_str:
                    parts = date_str.split('/')
                    if len(parts) == 3 and len(parts[0]) <= 2:
                        return f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
                return date_str
            except:
                return date_str
        
        for row in reader:
            try:
                original_id = row.get('original_booking_id', '')
                
                # Check if already imported
                existing = await db.bookings.find_one({"original_booking_id": original_id})
                if existing:
                    skipped += 1
                    continue
                
                # Parse dates
                booking_date = convert_date(row.get('booking_date', ''))
                return_date = convert_date(row.get('return_date', ''))
                
                # Map status - use booking_status field, default to confirmed (NOT deleted)
                raw_status = row.get('booking_status', '').lower()
                status_map = {
                    'confirmed': 'confirmed',
                    'pending': 'pending',
                    'completed': 'completed',
                    'cancelled': 'cancelled'
                }
                status = status_map.get(raw_status, 'confirmed')
                
                # Create booking document
                booking = {
                    "id": str(uuid.uuid4()),
                    "wordpress_id": original_id,
                    "original_booking_id": original_id,
                    "booking_ref": row.get('booking_reference', original_id),
                    "referenceNumber": row.get('booking_reference', original_id),
                    "name": row.get('customer_name', '').strip(),
                    "email": row.get('customer_email', '').strip(),
                    "phone": row.get('customer_phone', '').strip(),
                    "pickupAddress": row.get('pickup_address', '').strip(),
                    "dropoffAddress": row.get('dropoff_address', '').strip(),
                    "date": booking_date,
                    "time": row.get('booking_time', ''),
                    "passengers": str(row.get('passengers', '1') or '1'),
                    "adults": int(row.get('adults', 0) or 0),
                    "children": int(row.get('children', 0) or 0),
                    "vehicleType": row.get('vehicle_type', ''),
                    "distance": float(row.get('distance_km', 0) or 0),
                    "serviceType": row.get('service_type', 'Transfer'),
                    "transferType": row.get('transfer_type', 'One Way'),
                    "status": status,
                    "payment_method": row.get('payment_method', ''),
                    "payment_status": 'paid' if row.get('payment_method') else 'unpaid',
                    "driver_name": row.get('driver_name', ''),
                    "flightNumber": row.get('flight_number', ''),
                    "notes": row.get('special_requests', ''),
                    "specialRequests": row.get('special_requests', ''),
                    "bookReturn": row.get('has_return', '').lower() == 'yes',
                    "returnDate": return_date if return_date else None,
                    "returnTime": row.get('return_time', '') if row.get('return_time') else None,
                    "created_at": row.get('created_date', datetime.now(timezone.utc).isoformat()),
                    "imported_from": "wordpress_chauffeur",
                    "imported_at": datetime.now(timezone.utc).isoformat(),
                    "notifications_sent": True,
                    "pricing": {
                        "distance": float(row.get('distance_km', 0) or 0),
                        "basePrice": 0,
                        "airportFee": 0,
                        "oversizedLuggageFee": 0,
                        "passengerFee": 0,
                        "totalPrice": 0
                    }
                }
                
                await db.bookings.insert_one(booking)
                imported += 1
                
            except Exception as row_error:
                errors.append(f"Row {original_id}: {str(row_error)}")
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ Quick WordPress import: {imported} imported, {skipped} skipped, {len(errors)} errors")
        
        return {
            "success": True,
            "imported": imported,
            "skipped": skipped,
            "errors": errors[:10],
            "total_errors": len(errors)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quick import error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/admin/fix-imported-bookings")
async def fix_imported_bookings():
    """
    Fix all imported WordPress bookings:
    1. Restore from deleted status
    2. Fix date format (DD-MM-YYYY to YYYY-MM-DD)
    No authentication required.
    """
    try:
        import re
        fixed_status = 0
        fixed_dates = 0
        
        # Find ALL imported bookings and fix them
        cursor = db.bookings.find({"imported_from": "wordpress_chauffeur"})
        
        async for booking in cursor:
            updates = {
                'status': 'confirmed',
                'deleted': False,
                'deletedAt': None
            }
            fixed_status += 1
            
            # Fix date format - convert DD-MM-YYYY to YYYY-MM-DD
            date_str = booking.get('date', '')
            if date_str:
                match = re.match(r'^(\d{1,2})-(\d{1,2})-(\d{4})$', date_str)
                if match:
                    day, month, year = match.groups()
                    updates['date'] = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                    fixed_dates += 1
            
            # Fix return date
            return_date_str = booking.get('returnDate', '')
            if return_date_str:
                match = re.match(r'^(\d{1,2})-(\d{1,2})-(\d{4})$', return_date_str)
                if match:
                    day, month, year = match.groups()
                    updates['returnDate'] = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
            
            await db.bookings.update_one(
                {"id": booking['id']},
                {"$set": updates}
            )
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ Fixed imported bookings: {fixed_status} restored, {fixed_dates} dates corrected")
        
        return {
            "success": True,
            "restored_from_deleted": fixed_status,
            "dates_fixed": fixed_dates,
            "message": f"Fixed {fixed_status} bookings and {fixed_dates} dates"
        }
        
    except Exception as e:
        logger.error(f"Fix imported bookings error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/fix-now")
async def fix_now():
    """Direct URL to fix bookings - just visit this URL"""
    try:
        import re
        restored = 0
        fixed_dates = 0
        
        # STEP 1: Move bookings from deleted_bookings collection back to bookings
        deleted_cursor = db.deleted_bookings.find({"imported_from": "wordpress_chauffeur"})
        async for booking in deleted_cursor:
            # Remove deletion metadata
            booking.pop('deletedAt', None)
            booking.pop('deletedBy', None)
            booking['status'] = 'confirmed'
            booking['deleted'] = False
            
            # Fix date format
            date_str = booking.get('date', '')
            if date_str:
                match = re.match(r'^(\d{1,2})-(\d{1,2})-(\d{4})$', date_str)
                if match:
                    day, month, year = match.groups()
                    booking['date'] = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                    fixed_dates += 1
            
            # Insert back to main bookings collection
            await db.bookings.update_one(
                {"id": booking['id']},
                {"$set": booking},
                upsert=True
            )
            
            # Remove from deleted collection
            await db.deleted_bookings.delete_one({"id": booking['id']})
            restored += 1
        
        # STEP 2: Fix dates in main bookings collection
        cursor = db.bookings.find({"imported_from": "wordpress_chauffeur"})
        async for booking in cursor:
            updates = {}
            date_str = booking.get('date', '')
            if date_str:
                match = re.match(r'^(\d{1,2})-(\d{1,2})-(\d{4})$', date_str)
                if match:
                    day, month, year = match.groups()
                    updates['date'] = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                    fixed_dates += 1
            
            if updates:
                await db.bookings.update_one({"id": booking['id']}, {"$set": updates})
        
        return {
            "success": True, 
            "restored_from_deleted": restored,
            "dates_fixed": fixed_dates,
            "message": f"Restored {restored} bookings from trash and fixed {fixed_dates} dates! Refresh your admin page."
        }
    except Exception as e:
        logger.error(f"Fix error: {str(e)}")
        return {"success": False, "error": str(e)}


@api_router.post("/admin/batch-sync-calendar")
async def batch_sync_calendar(
    background_tasks: BackgroundTasks,
    current_admin: dict = Depends(get_current_admin)
):
    """
    Batch sync all imported bookings to Google Calendar.
    Only syncs bookings that don't already have a calendar_event_id.
    Runs in background to avoid timeout for large datasets.
    """
    try:
        # Count bookings that need syncing (imported + no calendar event)
        query = {
            "imported_from": "wordpress_chauffeur",
            "$or": [
                {"calendar_event_id": {"$exists": False}},
                {"calendar_event_id": None},
                {"calendar_event_id": ""}
            ]
        }
        
        total_to_sync = await db.bookings.count_documents(query)
        
        if total_to_sync == 0:
            return {
                "success": True,
                "message": "All imported bookings are already synced to Google Calendar!",
                "total_synced": 0,
                "total_to_sync": 0
            }
        
        # Start background task to sync bookings
        background_tasks.add_task(
            batch_sync_calendar_task,
            query
        )
        
        return {
            "success": True,
            "message": f"Calendar sync started for {total_to_sync} imported bookings. This runs in the background - check back in a few minutes.",
            "total_to_sync": total_to_sync,
            "status": "processing"
        }
        
    except Exception as e:
        logger.error(f"Batch calendar sync error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def batch_sync_calendar_task(query: dict):
    """Background task to sync bookings to calendar"""
    try:
        logger.info("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Starting batch calendar sync for imported bookings...")
        
        synced = 0
        failed = 0
        
        # Process bookings in batches to avoid memory issues
        cursor = db.bookings.find(query, {"_id": 0})
        
        async for booking in cursor:
            try:
                # Add small delay between requests to avoid rate limiting
                await asyncio.sleep(0.5)
                
                success = await create_calendar_event(booking)
                if success:
                    synced += 1
                    if synced % 50 == 0:
                        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Calendar sync progress: {synced} bookings synced")
                else:
                    failed += 1
                    
            except Exception as booking_error:
                logger.warning(f"Failed to sync booking {booking.get('id', 'unknown')}: {str(booking_error)}")
                failed += 1
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Batch calendar sync completed: {synced} synced, {failed} failed")
        
        # Store sync result for status checking
        await db.system_tasks.update_one(
            {"task": "batch_calendar_sync"},
            {
                "$set": {
                    "task": "batch_calendar_sync",
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                    "synced": synced,
                    "failed": failed,
                    "status": "completed"
                }
            },
            upsert=True
        )
        
    except Exception as e:
        logger.error(f"Batch calendar sync task error: {str(e)}")
        await db.system_tasks.update_one(
            {"task": "batch_calendar_sync"},
            {
                "$set": {
                    "task": "batch_calendar_sync",
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                    "status": "error",
                    "error": str(e)
                }
            },
            upsert=True
        )


@api_router.get("/admin/batch-sync-calendar/status")
async def get_batch_sync_status(current_admin: dict = Depends(get_current_admin)):
    """Check the status of the batch calendar sync task"""
    try:
        # Get task status
        task_status = await db.system_tasks.find_one(
            {"task": "batch_calendar_sync"},
            {"_id": 0}
        )
        
        # Count remaining bookings to sync
        query = {
            "imported_from": "wordpress_chauffeur",
            "$or": [
                {"calendar_event_id": {"$exists": False}},
                {"calendar_event_id": None},
                {"calendar_event_id": ""}
            ]
        }
        remaining = await db.bookings.count_documents(query)
        
        # Count already synced
        synced_query = {
            "imported_from": "wordpress_chauffeur",
            "calendar_event_id": {"$exists": True, "$nin": [None, ""]}
        }
        already_synced = await db.bookings.count_documents(synced_query)
        
        return {
            "remaining_to_sync": remaining,
            "already_synced": already_synced,
            "last_task": task_status
        }
        
    except Exception as e:
        logger.error(f"Get batch sync status error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/system-health")
async def get_system_health(current_admin: dict = Depends(get_current_admin)):
    """Get latest system health report and run quick check."""
    try:
        nz_tz = pytz.timezone('Pacific/Auckland')
        now_nz = datetime.now(nz_tz)
        today_str = now_nz.strftime('%Y-%m-%d')
        tomorrow_str = (now_nz + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Get latest stored report
        latest_report = await db.error_check_reports.find_one(
            {},
            sort=[("created_at", -1)]
        )
        
        # Quick live stats
        total_bookings = await db.bookings.count_documents({})
        today_bookings = await db.bookings.count_documents({'date': today_str})
        tomorrow_bookings = await db.bookings.count_documents({'date': tomorrow_str})
        
        # Check for unassigned today bookings
        unassigned_today = await db.bookings.count_documents({
            'date': today_str,
            'driver_id': {'$exists': False},
            'assignedDriver': {'$exists': False},
            'status': {'$nin': ['cancelled', 'deleted']}
        })
        
        # Check for unpaid today bookings
        unpaid_today = await db.bookings.count_documents({
            'date': today_str,
            'payment_status': {'$in': ['unpaid', 'pending', None]},
            'status': {'$nin': ['cancelled', 'deleted']}
        })
        
        active_drivers = await db.drivers.count_documents({'status': 'active'})
        
        # Determine overall health status
        if unassigned_today > 0:
            health_status = "critical"
            health_message = f"{unassigned_today} TODAY booking(s) need driver assignment!"
        elif unpaid_today > 3:
            health_status = "warning"
            health_message = f"{unpaid_today} unpaid bookings for today"
        else:
            health_status = "healthy"
            health_message = "All systems operational"
        
        return {
            "health_status": health_status,
            "health_message": health_message,
            "live_stats": {
                "total_bookings": total_bookings,
                "today_bookings": today_bookings,
                "tomorrow_bookings": tomorrow_bookings,
                "unassigned_today": unassigned_today,
                "unpaid_today": unpaid_today,
                "active_drivers": active_drivers
            },
            "latest_report": {
                "date": latest_report.get("report_date") if latest_report else None,
                "issues_count": latest_report.get("stats", {}).get("issues_found", 0) if latest_report else 0,
                "warnings_count": latest_report.get("stats", {}).get("warnings_found", 0) if latest_report else 0,
                "issues": latest_report.get("issues", [])[:10] if latest_report else [],
                "warnings": latest_report.get("warnings", [])[:10] if latest_report else []
            },
            "checked_at": now_nz.strftime('%Y-%m-%d %H:%M:%S')
        }
        
    except Exception as e:
        logger.error(f"Error getting system health: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/admin/run-error-check")
async def manual_run_error_check(current_admin: dict = Depends(get_current_admin)):
    """Manually trigger the daily error check."""
    try:
        result = await run_daily_error_check()
        return result
    except Exception as e:
        logger.error(f"Error running manual error check: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== AUTO-ARCHIVE SYSTEM ====================
# Automatically archives completed bookings after trip date has passed

async def auto_archive_completed_bookings():
    """
    Automatically archive bookings that are past their trip date.
    Rules:
    - One-way bookings: Archive when booking date has passed
    - Return bookings: Archive when return date has passed
    Only archives bookings with status 'completed'.
    Runs daily at 2 AM NZ time.
    """
    try:
        nz_tz = pytz.timezone('Pacific/Auckland')
        now_nz = datetime.now(nz_tz)
        today_str = now_nz.strftime('%Y-%m-%d')
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ [Auto-Archive] Starting - NZ time: {now_nz.strftime('%Y-%m-%d %H:%M')}")
        
        archived_count = 0
        skipped_count = 0
        
        # Find all completed bookings
        completed_bookings = await db.bookings.find({
            'status': 'completed'
        }, {'_id': 0}).to_list(5000)
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ [Auto-Archive] Found {len(completed_bookings)} completed bookings to check")
        
        for booking in completed_bookings:
            try:
                booking_date = booking.get('date', '')
                is_return = booking.get('bookReturn', False)
                return_date = booking.get('returnDate', '')
                
                # Determine the "trip end date"
                # For return bookings, use return date; otherwise use booking date
                trip_end_date = return_date if is_return and return_date else booking_date
                
                # Skip if no valid date
                if not trip_end_date:
                    skipped_count += 1
                    continue
                
                # Check if trip has passed (trip end date is before today)
                if trip_end_date < today_str:
                    # Archive this booking
                    booking['archivedAt'] = datetime.now(timezone.utc).isoformat()
                    booking['archivedBy'] = 'auto-archive'
                    booking['archiveReason'] = 'auto' if not is_return else 'auto-return'
                    booking['retentionExpiry'] = (datetime.now(timezone.utc) + timedelta(days=365*7)).isoformat()
                    
                    # Insert into archive
                    await db.bookings_archive.insert_one(booking)
                    
                    # Remove from active bookings
                    await db.bookings.delete_one({"id": booking.get('id')})
                    
                    archived_count += 1
                    
                    if archived_count <= 5:  # Only log first 5 for brevity
                        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Auto-archived: Ref #{booking.get('referenceNumber')} - {booking.get('name')} (trip ended: {trip_end_date})")
                else:
                    skipped_count += 1
                    
            except Exception as e:
                logger.error(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ Error processing booking {booking.get('id', 'unknown')}: {str(e)}")
                continue
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ [Auto-Archive] Completed - Archived: {archived_count}, Skipped: {skipped_count}")
        return {"archived": archived_count, "skipped": skipped_count, "date": today_str}
        
    except Exception as e:
        logger.error(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ [Auto-Archive] Error: {str(e)}")
        return {"archived": 0, "error": str(e)}

@api_router.post("/admin/trigger-auto-archive")
async def trigger_auto_archive(current_admin: dict = Depends(get_current_admin)):
    """Manually trigger the auto-archive process."""
    try:
        result = await auto_archive_completed_bookings()
        return result
    except Exception as e:
        logger.error(f"Error running auto-archive: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== HOTEL CONCIERGE PORTAL API ====================

class HotelLoginRequest(BaseModel):
    hotelCode: str
    password: str

class HotelBookingRequest(BaseModel):
    guestName: str
    guestEmail: str
    guestPhone: str
    roomNumber: Optional[str] = ""
    pickupDate: str
    pickupTime: str
    flightNumber: Optional[str] = ""
    destination: str
    passengers: str
    luggage: Optional[str] = "1"
    specialRequests: Optional[str] = ""

@api_router.post("/hotel/login")
async def hotel_login(request: HotelLoginRequest):
    """Hotel partner login endpoint."""
    try:
        # Find hotel by code
        hotel = await db.hotel_partners.find_one({"code": request.hotelCode}, {"_id": 0})
        
        if not hotel:
            raise HTTPException(status_code=401, detail="Invalid hotel code")
        
        # Verify password
        if not pwd_context.verify(request.password, hotel.get("hashed_password", "")):
            raise HTTPException(status_code=401, detail="Invalid password")
        
        # Generate token
        token_data = {
            "hotel_id": hotel["id"],
            "hotel_code": hotel["code"],
            "exp": datetime.now(timezone.utc) + timedelta(hours=24)
        }
        token = jwt.encode(token_data, os.environ.get("SECRET_KEY", "hotel-secret-key"), algorithm="HS256")
        
        return {
            "success": True,
            "token": token,
            "hotel": {
                "id": hotel["id"],
                "name": hotel["name"],
                "code": hotel["code"],
                "address": hotel.get("address", "")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Hotel login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

async def get_current_hotel(request: Request):
    """Dependency to get current hotel from token."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, os.environ.get("SECRET_KEY", "hotel-secret-key"), algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.get("/hotel/bookings")
async def get_hotel_bookings(hotel: dict = Depends(get_current_hotel)):
    """Get all bookings made by this hotel."""
    try:
        bookings = await db.hotel_bookings.find(
            {"hotel_id": hotel["hotel_id"]},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        return {"bookings": bookings}
    except Exception as e:
        logger.error(f"Error fetching hotel bookings: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch bookings")

@api_router.post("/hotel/bookings")
async def create_hotel_booking(request: HotelBookingRequest, hotel: dict = Depends(get_current_hotel)):
    """Create a new booking for a hotel guest."""
    try:
        # Get hotel info
        hotel_info = await db.hotel_partners.find_one({"id": hotel["hotel_id"]}, {"_id": 0})
        
        # Generate reference number
        ref_number = await get_next_reference_number()
        
        # Create booking
        booking_id = str(uuid.uuid4())
        hotel_booking = {
            "id": booking_id,
            "hotel_id": hotel["hotel_id"],
            "hotel_name": hotel_info.get("name", ""),
            "hotel_code": hotel["hotel_code"],
            "referenceNumber": ref_number,
            "guestName": request.guestName,
            "guestEmail": request.guestEmail,
            "guestPhone": request.guestPhone,
            "roomNumber": request.roomNumber,
            "pickupDate": request.pickupDate,
            "pickupTime": request.pickupTime,
            "flightNumber": request.flightNumber,
            "destination": request.destination,
            "passengers": int(request.passengers),
            "luggage": int(request.luggage) if request.luggage else 1,
            "specialRequests": request.specialRequests,
            "status": "pending",
            "created_at": datetime.now(timezone.utc),
            "source": "hotel_portal"
        }
        
        await db.hotel_bookings.insert_one(hotel_booking)
        
        # Also create a regular booking for the admin dashboard
        main_booking = {
            "id": booking_id,
            "referenceNumber": ref_number,
            "name": request.guestName,
            "email": request.guestEmail,
            "phone": request.guestPhone,
            "date": request.pickupDate,
            "time": request.pickupTime,
            "pickupAddress": hotel_info.get("address", hotel_info.get("name", "")),
            "dropoffAddress": request.destination.replace("-", " ").title(),
            "passengers": int(request.passengers),
            "flightNumber": request.flightNumber,
            "specialRequests": f"Hotel: {hotel_info.get('name', '')} | Room: {request.roomNumber} | {request.specialRequests}",
            "status": "pending",
            "serviceType": "airport-shuttle",
            "source": f"hotel:{hotel['hotel_code']}",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.bookings.insert_one(main_booking)
        
        logger.info(f"Hotel booking created: {ref_number} by {hotel_info.get('name', '')}")
        
        return {
            "success": True,
            "bookingId": booking_id,
            "referenceNumber": ref_number
        }
    except Exception as e:
        logger.error(f"Error creating hotel booking: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create booking")

@api_router.post("/hotel/register")
async def register_hotel_partner(
    name: str,
    code: str,
    password: str,
    address: str,
    email: str,
    phone: str,
    current_admin: dict = Depends(get_current_admin)
):
    """Admin endpoint to register a new hotel partner."""
    try:
        # Check if code already exists
        existing = await db.hotel_partners.find_one({"code": code})
        if existing:
            raise HTTPException(status_code=400, detail="Hotel code already exists")
        
        hotel_partner = {
            "id": str(uuid.uuid4()),
            "name": name,
            "code": code.upper(),
            "hashed_password": pwd_context.hash(password),
            "address": address,
            "email": email,
            "phone": phone,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.hotel_partners.insert_one(hotel_partner)
        
        return {"success": True, "message": f"Hotel partner {name} registered successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering hotel: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")


# ==================== AIRLINE PARTNERSHIP API ====================

class AirlineAPIKeyAuth:
    """Dependency for airline API key authentication."""
    async def __call__(self, request: Request):
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            raise HTTPException(status_code=401, detail="API key required")
        
        airline = await db.airline_partners.find_one({"api_key": api_key, "is_active": True}, {"_id": 0})
        if not airline:
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        return airline

airline_auth = AirlineAPIKeyAuth()

class AirlineAvailabilityRequest(BaseModel):
    pickup_location: str
    dropoff_location: str
    pickup_datetime: str  # ISO format
    passengers: int
    flight_number: Optional[str] = None

class AirlineBookingRequest(BaseModel):
    pickup_location: str
    dropoff_location: str
    pickup_datetime: str
    passengers: int
    customer_name: str
    customer_email: str
    customer_phone: str
    flight_number: Optional[str] = None
    pnr: Optional[str] = None  # Airline booking reference

@api_router.get("/airline/v1/health")
async def airline_api_health():
    """Health check for airline API."""
    return {"status": "healthy", "version": "1.0", "service": "bookaride-airline-api"}

@api_router.post("/airline/v1/availability")
async def check_availability(request: AirlineAvailabilityRequest, airline: dict = Depends(airline_auth)):
    """Check availability and get pricing for a transfer."""
    try:
        # Calculate distance and price
        google_api_key = os.environ.get('GOOGLE_MAPS_API_KEY', '')
        
        # Use the existing price calculation logic
        distance = 30  # Default estimate
        base_price = 85
        
        if google_api_key:
            try:
                # Call Google Distance Matrix
                url = f"https://maps.googleapis.com/maps/api/distancematrix/json"
                params = {
                    "origins": request.pickup_location,
                    "destinations": request.dropoff_location,
                    "key": google_api_key,
                    "mode": "driving"
                }
                response = requests.get(url, params=params)
                data = response.json()
                
                if data.get("status") == "OK":
                    element = data["rows"][0]["elements"][0]
                    if element.get("status") == "OK":
                        distance = element["distance"]["value"] / 1000  # km
                        duration = element["duration"]["value"] / 60  # minutes
            except Exception as e:
                logger.warning(f"Distance calculation failed: {str(e)}")
        
        # Calculate price based on distance
        if distance <= 20:
            base_price = 85
        elif distance <= 40:
            base_price = 85 + (distance - 20) * 3.5
        else:
            base_price = 155 + (distance - 40) * 3.0
        
        # Add passenger surcharge
        if request.passengers > 4:
            base_price += (request.passengers - 4) * 10
        
        return {
            "available": True,
            "quote": {
                "currency": "NZD",
                "amount": round(base_price, 2),
                "distance_km": round(distance, 1),
                "estimated_duration_minutes": int(distance * 1.5),  # Rough estimate
                "vehicle_type": "sedan" if request.passengers <= 4 else "van",
                "valid_until": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
            },
            "pickup_location": request.pickup_location,
            "dropoff_location": request.dropoff_location
        }
    except Exception as e:
        logger.error(f"Airline availability check error: {str(e)}")
        raise HTTPException(status_code=500, detail="Availability check failed")

@api_router.post("/airline/v1/book")
async def create_airline_booking(request: AirlineBookingRequest, airline: dict = Depends(airline_auth)):
    """Create a booking from airline partner."""
    try:
        ref_number = await get_next_reference_number()
        booking_id = str(uuid.uuid4())
        
        # Parse datetime
        try:
            pickup_dt = datetime.fromisoformat(request.pickup_datetime.replace('Z', '+00:00'))
            pickup_date = pickup_dt.strftime("%Y-%m-%d")
            pickup_time = pickup_dt.strftime("%H:%M")
        except:
            pickup_date = request.pickup_datetime[:10]
            pickup_time = request.pickup_datetime[11:16] if len(request.pickup_datetime) > 10 else "12:00"
        
        booking = {
            "id": booking_id,
            "referenceNumber": ref_number,
            "name": request.customer_name,
            "email": request.customer_email,
            "phone": request.customer_phone,
            "date": pickup_date,
            "time": pickup_time,
            "pickupAddress": request.pickup_location,
            "dropoffAddress": request.dropoff_location,
            "passengers": request.passengers,
            "flightNumber": request.flight_number,
            "status": "confirmed",
            "serviceType": "airport-shuttle",
            "source": f"airline:{airline['code']}",
            "airline_pnr": request.pnr,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.bookings.insert_one(booking)
        
        # Log the booking
        logger.info(f"Airline booking created: {ref_number} via {airline['name']}")
        
        return {
            "success": True,
            "booking": {
                "id": booking_id,
                "reference_number": ref_number,
                "status": "confirmed",
                "pickup_date": pickup_date,
                "pickup_time": pickup_time
            }
        }
    except Exception as e:
        logger.error(f"Airline booking error: {str(e)}")
        raise HTTPException(status_code=500, detail="Booking failed")

@api_router.get("/airline/v1/booking/{booking_id}")
async def get_airline_booking(booking_id: str, airline: dict = Depends(airline_auth)):
    """Get booking status."""
    try:
        booking = await db.bookings.find_one(
            {"id": booking_id, "source": {"$regex": f"^airline:{airline['code']}"}},
            {"_id": 0}
        )
        
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        return {
            "id": booking["id"],
            "reference_number": booking.get("referenceNumber"),
            "status": booking.get("status"),
            "pickup_date": booking.get("date"),
            "pickup_time": booking.get("time"),
            "pickup_location": booking.get("pickupAddress"),
            "dropoff_location": booking.get("dropoffAddress"),
            "driver_name": booking.get("driver_name"),
            "driver_phone": booking.get("driver_phone")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching airline booking: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch booking")

@api_router.delete("/airline/v1/booking/{booking_id}")
async def cancel_airline_booking(booking_id: str, airline: dict = Depends(airline_auth)):
    """Cancel a booking."""
    try:
        result = await db.bookings.update_one(
            {"id": booking_id, "source": {"$regex": f"^airline:{airline['code']}"}},
            {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        return {"success": True, "message": "Booking cancelled"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling airline booking: {str(e)}")
        raise HTTPException(status_code=500, detail="Cancellation failed")


# Include the router in the main app (MUST be after all routes are defined)
app.include_router(api_router)

# Initialize the scheduler with timezone awareness
scheduler = AsyncIOScheduler(timezone=pytz.timezone('Pacific/Auckland'))

# Track last reminder check to prevent duplicate runs
last_reminder_check_date = None

async def scheduled_send_reminders():
    """Scheduled task wrapper - called by APScheduler"""
    await send_daily_reminders_core(source="apscheduler_8am")

async def interval_reminder_check():
    """
    Interval-based check that runs every hour.
    Ensures reminders are sent even if the 8 AM job was missed.
    Only runs between 8 AM and 10 PM NZ time.
    The core function handles deduplication via locks and atomic updates.
    """
    try:
        nz_tz = pytz.timezone('Pacific/Auckland')
        nz_now = datetime.now(nz_tz)
        current_hour = nz_now.hour
        
        # Only run between 8 AM and 10 PM NZ time
        if current_hour < 8 or current_hour > 22:
            logger.debug(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â [interval_check] Outside reminder hours ({current_hour}:00 NZ), skipping")
            return
        
        # Let the core function handle everything - it has proper locking
        await send_daily_reminders_core(source="interval_check")
        
    except Exception as e:
        logger.error(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Interval reminder check error: {str(e)}")

async def startup_reminder_check():
    """
    Check and send reminders on server startup.
    This catches any missed reminders due to server restarts.
    """
    try:
        nz_tz = pytz.timezone('Pacific/Auckland')
        nz_now = datetime.now(nz_tz)
        current_hour = nz_now.hour
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Startup reminder check - NZ time: {nz_now.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Only run startup check if it's between 8 AM and 11 PM
        if current_hour >= 8 and current_hour <= 23:
            result = await send_daily_reminders_core(source="startup_check")
    except Exception as e:
        logger.error(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Startup reminder check error: {str(e)}")


# ==================== AIRPORT ARRIVAL EMAILS ====================

async def send_arrival_pickup_emails():
    """
    Send airport pickup guide emails to customers arriving tomorrow.
    Runs daily at 9 AM NZ time.
    Only for airport arrivals (customers flying INTO Auckland).
    """
    try:
        nz_tz = pytz.timezone('Pacific/Auckland')
        nz_now = datetime.now(nz_tz)
        tomorrow = (nz_now + timedelta(days=1)).strftime('%Y-%m-%d')
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â [Arrival Emails] Checking for airport arrivals on {tomorrow}")
        
        # Find bookings where dropoff is Auckland Airport (arrivals TO Auckland)
        # These are customers flying INTO Auckland who need pickup at the airport
        airport_keywords = ['airport', 'auckland airport', 'akl', 'domestic terminal', 'international terminal']
        
        # Build query for pickups FROM airport (arriving customers)
        query = {
            "date": tomorrow,
            "status": {"$nin": ["cancelled", "completed"]},
            "$or": [
                {"pickupAddress": {"$regex": "airport", "$options": "i"}},
                {"pickupAddress": {"$regex": "domestic terminal", "$options": "i"}},
                {"pickupAddress": {"$regex": "international terminal", "$options": "i"}}
            ]
        }
        
        bookings = await db.bookings.find(query, {"_id": 0}).to_list(500)
        
        if not bookings:
            logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â [Arrival Emails] No airport arrivals found for {tomorrow}")
            return {"sent": 0, "date": tomorrow}
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â [Arrival Emails] Found {len(bookings)} airport arrivals for {tomorrow}")
        
        # Get email settings
        mailgun_api_key = os.environ.get('MAILGUN_API_KEY', '')
        mailgun_domain = os.environ.get('MAILGUN_DOMAIN', '')
        public_domain = os.environ.get('PUBLIC_DOMAIN', 'https://bookaride.co.nz')
        
        if not mailgun_api_key or not mailgun_domain:
            logger.warning("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â [Arrival Emails] Mailgun not configured")
            return {"sent": 0, "error": "Mailgun not configured"}
        
        sent_count = 0
        
        for booking in bookings:
            try:
                email = booking.get('email')
                if not email:
                    continue
                
                # Check if we already sent this email
                if booking.get('arrivalEmailSent'):
                    logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Skipping {email} - arrival email already sent")
                    continue
                
                customer_name = booking.get('name', 'Valued Customer')
                pickup_address = booking.get('pickupAddress', '').lower()
                flight_number = booking.get('flightNumber', '')
                pickup_time = booking.get('time', '')
                
                # Determine terminal type based on pickup address
                is_international = 'international' in pickup_address
                is_domestic = 'domestic' in pickup_address or not is_international
                
                # Determine specific pickup point based on flight number or address
                pickup_info = get_pickup_location_info(pickup_address, flight_number)
                
                # Create email content
                email_html = create_arrival_email_html(
                    customer_name=customer_name,
                    booking_date=tomorrow,
                    pickup_time=pickup_time,
                    flight_number=flight_number,
                    is_international=is_international,
                    pickup_info=pickup_info,
                    public_domain=public_domain
                )
                
                # Send email
                response = requests.post(
                    f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
                    auth=("api", mailgun_api_key),
                    data={
                        "from": f"BookaRide NZ <noreply@{mailgun_domain}>",
                        "to": email,
                        "subject": f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Your Airport Pickup Tomorrow - Where to Meet Your Driver",
                        "html": email_html
                    }
                )
                
                if response.status_code == 200:
                    # Mark as sent
                    await db.bookings.update_one(
                        {"id": booking.get('id')},
                        {"$set": {
                            "arrivalEmailSent": True,
                            "arrivalEmailSentAt": datetime.now(timezone.utc).isoformat()
                        }}
                    )
                    sent_count += 1
                    logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Arrival email sent to {email} for booking {booking.get('id')}")
                else:
                    logger.error(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Failed to send arrival email to {email}: {response.text}")
                    
            except Exception as e:
                logger.error(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Error sending arrival email: {str(e)}")
                continue
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â [Arrival Emails] Completed - {sent_count} emails sent for {tomorrow}")
        return {"sent": sent_count, "date": tomorrow}
        
    except Exception as e:
        logger.error(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â [Arrival Emails] Error: {str(e)}")
        return {"sent": 0, "error": str(e)}


# ==================== DAILY ERROR CHECK SYSTEM ====================
# Runs daily at 6 AM to catch data integrity issues before they become critical

async def run_daily_error_check():
    """
    Comprehensive daily check for booking system health.
    Identifies issues like missing data, unassigned bookings, sync failures, etc.
    Sends report to admin via email and SMS for critical issues.
    """
    try:
        nz_tz = pytz.timezone('Pacific/Auckland')
        now_nz = datetime.now(nz_tz)
        today_str = now_nz.strftime('%Y-%m-%d')
        tomorrow_str = (now_nz + timedelta(days=1)).strftime('%Y-%m-%d')
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â [Daily Error Check] Starting - NZ time: {now_nz.strftime('%Y-%m-%d %H:%M')}")
        
        issues = []
        warnings = []
        stats = {
            "total_bookings_checked": 0,
            "issues_found": 0,
            "warnings_found": 0
        }
        
        # ===========================================
        # CHECK 1: Upcoming bookings with missing data
        # ===========================================
        upcoming_bookings = await db.bookings.find({
            'date': {'$in': [today_str, tomorrow_str]},
            'status': {'$nin': ['cancelled', 'deleted']}
        }, {'_id': 0}).to_list(500)
        
        stats["total_bookings_checked"] = len(upcoming_bookings)
        
        for booking in upcoming_bookings:
            booking_ref = get_booking_reference(booking)
            booking_id = booking.get('id', 'unknown')
            
            # Check for missing customer details
            if not booking.get('name'):
                issues.append(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ Booking #{booking_ref}: Missing customer NAME")
            if not booking.get('phone'):
                issues.append(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ Booking #{booking_ref}: Missing customer PHONE")
            if not booking.get('email'):
                warnings.append(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Booking #{booking_ref}: Missing customer EMAIL")
            
            # Check for missing addresses
            if not booking.get('pickupAddress'):
                issues.append(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ Booking #{booking_ref}: Missing PICKUP address")
            if not booking.get('dropoffAddress'):
                issues.append(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ Booking #{booking_ref}: Missing DROPOFF address")
            
            # Check for missing time
            if not booking.get('time'):
                issues.append(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ Booking #{booking_ref}: Missing PICKUP TIME")
            
            # Check for unassigned TODAY bookings
            if booking.get('date') == today_str:
                if not booking.get('driver_id') and not booking.get('assignedDriver'):
                    issues.append(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ TODAY Booking #{booking_ref} ({booking.get('name')}): NO DRIVER ASSIGNED!")
        
        # ===========================================
        # CHECK 2: Return bookings without complete info
        # ===========================================
        return_bookings = await db.bookings.find({
            'bookReturn': True,
            'status': {'$nin': ['cancelled', 'deleted']}
        }, {'_id': 0}).to_list(500)
        
        for booking in return_bookings:
            booking_ref = get_booking_reference(booking)
            if not booking.get('returnDate'):
                warnings.append(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Booking #{booking_ref}: Has bookReturn=true but missing RETURN DATE")
            if not booking.get('returnTime'):
                warnings.append(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Booking #{booking_ref}: Has bookReturn=true but missing RETURN TIME")
        
        # ===========================================
        # CHECK 3: Payment status inconsistencies
        # ===========================================
        unpaid_today = await db.bookings.find({
            'date': today_str,
            'payment_status': {'$in': ['unpaid', 'pending', None]},
            'status': {'$nin': ['cancelled', 'deleted']}
        }, {'_id': 0}).to_list(100)
        
        for booking in unpaid_today:
            booking_ref = get_booking_reference(booking)
            total_price = booking.get('totalPrice', 0)
            if isinstance(booking.get('pricing'), dict):
                total_price = booking.get('pricing', {}).get('totalPrice', total_price)
            
            if total_price and float(total_price) > 0:
                warnings.append(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â TODAY Booking #{booking_ref} ({booking.get('name')}): UNPAID - ${total_price}")
        
        # ===========================================
        # CHECK 4: Recent bookings without confirmation sent
        # ===========================================
        yesterday = (now_nz - timedelta(days=1)).strftime('%Y-%m-%d')
        recent_bookings = await db.bookings.find({
            'created_at': {'$gte': yesterday},
            'confirmation_sent': {'$ne': True},
            'status': {'$nin': ['cancelled', 'deleted']}
        }, {'_id': 0}).to_list(50)
        
        for booking in recent_bookings:
            booking_ref = get_booking_reference(booking)
            warnings.append(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Booking #{booking_ref}: Confirmation may not have been sent")
        
        # ===========================================
        # CHECK 5: Calendar sync verification for ALL bookings
        # ===========================================
        bookings_needing_calendar = await db.bookings.find({
            'date': {'$in': [today_str, tomorrow_str]},
            'status': {'$nin': ['cancelled', 'deleted']},
            '$or': [
                {'calendar_event_id': {'$exists': False}},
                {'calendar_event_id': ''},
                {'calendar_event_id': None}
            ]
        }, {'_id': 0}).to_list(100)
        
        for booking in bookings_needing_calendar:
            booking_ref = get_booking_reference(booking)
            issues.append(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ Booking #{booking_ref} ({booking.get('name')}): NOT synced to CALENDAR!")
        
        # ===========================================
        # CHECK 6: Return trips today/tomorrow without calendar sync
        # ===========================================
        return_trips_soon = await db.bookings.find({
            'returnDate': {'$in': [today_str, tomorrow_str]},
            'returnTime': {'$exists': True, '$ne': ''},
            'status': {'$nin': ['cancelled', 'deleted']}
        }, {'_id': 0}).to_list(100)
        
        for booking in return_trips_soon:
            booking_ref = get_booking_reference(booking)
            return_date = booking.get('returnDate', '')
            return_time = booking.get('returnTime', '')
            calendar_ids = booking.get('calendar_event_id', '')
            
            # Check if return has a separate calendar event (should have 2 events: outbound + return)
            event_count = len(calendar_ids.split(',')) if calendar_ids else 0
            has_return_calendar = event_count >= 2  # Should have at least 2 events if return exists
            
            if not has_return_calendar:
                urgency = "TODAY" if return_date == today_str else "TOMORROW"
                issues.append(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ {urgency} RETURN #{booking_ref} ({booking.get('name')}): {return_date} @ {return_time} - NOT in calendar!")
            
            # Check if return trip has driver assigned
            if return_date == today_str:
                if not booking.get('return_driver_id') and not booking.get('driver_id'):
                    issues.append(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ TODAY RETURN #{booking_ref} ({booking.get('name')}): @ {return_time} - NO DRIVER!")
        
        # ===========================================
        # CHECK 7: Database health checks
        # ===========================================
        total_bookings = await db.bookings.count_documents({})
        total_drivers = await db.drivers.count_documents({})
        active_drivers = await db.drivers.count_documents({'status': 'active'})
        
        if active_drivers == 0:
            issues.append("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ CRITICAL: No active drivers in system!")
        
        # ===========================================
        # COMPILE REPORT
        # ===========================================
        stats["issues_found"] = len(issues)
        stats["warnings_found"] = len(warnings)
        
        report_time = now_nz.strftime('%d/%m/%Y %H:%M')
        
        # Build report
        report = f"""
ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â
ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¹Ã…â€œ           BOOKARIDE DAILY ERROR CHECK REPORT                 ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¹Ã…â€œ
ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¹Ã…â€œ                    {report_time}                               ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¹Ã…â€œ
ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â

ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â  SUMMARY
ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Bookings checked (today/tomorrow): {stats['total_bookings_checked']}
ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Total bookings in database: {total_bookings}
ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Active drivers: {active_drivers} / {total_drivers}
ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Critical issues found: {stats['issues_found']}
ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Warnings found: {stats['warnings_found']}

"""
        
        if issues:
            report += "ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ CRITICAL ISSUES (Require immediate attention):\n"
            report += "ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬" * 50 + "\n"
            for issue in issues[:20]:  # Limit to 20
                report += f"  {issue}\n"
            report += "\n"
        
        if warnings:
            report += "ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â WARNINGS (Review recommended):\n"
            report += "ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬" * 50 + "\n"
            for warning in warnings[:20]:  # Limit to 20
                report += f"  {warning}\n"
            report += "\n"
        
        if not issues and not warnings:
            report += "ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ ALL SYSTEMS HEALTHY - No issues detected!\n"
        
        logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â [Daily Error Check] Complete: {stats['issues_found']} issues, {stats['warnings_found']} warnings")
        
        # ===========================================
        # SEND NOTIFICATIONS
        # ===========================================
        
        # Send email report
        try:
            admin_email = os.environ.get('ADMIN_EMAIL', 'info@bookaride.co.nz')
            mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
            mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
            sender_email = os.environ.get('SENDER_EMAIL', 'noreply@mg.bookaride.co.nz')
            
            if mailgun_api_key and mailgun_domain:
                subject = f"{'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ ISSUES FOUND' if issues else 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ All Clear'} - BookaRide Daily Check {report_time}"
                
                html_report = f"""
                <html>
                <body style="font-family: 'Courier New', monospace; background: #1a1a1a; color: #00ff00; padding: 20px;">
                    <pre style="white-space: pre-wrap; font-size: 12px;">{report}</pre>
                </body>
                </html>
                """
                
                response = requests.post(
                    f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
                    auth=("api", mailgun_api_key),
                    data={
                        "from": f"BookaRide System <{sender_email}>",
                        "to": admin_email,
                        "subject": subject,
                        "html": html_report
                    }
                )
                
                if response.status_code == 200:
                    logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â [Daily Error Check] Email report sent to {admin_email}")
                else:
                    logger.error(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â [Daily Error Check] Failed to send email: {response.text}")
        except Exception as email_err:
            logger.error(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â [Daily Error Check] Email error: {str(email_err)}")
        
        # Send SMS if critical issues found
        if issues:
            try:
                admin_phone = os.environ.get('ADMIN_PHONE', '+6421743321')
                twilio_sid = os.environ.get('TWILIO_ACCOUNT_SID')
                twilio_token = os.environ.get('TWILIO_AUTH_TOKEN')
                twilio_from = os.environ.get('TWILIO_PHONE_NUMBER')
                
                if twilio_sid and twilio_token and twilio_from:
                    client = Client(twilio_sid, twilio_token)
                    
                    sms_body = f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ BookaRide Daily Check\n"
                    sms_body += f"{len(issues)} critical issues found!\n"
                    sms_body += f"Top issue: {issues[0][:80]}...\n"
                    sms_body += f"Check email for full report."
                    
                    client.messages.create(
                        body=sms_body,
                        from_=twilio_from,
                        to=admin_phone
                    )
                    logger.info(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â [Daily Error Check] Critical alert SMS sent")
            except Exception as sms_err:
                logger.error(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â [Daily Error Check] SMS error: {str(sms_err)}")
        
        # Store report in database for dashboard access
        await db.error_check_reports.insert_one({
            "report_date": today_str,
            "report_time": now_nz.isoformat(),
            "stats": stats,
            "issues": issues[:50],  # Store up to 50
            "warnings": warnings[:50],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "success": True,
            "stats": stats,
            "issues_count": len(issues),
            "warnings_count": len(warnings)
        }
        
    except Exception as e:
        logger.error(f"ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â [Daily Error Check] Fatal error: {str(e)}")
        return {"success": False, "error": str(e)}


def get_pickup_location_info(pickup_address: str, flight_number: str) -> dict:
    """
    Determine the specific pickup location based on address and flight number.
    """
    pickup_lower = pickup_address.lower()
    flight_upper = flight_number.upper() if flight_number else ""
    
    # Check for international terminal
    if 'international' in pickup_lower:
        return {
            "terminal": "International Terminal",
            "location": "Allpress Cafe",
            "icon": "ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢",
            "color": "#3B82F6",  # blue
            "instructions": [
                "After collecting your luggage, walk through customs into the public arrivals area",
                "Turn LEFT once you enter the public area",
                "Look for the Allpress Cafe (ALLPRESS signage)",
                "Your driver will be at the bench in front of the cafe, holding a sign with your name"
            ]
        }
    
    # Check for Jetstar flights
    if 'jetstar' in pickup_lower or flight_upper.startswith('JQ'):
        return {
            "terminal": "Domestic Terminal - Jetstar",
            "location": "Jetstar Car Park",
            "icon": "ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â",
            "color": "#F97316",  # orange
            "instructions": [
                "After collecting your bags, head towards the exit",
                "Walk through Door 5 & 6",
                "Turn LEFT into the Jetstar car park",
                "Your driver will meet you there with a sign"
            ]
        }
    
    # Check for regional flights
    regional_keywords = ['regional', 'sounds air', 'air chathams', 'barrier air']
    if any(kw in pickup_lower for kw in regional_keywords):
        return {
            "terminal": "Domestic Terminal - Regionals",
            "location": "Luggage Claim (opposite Krispy Kreme)",
            "icon": "ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©",
            "color": "#22C55E",  # green
            "instructions": [
                "Head to the luggage claim area",
                "Look for Krispy Kreme Doughnuts",
                "Your driver will be waiting opposite Krispy Kreme, holding a sign with your name"
            ]
        }
    
    # Default to Cities/Main domestic
    return {
        "terminal": "Domestic Terminal - Cities",
        "location": "Outside Arrivals (Dunkin' Donuts)",
        "icon": "ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©",
        "color": "#A855F7",  # purple
        "instructions": [
            "After collecting your bags, walk out of the arrivals area",
            "Look for Dunkin' Donuts outside",
            "Your driver will be standing there with a sign displaying your name"
        ]
    }


def create_arrival_email_html(customer_name: str, booking_date: str, pickup_time: str, 
                               flight_number: str, is_international: bool, 
                               pickup_info: dict, public_domain: str) -> str:
    """
    Create the HTML email for airport arrival pickup instructions.
    """
    instructions_html = "".join([
        f'<tr><td style="padding: 8px 0; vertical-align: top; width: 30px;"><span style="display: inline-block; width: 24px; height: 24px; background: {pickup_info["color"]}20; color: {pickup_info["color"]}; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px;">{i+1}</span></td><td style="padding: 8px 0; padding-left: 12px; color: #374151;">{instruction}</td></tr>'
        for i, instruction in enumerate(pickup_info["instructions"])
    ])
    
    return f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Â¹ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Your Airport Pickup Tomorrow</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Where to meet your BookaRide driver</p>
            </div>
            
            <!-- Main Content -->
            <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                
                <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                    Hi {customer_name},
                </p>
                
                <p style="color: #374151; font-size: 16px; margin: 0 0 25px 0;">
                    We're looking forward to picking you up tomorrow! Here's exactly where to find your driver.
                </p>
                
                <!-- Booking Details -->
                <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px 0; color: #6b7280;">Date:</td>
                            <td style="padding: 5px 0; color: #111827; font-weight: 600; text-align: right;">{booking_date}</td>
                        </tr>
                        {f'<tr><td style="padding: 5px 0; color: #6b7280;">Pickup Time:</td><td style="padding: 5px 0; color: #111827; font-weight: 600; text-align: right;">{pickup_time}</td></tr>' if pickup_time else ''}
                        {f'<tr><td style="padding: 5px 0; color: #6b7280;">Flight:</td><td style="padding: 5px 0; color: #111827; font-weight: 600; text-align: right;">{flight_number}</td></tr>' if flight_number else ''}
                    </table>
                </div>
                
                <!-- Pickup Location Card -->
                <div style="border: 2px solid {pickup_info['color']}; border-radius: 12px; overflow: hidden; margin-bottom: 25px;">
                    <div style="background: {pickup_info['color']}; padding: 15px; text-align: center;">
                        <span style="font-size: 32px;">{pickup_info['icon']}</span>
                        <h2 style="color: white; margin: 10px 0 5px 0; font-size: 18px;">{pickup_info['terminal']}</h2>
                        <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">Meet at: <strong>{pickup_info['location']}</strong></p>
                    </div>
                    
                    <div style="padding: 20px;">
                        <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 16px;">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â How to Find Your Driver:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            {instructions_html}
                        </table>
                    </div>
                </div>
                
                <!-- Look for Name -->
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 15px; margin-bottom: 25px; text-align: center;">
                    <p style="color: #92400e; margin: 0; font-size: 16px;">
                        ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¹Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ <strong>Look for your name!</strong><br>
                        <span style="font-size: 14px;">Your driver will be holding a sign with "{customer_name}" on it.</span>
                    </p>
                </div>
                
                <!-- Full Guide Link -->
                <div style="text-align: center; margin-bottom: 25px;">
                    <a href="{public_domain}/airport-pickup-guide" style="display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                        View Full Pickup Guide
                    </a>
                </div>
                
                <!-- Contact -->
                <div style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center;">
                    <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">Can't find your driver?</p>
                    <a href="tel:+6421743321" style="color: #f59e0b; font-size: 20px; font-weight: bold; text-decoration: none;">
                        ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ 021 743 321
                    </a>
                </div>
                
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                <p style="margin: 0;">BookaRide NZ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ Premium Airport Transfers</p>
                <p style="margin: 5px 0 0 0;">bookaride.co.nz</p>
            </div>
            
        </div>
    </body>
    </html>
    '''


@app.on_event("startup")
async def startup_event():
    """Start the scheduler when the app starts and ensure default admin exists"""
    # Ensure default admin exists with correct email for Google OAuth
    try:
        default_admin = await db.admin_users.find_one({"username": "admin"})
    except Exception as e:
        print("WARN: admin seed skipped (db unavailable):", repr(e))
        default_admin = {"_skip": True}
    if not default_admin:
        hashed_pw = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO8m8Y4YkQkQ1h6s4H6c3Z8Y5G7c8Y4r2"
        await db.admin_users.insert_one({
            "id": str(uuid.uuid4()),
            "username": "admin",
            "email": "info@bookaride.co.nz",
            "hashed_password": hashed_pw,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True
        })
        logger.info("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Default admin user created")
    else:
        # Update password and email to ensure they're correct
        hashed_pw = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO8m8Y4YkQkQ1h6s4H6c3Z8Y5G7c8Y4r2"
        await db.admin_users.update_one(
            {"username": "admin"},
            {"$set": {
                "hashed_password": hashed_pw,
                "email": "info@bookaride.co.nz"
            }}
        )
        logger.info("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Admin password reset and email updated to info@bookaride.co.nz")
    
    # Create database indexes for faster queries
    try:
        await db.bookings.create_index("date")
        await db.bookings.create_index("status")
        await db.bookings.create_index("name")
        await db.bookings.create_index("email")
        await db.bookings.create_index("referenceNumber")
        await db.bookings.create_index("original_booking_id")
        await db.bookings.create_index([("date", -1), ("status", 1)])
        logger.info("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Database indexes created for faster queries")
    except Exception as e:
        logger.warning(f"Index creation note: {str(e)}")
    
    # Create index for archive collection
    try:
        await db.bookings_archive.create_index("archivedAt")
        await db.bookings_archive.create_index("name")
        await db.bookings_archive.create_index("email")
        await db.bookings_archive.create_index("referenceNumber")
        logger.info("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ Archive indexes created")
    except Exception as e:
        logger.warning(f"Archive index creation note: {str(e)}")
    
    # ============================================
    # RELIABLE REMINDER SYSTEM - 3 LAYERS
    # ============================================
    nz_tz = pytz.timezone('Pacific/Auckland')
    
    # Layer 1: Primary 8 AM daily job with misfire handling
    scheduler.add_job(
        scheduled_send_reminders,
        CronTrigger(hour=8, minute=0, timezone=nz_tz),
        id='daily_reminders_8am',
        name='Primary: Send reminders at 8 AM NZ',
        replace_existing=True,
        misfire_grace_time=3600 * 4  # Allow 4 hour grace period for missed jobs
    )
    
    # Layer 1b: Airport Arrival Emails at 9 AM daily
    scheduler.add_job(
        send_arrival_pickup_emails,
        CronTrigger(hour=9, minute=0, timezone=nz_tz),
        id='arrival_emails_9am',
        name='Airport arrival pickup emails at 9 AM NZ',
        replace_existing=True,
        misfire_grace_time=3600 * 4  # Allow 4 hour grace period
    )
    
    # Layer 2: Backup hourly check (runs every hour, only acts if reminders weren't sent)
    scheduler.add_job(
        interval_reminder_check,
        IntervalTrigger(hours=1),
        id='hourly_reminder_check',
        name='Backup: Hourly reminder check',
        replace_existing=True
    )
    
    # Layer 4: Abandoned booking recovery emails (every 30 mins)
    scheduler.add_job(
        send_abandoned_booking_emails,
        IntervalTrigger(minutes=30),
        id='abandoned_booking_recovery',
        name='Abandoned booking recovery emails',
        replace_existing=True
    )
    
    # Auto-sync from production DISABLED - was overwriting local changes
    # scheduler.add_job(
    #     auto_sync_from_production,
    #     IntervalTrigger(minutes=5),
    #     id='auto_sync_production',
    #     name='Auto-sync from production database',
    #     replace_existing=True
    # )
    
    # RETURN BOOKING ALERTS - Check every 15 minutes
    scheduler.add_job(
        check_return_booking_alerts,
        IntervalTrigger(minutes=15),
        id='return_booking_alerts',
        name='Return booking departure alerts',
        replace_existing=True
    )
    
    # DAILY ERROR CHECK - Runs at 6 AM NZ time
    scheduler.add_job(
        run_daily_error_check,
        CronTrigger(hour=6, minute=0, timezone=nz_tz),
        id='daily_error_check',
        name='Daily system health check',
        replace_existing=True,
        misfire_grace_time=3600 * 4  # Allow 4 hour grace period
    )
    
    # AUTO-ARCHIVE COMPLETED BOOKINGS - Runs at 2 AM NZ time
    scheduler.add_job(
        auto_archive_completed_bookings,
        CronTrigger(hour=2, minute=0, timezone=nz_tz),
        id='auto_archive_bookings',
        name='Auto-archive completed bookings',
        replace_existing=True,
        misfire_grace_time=3600 * 4  # Allow 4 hour grace period
    )
    
    # Startup sync DISABLED - was overwriting local changes
    # scheduler.add_job(
    #     auto_sync_from_production,
    #     'date',  # Run once immediately
    #     id='startup_sync',
    #     name='Startup sync from production',
    #     replace_existing=True
    # )
    
    scheduler.start()
    logger.info("ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Scheduler started with all jobs:")
    logger.info("   ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ Reminder: 8:00 AM NZ daily (primary)")
    logger.info("   ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ Arrival emails: 9:00 AM NZ daily")
    logger.info("   ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ Reminder: Hourly backup check")
    logger.info("   ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ Abandoned bookings: Every 30 mins")
    logger.info("   ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ Auto-sync: Every 5 minutes")
    logger.info("   ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ Return alerts: Every 15 minutes")
    logger.info("   ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ Daily error check: 6:00 AM NZ daily")
    logger.info("   ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ Auto-archive: 2:00 AM NZ daily")
    logger.info("   ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ Startup reminder check (running now...)")
    
    # Layer 3: Immediate startup check
    await startup_reminder_check()


@app.on_event("shutdown")
async def shutdown_db_client():
    scheduler.shutdown()
    client.close()
