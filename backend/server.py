from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import requests
import httpx
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from twilio.rest import Client
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

ROOT_DIR = Path(__file__).parent
sys.path.insert(0, str(ROOT_DIR))
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Authentication configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production-' + str(uuid.uuid4()))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

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
    totalPrice: float

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
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Booking(BookingCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    referenceNumber: Optional[int] = None  # Sequential reference number starting from 10

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
    """Change admin password"""
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


# ============================================
# GOOGLE OAUTH FOR ADMIN
# ============================================

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
        public_domain = os.environ.get('PUBLIC_DOMAIN', 'https://bookaride.co.nz')
        reset_link = f"{public_domain}/admin/reset-password?token={reset_token}"
        
        mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
        mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
        sender_email = os.environ.get('SENDER_EMAIL', 'noreply@bookaride.co.nz')
        
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
                        <h1>🔐 Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Hello <strong>{admin['username']}</strong>,</p>
                        <p>We received a request to reset your admin password for Book A Ride NZ.</p>
                        <p>Click the button below to reset your password:</p>
                        <p style="text-align: center;">
                            <a href="{reset_link}" class="button">Reset Password</a>
                        </p>
                        <div class="warning">
                            ⏰ <strong>This link will expire in 1 hour.</strong><br>
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
                    logger.info(f"Multi-stop route: {len(all_pickups)} pickups → dropoff, total: {distance_km}km")
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
        
        # Calculate pricing with tiered rates (matching old booking system)
        if distance_km <= 15.0:
            base_price = distance_km * 12.00  # $12.00 per km for 0-15km
        elif distance_km <= 15.8:
            base_price = 15.0 * 12.00 + (distance_km - 15.0) * 8.00  # $8.00 per km for 15-15.8km
        elif distance_km <= 16.0:
            base_price = 15.0 * 12.00 + 0.8 * 8.00 + (distance_km - 15.8) * 6.00  # $6.00 per km for 15.8-16km
        elif distance_km <= 25.5:
            base_price = 15.0 * 12.00 + 0.8 * 8.00 + 0.2 * 6.00 + (distance_km - 16.0) * 5.50  # $5.50 per km for 16-25.5km
        elif distance_km <= 35.0:
            base_price = 15.0 * 12.00 + 0.8 * 8.00 + 0.2 * 6.00 + 9.5 * 5.50 + (distance_km - 25.5) * 5.00  # $5.00 per km for 25.5-35km
        elif distance_km <= 50.0:
            base_price = 15.0 * 12.00 + 0.8 * 8.00 + 0.2 * 6.00 + 9.5 * 5.50 + 9.5 * 5.00 + (distance_km - 35.0) * 4.00  # $4.00 per km for 35-50km
        elif distance_km <= 60.0:
            base_price = 15.0 * 12.00 + 0.8 * 8.00 + 0.2 * 6.00 + 9.5 * 5.50 + 9.5 * 5.00 + 15.0 * 4.00 + (distance_km - 50.0) * 2.60  # $2.60 per km for 50-60km
        elif distance_km <= 75.0:
            base_price = 15.0 * 12.00 + 0.8 * 8.00 + 0.2 * 6.00 + 9.5 * 5.50 + 9.5 * 5.00 + 15.0 * 4.00 + 10.0 * 2.60 + (distance_km - 60.0) * 2.47  # $2.47 per km for 60-75km
        elif distance_km <= 100.0:
            base_price = 15.0 * 12.00 + 0.8 * 8.00 + 0.2 * 6.00 + 9.5 * 5.50 + 9.5 * 5.00 + 15.0 * 4.00 + 10.0 * 2.60 + 15.0 * 2.47 + (distance_km - 75.0) * 2.70  # $2.70 per km for 75-100km
        elif distance_km <= 300.0:
            base_price = 15.0 * 12.00 + 0.8 * 8.00 + 0.2 * 6.00 + 9.5 * 5.50 + 9.5 * 5.00 + 15.0 * 4.00 + 10.0 * 2.60 + 15.0 * 2.47 + 25.0 * 2.70 + (distance_km - 100.0) * 3.50  # $3.50 per km for 100-300km
        else:
            # For distances over 300km, use $3.50 rate
            base_price = 15.0 * 12.00 + 0.8 * 8.00 + 0.2 * 6.00 + 9.5 * 5.50 + 9.5 * 5.00 + 15.0 * 4.00 + 10.0 * 2.60 + 15.0 * 2.47 + 25.0 * 2.70 + 200.0 * 3.50 + (distance_km - 300.0) * 3.50
        
        # VIP Airport Pickup fee: Optional $15 extra service
        airport_fee = 15.0 if request.vipAirportPickup else 0.0
        
        # Oversized Luggage fee: Optional $25 for skis, bikes, surfboards, etc.
        oversized_luggage_fee = 25.0 if request.oversizedLuggage else 0.0
        
        # Passenger fee: 1st passenger included, $5 per additional
        extra_passengers = max(0, request.passengers - 1)
        passenger_fee = extra_passengers * 5.0
        
        # Total price
        total_price = base_price + airport_fee + oversized_luggage_fee + passenger_fee
        
        # Apply minimum fee of $100
        if total_price < 100.0:
            total_price = 100.0
        
        return PricingBreakdown(
            distance=distance_km,
            basePrice=round(base_price, 2),
            airportFee=round(airport_fee, 2),
            oversizedLuggageFee=round(oversized_luggage_fee, 2),
            passengerFee=round(passenger_fee, 2),
            totalPrice=round(total_price, 2)
        )
    except Exception as e:
        logger.error(f"Error calculating price: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error calculating price: {str(e)}")

# Create Booking Endpoint
@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking: BookingCreate):
    try:
        booking_obj = Booking(**booking.dict())
        booking_dict = booking_obj.dict()
        
        # Get sequential reference number
        ref_number = await get_next_reference_number()
        booking_dict['referenceNumber'] = ref_number
        booking_obj.referenceNumber = ref_number
        
        # Extract totalPrice from pricing for payment processing
        booking_dict['totalPrice'] = booking.pricing.get('totalPrice', 0)
        booking_dict['payment_status'] = 'unpaid'
        await db.bookings.insert_one(booking_dict)
        logger.info(f"Booking created: {booking_obj.id} with reference #{ref_number}")
        
        # Send admin notification email for new booking
        try:
            await send_booking_notification_to_admin(booking_dict)
            logger.info(f"Admin notification sent for booking #{ref_number}")
        except Exception as email_error:
            logger.error(f"Failed to send admin notification for booking #{ref_number}: {str(email_error)}")
            # Don't fail the booking creation if email fails
        
        # Sync to Google Calendar
        try:
            await create_calendar_event(booking_dict)
            logger.info(f"Calendar event created for booking #{ref_number}")
        except Exception as calendar_error:
            logger.error(f"Failed to create calendar event for booking #{ref_number}: {str(calendar_error)}")
            # Don't fail the booking creation if calendar sync fails
        
        # Sync contact to iCloud
        try:
            add_contact_to_icloud(booking_dict)
            logger.info(f"Contact synced to iCloud for booking #{ref_number}")
        except Exception as contact_error:
            logger.error(f"Failed to sync contact to iCloud for booking #{ref_number}: {str(contact_error)}")
            # Don't fail the booking creation if contact sync fails
        
        return booking_obj
    except Exception as e:
        logger.error(f"Error creating booking: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating booking: {str(e)}")

