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
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Booking(BookingCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

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
        # Use Google Maps Distance Matrix API to calculate distance
        # For now, using a simple estimation (you'll need to add Google Maps API key)
        google_api_key = os.environ.get('GOOGLE_MAPS_API_KEY', '')
        
        if google_api_key:
            # Call Google Maps Distance Matrix API
            url = "https://maps.googleapis.com/maps/api/distancematrix/json"
            params = {
                'origins': request.pickupAddress,
                'destinations': request.dropoffAddress,
                'key': google_api_key
            }
            response = requests.get(url, params=params)
            data = response.json()
            
            logger.info(f"Google Maps API response: {data}")
            
            if data['status'] == 'OK' and len(data['rows']) > 0 and len(data['rows'][0]['elements']) > 0:
                element = data['rows'][0]['elements'][0]
                if element['status'] == 'OK':
                    # Distance in meters, convert to km
                    distance_meters = element['distance']['value']
                    distance_km = round(distance_meters / 1000, 2)
                else:
                    logger.warning(f"Google Maps element status: {element.get('status')}")
                    distance_km = 25.0  # Fallback
            else:
                logger.warning(f"Google Maps API error: {data.get('error_message', data.get('status'))}")
                distance_km = 25.0  # Fallback
        else:
            # Fallback: estimate based on string similarity (for demo purposes)
            # In production, you MUST use Google Maps API
            distance_km = 25.0  # Default estimate
            logger.warning("Google Maps API key not found. Using default distance estimate.")
        
        # Calculate pricing with tiered rates
        if distance_km >= 100 and distance_km <= 300:
            base_price = distance_km * 3.50  # $3.50 per km for 100-300km
        elif distance_km >= 75 and distance_km < 100:
            base_price = distance_km * 2.70  # $2.70 per km for 75-100km
        else:
            base_price = distance_km * 2.50  # $2.50 per km for other distances (0-75km and 300+km)
        
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
        # Extract totalPrice from pricing for payment processing
        booking_dict['totalPrice'] = booking.pricing.get('totalPrice', 0)
        booking_dict['payment_status'] = 'unpaid'
        await db.bookings.insert_one(booking_dict)
        logger.info(f"Booking created: {booking_obj.id}")
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
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
        logger.info(f"Booking updated: {booking_id}")
        return {"message": "Booking updated successfully"}
    except Exception as e:
        logger.error(f"Error updating booking: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating booking: {str(e)}")

# Send Email Endpoint (for admin)
@api_router.post("/send-booking-email")
async def send_booking_email(email_data: dict, current_admin: dict = Depends(get_current_admin)):
    try:
        # In production, you would integrate with an email service like SendGrid, Mailgun, etc.
        # For now, we'll just log it and return success
        logger.info(f"Email would be sent to: {email_data.get('email')}")
        logger.info(f"Subject: {email_data.get('subject')}")
        logger.info(f"Message: {email_data.get('message')}")
        
        # TODO: Integrate with actual email service
        # Example with SendGrid:
        # import sendgrid
        # from sendgrid.helpers.mail import Mail
        # message = Mail(
        #     from_email='noreply@bookaride.co.nz',
        #     to_emails=email_data.get('email'),
        #     subject=email_data.get('subject'),
        #     plain_text_content=email_data.get('message')
        # )
        # sg = sendgrid.SendGridAPIClient(api_key=os.environ.get('SENDGRID_API_KEY'))
        # response = sg.send(message)
        
        return {"message": "Email sent successfully (currently logged only - integrate email service)"}
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending email: {str(e)}")


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

def send_booking_confirmation_email(booking: dict):
    """Send booking confirmation email via Mailgun or SMTP fallback"""
    # Try Mailgun first
    mailgun_success = send_via_mailgun(booking)
    if mailgun_success:
        return True
    
    # Fallback to SMTP if Mailgun fails
    logger.warning("Mailgun failed, trying SMTP fallback...")
    return send_via_smtp(booking)


def send_via_mailgun(booking: dict):
    """Try sending via Mailgun with multi-language support"""
    try:
        mailgun_api_key = os.environ.get('MAILGUN_API_KEY')
        mailgun_domain = os.environ.get('MAILGUN_DOMAIN')
        sender_email = os.environ.get('SENDER_EMAIL', 'noreply@bookaride.co.nz')
        
        if not mailgun_api_key or not mailgun_domain:
            logger.warning("Mailgun credentials not configured")
            return False
        
        # Get language preference (default to English)
        lang = booking.get('language', 'en')
        if lang not in EMAIL_TRANSLATIONS:
            lang = 'en'
        t = EMAIL_TRANSLATIONS[lang]
        
        # Get pricing
        total_price = booking.get('pricing', {}).get('totalPrice', 0) if isinstance(booking.get('pricing'), dict) else 0
        
        # Create email content with translations
        subject = f"{t['subject']} - {booking.get('id', '')[:8]}"
        recipient_email = booking.get('email')
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #1a1a1a; color: #D4AF37; padding: 20px; text-align: center;">
                    <h1>BookaRide.co.nz</h1>
                </div>
                <div style="padding: 20px; background-color: #f5f5f5;">
                    <h2 style="color: #1a1a1a;">✅ {t['confirmed']}</h2>
                    <p>{t['greeting']} {booking.get('name', 'Customer')},</p>
                    <p>{t['intro']}</p>
                    
                    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>{t['reference']}:</strong> {booking.get('id', '')[:8].upper()}</p>
                        <p><strong>{t['service']}:</strong> {booking.get('serviceType', 'N/A').replace('-', ' ').title()}</p>
                        <p><strong>{t['pickup']}:</strong> {booking.get('pickupAddress', 'N/A')}</p>
                        <p><strong>{t['dropoff']}:</strong> {booking.get('dropoffAddress', 'N/A')}</p>
                        <p><strong>{t['date']}:</strong> {booking.get('date', 'N/A')}</p>
                        <p><strong>{t['time']}:</strong> {booking.get('time', 'N/A')}</p>
                        <p><strong>{t['passengers']}:</strong> {booking.get('passengers', 'N/A')}</p>
                        <p><strong>{t['total']}:</strong> ${total_price:.2f} NZD</p>
                    </div>
                    
                    <p>{t['contact_intro']}</p>
                    <p>{t['contact']} {sender_email} {t['or_call']} +64 21 743 321.</p>
                    
                    <p style="margin-top: 30px;">Thank you for choosing BookaRide!</p>
                </div>
                <div style="background-color: #1a1a1a; color: #D4AF37; padding: 15px; text-align: center; font-size: 12px;">
                    <p>BookaRide NZ | bookaride.co.nz | +64 21 743 321</p>
                </div>
            </body>
        </html>
        """
        
        # Send email via Mailgun API
        response = requests.post(
            f"https://api.mailgun.net/v3/{mailgun_domain}/messages",
            auth=("api", mailgun_api_key),
            data={
                "from": f"BookaRide <{sender_email}>",
                "to": recipient_email,
                "subject": subject,
                "html": html_content
            }
        )
        
        if response.status_code == 200:
            logger.info(f"Confirmation email sent to {recipient_email} via Mailgun")
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
        
        # Create email content
        subject = f"Booking Confirmation - {booking.get('id', '')[:8]}"
        recipient_email = booking.get('email')
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #1a1a1a; color: #D4AF37; padding: 20px; text-align: center;">
                    <h1>BookaRide.co.nz</h1>
                </div>
                <div style="padding: 20px; background-color: #f5f5f5;">
                    <h2 style="color: #1a1a1a;">Booking Confirmed!</h2>
                    <p>Dear {booking.get('name', 'Customer')},</p>
                    <p>Your ride has been confirmed. Here are your booking details:</p>
                    
                    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Booking Reference:</strong> {booking.get('id', '')[:8].upper()}</p>
                        <p><strong>Service Type:</strong> {booking.get('serviceType', 'N/A').replace('-', ' ').title()}</p>
                        <p><strong>Pickup:</strong> {booking.get('pickupAddress', 'N/A')}</p>
                        <p><strong>Drop-off:</strong> {booking.get('dropoffAddress', 'N/A')}</p>
                        <p><strong>Date:</strong> {booking.get('date', 'N/A')}</p>
                        <p><strong>Time:</strong> {booking.get('time', 'N/A')}</p>
                        <p><strong>Passengers:</strong> {booking.get('passengers', 'N/A')}</p>
                        <p><strong>Total Paid:</strong> ${booking.get('totalPrice', 0):.2f} NZD</p>
                    </div>
                    
                    <p>We'll be in touch closer to your pickup time to confirm all details.</p>
                    <p>If you have any questions, please contact us at {sender_email} or call +64 21 743 321.</p>
                    
                    <p style="margin-top: 30px;">Thank you for choosing BookaRide!</p>
                </div>
                <div style="background-color: #1a1a1a; color: #D4AF37; padding: 15px; text-align: center; font-size: 12px;">
                    <p>BookaRide NZ | bookaride.co.nz | +64 21 743 321</p>
                </div>
            </body>
        </html>
        """
        
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
        
        # Create SMS message
        message_body = f"""Book A Ride NZ - Booking Confirmed!

Ref: {booking.get('id', '')[:8].upper()}
Pickup: {booking.get('pickupAddress', 'N/A')}
Date: {booking.get('date', 'N/A')} at {booking.get('time', 'N/A')}
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


# Google Calendar Integration

async def get_calendar_credentials():
    """Get Google Calendar credentials for the business account"""
    try:
        # Get stored tokens from database
        calendar_auth = await db.calendar_auth.find_one({"email": "info@airportshuttleservice.co.nz"}, {"_id": 0})
        
        if not calendar_auth or 'google_tokens' not in calendar_auth:
            logger.warning("Google Calendar not authenticated. Please authenticate at /api/auth/google/login")
            return None
        
        tokens = calendar_auth['google_tokens']
        
        creds = Credentials(
            token=tokens.get('access_token'),
            refresh_token=tokens.get('refresh_token'),
            token_uri='https://oauth2.googleapis.com/token',
            client_id=os.environ.get('GOOGLE_CLIENT_ID'),
            client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
            scopes=['https://www.googleapis.com/auth/calendar']
        )
        
        # Refresh token if expired
        if creds.expired and creds.refresh_token:
            creds.refresh(GoogleRequest())
            # Update tokens in database
            await db.calendar_auth.update_one(
                {"email": "info@airportshuttleservice.co.nz"},
                {"$set": {"google_tokens.access_token": creds.token}}
            )
            logger.info("Google Calendar token refreshed")
        
        return creds
        
    except Exception as e:
        logger.error(f"Error getting calendar credentials: {str(e)}")
        return None


async def create_calendar_event(booking: dict):
    """Create a Google Calendar event for the booking"""
    try:
        creds = await get_calendar_credentials()
        if not creds:
            logger.warning("Cannot create calendar event: No credentials")
            return False
        
        service = build('calendar', 'v3', credentials=creds)
        
        # Parse booking date and time
        booking_datetime = f"{booking.get('date')}T{booking.get('time')}:00"
        
        # Create event
        event = {
            'summary': f"Booking: {booking.get('name')} - {booking.get('serviceType', 'Shuttle').replace('-', ' ').title()}",
            'location': booking.get('pickupAddress', ''),
            'description': f"""
Booking Reference: {booking.get('id', '')[:8].upper()}

Customer: {booking.get('name')}
Phone: {booking.get('phone')}
Email: {booking.get('email')}

Service: {booking.get('serviceType', '').replace('-', ' ').title()}
Pickup: {booking.get('pickupAddress')}
Drop-off: {booking.get('dropoffAddress')}
Passengers: {booking.get('passengers')}

Total Price: ${booking.get('totalPrice', 0):.2f} NZD
Payment Status: {booking.get('payment_status', 'pending')}

Flight Info:
Departure: {booking.get('departureFlightNumber', 'N/A')} at {booking.get('departureTime', 'N/A')}
Arrival: {booking.get('arrivalFlightNumber', 'N/A')} at {booking.get('arrivalTime', 'N/A')}

Notes: {booking.get('notes', 'None')}
            """.strip(),
            'start': {
                'dateTime': booking_datetime,
                'timeZone': 'Pacific/Auckland',
            },
            'end': {
                'dateTime': booking_datetime,  # Can adjust duration if needed
                'timeZone': 'Pacific/Auckland',
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                    {'method': 'popup', 'minutes': 60},  # 1 hour before
                ],
            },
        }
        
        created_event = service.events().insert(calendarId='primary', body=event).execute()
        
        # Store event ID in booking
        await db.bookings.update_one(
            {"id": booking.get('id')},
            {"$set": {"calendar_event_id": created_event.get('id')}}
        )
        
        logger.info(f"Calendar event created for booking {booking.get('id')}: {created_event.get('htmlLink')}")
        return True
        
    except Exception as e:
        logger.error(f"Error creating calendar event: {str(e)}")
        return False


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


@api_router.get("/payment/status/{session_id}", response_model=CheckoutStatusResponse)
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
            return CheckoutStatusResponse(
                status=existing_transaction['status'],
                payment_status=existing_transaction['payment_status'],
                amount_total=int(existing_transaction['amount'] * 100),
                currency=existing_transaction['currency'],
                metadata={"booking_id": existing_transaction['booking_id']}
            )
        
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
                    # Send email confirmation
                    send_booking_confirmation_email(booking)
                    
                    # Send SMS confirmation
                    send_booking_confirmation_sms(booking)
                    
                    # Create Google Calendar event
                    await create_calendar_event(booking)
        
        return checkout_status
    
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

# Manual Booking Creation
class ManualBooking(BaseModel):
    name: str
    email: str
    phone: str
    serviceType: str
    pickupAddress: str
    dropoffAddress: str
    date: str
    time: str
    passengers: str
    pricing: dict
    notes: Optional[str] = ""

@api_router.post("/bookings/manual")
async def create_manual_booking(booking: ManualBooking):
    """Create a booking manually"""
    try:
        new_booking = {
            "id": str(uuid.uuid4()),
            "name": booking.name,
            "email": booking.email,
            "phone": booking.phone,
            "serviceType": booking.serviceType,
            "pickupAddress": booking.pickupAddress,
            "dropoffAddress": booking.dropoffAddress,
            "date": booking.date,
            "time": booking.time,
            "passengers": booking.passengers,
            "pricing": booking.pricing,
            "notes": booking.notes,
            "status": "confirmed",
            "payment_status": "manual",
            "createdAt": datetime.now(timezone.utc)
        }
        
        await db.bookings.insert_one(new_booking)
        logger.info(f"Manual booking created: {new_booking['id']}")
        return {"message": "Booking created successfully", "id": new_booking['id']}
    except Exception as e:
        logger.error(f"Error creating manual booking: {str(e)}")
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
        # Update booking with driver assignment
        result = await db.bookings.update_one(
            {"id": booking_id},
            {"$set": {"driver_id": driver_id, "driver_assigned_at": datetime.now(timezone.utc)}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        logger.info(f"Driver {driver_id} assigned to booking {booking_id}")
        return {"message": "Driver assigned successfully"}
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
async def set_driver_password(data: SetDriverPassword):
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

@api_router.delete("/bookings/bulk-delete")
async def bulk_delete(booking_ids: List[str]):
    """Delete multiple bookings"""
    try:
        result = await db.bookings.delete_many({"id": {"$in": booking_ids}})
        return {"message": "Bookings deleted", "count": result.deleted_count}
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
        all_areas_data = auckland_suburbs + hamilton_areas + whangarei_areas
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
            "message": f"Initialized SEO for {count} pages (27 Auckland + 8 Hamilton + 9 Whangarei + 20 Hotels = 64 locations)",
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
    """Generate XML sitemap for all pages"""
    from xml.etree.ElementTree import Element, SubElement, tostring
    
    base_url = "https://bookaride.co.nz"
    
    # Define all pages with priority and change frequency
    pages = [
        # Main pages
        {"path": "/", "priority": "1.0", "changefreq": "daily"},
        {"path": "/book-now", "priority": "1.0", "changefreq": "daily"},
        {"path": "/services", "priority": "0.9", "changefreq": "weekly"},
        {"path": "/about", "priority": "0.8", "changefreq": "monthly"},
        {"path": "/contact", "priority": "0.9", "changefreq": "monthly"},
        {"path": "/hobbiton-transfers", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/cruise-transfers", "priority": "0.8", "changefreq": "weekly"},
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
    ]
    
    # Create XML structure
    urlset = Element('urlset', xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    
    for page in pages:
        url = SubElement(urlset, 'url')
        SubElement(url, 'loc').text = base_url + page['path']
        SubElement(url, 'lastmod').text = datetime.now(timezone.utc).strftime('%Y-%m-%d')
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

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
