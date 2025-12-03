from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from twilio.rest import Client
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from passlib.context import CryptContext
from jose import JWTError, jwt


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Authentication configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production-' + str(uuid.uuid4()))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

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

class PricingBreakdown(BaseModel):
    distance: float
    basePrice: float
    airportFee: float
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


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

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
        
        # Calculate pricing
        base_price = distance_km * 2.50  # $2.50 per km
        
        # VIP Airport Pickup fee: Optional $15 extra service
        airport_fee = 15.0 if request.vipAirportPickup else 0.0
        
        # Passenger fee: 1st passenger included, $5 per additional
        extra_passengers = max(0, request.passengers - 1)
        passenger_fee = extra_passengers * 5.0
        
        # Total price
        total_price = base_price + airport_fee + passenger_fee
        
        return PricingBreakdown(
            distance=distance_km,
            basePrice=round(base_price, 2),
            airportFee=round(airport_fee, 2),
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
async def send_booking_email(email_data: dict):
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

def send_booking_confirmation_email(booking: dict):
    """Send booking confirmation email via SendGrid"""
    try:
        sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
        sender_email = os.environ.get('SENDER_EMAIL')
        
        if not sendgrid_api_key or not sender_email:
            logger.warning("SendGrid credentials not configured")
            return False
        
        # Create email content
        subject = f"Booking Confirmation - {booking.get('id', '')[:8]}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #1a1a1a; color: #D4AF37; padding: 20px; text-align: center;">
                    <h1>Book A Ride NZ</h1>
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
                    <p>If you have any questions, please contact us.</p>
                    
                    <p style="margin-top: 30px;">Thank you for choosing Book A Ride NZ!</p>
                </div>
                <div style="background-color: #1a1a1a; color: #D4AF37; padding: 15px; text-align: center; font-size: 12px;">
                    <p>Book A Ride NZ | bookaride.co.nz</p>
                </div>
            </body>
        </html>
        """
        
        message = Mail(
            from_email=sender_email,
            to_emails=booking.get('email'),
            subject=subject,
            html_content=html_content
        )
        
        sg = SendGridAPIClient(sendgrid_api_key)
        response = sg.send(message)
        
        logger.info(f"Confirmation email sent to {booking.get('email')} - Status: {response.status_code}")
        return response.status_code == 202
        
    except Exception as e:
        logger.error(f"Error sending confirmation email: {str(e)}")
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
        
        return {"status": "success", "event_type": webhook_response.event_type}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing webhook: {str(e)}")


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