# Get All Bookings Endpoint (for admin)
@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings(current_admin: dict = Depends(get_current_admin)):
    try:
        bookings = await db.bookings.find({}, {"_id": 0}).sort("createdAt", -1).to_list(1000)
        return [Booking(**booking) for booking in bookings]
    except Exception as e:
        logger.error(f"Error fetching bookings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching bookings: {str(e)}")

# Update Booking Endpoint (for admin)
@api_router.patch("/bookings/{booking_id}")
async def update_booking(booking_id: str, update_data: dict, current_admin: dict = Depends(get_current_admin)):
    try:
        result = await db.bookings.update_one(
            {"id": booking_id},
            {"$set": update_data}
        )
        # Use matched_count, not modified_count - a booking with identical data is still valid
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
        logger.info(f"Booking updated: {booking_id}")
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
                    <h2 style="color: #333; margin-top: 0;">📋 Booking Details</h2>
                    
                    <div style="background-color: #faf8f3; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4AF37;">
                        <p style="margin: 5px 0;"><strong>Booking Reference:</strong> {booking.get('id', '')[:8].upper()}</p>
                        <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: {'#16a34a' if booking.get('status') == 'confirmed' else '#ea580c'}; font-weight: bold;">{booking.get('status', 'N/A').upper()}</span></p>
                        <p style="margin: 5px 0;"><strong>Payment Status:</strong> {booking.get('payment_status', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Created:</strong> {booking.get('createdAt', 'N/A')}</p>
                    </div>
                    
                    <h3 style="color: #333; margin-top: 30px;">👤 Customer Information</h3>
                    <div style="background-color: #faf8f3; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p style="margin: 5px 0;"><strong>Name:</strong> {booking.get('name', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:{booking.get('email', 'N/A')}" style="color: #D4AF37;">{booking.get('email', 'N/A')}</a></p>
                        <p style="margin: 5px 0;"><strong>Phone:</strong> <a href="tel:{booking.get('phone', 'N/A')}" style="color: #D4AF37;">{booking.get('phone', 'N/A')}</a></p>
                    </div>
                    
                    <h3 style="color: #333; margin-top: 30px;">🚗 Trip Details</h3>
                    <div style="background-color: #faf8f3; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p style="margin: 5px 0;"><strong>Service Type:</strong> {booking.get('serviceType', 'N/A').replace('-', ' ').title()}</p>
                        <p style="margin: 5px 0;"><strong>Pickup:</strong> {booking.get('pickupAddress', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Drop-off:</strong> {booking.get('dropoffAddress', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Date:</strong> {booking.get('date', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Time:</strong> {booking.get('time', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Passengers:</strong> {booking.get('passengers', 'N/A')}</p>
                    </div>
                    
                    <h3 style="color: #333; margin-top: 30px;">💰 Pricing Details</h3>
                    <div style="background-color: #faf8f3; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p style="margin: 5px 0;"><strong>Distance:</strong> {pricing.get('distance', 0)} km</p>
                        <p style="margin: 5px 0;"><strong>Base Price:</strong> ${pricing.get('basePrice', 0):.2f} NZD</p>
                        {'<p style="margin: 5px 0;"><strong>Airport Fee:</strong> $' + f"{pricing.get('airportFee', 0):.2f}" + ' NZD</p>' if pricing.get('airportFee', 0) > 0 else ''}
                        {'<p style="margin: 5px 0;"><strong>Passenger Fee:</strong> $' + f"{pricing.get('passengerFee', 0):.2f}" + ' NZD</p>' if pricing.get('passengerFee', 0) > 0 else ''}
                        <hr style="border: 0; border-top: 2px solid #D4AF37; margin: 15px 0;">
                        <p style="margin: 5px 0; font-size: 18px;"><strong>Total Price:</strong> <span style="color: #D4AF37; font-size: 20px;">${total_price:.2f} NZD</span></p>
                        {f'<p style="margin: 5px 0; color: #ea580c; font-size: 12px;">⚠️ Price was manually overridden</p>' if is_overridden else ''}
                    </div>
                    
                    {'<h3 style="color: #333; margin-top: 30px;">✈️ Flight Information</h3><div style="background-color: #faf8f3; padding: 15px; border-radius: 8px; margin: 15px 0;"><p style="margin: 5px 0;"><strong>Departure Flight:</strong> ' + booking.get('departureFlightNumber', 'N/A') + ' at ' + booking.get('departureTime', 'N/A') + '</p><p style="margin: 5px 0;"><strong>Arrival Flight:</strong> ' + booking.get('arrivalFlightNumber', 'N/A') + ' at ' + booking.get('arrivalTime', 'N/A') + '</p></div>' if booking.get('departureFlightNumber') or booking.get('arrivalFlightNumber') else ''}
                    
                    {f'<h3 style="color: #333; margin-top: 30px;">📝 Special Notes</h3><div style="background-color: #fff8e6; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #D4AF37;"><p style="margin: 0;">{booking.get("notes", "")}</p></div>' if booking.get('notes') else ''}
                    
                    <div style="margin-top: 30px; padding: 15px; background-color: #fff8e6; border-radius: 8px; border-left: 4px solid #D4AF37;">
                        <p style="margin: 0; color: #333;"><strong>💡 Quick Actions:</strong></p>
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
                "subject": f"📋 Booking Details - {booking.get('name', 'Customer')} - {booking.get('id', '')[:8].upper()}",
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
        'subject': '预订确认',
        'confirmed': '预订已确认！',
        'greeting': '尊敬的',
        'intro': '您的行程已确认。以下是您的预订详情：',
        'reference': '预订编号',
        'service': '服务类型',
        'pickup': '上车地点',
        'dropoff': '下车地点',
        'date': '日期',
        'time': '时间',
        'passengers': '乘客人数',
        'total': '总费用',
        'contact_intro': '我们会在接送时间前联系您确认所有细节。',
        'contact': '如有任何问题，请联系我们',
        'or_call': '或致电',
        'thanks': '感谢您选择BookaRide！'
    },
    'ja': {
        'subject': '予約確認',
        'confirmed': 'ご予約が確定しました！',
        'greeting': '様',
        'intro': 'ご予約が確定しました。予約詳細は以下の通りです：',
        'reference': '予約番号',
        'service': 'サービスタイプ',
        'pickup': '乗車場所',
        'dropoff': '降車場所',
        'date': '日付',
        'time': '時間',
        'passengers': '乗客数',
        'total': '合計金額',
        'contact_intro': '乗車時間が近づきましたら、詳細確認のためご連絡いたします。',
        'contact': 'ご質問がございましたら、お問い合わせください',
        'or_call': 'またはお電話ください',
        'thanks': 'BookaRideをご利用いただきありがとうございます！'
    },
    'ko': {
        'subject': '예약 확인',
        'confirmed': '예약이 확정되었습니다!',
        'greeting': '고객님께',
        'intro': '예약이 확정되었습니다. 예약 상세 정보는 다음과 같습니다:',
        'reference': '예약 번호',
        'service': '서비스 유형',
        'pickup': '탑승 위치',
        'dropoff': '하차 위치',
        'date': '날짜',
        'time': '시간',
        'passengers': '승객 수',
        'total': '총 결제 금액',
        'contact_intro': '탑승 시간이 가까워지면 모든 세부 사항을 확인하기 위해 연락드리겠습니다.',
        'contact': '문의사항이 있으시면 연락주세요',
        'or_call': '또는 전화주세요',
        'thanks': 'BookaRide를 이용해 주셔서 감사합니다!'
    },
    'fr': {
        'subject': 'Confirmation de Réservation',
        'confirmed': 'Réservation Confirmée!',
        'greeting': 'Cher',
        'intro': 'Votre trajet a été confirmé. Voici les détails de votre réservation:',
        'reference': 'Référence de Réservation',
        'service': 'Type de Service',
        'pickup': 'Lieu de Prise en Charge',
        'dropoff': 'Lieu de Dépose',
        'date': 'Date',
        'time': 'Heure',
        'passengers': 'Passagers',
        'total': 'Total Payé',
        'contact_intro': 'Nous vous contacterons avant votre heure de prise en charge pour confirmer tous les détails.',
        'contact': 'Pour toute question, veuillez nous contacter à',
        'or_call': 'ou appelez',
        'thanks': 'Merci d\'avoir choisi BookaRide!'
    },
    'hi': {
        'subject': 'बुकिंग पुष्टि',
        'confirmed': 'बुकिंग की पुष्टि हो गई!',
        'greeting': 'प्रिय',
        'intro': 'आपकी राइड की पुष्टि हो गई है। यहां आपकी बुकिंग विवरण हैं:',
        'reference': 'बुकिंग संदर्भ',
        'service': 'सेवा प्रकार',
        'pickup': 'पिकअप',
        'dropoff': 'ड्रॉप-ऑफ',
        'date': 'तारीख',
        'time': 'समय',
        'passengers': 'यात्री',
        'total': 'कुल भुगतान',
        'contact_intro': 'हम आपके पिकअप समय से पहले सभी विवरणों की पुष्टि के लिए संपर्क करेंगे।',
        'contact': 'यदि आपके कोई प्रश्न हैं, तो कृपया हमसे संपर्क करें',
        'or_call': 'या कॉल करें',
        'thanks': 'BookaRide चुनने के लिए धन्यवाद!'
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
        
        # Format date as DD/MM/YYYY and get reference
        formatted_date = format_date_ddmmyyyy(booking.get('date', 'N/A'))
        booking_ref = get_booking_reference(booking)
        
        # Create SMS message
        message_body = f"""Book A Ride NZ - Booking Confirmed!

Ref: {booking_ref}
Pickup: {booking.get('pickupAddress', 'N/A')}
Date: {formatted_date} at {booking.get('time', 'N/A')}
Total: ${booking.get('totalPrice', 0):.2f} NZD

Thank you for booking with us!"""
        
        message = client.messages.create(
            body=message_body,
            from_=twilio_phone,
            to=booking.get('phone')
        )
        
        logger.info(f"Confirmation SMS sent to {booking.get('phone')} - SID: {message.sid}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending confirmation SMS: {str(e)}")
        return False


def send_reminder_email(booking: dict):
    """Send day-before reminder email to customer"""
    try:
        mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
        mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
        sender_email = os.environ.get('SENDER_EMAIL', 'noreply@bookaride.co.nz')
        
        if not mailgun_api_key or not mailgun_domain:
            logger.warning("Mailgun credentials not configured for reminder")
            return False
        
        booking_ref = get_booking_reference(booking)
        formatted_date = format_date_ddmmyyyy(booking.get('date', 'N/A'))
        recipient_email = booking.get('email')
        
        # Build pickup addresses
        primary_pickup = booking.get('pickupAddress', 'N/A')
        pickup_addresses = booking.get('pickupAddresses', [])
        
        pickup_html = f"<p><strong>Pickup:</strong> {primary_pickup}</p>"
        if pickup_addresses:
            for i, addr in enumerate(pickup_addresses):
                if addr and addr.strip():
                    pickup_html += f"<p><strong>Additional Stop {i+1}:</strong> {addr}</p>"
        
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
                    <h2 style="margin: 0; color: white; font-size: 20px;">🔔 Reminder: Your Ride is Tomorrow!</h2>
                </div>
                
                <div style="padding: 25px;">
                    <p style="color: #333; font-size: 15px;">Dear <strong>{booking.get('name', 'Customer')}</strong>,</p>
                    <p style="color: #333; font-size: 15px;">This is a friendly reminder that your ride is scheduled for <strong>tomorrow</strong>.</p>
                    
                    <div style="background: #faf8f3; border-radius: 10px; padding: 20px; margin: 20px 0; border: 1px solid #e8e4d9;">
                        <p style="margin: 5px 0;"><strong>Reference:</strong> {booking_ref}</p>
                        <p style="margin: 5px 0;"><strong>Date:</strong> {formatted_date}</p>
                        <p style="margin: 5px 0;"><strong>Time:</strong> {booking.get('time', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Passengers:</strong> {booking.get('passengers', 'N/A')}</p>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
                        {pickup_html}
                        <p style="margin: 5px 0;"><strong>Drop-off:</strong> {booking.get('dropoffAddress', 'N/A')}</p>
                    </div>
                    
                    <div style="background: #fff8e6; padding: 15px; border-radius: 8px; border-left: 4px solid #D4AF37; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px; color: #666;">
                            <strong>📍 Please be ready</strong> at your pickup location 5 minutes before your scheduled time.
                        </p>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        If you need to make any changes or have questions, please contact us:<br>
                        📞 <a href="tel:+6421743321" style="color: #D4AF37;">+64 21 743 321</a><br>
                        ✉️ <a href="mailto:info@bookaride.co.nz" style="color: #D4AF37;">info@bookaride.co.nz</a>
                    </p>
                    
                    <p style="color: #333; margin-top: 25px;">See you tomorrow!<br><strong>The BookaRide Team</strong></p>
                </div>
                
                <div style="background: #faf8f3; padding: 15px; text-align: center; border-top: 1px solid #e8e4d9;">
                    <p style="margin: 0; color: #888; font-size: 12px;">BookaRide NZ | bookaride.co.nz | +64 21 743 321</p>
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
                "subject": f"🔔 Reminder: Your Ride Tomorrow - Ref: {booking_ref}",
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
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')
        
        if not account_sid or not auth_token or not twilio_phone:
            logger.warning("Twilio credentials not configured for reminder")
            return False
        
        client = Client(account_sid, auth_token)
        
        booking_ref = get_booking_reference(booking)
        formatted_date = format_date_ddmmyyyy(booking.get('date', 'N/A'))
        
        message_body = f"""🔔 BookaRide Reminder

Your ride is TOMORROW!

Ref: {booking_ref}
Date: {formatted_date}
Time: {booking.get('time', 'N/A')}
Pickup: {booking.get('pickupAddress', 'N/A')[:50]}...

Please be ready 5 mins early.
Questions? Call +64 21 743 321"""
        
        message = client.messages.create(
            body=message_body,
            from_=twilio_phone,
            to=booking.get('phone')
        )
        
        logger.info(f"Reminder SMS sent to {booking.get('phone')} - SID: {message.sid}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending reminder SMS: {str(e)}")
        return False


@api_router.post("/admin/send-reminders")
async def send_tomorrow_reminders(current_admin: dict = Depends(get_current_admin)):
    """Manually trigger sending reminders for tomorrow's bookings"""
    try:
        # Get tomorrow's date in YYYY-MM-DD format
        tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
        tomorrow_str = tomorrow.strftime('%Y-%m-%d')
        
        # Also check for NZ timezone (UTC+12/13)
        nz_tomorrow = (datetime.now(timezone.utc) + timedelta(hours=13) + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Find all confirmed bookings for tomorrow
        bookings = await db.bookings.find({
            "status": "confirmed",
            "$or": [
                {"date": tomorrow_str},
                {"date": nz_tomorrow}
            ]
        }, {"_id": 0}).to_list(100)
        
        results = {
            "total_bookings": len(bookings),
            "emails_sent": 0,
            "sms_sent": 0,
            "errors": []
        }
        
        for booking in bookings:
            # Check if reminder already sent today
            reminder_sent = booking.get('reminderSentAt', '')
            today_str = datetime.now(timezone.utc).strftime('%Y-%m-%d')
            
            if reminder_sent and reminder_sent.startswith(today_str):
                continue  # Skip if already sent today
            
            # Send email reminder
            if booking.get('email'):
                if send_reminder_email(booking):
                    results['emails_sent'] += 1
                else:
                    results['errors'].append(f"Email failed for {booking.get('name')}")
            
            # Send SMS reminder
            if booking.get('phone'):
                if send_reminder_sms(booking):
                    results['sms_sent'] += 1
                else:
                    results['errors'].append(f"SMS failed for {booking.get('name')}")
            
            # Mark reminder as sent
            await db.bookings.update_one(
                {"id": booking.get('id')},
                {"$set": {"reminderSentAt": datetime.now(timezone.utc).isoformat()}}
            )
        
        logger.info(f"Reminders sent: {results['emails_sent']} emails, {results['sms_sent']} SMS for {results['total_bookings']} bookings")
        
        return {
            "success": True,
            "message": f"Sent {results['emails_sent']} emails and {results['sms_sent']} SMS for {results['total_bookings']} bookings tomorrow",
            "details": results
        }
        
    except Exception as e:
        logger.error(f"Error sending reminders: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending reminders: {str(e)}")


# Auto-run reminders endpoint (can be called by external cron service)
@api_router.get("/cron/send-reminders")
async def cron_send_reminders(api_key: str = None):
    """Endpoint for external cron service to trigger reminders (requires API key)"""
    try:
        expected_key = os.environ.get('CRON_API_KEY', 'bookaride-cron-secret-2024')
        
        if api_key != expected_key:
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        # Get tomorrow's date
        tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
        tomorrow_str = tomorrow.strftime('%Y-%m-%d')
        nz_tomorrow = (datetime.now(timezone.utc) + timedelta(hours=13) + timedelta(days=1)).strftime('%Y-%m-%d')
        
        bookings = await db.bookings.find({
            "status": "confirmed",
            "$or": [
                {"date": tomorrow_str},
                {"date": nz_tomorrow}
            ]
        }, {"_id": 0}).to_list(100)
        
        sent_count = 0
        for booking in bookings:
            reminder_sent = booking.get('reminderSentAt', '')
            today_str = datetime.now(timezone.utc).strftime('%Y-%m-%d')
            
            if reminder_sent and reminder_sent.startswith(today_str):
                continue
            
            if booking.get('email'):
                send_reminder_email(booking)
            if booking.get('phone'):
                send_reminder_sms(booking)
            
            await db.bookings.update_one(
                {"id": booking.get('id')},
                {"$set": {"reminderSentAt": datetime.now(timezone.utc).isoformat()}}
            )
            sent_count += 1
        
        return {"success": True, "reminders_sent": sent_count}
        
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
                    <p style="margin: 5px 0; font-size: 14px; color: rgba(255,255,255,0.9);">🔔 New Booking Received</p>
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
                        <p style="margin: 5px 0;"><strong>Date:</strong> {formatted_date} at {booking.get('time', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Passengers:</strong> {booking.get('passengers', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Pickup:</strong> {booking.get('pickupAddress', 'N/A')}</p>
                        <p style="margin: 5px 0;"><strong>Drop-off:</strong> {booking.get('dropoffAddress', 'N/A')}</p>
                        <hr style="border: 0; border-top: 2px solid #D4AF37; margin: 15px 0;">
                        <p style="margin: 5px 0; font-size: 18px;"><strong>Total:</strong> <span style="color: #D4AF37;">${total_price:.2f} NZD</span></p>
                        <p style="margin: 5px 0;"><strong>Payment Status:</strong> {booking.get('payment_status', 'N/A')}</p>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background-color: #fff8e6; border-radius: 8px; border-left: 4px solid #D4AF37;">
                        <p style="margin: 0; font-weight: bold; color: #333;">⚡ Action Required:</p>
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
                "subject": f"🔔 New Booking - {booking.get('name', 'Customer')} - {formatted_date} - Ref: {booking_ref}",
                "html": html_content
            }
        )
        
        if response.status_code == 200:
            logger.info(f"Auto-notification sent to admin: {admin_email} for booking: {booking_ref}")
            return True
        else:
            logger.error(f"Failed to send admin notification: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending admin notification: {str(e)}")
        return False


async def send_driver_notification(booking: dict, driver: dict):
    """Send email and SMS notification to driver about new booking assignment"""
    try:
        # Format date and get references
        formatted_date = format_date_ddmmyyyy(booking.get('date', 'N/A'))
        booking_ref = get_booking_reference(booking)
        full_booking_id = get_full_booking_reference(booking)
        
        # Send Email to Driver
        mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
        mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
        sender_email = os.environ.get('SENDER_EMAIL', 'noreply@bookaride.co.nz')
        
        if mailgun_api_key and mailgun_domain:
            total_price = booking.get('pricing', {}).get('totalPrice', 0) if isinstance(booking.get('pricing'), dict) else 0
            
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
                if return_date:
                    formatted_return = format_date_ddmmyyyy(return_date)
                    return_html = f"""
                    <div style="background-color: #fff8e1; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #D4AF37;">
                        <p style="margin: 0; font-weight: bold;">🔄 RETURN TRIP</p>
                        <p style="margin: 5px 0;">Return Date: {formatted_return}</p>
                        <p style="margin: 5px 0;">Return Time: {return_time}</p>
                        <p style="margin: 5px 0; font-size: 12px; color: #666;">Reverse route back to original pickup location(s)</p>
                    </div>
                    """
            
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #D4AF37; color: #1a1a1a; padding: 20px; text-align: center;">
                        <h1 style="margin: 0;">BookaRide.co.nz</h1>
                    </div>
                    <div style="padding: 20px; background-color: #f5f5f5;">
                        <h2 style="color: #1a1a1a;">✅ New Booking Assignment</h2>
                        <p>Hi {driver.get('name', 'Driver')},</p>
                        <p>You have been assigned a new booking. Please review the details below:</p>
                        
                        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4AF37;">
                            <p><strong>Booking Reference:</strong> {booking_ref}</p>
                            <p style="font-size: 11px; color: #999;">Full ID: {full_booking_id}</p>
                            <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 15px 0;">
                            <p><strong>Customer Name:</strong> {booking.get('name', 'N/A')}</p>
                            <p><strong>Customer Phone:</strong> {booking.get('phone', 'N/A')}</p>
                            <p><strong>Customer Email:</strong> {booking.get('email', 'N/A')}</p>
                            <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 15px 0;">
                            <p><strong>Service Type:</strong> {booking.get('serviceType', 'N/A').replace('-', ' ').title()}</p>
                            {pickup_html}
                            <p><strong>Drop-off:</strong> {booking.get('dropoffAddress', 'N/A')}</p>
                            <p><strong>Date:</strong> {formatted_date}</p>
                            <p><strong>Time:</strong> {booking.get('time', 'N/A')}</p>
                            <p><strong>Passengers:</strong> {booking.get('passengers', 'N/A')}</p>
                            <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 15px 0;">
                            <p style="font-size: 18px;"><strong>💰 Job Total: ${total_price:.2f} NZD</strong></p>
                        </div>
                        {return_html}
                        
                        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0;"><strong>Special Notes:</strong></p>
                            <p style="margin: 5px 0 0 0;">{booking.get('notes', 'None') or 'None'}</p>
                        </div>
                        
                        <p style="margin-top: 30px;">Please confirm receipt and contact the customer if you have any questions.</p>
                        <p>Login to your <a href="https://bookaride.co.nz/driver/login" style="color: #1a1a1a; text-decoration: underline; font-weight: bold;">Driver Portal</a> for more details.</p>
                    </div>
                    <div style="background-color: #f8f9fa; color: #6c757d; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #dee2e6;">
                        <p style="margin: 0;">BookaRide NZ</p>
                        <p style="margin: 5px 0;">bookaride.co.nz | +64 21 743 321</p>
                    </div>
                </body>
            </html>
            """
            
            response = requests.post(
                f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
                auth=("api", mailgun_api_key),
                data={
                    "from": f"BookaRide <{sender_email}>",
                    "to": driver.get('email'),
                    "subject": f"New Booking Assignment - Ref: {booking_ref} - {formatted_date}",
                    "html": html_content
                }
            )
            
            if response.status_code == 200:
                logger.info(f"Driver notification email sent to {driver.get('email')}")
            else:
                logger.error(f"Failed to send driver email: {response.status_code} - {response.text}")
        
        # Send SMS to Driver
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')
        
        if account_sid and auth_token and twilio_phone:
            client = Client(account_sid, auth_token)
            
            sms_body = f"""BookaRide - New Booking!

Ref: {booking_ref}
Customer: {booking.get('name', 'N/A')}
Phone: {booking.get('phone', 'N/A')}
Pickup: {booking.get('pickupAddress', 'N/A')}
Date: {formatted_date} at {booking.get('time', 'N/A')}

Check your email for full details."""
            
            message = client.messages.create(
                body=sms_body,
                from_=twilio_phone,
                to=driver.get('phone')
            )
            
            logger.info(f"Driver notification SMS sent to {driver.get('phone')} - SID: {message.sid}")
        
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
                logger.info("✅ Service account credentials loaded from environment variable")
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
            logger.info("✅ Service account credentials loaded from file")
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
            'summary': f"🚗 OUTBOUND: {customer_name} - {service_type}" + (" (+ RETURN)" if has_return else ""),
            'location': main_pickup,
            'description': f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚗 OUTBOUND TRIP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reference: #{ref_num}
Date: {formatted_date}
Pickup Time: {booking_time}

👤 CUSTOMER
Name: {customer_name}
Phone: {customer_phone}
Email: {customer_email}
Passengers: {passengers}

📍 PICKUP LOCATIONS:
{chr(10).join(pickup_list)}

🏁 DROP-OFF:
{eng['dropoff']}

💰 PAYMENT
Total: ${total_price:.2f} NZD
Status: {payment_status}

📝 NOTES: {notes}
{"" if not has_return else f'''
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ THIS BOOKING HAS A RETURN TRIP
Return Date: {booking.get('returnDate', 'N/A')}
Return Time: {booking.get('returnTime', 'N/A')}
(See separate calendar event for return)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'''}
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
                    'summary': f"🔄 RETURN: {customer_name} - {service_type}",
                    'location': eng['dropoff'],  # Return starts from original drop-off
                    'description': f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 RETURN TRIP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reference: #{ref_num} (RETURN)
Date: {formatted_return_date}
Pickup Time: {return_time}

👤 CUSTOMER
Name: {customer_name}
Phone: {customer_phone}
Email: {customer_email}
Passengers: {passengers}

📍 PICKUP (Start of Return):
{eng['dropoff']}

🛤️ DROP-OFF STOPS (Reverse Order):
{chr(10).join(reverse_stops)}

💰 PAYMENT
Total (both ways): ${total_price:.2f} NZD
Status: {payment_status}

📝 NOTES: {notes}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️ This is the RETURN leg of booking #{ref_num}
Outbound was: {formatted_date} at {booking_time}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
    """Resend confirmation email and SMS to customer"""
    try:
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
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
    """Generate the confirmation email HTML for preview or sending"""
    sender_email = os.environ.get('SENDER_EMAIL', 'bookings@bookaride.co.nz')
    
    # Get pricing
    total_price = booking.get('totalPrice', 0) or booking.get('pricing', {}).get('totalPrice', 0)
    
    # Format date and get reference
    formatted_date = format_date_ddmmyyyy(booking.get('date', 'N/A'))
    booking_ref = get_booking_reference(booking)
    
    # Build pickup addresses list for outbound
    pickup_addresses = booking.get('pickupAddresses', [])
    primary_pickup = booking.get('pickupAddress', 'N/A')
    dropoff_address = booking.get('dropoffAddress', 'N/A')
    
    # Build the route display for outbound trip with elegant styling
    outbound_route_html = f'''
        <div style="background: linear-gradient(135deg, #fefefe 0%, #f8f6f0 100%); border-radius: 8px; padding: 15px; margin: 10px 0;">
            <div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
                <div style="width: 24px; height: 24px; background: #D4AF37; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
                    <span style="color: white; font-size: 12px; font-weight: bold;">1</span>
                </div>
                <div style="flex: 1;">
                    <span style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Pickup</span>
                    <p style="margin: 2px 0 0 0; color: #333; font-size: 14px;">{primary_pickup}</p>
                </div>
            </div>
    '''
    
    if pickup_addresses and len(pickup_addresses) > 0:
        for i, addr in enumerate(pickup_addresses):
            if addr and addr.strip():
                outbound_route_html += f'''
            <div style="display: flex; align-items: flex-start; margin-bottom: 8px; padding-left: 36px; border-left: 2px dashed #D4AF37; margin-left: 11px;">
                <div style="width: 24px; height: 24px; background: #D4AF37; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; margin-left: -49px; flex-shrink: 0;">
                    <span style="color: white; font-size: 12px; font-weight: bold;">{i + 2}</span>
                </div>
                <div style="flex: 1;">
                    <span style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Pickup</span>
                    <p style="margin: 2px 0 0 0; color: #333; font-size: 14px;">{addr}</p>
                </div>
            </div>
                '''
    
    outbound_route_html += f'''
            <div style="display: flex; align-items: flex-start; padding-left: 36px; border-left: 2px solid #D4AF37; margin-left: 11px;">
                <div style="width: 24px; height: 24px; background: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; margin-left: -49px; flex-shrink: 0;">
                    <span style="color: white; font-size: 14px;">✓</span>
                </div>
                <div style="flex: 1;">
                    <span style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Drop-off</span>
                    <p style="margin: 2px 0 0 0; color: #333; font-size: 14px; font-weight: 600;">{dropoff_address}</p>
                </div>
            </div>
        </div>
    '''
    
    # Build return trip section if applicable
    return_trip_html = ""
    has_return = booking.get('bookReturn', False)
    return_date = booking.get('returnDate', '')
    return_time = booking.get('returnTime', '')
    
    if has_return and return_date:
        # Format return date
        formatted_return_date = format_date_ddmmyyyy(return_date)
        
        # Reverse the pickups to become drop-offs
        all_pickups = [primary_pickup]
        if pickup_addresses:
            all_pickups.extend([addr for addr in pickup_addresses if addr and addr.strip()])
        
        reversed_dropoffs = list(reversed(all_pickups))
        
        # Build return route HTML
        return_route_html = f'''
        <div style="background: linear-gradient(135deg, #fefefe 0%, #f8f6f0 100%); border-radius: 8px; padding: 15px; margin: 10px 0;">
            <div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
                <div style="width: 24px; height: 24px; background: #D4AF37; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
                    <span style="color: white; font-size: 14px;">↩</span>
                </div>
                <div style="flex: 1;">
                    <span style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Pickup</span>
                    <p style="margin: 2px 0 0 0; color: #333; font-size: 14px;">{dropoff_address}</p>
                </div>
            </div>
        '''
        
        for i, addr in enumerate(reversed_dropoffs):
            is_final = i == len(reversed_dropoffs) - 1
            label = "Final Drop-off" if is_final else f"Drop-off"
            bg_color = "#22c55e" if is_final else "#D4AF37"
            icon = "✓" if is_final else str(i + 1)
            
            return_route_html += f'''
            <div style="display: flex; align-items: flex-start; margin-bottom: 8px; padding-left: 36px; border-left: 2px {'solid' if is_final else 'dashed'} #D4AF37; margin-left: 11px;">
                <div style="width: 24px; height: 24px; background: {bg_color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; margin-left: -49px; flex-shrink: 0;">
                    <span style="color: white; font-size: {'14px' if is_final else '12px'}; font-weight: bold;">{icon}</span>
                </div>
                <div style="flex: 1;">
                    <span style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">{label}</span>
                    <p style="margin: 2px 0 0 0; color: #333; font-size: 14px; {'font-weight: 600;' if is_final else ''}">{addr}</p>
                </div>
            </div>
            '''
        
        return_route_html += '</div>'
        
        # Check if return trip is TO Auckland Airport (Meet & Greet offer)
        meet_greet_html = ""
        airport_keywords = ['auckland airport', 'akl airport', 'international terminal', 'domestic terminal']
        is_airport_return = any(kw in dropoff_address.lower() for kw in airport_keywords)
        
        if is_airport_return:
            meet_greet_html = '''
                    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 10px; padding: 20px; margin-top: 20px; border: 2px solid #D4AF37;">
                        <div style="text-align: center; margin-bottom: 15px;">
                            <span style="font-size: 28px;">🤝</span>
                            <h4 style="margin: 10px 0 5px 0; color: #D4AF37; font-size: 18px;">Meet & Greet Service Available</h4>
                            <p style="margin: 0; color: #ccc; font-size: 13px;">For your return journey to Auckland Airport</p>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; margin: 15px 0;">
                            <p style="margin: 0 0 10px 0; color: #fff; font-size: 14px;"><strong>What's included:</strong></p>
                            <ul style="margin: 0; padding-left: 20px; color: #ccc; font-size: 13px; line-height: 1.8;">
                                <li>Personal greeter waiting at arrivals with your name sign</li>
                                <li>Assistance with luggage to your vehicle</li>
                                <li>Priority pickup - no waiting in queues</li>
                                <li>Flight tracking - we adjust if your flight is delayed</li>
                            </ul>
                        </div>
                        <div style="text-align: center; margin-top: 15px;">
                            <p style="margin: 0 0 10px 0; color: #D4AF37; font-size: 16px; font-weight: 600;">Only +$20 NZD</p>
                            <a href="mailto:bookings@bookaride.co.nz?subject=Meet%20%26%20Greet%20Request%20-%20''' + booking_ref + '''&body=Hi%2C%0A%0AI%20would%20like%20to%20add%20Meet%20%26%20Greet%20service%20to%20my%20booking%20''' + booking_ref + '''.%0A%0AThank%20you!" 
                               style="display: inline-block; background: #D4AF37; color: #1a1a2e; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
                                Add Meet & Greet to My Booking
                            </a>
                        </div>
                    </div>
            '''
        
        return_trip_html = f'''
                <!-- Return Trip Section -->
                <div style="margin-top: 30px;">
                    <div style="display: flex; align-items: center; margin-bottom: 15px;">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                            <span style="color: white; font-size: 18px;">↩</span>
                        </div>
                        <div>
                            <h3 style="margin: 0; color: #1a1a1a; font-size: 18px;">Return Trip</h3>
                            <p style="margin: 2px 0 0 0; color: #666; font-size: 13px;">{formatted_return_date} at {return_time or 'TBC'}</p>
                        </div>
                    </div>
                    {return_route_html}
                    {meet_greet_html}
                </div>
        '''
    
    # Logo as inline SVG (gold B logo)
    logo_svg = '''
        <svg width="60" height="60" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="64" height="64" rx="12" fill="#D4AF37"/>
            <circle cx="32" cy="32" r="20" stroke="white" stroke-width="3" fill="none"/>
            <text x="32" y="42" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white" text-anchor="middle">B</text>
        </svg>
    '''
    
    # Dynamic service tagline based on service type
    service_type = booking.get('serviceType', 'private-transfer')
    service_tagline_map = {
        'private-transfer': 'PRIVATE SHUTTLE TRANSFER',
        'private-shuttle': 'PRIVATE SHUTTLE TRANSFER',
        'airport-transfer': 'AIRPORT TRANSFER',
        'shared-shuttle': 'SHARED SHUTTLE SERVICE',
        'cruise-transfer': 'CRUISE SHIP TRANSFER',
        'charter': 'CHARTER SERVICE',
    }
    service_tagline = service_tagline_map.get(service_type, service_type.replace('-', ' ').upper())
    
    html_content = f'''
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                
                <!-- Header with Logo -->
                <div style="background: linear-gradient(135deg, #ffffff 0%, #faf8f3 100%); padding: 30px 20px; text-align: center; border-bottom: 3px solid #D4AF37;">
                    {logo_svg}
                    <h1 style="margin: 15px 0 5px 0; color: #1a1a1a; font-size: 24px; font-weight: 300; letter-spacing: 2px;">BOOK<span style="color: #D4AF37; font-weight: 600;">A</span>RIDE</h1>
                    <p style="margin: 0; color: #888; font-size: 12px; letter-spacing: 1px;">{service_tagline}</p>
                </div>
                
                <!-- Confirmation Badge -->
                <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); padding: 20px; text-align: center;">
                    <div style="display: inline-block; background: white; border-radius: 50%; width: 50px; height: 50px; line-height: 50px; margin-bottom: 10px;">
                        <span style="color: #22c55e; font-size: 28px;">✓</span>
                    </div>
                    <h2 style="margin: 0; color: white; font-size: 22px; font-weight: 400;">Booking Confirmed</h2>
                    <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Reference: <strong>{booking_ref}</strong></p>
                </div>
                
                <!-- Main Content -->
                <div style="padding: 30px 25px;">
                    <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                        Dear <strong>{booking.get('name', 'Customer')}</strong>,<br><br>
                        Thank you for choosing BookaRide! Your booking has been confirmed. Here are your trip details:
                    </p>
                    
                    <!-- Outbound Trip Section -->
                    <div style="margin-bottom: 25px;">
                        <div style="display: flex; align-items: center; margin-bottom: 15px;">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                                <span style="color: white; font-size: 18px;">→</span>
                            </div>
                            <div>
                                <h3 style="margin: 0; color: #1a1a1a; font-size: 18px;">Outbound Trip</h3>
                                <p style="margin: 2px 0 0 0; color: #666; font-size: 13px;">{formatted_date} at {booking.get('time', 'N/A')}</p>
                            </div>
                        </div>
                        
                        <!-- Trip Details Card -->
                        <div style="background: #faf8f3; border-radius: 10px; padding: 15px; margin-bottom: 15px; border: 1px solid #e8e4d9;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-size: 13px; width: 120px;">Service Type</td>
                                    <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 500;">{booking.get('serviceType', 'N/A').replace('-', ' ').title()}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-size: 13px;">Passengers</td>
                                    <td style="padding: 8px 0; color: #333; font-size: 14px; font-weight: 500;">{booking.get('passengers', 'N/A')}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <!-- Route -->
                        {outbound_route_html}
                    </div>
                    
                    {return_trip_html}
                    
                    <!-- Price Section -->
                    <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8960C 100%); border-radius: 10px; padding: 20px; margin: 25px 0; text-align: center;">
                        <p style="margin: 0 0 5px 0; color: rgba(255,255,255,0.9); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Total Amount</p>
                        <p style="margin: 0; color: white; font-size: 32px; font-weight: 600;">${total_price:.2f} <span style="font-size: 16px; color: rgba(255,255,255,0.8);">NZD</span></p>
                    </div>
                    
                    <!-- Contact Info -->
                    <div style="background: #f8f8f8; border-radius: 10px; padding: 20px; text-align: center; border: 1px solid #eee;">
                        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Questions? We're here to help!</p>
                        <p style="margin: 0;">
                            <a href="tel:+6421743321" style="color: #D4AF37; text-decoration: none; font-weight: 600; font-size: 16px;">+64 21 743 321</a>
                            <span style="color: #ccc; margin: 0 10px;">|</span>
                            <a href="mailto:{sender_email}" style="color: #D4AF37; text-decoration: none; font-size: 14px;">{sender_email}</a>
                        </p>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background: #faf8f3; padding: 25px; text-align: center; border-top: 1px solid #e8e4d9;">
                    <p style="margin: 0 0 10px 0; color: #333; font-size: 14px; font-weight: 500;">Thank you for choosing BookaRide!</p>
                    <p style="margin: 0; color: #888; font-size: 12px;">Premium Airport Transfers across Auckland</p>
                    <div style="margin-top: 15px;">
                        <a href="https://bookaride.co.nz" style="color: #D4AF37; text-decoration: none; font-size: 12px;">bookaride.co.nz</a>
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
        
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency="nzd",
            success_url=success_url,
            cancel_url=cancel_url,
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
                    
                    # Send email confirmation
                    send_booking_confirmation_email(booking)
                    
                    # Send SMS confirmation
                    send_booking_confirmation_sms(booking)
                    
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
                if booking_id:
                    await db.bookings.update_one(
                        {"id": booking_id},
                        {"$set": {"payment_status": "paid", "status": "confirmed"}}
                    )
                    logger.info(f"Booking {booking_id} confirmed via webhook")
                    
                    # Get booking details for notifications
                    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
                    if booking:
                        # Send email confirmation
                        send_booking_confirmation_email(booking)
                        
                        # Send SMS confirmation
                        send_booking_confirmation_sms(booking)
                        
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



# ==================== ENHANCED ADMIN FEATURES ====================

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
                route = f"{pickup} → {dropoff}"
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
        
        amount = float(booking.get('totalPrice', 0))
        if amount <= 0:
            return None
        
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency="nzd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "booking_id": booking.get('id', ''),
                "customer_email": booking.get('email', ''),
                "customer_name": booking.get('name', '')
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        return session.checkout_url
    except Exception as e:
        logger.error(f"Error generating Stripe payment link: {str(e)}")
        return None

def generate_paypal_payment_link(booking: dict) -> str:
    """Generate a PayPal.me payment link for a booking"""
    try:
        paypal_username = os.environ.get('PAYPAL_ME_USERNAME', 'bookaridenz')
        amount = float(booking.get('totalPrice', 0))
        if amount <= 0:
            return None
        
        # PayPal.me link format: https://paypal.me/username/amount
        return f"https://paypal.me/{paypal_username}/{amount:.2f}NZD"
    except Exception as e:
        logger.error(f"Error generating PayPal payment link: {str(e)}")
        return None

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
def add_contact_to_icloud(booking: dict):
    """Add a booking customer as a contact to iCloud Contacts"""
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
        
        # Generate unique UID
        contact_uid = str(uuid.uuid4())
        vcard.add('uid').value = contact_uid
        
        vcard_data = vcard.serialize()
        
        # iCloud CardDAV endpoint - using discovered path
        # Principal ID: 11909617397, Server: p115-contacts.icloud.com
        carddav_url = f"https://p115-contacts.icloud.com:443/11909617397/carddavhome/card/{contact_uid}.vcf"
        
        # Upload to iCloud
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
            logger.info(f"Contact added to iCloud: {customer_name} ({phone})")
            return True
        else:
            logger.error(f"Failed to add contact to iCloud: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Error adding contact to iCloud: {str(e)}")
        return False

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

@api_router.post("/bookings/manual")
async def create_manual_booking(booking: ManualBooking):
    """Create a booking manually"""
    try:
        # Get sequential reference number
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
            "status": "confirmed",
            "payment_status": booking.paymentMethod,  # cash, card, bank-transfer, pay-on-pickup
            "flightArrivalNumber": booking.flightArrivalNumber or "",
            "flightArrivalTime": booking.flightArrivalTime or "",
            "flightDepartureNumber": booking.flightDepartureNumber or "",
            "flightDepartureTime": booking.flightDepartureTime or "",
            "bookReturn": booking.bookReturn or False,
            "returnDate": booking.returnDate or "",
            "returnTime": booking.returnTime or "",
            "createdAt": datetime.now(timezone.utc)
        }
        
        await db.bookings.insert_one(new_booking)
        logger.info(f"Manual booking created: #{ref_number} - Payment: {booking.paymentMethod}")
        
        # Handle payment link sending based on payment method
        payment_link_sent = False
        if booking.paymentMethod == 'stripe':
            # Send Stripe payment link
            try:
                payment_link = await generate_stripe_payment_link(new_booking)
                if payment_link:
                    await send_payment_link_email(new_booking, payment_link, 'stripe')
                    payment_link_sent = True
                    logger.info(f"Stripe payment link sent for booking {ref_number}")
            except Exception as e:
                logger.error(f"Error sending Stripe payment link: {str(e)}")
        elif booking.paymentMethod == 'paypal':
            # Send PayPal payment link
            try:
                payment_link = generate_paypal_payment_link(new_booking)
                if payment_link:
                    await send_payment_link_email(new_booking, payment_link, 'paypal')
                    payment_link_sent = True
                    logger.info(f"PayPal payment link sent for booking {ref_number}")
            except Exception as e:
                logger.error(f"Error sending PayPal payment link: {str(e)}")
        
        # Send confirmation email (with CC if provided)
        send_booking_confirmation_email(new_booking, include_payment_link=not payment_link_sent)
        
        # Send confirmation SMS
        send_booking_confirmation_sms(new_booking)
        
        # Send admin notification
        await send_booking_notification_to_admin(new_booking)
        
        # Create calendar event
        await create_calendar_event(new_booking)
        
        # Sync contact to iCloud
        add_contact_to_icloud(new_booking)
        
        return {"message": "Booking created successfully", "id": new_booking['id'], "referenceNumber": ref_number, "paymentLinkSent": payment_link_sent}
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
                        <h2>🚗 Driver Application Received</h2>
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
async def assign_driver_to_booking(driver_id: str, booking_id: str):
    """Assign a driver to a booking"""
    try:
        # Get driver details first
        driver = await db.drivers.find_one({"id": driver_id}, {"_id": 0})
        if not driver:
            raise HTTPException(status_code=404, detail="Driver not found")
        
        # Update booking with driver assignment including driver name
        result = await db.bookings.update_one(
            {"id": booking_id},
            {"$set": {
                "driver_id": driver_id,
                "driver_name": driver.get('name', ''),
                "driver_phone": driver.get('phone', ''),
                "driver_email": driver.get('email', ''),
                "driver_assigned_at": datetime.now(timezone.utc)
            }}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Get booking details for notification
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        
        if driver and booking:
            # Send notification to driver
            await send_driver_notification(booking, driver)
            logger.info(f"Driver {driver.get('name')} ({driver_id}) assigned to booking {booking_id} and notification sent")
        else:
            logger.warning(f"Booking not found for notification - Booking: {booking_id}")
        
        return {"message": f"Driver {driver.get('name')} assigned successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning driver: {str(e)}")
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
    """Get bookings assigned to a driver with reduced pricing (15% commission)"""
    try:
        query = {"driver_id": driver_id}
        
        # Get all bookings for the driver (for weekly/upcoming view)
        all_bookings = await db.bookings.find(query, {"_id": 0}).to_list(1000)
        
        # Calculate driver price (85% of customer price - 15% commission)
        for booking in all_bookings:
            customer_price = booking.get('pricing', {}).get('totalPrice', 0)
            # Driver gets 85% of the customer price
            driver_price = customer_price * 0.85
            booking['driver_price'] = round(driver_price, 2)
            
            # Remove the full pricing details from response
            if 'pricing' in booking:
                del booking['pricing']
        
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
    """Delete a single booking and optionally send cancellation notifications"""
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
        
        # Delete the booking
        result = await db.bookings.delete_one({"id": booking_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        logger.info(f"Booking {booking_id} deleted by admin, notifications sent: {send_notification}")
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

If you didn't request this, please call us at 027-246-0201.

To rebook: bookaride.co.nz"""
    
    client = Client(account_sid, auth_token)
    message = client.messages.create(
        body=sms_body,
        from_=twilio_phone,
        to=to_phone
    )
    
    logger.info(f"Cancellation SMS sent to {to_phone} - SID: {message.sid}")

@api_router.delete("/bookings/bulk-delete")
async def bulk_delete(booking_ids: List[str], send_notifications: bool = False):
    """Delete multiple bookings (notifications optional for bulk)"""
    try:
        if send_notifications:
            # Get all bookings first to send notifications
            bookings = await db.bookings.find({"id": {"$in": booking_ids}}, {"_id": 0}).to_list(1000)
            for booking in bookings:
                try:
                    await send_cancellation_notifications(booking)
                except Exception as e:
                    logger.error(f"Error sending cancellation for booking {booking.get('id')}: {str(e)}")
        
        result = await db.bookings.delete_many({"id": {"$in": booking_ids}})
        return {"message": "Bookings deleted", "count": result.deleted_count, "notifications_sent": send_notifications}
    except Exception as e:
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
            {"slug": "whangaparaoa", "name": "Whangaparāoa", "city": "Hibiscus Coast", "distance": 48, "price": 135},
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

# Include the router in the main app
app.include_router(api_router)

# Configure CORS with specific origins for credentials support
cors_origins_env = os.environ.get('CORS_ORIGINS', '*')
if cors_origins_env == '*':
    # When using credentials, we need specific origins
    cors_origins = [
        "https://bookaride.co.nz",
        "https://www.bookaride.co.nz",
        "https://cabify-updates.preview.emergentagent.com",
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

# Initialize the scheduler
scheduler = AsyncIOScheduler()

async def scheduled_send_reminders():
    """Scheduled task to send reminders for tomorrow's bookings at 8 AM NZ time"""
    try:
        logger.info("🔔 Running scheduled reminder task...")
        
        # Get tomorrow's date in YYYY-MM-DD format (NZ timezone)
        nz_tz = pytz.timezone('Pacific/Auckland')
        nz_now = datetime.now(nz_tz)
        nz_tomorrow = (nz_now + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Find all confirmed bookings for tomorrow
        bookings = await db.bookings.find({
            "status": "confirmed",
            "date": nz_tomorrow
        }, {"_id": 0}).to_list(100)
        
        sent_count = 0
        for booking in bookings:
            # Check if reminder already sent today
            reminder_sent = booking.get('reminderSentAt', '')
            today_str = nz_now.strftime('%Y-%m-%d')
            
            if reminder_sent and reminder_sent.startswith(today_str):
                logger.info(f"Skipping {booking.get('name')} - reminder already sent today")
                continue
            
            # Send email reminder
            if booking.get('email'):
                send_reminder_email(booking)
                logger.info(f"Sent reminder email to {booking.get('email')}")
            
            # Send SMS reminder
            if booking.get('phone'):
                send_reminder_sms(booking)
                logger.info(f"Sent reminder SMS to {booking.get('phone')}")
            
            # Mark reminder as sent
            await db.bookings.update_one(
                {"id": booking.get('id')},
                {"$set": {"reminderSentAt": datetime.now(timezone.utc).isoformat()}}
            )
            sent_count += 1
        
        logger.info(f"✅ Scheduled reminders complete: {sent_count} bookings notified for {nz_tomorrow}")
        
    except Exception as e:
        logger.error(f"❌ Scheduled reminder error: {str(e)}")


@app.on_event("startup")
async def startup_event():
    """Start the scheduler when the app starts and ensure default admin exists"""
    # Ensure default admin exists with correct email for Google OAuth
    default_admin = await db.admin_users.find_one({"username": "admin"})
    if not default_admin:
        hashed_pw = pwd_context.hash("Kongkong2025!@")
        await db.admin_users.insert_one({
            "id": str(uuid.uuid4()),
            "username": "admin",
            "email": "info@bookaride.co.nz",
            "hashed_password": hashed_pw,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True
        })
        logger.info("✅ Default admin user created")
    else:
        # Update password and email to ensure they're correct
        hashed_pw = pwd_context.hash("Kongkong2025!@")
        await db.admin_users.update_one(
            {"username": "admin"},
            {"$set": {
                "hashed_password": hashed_pw,
                "email": "info@bookaride.co.nz"
            }}
        )
        logger.info("✅ Admin password reset and email updated to info@bookaride.co.nz")
    
    # Schedule reminders at 8:00 AM New Zealand time every day
    nz_tz = pytz.timezone('Pacific/Auckland')
    
    scheduler.add_job(
        scheduled_send_reminders,
        CronTrigger(hour=8, minute=0, timezone=nz_tz),
        id='daily_reminders',
        name='Send day-before reminders at 8 AM NZ time',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("🚀 Scheduler started - Reminders will be sent at 8:00 AM NZ time daily")


@app.on_event("shutdown")
async def shutdown_db_client():
    scheduler.shutdown()
    client.close()
